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

// --- EJS Template Engine Setup ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'pages'));


// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To accept JSON data in the body


// --- API Routes ---
app.use('/api/users', userRoutes);
app.use('/api/torrents', torrentRoutes);
app.use('/api/forums', forumRoutes);
app.use('/api/threads', threadRoutes);


// --- Serve Static Files ---
// Make the 'uploads' folder publicly accessible
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
// Serve the main frontend assets (css, js, images) from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));


// --- Frontend Page Rendering ---
// This section replaces the old res.sendFile() logic

// Home page route
app.get('/', (req, res) => {
    res.render('home');
});

// An array of all other page names
const pages = [
    'about', 'forum', 'inner', 'login', 'policy', 'register',
    'search', 'top', 'torrent', 'upload', 'thread-list', 'profile',
    'recent', 'settings', 'api-access', 'contact', 'dmca', 'legal'
];

// Dynamically create routes for each page
pages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        // The render function looks for a file with the corresponding name in the 'views' directory
        // e.g., '/about' will render 'about.ejs'
        res.render(page);
    });
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});