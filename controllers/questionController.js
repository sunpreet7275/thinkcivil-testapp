const Question = require('../models/Question');
const { handleError } = require('../middleware/errorHandler');

// Create multiple questions
const createQuestions = async (req, res) => {
  try {
    const processedQuestions = req.body.questions.map(question => ({
      question: {
        english: question.question.english,
        hindi: question.question.hindi || question.question.english
      },
      description: question.description ? {
        english: question.description.english || '',
        hindi: question.description.hindi || question.description.english || ''
      } : { english: '', hindi: '' },
      options: question.options.map(option => ({
        english: option.english,
        hindi: option.hindi || option.english
      })),
      correctAnswer: question.correctAnswer,
    //   marks: question.marks || 1,
      tags: question.tags || [],
      createdBy: req.user._id
    }));

    const questions = await Question.insertMany(processedQuestions);

    res.status(201).json({
      message: 'Questions created successfully',
      questions: questions.map(q => ({
        uid: q.uid,
        question: q.question,
        // marks: q.marks,
        tags: q.tags
      }))
    });
  } catch (error) {
    console.error('Question creation error:', error);
    handleError(res, error, 'Failed to create questions');
  }
};

// Get all questions with filtering
const getQuestions = async (req, res) => {
  try {
    console.log('🚀 SIMPLE GET QUESTIONS called');
    
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Simple query without any filters first
    const questions = await Question.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    const total = await Question.countDocuments({});
    const totalPages = Math.ceil(total / limitNum);

    console.log(`✅ SIMPLE: Found ${questions.length} of ${total} total questions`);

    res.setHeader('Cache-Control', 'no-cache');
    res.json({
      questions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalQuestions: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('❌ Simple get questions error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch questions',
      error: error.message 
    });
  }
};

// Get question by UID
const getQuestionByUid = async (req, res) => {
  try {
    const question = await Question.findOne({ uid: req.params.uid })
      .populate('tags', 'tag')
      .populate('createdBy', 'fullName email')
      .select('-__v');

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json(question);
  } catch (error) {
    handleError(res, error, 'Failed to fetch question');
  }
};

// Get questions by tag
const getQuestionsByTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const questions = await Question.find({ 
      tags: tagId, 
      isActive: true 
    })
      .populate('tags', 'tag')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    const total = await Question.countDocuments({ tags: tagId, isActive: true });
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      questions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalQuestions: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch questions by tag');
  }
};

// Update question by UID
// Update question by MongoDB _id
const updateQuestion = async (req, res) => {
  try {
    const { uid } = req.params;
    
    // Check if the parameter is a MongoDB ObjectId (24 character hex string)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(uid);
    
    let question;
    if (isObjectId) {
      // If it's an ObjectId, search by _id
      question = await Question.findByIdAndUpdate(
        uid,
        {
          question: {
            english: req.body.question.english,
            hindi: req.body.question.hindi || req.body.question.english
          },
          description: req.body.description ? {
            english: req.body.description.english || '',
            hindi: req.body.description.hindi || req.body.description.english || ''
          } : { english: '', hindi: '' },
          options: req.body.options.map(option => ({
            english: option.english,
            hindi: option.hindi || option.english
          })),
          correctAnswer: req.body.correctAnswer,
        //   marks: req.body.marks,
          tags: req.body.tags,
        },
        { new: true, runValidators: true }
      )
        .populate('tags', 'tag')
        .select('-__v');
    } else {
      // If it's not an ObjectId, search by uid
      question = await Question.findOneAndUpdate(
        { uid: uid },
        {
          question: {
            english: req.body.question.english,
            hindi: req.body.question.hindi || req.body.question.english
          },
          description: req.body.description ? {
            english: req.body.description.english || '',
            hindi: req.body.description.hindi || req.body.description.english || ''
          } : { english: '', hindi: '' },
          options: req.body.options.map(option => ({
            english: option.english,
            hindi: option.hindi || option.english
          })),
          correctAnswer: req.body.correctAnswer,
        //   marks: req.body.marks,
          tags: req.body.tags,
        },
        { new: true, runValidators: true }
      )
        .populate('tags', 'tag')
        .select('-__v');
    }

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    handleError(res, error, 'Failed to update question');
  }
};

// Delete question by UID
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findOneAndDelete({ uid: req.params.uid });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({
      message: 'Question deleted successfully'
    });
  } catch (error) {
    handleError(res, error, 'Failed to delete question');
  }
};

// Get all questions without pagination
const getAllQuestions = async (req, res) => {
  try {
    console.log('📋 GET ALL QUESTIONS (no pagination) called');
    
    // Get all questions without any filters or pagination
    const questions = await Question.find({})
      .sort({ createdAt: -1 })
      .select('_id question uid options correctAnswer marks tags difficulty isActive createdAt updatedAt');

    console.log(`✅ FOUND ${questions.length} total questions`);

    res.setHeader('Cache-Control', 'no-cache');
    res.json({
      questions,
      totalCount: questions.length
    });
  } catch (error) {
    console.error('❌ Get all questions error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch all questions',
      error: error.message 
    });
  }
};

module.exports = {
  createQuestions,
  getQuestions,
  getQuestionByUid,
  getQuestionsByTag,
  updateQuestion,
  deleteQuestion,
  getAllQuestions
};