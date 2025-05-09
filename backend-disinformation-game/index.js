const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const factCheckRoutes = require('./routes/factCheckRoutes');
const tweetRoutes = require('./routes/tweetRoutes');
const userRoutes = require('./routes/userRoutes');
const protectedRoutes = require('./routes/protectedRoutes');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const mediaRoutes = require('./routes/mediaRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/media', mediaRoutes);
app.use('/api/factcheck', factCheckRoutes);
app.use('/api/tweets', tweetRoutes);
app.use('/api/users', userRoutes);
app.use('/api/protected', protectedRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});