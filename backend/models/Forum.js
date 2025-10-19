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
  // We can add counts here later or calculate them on the fly
}, {
  timestamps: true,
});

const Forum = mongoose.model('Forum', forumSchema);

module.exports = Forum;