const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateUserAvatar, 
    getUserUploads, 
    getUserPosts,
    followUser,
    unfollowUser,
    bookmarkTorrent,
    unbookmarkTorrent
} = require('../controllers/userController.js');
const { protect, identifyUser } = require('../middleware/authMiddleware.js');
const multer = require('multer');
const path = require('path');

// --- (Multer config is unchanged) ---
const avatarStorage = multer.diskStorage({ /* ... */ });
const uploadAvatar = multer({ storage: avatarStorage });


// --- Public Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- CORRECTED ROUTE ORDER ---
// The more specific routes with '/uploads' and '/posts' must come BEFORE the general '/:username' route.

// Routes for fetching tab content (public)
router.get('/profile/:username/uploads', getUserUploads);
router.get('/profile/:username/posts', getUserPosts);

// The general profile route is now LAST among the profile routes
router.get('/profile/:username', identifyUser, getUserProfile);
// --- END OF CORRECTION ---


// --- Protected (Private) Routes ---
router.put('/profile/avatar', protect, uploadAvatar.single('avatar'), updateUserAvatar);

// Routes for following/unfollowing (protected)
router.route('/profile/:username/follow').put(protect, followUser).delete(protect, unfollowUser);

// Routes for bookmarking/unbookmarking (protected)
router.route('/bookmarks/:torrentId').put(protect, bookmarkTorrent).delete(protect, unbookmarkTorrent);

module.exports = router;