document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('upload-form');
    const messageDiv = document.getElementById('message');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // --- Authentication Check ---
    // If the user is not logged in, redirect them away from this page.
    if (!userInfo || !userInfo.token) {
        window.location.href = '/login';
        // Stop the rest of the script from running
        return;
    }

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageDiv.textContent = '';
        messageDiv.className = '';

        // 1. We use FormData because we are sending files
        const formData = new FormData();

        // 2. Append all the text fields
        formData.append('name', document.getElementById('name').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('category', document.getElementById('category').value);

        // 3. Append the .torrent file
        const torrentFileInput = document.getElementById('torrentFile');
        if (torrentFileInput.files.length > 0) {
            const torrentFile = torrentFileInput.files[0];
            formData.append('torrentFile', torrentFile);
            // We can also add size and a placeholder infoHash
            formData.append('size', torrentFile.size);
            formData.append('infoHash', `placeholder-${Date.now()}`); // In a real app, you'd generate this hash
        } else {
             messageDiv.textContent = 'A .torrent file is required.';
             messageDiv.className = 'error';
             return;
        }

        // 4. Append any image files
        const imageInput = document.getElementById('images');
        if (imageInput.files.length > 0) {
            for (const file of imageInput.files) {
                formData.append('images', file);
            }
        }

        try {
            messageDiv.textContent = 'Uploading... Please wait.';
            messageDiv.className = '';

            // 5. Send the request with the token in the header
            const res = await fetch('/api/torrents/upload', {
                method: 'POST',
                headers: {
                    // IMPORTANT: We do NOT set 'Content-Type'.
                    // The browser will automatically set it to 'multipart/form-data'
                    // and include the correct boundary when using FormData.
                    'Authorization': `Bearer ${userInfo.token}`,
                },
                body: formData, // Send the FormData object as the body
            });

            const data = await res.json();

            if (res.ok) {
                messageDiv.textContent = 'Upload successful! Redirecting...';
                messageDiv.classList.add('success');
                setTimeout(() => {
                    // Redirect to the new torrent's detail page (we'll build this later)
                    // For now, let's go to the search page.
                    window.location.href = '/search';
                }, 2000);
            } else {
                messageDiv.textContent = data.message || 'Upload failed.';
                messageDiv.classList.add('error');
            }

        } catch (error) {
            console.error('Upload error:', error);
            messageDiv.textContent = 'Could not connect to the server.';
            messageDiv.classList.add('error');
        }
    });
});