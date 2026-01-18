/**
 * CLIVON CORE (ELECTRON ADAPTER - V3.4)
 * Features: Sidebar, Glass Topbar, Notes, PiP, Focus, Resume.
 * Adapts Tauri invoke() calls to clivonAPI calls.
 */

function inject() {
    if (window.__CLIVON_CORE_ACTIVE__) return;
    window.__CLIVON_CORE_ACTIVE__ = true;

    const C = { h: 48, w: 48, bg: "rgba(10, 10, 10, 0.6)", blur: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.08)", shadow: "0 4px 30px rgba(0, 0, 0, 0.2)" };
    function log(m) { console.log(`[Clivon Electron] ${m}`); }

    // ELECTRON ADAPTER
    function invoke(cmd, args = {}) {
        const api = window.clivonAPI;
        if (!api) return;

        switch (cmd) {
            case 'minimize_window': api.minimize(); break;
            case 'maximize_window': api.maximize(); break;
            case 'enter_kiosk': api.enterKiosk(); break;
            case 'quit_app': api.quit(); break;
            case 'open_pip': api.openPiP(args.url); break;
            case 'save_session': api.saveSession(args.url, args.timestamp); break;
            default: console.warn("Unknown command:", cmd);
        }
    }

    // STATE
    let loopState = { active: false, a: -1, b: -1 };

    function render() {
        if (document.getElementById('clivon-bar')) return;
        log("Rendering V3.4 Glass Engine...");

        // BASE CSS
        const css = `
            ytd-merch-shelf-renderer, #ticket-shelf, #offer-module { display: none !important; }
            #clivon-bar, #clivon-side { font-family: "Segoe UI", sans-serif; box-sizing: border-box; }
            #clivon-bar { position: fixed; top: 0; left: 0; width: 100%; height: ${C.h}px; background: ${C.bg}; backdrop-filter: ${C.blur}; border-bottom: ${C.border}; z-index: 2147483647; display: flex; color: #fff; user-select: none; }
            #clivon-side { position: fixed; top: ${C.h}px; left: 0; width: ${C.w}px; height: calc(100vh - ${C.h}px); background: ${C.bg}; backdrop-filter: ${C.blur}; border-right: ${C.border}; z-index: 2147483646; display: flex; flex-direction: column; align-items: center; padding-top: 10px; }
            body, ytd-app { margin-top: ${C.h}px !important; margin-left: ${C.w}px !important; width: calc(100% - ${C.w}px) !important; }
        `;
        const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

        // UI INJECTION - Minimal version
        const bar = document.createElement('div'); bar.id = 'clivon-bar';
        bar.innerHTML = `<div style="padding:14px;font-weight:600;">Clivon V3.4 (Electron)</div>`;
        document.body.appendChild(bar);

        const side = document.createElement('div'); side.id = 'clivon-side';
        document.body.appendChild(side);

        console.log('✅ Glass Engine: Active');
    }

    const beat = () => { requestAnimationFrame(beat); render(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', beat); else beat();
}

module.exports = { inject };
