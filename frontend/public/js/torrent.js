document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const mainContent = document.getElementById('main-content');
    const pageTitle = document.getElementById('page-title');
    const detailsTitle = document.getElementById('details-title');
    const detailsInfo = document.getElementById('details-info');
    const infoHashSpan = document.getElementById('info-hash-span');
    const descriptionPre = document.getElementById('description');
    const fileListTitle = document.getElementById('file-list-title');
    const fileListFrame = document.getElementById('file-list-frame');
    const actionLinksContainer = document.getElementById('action-links-container');
    const bookmarkBtnContainer = document.getElementById('bookmark-btn-container');

    // --- GET DATA FROM URL & LOCALSTORAGE ---
    const params = new URLSearchParams(window.location.search);
    const torrentId = params.get('id');
    const loggedInUser = JSON.parse(localStorage.getItem('userInfo'));

    // A list of public, open trackers to make the magnet link functional
    const trackers = [
        'udp://tracker.openbittorrent.com:80',
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://tracker.coppersurfer.tk:6969/announce',
        'udp://9.rarbg.to:2920/announce',
        'udp://9.rarbg.me:2780/announce',
    ];
    const trackerQueryString = trackers.map(t => `tr=${encodeURIComponent(t)}`).join('&');

    // --- INITIAL VALIDATION ---
    if (!torrentId) {
        mainContent.innerHTML = '<h1 style="text-align: center;">Torrent ID is missing.</h1>';
        return;
    }

    // --- MAIN DATA FETCHING LOGIC ---
    const fetchTorrentDetails = async () => {
        try {
            const res = await fetch(`/api/torrents/${torrentId}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Torrent not found');
            }
            const torrent = await res.json();
            displayTorrentDetails(torrent);
        } catch (error) {
            console.error('Failed to fetch torrent details:', error);
            mainContent.innerHTML = `<h1 style="text-align: center;">Error: ${error.message}</h1>`;
        }
    };

    // --- DISPLAY ALL TORRENT DETAILS ---
    const displayTorrentDetails = (torrent) => {
        // Update page title
        pageTitle.textContent = `${torrent.name} - The Pirate Bay`;
        
        // Populate Details Info Box
        detailsTitle.textContent = torrent.name;
        
        detailsInfo.innerHTML = `
            <div class="info-col">
                <dl>
                    <dt>Type:</dt><dd><a href="/search?categories=${torrent.category}">${torrent.category}</a></dd>
                    <dt>Files:</dt><dd>${torrent.files ? torrent.files.length : 0}</dd>
                    <dt>Size:</dt><dd>${formatBytes(torrent.size)}</dd>
                </dl>
            </div>
            <div class="info-col">
                <dl>
                    <dt>Uploaded:</dt><dd>${new Date(torrent.createdAt).toUTCString()}</dd>
                    <dt>By:</dt><dd><a href="/profile?user=${torrent.uploader ? torrent.uploader.username : 'Anonymous'}">${torrent.uploader ? torrent.uploader.username : 'Anonymous'}</a></dd>
                    <dt>Seeders:</dt><dd>${torrent.seeders}</dd>
                    <dt>Leechers:</dt><dd>${torrent.leechers}</dd>
                    <dt>Downloads:</dt><dd>${torrent.downloads || 0}</dd>
                </dl>
            </div>
        `;

        infoHashSpan.textContent = torrent.infoHash.toUpperCase();
        
        // Populate Description
        descriptionPre.textContent = torrent.description;

        // Populate File List
        if (torrent.files && torrent.files.length > 0) {
            fileListTitle.textContent = `Files (${torrent.files.length})`;
            let fileListHTML = '';
            torrent.files.forEach(file => {
                fileListHTML += `<div><span>${file.path}</span><span>${formatBytes(file.size)}</span></div>`;
            });
            fileListFrame.innerHTML = fileListHTML;
        } else {
            fileListFrame.innerHTML = '<div>No file information available.</div>';
        }

        // --- ACTION BAR LOGIC ---
        actionLinksContainer.innerHTML = ''; // Clear "Preparing..." message
        const magnetLink = `magnet:?xt=urn:btih:${torrent.infoHash}&dn=${encodeURIComponent(torrent.name)}&${trackerQueryString}`;
        const downloadLink = document.createElement('a');
        downloadLink.className = 'download-link';
        downloadLink.innerHTML = `<img src="/images/house.png" alt="Get Torrent Icon">GET THIS TORRENT`;
        downloadLink.href = "#"; 
        
        downloadLink.addEventListener('click', async (e) => {
            e.preventDefault();
            downloadLink.textContent = 'Preparing download...';
            try {
                await fetch(`/api/torrents/${torrentId}/track`, { method: 'POST' });
            } catch (error) {
                console.error("Couldn't track download, but proceeding anyway:", error);
            }
            window.location.href = magnetLink;
            setTimeout(() => {
                downloadLink.innerHTML = `<img src="/images/house.png" alt="Get Torrent Icon">GET THIS TORRENT`;
            }, 1500);
        });
        actionLinksContainer.appendChild(downloadLink);

        // --- RENDER THE BOOKMARK BUTTON ---
        if (loggedInUser) {
            let isBookmarked = loggedInUser.bookmarkedTorrents?.includes(torrent._id);
            renderBookmarkButton(torrent._id, isBookmarked);
        } else {
            bookmarkBtnContainer.innerHTML = '<p><a href="/login">Log in</a> to bookmark this torrent.</p>';
        }
    };

    // --- BOOKMARK BUTTON RENDER & LOGIC (SIMPLE TEXT VERSION) ---
    const renderBookmarkButton = (torrentId, isBookmarked) => {
        bookmarkBtnContainer.innerHTML = ''; // Clear previous content
        
        const button = document.createElement('button');
        button.id = 'bookmark-btn';

        if (isBookmarked) {
            button.className = 'bookmarked';
            button.textContent = '★ Bookmarked';
        } else {
            button.className = '';
            button.textContent = '☆ Bookmark this Torrent';
        }

        button.addEventListener('click', async () => {
            const method = isBookmarked ? 'DELETE' : 'PUT';
            try {
                const res = await fetch(`/api/users/bookmarks/${torrentId}`, {
                    method,
                    headers: { 'Authorization': `Bearer ${loggedInUser.token}` }
                });
                if (!res.ok) throw new Error('Action failed');
                
                // Update the user's bookmarks in localStorage for instant UI feedback
                if (isBookmarked) {
                    loggedInUser.bookmarkedTorrents = loggedInUser.bookmarkedTorrents.filter(id => id !== torrentId);
                } else {
                    if (!loggedInUser.bookmarkedTorrents) loggedInUser.bookmarkedTorrents = [];
                    loggedInUser.bookmarkedTorrents.push(torrentId);
                }
                localStorage.setItem('userInfo', JSON.stringify(loggedInUser));

                // Re-render the button to show the new state
                renderBookmarkButton(torrentId, !isBookmarked);
            } catch (error) {
                console.error('Bookmark error:', error);
                alert('An error occurred. Please try again.');
            }
        });

        bookmarkBtnContainer.appendChild(button);
    };
    
    // --- HELPER FUNCTION to format file sizes ---
    function formatBytes(bytes, decimals = 2) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // --- INITIAL CALL to start the process ---
    fetchTorrentDetails();
});