const User = require('../models/User.js');
const Torrent = require('../models/Torrent.js');
const Post = require('../models/Post.js');
const jwt = require('jsonwebtoken');

// Helper function to generate a JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- HEAVILY UPGRADED getUserProfile FUNCTION ---
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('-password')
            .populate('bookmarkedTorrents', 'name category') // Populate bookmarks with name and category
            .populate('following', 'username avatarPath');     // Populate who this user is following

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // --- Calculate Stats (same as before) ---
        const uploadCount = await Torrent.countDocuments({ uploader: user._id });
        const postCount = await Post.countDocuments({ user: user._id });
        const downloadStats = await Torrent.aggregate([
            { $match: { uploader: user._id } },
            { $group: { _id: null, totalDownloads: { $sum: '$downloads' } } }
        ]);
        const totalDownloads = downloadStats.length > 0 ? downloadStats[0].totalDownloads : 0;
        
        // --- NEW: Find Followers ---
        const followers = await User.find({ following: user._id }).select('username avatarPath');

        // Check follow status (same as before)
        let isFollowing = false;
        if (req.user) {
            const currentUser = await User.findById(req.user.id);
            if (currentUser && currentUser.following.includes(user._id)) {
                isFollowing = true;
            }
        }

        res.json({
            _id: user._id,
            username: user.username,
            avatarPath: user.avatarPath,
            createdAt: user.createdAt,
            bookmarkedTorrents: user.bookmarkedTorrents,
            following: user.following,
            followers: followers, // Send the new followers list
            isFollowing,
            stats: {
                uploads: uploadCount,
                posts: postCount,
                totalDownloads: totalDownloads,
            }
        });
    } catch (error) {
        console.error('Get User Profile Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- ADD THIS NEW FUNCTION ---
// @desc    Update user avatar
// @route   PUT /api/users/profile/avatar
// @access  Private
const updateUserAvatar = async (req, res) => {
    try {
        // req.user is attached by the 'protect' middleware
        const user = await User.findById(req.user.id);

        if (user) {
            // req.file is populated by multer
            if (req.file) {
                user.avatarPath = req.file.path;
                await user.save();
                res.json({ message: 'Avatar updated successfully', avatarPath: user.avatarPath });
            } else {
                res.status(400).json({ message: 'No image file provided' });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Update Avatar Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all torrents uploaded by a specific user
// @route   GET /api/users/profile/:username/uploads
// @access  Public
const getUserUploads = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const uploads = await Torrent.find({ uploader: user._id })
            .sort({ createdAt: -1 });
        res.json(uploads);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all posts made by a specific user
// @route   GET /api/users/profile/:username/posts
// @access  Public
const getUserPosts = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const posts = await Post.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate({
                path: 'thread',
                select: 'title' // Only get the title of the thread
            });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Follow another user
// @route   PUT /api/users/profile/:username/follow
// @access  Private
const followUser = async (req, res) => {
    try {
        const userToFollow = await User.findOne({ username: req.params.username });
        const currentUser = await User.findById(req.user.id);

        if (!userToFollow) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Add userToFollow's ID to the currentUser's following list, if not already there
        if (!currentUser.following.includes(userToFollow._id)) {
            currentUser.following.push(userToFollow._id);
            await currentUser.save();
        }
        
        res.json({ message: `You are now following ${userToFollow.username}.` });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Unfollow another user
// @route   DELETE /api/users/profile/:username/follow
// @access  Private
const unfollowUser = async (req, res) => {
    try {
        const userToUnfollow = await User.findOne({ username: req.params.username });
        const currentUser = await User.findById(req.user.id);

        if (!userToUnfollow) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Remove userToUnfollow's ID from the currentUser's following list
        currentUser.following.pull(userToUnfollow._id);
        await currentUser.save();
        
        res.json({ message: `You have unfollowed ${userToUnfollow.username}.` });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Bookmark a torrent
// @route   PUT /api/users/bookmarks/:torrentId
// @access  Private
const bookmarkTorrent = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const torrentId = req.params.torrentId;

        if (!currentUser.bookmarkedTorrents.includes(torrentId)) {
            currentUser.bookmarkedTorrents.push(torrentId);
            await currentUser.save();
        }
        
        res.json({ message: 'Torrent bookmarked.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Remove a torrent bookmark
// @route   DELETE /api/users/bookmarks/:torrentId
// @access  Private
const unbookmarkTorrent = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const torrentId = req.params.torrentId;

        currentUser.bookmarkedTorrents.pull(torrentId);
        await currentUser.save();

        res.json({ message: 'Bookmark removed.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- UPDATE MODULE.EXPORTS ---
module.exports = { 
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
};