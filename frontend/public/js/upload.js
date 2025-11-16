document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('upload-form');
    const messageDiv = document.getElementById('message');
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    if (!userInfo || !userInfo.token) {
        window.location.href = '/login';
        return;
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            messageDiv.textContent = '';
            messageDiv.className = '';

            const formData = new FormData();

            formData.append('description', document.getElementById('description').value);
            formData.append('category', document.getElementById('category').value);

            // Appending the .torrent file
            const torrentFileInput = document.getElementById('torrentFile');
            if (torrentFileInput.files.length > 0) {
                formData.append('torrentFile', torrentFileInput.files[0]);
            } else {
                 messageDiv.textContent = 'A .torrent file is required.';
                 messageDiv.classList.add('error');
                 return;
            }

            // Appending any optional image files
            const imageInput = document.getElementById('images');
            if (imageInput.files.length > 0) {
                for (const file of imageInput.files) {
                    formData.append('images', file);
                }
            }

            try {
                messageDiv.textContent = 'Processing and uploading... Please wait.';
                messageDiv.className = '';

                const res = await fetch('/api/torrents/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${userInfo.token}`,
                    },
                    body: formData,
                });

                const data = await res.json();

                if (res.ok) {
                    messageDiv.textContent = 'Upload successful! Redirecting...';
                    messageDiv.classList.add('success');
                    setTimeout(() => {
                        window.location.href = `/torrent?id=${data._id}`;
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
    }
});