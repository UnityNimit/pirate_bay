document.addEventListener('DOMContentLoaded', () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // slector for header
    const navAuthLinks = document.getElementById('nav-auth-links');
    const navUserLinks = document.getElementById('nav-user-links');
    const navWelcome = document.getElementById('nav-welcome');
    const navMyProfileLink = document.getElementById('nav-my-profile');
    
    // selector for footer
    const footerAuthLinks = document.getElementById('footer-auth-links');
    const footerUserLinks = document.getElementById('footer-user-links');
    const footerSettingsContainer = document.getElementById('footer-settings-link-container');

    // Selector for home navigation
    const mainAuthLinks = document.getElementById('main-nav-auth-links');
    const mainUserLinks = document.getElementById('main-nav-user-links');
    const mainWelcome = document.getElementById('main-nav-welcome');
    const mainNavMyProfileLink = document.getElementById('main-nav-my-profile');
    const mainNavSettingsContainer = document.getElementById('main-nav-settings-link-container');

    if (userInfo && userInfo.token) {
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
            footerSettingsContainer.innerHTML = ` | <a href="/settings">Settings</a> | <a href="#" onclick="logout()">Logout</a>`;
        }

        // Update Homepage
        if (mainAuthLinks) mainAuthLinks.style.display = 'none';
        if (mainUserLinks) mainUserLinks.style.display = 'inline';
        if (mainWelcome) mainWelcome.textContent = welcomeMessage;
        if (mainNavMyProfileLink) mainNavMyProfileLink.href = profileUrl;
        if (mainNavSettingsContainer) {
            mainNavSettingsContainer.innerHTML = ` | <a href="/settings">Settings</a>`;
        }


    } else {
        //Uuser logged out
        // Update Header
        if (navAuthLinks) navAuthLinks.style.display = 'inline';
        if (navUserLinks) navUserLinks.style.display = 'none';
        if (navWelcome) navWelcome.textContent = '';
        
        // Update Footer
        if (footerAuthLinks) footerAuthLinks.style.display = 'inline';
        if (footerUserLinks) footerUserLinks.style.display = 'none';
        if (footerSettingsContainer) footerSettingsContainer.innerHTML = '';

        // Update Homepage
        if (mainAuthLinks) mainAuthLinks.style.display = 'inline';
        if (mainUserLinks) mainUserLinks.style.display = 'none';
        if (mainWelcome) mainWelcome.textContent = '';
        if (mainNavSettingsContainer) mainNavSettingsContainer.innerHTML = '';
    }
});

function logout() {
    localStorage.removeItem('userInfo');
    window.location.href = '/login';
}

//styles for welcome messages
const style = document.createElement('style');
style.innerHTML = `
.welcome-message { color: #90ee90; font-size: 12px; margin-top: 10px; text-align: left; }
.welcome-message-home { font-size: 16px; font-weight: bold; margin: 20px 0; color: #90ee90; }
`;
document.head.appendChild(style);