const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Apply middleware to all routes in this router
router.use(authMiddleware);

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    res.status(200).json({
      message: 'Profile retrieved successfully',
      user: req.user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
});

router.post('/upgrades', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { money, upgrades } = req.body;
      
      if (typeof money !== 'number') {
        return res.status(400).json({ message: 'Valid money amount is required' });
      }
      
      // Update user upgrades and money
      const updatedProfile = await updateUserUpgrades(userId, money, upgrades);
      
      res.status(200).json({
        message: 'Upgrades updated successfully',
        profile: updatedProfile
      });
    } catch (error) {
      console.error('Upgrades update error:', error);
      res.status(500).json({ message: 'Server error updating upgrades' });
    }
  });

module.exports = router;