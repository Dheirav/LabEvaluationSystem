const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Batch = require('../models/Batch');

// GET /api/batches - Get all batches
router.get('/', protect, async (req, res) => {
  try {
    const batches = await Batch.find().sort({ name: 1 });
    return res.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    return res.status(500).json({ message: 'Error fetching batches' });
  }
});

module.exports = router;