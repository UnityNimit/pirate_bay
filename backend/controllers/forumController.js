const Forum = require('../models/Forum.js');
const Thread = require('../models/Thread.js');
const Post = require('../models/Post.js');

// --- HELPER FUNCTION ---
// A simple BBCode to HTML parser
function parseBBCode(text) {
    if (!text) return '';
    text = text.replace(/\[b\](.*?)\[\/b\]/gs, '<strong>$1</strong>');
    text = text.replace(/\[i\](.*?)\[\/i\]/gs, '<em>$1</em>');
    text = text.replace(/\[quote\](.*?)\[\/quote\]/gs, '<blockquote>$1</blockquote>');
    text = text.replace(/\n/g, '<br>');
    return text;
}

// --- FORUMS ---
const getForums = async (req, res) => {
    try {
        const forums = await Forum.find({});
        const forumsWithStats = await Promise.all(forums.map(async (forum) => {
            const topicsCount = await Thread.countDocuments({ forum: forum._id });
            const postsInForum = await Post.aggregate([
                { $lookup: { from: 'threads', localField: 'thread', foreignField: '_id', as: 'threadInfo' } },
                { $unwind: '$threadInfo' },
                { $match: { 'threadInfo.forum': forum._id } },
                { $count: 'totalPosts' },
            ]);
            const postCount = postsInForum.length > 0 ? postsInForum[0].totalPosts : 0;
            return { ...forum.toObject(), topics: topicsCount, posts: postCount };
        }));
        res.json(forumsWithStats);
    } catch (error) {
        console.error('Get Forums Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const createForum = async (req, res) => {
    const { name, description, type } = req.body;
    if (!name || !description) {
        return res.status(400).json({ message: 'Name and description are required.' });
    }
    try {
        const forum = await Forum.create({ name, description, type: type || 'forum' });
        res.status(201).json(forum);
    } catch (error) {
        res.status(500).json({ message: 'Server Error or Forum already exists.' });
    }
};

const deleteForum = async (req, res) => {
    try {
        const forum = await Forum.findById(req.params.id);
        if (!forum) return res.status(404).json({ message: 'Forum not found.' });

        // In a real app, you would handle orphaned threads and posts
        // For now, we just delete the forum.
        await forum.deleteOne();
        res.json({ message: 'Forum removed.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error.' });
    }
};


const getThreadsInForum = async (req, res) => {
    try {
        const forum = await Forum.findById(req.params.id);
        if (!forum) {
            return res.status(404).json({ message: 'Forum not found' });
        }

        const threads = await Thread.find({ forum: req.params.id })
            .sort({ updatedAt: -1 })
            .populate('user', 'username');

        // Efficiently fetch stats for all threads
        const threadsWithStats = await Promise.all(threads.map(async (thread) => {
            // The first post is the thread itself, so replies are total posts minus one.
            const postCount = await Post.countDocuments({ thread: thread._id });

            const lastPost = await Post.findOne({ thread: thread._id })
                .sort({ createdAt: -1 })
                .populate('user', 'username');

            return {
                ...thread.toObject(),
                replyCount: postCount > 0 ? postCount - 1 : 0,
                lastPost: lastPost ? {
                    user: lastPost.user,
                    createdAt: lastPost.createdAt,
                } : null, // Handle case where there are no posts
            };
        }));

        res.json({
            forum: forum,
            threads: threadsWithStats
        });
    } catch (error) {
        console.error("Get Threads Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getThreadById = async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.id)
            .populate('user', 'username')
            .populate('forum', 'name');
        if (thread) res.json(thread);
        else res.status(404).json({ message: 'Thread not found' });
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

const getLastThreadInForum = async (req, res) => {
    try {
        const thread = await Thread.findOne({ forum: req.params.id }).sort({ updatedAt: -1 });
        if (thread) res.json(thread);
        else res.status(404).json({ message: 'No threads found in this forum.' });
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// @desc    Create a new thread in a forum
// @route   POST /api/forums/:id/threads
// @access  Private
const createThread = async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required.' });
    }
    try {
        const thread = await Thread.create({
            forum: req.params.id,
            title: title,
            user: req.user._id,
        });
        await Post.create({
            thread: thread._id,
            user: req.user._id,
            content: content,
        });
        res.status(201).json(thread);
    } catch (error) {
        res.status(500).json({ message: 'Server Error.' });
    }
};


// --- POSTS ---
const getPostsInThread = async (req, res) => {
    try {
        const POSTS_PER_PAGE = 5;
        const page = parseInt(req.query.page) || 1;
        const totalPosts = await Post.countDocuments({ thread: req.params.id });

        const posts = await Post.find({ thread: req.params.id })
            .populate('user', 'username createdAt')
            .sort({ createdAt: 1 })
            .skip((page - 1) * POSTS_PER_PAGE)
            .limit(POSTS_PER_PAGE);

        // Parse BBCode for each post before sending
        const parsedPosts = posts.map(post => {
            const postObject = post.toObject();
            postObject.content = parseBBCode(postObject.content);
            return postObject;
        });

        res.json({
            posts: parsedPosts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts / POSTS_PER_PAGE)
        });
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

const createPost = async (req, res) => {
    const { content } = req.body;
    const threadId = req.params.id;
    const user = req.user._id;
    const thread = await Thread.findById(threadId);
    if (thread.isLocked) {
        return res.status(403).json({ message: 'Cannot reply to a locked thread.' });
    }

    try {
        const post = await Post.create({ thread: threadId, user, content });
        const populatedPost = await Post.findById(post._id).populate('user', 'username createdAt');
        res.status(201).json(populatedPost);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// @desc    Get the most recently active threads for the homepage
// @route   GET /api/threads/recent
// @access  Public
const getRecentThreads = async (req, res) => {
    try {
        // Find threads, sort them by their 'updatedAt' field in descending order (newest first),
        // limit the results to the top 5, and select only the 'title' and '_id' fields.
        const threads = await Thread.find({})
            .sort({ updatedAt: -1 })
            .limit(5)
            .select('title');

        res.json(threads);
    } catch (error) {
        console.error("Get Recent Threads Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const lockThread = async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.id);
        if (thread) {
            thread.isLocked = !thread.isLocked; // Toggle the lock status
            await thread.save();
            res.json({ message: `Thread has been ${thread.isLocked ? 'locked' : 'unlocked'}.`, isLocked: thread.isLocked });
        } else {
            res.status(404).json({ message: 'Thread not found.' });
        }
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

const deleteThread = async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.id);
        if (thread) {
            await Post.deleteMany({ thread: thread._id }); // Delete all posts in the thread
            await thread.deleteOne();
            res.json({ message: 'Thread and all its posts have been deleted.' });
        } else {
            res.status(404).json({ message: 'Thread not found.' });
        }
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post) {
            await post.deleteOne();
            res.json({ message: 'Post deleted.' });
        } else {
            res.status(404).json({ message: 'Post not found.' });
        }
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};


module.exports = {
    getForums, createForum, deleteForum,
    getThreadsInForum, getThreadById, getLastThreadInForum, createThread,
    getPostsInThread, createPost, getRecentThreads, lockThread, deleteThread, deletePost };