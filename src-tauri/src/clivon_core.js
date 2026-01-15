
(function () {
    console.log("[Clivon Core] Orchestrator Loaded | v2.0 Performance");

    // --- 1. PERFORMANCE & GPU ACCELERATION ---
    const SMOOTH_CSS = `
        /* Force GPU Acceleration for Video */
        video.html5-main-video {
            transform: translateZ(0); 
            will-change: transform;
        }
        
        /* Smooth Scrolling for the main app container */
        ytd-app {
            scroll-behavior: smooth; 
        }

        /* Optimize expensive blur effects if necessary (optional tweaks) */
        .ytp-tooltip-text {
            backdrop-filter: none !important; 
        }
    `;
    const style = document.createElement('style');
    style.id = 'clivon-smooth-css';
    style.textContent = SMOOTH_CSS;
    document.head.appendChild(style);


    // --- 2. UNIFIED STATE ---
    const STATE = {
        lastNotifCount: 0,
        buttonInjected: false
    };

    // --- 3. SUB-MODULES ---

    // [Module A] Header Buttons (Home / Fullscreen)
    function checkHeaderButtons() {
        const BTN_ID = 'clivon-header-buttons';
        if (document.getElementById(BTN_ID)) return; // Already exists

        const container = document.querySelector('ytd-masthead #start');
        if (container) {
            const btnContainer = document.createElement('div');
            btnContainer.id = BTN_ID;
            btnContainer.style.cssText = 'display:flex; align-items:center; margin-left:10px; gap:8px;';

            // Home
            const homeBtn = createBtn(
                '<path d="M4,10V21h6V15h4v6h6V10L12,3Z"></path>',
                "Go Home",
                () => window.location.href = "https://www.youtube.com"
            );

            // Fullscreen
            const fsBtn = createBtn(
                '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path>',
                "Toggle Fullscreen",
                () => {
                    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(console.error);
                    else document.exitFullscreen();
                }
            );

            btnContainer.append(homeBtn, fsBtn);
            container.appendChild(btnContainer);
            console.log("[Clivon Core] Header UI Injected");
        }
    }

    function createBtn(pathData, title, onClick) {
        const btn = document.createElement('button');
        btn.title = title;
        btn.style.cssText = 'background:transparent; border:none; cursor:pointer; padding:8px; border-radius:50%; transition:background 0.2s;';
        btn.innerHTML = `<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" style="display:block; width:24px; height:24px; fill:white;"><g>${pathData}</g></svg>`;
        btn.onclick = onClick;
        btn.onmouseenter = () => btn.style.background = 'rgba(255,255,255,0.1)';
        btn.onmouseleave = () => btn.style.background = 'transparent';
        return btn;
    }

    // [Module B] Smart Notifications
    function checkNotifications() {
        // Optimized selector lookup
        const badge = document.querySelector('.yt-spec-icon-badge-shape__badge');
        if (badge) {
            const count = parseInt(badge.innerText.trim()) || 0;
            if (count > STATE.lastNotifCount) {
                console.log(`[Clivon Core] Notifications: ${count}`);
                if (window.__TAURI__?.notification) {
                    window.__TAURI__.notification.sendNotification({ title: 'Clivon', body: `${count} new notifications` });
                } else if (Notification.permission === 'granted') {
                    new Notification('Clivon', { body: `${count} new notifications` });
                }
                STATE.lastNotifCount = count;
            }
        }
    }

    // [Module C] Media Session (Lock Screen)
    function updateMediaSession() {
        if (!navigator.mediaSession) return;

        // Fast exit if metadata matches current video to avoid spamming the OS bridge
        const titleEl = document.querySelector('h1.ytd-video-primary-info-renderer') || document.querySelector('#title h1 yt-formatted-string');
        if (!titleEl) return;

        const title = titleEl.innerText;
        if (navigator.mediaSession.metadata?.title === title) return; // No change

        const authorEl = document.querySelector('ytd-channel-name a');
        const artist = authorEl ? authorEl.innerText : 'YouTube';
        const videoId = new URLSearchParams(window.location.search).get('v');

        if (title && videoId) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: artist,
                album: 'YouTube Desktop',
                artwork: [{ src: `https://img.youtube.com/vi/${videoId}/0.jpg`, sizes: '512x512', type: 'image/jpeg' }]
            });
        }
    }

    // --- 4. HEARTBEAT LOOP (Consolidated Interval) ---
    // Runs every 1s. This is much lighter than 4 overlapping intervals.
    setInterval(() => {
        requestAnimationFrame(() => {
            checkHeaderButtons();
            checkNotifications();
            updateMediaSession();
        });
    }, 1000);

})();
