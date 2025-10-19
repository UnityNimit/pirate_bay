document.addEventListener('DOMContentLoaded', () => {
    const forumTableBody = document.querySelector('#forum-table-body tbody');

    const fetchAndDisplayForums = async () => {
        try {
            const res = await fetch('/api/forums');
            if (!res.ok) throw new Error('Failed to fetch forums');
            const forums = await res.json();

            forumTableBody.innerHTML = ''; 

            forumTableBody.innerHTML += `<tr class="category-header"><td colspan="4">The Pirate Bay Community</td></tr>`;

            forums.forEach(forum => {
                let lastPostInfo = 'No recent posts.';
                
                // For our seeded data, the "General Discussion" forum has a sample thread ID
                if (forum.name === 'General Discussion' && forum.sampleThreadId) {
                    lastPostInfo = `
                        <a href="/inner?threadId=${forum.sampleThreadId}">Re: Site Downtime?</a><br>
                        by <a href="#">testuser</a>, Today
                    `;
                }
                
                const forumRowHTML = `
                    <tr>
                        <td>
                            <!-- This link will eventually go to a thread list page -->
                            <div class="forum-name"><a href="/thread-list?forumId=${forum._id}">${forum.name}</a></div>
                            <div class="forum-description">${forum.description}</div>
                        </td>
                        <td class="last-post-info">${lastPostInfo}</td>
                        <td class="stats-col">${forum.topics}</td>
                        <td class="stats-col">${forum.posts}</td>
                    </tr>
                `;
                forumTableBody.innerHTML += forumRowHTML;
            });

        } catch (error) {
            console.error('Error fetching forums:', error);
            forumTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Could not load forums.</td></tr>`;
        }
    };

    fetchAndDisplayForums();
});