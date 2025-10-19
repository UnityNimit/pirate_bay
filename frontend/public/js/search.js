document.addEventListener('DOMContentLoaded', () => {
    // 1. Check the URL for a search query
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q'); // Gets the value of 'q' from "?q=value"

    const searchInfoSpan = document.getElementById('search-info');
    
    // Update the title based on whether it's a search or not
    if (query) {
        searchInfoSpan.textContent = `Search results for: "${query}"`;
    } else {
        searchInfoSpan.textContent = 'All Torrents';
    }

    const fetchAndDisplayTorrents = async () => {
        const tableBody = document.querySelector('#searchResult tbody');
        
        // 2. Build the correct API URL
        let apiUrl = '/api/torrents';
        if (query) {
            apiUrl = `/api/torrents?q=${query}`; // Append the search query to the API call
        }

        try {
            const res = await fetch(apiUrl); // Use the dynamically built URL
            if (!res.ok) {
                throw new Error('Failed to fetch torrents');
            }
            const torrents = await res.json();

            console.log(`[BROWSER LOG] Received ${torrents.length} torrents from the backend.`);

            tableBody.innerHTML = ''; 

            if (torrents.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No torrents found for "${query}".</td></tr>`;
                return;
            }

            // 3. Display the results (this part is the same as before)
            torrents.forEach((torrent, index) => {
                const rowClass = index % 2 === 1 ? 'alt-row' : '';
                const torrentRowHTML = `
                    <tr class="${rowClass}">
                        <td><a href="/torrent?id=${torrent._id}">${torrent.category}</a></td>
                        <td>
                            <div class="detName"><a href="/torrent?id=${torrent._id}">${torrent.name}</a></div>
                            <div class="detDesc">
                                Uploaded ${new Date(torrent.createdAt).toLocaleDateString()}, 
                                Size ${formatBytes(torrent.size)}, 
                                ULed by <a href="/profile?user=${torrent.uploader.username}">${torrent.uploader.username}</a>
                            </div>
                        </td>
                        <td class="col-se">${torrent.seeders}</td>
                        <td class="col-le">${torrent.leechers}</td>
                    </tr>
                `;
                tableBody.innerHTML += torrentRowHTML;
            });

        } catch (error) {
            console.error('Error fetching torrents:', error);
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Could not load torrents.</td></tr>';
        }
    };

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    fetchAndDisplayTorrents();
});