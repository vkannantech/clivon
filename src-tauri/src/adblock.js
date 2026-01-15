
// Clivon AdShield v2.0 (Nuclear Option)
(function () {
    console.log("[Clivon AdShield] v2.0 Armed & Dangerous");

    // 1. EXTENSIVE Block List (Cosmetic)
    const AD_SELECTORS = [
        ".video-ads",
        ".ytp-ad-module",
        ".ytd-ad-slot-renderer",
        "ytd-promoted-sparkles-web-renderer",
        "ytd-display-ad-renderer",
        "#masthead-ad",
        "ytd-compact-promoted-video-renderer",
        "ytd-promoted-video-renderer",
        ".ytd-banner-promo-renderer-background",
        "#player-ads",
        ".ad-container",
        ".ad-div",
        ".masthead-ad-control",
        "ytd-ad-slot-renderer",
        "ytd-rich-item-renderer:has(ytd-ad-slot-renderer)",
        ".ytd-in-feed-ad-layout-renderer",
        "ytd-action-companion-ad-renderer",
        "ytd-engagement-panel-section-list-renderer[target-id='engagement-panel-ads']",
        ".ytp-ad-overlay-container",
        ".ytp-ad-message-container",
        // Popups
        "tp-yt-paper-dialog:has(#unlimited-offer)",
        "tp-yt-paper-dialog:has(yt-upsell-dialog-renderer)",
        ".yt-mealbar-promo-renderer"
    ];

    // 2. CSS FORCE REMOVAL
    const style = document.createElement('style');
    style.id = 'clivon-adblock-css';
    style.textContent = AD_SELECTORS.join(", ") + " { display: none !important; visibility: hidden !important; width: 0 !important; height: 0 !important; pointer-events: none !important; }";
    document.documentElement.appendChild(style);

    // 3. VIDEO SPEED-KILL ENGINE
    function killVideoAds() {
        const video = document.querySelector('video');
        if (!video) return;

        // Check if Ad is Showing
        const adShowing = document.querySelector('.ad-showing') || document.querySelector('.ad-interrupting');

        if (adShowing) {
            // A. Speed Kill
            video.muted = true;
            video.playbackRate = 16.0; // Max Speed
            video.currentTime = video.duration || 9999;

            // B. Click Skip Button
            const skipBtns = [
                ".ytp-ad-skip-button",
                ".ytp-ad-skip-button-modern",
                ".ytp-skip-ad-button",
                ".videoAdUiSkipButton",
                ".ytp-ad-overlay-close-button", // Overlays
                ".ytp-ad-text-overlay-close-button"
            ];

            skipBtns.forEach(sel => {
                const btn = document.querySelector(sel);
                if (btn) {
                    btn.click();
                    console.log("[AdShield] Skipped via Click:", sel);
                }
            });

            // C. Remove Overlay Ads manually
            const overlay = document.querySelector('.ytp-ad-module');
            if (overlay) overlay.style.display = 'none';
        } else {
            // Restore normal state if we accidentally muted non-ad content (rare safety check)
            // video.muted = false; // logic too risky, user might want mute. Only unmute if we specifically muted it? 
            // Better to just leave it alone unless we are sure it was us.
            const overlay = document.querySelector('.ytp-ad-module');
            if (overlay && overlay.style.display === 'none') {
                // Check if it's empty, otherwise might hide valid overlays? 
                // Actually ytp-ad-module is almost exclusively ads. Keep hidden? 
                // No, live chat replays might be there? No, usually distinct. Safe to leave aggressive.
            }
        }

        // D. Remove Static Ads explicitly
        const bannerAds = document.querySelectorAll(AD_SELECTORS.join(", "));
        bannerAds.forEach(ad => ad.remove());
    }

    // 4. AGGRESSIVE LOOP (50ms)
    // Observers are too slow for "frame-perfect" skips. We need a loop.
    setInterval(killVideoAds, 50);

    // 5. OBSERVER (For dynamic injections)
    const observer = new MutationObserver(killVideoAds);
    observer.observe(document.documentElement, { childList: true, subtree: true });

})();
