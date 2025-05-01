const express = require('express');
const { getTweets } = require('../services/tweetService');


const router = express.Router(); 

router.get('/', async (req, res) => {
  try {
    const tweets = await getTweets();
    res.json(tweets);
  } catch (error) {
    console.error('Error fetching tweets:', error);
    res.status(500).json({ error: 'Failed to fetch tweets' });
  }
});

module.exports = router;