const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db.js');
const userRoutes = require('./routes/userRoutes.js');
const torrentRoutes = require('./routes/torrentRoutes.js');
const forumRoutes = require('./routes/forumRoutes.js'); 
const threadRoutes = require('./routes/threadRoutes.js');


dotenv.config();

console.log('[SERVER START] MONGO_URI from .env:', process.env.MONGO_URI);

// Connect to the database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To accept JSON data in the body

// --- API Routes ---
app.use('/api/users', userRoutes);
app.use('/api/torrents', torrentRoutes);
app.use('/api/forums', forumRoutes);
app.use('/api/threads', threadRoutes)

// --- Serve Static Frontend & Uploads ---
// Make the 'uploads' folder static
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Serve the main frontend
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

const pagesPath = path.join(__dirname, '..', 'frontend', 'pages');
app.get('/', (req, res) => res.sendFile(path.join(pagesPath, 'home.html')));
const pages = ['about', 'forum', 'inner', 'login', 'policy', 'register', 'search', 'top', 'torrent', 'upload', 'thread-list', 'profile', 'recent', 'settings', 'api-access', 'contact', 'dmca', 'legal'];
pages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(pagesPath, `${page}.html`));
    });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});