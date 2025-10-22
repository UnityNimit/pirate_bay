const express = require('express');
const router = express.Router();
const {
  getForums, createForum, deleteForum,
  getThreadsInForum, createThread,
} = require('../controllers/forumController.js');
const { protect, moderator } = require('../middleware/authMiddleware.js');


// Get all forums OR create a new one (protected)
router.route('/').get(getForums).post(protect, moderator, createForum);

// Get all threads in a forum OR create a new one (protected)
router.route('/:id/threads').get(getThreadsInForum).post(protect, createThread);

// Delete a forum (protected)
router.route('/:id').delete(protect, moderator, deleteForum);

// We keep this route for the homepage "active threads" feature, but it's less critical now
const { getLastThreadInForum } = require('../controllers/forumController.js');
router.route('/:id/last-thread').get(getLastThreadInForum);

module.exports = router;