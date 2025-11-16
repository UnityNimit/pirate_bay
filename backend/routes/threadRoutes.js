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

//PUBLIC
router.route('/recent').get(getRecentThreads);
router.route('/:id').get(getThreadById);
router.route('/:id/posts').get(getPostsInThread);


//PROTECTED ROUTES (LOGIN REQUIRED)
router.route('/:id/posts').post(protect, createPost);


// LOGIN + MOD
router.route('/:id/lock').put(protect, moderator, lockThread);
router.route('/:id').delete(protect, moderator, deleteThread);
router.route('/posts/:id').delete(protect, moderator, deletePost);


module.exports = router;