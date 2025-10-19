const express = require('express');
const router = express.Router();
const {
  getThreadById,
  getPostsInThread,
  createPost,
} = require('../controllers/forumController.js');
const { protect } = require('../middleware/authMiddleware.js');

// Get a single thread by its ID
router.route('/:id').get(getThreadById);

// Get all posts in a thread OR create a new post in a thread
router.route('/:id/posts').get(getPostsInThread).post(protect, createPost);

module.exports = router;