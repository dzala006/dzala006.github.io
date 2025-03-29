const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const { 
  login, 
  logout,
  authenticateToken, 
  authorizeUser, 
  authLimiter,
  validateInputs
} = require('../middleware/auth');

// Validation rules
const userValidationRules = [
  // Username validation
  check('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores and hyphens')
    .trim().escape(),
  
  // Email validation
  check('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  // Password validation
  check('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const loginValidationRules = [
  check('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  check('password')
    .notEmpty().withMessage('Password is required')
];

const updateUserValidationRules = [
  check('username')
    .optional()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores and hyphens')
    .trim().escape(),
  
  check('email')
    .optional()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  check('preferences')
    .optional()
    .isObject().withMessage('Preferences must be an object')
];

// Public routes
// Login route with rate limiting and validation
router.post(
  '/login', 
  authLimiter, 
  loginValidationRules, 
  validateInputs, 
  login
);

// Logout route
router.post('/logout', logout);

// Register a new user with validation
router.post(
  '/register', 
  userValidationRules, 
  validateInputs, 
  userController.createUser
);

// Protected routes (require authentication)
// Get all users
router.get('/', authenticateToken, userController.getAllUsers);

// Get a specific user by ID
router.get('/:id', authenticateToken, userController.getUser);

// Update a user (requires authentication and authorization)
router.put(
  '/:id', 
  authenticateToken, 
  authorizeUser, 
  updateUserValidationRules, 
  validateInputs, 
  userController.updateUser
);

// Delete a user (requires authentication and authorization)
router.delete('/:id', authenticateToken, authorizeUser, userController.deleteUser);

module.exports = router;