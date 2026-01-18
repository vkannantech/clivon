// -----------------------------------------------------------------------------
// CLIVON SHIELD - ULTRA FAST AD SKIPPER (Native Extension)
// -----------------------------------------------------------------------------

(function () {
    console.log("Clivon Shield: Active");

    // 1. CONSTANTS & SELECTORS
    const AD_SELECTORS = [
        '.ytp-ad-skip-button',
        '.ytp-ad-skip-button-modern',
        '.ytp-skip-ad-button',
        '.ytp-ad-overlay-close-button',
        '.ytp-ad-text'
    ];

    const BANNER_SELECTORS = [
        'ytd-ad-slot-renderer',
        '.ytp-ad-module',
        '.video-ads',
        '#masthead-ad',
        'ytd-promoted-sparkles-web-renderer',
        '.ytd-player-legacy-desktop-watch-ads-renderer'
    ];

    // 2. THE KILLER FUNCTION (Runs 20x/sec)
    function killAds() {
        // A. Video Ads (Skip Logic)
        const player = document.getElementById('movie_player');

        if (player && typeof player.getAdState === 'function') {
            if (player.getAdState() !== -1) { // Ad Detected
                // 1. Mute
                player.mute();

                // 2. Speed Kill
                const video = document.querySelector('video');
                if (video) {
                    video.playbackRate = 16.0;
                    if (!isNaN(video.duration)) {
                        video.currentTime = video.duration;
                    }
                }

                // 3. Skip Button Click (Fallback)
                AD_SELECTORS.forEach(sel => {
                    const btn = document.querySelector(sel);
                    if (btn) btn.click();
                });

                // 4. Force Skip API
                if (player.skipAd) player.skipAd();

                console.log("Clivon Shield: Ad Skipped");
            }
        }

        // B. Banner Cleanup (Visual)
        BANNER_SELECTORS.forEach(sel => {
            const els = document.querySelectorAll(sel);
            els.forEach(el => el.style.display = 'none');
        });

        // C. Specific "Visit Advertiser" Buttons
        const visitBtns = document.querySelectorAll('.ytp-ad-button-icon');
        visitBtns.forEach(btn => btn.style.display = 'none');
    }

    // 3. RUNTIME LOOP
    // High-frequency check during startup, then settle
    setInterval(killAds, 50);

    // 4. OBSERVER (For new elements)
    const observer = new MutationObserver(killAds);
    observer.observe(document.body, { childList: true, subtree: true });

})();
