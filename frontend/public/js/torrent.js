document.addEventListener('DOMContentLoaded', () => {
    // 1. Get the torrent ID from the URL query string
    const params = new URLSearchParams(window.location.search);
    const torrentId = params.get('id');

    const loggedInUser = JSON.parse(localStorage.getItem('userInfo'));

    if (!torrentId) {
        document.getElementById('main-content').innerHTML = '<h1 style="text-align: center;">Torrent ID is missing.</h1>';
        return;
    }

    // A list of public, open trackers to make the magnet link functional
    const trackers = [
        'udp://tracker.openbittorrent.com:80',
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://tracker.coppersurfer.tk:6969/announce',
        'udp://9.rarbg.to:2920/announce',
        'udp://9.rarbg.me:2780/announce',
    ];
    const trackerQueryString = trackers.map(t => `tr=${encodeURIComponent(t)}`).join('&');


    // 2. Main function to fetch the specific torrent data from the API
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
            document.getElementById('main-content').innerHTML = `<h1 style="text-align: center;">Error: ${error.message}</h1>`;
        }
    };

    // 3. Main function to populate the HTML with the fetched data
    const displayTorrentDetails = (torrent) => {
        // Update page title
        document.title = `${torrent.name} - The Pirate Bay`;
        
        // Populate Details Info Box
        document.getElementById('details-title').textContent = torrent.name;
        
        const detailsInfo = document.getElementById('details-info');
        detailsInfo.innerHTML = `
            <div class="info-col">
                <dl>
                    <dt>Type:</dt><dd><a href="/search?categories=${torrent.category}">${torrent.category}</a></dd>
                    <dt>Files:</dt><dd>${torrent.files.length}</dd>
                    <dt>Size:</dt><dd>${formatBytes(torrent.size)}</dd>
                </dl>
            </div>
            <div class="info-col">
                <dl>
                    <dt>Uploaded:</dt><dd>${new Date(torrent.createdAt).toUTCString()}</dd>
                    <dt>By:</dt><dd><a href="#">${torrent.uploader ? torrent.uploader.username : 'Anonymous'}</a></dd>
                    <dt>Seeders:</dt><dd>${torrent.seeders}</dd>
                    <dt>Leechers:</dt><dd>${torrent.leechers}</dd>
                    <dt>Downloads:</dt><dd>${torrent.downloads || 0}</dd>
                </dl>
            </div>
        `;

        document.querySelector('#info-hash span').textContent = torrent.infoHash.toUpperCase();
        
        // Populate Description
        document.getElementById('description').textContent = torrent.description;

        // Populate File List
        const fileListTitle = document.getElementById('file-list-title');
        const fileListFrame = document.getElementById('file-list-frame');
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

        // Create and configure the smart download button
        const actionLinksContainer = document.getElementById('action-links-container');
        const magnetLink = `magnet:?xt=urn:btih:${torrent.infoHash}&dn=${encodeURIComponent(torrent.name)}&${trackerQueryString}`;
        
        const downloadButton = document.createElement('a');
        downloadButton.innerHTML = `<img src="/images/house.png" alt="Get Torrent Icon">GET THIS TORRENT`;
        downloadButton.href = "#"; 
        
        actionLinksContainer.innerHTML = ''; // Clear "Preparing..." message
        actionLinksContainer.appendChild(downloadButton);

        downloadButton.addEventListener('click', async (e) => {
            e.preventDefault();
            downloadButton.textContent = 'Preparing download...';

            try {
                await fetch(`/api/torrents/${torrentId}/track`, { method: 'POST' });
            } catch (error) {
                console.error("Couldn't track download, but proceeding anyway:", error);
            }

            window.location.href = magnetLink;

            setTimeout(() => {
                downloadButton.innerHTML = `<img src="/images/house.png" alt="Get Torrent Icon">GET THIS TORRENT`;
            }, 1500);
        });


         // Check if user has bookmarked this torrent
    let isBookmarked = false;
    if (loggedInUser && loggedInUser.bookmarkedTorrents && loggedInUser.bookmarkedTorrents.includes(torrent._id)) {
        isBookmarked = true;
    }
    renderBookmarkButton(torrent._id, isBookmarked);
};



const renderBookmarkButton = (torrentId, isBookmarked) => {
    const container = document.getElementById('bookmark-btn-container');
    if (!loggedInUser) {
        container.innerHTML = '<p><a href="/login">Log in</a> to bookmark this torrent.</p>';
        return;
    }

    if (isBookmarked) {
        container.innerHTML = `<button id="bookmark-btn" class="unbookmark">Remove Bookmark</button>`;
    } else {
        container.innerHTML = `<button id="bookmark-btn" class="bookmark">Bookmark this Torrent</button>`;
    }

    document.getElementById('bookmark-btn').addEventListener('click', async () => {
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
                loggedInUser.bookmarkedTorrents.push(torrentId);
            }
            localStorage.setItem('userInfo', JSON.stringify(loggedInUser));

            // Toggle the button state
            renderBookmarkButton(torrentId, !isBookmarked);
        } catch (error) {
            console.error('Bookmark error:', error);
        }
    });
};

    
    // 4. Repeated helper function to format file sizes
    function formatBytes(bytes, decimals = 2) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // 5. Initial call to start the process
    fetchTorrentDetails();
});