const ResultService = require('../services/resultService');
const { calculateRanking } = require('../utils/helpers');
const { handleError } = require('../middleware/errorHandler');
const messages = require('../utils/messages');

const getStudentTestResult = async (req, res) => {
  try {
    const result = await ResultService.getStudentTestResult(req.params.testId, req.user._id);
    if (!result) {
      return res.status(404).json({ message: messages.en.resultNotFound });
    }

    const testResults = await ResultService.getTestResults(req.params.testId);
    const { rank, totalStudents } = calculateRanking(testResults, req.user._id);

    // Check if questions are populated
    if (!result.test.questions || !Array.isArray(result.test.questions)) {
      console.error('Questions not populated in result:', result.test);
      return res.status(500).json({ 
        message: 'Unable to load test questions',
        error: 'Questions data not available' 
      });
    }

    // Create question map for proper matching
    const questionMap = {};
    result.test.questions.forEach(question => {
      questionMap[question.uid] = question;
    });

    const detailedResult = {
      ...result.toObject(),
      rank,
      totalStudents,
      percentage: ((result.score / result.totalMarks) * 100).toFixed(2),
      test: {
        ...result.test.toObject(),
        questions: result.answers.map(answer => {
          const question = questionMap[answer.questionUid];
          return {
            question: question ? question.question : { english: 'Question not found', hindi: '' },
            description: question ? (question.description || { english: '', hindi: '' }) : { english: '', hindi: '' },
            options: question ? question.options : [],
            studentAnswer: answer.selectedOption,
            correctAnswer: answer.correctAnswer,
            isCorrect: answer.isCorrect
          };
        })
      }
    };

    res.json(detailedResult);
  } catch (error) {
    console.error('Get student test result error:', error);
    handleError(res, error, messages.en.serverError);
  }
};

// Other result controller functions...
const getStudentResults = async (req, res) => {
  try {
    const results = await ResultService.getStudentResults(req.user._id);
    
    // Group results by test to calculate ranking per test
    const resultsByTest = {};
    
    // Group results by test ID
    results.forEach(result => {
      const testId = result.test._id.toString();
      if (!resultsByTest[testId]) {
        resultsByTest[testId] = {
          test: result.test,
          results: []
        };
      }
      resultsByTest[testId].results.push(result);
    });
    
    // Calculate ranking for each test separately
    const resultsWithRanking = [];
    
    for (const testId in resultsByTest) {
      const { test, results: testResults } = resultsByTest[testId];
      
      // Get ALL results for this test (not just the student's)
      const allTestResults = await ResultService.getTestResults(testId);
      
      // Calculate ranking for each result in this test
      const rankedTestResults = allTestResults.map((testResult, index) => {
        const studentResult = testResults.find(r => 
          r.student._id.toString() === testResult.student._id.toString()
        );
        
        if (studentResult) {
          return {
            ...studentResult.toObject(),
            rank: index + 1,
            totalStudents: allTestResults.length
          };
        }
        return null;
      }).filter(Boolean); // Remove nulls
      
      resultsWithRanking.push(...rankedTestResults);
    }
    
    // Sort by submission date (most recent first)
    resultsWithRanking.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.json(resultsWithRanking);
  } catch (error) {
    console.error('Get student results error:', error);
    handleError(res, error, messages.en.serverError);
  }
};

const getResultById = async (req, res) => {
  try {
    const result = await ResultService.getResultById(req.params.id);
    if (!result) {
      return res.status(404).json({ message: messages.en.resultNotFound });
    }

    if (req.user.role === 'student' && result.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: messages.en.accessDenied });
    }

    res.json(result);
  } catch (error) {
    handleError(res, error, messages.en.serverError);
  }
};

module.exports = {
  getStudentResults,
  getStudentTestResult,
  getResultById
};