const Torrent = require('../models/Torrent.js');
const fs = require('fs');
const parseTorrent = require('parse-torrent');
const mongoose = require('mongoose'); // Import mongoose to check for valid ObjectIds


// --- HELPER FUNCTION to check for valid ObjectId ---
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getTorrents = async (req, res) => {
  try {
    const TORRENTS_PER_PAGE = 100; // Define how many torrents per page
    const page = parseInt(req.query.page) || 1;

    const queryFilter = {};
    if (req.query.q) {
      queryFilter.name = { $regex: req.query.q, $options: 'i' };
    }
    if (req.query.categories) {
      const categories = req.query.categories.split(',');
      queryFilter.category = { $in: categories };
    }

    const totalTorrents = await Torrent.countDocuments(queryFilter);

    const torrents = await Torrent.find(queryFilter)
      .populate('uploader', 'username')
      .sort({ seeders: -1 }) // Sort by most popular by default
      .skip((page - 1) * TORRENTS_PER_PAGE)
      .limit(TORRENTS_PER_PAGE);
    
    res.json({
        torrents: torrents,
        currentPage: page,
        totalPages: Math.ceil(totalTorrents / TORRENTS_PER_PAGE),
        totalTorrents: totalTorrents
    });
  } catch (error) {
    console.error("Get Torrents Error:", error);
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
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid Torrent ID format.' });
    }
    // FIX: Populate both _id and username for the uploader
    const torrent = await Torrent.findById(req.params.id).populate('uploader', '_id username');
    if (torrent) {
      res.json(torrent);
    } else {
      res.status(404).json({ message: 'Torrent not found' });
    }
  } catch (error) {
    console.error("Get Torrent By ID Error:", error);
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

const getRecentTorrents = async (req, res) => {
    try {
        const torrents = await Torrent.find({})
            .sort({ createdAt: -1 })
            .limit(50)
            // FIX: Populate both _id and username for the uploader
            .populate('uploader', '_id username');

        const validTorrents = torrents.filter(torrent => torrent.uploader !== null);

        res.json(validTorrents);
    } catch (error) {
        console.error("Get Recent Torrents Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getTorrents, uploadTorrent, getTorrentById, getLuckyTorrent, getTopTorrents, trackDownload, getRecentTorrents };