const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  forum: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  user: { // The user who started the thread
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // We can add a 'views' count, 'lastPostDate' later if needed
}, {
  timestamps: true,
});

const Thread = mongoose.model('Thread', threadSchema);

module.exports = Thread;