const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  tests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }]
});

module.exports = mongoose.model('Course', courseSchema);
