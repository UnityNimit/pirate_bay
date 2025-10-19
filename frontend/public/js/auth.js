document.addEventListener('DOMContentLoaded', () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // --- Selectors for the standard HEADER ---
    const navAuthLinks = document.getElementById('nav-auth-links');
    const navUserLinks = document.getElementById('nav-user-links');
    const navWelcome = document.getElementById('nav-welcome');
    
    // --- Selectors for the standard FOOTER ---
    const footerAuthLinks = document.getElementById('footer-auth-links');
    const footerUserLinks = document.getElementById('footer-user-links');

    // --- Selectors for the unique HOMEPAGE nav/footer ---
    const mainAuthLinks = document.getElementById('main-nav-auth-links');
    const mainUserLinks = document.getElementById('main-nav-user-links');
    const mainWelcome = document.getElementById('main-nav-welcome');

    const navMyProfileLink = document.getElementById('nav-my-profile');
    const mainNavMyProfileLink = document.getElementById('main-nav-my-profile');

    if (userInfo && userInfo.token) {
        // --- User is LOGGED IN ---
        const welcomeMessage = `Welcome, ${userInfo.username}!`;
        
        // Update Header
        if (navAuthLinks) navAuthLinks.style.display = 'none';
        if (navUserLinks) navUserLinks.style.display = 'inline';
        if (navWelcome) navWelcome.textContent = welcomeMessage;
        
        // Update Footer
        if (footerAuthLinks) footerAuthLinks.style.display = 'none';
        if (footerUserLinks) footerUserLinks.style.display = 'inline';

        // Update Homepage (if elements exist)
        if (mainAuthLinks) mainAuthLinks.style.display = 'none';
        if (mainUserLinks) mainUserLinks.style.display = 'inline';
        if (mainWelcome) mainWelcome.textContent = welcomeMessage;

        const profileUrl = `/profile?user=${userInfo.username}`;
        if (navMyProfileLink) navMyProfileLink.href = profileUrl;
        if (mainNavMyProfileLink) mainNavMyProfileLink.href = profileUrl;

    } else {
        // --- User is LOGGED OUT ---
        // Update Header
        if (navAuthLinks) navAuthLinks.style.display = 'inline';
        if (navUserLinks) navUserLinks.style.display = 'none';
        
        // Update Footer
        if (footerAuthLinks) footerAuthLinks.style.display = 'inline';
        if (footerUserLinks) footerUserLinks.style.display = 'none';

        // Update Homepage (if elements exist)
        if (mainAuthLinks) mainAuthLinks.style.display = 'inline';
        if (mainUserLinks) mainUserLinks.style.display = 'none';
    }
});

function logout() {
    localStorage.removeItem('userInfo');
    window.location.href = '/login';
}

// Add some styles for the welcome message
const style = document.createElement('style');
style.innerHTML = `
.welcome-message {
    color: #90ee90;
    font-size: 12px;
    margin-top: 5px;
    text-align: center;
}
#search-nav-container .welcome-message {
    text-align: left; /* Adjust for header */
}
`;
document.head.appendChild(style);