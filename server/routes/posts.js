const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', authenticate, [
  body('content').optional().isLength({ max: 2000 }).withMessage('Content cannot exceed 2000 characters'),
  body('media').optional().isArray(),
  body('privacy').optional().isIn(['public', 'friends', 'private'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, media, tags, privacy = 'public', location } = req.body;

    if (!content && (!media || media.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Post must have either content or media'
      });
    }

    const post = new Post({
      user: req.user._id,
      content,
      media: media || [],
      tags: tags || [],
      privacy,
      location
    });

    await post.save();
    await post.populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post }
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/posts/feed
// @desc    Get user's feed (posts from friends and public posts)
// @access  Private
router.get('/feed', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id);
    const friendIds = user.friends.concat(user.following);

    const posts = await Post.find({
      $or: [
        { user: { $in: friendIds }, privacy: { $in: ['public', 'friends'] } },
        { privacy: 'public' },
        { user: req.user._id }
      ],
      isActive: true
    })
    .populate('user', 'name avatar')
    .populate('comments.user', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    res.json({
      success: true,
      data: { posts, page, limit }
    });

  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/posts/:id
// @desc    Get a single post
// @access  Public (with optional auth)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .populate('comments.replies.user', 'name avatar');

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check privacy
    if (post.privacy === 'private' && (!req.user || post.user._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (post.privacy === 'friends' && req.user) {
      const user = await User.findById(req.user._id);
      const friendIds = user.friends.concat(user.following).map(id => id.toString());
      
      if (!friendIds.includes(post.user._id.toString()) && post.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: { post }
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/posts/:id/like
// @desc    Like/unlike a post
// @access  Private
router.put('/:id/like', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const userId = req.user._id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Like
      post.likes.push(userId);
      
      // Create notification if not own post
      if (post.user.toString() !== userId.toString()) {
        await Notification.createNotification({
          recipient: post.user,
          sender: userId,
          type: 'like',
          title: 'New Like',
          message: `${req.user.name} liked your post`,
          data: { postId: post._id }
        });
      }
    }

    await post.save();

    res.json({
      success: true,
      message: isLiked ? 'Post unliked' : 'Post liked',
      data: { 
        liked: !isLiked,
        likeCount: post.likes.length
      }
    });

  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/posts/:id/comment
// @desc    Add a comment to a post
// @access  Private
router.post('/:id/comment', authenticate, [
  body('content').notEmpty().isLength({ max: 500 }).withMessage('Comment must be between 1 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = {
      user: req.user._id,
      content: req.body.content
    };

    post.comments.push(comment);
    await post.save();
    
    await post.populate('comments.user', 'name avatar');
    const newComment = post.comments[post.comments.length - 1];

    // Create notification if not own post
    if (post.user.toString() !== req.user._id.toString()) {
      await Notification.createNotification({
        recipient: post.user,
        sender: req.user._id,
        type: 'comment',
        title: 'New Comment',
        message: `${req.user.name} commented on your post`,
        data: { postId: post._id }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment: newComment }
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/posts/:id/share
// @desc    Share a post
// @access  Private
router.put('/:id/share', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const userId = req.user._id;
    const alreadyShared = post.shares.some(share => share.user.toString() === userId.toString());

    if (alreadyShared) {
      return res.status(400).json({
        success: false,
        message: 'Post already shared'
      });
    }

    post.shares.push({ user: userId });
    await post.save();

    // Create notification if not own post
    if (post.user.toString() !== userId.toString()) {
      await Notification.createNotification({
        recipient: post.user,
        sender: userId,
        type: 'share',
        title: 'Post Shared',
        message: `${req.user.name} shared your post`,
        data: { postId: post._id }
      });
    }

    res.json({
      success: true,
      message: 'Post shared successfully',
      data: { shareCount: post.shares.length }
    });

  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/posts/user/:userId
// @desc    Get posts by a specific user
// @access  Public (with optional auth)
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Determine privacy filter
    let privacyFilter = ['public'];
    
    if (req.user) {
      if (req.user._id.toString() === req.params.userId) {
        // Own posts - can see all
        privacyFilter = ['public', 'friends', 'private'];
      } else {
        // Check if friends
        const user = await User.findById(req.user._id);
        const friendIds = user.friends.concat(user.following).map(id => id.toString());
        
        if (friendIds.includes(req.params.userId)) {
          privacyFilter = ['public', 'friends'];
        }
      }
    }

    const posts = await Post.find({
      user: req.params.userId,
      privacy: { $in: privacyFilter },
      isActive: true
    })
    .populate('user', 'name avatar')
    .populate('comments.user', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    res.json({
      success: true,
      data: { posts, page, limit }
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check ownership
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    post.isActive = false;
    await post.save();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;