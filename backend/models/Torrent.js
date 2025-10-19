const mongoose = require('mongoose');

const torrentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Movies', 'TV Shows', 'Games', 'Music', 'Applications', 'Other'],
  },
  size: {
    type: Number, // Stored in bytes
    required: true,
  },
  infoHash: { // This would be generated from the torrent file
    type: String,
    required: true,
    unique: true,
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // This creates a relationship to the User model
  },
  seeders: {
    type: Number,
    default: 0,
  },
  leechers: {
    type: Number,
    default: 0,
  },
  downloads: {
    type: Number,
    default: 0,
  },
  files: [{
    path: String,
    size: Number,
  }],

  torrentFilePath: {
    type: String,
    required: true,
  },
  imagePaths: [{ // An array to store paths of uploaded images
    type: String,
  }],
}, {
  timestamps: true,
});

const Torrent = mongoose.model('Torrent', torrentSchema);

module.exports = Torrent;