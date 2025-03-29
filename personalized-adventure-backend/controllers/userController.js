const mongoose = require('mongoose');
const User = require('../models/User');
const { hashPassword } = require('../middleware/auth');

/**
 * Create a new user
 * @route POST /api/users
 * @access Public
 */
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, preferences } = req.body;
    
    // Validation is now handled by express-validator middleware
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Create new user with hashed password
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      preferences: preferences || {}
    });
    
    // Save to database
    const savedUser = await newUser.save();
    
    // Remove password from response
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    // Don't expose detailed error messages in production
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
};

/**
 * Get all users
 * @route GET /api/users
 * @access Private (would typically be admin-only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Query the database for all users
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error retrieving users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
};

/**
 * Get a specific user by ID
 * @route GET /api/users/:id
 * @access Private
 */
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Find the user by ID
    const user = await User.findById(id).select('-password');
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user'
    });
  }
};

/**
 * Update a user
 * @route PUT /api/users/:id
 * @access Private
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, preferences } = req.body;
    
    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Create update object with only allowed fields
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (preferences) updateData.preferences = preferences;
    
    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    // Check if user exists
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

/**
 * Delete a user
 * @route DELETE /api/users/:id
 * @access Private
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(id);
    
    // Check if user exists
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};