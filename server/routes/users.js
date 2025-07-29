const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/users/friend-request/:userId
// @desc    Send friend request
// @access  Private
router.post('/friend-request/:userId', authenticate, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id.toString();

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already friends
    if (targetUser.friends.includes(currentUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Already friends with this user'
      });
    }

    // Check if request already exists
    const existingRequest = targetUser.friendRequests.find(
      req => req.from.toString() === currentUserId && req.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent'
      });
    }

    // Add friend request
    targetUser.friendRequests.push({
      from: currentUserId,
      status: 'pending'
    });

    await targetUser.save();

    // Create notification
    await Notification.createNotification({
      recipient: targetUserId,
      sender: currentUserId,
      type: 'friend_request',
      title: 'Friend Request',
      message: `${req.user.name} sent you a friend request`,
      actions: [
        { label: 'Accept', action: 'accept' },
        { label: 'Decline', action: 'decline' }
      ]
    });

    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });

  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/users/friend-request/:requestId/:action
// @desc    Accept or decline friend request
// @access  Private
router.put('/friend-request/:requestId/:action', authenticate, async (req, res) => {
  try {
    const { requestId, action } = req.params;
    const currentUserId = req.user._id.toString();

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use accept or decline'
      });
    }

    const user = await User.findById(currentUserId);
    const friendRequest = user.friendRequests.id(requestId);

    if (!friendRequest || friendRequest.status !== 'pending') {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    friendRequest.status = action === 'accept' ? 'accepted' : 'declined';

    if (action === 'accept') {
      // Add to friends list
      user.friends.push(friendRequest.from);
      
      // Add current user to sender's friends list
      await User.findByIdAndUpdate(friendRequest.from, {
        $push: { friends: currentUserId }
      });

      // Create notification for sender
      await Notification.createNotification({
        recipient: friendRequest.from,
        sender: currentUserId,
        type: 'friend_request_accepted',
        title: 'Friend Request Accepted',
        message: `${req.user.name} accepted your friend request`
      });
    }

    await user.save();

    res.json({
      success: true,
      message: `Friend request ${action}ed successfully`
    });

  } catch (error) {
    console.error('Handle friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/users/follow/:userId
// @desc    Follow/unfollow a user
// @access  Private
router.post('/follow/:userId', authenticate, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id.toString();

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== currentUserId
      );
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);

      // Create notification
      await Notification.createNotification({
        recipient: targetUserId,
        sender: currentUserId,
        type: 'follow',
        title: 'New Follower',
        message: `${req.user.name} started following you`
      });
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      success: true,
      message: isFollowing ? 'Unfollowed successfully' : 'Following successfully',
      data: { following: !isFollowing }
    });

  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users
// @access  Private
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        { isActive: true },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('name email avatar bio')
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/:userId
// @desc    Get user profile
// @access  Private
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -privateKey')
      .populate('friends', 'name avatar')
      .populate('followers', 'name avatar')
      .populate('following', 'name avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;