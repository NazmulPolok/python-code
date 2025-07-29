const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Encrypted message content
  encryptedContent: {
    type: String,
    required: true
  },
  // Nonce for encryption
  nonce: {
    type: String,
    required: true
  },
  // Message type
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file'],
    default: 'text'
  },
  // For media messages
  mediaUrl: String,
  mediaSize: Number,
  mediaMimeType: String,
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  
  // Read receipt timestamp
  readAt: Date,
  deliveredAt: Date,
  
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Message reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  
  // Edit history
  editHistory: [{
    encryptedContent: String,
    nonce: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, status: 1 });

// Method to mark as read
messageSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Method to mark as delivered
messageSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

// Method to soft delete
messageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);