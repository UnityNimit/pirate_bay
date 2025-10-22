document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('upload-form');
    const messageDiv = document.getElementById('message');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // --- Authentication Check ---
    // If the user is not logged in, redirect them to the login page.
    if (!userInfo || !userInfo.token) {
        window.location.href = '/login';
        // Stop the rest of the script from running to prevent errors
        return;
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            messageDiv.textContent = '';
            messageDiv.className = '';

            // 1. We use FormData because we are sending files
            const formData = new FormData();

            // 2. Append the text fields that the backend needs
            formData.append('description', document.getElementById('description').value);
            formData.append('category', document.getElementById('category').value);

            // 3. Append the .torrent file
            const torrentFileInput = document.getElementById('torrentFile');
            if (torrentFileInput.files.length > 0) {
                formData.append('torrentFile', torrentFileInput.files[0]);
            } else {
                 messageDiv.textContent = 'A .torrent file is required.';
                 messageDiv.classList.add('error');
                 return;
            }

            // 4. Append any optional image files
            const imageInput = document.getElementById('images');
            if (imageInput.files.length > 0) {
                for (const file of imageInput.files) {
                    formData.append('images', file);
                }
            }

            try {
                messageDiv.textContent = 'Processing and uploading... Please wait.';
                messageDiv.className = '';

                // 5. Send the request with the token in the header
                const res = await fetch('/api/torrents/upload', {
                    method: 'POST',
                    headers: {
                        // We DO NOT set 'Content-Type'. The browser handles it for FormData.
                        'Authorization': `Bearer ${userInfo.token}`,
                    },
                    body: formData,
                });

                const data = await res.json();

                if (res.ok) {
                    messageDiv.textContent = 'Upload successful! Redirecting...';
                    messageDiv.classList.add('success');
                    setTimeout(() => {
                        // Redirect to the new torrent's detail page
                        window.location.href = `/torrent?id=${data._id}`;
                    }, 2000);
                } else {
                    // Display specific error from the backend (e.g., "Torrent already exists")
                    messageDiv.textContent = data.message || 'Upload failed.';
                    messageDiv.classList.add('error');
                }

            } catch (error) {
                console.error('Upload error:', error);
                messageDiv.textContent = 'Could not connect to the server.';
                messageDiv.classList.add('error');
            }
        });
    }
});