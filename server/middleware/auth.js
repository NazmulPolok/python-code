const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid.' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token has expired.' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Token is not valid.' 
    });
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Please authenticate first.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
};

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without user context if token is invalid
    next();
  }
};

// Check if user owns the resource
const checkOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ 
          success: false, 
          message: 'Resource not found.' 
        });
      }

      // Check if user owns the resource
      const userId = req.user._id.toString();
      const resourceUserId = resource.user ? resource.user.toString() : 
                            resource.owner ? resource.owner.toString() : 
                            resource.customer ? resource.customer.toString() : null;

      if (resourceUserId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. You can only access your own resources.' 
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking resource ownership.',
        error: error.message 
      });
    }
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Verify refresh token (for token refresh functionality)
const verifyRefreshToken = (refreshToken) => {
  try {
    return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  checkOwnership,
  generateToken,
  verifyRefreshToken
};