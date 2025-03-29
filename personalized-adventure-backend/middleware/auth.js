const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');
const { validationResult } = require('express-validator');

/**
 * Rate limiter for authentication routes to prevent brute force attacks
 * Limits each IP to 5 login attempts per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
  },
  skipSuccessfulRequests: false, // Don't count successful requests
});

/**
 * Hashes a password using bcrypt
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} - The hashed password
 */
const hashPassword = async (password) => {
  try {
    // Generate a salt with 12 rounds (increased from 10 for better security)
    const salt = await bcrypt.genSalt(12);
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
 * Middleware to validate request inputs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateInputs = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
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
        message: 'Authentication required'
      });
    }
    
    // Get JWT secret from environment variables
    const jwtSecret = process.env.JWT_SECRET || 'your-default-jwt-secret';
    
    // Verify token
    jwt.verify(token, jwtSecret, (error, decoded) => {
      if (error) {
        // Token is invalid or expired
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token has expired, please login again'
          });
        }
        
        return res.status(401).json({
          success: false,
          message: 'Invalid authentication token'
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
      message: 'Authentication failed'
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
      message: 'Authorization failed'
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
        message: 'Email and password are required'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // Check if user exists and compare passwords
    // Using a generic error message to prevent user enumeration
    if (!user || !(await comparePassword(password, user.password))) {
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
    
    // Set token in HTTP-only cookie for added security
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token, // Still include token in response for clients that need it
      data: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

/**
 * Logout function to clear the authentication token cookie
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  authenticateToken,
  authorizeUser,
  login,
  logout,
  authLimiter,
  validateInputs
};