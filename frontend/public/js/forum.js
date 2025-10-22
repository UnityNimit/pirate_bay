document.addEventListener('DOMContentLoaded', () => {
    const faqTableBody = document.getElementById('faq-table-body');
    const guideTableBody = document.getElementById('guide-table-body');
    const forumTableBody = document.getElementById('forum-table-body');
    const createForumContainer = document.getElementById('create-forum-container');
    const createForumForm = document.getElementById('create-forum-form');
    const forumMessage = document.getElementById('forum-message');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // --- THIS IS THE FIX ---
    // Show the "Create Forum" form ONLY if the user is a moderator
    if (userInfo && userInfo.role === 'moderator') {
        createForumContainer.style.display = 'block';
    }
    // --- END OF FIX ---

    const fetchAndDisplayForums = async () => {
        try {
            const res = await fetch('/api/forums');
            if (!res.ok) throw new Error('Failed to fetch forums');
            const allForums = await res.json();

            faqTableBody.innerHTML = '';
            guideTableBody.innerHTML = '';
            forumTableBody.innerHTML = '';

            const faqs = allForums.filter(f => f.type === 'faq');
            const guides = allForums.filter(f => f.type === 'guide');
            const forums = allForums.filter(f => f.type === 'forum');

            displaySimpleList(faqTableBody, faqs);
            displaySimpleList(guideTableBody, guides);
            displayFullList(forumTableBody, forums);

        } catch (error) {
            forumTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Could not load forums.</td></tr>`;
        }
    };

    const displaySimpleList = (tbody, list) => {
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td>No items in this section yet.</td></tr>';
            return;
        }
        list.forEach(item => {
            const rowHTML = `
                <tr>
                    <td>
                        <div class="forum-name"><a href="/thread-list?forumId=${item._id}">${item.name}</a></div>
                        <div class="forum-description">${item.description}</div>
                    </td>
                </tr>
            `;
            tbody.innerHTML += rowHTML;
        });
    };
    
    const displayFullList = (tbody, list) => {
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No community forums have been created yet.</td></tr>';
            return;
        }
        list.forEach(forum => {
            // --- THIS IS THE FIX ---
            // The delete button is now only added if the user is a moderator
            const deleteButton = (userInfo && userInfo.role === 'moderator') ? `<button class="delete-btn" data-id="${forum._id}">&times;</button>` : '';
            // --- END OF FIX ---
            
            const rowHTML = `
                <tr>
                    <td>
                        <div class="forum-name"><a href="/thread-list?forumId=${forum._id}">${forum.name}</a> ${deleteButton}</div>
                        <div class="forum-description">${forum.description}</div>
                    </td>
                    <td class="last-post-info">...</td>
                    <td class="stats-col">${forum.topics}</td>
                    <td class="stats-col">${forum.posts}</td>
                </tr>
            `;
            tbody.innerHTML += rowHTML;
        });
    };

    // --- HANDLE CREATE FORUM FORM ---
    createForumForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('forum-name').value;
        const description = document.getElementById('forum-description').value;
        forumMessage.style.display = 'none';

        try {
            const res = await fetch('/api/forums', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`,
                },
                body: JSON.stringify({ name, description, type: 'forum' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            createForumForm.reset();
            fetchAndDisplayForums();
        } catch (error) {
            forumMessage.textContent = error.message;
            forumMessage.style.display = 'block';
        }
    });

    // --- HANDLE DELETE BUTTON CLICKS (Event Delegation) ---
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const forumId = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this forum? This cannot be undone.')) {
                try {
                    const res = await fetch(`/api/forums/${forumId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${userInfo.token}` },
                    });
                    if (!res.ok) throw new Error('Failed to delete forum.');
                    fetchAndDisplayForums();
                } catch (error) {
                    alert(error.message);
                }
            }
        }
    });

    fetchAndDisplayForums();
});