const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find the user in the database
      req.user = await User.findById(decoded.id).select('-password');
      
      // --- THE CRITICAL IMPROVEMENT IS HERE ---
      if (!req.user) {
        // If user is not found (e.g., deleted after token was issued), deny access
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      // --- END OF IMPROVEMENT ---

      next(); // Proceed only if the user was found
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const identifyUser = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // If token is invalid or user not found, just set req.user to null
            req.user = null;
        }
    }
    next();
};

// --- UPDATE MODULE.EXPORTS ---
module.exports = { protect, identifyUser };