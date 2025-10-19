document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('home-search-form');
    const luckyBtn = document.getElementById('lucky-btn');

    // --- Handle Standard Search Form Submission ---
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Stop the default submission

        const query = searchForm.querySelector('input[name="q"]').value;
        const checkedBoxes = searchForm.querySelectorAll('input[name="category"]:checked');

        let categories = [];
        checkedBoxes.forEach(box => {
            categories.push(box.value);
        });

        // Build the query string
        const params = new URLSearchParams();
        if (query) {
            params.append('q', query);
        }
        if (categories.length > 0) {
            params.append('categories', categories.join(','));
        }

        // Redirect to the search page with the correct query parameters
        window.location.href = `/search?${params.toString()}`;
    });

    // --- Handle "I'm Feeling Lucky" Button Click ---
    luckyBtn.addEventListener('click', async () => {
        const query = searchForm.querySelector('input[name="q"]').value;
        if (!query) {
            alert('Please enter a search term to feel lucky!');
            return;
        }

        try {
            const res = await fetch(`/api/torrents/lucky?q=${query}`);
            const data = await res.json();

            if (res.ok) {
                // Redirect to the torrent's detail page
                window.location.href = `/torrent?id=${data._id}`;
            } else {
                alert(data.message || 'Could not find a lucky torrent.');
            }
        } catch (error) {
            console.error('Lucky search failed:', error);
            alert('An error occurred during the lucky search.');
        }
    });
});