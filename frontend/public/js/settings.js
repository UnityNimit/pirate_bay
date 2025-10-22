document.addEventListener('DOMContentLoaded', () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // --- Authentication Check ---
    if (!userInfo || !userInfo.token) {
        window.location.href = '/login';
        return;
    }

    // --- Element Selectors ---
    const profileForm = document.getElementById('profile-update-form');
    const passwordForm = document.getElementById('password-change-form');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const profileMessage = document.getElementById('profile-message');
    const passwordMessage = document.getElementById('password-message');

    // --- Populate Form with Existing Data ---
    if (userInfo) {
        usernameInput.value = userInfo.username;
        emailInput.value = userInfo.email;
    }
    
    // --- Profile Update Logic ---
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        profileMessage.textContent = '';
        profileMessage.className = '';

        const newEmail = emailInput.value;

        try {
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ email: newEmail })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // IMPORTANT: Update localStorage with the new user data/token
            localStorage.setItem('userInfo', JSON.stringify(data));
            
            profileMessage.textContent = 'Profile updated successfully!';
            profileMessage.className = 'success';
        } catch (error) {
            profileMessage.textContent = `Error: ${error.message}`;
            profileMessage.className = 'error';
        }
    });

    // --- Password Change Logic ---
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        passwordMessage.textContent = '';
        passwordMessage.className = '';

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;

        try {
            const res = await fetch('/api/users/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            passwordMessage.textContent = 'Password changed successfully!';
            passwordMessage.className = 'success';
            passwordForm.reset(); // Clear the form fields
        } catch (error) {
            passwordMessage.textContent = `Error: ${error.message}`;
            passwordMessage.className = 'error';
        }
    });
});