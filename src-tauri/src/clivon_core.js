(function () {
    console.log("[Clivon Core] v3.0 | Ultra Robust Mode");

    // --- GLOBAL CSS ---
    const STYLE_ID = 'clivon-style-overrides';
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            /* GPU Acceleration */
            video.html5-main-video { transform: translateZ(0); will-change: transform; }
            ytd-app { scroll-behavior: smooth; }
            
            /* PiP Button Style */
            .clivon-pip-btn {
                background: none; border: none; cursor: pointer;
                vertical-align: middle; width: 48px; height: 100%;
                opacity: 0.9; transition: opacity 0.1s;
            }
            .clivon-pip-btn:hover { opacity: 1; }
            .clivon-pip-btn svg { fill: white; width: 100%; height: 100%; transform: scale(0.8); }
        `;
        document.head.appendChild(style);
    }

    // --- STATE & UTILS ---
    const STATE = {
        pipActive: false,
        lastNotifCount: 0,
        videoElement: null
    };

    function invokeRust(cmd, args = {}) {
        // Tauri v2 namespace
        if (window.__TAURI__?.core) {
            window.__TAURI__.core.invoke(cmd, args).catch(err => console.error("Rust Error:", err));
        } else if (window.__TAURI__?.invoke) {
            window.__TAURI__.invoke(cmd, args).catch(err => console.error("Rust Error:", err));
        }
    }

    // --- 1. HEADER MODULE (Home & Fullscreen) ---
    function injectHeaderButtons() {
        const BTN_ID = 'clivon-header-buttons';
        if (document.getElementById(BTN_ID)) return;

        // More robust selector strategy
        const container = document.querySelector('ytd-masthead #start') ||
            document.querySelector('#masthead #start');

        if (container) {
            const wrapper = document.createElement('div');
            wrapper.id = BTN_ID;
            wrapper.style.cssText = 'display:flex; align-items:center; margin-left:15px; margin-right:5px; gap:4px;';

            // Home
            const homeBtn = createIconBtn(
                '<path d="M4,10V21h6V15h4v6h6V10L12,3Z"></path>',
                "Home",
                () => window.location.href = "https://www.youtube.com"
            );

            // App Fullscreen
            const fsBtn = createIconBtn(
                '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path>',
                "Maximize App",
                () => {
                    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { });
                    else document.exitFullscreen();
                }
            );

            wrapper.append(homeBtn, fsBtn);
            container.appendChild(wrapper);
            console.log("[Clivon] Header Buttons Injected");
        }
    }

    function createIconBtn(path, userTitle, action) {
        const btn = document.createElement('button');
        btn.title = userTitle;
        btn.style.cssText = 'background:none; border:none; cursor:pointer; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; padding:0;';
        btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:24px; height:24px; fill:var(--yt-spec-text-primary);"><g>${path}</g></svg>`;
        btn.onclick = action;
        btn.onmouseenter = () => btn.style.backgroundColor = 'var(--yt-spec-badge-chip-background-color, rgba(255,255,255,0.1))';
        btn.onmouseleave = () => btn.style.backgroundColor = 'transparent';
        return btn;
    }

    // --- 2. PIP MODULE (Native Player Integration) ---
    function injectPiPButton() {
        if (document.getElementById('clivon-pip-button')) return;

        const rightControls = document.querySelector('.ytp-right-controls');
        if (rightControls) {
            const btn = document.createElement('button');
            btn.id = 'clivon-pip-button';
            btn.className = 'clivon-pip-btn ytp-button';
            btn.title = "Mini Mode (PiP)";
            btn.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"></path>
                </svg>
            `;
            btn.onclick = () => {
                STATE.pipActive = !STATE.pipActive;
                invokeRust("toggle_mini_mode", { enable: STATE.pipActive });
                // Also toggle native pip if possible as fallback
                const video = document.querySelector('video');
                if (video && document.pictureInPictureEnabled && !STATE.pipActive) {
                    // Try to sync with native Rust window by putting video in simple mode
                }
            };

            // Insert before the settings gear or fullscreen button
            rightControls.insertBefore(btn, rightControls.firstChild);
            console.log("[Clivon] PiP Button Injected");
        }
    }

    // --- 3. MEDIA & NOTIFICATIONS (Strict Sync) ---
    function setupStrictMediaSync() {
        const video = document.querySelector('video');
        if (!video || video === STATE.videoElement) return;

        console.log("[Clivon] Hooking Video Events");
        STATE.videoElement = video;

        // Immediate Sync
        updateMediaSession();

        // Event Driven Sync
        ['play', 'pause', 'ratechange', 'timeupdate', 'loadeddata'].forEach(evt => {
            video.addEventListener(evt, updateMediaSession);
        });
    }

    function updateMediaSession() {
        if (!navigator.mediaSession) return;

        // Scrape Metadata robustly
        const titleEl = document.querySelector('h1.ytd-video-primary-info-renderer') ||
            document.querySelector('#title h1 yt-formatted-string') ||
            { innerText: document.title }; // Fallback

        const authorEl = document.querySelector('ytd-channel-name a') ||
            document.querySelector('.ytd-channel-name a');

        const title = titleEl.innerText || "YouTube Desktop";
        const artist = authorEl ? authorEl.innerText : "Clivon";

        // Cache check
        if (navigator.mediaSession.metadata?.title === title && navigator.mediaSession.metadata?.artist === artist) return;

        const videoId = new URLSearchParams(window.location.search).get('v');
        const artwork = videoId
            ? [{ src: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, sizes: '1280x720', type: 'image/jpeg' }]
            : [];

        navigator.mediaSession.metadata = new MediaMetadata({ title, artist, artwork });

        // Notification Pulse
        checkNotifications();
    }

    function checkNotifications() {
        const badge = document.querySelector('.yt-spec-icon-badge-shape__badge');
        if (badge) {
            const count = parseInt(badge.innerText.trim()) || 0;
            if (count > STATE.lastNotifCount) {
                if (window.__TAURI__?.notification) {
                    window.__TAURI__.notification.sendNotification({ title: 'New Activity', body: `You have ${count} new notifications` });
                }
                STATE.lastNotifCount = count;
            }
        }
    }

    // --- 4. ORCHESTRATOR (Observer + Interval) ---

    // Observer for "page navigation" or "app load"
    const observer = new MutationObserver(() => {
        injectHeaderButtons();
        injectPiPButton();
        setupStrictMediaSync();
    });

    // Start with a broad observation
    setTimeout(() => {
        const app = document.querySelector('ytd-app') || document.body;
        observer.observe(app, { childList: true, subtree: true });

        // Initial force run
        injectHeaderButtons();
        injectPiPButton();
        setupStrictMediaSync();
    }, 1500);

    // Fallback Interval for robustness
    setInterval(() => {
        if (!document.getElementById('clivon-header-buttons')) injectHeaderButtons();
        if (!document.getElementById('clivon-pip-button')) injectPiPButton();
        setupStrictMediaSync(); // Checks internally if new video element appeared
    }, 2000);

})();
