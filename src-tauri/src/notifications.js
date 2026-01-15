
// Clivon Smart Notifications (Bridge)
(function () {
    console.log("[Clivon Notifications] Engine Loaded");

    // We observe the "Notification Count" in the YouTube header
    let lastCount = 0;

    const checkNotifications = () => {
        const badge = document.querySelector('.yt-spec-icon-badge-shape__badge');
        if (badge) {
            const count = parseInt(badge.innerText.trim()) || 0;
            if (count > lastCount) {
                console.log(`[Clivon] New Notification Count: ${count}`);

                // Trigger System Notification via Tauri
                // Note: We need the permission to be granted in main.rs/tauri.conf.json
                if (window.__TAURI__ && window.__TAURI__.notification) {
                    window.__TAURI__.notification.sendNotification({
                        title: 'Clivon - YouTube',
                        body: `You have ${count} new notifications`
                    });
                } else if (Notification.permission === 'granted') {
                    // Fallback to standard Web API which Tauri handles
                    new Notification('Clivon - YouTube', {
                        body: `You have ${count} new notifications`,
                        icon: '/icon.png' // This might need absolute path or http url
                    });
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission();
                }

                lastCount = count;
            }
        }
    };

    setInterval(checkNotifications, 10000); // Check every 10 seconds to avoid spam
})();
