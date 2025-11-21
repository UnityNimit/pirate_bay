
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const messageDiv = document.getElementById('message');

    registerForm.addEventListener('submit', async (e) => {
        // Prevent the form's default submission behavior
        e.preventDefault();

        // Clear any previous messages
        messageDiv.textContent = '';
        messageDiv.className = '';

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Send the data to the backend API using fetch
            const res = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();

            // Handle the response
            if (res.ok) {
                // Success!
                messageDiv.textContent = 'Registration successful! Redirecting to login...';
                messageDiv.classList.add('success'); 

                // Redirect to login page after a short delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);

            } else {
                messageDiv.textContent = data.message || 'An error occurred.';
                messageDiv.classList.add('error'); 
            }
        } catch (error) {
            console.error('Registration error:', error);
            messageDiv.textContent = 'Could not connect to the server.';
            messageDiv.classList.add('error');
        }
    });
});