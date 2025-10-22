document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const pageTitle = document.getElementById('page-title');
    const breadcrumbForumLink = document.getElementById('breadcrumb-forum-link');
    const threadForumNameSpan = document.getElementById('thread-forum-name');
    const threadTitleH1 = document.getElementById('thread-title');
    const postsContainer = document.getElementById('posts-container');
    const paginationContainerTop = document.getElementById('pagination-container-top');
    const paginationContainerBottom = document.getElementById('pagination-container-bottom');
    const replyTextarea = document.getElementById('reply-textarea');
    const submitReplyBtn = document.getElementById('submit-reply-btn');
    const replyMessageDiv = document.getElementById('reply-message');
    
    // --- GET DATA FROM URL & LOCALSTORAGE ---
    const params = new URLSearchParams(window.location.search);
    const threadId = params.get('threadId');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    
    let currentThread = null;

    // --- INITIAL VALIDATION ---
    if (!threadId) {
        threadTitleH1.textContent = 'Error';
        postsContainer.innerHTML = '<p style="text-align: center; color: red;">No Thread ID was provided in the URL.</p>';
        if (replyMessageDiv) replyMessageDiv.parentElement.style.display = 'none';
        return;
    }

    // --- MAIN DATA FETCHING LOGIC ---
    const fetchThreadAndPosts = async (page = 1) => {
        try {
            if (!currentThread) {
                const threadRes = await fetch(`/api/threads/${threadId}`);
                if (!threadRes.ok) throw new Error('Failed to fetch thread details.');
                currentThread = await threadRes.json();
                
                pageTitle.textContent = `${currentThread.title} - The Pirate Bay`;
                threadForumNameSpan.textContent = currentThread.forum.name;
                breadcrumbForumLink.href = `/thread-list?forumId=${currentThread.forum._id}`;
                threadTitleH1.textContent = currentThread.title;
            }

            const postsRes = await fetch(`/api/threads/${threadId}/posts?page=${page}`);
            if (!postsRes.ok) throw new Error('Failed to fetch posts.');
            const data = await postsRes.json();

            displayPosts(data.posts);
            displayPagination(data.currentPage, data.totalPages);

        } catch (error) {
            console.error('Error fetching data:', error);
            postsContainer.innerHTML = `<p style="text-align: center; color: red;">Error: ${error.message}</p>`;
            threadTitleH1.textContent = 'Data Not Found';
        }
    };

    // --- DISPLAY POSTS (with dynamic avatars) ---
    const displayPosts = (posts) => {
        postsContainer.innerHTML = '';
        if (posts.length === 0) {
            postsContainer.innerHTML = `<p style="text-align: center;">No posts yet. Be the first to reply!</p>`;
            return;
        }

        posts.forEach(post => {
            // --- THIS IS THE FIX for dynamic avatars ---
            const avatarSrc = post.user?.avatarPath ? `/${post.user.avatarPath.replace(/\\/g, '/')}` : '/uploads/avatars/default.png';

            const postHTML = `
                <div class="post" id="post-${post._id}">
                    <div class="user-info">
                        <img src="${avatarSrc}" alt="User Avatar" class="user-avatar">
                        <h3><a href="/profile?user=${post.user ? post.user.username : ''}">${post.user ? post.user.username : 'Deleted User'}</a></h3>
                        <p>Member</p>
                        <p>Joined: ${post.user ? new Date(post.user.createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div class="post-content">
                        <div class="post-header">Posted: ${new Date(post.createdAt).toLocaleString()}</div>
                        <div class="post-body" id="post-body-${post._id}">${post.content}</div>
                        <div class="post-footer">
                            <a href="#" class="quote-btn" data-post-id="${post._id}" data-username="${post.user ? post.user.username : 'User'}">Quote</a>
                        </div>
                    </div>
                </div>
            `;
            postsContainer.innerHTML += postHTML;
        });
    };

    // --- DISPLAY PAGINATION (for both top and bottom) ---
    const displayPagination = (currentPage, totalPages) => {
        paginationContainerTop.innerHTML = '';
        paginationContainerBottom.innerHTML = '';
        if (totalPages <= 1) return;

        let paginationHTML = `Page: `;
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                paginationHTML += `<b>${i}</b> `;
            } else {
                paginationHTML += `<a href="#" class="page-link" data-page="${i}">${i}</a> `;
            }
        }
        paginationContainerTop.innerHTML = paginationHTML;
        paginationContainerBottom.innerHTML = paginationHTML;
    };

    // --- EVENT DELEGATION (for pagination and new quote button) ---
    document.getElementById('main-content').addEventListener('click', (e) => {
        // Handle Pagination clicks
        if (e.target.classList.contains('page-link')) {
            e.preventDefault();
            const page = e.target.dataset.page;
            fetchThreadAndPosts(page);
        }

        // --- THIS IS THE FIX for the Quote button ---
        if (e.target.classList.contains('quote-btn')) {
            e.preventDefault();
            const postId = e.target.dataset.postId;
            const username = e.target.dataset.username;
            const postBody = document.getElementById(`post-body-${postId}`);
            
            // Get the raw text content, not the HTML
            let rawContent = postBody.innerText || postBody.textContent;
            
            // Format the quote
            const quoteText = `[quote=${username}]${rawContent.trim()}[/quote]\n`;
            
            // Add to textarea and focus
            replyTextarea.value = quoteText + replyTextarea.value;
            replyTextarea.focus();
            replyTextarea.scrollTop = 0; // Scroll to the top of the textarea
        }
    });

    // --- Post Reply Logic (unchanged, but included for completeness) ---
    if (submitReplyBtn) {
        submitReplyBtn.addEventListener('click', async () => {
            replyMessageDiv.textContent = '';
            replyMessageDiv.className = '';

            if (!userInfo || !userInfo.token) {
                replyMessageDiv.textContent = 'You must be logged in to post a reply.';
                replyMessageDiv.className = 'error'; // You'll need to style this class
                return;
            }

            const content = replyTextarea.value.trim();
            if (!content) {
                replyMessageDiv.textContent = 'Reply content cannot be empty.';
                replyMessageDiv.className = 'error';
                return;
            }

            try {
                replyMessageDiv.textContent = 'Posting reply...';
                replyMessageDiv.className = '';

                // Use the new, correct endpoint for creating a post
                const res = await fetch(`/api/threads/${currentThread._id}/posts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userInfo.token}`,
                    },
                    body: JSON.stringify({ content }),
                });

                const data = await res.json();

                if (res.ok) {
                    replyMessageDiv.textContent = 'Reply posted successfully!';
                    replyMessageDiv.className = 'success'; // You'll need to style this class
                    replyTextarea.value = ''; // Clear textarea
                    
                    // Re-fetch posts to show the new one instantly
                    await fetchThreadAndPosts(); 
                } else {
                    replyMessageDiv.textContent = data.message || 'Failed to post reply.';
                    replyMessageDiv.className = 'error';
                }
            } catch (error) {
                console.error('Error posting reply:', error);
                replyMessageDiv.textContent = 'Could not connect to the server to post reply.';
                replyMessageDiv.className = 'error';
            }
        });
    }

    // --- RICH TEXT EDITOR LOGIC ---
    const btnBold = document.getElementById('btn-bold');
    const btnItalic = document.getElementById('btn-italic');
    const btnQuote = document.getElementById('btn-quote');

    function wrapText(tag) {
        const start = replyTextarea.selectionStart;
        const end = replyTextarea.selectionEnd;
        const selectedText = replyTextarea.value.substring(start, end);
        const replacement = `[${tag}]${selectedText}[/${tag}]`;
        replyTextarea.value = replyTextarea.value.substring(0, start) + replacement + replyTextarea.value.substring(end);
        replyTextarea.focus();
    }

    if(btnBold) btnBold.addEventListener('click', () => wrapText('b'));
    if(btnItalic) btnItalic.addEventListener('click', () => wrapText('i'));
    if(btnQuote) btnQuote.addEventListener('click', () => {
        const start = replyTextarea.selectionStart;
        const end = replyTextarea.selectionEnd;
        const selectedText = replyTextarea.value.substring(start, end);
        const replacement = `[quote]${selectedText}[/quote]`;
        // Add newlines for block-level quotes
        replyTextarea.value = replyTextarea.value.substring(0, start) + "\n" + replacement + "\n" + replyTextarea.value.substring(end);
        replyTextarea.focus();
    });

    // Initial call
    fetchThreadAndPosts();
});
