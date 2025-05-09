const express = require('express');
const { registerUser, loginUser, updateUserStats } = require('../services/userService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

console.log('userRoutes loaded!');

// Register a new user - already authenticated by Firebase
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId; // Get userId from verified token
    const { username, email } = req.body;
    
    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required' });
    }
    
    // Pass the userId from the token instead of creating new Firebase user
    const user = await registerUser(username, email, userId);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// No need for a separate login endpoint - Firebase handles this

// Update user stats (protected route)
router.post('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { stats } = req.body;
    
    if (!stats) {
      return res.status(400).json({ message: 'Stats are required' });
    }
    
    const updatedStats = await updateUserStats(userId, stats);
    
    res.status(200).json({
      message: 'Stats updated successfully',
      stats: updatedStats
    });
  } catch (error) {
    console.error('Stats update error:', error);
    res.status(500).json({ message: 'Server error updating stats' });
  }
});

module.exports = router;