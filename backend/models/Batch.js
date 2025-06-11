const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    enum: ['N', 'P', 'Q'] // Restrict to only these values
  },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Batch', batchSchema);