const express = require('express');
const { registerUser, loginUser, updateUserStats } = require('../services/userService');
const authMiddleware = require('../middleware/authMiddleware');
const { adminDb } = require('../services/FirebaseService');
const admin = require('firebase-admin');
const router = express.Router();

console.log('userRoutes loaded!');

// Register a new user
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


router.get('/leaderboard', async (req, res) => {
  try {
    // Get top 10 users by score
    const leaderboardSnapshot = await adminDb.collection('userStats')
      .orderBy('score', 'desc')
      .limit(10)
      .get();
    
    const leaderboard = [];
    leaderboardSnapshot.forEach(doc => {
      const data = doc.data();
      leaderboard.push({
        id: doc.id,
        score: data.score,
        correctFlags: data.correctFlags,
        incorrectFlags: data.incorrectFlags,
        gamesPlayed: data.gamesPlayed
      });
    });
    
    // Fetch usernames from users collection
    const userIds = leaderboard.map(entry => entry.id);
    if (userIds.length === 0) {
      return res.json({ leaderboard: [] });
    }
    
    const usersSnapshot = await adminDb.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', userIds).get();
    
    const userMap = {};
    usersSnapshot.forEach(doc => {
      userMap[doc.id] = doc.data();
    });
    
    // Add usernames to leaderboard entries
    const completeLeaderboard = leaderboard.map(entry => ({
      ...entry,
      username: userMap[entry.id]?.username || userMap[entry.id]?.email || 'Anonymous'
    }));
    
    res.json({ leaderboard: completeLeaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
});

module.exports = router;