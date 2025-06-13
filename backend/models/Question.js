const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  marks: { type: Number, default: 1 },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' }
});

module.exports = mongoose.model('Question', questionSchema);
