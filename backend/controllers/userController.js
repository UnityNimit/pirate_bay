const User = require('../models/User.js');
const Torrent = require('../models/Torrent.js');
const Post = require('../models/Post.js');
const jwt = require('jsonwebtoken');
const fs = require('fs'); // Import the File System module
const path = require('path'); // Import the Path module
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
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        // --- THIS IS THE FIX ---
        // We must include the user's role in the login response
        role: user.role,
        // --- END OF FIX ---
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('-password')
            .populate('bookmarkedTorrents', 'name category')
            .populate('following', '_id username'); // Cleaned up

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const followers = await User.find({ following: user._id }).select('_id username'); // Cleaned up

        // The rest of the function is unchanged...
        const uploadCount = await Torrent.countDocuments({ uploader: user._id });
        const postCount = await Post.countDocuments({ user: user._id });
        const downloadStats = await Torrent.aggregate([
            { $match: { uploader: user._id } },
            { $group: { _id: null, totalDownloads: { $sum: '$downloads' } } }
        ]);
        const totalDownloads = downloadStats.length > 0 ? downloadStats[0].totalDownloads : 0;
        
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
            createdAt: user.createdAt,
            bookmarkedTorrents: user.bookmarkedTorrents,
            following: user.following,
            followers: followers,
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

// @desc    Update user's own avatar
// @route   PUT /api/users/profile/avatar
// @access  Private
const updateUserAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            if (req.file) {
                // Save the image buffer and MIME type to the user document
                user.avatar.data = req.file.buffer;
                user.avatar.contentType = req.file.mimetype;
                await user.save();
                res.json({ message: 'Avatar updated successfully' });
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


// @desc    Update user's own profile (e.g., email)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.email = req.body.email || user.email;
            // You can add other updatable fields here later if you want

            const updatedUser = await user.save();

            // We need to return a new token because if the user ID or other
            // payload data changes, the old token becomes outdated.
            // In our case, it doesn't, but this is good practice.
            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                avatarPath: updatedUser.avatarPath,
                token: generateToken(updatedUser._id), // Return a fresh token
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Change user's own password
// @route   PUT /api/users/password
// @access  Private
const changeUserPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (user && (await user.matchPassword(currentPassword))) {
            user.password = newPassword;
            await user.save();
            res.json({ message: 'Password updated successfully.' });
        } else {
            res.status(401).json({ message: 'Invalid current password.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Admin updates another user's avatar
// @route   PUT /api/users/profile/:userId/avatar
// @access  Moderator
const adminUpdateUserAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (user && req.file) {
            user.avatar.data = req.file.buffer;
            user.avatar.contentType = req.file.mimetype;
            await user.save();
            res.json({ message: 'Avatar updated successfully' });
        } else {
            res.status(404).json({ message: 'User not found or no file provided.' });
        }
    } catch (error) { 
        res.status(500).json({ message: 'Server Error' }); 
    }
};

// @desc    Get a user's avatar by their ID, with a fallback to a default image.
// @route   GET /api/users/avatar/:userId
// @access  Public
const getUserAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        // If the user exists and has custom avatar data, send it.
        if (user && user.avatar && user.avatar.data) {
            res.set('Content-Type', user.avatar.contentType);
            return res.send(user.avatar.data);
        }
        
        // --- FALLBACK LOGIC ---
        // If the user doesn't exist or has no avatar, send the default image.
        const defaultAvatarPath = path.join(__dirname, '..', 'uploads', 'avatars', 'default.png');

        // Check if the default file exists before trying to send it
        if (fs.existsSync(defaultAvatarPath)) {
            res.set('Content-Type', 'image/png');
            res.sendFile(defaultAvatarPath);
        } else {
            // This is a server configuration error, so send a 500
            console.error('Default avatar not found at:', defaultAvatarPath);
            res.status(500).json({ message: 'Server error: Default avatar is missing.' });
        }

    } catch (error) {
        // If the ID is invalid or another DB error occurs, you can also send the default
        const defaultAvatarPath = path.join(__dirname, '..', 'uploads', 'avatars', 'default.png');
        if (fs.existsSync(defaultAvatarPath)) {
            res.set('Content-Type', 'image/png');
            res.sendFile(defaultAvatarPath);
        } else {
             res.status(500).json({ message: 'Server Error' });
        }
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
   unbookmarkTorrent, updateUserProfile, changeUserPassword, adminUpdateUserAvatar, getUserAvatar};