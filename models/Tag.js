const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  tag: {
    type: String,
    default: '',
    trim: true,
    unique: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tag', tagSchema);