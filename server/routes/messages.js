const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { encryptMessage } = require('../utils/encryption');

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get latest message for each conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
          isDeleted: false
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$receiver', userId] },
                    { $eq: ['$status', 'delivered'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: {
            _id: '$user._id',
            name: '$user.name',
            avatar: '$user.avatar',
            lastSeen: '$user.lastSeen'
          },
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json({
      success: true,
      data: { conversations }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/messages/:userId
// @desc    Get messages with a specific user
// @access  Private
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ],
      isDeleted: false
    })
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Mark messages as read
    await Message.updateMany(
      {
        sender: otherUserId,
        receiver: currentUserId,
        status: 'delivered'
      },
      {
        status: 'read',
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      data: { messages: messages.reverse(), page, limit }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/messages
// @desc    Send a message (via HTTP, real-time via Socket.IO)
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    const { receiverId, content, type = 'text', mediaUrl, replyTo } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and content are required'
      });
    }

    // Get receiver's public key
    const receiver = await User.findById(receiverId).select('publicKey');
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Get sender's private key
    const sender = await User.findById(req.user._id).select('privateKey');
    
    // Encrypt the message
    const { encryptedContent, nonce } = encryptMessage(
      content,
      receiver.publicKey,
      sender.privateKey
    );

    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      encryptedContent,
      nonce,
      type,
      mediaUrl,
      replyTo
    });

    await message.save();
    await message.populate('sender', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put('/:messageId/read', authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await message.markAsRead();

    res.json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete a message
// @access  Private
router.delete('/:messageId', authenticate, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await message.softDelete();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;