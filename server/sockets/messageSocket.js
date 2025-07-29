const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { encryptMessage } = require('../utils/encryption');

// Store active socket connections
const activeUsers = new Map();

const messageSocket = (io, socket) => {
  // User joins their personal room
  socket.on('join', async (userId) => {
    try {
      socket.join(userId);
      activeUsers.set(userId, socket.id);
      
      // Update user's last seen
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      
      // Notify friends that user is online
      const user = await User.findById(userId).populate('friends');
      user.friends.forEach(friend => {
        socket.to(friend._id.toString()).emit('userOnline', {
          userId: userId,
          timestamp: new Date()
        });
      });
      
      console.log(`User ${userId} joined messaging`);
    } catch (error) {
      console.error('Error joining message room:', error);
    }
  });

  // Send encrypted message
  socket.on('sendMessage', async (data) => {
    try {
      const { receiverId, encryptedContent, nonce, type = 'text', mediaUrl, replyTo } = data;
      
      // Verify sender is authenticated
      if (!socket.userId) {
        socket.emit('messageError', { error: 'Not authenticated' });
        return;
      }

      // Create message
      const message = new Message({
        sender: socket.userId,
        receiver: receiverId,
        encryptedContent,
        nonce,
        type,
        mediaUrl,
        replyTo
      });

      await message.save();
      
      // Populate sender info for real-time delivery
      await message.populate('sender', 'name avatar');
      
      // Send to receiver if online
      const receiverSocketId = activeUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverId).emit('newMessage', {
          messageId: message._id,
          sender: message.sender,
          encryptedContent: message.encryptedContent,
          nonce: message.nonce,
          type: message.type,
          mediaUrl: message.mediaUrl,
          replyTo: message.replyTo,
          timestamp: message.createdAt,
          status: 'delivered'
        });
        
        // Update message status to delivered
        message.status = 'delivered';
        message.deliveredAt = new Date();
        await message.save();
      }
      
      // Send confirmation to sender
      socket.emit('messageSent', {
        messageId: message._id,
        tempId: data.tempId, // Client-side temporary ID
        timestamp: message.createdAt,
        status: receiverSocketId ? 'delivered' : 'sent'
      });
      
      // Create notification for receiver
      await Notification.createNotification({
        recipient: receiverId,
        sender: socket.userId,
        type: 'new_message',
        title: 'New Message',
        message: `You have a new message`,
        data: {
          messageId: message._id
        }
      });
      
      // Send notification to receiver if online
      if (receiverSocketId) {
        io.to(receiverId).emit('notification', {
          type: 'new_message',
          title: 'New Message',
          message: `New message from ${message.sender.name}`,
          data: {
            messageId: message._id,
            senderId: socket.userId
          }
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('messageError', { 
        error: 'Failed to send message',
        details: error.message 
      });
    }
  });

  // Mark message as read
  socket.on('markAsRead', async (data) => {
    try {
      const { messageId } = data;
      
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('messageError', { error: 'Message not found' });
        return;
      }
      
      // Only receiver can mark as read
      if (message.receiver.toString() !== socket.userId) {
        socket.emit('messageError', { error: 'Unauthorized' });
        return;
      }
      
      // Update message status
      await message.markAsRead();
      
      // Notify sender that message was read
      const senderSocketId = activeUsers.get(message.sender.toString());
      if (senderSocketId) {
        io.to(message.sender.toString()).emit('messageRead', {
          messageId: messageId,
          readAt: message.readAt,
          readBy: socket.userId
        });
      }
      
    } catch (error) {
      console.error('Error marking message as read:', error);
      socket.emit('messageError', { 
        error: 'Failed to mark message as read',
        details: error.message 
      });
    }
  });

  // User is typing
  socket.on('typing', (data) => {
    const { receiverId, isTyping } = data;
    const receiverSocketId = activeUsers.get(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverId).emit('userTyping', {
        senderId: socket.userId,
        isTyping: isTyping
      });
    }
  });

  // Get online status
  socket.on('getOnlineStatus', (userIds) => {
    const onlineStatus = {};
    userIds.forEach(userId => {
      onlineStatus[userId] = activeUsers.has(userId);
    });
    
    socket.emit('onlineStatus', onlineStatus);
  });

  // Message reactions
  socket.on('addReaction', async (data) => {
    try {
      const { messageId, emoji } = data;
      
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('messageError', { error: 'Message not found' });
        return;
      }
      
      // Check if user is part of the conversation
      const userId = socket.userId;
      if (message.sender.toString() !== userId && message.receiver.toString() !== userId) {
        socket.emit('messageError', { error: 'Unauthorized' });
        return;
      }
      
      // Remove existing reaction from this user
      message.reactions = message.reactions.filter(
        reaction => reaction.user.toString() !== userId
      );
      
      // Add new reaction
      message.reactions.push({
        user: userId,
        emoji: emoji
      });
      
      await message.save();
      
      // Notify both users
      const otherUserId = message.sender.toString() === userId ? 
                         message.receiver.toString() : message.sender.toString();
      
      const reactionData = {
        messageId: messageId,
        userId: userId,
        emoji: emoji,
        timestamp: new Date()
      };
      
      socket.emit('reactionAdded', reactionData);
      
      const otherUserSocketId = activeUsers.get(otherUserId);
      if (otherUserSocketId) {
        io.to(otherUserId).emit('reactionAdded', reactionData);
      }
      
    } catch (error) {
      console.error('Error adding reaction:', error);
      socket.emit('messageError', { 
        error: 'Failed to add reaction',
        details: error.message 
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      if (socket.userId) {
        activeUsers.delete(socket.userId);
        
        // Update user's last seen
        await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() });
        
        // Notify friends that user is offline
        const user = await User.findById(socket.userId).populate('friends');
        if (user) {
          user.friends.forEach(friend => {
            socket.to(friend._id.toString()).emit('userOffline', {
              userId: socket.userId,
              lastSeen: new Date()
            });
          });
        }
        
        console.log(`User ${socket.userId} disconnected from messaging`);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive) {
        socket.userId = user._id.toString();
        socket.emit('authenticated', { userId: socket.userId });
      } else {
        socket.emit('authError', { error: 'Invalid token' });
      }
    } catch (error) {
      socket.emit('authError', { error: 'Authentication failed' });
    }
  });
};

module.exports = messageSocket;