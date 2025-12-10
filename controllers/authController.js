const jwt = require('jsonwebtoken');
const { JWT } = require('../config/constants');
const User = require('../models/User');
const { generateToken, getMenuItems } = require('../utils/helpers');
const { handleError } = require('../middleware/errorHandler');
const messages = require('../utils/messages');

const register = async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword, role = 'student' } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: messages.en.passwordsNotMatch });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: messages.en.userExists });
    }

    const userData = {
      fullName,
      email,
      phone,
      password,
      role
    };

    // Only add type field for students
    if (role === 'student') {
      userData.type = 'fresh';
    }

    const user = new User(userData);
    await user.save();

    const token = generateToken(user._id);
    const menuItems = getMenuItems(user);

    res.status(201).json({
      message: messages.en.registerSuccess,
      token,
      user: user.toJSON(), // This will automatically remove type for admin
      menuItems
    });
  } catch (error) {
    handleError(res, error, messages.en.serverError);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: messages.en.invalidCredentials });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: messages.en.invalidCredentials });
    }

    const token = generateToken(user._id);
    const menuItems = getMenuItems(user);

    res.json({
      message: messages.en.loginSuccess,
      token,
      user: user.toJSON(), // This will automatically remove type for admin
      menuItems
    });
  } catch (error) {
    handleError(res, error, messages.en.serverError);
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const menuItems = getMenuItems(req.user);
    res.json({
      user: req.user.toJSON(), // This will automatically remove type for admin
      menuItems
    });
  } catch (error) {
    handleError(res, error, messages.en.serverError);
  }
};

module.exports = { register, login, getCurrentUser };