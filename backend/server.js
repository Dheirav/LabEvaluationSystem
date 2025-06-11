const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const logsRoutes = require('./routes/logs');
const batchRoutes = require('./routes/batches');
const ensureBatchesExist = require('./utils/batchCheck');

(async () => {
  // Load environment variables
  dotenv.config();

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    ensureBatchesExist(); // Ensure batches exist after connecting
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/logs', logsRoutes);
  app.use('/api/batches', batchRoutes);

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();