
// Clivon Header Mods (Home & Fullscreen Buttons)
(function () {
    console.log("[Clivon Header] Engine Loaded");

    const BTN_ID = 'clivon-header-buttons';

    function addButtons() {
        // Find the specific header section next to the logo
        // YouTube usually has <div id="start"> or <ytd-topbar-logo-renderer>
        const container = document.querySelector('ytd-masthead #start');

        if (container && !document.getElementById(BTN_ID)) {
            const btnContainer = document.createElement('div');
            btnContainer.id = BTN_ID;
            btnContainer.style.display = 'flex';
            btnContainer.style.alignItems = 'center';
            btnContainer.style.marginLeft = '10px';
            btnContainer.style.gap = '8px';

            // --- Home Button ---
            const homeBtn = document.createElement('button');
            homeBtn.title = "Go Home";
            homeBtn.innerHTML = `
                <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 24px; height: 24px; fill: white;">
                    <g><path d="M4,10V21h6V15h4v6h6V10L12,3Z"></path></g>
                </svg>
            `;
            styleButton(homeBtn);
            homeBtn.onclick = () => {
                window.location.href = "https://www.youtube.com";
            };

            // --- Fullscreen Button ---
            const fsBtn = document.createElement('button');
            fsBtn.title = "Toggle Fullscreen";
            fsBtn.innerHTML = `
                <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 24px; height: 24px; fill: white;">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"></path>
                </svg>
            `;
            styleButton(fsBtn);
            fsBtn.onclick = () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(e => {
                        console.log("Fullscreen blocked:", e);
                    });
                } else {
                    document.exitFullscreen();
                }
            };

            btnContainer.appendChild(homeBtn);
            btnContainer.appendChild(fsBtn);

            // Insert after the logo, or at the end of the #start container
            container.appendChild(btnContainer);
            console.log("[Clivon Header] Buttons Injected");
        }
    }

    function styleButton(btn) {
        btn.style.background = 'transparent';
        btn.style.border = 'none';
        btn.style.cursor = 'pointer';
        btn.style.padding = '8px';
        btn.style.borderRadius = '50%';
        btn.style.transition = 'background 0.2s';

        btn.onmouseenter = () => { btn.style.background = 'rgba(255,255,255,0.1)'; };
        btn.onmouseleave = () => { btn.style.background = 'transparent'; };
    }

    // Check continuously as YouTube is a SPA and might wipe the header
    setInterval(addButtons, 1000);

})();
