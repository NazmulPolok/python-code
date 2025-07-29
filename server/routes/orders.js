const express = require('express');
const Order = require('../models/Order');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      customer: req.user._id
    };

    const order = new Order(orderData);
    order.calculateTotal();
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('restaurant', 'name logo')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { orders }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;