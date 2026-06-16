const User = require('../models/User');

// POST /api/users
// Body: { name }
// Only admin can create users
const createUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Only admin can create users.' });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'User name is required' });
    }

    const user = await User.create({ name });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/users
// Only admin can get all users
const getUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Only admin can view users.' });
    }

    const users = await User.find().sort({ createdAt: -1 });

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createUser,
  getUsers,
};
