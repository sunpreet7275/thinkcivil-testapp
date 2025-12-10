const Tag = require('../models/Tag');
const { handleError } = require('../middleware/errorHandler');

// Create new tag
const createTag = async (req, res) => {
  try {
    const tag = new Tag({
      tag: req.body.tag,
      createdBy: req.user._id
    });

    await tag.save();

    res.status(201).json({
      message: 'Tag created successfully',
      tag: {
        _id: tag._id,
        tag: tag.tag
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Tag already exists'
      });
    }
    handleError(res, error, 'Failed to create tag');
  }
};

// Get all tags
const getTags = async (req, res) => {
  try {
    const tags = await Tag.find()
      .select('_id tag')
      .sort({ tag: 1 });

    res.json(tags);
  } catch (error) {
    handleError(res, error, 'Failed to fetch tags');
  }
};

// Update tag
const updateTag = async (req, res) => {
  try {
    const tag = await Tag.findByIdAndUpdate(
      req.params.id,
      { tag: req.body.tag },
      { new: true, runValidators: true }
    ).select('_id tag');

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.json({
      message: 'Tag updated successfully',
      tag
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Tag already exists'
      });
    }
    handleError(res, error, 'Failed to update tag');
  }
};

// Delete tag
const deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.json({
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    handleError(res, error, 'Failed to delete tag');
  }
};

module.exports = {
  createTag,
  getTags,
  updateTag,
  deleteTag
};