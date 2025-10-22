document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const forumTitle = document.getElementById('forum-title');
    const forumBreadcrumb = document.getElementById('forum-breadcrumb-name');
    const tableBody = document.getElementById('thread-list-table-body');
    const createThreadContainer = document.getElementById('create-thread-container');
    const showThreadFormBtn = document.getElementById('show-thread-form-btn');
    const createThreadForm = document.getElementById('create-thread-form');
    const submitThreadBtn = document.getElementById('submit-thread-btn');
    const threadMessage = document.getElementById('thread-message');
    
    // --- GET DATA FROM URL & LOCALSTORAGE ---
    const params = new URLSearchParams(window.location.search);
    const forumId = params.get('forumId');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // --- INITIAL VALIDATION ---
    if (!forumId) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">No Forum ID was provided.</td></tr>';
        if (createThreadContainer) createThreadContainer.style.display = 'none';
        return;
    }

    // --- MAIN FUNCTION TO FETCH AND DISPLAY THREADS ---
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
                // Moderator Controls
                let modControls = '';
                if (userInfo && userInfo.role === 'moderator') {
                    modControls = `
                        <button class="lock-btn" data-id="${thread._id}" title="${thread.isLocked ? 'Unlock Thread' : 'Lock Thread'}">${thread.isLocked ? '🔓' : '🔒'}</button>
                        <button class="delete-btn" data-id="${thread._id}" title="Delete Thread">&times;</button>
                    `;
                }

                const lastPostInfo = thread.lastPost && thread.lastPost.user ? 
                    `by <a href="/profile?user=${thread.lastPost.user.username}">${thread.lastPost.user.username}</a><br>
                     on ${new Date(thread.lastPost.createdAt).toLocaleDateString()}`
                    : 'No replies yet.';

                const threadRow = `
                    <tr>
                        <td>
                            <div class="forum-name">
                                ${thread.isLocked ? '🔒' : ''} <a href="/inner?threadId=${thread._id}">${thread.title}</a>
                                <span class="mod-controls">${modControls}</span>
                            </div>
                            <div class="forum-description">by <a href="/profile?user=${thread.user.username}">${thread.user.username}</a></div>
                        </td>
                        <td class="stats-col">${thread.replyCount}</td>
                        <td class="stats-col">--</td>
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

    // --- EVENT LISTENERS (NORMAL USER + MODERATOR) ---
    // Show/Hide "Create Thread" form for logged-in users
    if (userInfo) {
        createThreadContainer.style.display = 'block';

        showThreadFormBtn.addEventListener('click', () => {
            createThreadForm.style.display = createThreadForm.style.display === 'none' ? 'block' : 'none';
        });

        submitThreadBtn.addEventListener('click', async () => {
            const title = document.getElementById('thread-title-input').value;
            const content = document.getElementById('thread-content-input').value;
            threadMessage.textContent = '';
            
            if (!title || !content) {
                threadMessage.textContent = 'Title and content are required.';
                threadMessage.style.display = 'block';
                return;
            }
            
            try {
                const res = await fetch(`/api/forums/${forumId}/threads`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userInfo.token}`,
                    },
                    body: JSON.stringify({ title, content }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                
                // Success! Redirect to the newly created thread's page
                window.location.href = `/inner?threadId=${data._id}`;
            } catch (error) {
                threadMessage.textContent = error.message;
                threadMessage.style.display = 'block';
            }
        });
    }

    // Event Delegation for Moderator Buttons
    document.getElementById('main-content').addEventListener('click', async (e) => {
        const target = e.target;

        // Ensure the click is on a button with a data-id
        if (!target.dataset.id || !userInfo || userInfo.role !== 'moderator') return;

        const threadId = target.dataset.id;

        // Handle Thread Deletion
        if (target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to PERMANENTLY delete this thread and all its posts?')) {
                try {
                    const res = await fetch(`/api/threads/${threadId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${userInfo.token}` },
                    });
                    if (!res.ok) throw new Error('Failed to delete thread.');
                    fetchThreads(); // Refresh the list
                } catch (error) {
                    alert(error.message);
                }
            }
        }
        
        // Handle Thread Locking/Unlocking
        if (target.classList.contains('lock-btn')) {
            try {
                const res = await fetch(`/api/threads/${threadId}/lock`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${userInfo.token}` },
                });
                if (!res.ok) throw new Error('Failed to toggle lock status.');
                fetchThreads(); // Refresh the list to show the new lock status
            } catch (error) {
                alert(error.message);
            }
        }
    });


    // --- INITIAL CALL ---
    fetchThreads();
});