const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true
  },
  description: {
    type: String,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['appetizer', 'main', 'dessert', 'beverage', 'side', 'combo']
  },
  image: String,
  ingredients: [String],
  allergens: [String],
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  isGlutenFree: {
    type: Boolean,
    default: false
  },
  spiceLevel: {
    type: String,
    enum: ['mild', 'medium', 'hot', 'extra-hot'],
    default: 'mild'
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  customizations: [{
    name: String,
    options: [{
      name: String,
      price: {
        type: Number,
        default: 0
      }
    }]
  }]
}, {
  timestamps: true
});

const restaurantSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true
  },
  description: {
    type: String,
    maxLength: [1000, 'Description cannot exceed 1000 characters']
  },
  cuisine: [{
    type: String,
    required: true
  }],
  images: [String],
  logo: String,
  
  // Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  
  // Contact information
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  email: String,
  website: String,
  
  // Operating hours
  operatingHours: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    open: {
      type: String,
      required: true
    },
    close: {
      type: String,
      required: true
    },
    isClosed: {
      type: Boolean,
      default: false
    }
  }],
  
  // Menu
  menu: [menuItemSchema],
  
  // Ratings and reviews
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Business details
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  minimumOrder: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryRadius: {
    type: Number, // in kilometers
    default: 5
  },
  estimatedDeliveryTime: {
    type: Number, // in minutes
    default: 30
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  
  // Payment methods
  paymentMethods: [{
    type: String,
    enum: ['cash', 'card', 'digital_wallet', 'bank_transfer']
  }],
  
  // Tags
  tags: [String],
  
  // Statistics
  totalOrders: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for geospatial queries
restaurantSchema.index({ location: '2dsphere' });

// Index for text search
restaurantSchema.index({ name: 'text', description: 'text', cuisine: 'text' });

// Method to check if restaurant is currently open
restaurantSchema.methods.isCurrentlyOpen = function() {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toTimeString().slice(0, 5);
  
  const todayHours = this.operatingHours.find(hours => hours.day === currentDay);
  
  if (!todayHours || todayHours.isClosed) return false;
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

// Method to calculate average rating
restaurantSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) return 0;
  
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / this.reviews.length;
};

module.exports = mongoose.model('Restaurant', restaurantSchema);