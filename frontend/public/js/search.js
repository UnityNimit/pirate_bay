document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    const categories = params.get('categories');
    const page = parseInt(params.get('page')) || 1; // Get page from URL, default to 1

    const searchInfoSpan = document.getElementById('search-info');
    const resultsCountSpan = document.getElementById('results-count');
    const tableBody = document.getElementById('search-results-body');
    const searchBox = document.getElementById('searchBox');

    // Pre-fill the search box with the current query
    if (query && searchBox) {
        searchBox.value = query;
    }
    
    // Update the title bar
    if (query) {
        searchInfoSpan.textContent = `Search results for: "${query}"`;
    } else if (categories) {
        searchInfoSpan.textContent = `Browsing category: ${categories}`;
    } else {
        searchInfoSpan.textContent = 'All Torrents';
    }

    const fetchAndDisplayTorrents = async (currentPage) => {
        try {
            // Build the API URL with all parameters
            const apiParams = new URLSearchParams({ page: currentPage });
            if (query) apiParams.append('q', query);
            if (categories) apiParams.append('categories', categories);
            
            const res = await fetch(`/api/torrents?${apiParams.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch torrents');
            
            const data = await res.json();
            const { torrents, totalPages, totalTorrents } = data;

            resultsCountSpan.textContent = `(Approx. ${totalTorrents} results found)`;
            tableBody.innerHTML = ''; 

            if (torrents.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No torrents found matching your criteria.</td></tr>`;
                return;
            }

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

            displayPagination(currentPage, totalPages);

        } catch (error) {
            console.error('Error fetching torrents:', error);
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Could not load torrents.</td></tr>';
        }
    };

    const displayPagination = (currentPage, totalPages) => {
        const paginationContainerTop = document.getElementById('pagination-container-top');
        const paginationContainerBottom = document.getElementById('pagination-container-bottom');
        
        
        paginationContainerTop.innerHTML = '';
        paginationContainerBottom.innerHTML = '';
        if (totalPages <= 1) return;

        let paginationHTML = '';
        
        // Simple pagination: show first, last, current, and nearby pages
        const pagesToShow = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
        
        let lastPage = 0;
        for (let i = 1; i <= totalPages; i++) {
            if (pagesToShow.has(i)) {
                if (i - lastPage > 1) {
                    paginationHTML += `<span>... </span>`;
                }
                if (i === currentPage) {
                    paginationHTML += `<b>${i}</b> `;
                } else {
                    paginationHTML += `<a href="#" class="page-link" data-page="${i}">${i}</a> `;
                }
                lastPage = i;
            }
        }
        paginationContainerTop.innerHTML = paginationHTML;
        paginationContainerBottom.innerHTML = paginationHTML;
    };

    // paging\\\\
    document.getElementById('main-content').addEventListener('click', (e) => {
        if (e.target.classList.contains('page-link')) {
            e.preventDefault();
            const newPage = e.target.dataset.page;
            
            const newParams = new URLSearchParams(window.location.search);
            newParams.set('page', newPage);
            window.history.pushState({}, '', `${window.location.pathname}?${newParams.toString()}`);
            
            // Fetch data for the new page
            fetchAndDisplayTorrents(parseInt(newPage));
        }
    });

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    fetchAndDisplayTorrents(page);
});