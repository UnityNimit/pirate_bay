const Torrent = require('../models/Torrent.js');
const fs = require('fs');
const parseTorrent = require('parse-torrent');

// @desc    Get all torrents
// @route   GET /api/torrents
// @access  Public
const getTorrents = async (req, res) => {
  try {
    const queryFilter = {};

    // Handle keyword search
    if (req.query.q) {
      queryFilter.name = {
        $regex: req.query.q,
        $options: 'i',
      };
    }
    
    // Handle category search
    if (req.query.categories) {
      const categories = req.query.categories.split(','); // 'Video,Games' -> ['Video', 'Games']
      queryFilter.category = { $in: categories };
    }

    const torrents = await Torrent.find(queryFilter).populate('uploader', 'username');
    
    console.log(`[API LOG] Found ${torrents.length} torrents. Sending to frontend.`);

    res.json(torrents);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const uploadTorrent = async (req, res) => {
  const { description, category } = req.body;
  const uploader = req.user._id;
  const torrentFile = req.files.torrentFile ? req.files.torrentFile[0] : null;
  const imageFiles = req.files.images || [];

  if (!torrentFile) {
    return res.status(400).json({ message: 'A .torrent file is required.' });
  }

  try {
    // 1. Read the uploaded .torrent file from its temporary path
    const torrentData = fs.readFileSync(torrentFile.path);

    // 2. Parse the torrent file to get its metadata
    const parsed = parseTorrent(torrentData);

    const name = parsed.name; // Get the REAL name from the torrent file
    const infoHash = parsed.infoHash; // Get the REAL infoHash
    const size = parsed.length || 0; // Get the total size of files
    const files = parsed.files ? parsed.files.map(f => ({ path: f.path, size: f.length })) : [{ path: name, size }];

    // 3. Check if a torrent with this infoHash already exists to prevent duplicates
    const torrentExists = await Torrent.findOne({ infoHash: infoHash });
    if (torrentExists) {
        // We should delete the newly uploaded file since it's a duplicate
        fs.unlinkSync(torrentFile.path); 
        return res.status(400).json({ message: 'This torrent has already been uploaded.' });
    }

    const imagePaths = imageFiles.map(file => file.path);

    // 4. Create the new torrent document with the REAL metadata
    const torrent = new Torrent({
      name,
      description,
      category,
      size,
      infoHash,
      files, // Store the file list
      uploader,
      torrentFilePath: torrentFile.path,
      imagePaths: imagePaths,
    });

    const createdTorrent = await torrent.save();
    res.status(201).json(createdTorrent);

  } catch (error) {
    console.error('Upload Error:', error);
    // Clean up uploaded file on error
    if (torrentFile && fs.existsSync(torrentFile.path)) {
        fs.unlinkSync(torrentFile.path);
    }
    res.status(500).json({ message: 'Server Error during torrent processing. The .torrent file might be invalid.' });
  }
};


const getTorrentById = async (req, res) => {
  try {
    const torrent = await Torrent.findById(req.params.id).populate('uploader', 'username');

    if (torrent) {
      res.json(torrent);
    } else {
      res.status(404).json({ message: 'Torrent not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const getLuckyTorrent = async (req, res) => {
    try {
        const keyword = req.query.q ? { name: { $regex: req.query.q, $options: 'i' } } : {};
        
        // --- THIS IS THE CORRECTED QUERY ---
        // We find all matches, sort by seeders descending, and limit to the first result.
        const torrents = await Torrent.find(keyword).sort({ seeders: -1 }).limit(1);
        // ------------------------------------

        if (torrents && torrents.length > 0) {
            // The result is an array, so we send the first element
            res.json(torrents[0]);
        } else {
            res.status(404).json({ message: 'No torrents found matching your criteria.' });
        }
    } catch (error) {
        console.error('Lucky Search Error:', error); // Added a more specific log for future debugging
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get top torrents, optionally by category
// @route   GET /api/torrents/top?category=Games
// @access  Public
const getTopTorrents = async (req, res) => {
  try {
    const filter = req.query.category ? { category: req.query.category } : {};
    const torrents = await Torrent.find(filter)
      .sort({ seeders: -1 })
      .limit(100)
      .populate('uploader', 'username');
    res.json(torrents);
  } catch (error) {
    console.error('Get Top Torrents Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Track a download and update peer stats
// @route   POST /api/torrents/:id/track
// @access  Public
const trackDownload = async (req, res) => {
  try {
    // We use $inc to atomically increment the values in the database.
    // This is very efficient and prevents race conditions.
    const torrent = await Torrent.findByIdAndUpdate(
      req.params.id,
      { 
        $inc: { downloads: 1, leechers: 1 } 
      },
      { new: true } // This option returns the updated document
    );

    if (torrent) {
      res.json({ message: 'Download tracked successfully.' });
    } else {
      res.status(404).json({ message: 'Torrent not found.' });
    }
  } catch (error) {
    console.error('Track Download Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getTorrents, uploadTorrent, getTorrentById, getLuckyTorrent, getTopTorrents, trackDownload };