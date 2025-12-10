const express = require('express');
const router = express.Router();
const { getStudentResults, getStudentTestResult, getResultById } = require('../controllers/resultController');
const { auth, studentAuth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(auth, apiLimiter);

router.get('/student', studentAuth, getStudentResults);
router.get('/student/test/:testId', studentAuth, getStudentTestResult);
router.get('/:id', getResultById);

module.exports = router;