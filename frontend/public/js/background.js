document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('matrix-background');
    if (!canvas) {
        console.error('Canvas element for background not found!');
        return;
    }
    const ctx = canvas.getContext('2d');

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    // The characters that will be raining down
    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const characters = katakana + latin + nums;

    const fontSize = 18;
    const columns = Math.floor(w / fontSize);
    const drops = new Array(columns).fill(1);

    function draw() {
        // The semi-transparent black background creates the fading trail effect
        ctx.fillStyle = 'rgba(18, 18, 18, 0.15)';

        ctx.fillRect(0, 0, w, h);

        // A godly, aesthetic green color
        ctx.fillStyle = 'rgba(62, 62, 62, 1)';
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
            const text = characters[Math.floor(Math.random() * characters.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            // Reset the drop to the top when it goes off-screen
            // The randomness adds to the chaotic, corrupted aesthetic
            if (drops[i] * fontSize > h && Math.random() > 0.975) {
                drops[i] = 0;
            }

            drops[i]++;
        }
    }

    const intervalId = setInterval(draw, 33);

    // Make sure the animation is responsive and resizes with the window
    window.addEventListener('resize', () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        // Recalculate columns and reset drops on resize
        const newColumns = Math.floor(w / fontSize);
        drops.length = 0; // Clear the old array
        for (let i = 0; i < newColumns; i++) {
            drops.push(1);
        }
    });
});