const express = require('express');
const { checkFact } = require('../services/factChecker');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { claim } = req.body;
    
    if (!claim) {
      return res.status(400).json({ error: 'Claim is required' });
    }

    const result = await checkFact(claim);
    res.json(result);
  } catch (error) {
    console.error('Error in fact check route:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
});

module.exports = router;