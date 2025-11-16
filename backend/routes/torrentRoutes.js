const express = require('express');
const router = express.Router();
const { 
    getTorrents, 
    uploadTorrent, 
    getTorrentById, 
    getLuckyTorrent, 
    getTopTorrents, 
    getRecentTorrents, 
    trackDownload 
} = require('../controllers/torrentController.js');
const { protect } = require('../middleware/authMiddleware.js');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    if (file.fieldname === 'images') {
      cb(null, 'uploads/images/');
    } else if (file.fieldname === 'torrentFile') {
      cb(null, 'uploads/torrents/');
    } else {
      cb({ message: 'Unexpected file field' }, false);
    }
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// 1. General and specific routes first.
router.route('/').get(getTorrents);
router.route('/recent').get(getRecentTorrents);
router.route('/top').get(getTopTorrents);
router.route('/lucky').get(getLuckyTorrent);

// 2. Protected upload route.
router.route('/upload').post(protect, upload.fields([
    { name: 'torrentFile', maxCount: 1 },
    { name: 'images', maxCount: 5 }
]), uploadTorrent);

// 3. Parameterized routes MUST be last. This ensures that Express checks for '/recent', '/top', etc BEFORE it assumes the path segment is an ID.
router.route('/:id/track').post(trackDownload);
router.route('/:id').get(getTorrentById);

module.exports = router;