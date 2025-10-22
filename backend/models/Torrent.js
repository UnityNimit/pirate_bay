const mongoose = require('mongoose');

const torrentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  
  // --- THIS IS THE FIX ---
  category: {
    type: String,
    required: true,
    enum: ['Audio', 'Video', 'Applications', 'Games', 'Adult', 'Misc'],
  },
  // --- END OF FIX ---

  size: { type: Number, required: true },
  infoHash: { type: String, required: true, unique: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  seeders: { type: Number, default: 0 },
  leechers: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  files: [{ path: String, size: Number }],
  torrentFilePath: { type: String, required: true },
  imagePaths: [{ type: String }],
}, {
  timestamps: true,
});

const Torrent = mongoose.model('Torrent', torrentSchema);
module.exports = Torrent;