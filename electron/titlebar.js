const { ipcRenderer } = require('electron');

function injectTitlebar() {
    console.log("👻 Initializing Ghost Bar (Root Mode)...");

    const css = `
        /* GHOST BAR (Root Level) */
        #clivon-ghost-bar {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 56px;
            background: rgba(15, 15, 15, 0.98);
            display: flex; align-items: center; padding: 0 12px;
            z-index: 2147483647; /* MAX INT */
            box-sizing: border-box;
            font-family: 'Segoe UI', sans-serif;
            opacity: 1; /* DEBUG: ALWAYS VISIBLE */
            transition: opacity 0.2s ease-in-out;
            pointer-events: auto; 
            border-bottom: 1px solid #333;
            user-select: none;
        }

        /* BUTTONS */
        .ghost-btn {
            width: 36px; height: 36px; margin-right: 8px;
            border: none; background: transparent; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            color: #ccc; border-radius: 4px;
        }
        .ghost-btn:hover { color: #00f3ff; background: rgba(255,255,255,0.1); }
        .ghost-btn.danger:hover { color: #ff3c3c; }
        .ghost-btn svg { width: 22px; height: 22px; }

        /* SEARCH */
        #ghost-search-container { flex: 1; display: flex; justify-content: center; margin: 0 20px; }
        #ghost-search {
            width: 60%; max-width: 600px; height: 32px;
            background: #202020; border: 1px solid #333;
            border-radius: 16px; color: #ddd;
            padding: 0 16px; outline: none; text-align: center;
            font-size: 13px;
        }
        #ghost-search:focus { border-color: #00f3ff; color: white; background: #000; }
        
        /* TOGGLE */
        #adblock-toggle {
            width: 40px; height: 20px; background: #00dc64;
            border-radius: 10px; position: relative; cursor: pointer; margin-right: 12px;
        }
        #adblock-toggle.off { background: #505050; }
        #adblock-knob {
            position: absolute; top: 2px; right: 2px;
            width: 16px; height: 16px; background: white; border-radius: 50%; transition: 0.2s;
        }
        #adblock-toggle.off #adblock-knob { right: 22px; }
    `;

    // 1. Inject CSS (Check ID to prevent dupe)
    if (!document.getElementById('clivon-ghost-style')) {
        const style = document.createElement('style');
        style.id = 'clivon-ghost-style';
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    }

    // 2. HTML Creator
    const createBar = () => {
        if (document.getElementById('clivon-ghost-bar')) return;

        const bar = document.createElement('div');
        bar.id = 'clivon-ghost-bar';
        bar.innerHTML = `
            <button class="ghost-btn" id="btn-back"><svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg></button>
            <button class="ghost-btn" id="btn-forward"><svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" fill="currentColor"/></svg></button>
            <button class="ghost-btn" id="btn-home"><svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/></svg></button>

            <div id="ghost-search-container">
                <input id="ghost-search" type="text" placeholder="Clivon Search">
            </div>

            <div id="adblock-toggle" title="Toggle Shield"><div id="adblock-knob"></div></div>

            <button class="ghost-btn" id="btn-min"><svg viewBox="0 0 24 24"><path d="M6 19h12v2H6z" fill="currentColor"/></svg></button>
            <button class="ghost-btn" id="btn-full"><svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor"/></svg></button>
            <button class="ghost-btn danger" id="btn-close"><svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg></button>
        `;

        // INJECTION TARGET: Document Element (Root)
        // This sits outside the Body, safer from "body.innerHTML = ''" nukes
        if (document.documentElement) {
            document.documentElement.appendChild(bar);
            // Also need to push body down? No, overlay is fine for Ghost Mode.
        } else {
            console.error("No documentElement found!");
        }

        // Listeners
        document.getElementById('btn-back').onclick = () => window.history.back();
        document.getElementById('btn-forward').onclick = () => window.history.forward();
        document.getElementById('btn-home').onclick = () => window.location.href = 'https://www.youtube.com';
        document.getElementById('btn-min').onclick = () => ipcRenderer.invoke('minimize-window');
        document.getElementById('btn-full').onclick = () => {
            if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen();
        };
        document.getElementById('btn-close').onclick = () => ipcRenderer.invoke('close-window');
        const toggle = document.getElementById('adblock-toggle');
        toggle.onclick = () => toggle.classList.toggle('off');
    };

    // 3. Kickstart
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', createBar);
    } else {
        createBar();
    }

    // 4. Persistence (Healer)
    const observer = new MutationObserver((mutations) => {
        if (!document.getElementById('clivon-ghost-bar')) {
            console.log("👻 Ghost Bar Missing! Re-injecting...");
            createBar();
        }
    });
    observer.observe(document.documentElement, { childList: true });
}

module.exports = { injectTitlebar };
