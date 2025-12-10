const express = require('express');
const router = express.Router();
const {
  createTag,
  getTags,
  updateTag,
  deleteTag
} = require('../controllers/tagController');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', auth, adminAuth, getTags);

router.post('/', auth, adminAuth, createTag);
router.put('/:id', auth, adminAuth, updateTag);
router.delete('/:id', auth, adminAuth, deleteTag);

module.exports = router;