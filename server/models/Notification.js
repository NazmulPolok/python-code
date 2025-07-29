const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      // Social media notifications
      'like',
      'comment',
      'share',
      'friend_request',
      'friend_request_accepted',
      'follow',
      'mention',
      
      // Message notifications
      'new_message',
      
      // Food ordering notifications
      'order_confirmed',
      'order_preparing',
      'order_ready',
      'order_out_for_delivery',
      'order_delivered',
      'order_cancelled',
      
      // Ride notifications
      'ride_driver_assigned',
      'ride_driver_arrived',
      'ride_started',
      'ride_completed',
      'ride_cancelled',
      
      // General notifications
      'system',
      'promotion',
      'reminder'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    // Additional data specific to notification type
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride'
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    // Generic data object for other types
    extra: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  // Action buttons for notifications
  actions: [{
    label: String,
    action: String, // 'accept', 'decline', 'view', 'dismiss', etc.
    url: String
  }],
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Delivery channels
  channels: [{
    type: String,
    enum: ['push', 'email', 'sms', 'in_app'],
    default: 'in_app'
  }],
  
  // Delivery status
  deliveryStatus: {
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    }
  },
  
  // Expiration
  expiresAt: Date,
  
  // Grouping for similar notifications
  group: String,
  
  // Rich content
  image: String,
  icon: String,
  sound: String,
  
  // Interaction tracking
  clicked: {
    type: Boolean,
    default: false
  },
  clickedAt: Date,
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark as clicked
notificationSchema.methods.markAsClicked = function() {
  this.clicked = true;
  this.clickedAt = new Date();
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // Here you would typically trigger real-time notification
  // via Socket.IO, push notifications, etc.
  
  return notification;
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

module.exports = mongoose.model('Notification', notificationSchema);