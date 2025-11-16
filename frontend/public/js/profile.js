document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENT SELECTORS ---
    const mainContent = document.getElementById('main-content');
    const profileTitle = document.getElementById('profile-title');
    const profileAvatarImg = document.getElementById('profile-avatar-img');
    const profileUsername = document.getElementById('profile-username');
    const profileJoinDate = document.getElementById('profile-join-date');
    const uploadCountSpan = document.getElementById('upload-count');
    const postCountSpan = document.getElementById('post-count');
    const downloadCountSpan = document.getElementById('download-count');
    const avatarForm = document.getElementById('avatar-form');
    const avatarInput = document.getElementById('avatar-input');
    const avatarMessage = document.getElementById('avatar-message');
    
    // --- STATE VARIABLES ---
    const params = new URLSearchParams(window.location.search);
    const username = params.get('user');
    const loggedInUser = JSON.parse(localStorage.getItem('userInfo'));

    let profileData = null;
    let loadedTabs = {};
    let chartInstance = null; // To hold the chart object

    if (!username) {
        mainContent.innerHTML = '<h1>No user specified.</h1>';
        return;
    }
    
    // --- MAIN DATA FETCHING ---
    const fetchProfileData = async () => {
        try {
            const headers = {};
            if (loggedInUser && loggedInUser.token) {
                headers['Authorization'] = `Bearer ${loggedInUser.token}`;
            }

            const res = await fetch(`/api/users/profile/${username}`, { headers });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'User not found');
            }
            
            profileData = await res.json();
            
            displayProfile(profileData);
            // Fetch content for the default 'uploads' tab on initial page load
            fetchTabContent('uploads');
        } catch (error) {
            mainContent.innerHTML = `<h1>${error.message}</h1>`;
        }
    };

    // --- PROFILE DISPLAY ---
    const displayProfile = (data) => {
        document.title = `${data.username}'s Profile - The Pirate Bay`;
        profileTitle.textContent = `${data.username}'s Profile`;
        profileAvatarImg.src = `/api/users/avatar/${data._id}?t=${new Date().getTime()}`;
        profileUsername.textContent = data.username;
        profileJoinDate.textContent = `Member since ${new Date(data.createdAt).toLocaleDateString()}`;

        uploadCountSpan.textContent = data.stats.uploads;
        postCountSpan.textContent = data.stats.posts;
        downloadCountSpan.textContent = data.stats.totalDownloads;
        
        if (loggedInUser && loggedInUser.username === data.username) {
            avatarForm.style.display = 'block';
        }
        renderFollowButton(data.username, data.isFollowing);
    };

    // --- FOLLOW BUTTON ---
    const renderFollowButton = (profileUsername, isFollowing) => {
        const container = document.getElementById('follow-btn-container');
        if (!loggedInUser || loggedInUser.username === profileUsername) {
            container.innerHTML = '';
            return;
        }

        if (isFollowing) {
            container.innerHTML = `<button id="follow-btn" class="unfollow">Unfollow</button>`;
        } else {
            container.innerHTML = `<button id="follow-btn" class="follow">Follow</button>`;
        }

        document.getElementById('follow-btn').addEventListener('click', async () => {
            const method = isFollowing ? 'DELETE' : 'PUT';
            try {
                const res = await fetch(`/api/users/profile/${profileUsername}/follow`, {
                    method,
                    headers: { 'Authorization': `Bearer ${loggedInUser.token}` }
                });
                if (!res.ok) throw new Error('Action failed');
                // Toggle the button state without a full page reload
                renderFollowButton(profileUsername, !isFollowing);
            } catch (error) {
                console.error('Follow/Unfollow error:', error);
                alert('An error occurred. Please try again.');
            }
        });
    };
    
    // --- TAB SWITCHING LOGIC (REFACTORED) ---
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 1. Destroy any existing chart before changing the view
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }

            // 2. Switch the active classes on tabs and content panes
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.getElementById(tabName).classList.add('active');
            
            // 3. Always call fetchTabContent, which will decide what to render.
            fetchTabContent(tabName);
        });
    });

    // --- DYNAMIC TAB CONTENT FETCHER (REFACTORED) ---
    const fetchTabContent = async (tabName) => {
        // If content for an API tab is already loaded, do nothing.
        // The 'stats' tab doesn't fetch, so it will always proceed.
        if (loadedTabs[tabName]) {
            return;
        }

        const container = document.getElementById(tabName);
        if (!profileData) return;

        try {
            if (tabName === 'uploads') {
                const res = await fetch(`/api/users/profile/${username}/uploads`);
                displayUploads(await res.json());
                loadedTabs[tabName] = true;
            } else if (tabName === 'posts') {
                const res = await fetch(`/api/users/profile/${username}/posts`);
                displayPosts(await res.json());
                loadedTabs[tabName] = true;
            } else if (tabName === 'bookmarks') {
                displayBookmarks(profileData.bookmarkedTorrents);
                loadedTabs[tabName] = true;
            } else if (tabName === 'following') {
                displayUserGrid(container, profileData.following, 'Not following anyone yet.');
                loadedTabs[tabName] = true;
            } else if (tabName === 'followers') {
                displayUserGrid(container, profileData.followers, 'No followers yet.');
                loadedTabs[tabName] = true;
            } else if (tabName === 'stats') {
                // This is now called *after* the tab is visible, ensuring correct rendering.
                renderActivityChart(profileData.stats);
                // We don't mark 'stats' as loaded so it can be re-rendered.
            }
        } catch (error) {
            container.innerHTML = `<p style="color: red;">Could not load content: ${error.message}</p>`;
        }
    };
    
    // --- DISPLAY FUNCTIONS ---
    const displayUploads = (uploads) => {
        const container = document.getElementById('uploads');
        if (uploads.length === 0) { container.innerHTML = '<p>This user has not uploaded any torrents yet.</p>'; return; }
        let html = '<ul class="content-list">';
        uploads.forEach(up => {
            html += `<li><a href="/torrent?id=${up._id}">${up.name}</a></li>`;
        });
        container.innerHTML = html + '</ul>';
    };

    const displayPosts = (posts) => {
        const container = document.getElementById('posts');
        if (posts.length === 0) { container.innerHTML = '<p>This user has not made any forum posts yet.</p>'; return; }
        let html = '<ul class="content-list">';
        posts.forEach(post => {
            if (post.thread) {
                html += `<li>Replied in "<a href="/inner?threadId=${post.thread._id}">${post.thread.title}</a>"<span class="list-item-meta">on ${new Date(post.createdAt).toLocaleDateString()}</span></li>`;
            }
        });
        container.innerHTML = html + '</ul>';
    };
    
    const displayBookmarks = (bookmarks) => {
        const container = document.getElementById('bookmarks');
        if (bookmarks.length === 0) { container.innerHTML = '<p>This user has not bookmarked any torrents yet.</p>'; return; }
        let html = '<ul class="content-list">';
        bookmarks.forEach(bm => {
            html += `<li><a href="/torrent?id=${bm._id}">${bm.name}</a><span class="list-item-meta">(${bm.category})</span></li>`;
        });
        container.innerHTML = html + '</ul>';
    };

    const displayUserGrid = (container, userList, emptyMessage) => {
        if (userList.length === 0) { 
            container.innerHTML = `<p>${emptyMessage}</p>`; 
            return; 
        }
        let html = '<div class="user-grid">';
        userList.forEach(user => {
            const avatarSrc = `/api/users/avatar/${user._id}`;
            html += `
                <div class="user-card">
                    <a href="/profile?user=${user.username}">
                        <img src="${avatarSrc}" alt="${user.username}'s avatar" class="user-card-avatar" onerror="this.src='/uploads/avatars/default.png';">
                        <div class="user-card-username">${user.username}</div>
                    </a>
                </div>
            `;
        });
        container.innerHTML = html + '</div>';
    };

    // --- CHART RENDERING (SIMPLIFIED) ---
    const renderActivityChart = (stats) => {
        const canvas = document.getElementById('activityChart');
        if (!canvas) {
            console.error("Statistics canvas not found in DOM.");
            return;
        }
        const ctx = canvas.getContext('2d');
        
        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Uploads', 'Forum Posts'],
                datasets: [{
                    label: 'User Activity',
                    data: [stats.uploads, stats.posts],
                    backgroundColor: ['#8ab4f8', '#90ee90'],
                    borderColor: '#1a1a1a',
                    borderWidth: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // This is key to filling the container
                plugins: { legend: { position: 'top', labels: { color: '#aaa' } } }
            }
        });
    };

    // --- PFP UPLOADING ---
    if (avatarForm) {
        avatarInput.addEventListener('change', () => {
             avatarForm.dispatchEvent(new Event('submit'));
        });

        avatarForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            avatarMessage.textContent = 'Uploading...';
            avatarMessage.style.color = '#aaa';

            if (avatarInput.files.length === 0) {
                avatarMessage.textContent = 'Please select a file.';
                return;
            }

            const formData = new FormData();
            formData.append('avatar', avatarInput.files[0]);

            try {
                const res = await fetch('/api/users/profile/avatar', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${loggedInUser.token}` },
                    body: formData,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);

                // --- FINAL FIX FOR UPLOAD SUCCESS ---
                // After upload, refresh the image source from the correct API endpoint.
                // We use the loggedInUser's ID as the backend doesn't return it on this request.
                profileAvatarImg.src = `/api/users/avatar/${loggedInUser._id}?t=${new Date().getTime()}`;
                
                avatarMessage.textContent = 'Success!';
                avatarMessage.style.color = 'green';
                setTimeout(() => avatarMessage.textContent = '', 2000);

            } catch (error) {
                avatarMessage.textContent = `Error: ${error.message}`;
                avatarMessage.style.color = 'red';
            }
        });
    }

    // --- INITIAL CALL ---
    fetchProfileData();
});