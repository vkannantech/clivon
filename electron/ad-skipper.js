// Lightweight Ad Skipper (Fallback for uBlock)
// Only clicks "Skip" and hides overlays. No complex logic.

window.addEventListener('DOMContentLoaded', () => {
    // 1. CSS to hide static ads (banners)
    const style = document.createElement('style');
    style.textContent = `
        .video-ads, .ytp-ad-module, .ytp-ad-overlay-container, 
        #player-ads, #offer-module, ytd-ad-slot-renderer { 
            display: none !important; 
        }
    `;
    document.head.appendChild(style);

    // 2. Interval to click "Skip" OR Fast Forward
    setInterval(() => {
        // A. Click Skip Button
        const skipBtn = document.querySelector('.ytp-ad-skip-button') ||
            document.querySelector('.ytp-ad-skip-button-modern');
        if (skipBtn) {
            skipBtn.click();
            return;
        }

        // B. Fast Forward Unskippable Ads
        const player = document.querySelector('#movie_player');
        if (player && player.classList.contains('ad-showing')) {
            const video = document.querySelector('video');
            if (video && !isNaN(video.duration)) {
                // Instantly end the ad
                video.currentTime = video.duration;
            }
        }

        // C. Close Overlays
        const closeOverlay = document.querySelector('.ytp-ad-overlay-close-button');
        if (closeOverlay) {
            closeOverlay.click();
        }
    }, 50); // Checks 20 times per second
});
