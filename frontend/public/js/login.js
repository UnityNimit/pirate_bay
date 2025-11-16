document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const messageDiv = document.getElementById('message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageDiv.textContent = '';
        messageDiv.className = '';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                messageDiv.textContent = 'Login successful! Redirecting...';
                messageDiv.classList.add('success');

                localStorage.setItem('userInfo', JSON.stringify(data));

                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);

            } else {
                messageDiv.textContent = data.message || 'Login failed.';
                messageDiv.classList.add('error');
            }
        } catch (error) {
            console.error('Login error:', error);
            messageDiv.textContent = 'Could not connect to the server.';
            messageDiv.classList.add('error');
        }
    });
});