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
    // Important: Keep newline parsing for user-submitted content
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
  const { name, description } = req.body;
  try {
    const forum = await Forum.create({ name, description });
    res.status(201).json(forum);
  } catch (error) {
    console.error('Create Forum Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


const getThreadsInForum = async (req, res) => {
  try {
    const threads = await Thread.find({ forum: req.params.id })
      .sort({ updatedAt: -1 }) // Show most recently active threads first
      .populate('user', 'username');

    // Efficiently fetch stats for all threads at once
    const threadsWithStats = await Promise.all(threads.map(async (thread) => {
      const replyCount = await Post.countDocuments({ thread: thread._id });
      
      const lastPost = await Post.findOne({ thread: thread._id })
        .sort({ createdAt: -1 })
        .populate('user', 'username');

      return {
        ...thread.toObject(),
        replyCount: replyCount > 0 ? replyCount - 1 : 0, // A thread's "post count" is all posts, so replies = posts - 1
        lastPost: lastPost ? {
            user: lastPost.user,
            createdAt: lastPost.createdAt,
        } : null,
      };
    }));
    
    // We also need the Forum's name for the title
    const forum = await Forum.findById(req.params.id);

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

  try {
    const post = await Post.create({ thread: threadId, user, content });
    const populatedPost = await Post.findById(post._id).populate('user', 'username createdAt');
    res.status(201).json(populatedPost);
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

module.exports = {
  getForums, createForum,
  getThreadsInForum, getThreadById, getLastThreadInForum,
  getPostsInThread, createPost,
};