const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  customizations: [{
    name: String,
    selectedOption: String,
    additionalPrice: {
      type: Number,
      default: 0
    }
  }],
  specialInstructions: String,
  subtotal: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  items: [orderItemSchema],
  
  // Pricing
  subtotal: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  
  // Delivery information
  deliveryAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'US'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    instructions: String
  },
  
  // Contact information
  customerPhone: {
    type: String,
    required: true
  },
  customerEmail: String,
  
  // Order status
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded'
    ],
    default: 'pending'
  },
  
  // Timestamps for different statuses
  confirmedAt: Date,
  preparingAt: Date,
  readyAt: Date,
  outForDeliveryAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  
  // Estimated times
  estimatedPreparationTime: {
    type: Number, // in minutes
    default: 30
  },
  estimatedDeliveryTime: {
    type: Number, // in minutes
    default: 45
  },
  
  // Payment information
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'digital_wallet', 'bank_transfer'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: String, // Stripe payment intent ID or similar
  
  // Delivery driver
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Special instructions
  specialInstructions: String,
  
  // Rating and review
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: String,
  reviewedAt: Date,
  
  // Cancellation
  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['customer', 'restaurant', 'system']
  },
  
  // Refund information
  refundAmount: Number,
  refundReason: String,
  refundedAt: Date,
  
  // Order tracking
  trackingUpdates: [{
    status: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: {
      type: [Number]
    }
  }]
}, {
  timestamps: true
});

// Index for efficient querying
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ driver: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Virtual for order number
orderSchema.virtual('orderNumber').get(function() {
  return `ORD-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Method to update status with timestamp
orderSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  const statusTimestampMap = {
    'confirmed': 'confirmedAt',
    'preparing': 'preparingAt',
    'ready': 'readyAt',
    'out_for_delivery': 'outForDeliveryAt',
    'delivered': 'deliveredAt',
    'cancelled': 'cancelledAt'
  };
  
  if (statusTimestampMap[newStatus]) {
    this[statusTimestampMap[newStatus]] = new Date();
  }
  
  // Add tracking update
  this.trackingUpdates.push({
    status: newStatus,
    message: `Order ${newStatus.replace('_', ' ')}`,
    timestamp: new Date()
  });
  
  return this.save();
};

// Method to calculate total
orderSchema.methods.calculateTotal = function() {
  const subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal + this.deliveryFee + this.tax - this.discount;
  
  this.subtotal = subtotal;
  this.total = Math.max(0, total);
  
  return this.total;
};

// Ensure virtuals are included in JSON
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);