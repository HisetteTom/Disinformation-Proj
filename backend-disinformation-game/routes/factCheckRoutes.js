const express = require('express');
const { checkFact } = require('../services/factChecker');

const router = express.Router();

// Fact check endpoint
router.post('/', async (req, res) => {
  try {
    const { claim } = req.body;
    
    if (!claim) {
      return res.status(400).json({ message: 'Claim is required' });
    }
    
    const result = await checkFact(claim);
    res.json(result);
  } catch (error) {
    console.error('Fact check error:', error);
    res.status(500).json({ message: 'Server error during fact checking' });
  }
});

module.exports = router;