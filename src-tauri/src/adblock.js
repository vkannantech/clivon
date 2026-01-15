
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
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                // Check if any added node is a known ad or contains a known ad
                for (const selector of AD_SELECTORS) {
                    const ads = document.querySelectorAll(selector);
                    ads.forEach(ad => {
                        if (ad) {
                            ad.remove();
                            console.log("[Clivon AdShield] Removed Ad Node");
                        }
                    });
                }

                // Auto-Skip Logic
                const skipBtn = document.querySelector(".ytp-ad-skip-button") || document.querySelector(".ytp-ad-skip-button-modern");
                if (skipBtn) {
                    skipBtn.click();
                    console.log("[Clivon AdShield] Auto-Skipped Ad");
                }
                // Debounce or logic to process batch could be added here if needed,
                // but limiting scope is the biggest win.
                mutations.forEach((mutation) => {
                    // Logic to hide ads...
                    // (We keep the existing robust removal logic inside the loop if it was there,
                    //  or just let the CSS do the heavy lifting and this does cleanup)
                    const ads = document.querySelectorAll(AD_SELECTORS.join(", "));
                    ads.forEach(ad => ad.remove());

                    // Auto Skip
                    const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern');
                    if (skipBtn) {
                        skipBtn.click();
                        console.log("[AdShield] Auto-Skipped Ad");
                    }
                });
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
