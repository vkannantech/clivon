
(function () {
    console.log("[Clivon Core] v5.0 | NUCLEAR FORCE MODE");

    // --- 0. THEME ENGINE ---
    const THEMES = ['default', 'amoled', 'light'];
    let currentThemeIdx = 0;

    const THEME_CSS = `
        /* Base Clivon Styles */
        video.html5-main-video { transform: translateZ(0); will-change: transform; }
        ytd-app { scroll-behavior: smooth; }
        
        /* Floating Dock (The Un-Killable UI) */
        #clivon-floating-dock {
            position: fixed !important;
            top: 60px !important;
            left: 20px !important;
            z-index: 2147483647 !important; /* Max Int */
            display: flex !important;
            gap: 10px !important;
            background: rgba(15, 15, 15, 0.9) !important;
            padding: 8px 12px !important;
            border-radius: 50px !important;
            backdrop-filter: blur(16px) !important;
            border: 1px solid rgba(255,255,255,0.15) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
            pointer-events: auto !important;
            transition: opacity 0.3s, transform 0.2s !important;
            transform-origin: left center;
        }
        #clivon-floating-dock:hover {
            transform: scale(1.05);
            background: rgba(30, 30, 30, 0.95) !important;
        }
        
        /* AMOLED Theme */
        html[clivon-theme="amoled"] {
            --yt-spec-base-background: #000000 !important;
            --yt-spec-raised-background: #000000 !important;
            --yt-spec-menu-background: #0f0f0f !important;
            --yt-spec-inverted-background: #000000 !important;
        }
        
        /* Light Theme Force */
        html[clivon-theme="light"] {
            --yt-spec-base-background: #ffffff !important;
            --yt-spec-text-primary: #0f0f0f !important;
            filter: invert(0) !important;
        }
    `;

    const style = document.createElement('style');
    style.id = 'clivon-theme-css';
    style.textContent = THEME_CSS;
    document.documentElement.appendChild(style);

    function toggleTheme() {
        currentThemeIdx = (currentThemeIdx + 1) % THEMES.length;
        const theme = THEMES[currentThemeIdx];
        document.documentElement.setAttribute('clivon-theme', theme);
        console.log("[Clivon] Theme:", theme);
    }

    // --- 1. SHORTCUTS ---
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'f') return; // Strict: Let YouTube handle F
        if (e.key === 'F11') { // Strict: We handle F11
            e.preventDefault(); e.stopPropagation();
            toggleAppFullscreen();
        }
    }, true);

    function toggleAppFullscreen() {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { });
        else document.exitFullscreen();
    }

    function invokeRust(cmd, args = {}) {
        if (window.__TAURI__?.core) {
            window.__TAURI__.core.invoke(cmd, args).catch(console.error);
        } else if (window.__TAURI__?.invoke) {
            window.__TAURI__.invoke(cmd, args).catch(console.error);
        }
    }

    // --- 2. INJECTION ENGINE (FORCE) ---
    function forceInject() {
        // ALWAYS ensure the dock exists. 
        // We append to documentElement to avoid body rewrites by SPA routers.
        let dock = document.getElementById('clivon-floating-dock');

        if (!dock) {
            dock = document.createElement('div');
            dock.id = 'clivon-floating-dock';

            // 1. Home
            dock.appendChild(createBtn(
                '<path d="M4,10V21h6V15h4v6h6V10L12,3Z"></path>',
                "Go Home",
                () => window.location.href = "https://www.youtube.com"
            ));

            // 2. PiP (Mini Mode) - Rust Command
            dock.appendChild(createBtn(
                '<path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"></path>',
                "Mini Mode",
                () => {
                    invokeRust("toggle_mini_mode", { enable: !document.pictureInPictureElement });
                    // Also try native toggle for visual feedback if supported
                    const v = document.querySelector('video');
                    if (v && document.pictureInPictureEnabled && !document.pictureInPictureElement) {
                        v.requestPictureInPicture().catch(() => { });
                    } else if (document.pictureInPictureElement) {
                        document.exitPictureInPicture().catch(() => { });
                    }
                }
            ));

            // 3. App Fullscreen (F11)
            dock.appendChild(createBtn(
                '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path>',
                "Fullscreen App (F11)",
                toggleAppFullscreen
            ));

            // 4. Theme
            dock.appendChild(createBtn(
                '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"></path>',
                "Switch Theme",
                toggleTheme
            ));

            // Append to ROOT to prevent SPA deletion
            document.documentElement.appendChild(dock);
            console.log("[Clivon] Floating Dock FORCED into Root");
        } else {
            // Re-ensure visibility even if styles were tampered
            if (dock.style.display === 'none') dock.style.display = 'flex';
        }

        // Also fallback to Header Injection (Best Effort)
        injectHeaderBestEffort();
    }

    function injectHeaderBestEffort() {
        if (document.getElementById('clivon-header-controls')) return;
        const anchor = document.querySelector('ytd-masthead #end');
        if (anchor) {
            // We can inject a smaller version here if needed, but the Dock is primary now.
        }
    }

    function createBtn(path, title, action) {
        const btn = document.createElement('button');
        btn.title = title;
        // High contrast styles for visibility
        btn.style.cssText = 'background:rgba(255,255,255,0.1); border:none; cursor:pointer; padding:8px; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; transition: background 0.2s;';
        btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:24px; height:24px; fill:white; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));"><g>${path}</g></svg>`;
        btn.onclick = (e) => {
            e.stopPropagation();
            // Visual Feedback
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => btn.style.transform = 'scale(1)', 100);
            action();
        };
        btn.onmouseenter = () => btn.style.background = 'rgba(255,255,255,0.25)';
        btn.onmouseleave = () => btn.style.background = 'rgba(255,255,255,0.1)';
        return btn;
    }

    // --- 3. HEARTBEAT (Aggressive) ---
    // Check every 500ms. If the dock is gone, put it back.
    setInterval(forceInject, 500);

    // Initial Trigger
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceInject);
    } else {
        forceInject();
    }

})();
