const express = require('express');
const { checkFact } = require('../services/factChecker');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { claim } = req.body;
    
    if (!claim) {
      return res.status(400).json({ error: 'Missing required parameter: claim' });
    }
    
    const result = await checkFact(claim);
    
    if (result.type === 'news') {
      // format pour l'affichage des articles de presse
      return res.json({
        found: true,
        type: 'news',
        articles: result.articles
      });
    } else {
      // retourne le résultat du fact-checking
      return res.json(result);
    }
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;