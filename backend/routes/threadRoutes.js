const express = require('express');
const router = express.Router();
const {
  getThreadById,
  getPostsInThread,
  createPost,
  getRecentThreads,
  lockThread,
  deleteThread,
  deletePost,
} = require('../controllers/forumController.js');
const { protect, moderator } = require('../middleware/authMiddleware.js');

// --- PUBLIC ROUTES ---

// Get a list of recent threads for the homepage
router.route('/recent').get(getRecentThreads);

// Get a single thread by its ID
router.route('/:id').get(getThreadById);

// Get all posts in a thread
router.route('/:id/posts').get(getPostsInThread);


// --- PROTECTED ROUTES (Require login) ---

// Create a new post in a thread
router.route('/:id/posts').post(protect, createPost);


// --- MODERATOR-ONLY ROUTES (Require login + moderator role) ---

// Lock or unlock a thread
router.route('/:id/lock').put(protect, moderator, lockThread);

// Delete an entire thread and all its posts
router.route('/:id').delete(protect, moderator, deleteThread);

// Delete a single post by its ID
router.route('/posts/:id').delete(protect, moderator, deletePost);


module.exports = router;