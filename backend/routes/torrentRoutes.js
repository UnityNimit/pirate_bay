const express = require('express');
const router = express.Router();
const { getTorrents, uploadTorrent, getTorrentById, getLuckyTorrent, getTopTorrents, trackDownload } = require('../controllers/torrentController.js');
const { protect } = require('../middleware/authMiddleware.js');
const multer = require('multer');
const path = require('path');

// --- Multer Storage Configuration ---
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Check file type to decide destination folder
    if (file.fieldname === 'images') {
      cb(null, 'uploads/images/');
    } else if (file.fieldname === 'torrentFile') {
      cb(null, 'uploads/torrents/');
    } else {
      cb({ message: 'Unexpected file field' }, false);
    }
  },
  filename(req, file, cb) {
    // Create a unique filename to avoid conflicts
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// --- API Routes ---
router.route('/').get(getTorrents);

router.route('/top').get(getTopTorrents);

router.route('/lucky').get(getLuckyTorrent);

router.route('/:id/track').post(trackDownload);


// The 'protect' middleware runs first, then multer, then the controller.
router.route('/upload').post(
  protect,
  upload.fields([
      { name: 'torrentFile', maxCount: 1 },
      { name: 'images', maxCount: 5 } // Allow up to 5 images
  ]),
  uploadTorrent
);




router.route('/:id').get(getTorrentById);

module.exports = router;