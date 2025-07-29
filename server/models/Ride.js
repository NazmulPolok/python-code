const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
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
  },
  landmark: String
}, { _id: false });

const rideSchema = new mongoose.Schema({
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Trip details
  pickupLocation: {
    type: locationSchema,
    required: true
  },
  dropoffLocation: {
    type: locationSchema,
    required: true
  },
  
  // Trip status
  status: {
    type: String,
    enum: [
      'requested',
      'driver_assigned',
      'driver_arrived',
      'in_progress',
      'completed',
      'cancelled'
    ],
    default: 'requested'
  },
  
  // Timestamps
  requestedAt: {
    type: Date,
    default: Date.now
  },
  driverAssignedAt: Date,
  driverArrivedAt: Date,
  tripStartedAt: Date,
  tripCompletedAt: Date,
  cancelledAt: Date,
  
  // Trip details
  distance: {
    type: Number, // in kilometers
    default: 0
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  estimatedDistance: Number,
  estimatedDuration: Number,
  estimatedFare: Number,
  
  // Pricing
  baseFare: {
    type: Number,
    default: 0
  },
  distanceFare: {
    type: Number,
    default: 0
  },
  timeFare: {
    type: Number,
    default: 0
  },
  surgePricing: {
    type: Number,
    default: 1.0
  },
  totalFare: {
    type: Number,
    default: 0
  },
  
  // Payment
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'digital_wallet'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentId: String,
  
  // Vehicle type
  vehicleType: {
    type: String,
    enum: ['car', 'bike', 'bicycle', 'scooter'],
    default: 'car'
  },
  
  // Real-time tracking
  currentLocation: {
    type: locationSchema
  },
  route: [{
    coordinates: [Number],
    timestamp: {
      type: Date,
      default: Date.now
    },
    speed: Number, // km/h
    heading: Number // degrees
  }],
  
  // Trip preferences
  preferences: {
    airConditioning: {
      type: Boolean,
      default: false
    },
    music: {
      type: Boolean,
      default: false
    },
    petFriendly: {
      type: Boolean,
      default: false
    },
    accessibleVehicle: {
      type: Boolean,
      default: false
    }
  },
  
  // Special instructions
  specialInstructions: String,
  
  // Rating and feedback
  passengerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  driverRating: {
    type: Number,
    min: 1,
    max: 5
  },
  passengerFeedback: String,
  driverFeedback: String,
  
  // Cancellation
  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['passenger', 'driver', 'system']
  },
  cancellationFee: {
    type: Number,
    default: 0
  },
  
  // Driver matching
  rejectedDrivers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Emergency
  emergencyContact: {
    name: String,
    phone: String
  },
  sosTriggered: {
    type: Boolean,
    default: false
  },
  sosTimestamp: Date,
  
  // Trip verification
  otp: String,
  otpVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
rideSchema.index({ passenger: 1, createdAt: -1 });
rideSchema.index({ driver: 1, createdAt: -1 });
rideSchema.index({ status: 1, createdAt: -1 });
rideSchema.index({ 'pickupLocation.coordinates': '2dsphere' });
rideSchema.index({ 'dropoffLocation.coordinates': '2dsphere' });
rideSchema.index({ 'currentLocation.coordinates': '2dsphere' });

// Virtual for ride number
rideSchema.virtual('rideNumber').get(function() {
  return `RIDE-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Method to update status with timestamp
rideSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  const statusTimestampMap = {
    'driver_assigned': 'driverAssignedAt',
    'driver_arrived': 'driverArrivedAt',
    'in_progress': 'tripStartedAt',
    'completed': 'tripCompletedAt',
    'cancelled': 'cancelledAt'
  };
  
  if (statusTimestampMap[newStatus]) {
    this[statusTimestampMap[newStatus]] = new Date();
  }
  
  return this.save();
};

// Method to calculate fare
rideSchema.methods.calculateFare = function(baseFareRate = 2.5, perKmRate = 1.2, perMinuteRate = 0.3) {
  this.baseFare = baseFareRate;
  this.distanceFare = this.distance * perKmRate;
  this.timeFare = this.duration * perMinuteRate;
  
  const subtotal = this.baseFare + this.distanceFare + this.timeFare;
  this.totalFare = subtotal * this.surgePricing;
  
  return this.totalFare;
};

// Method to generate OTP
rideSchema.methods.generateOTP = function() {
  this.otp = Math.floor(1000 + Math.random() * 9000).toString();
  return this.save();
};

// Method to verify OTP
rideSchema.methods.verifyOTP = function(inputOTP) {
  if (this.otp === inputOTP) {
    this.otpVerified = true;
    return this.save();
  }
  return false;
};

// Method to add route point
rideSchema.methods.addRoutePoint = function(coordinates, speed = 0, heading = 0) {
  this.route.push({
    coordinates,
    timestamp: new Date(),
    speed,
    heading
  });
  
  // Update current location
  this.currentLocation = {
    type: 'Point',
    coordinates,
    address: 'Current location' // This would be geocoded in real implementation
  };
  
  return this.save();
};

// Ensure virtuals are included in JSON
rideSchema.set('toJSON', { virtuals: true });
rideSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Ride', rideSchema);