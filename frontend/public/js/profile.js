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
    
    // --- GET DATA FROM URL AND LOCALSTORAGE ---
    const params = new URLSearchParams(window.location.search);
    const username = params.get('user');
    const loggedInUser = JSON.parse(localStorage.getItem('userInfo'));

    // This will hold all the data fetched from the API for the profile page
    let profileData = null;

    // --- INITIAL VALIDATION ---
    if (!username) {
        mainContent.innerHTML = '<h1>No user specified.</h1>';
        return;
    }

    // --- MAIN DATA FETCHING AND DISPLAY ---
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
            // After displaying the main profile, load the content for the default active tab
            fetchTabContent('uploads');
        } catch (error) {
            mainContent.innerHTML = `<h1>${error.message}</h1>`;
        }
    };

    const displayProfile = (data) => {
        document.title = `${data.username}'s Profile - The Pirate Bay`;
        profileTitle.textContent = `${data.username}'s Profile`;
        profileAvatarImg.src = `/${data.avatarPath.replace(/\\/g, '/')}`;
        profileUsername.textContent = data.username;
        profileJoinDate.textContent = `Member since ${new Date(data.createdAt).toLocaleDateString()}`;

        uploadCountSpan.textContent = data.stats.uploads;
        postCountSpan.textContent = data.stats.posts;
        downloadCountSpan.textContent = data.stats.totalDownloads;
        
        // Show avatar upload form ONLY if the logged-in user is viewing their own profile
        if (loggedInUser && loggedInUser.username === data.username) {
            avatarForm.style.display = 'block';
        }
        
        // Render the follow/unfollow button
        renderFollowButton(data.username, data.isFollowing);
    };

    // --- FOLLOW/UNFOLLOW BUTTON LOGIC ---
    const renderFollowButton = (profileUsername, isFollowing) => {
        const container = document.getElementById('follow-btn-container');
        if (!loggedInUser || loggedInUser.username === profileUsername) {
            container.innerHTML = ''; // Don't show follow button on your own profile
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
    
    // --- TAB SWITCHING LOGIC ---
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.getElementById(tabName).classList.add('active');
            fetchTabContent(tabName);
        });
    });

    // --- DYNAMIC TAB CONTENT FETCHER ---
    let loadedTabs = {};
    const fetchTabContent = async (tabName) => {
        if (loadedTabs[tabName]) return;
        const container = document.getElementById(tabName);
        if (!profileData) return;

        try {
            // We NO LONGER need to fetch for most tabs, as the data is already in profileData
            if (tabName === 'uploads') {
                const res = await fetch(`/api/users/profile/${username}/uploads`);
                displayUploads(await res.json());
            } else if (tabName === 'posts') {
                const res = await fetch(`/api/users/profile/${username}/posts`);
                displayPosts(await res.json());
            } else if (tabName === 'bookmarks') {
                displayBookmarks(profileData.bookmarkedTorrents);
            } else if (tabName === 'following') {
                displayUserGrid(container, profileData.following, 'Not following anyone yet.');
            } else if (tabName === 'followers') {
                displayUserGrid(container, profileData.followers, 'No followers yet.');
            } else if (tabName === 'stats') {
                renderActivityChart(profileData.stats);
            }
            loadedTabs[tabName] = true;
        } catch (error) {
            container.innerHTML = `<p style="color: red;">Could not load content: ${error.message}</p>`;
        }
    };
    
    // --- DISPLAY FUNCTIONS FOR ALL TAB CONTENT ---
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
        if (userList.length === 0) { container.innerHTML = `<p>${emptyMessage}</p>`; return; }
        let html = '<div class="user-grid">';
        userList.forEach(user => {
            html += `
                <div class="user-card">
                    <a href="/profile?user=${user.username}">
                        <img src="/${user.avatarPath.replace(/\\/g, '/')}" alt="${user.username}'s avatar" class="user-card-avatar">
                        <div class="user-card-username">${user.username}</div>
                    </a>
                </div>
            `;
        });
        container.innerHTML = html + '</div>';
    };

    const renderActivityChart = (stats) => {
        const ctx = document.getElementById('activityChart').getContext('2d');
        new Chart(ctx, {
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
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { color: '#aaa' } } }
            }
        });
    };

    // --- AVATAR UPLOAD LOGIC ---
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

                profileAvatarImg.src = `/${data.avatarPath.replace(/\\/g, '/')}?t=${new Date().getTime()}`;
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