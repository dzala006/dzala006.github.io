const express = require('express');
const router = express.Router();

// Define routes
router.get('/api', (req, res) => {
  res.json({ message: 'API is working' });
});

module.exports = router;