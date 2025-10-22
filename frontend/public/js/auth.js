document.addEventListener('DOMContentLoaded', () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // --- Selectors for the standard HEADER ---
    const navAuthLinks = document.getElementById('nav-auth-links');
    const navUserLinks = document.getElementById('nav-user-links');
    const navWelcome = document.getElementById('nav-welcome');
    const navMyProfileLink = document.getElementById('nav-my-profile');
    
    // --- Selectors for the standard FOOTER ---
    const footerAuthLinks = document.getElementById('footer-auth-links');
    const footerUserLinks = document.getElementById('footer-user-links');
    const footerSettingsContainer = document.getElementById('footer-settings-link-container');

    // --- Selectors for the unique HOMEPAGE ---
    const mainAuthLinks = document.getElementById('main-nav-auth-links');
    const mainUserLinks = document.getElementById('main-nav-user-links');
    const mainWelcome = document.getElementById('main-nav-welcome');
    const mainNavMyProfileLink = document.getElementById('main-nav-my-profile');
    const mainNavSettingsContainer = document.getElementById('main-nav-settings-link-container');

    if (userInfo && userInfo.token) {
        // --- User is LOGGED IN ---
        const welcomeMessage = `Welcome, ${userInfo.username}!`;
        const profileUrl = `/profile?user=${userInfo.username}`;

        // Update Header
        if (navAuthLinks) navAuthLinks.style.display = 'none';
        if (navUserLinks) navUserLinks.style.display = 'inline';
        if (navWelcome) navWelcome.textContent = welcomeMessage;
        if (navMyProfileLink) navMyProfileLink.href = profileUrl;
        
        // Update Standard Footer
        if (footerAuthLinks) footerAuthLinks.style.display = 'none';
        if (footerUserLinks) footerUserLinks.style.display = 'inline';
        if (footerSettingsContainer) {
            // --- THIS IS THE FIX ---
            // The leading ' | ' is now part of the dynamic content.
            footerSettingsContainer.innerHTML = ` | <a href="/settings">Settings</a> | <a href="#" onclick="logout()">Logout</a>`;
        }

        // Update Homepage
        if (mainAuthLinks) mainAuthLinks.style.display = 'none';
        if (mainUserLinks) mainUserLinks.style.display = 'inline';
        if (mainWelcome) mainWelcome.textContent = welcomeMessage;
        if (mainNavMyProfileLink) mainNavMyProfileLink.href = profileUrl;
        if (mainNavSettingsContainer) {
            // --- THIS IS THE FIX ---
            // The leading ' | ' is now part of the dynamic content.
            mainNavSettingsContainer.innerHTML = ` | <a href="/settings">Settings</a>`;
        }


    } else {
        // --- User is LOGGED OUT ---
        // Update Header
        if (navAuthLinks) navAuthLinks.style.display = 'inline';
        if (navUserLinks) navUserLinks.style.display = 'none';
        if (navWelcome) navWelcome.textContent = '';
        
        // Update Standard Footer
        if (footerAuthLinks) footerAuthLinks.style.display = 'inline';
        if (footerUserLinks) footerUserLinks.style.display = 'none';
        if (footerSettingsContainer) footerSettingsContainer.innerHTML = ''; // Ensure it's empty

        // Update Homepage
        if (mainAuthLinks) mainAuthLinks.style.display = 'inline';
        if (mainUserLinks) mainUserLinks.style.display = 'none';
        if (mainWelcome) mainWelcome.textContent = '';
        if (mainNavSettingsContainer) mainNavSettingsContainer.innerHTML = ''; // Ensure it's empty
    }
});

function logout() {
    localStorage.removeItem('userInfo');
    window.location.href = '/login';
}

// --- Style for the welcome message (unchanged) ---
const style = document.createElement('style');
style.innerHTML = `
.welcome-message { color: #90ee90; font-size: 12px; margin-top: 10px; text-align: left; }
.welcome-message-home { font-size: 16px; font-weight: bold; margin: 20px 0; color: #90ee90; }
`;
document.head.appendChild(style);