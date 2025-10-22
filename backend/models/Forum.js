const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['forum', 'faq', 'guide'],
    default: 'forum',
  }
}, { timestamps: true });

const Forum = mongoose.model('Forum', forumSchema);

module.exports = Forum;