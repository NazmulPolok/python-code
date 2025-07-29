const express = require('express');
const Restaurant = require('../models/Restaurant');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/restaurants
// @desc    Create a restaurant (vendor only)
// @access  Private
router.post('/', authenticate, authorize('vendor'), async (req, res) => {
  try {
    const restaurantData = {
      ...req.body,
      owner: req.user._id
    };

    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();

    // Update user's restaurant reference
    req.user.restaurant = restaurant._id;
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: { restaurant }
    });

  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/restaurants/nearby
// @desc    Get nearby restaurants
// @access  Public
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const restaurants = await Restaurant.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      },
      isActive: true
    }).populate('owner', 'name');

    res.json({
      success: true,
      data: { restaurants }
    });

  } catch (error) {
    console.error('Get nearby restaurants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/restaurants/:id
// @desc    Get restaurant details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('owner', 'name avatar phone');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.json({
      success: true,
      data: { restaurant }
    });

  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;