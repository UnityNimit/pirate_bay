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
    unbookmarkTorrent, 
    updateUserProfile, 
    changeUserPassword, 
    adminUpdateUserAvatar,
    getUserAvatar // <-- IMPORT THE NEW FUNCTION
} = require('../controllers/userController.js');
const { protect, identifyUser, moderator } = require('../middleware/authMiddleware.js');
const multer = require('multer');
const path = require('path');

// --- THE KEY CHANGE IS HERE: Use memoryStorage ---
// This tells multer to store the file as a buffer in memory (req.file.buffer)
const storage = multer.memoryStorage();
const uploadAvatar = multer({ storage: storage });

// NEW ROUTE TO SERVE THE AVATAR FROM THE DATABASE
// It's important this route is specific and comes before the general '/profile/:username' route
router.get('/avatar/:userId', getUserAvatar);

// Moderator can update another user's avatar
router.put('/profile/:userId/avatar', protect, moderator, uploadAvatar.single('avatar'), adminUpdateUserAvatar);

// PUBLIC ROUTES
router.post('/register', registerUser);
router.post('/login', loginUser);

// Profile-related data routes
router.get('/profile/:username/uploads', getUserUploads);
router.get('/profile/:username/posts', getUserPosts);

// General profile settings
router.route('/profile').put(protect, updateUserProfile);
router.route('/password').put(protect, changeUserPassword);

// This is the main profile data route, must be near the end
router.get('/profile/:username', identifyUser, getUserProfile);

// PRIVATE ROUTES (for the logged-in user)
router.put('/profile/avatar', protect, uploadAvatar.single('avatar'), updateUserAvatar);
router.route('/profile/:username/follow').put(protect, followUser).delete(protect, unfollowUser);
router.route('/bookmarks/:torrentId').put(protect, bookmarkTorrent).delete(protect, unbookmarkTorrent);

module.exports = router;