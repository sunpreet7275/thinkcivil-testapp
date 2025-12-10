const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const multilingualSchema = new mongoose.Schema({
  english: {
    type: String,
    required: true,
    trim: true
  },
  hindi: {
    type: String,
    default: '',
    trim: true
  }
});

const optionSchema = new mongoose.Schema({
  english: {
    type: String,
    required: true,
    trim: true
  },
  hindi: {
    type: String,
    default: '',
    trim: true
  }
});

const questionSchema = new mongoose.Schema({
  uid: {
    type: String,
    unique: true,
    default: () => uuidv4()
  },
  question: {
    type: multilingualSchema,
    required: true
  },
  description: {
    type: multilingualSchema,
    default: () => ({ english: '', hindi: '' })
  },
  options: [optionSchema],
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
//   marks: {
//     type: Number,
//     default: 1,
//     min: 1
//   },
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
questionSchema.index({ uid: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ isActive: 1 });

module.exports = mongoose.model('Question', questionSchema);