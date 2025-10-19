// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const messageDiv = document.getElementById('message');

    registerForm.addEventListener('submit', async (e) => {
        // 1. Prevent the form's default submission behavior
        e.preventDefault();

        // 2. Clear any previous messages
        messageDiv.textContent = '';
        messageDiv.className = '';

        // 3. Grab the data from the form fields
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // 4. Send the data to the backend API using fetch
            const res = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();

            // 5. Handle the response
            if (res.ok) {
                // Success!
                messageDiv.textContent = 'Registration successful! Redirecting to login...';
                messageDiv.classList.add('success'); // You can style this class in your CSS

                // Redirect to login page after a short delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);

            } else {
                // Error from the server (e.g., "User already exists")
                messageDiv.textContent = data.message || 'An error occurred.';
                messageDiv.classList.add('error'); // You can style this class
            }
        } catch (error) {
            // Network error or other issue
            console.error('Registration error:', error);
            messageDiv.textContent = 'Could not connect to the server.';
            messageDiv.classList.add('error');
        }
    });
});