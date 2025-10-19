document.addEventListener('DOMContentLoaded', () => {
    // Find all the category containers on the page
    const categoryContainers = document.querySelectorAll('.top-category');

    // This function fetches and displays the top torrents for a single category
    const loadTopTorrents = async (container) => {
        const category = container.dataset.category;
        const listElement = container.querySelector('.top-list');

        if (!category || !listElement) return;

        try {
            const res = await fetch(`/api/torrents/top?category=${category}`);
            if (!res.ok) {
                throw new Error(`Failed to fetch top ${category}`);
            }
            const torrents = await res.json();
            
            // Clear the "Loading..." message
            listElement.innerHTML = '';

            if (torrents.length === 0) {
                listElement.innerHTML = `<li>No torrents found in this category.</li>`;
                return;
            }

            // Display only the top 5 for a cleaner look
            const top5 = torrents.slice(0, 5);

            top5.forEach(torrent => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<a href="/torrent?id=${torrent._id}">${torrent.name}</a> (SE: ${torrent.seeders})`;
                listElement.appendChild(listItem);
            });

        } catch (error) {
            console.error(`Error loading ${category}:`, error);
            listElement.innerHTML = `<li style="color: red;">Could not load top torrents.</li>`;
        }
    };

    // --- Main Execution ---
    // Loop through each category container and load its data
    categoryContainers.forEach(container => {
        loadTopTorrents(container);
    });
});