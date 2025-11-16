document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('recent-torrents-body');

    const fetchRecentTorrents = async () => {
        try {
            const res = await fetch('/api/torrents/recent');
            if (!res.ok) throw new Error('Could not load recent torrents from the API.');
            
            const torrents = await res.json();
            
            console.log("Data received from /api/torrents/recent:", torrents);
            
            tableBody.innerHTML = '';
            if (torrents.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No recent torrents found.</td></tr>';
                return;
            }

            torrents.forEach((torrent, index) => {
                const rowClass = index % 2 === 1 ? 'alt-row' : '';
                const formattedSize = formatBytes(torrent.size); 
                
                const uploaderName = torrent.uploader?.username || 'Anonymous';
                const uploaderLink = torrent.uploader ? `<a href="/profile?user=${uploaderName}">${uploaderName}</a>` : uploaderName;

                const torrentRowHTML = `
                    <tr class="${rowClass}">
                        <td><a href="/torrent?id=${torrent._id}">${torrent.category}</a></td>
                        <td>
                            <div class="detName"><a href="/torrent?id=${torrent._id}">${torrent.name}</a></div>
                            <div class="detDesc">
                                Uploaded ${new Date(torrent.createdAt).toLocaleString()}, 
                                Size ${formattedSize},
                                ULed by ${uploaderLink}
                            </div>
                        </td>
                        <td class="col-se">${torrent.seeders}</td>
                        <td class="col-le">${torrent.leechers}</td>
                    </tr>
                `;
                tableBody.innerHTML += torrentRowHTML;
            });
        } catch (error) {
            console.error('Error during torrent display:', error); // More specific error log
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Could not display recent torrents. There might be a scripting error. (Check console for details)</td></tr>`;
        }
    };

    function formatBytes(bytes, decimals = 2) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    fetchRecentTorrents();
});