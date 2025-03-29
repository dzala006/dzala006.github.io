const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { login, authenticateToken, authorizeUser } = require('../middleware/auth');

// Public routes
// Login route
router.post('/login', login);

// Register a new user
router.post('/register', userController.createUser);

// Protected routes (require authentication)
// Get all users
router.get('/', authenticateToken, userController.getAllUsers);

// Get a specific user by ID
router.get('/:id', authenticateToken, userController.getUser);

// Update a user (requires authentication and authorization)
router.put('/:id', authenticateToken, authorizeUser, userController.updateUser);

// Delete a user (requires authentication and authorization)
router.delete('/:id', authenticateToken, authorizeUser, userController.deleteUser);

module.exports = router;