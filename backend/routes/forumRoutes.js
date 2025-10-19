const express = require('express');
const router = express.Router();
const {
  getForums,
  createForum,
  getThreadsInForum,
  getLastThreadInForum,
} = require('../controllers/forumController.js');
const { protect } = require('../middleware/authMiddleware.js');

// Get all forums OR create a new one
router.route('/').get(getForums).post(protect, createForum);

// Get the last active thread in a forum
router.route('/:id/last-thread').get(getLastThreadInForum);

// Get all threads in a forum
router.route('/:id/threads').get(getThreadsInForum);

module.exports = router;