const mongoose = require('mongoose');
const { TEST } = require('../config/constants');

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 1
  },
  marksPerQuestion: {
    type: Number,
    default: 1,
    min: 0
  },
  negativeMarks: {
    type: Number,
    default: 0,
    min: 0
  },
  // Changed from embedded questions to referenced question UIDs
  questionUids: [{
    type: String,
    required: true,
    ref: 'Question'
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Virtual for total marks
testSchema.virtual('totalMarks').get(function() {
  return this.questionUids.length * this.marksPerQuestion;
});

// Virtual for end time
testSchema.virtual('endTime').get(function() {
  return new Date(this.startTime.getTime() + this.duration * 60000);
});

// Virtual for status
testSchema.virtual('status').get(function() {
  const now = new Date();
  const endTime = this.endTime;
  
  if (now < this.startTime) return TEST.STATUS.UPCOMING;
  if (now <= endTime) return TEST.STATUS.ACTIVE;
  return TEST.STATUS.COMPLETED;
});

// Virtual to populate questions (you can use this when needed)
testSchema.virtual('questions', {
  ref: 'Question',
  localField: 'questionUids',
  foreignField: 'uid',
  justOne: false
});

// Index for better query performance
testSchema.index({ startTime: 1, isActive: 1 });
testSchema.index({ createdBy: 1 });
testSchema.index({ questionUids: 1 });

module.exports = mongoose.model('Test', testSchema);