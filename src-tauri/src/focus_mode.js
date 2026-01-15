
// Clivon Focus Mode (Zero Distraction)
(function () {
    console.log("[Clivon Focus] Engine Loaded");

    const FOCUS_CSS = `
        /* Hide Recommendations / Sidebar */
        #secondary, #related, ytd-watch-next-secondary-results-renderer {
            display: none !important;
        }
        
        /* Hide Comments */
        #comments, ytd-comments {
            display: none !important;
        }
        
        /* Hide Merch / Ticket Shelf */
        ytd-merch-shelf-renderer, #ticket-shelf {
            display: none !important;
        }

        /* Center the Video Player */
        #primary {
            max-width: 100% !important;
            margin: 0 auto !important;
        }
        ytd-watch-flexy[flexy] #primary.ytd-watch-flexy {
            max-width: 100% !important;
            min-width: 0 !important;
            margin: 0 !important; 
        }
    `;

    window.ClivonFocus = {
        enable: () => {
            if (!document.getElementById('clivon-focus-style')) {
                const style = document.createElement('style');
                style.id = 'clivon-focus-style';
                style.textContent = FOCUS_CSS;
                document.head.appendChild(style);
                console.log("[Clivon Focus] Enabled");
            }
        },
        disable: () => {
            const style = document.getElementById('clivon-focus-style');
            if (style) {
                style.remove();
                console.log("[Clivon Focus] Disabled");
            }
        }
    };

    // Listen for Toggle Event from Rust
    window.__TAURI__.event.listen('toggle-focus-mode', (event) => {
        if (event.payload === true) {
            window.ClivonFocus.enable();
        } else {
            window.ClivonFocus.disable();
        }
    });

})();
