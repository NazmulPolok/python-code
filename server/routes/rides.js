const express = require('express');
const Ride = require('../models/Ride');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/rides
// @desc    Request a ride
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    const rideData = {
      ...req.body,
      passenger: req.user._id
    };

    const ride = new Ride(rideData);
    await ride.save();

    res.status(201).json({
      success: true,
      message: 'Ride requested successfully',
      data: { ride }
    });

  } catch (error) {
    console.error('Request ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/rides
// @desc    Get user's rides
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const rides = await Ride.find({
      $or: [
        { passenger: req.user._id },
        { driver: req.user._id }
      ]
    })
    .populate('passenger', 'name avatar phone')
    .populate('driver', 'name avatar phone vehicle')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { rides }
    });

  } catch (error) {
    console.error('Get rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;