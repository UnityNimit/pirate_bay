document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const forumId = params.get('forumId');

    const forumTitle = document.getElementById('forum-title');
    const forumBreadcrumb = document.getElementById('forum-breadcrumb-name');
    const tableBody = document.querySelector('#thread-list-table tbody');

    if (!forumId) {
        tableBody.innerHTML = '<tr><td colspan="4">No Forum ID provided.</td></tr>';
        return;
    }

    const fetchThreads = async () => {
        try {
            const res = await fetch(`/api/forums/${forumId}/threads`);
            if (!res.ok) throw new Error('Could not fetch threads for this forum.');
            
            const data = await res.json();
            const forum = data.forum;
            const threads = data.threads;
            
            document.title = `${forum.name} - The Pirate Bay`;
            forumTitle.textContent = forum.name; 
            forumBreadcrumb.textContent = forum.name;

            tableBody.innerHTML = '';
            if (threads.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No threads have been created in this forum yet.</td></tr>';
                return;
            }

            threads.forEach(thread => {
                const lastPostInfo = thread.lastPost ? 
                    `by <a href="/profile?user=${thread.lastPost.user.username}">${thread.lastPost.user.username}</a><br>
                     on ${new Date(thread.lastPost.createdAt).toLocaleDateString()}`
                    : 'No replies yet.';

                const threadRow = `
                    <tr>
                        <td>
                            <div class="forum-name"><a href="/inner?threadId=${thread._id}">${thread.title}</a></div>
                            <div class="forum-description">by <a href="/profile?user=${thread.user.username}">${thread.user.username}</a></div>
                        </td>
                        <td class="stats-col">${thread.replyCount}</td>
                        <td class="stats-col">--</td> <!-- Views not implemented -->
                        <td class="last-post-info">
                            ${lastPostInfo}
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += threadRow;
            });
        } catch (error) {
            console.error(error);
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: red;">${error.message}</td></tr>`;
        }
    };

    fetchThreads();
});