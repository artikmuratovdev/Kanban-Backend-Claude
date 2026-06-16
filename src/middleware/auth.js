const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const apiKey = req.header('x-api-key');

    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'Authentication required. Missing x-api-key header.' });
    }

    // Check if it's the admin API key from .env
    if (process.env.ADMIN_API_KEY && apiKey === process.env.ADMIN_API_KEY) {
      req.user = { role: 'admin' };
      return next();
    }

    // Otherwise, check if it's a valid user API key
    const user = await User.findOne({ apiKey });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid API key.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};

module.exports = auth;
