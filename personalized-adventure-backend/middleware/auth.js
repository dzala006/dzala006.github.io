const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * Hashes a password using bcrypt
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} - The hashed password
 */
const hashPassword = async (password) => {
  try {
    // Generate a salt with 10 rounds (recommended)
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the generated salt
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Password hashing failed');
  }
};

/**
 * Compares a plain text password with a hashed password
 * @param {string} password - The plain text password to compare
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 */
const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw new Error('Password comparison failed');
  }
};

/**
 * Generates a JWT token for a user
 * @param {Object} user - The user object to generate a token for
 * @returns {string} - The generated JWT token
 */
const generateToken = (user) => {
  try {
    // Get JWT secret from environment variables
    const jwtSecret = process.env.JWT_SECRET || 'your-default-jwt-secret';
    
    // Create payload with user ID and role (if applicable)
    const payload = {
      user: {
        id: user.id
      }
    };
    
    // Sign the token with a 1 day expiration
    return jwt.sign(payload, jwtSecret, { expiresIn: '1d' });
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Token generation failed');
  }
};

/**
 * Middleware to authenticate requests using JWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateToken = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }
    
    // Get JWT secret from environment variables
    const jwtSecret = process.env.JWT_SECRET || 'your-default-jwt-secret';
    
    // Verify token
    jwt.verify(token, jwtSecret, (error, decoded) => {
      if (error) {
        // Token is invalid or expired
        return res.status(401).json({
          success: false,
          message: 'Token is invalid or expired'
        });
      }
      
      // Add user from payload to request object
      req.user = decoded.user;
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

/**
 * Middleware to check if the authenticated user is the same as the requested user
 * or has admin privileges (for user-specific operations)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authorizeUser = async (req, res, next) => {
  try {
    // Get the user ID from the request parameters
    const { id } = req.params;
    
    // Check if the authenticated user is the same as the requested user
    if (req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform this action'
      });
    }
    
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authorization'
    });
  }
};

/**
 * Login function to authenticate a user and generate a token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Compare passwords
    const isMatch = await comparePassword(password, user.password);
    
    // Check if passwords match
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Return token and user data (excluding password)
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  authenticateToken,
  authorizeUser,
  login
};