
(function () {
    console.log("[Clivon Core] v4.0 | Nuclear Robustness + Themes");

    // --- 0. THEME ENGINE ---
    const THEMES = ['default', 'amoled', 'light'];
    let currentThemeIdx = 0;

    const THEME_CSS = `
        /* Base Clivon Styles */
        video.html5-main-video { transform: translateZ(0); will-change: transform; }
        ytd-app { scroll-behavior: smooth; }
        
        /* Floating Dock (Fallback) */
        #clivon-floating-dock {
            position: fixed; top: 10px; left: 100px; z-index: 9999;
            display: flex; gap: 8px; background: rgba(0,0,0,0.6);
            padding: 5px 10px; border-radius: 20px;
            backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);
            transition: opacity 0.3s;
        }
        #clivon-floating-dock:hover { opacity: 1; }
        
        /* AMOLED Theme */
        html[clivon-theme="amoled"] {
            --yt-spec-base-background: #000000 !important;
            --yt-spec-raised-background: #000000 !important;
            --yt-spec-menu-background: #0f0f0f !important;
            --yt-spec-inverted-background: #000000 !important;
            --yt-spec-additive-background: rgba(255,255,255,0.1) !important;
        }
        
        /* Light Theme Force */
        html[clivon-theme="light"] {
            --yt-spec-base-background: #ffffff !important;
            --yt-spec-text-primary: #0f0f0f !important;
            --yt-spec-text-secondary: #606060 !important;
            filter: invert(0) !important; /* Safety */
        }
    `;

    const style = document.createElement('style');
    style.id = 'clivon-theme-css';
    style.textContent = THEME_CSS;
    document.head.appendChild(style);

    function toggleTheme() {
        currentThemeIdx = (currentThemeIdx + 1) % THEMES.length;
        const theme = THEMES[currentThemeIdx];
        document.documentElement.setAttribute('clivon-theme', theme);
        console.log("[Clivon] Theme set to:", theme);
    }

    // --- 1. GLOBAL SHORTCUTS (Strict) ---
    document.addEventListener('keydown', (e) => {
        // F = YouTube Native Video Fullscreen (Pass through)
        if (e.key.toLowerCase() === 'f') return;

        // F11 = App Fullscreen (Strict Capture)
        if (e.key === 'F11') {
            e.preventDefault();
            e.stopPropagation();
            toggleAppFullscreen();
        }
    }, true); // Capture phase to beat YouTube

    function toggleAppFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen();
        }
    }

    function invokeRust(cmd, args = {}) {
        if (window.__TAURI__?.core) {
            window.__TAURI__.core.invoke(cmd, args).catch(err => console.error("Rust Error:", err));
        } else if (window.__TAURI__?.invoke) {
            window.__TAURI__.invoke(cmd, args).catch(err => console.error("Rust Error:", err));
        }
    }


    // --- 2. UI INJECTION ENGINE (Nuclear) ---
    function injectUI() {
        injectHeaderControls();
        injectPiPButton();
    }

    function injectHeaderControls() {
        const ID = 'clivon-header-controls';
        if (document.getElementById(ID)) return;

        // Strategy A: Native Header
        // We look for multiple logical insertion points
        const anchor = document.querySelector('ytd-masthead #end') ||
            document.querySelector('ytd-masthead #buttons') ||
            document.querySelector('#masthead #end'); // Try right side logic for stability

        if (anchor) {
            const wrapper = createControlGroup(ID);
            // Insert at the beginning of the "end" section (left of profile/notifs)
            anchor.insertBefore(wrapper, anchor.firstChild);
            console.log("[Clivon] Injected into Header (Right)");
            return;
        }

        // Strategy B: Left Header
        const leftAnchor = document.querySelector('ytd-masthead #start');
        if (leftAnchor) {
            const wrapper = createControlGroup(ID);
            leftAnchor.appendChild(wrapper);
            console.log("[Clivon] Injected into Header (Left)");
            return;
        }

        // Strategy C: Floating Dock (Fallback)
        // If we really can't find the header, create a floating dock
        if (!document.getElementById('clivon-floating-dock')) {
            const dock = createControlGroup('clivon-floating-dock');
            document.body.appendChild(dock);
            console.log("[Clivon] Header missing, deployed Floating Dock");
        }
    }

    function createControlGroup(id) {
        const div = document.createElement('div');
        div.id = id;
        div.style.cssText = 'display:flex; align-items:center; margin: 0 10px; gap: 8px;';

        // 1. Home
        div.appendChild(createBtn(
            '<path d="M4,10V21h6V15h4v6h6V10L12,3Z"></path>',
            "Home",
            () => window.location.href = "https://www.youtube.com"
        ));

        // 2. Fullscreen (App)
        div.appendChild(createBtn(
            '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path>',
            "App Fullscreen (F11)",
            toggleAppFullscreen
        ));

        // 3. Theme Switcher
        div.appendChild(createBtn(
            '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"></path>',
            "Switch Theme",
            toggleTheme
        ));

        return div;
    }

    function createBtn(path, title, action) {
        const btn = document.createElement('button');
        btn.title = title;
        btn.style.cssText = 'background:transparent; border:none; cursor:pointer; padding:6px; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center;';
        btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:24px; height:24px; fill:var(--yt-spec-text-primary, white); filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));"><g>${path}</g></svg>`;
        btn.onclick = action;
        btn.onmouseenter = () => btn.style.background = 'rgba(255,255,255,0.15)';
        btn.onmouseleave = () => btn.style.background = 'transparent';
        return btn;
    }

    function injectPiPButton() {
        if (document.getElementById('clivon-pip-button')) return;
        const rightControls = document.querySelector('.ytp-right-controls');
        if (rightControls) {
            const btn = document.createElement('button');
            btn.id = 'clivon-pip-button';
            btn.className = 'clivon-pip-btn ytp-button';
            btn.title = "Mini Mode";
            btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"></path></svg>`;
            btn.onclick = () => {
                const enable = !document.pictureInPictureElement;
                invokeRust("toggle_mini_mode", { enable: enable });
            };
            rightControls.insertBefore(btn, rightControls.firstChild);
        }
    }


    // --- 3. ORCHESTRATOR ---
    // Aggressive polling is sometimes more reliable than Observer for chaotic SPAs
    setInterval(() => {
        injectUI();
        // Keep Media Session alive
        const video = document.querySelector('video');
        if (video && !video.hasAttribute('clivon-hooked')) {
            video.setAttribute('clivon-hooked', 'true');
            ['play', 'pause', 'ratechange'].forEach(e => video.addEventListener(e, () => {
                // Update Rust/System info if needed
            }));
        }
    }, 1000);

})();
