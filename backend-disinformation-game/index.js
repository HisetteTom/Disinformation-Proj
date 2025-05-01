const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const factCheckRoutes = require('./routes/routes');
const tweetRoutes = require('./routes/tweetRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// dl
app.use('/profile_pics', express.static(path.join(__dirname, 'profile_pics')));
app.use('/downloaded_images', express.static(path.join(__dirname, 'downloaded_images')));

// Routes
app.use('/api/factcheck', factCheckRoutes);
app.use('/api/tweets', tweetRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});