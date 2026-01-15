
// Clivon AdShield Engine (Industry Grade)
(function () {
    console.log("[Clivon AdShield] Engine Started");

    const AD_SELECTORS = [
        ".video-ads",
        ".ytp-ad-module",
        ".ytd-ad-slot-renderer",
        "ytd-promoted-sparkles-web-renderer",
        "ytd-display-ad-renderer",
        "#masthead-ad",
        "ytd-compact-promoted-video-renderer",
        "ytd-promoted-video-renderer"
    ];

    // 1. CSS Injection (Performance efficient hiding)
    const style = document.createElement('style');
    style.id = 'clivon-adblock-css';
    style.textContent = AD_SELECTORS.join(", ") + " { display: none !important; }";
    document.head.appendChild(style);

    // 2. Active DOM Observer (For dynamic ads)
    const observer = new MutationObserver((mutations) => {
        // Optimized Single Loop
        for (const mutation of mutations) {
            // Check added nodes for ads
            if (mutation.addedNodes.length > 0) {
                const ads = document.querySelectorAll(AD_SELECTORS.join(", "));
                ads.forEach(ad => {
                    ad.remove();
                    console.log("[AdShield] Removed Ad Node");
                });

                // Auto-Skip
                const skipBtn = document.querySelector(".ytp-ad-skip-button") || document.querySelector(".ytp-ad-skip-button-modern");
                if (skipBtn) {
                    skipBtn.click();
                    console.log("[AdShield] Auto-Skipped Ad");
                }
            }
        }
    });

    // Wait for App to load slightly before observing specific container
    setTimeout(() => {
        const target = document.querySelector('ytd-app') || document.body;
        observer.observe(target, { childList: true, subtree: true });
        console.log("[AdShield] Observing:", target.tagName);
    }, 1000);

    // 3. Periodic Cleanup (Safety Net)
    setInterval(() => {
        const skipBtn = document.querySelector(".ytp-ad-skip-button") || document.querySelector(".ytp-ad-skip-button-modern");
        if (skipBtn) skipBtn.click();
    }, 1000);

})();
