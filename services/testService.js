const Test = require('../models/Test');
const Result = require('../models/Result');
const Question = require('../models/Question');

class TestService {
  static async createTest(testData) {
    // Validate that all question UIDs exist
    if (testData.questionUids && testData.questionUids.length > 0) {
      const existingQuestions = await Question.find({ 
        uid: { $in: testData.questionUids },
        isActive: true 
      }).select('uid');
      
      const existingUids = existingQuestions.map(q => q.uid);
      const missingUids = testData.questionUids.filter(uid => !existingUids.includes(uid));
      
      if (missingUids.length > 0) {
        throw new Error(`Some questions not found or inactive: ${missingUids.join(', ')}`);
      }
    }
    
    return await Test.create(testData);
  }

  static async getTestById(testId, options = {}) {
    const query = Test.findById(testId);
    
    if (options.populateCreator) {
      query.populate('createdBy', 'fullName email');
    }
    
    if (options.populateQuestions) {
      query.populate({
        path: 'questions',
        select: '_id question description options correctAnswer uid tags',
        populate: {
          path: 'tags',
          select: 'tag'
        }
      });
    }
    
    return await query.exec();
  }

  static async getAvailableTestsForStudent() {
    const now = new Date();
    const tests = await Test.find({ isActive: true })
      .populate({
        path: 'questions',
        select: '_id question uid',
        match: { isActive: true }
      })
      .sort({ startTime: 1 })
      .lean();

    return tests.filter(test => {
      const endTime = new Date(test.startTime.getTime() + test.duration * 60000);
      return endTime > now;
    });
  }

  static async getTestWithValidation(testId, userId, userRole) {
    const test = await this.getTestById(testId, { populateQuestions: true });
    if (!test) throw new Error('Test not found');

    const now = new Date();
    const endTime = test.endTime;

    if (userRole === 'student') {
      if (now < test.startTime) throw new Error('Test has not started yet');
      if (now > endTime) throw new Error('Test has ended');

      const existingResult = await Result.findOne({ test: testId, student: userId });
      if (existingResult) throw new Error('Test already submitted');
    }

    return test;
  }

  static async updateTest(testId, updateData) {
    // Validate question UIDs if they are being updated
    if (updateData.questionUids && updateData.questionUids.length > 0) {
      const existingQuestions = await Question.find({ 
        uid: { $in: updateData.questionUids },
        isActive: true 
      }).select('uid');
      
      const existingUids = existingQuestions.map(q => q.uid);
      const missingUids = updateData.questionUids.filter(uid => !existingUids.includes(uid));
      
      if (missingUids.length > 0) {
        throw new Error(`Some questions not found or inactive: ${missingUids.join(', ')}`);
      }
    }
    
    return await Test.findByIdAndUpdate(testId, updateData, { new: true, runValidators: true });
  }

  static async deleteTest(testId) {
    const test = await Test.findByIdAndDelete(testId);
    if (test) {
      await Result.deleteMany({ test: testId });
    }
    return test;
  }

  static async getTestsByCreator(creatorId) {
    return await Test.find({ createdBy: creatorId })
      .populate({
        path: 'questions',
        select: '_id question.english uid',
        match: { isActive: true }
      })
      .sort({ createdAt: -1 });
  }

  static async getAllActiveTests() {
    return await Test.find({ isActive: true })
      .populate({
        path: 'questions',
        select: '_id question.english uid',
        match: { isActive: true }
      })
      .sort({ startTime: 1 });
  }

  // New method to get test with full question details
  // static async getTestWithFullQuestions(testId) {
  //   return await Test.findById(testId)
  //     .populate({
  //       path: 'questions',
  //       select: '_id question description options correctAnswer uid tags',
  //       populate: {
  //         path: 'tags',
  //         select: 'tag'
  //       }
  //     });
  // }

  static async getTestWithFullQuestions(testId) {
    return await Test.findById(testId)
      .populate({
        path: 'questions',
        select: '_id question description options correctAnswer uid tags',
        populate: {
          path: 'tags',
          select: 'tag'
        }
      })
      .populate('createdBy', 'fullName email')
      .lean();
  }
}

module.exports = TestService;