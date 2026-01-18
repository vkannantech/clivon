#ifndef QUANTUM_AD_BLOCK_H_
#define QUANTUM_AD_BLOCK_H_

#include <string>

namespace clivon {
namespace quantum {

const char kQuantumEngineVersion[] = "450.43.23320"; // BALANCED

// PART 1: QUANTUM MUTATION OBSERVER (Instant Kill)
const char kQuantumObs[] = R"JS_CODE(
(function() {
    // CLIVON QUANTUM ENGINE MAX TURBO v450.42.23310
    // ---------------------------------------------
    console.log("Clivon Quantum: Engaging Turbo Engine v450.42.23310");

    // CODEC SHIM: Force VP9 / Disable H.264
    try {
        const origIsTypeSupported = MediaSource.isTypeSupported;
        MediaSource.isTypeSupported = function(mime) {
            if (mime.includes('avc1')) return false; // BLOCK H.264
            if (mime.includes('vp9') || mime.includes('webm')) return true; // FORCE VP9
            return origIsTypeSupported(mime);
        };
    } catch(e) {}

    const observerCallback = (mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) { // ELEMENT_NODE
                    // Check for Ad Containers
                    if (node.tagName === 'YTD-AD-SLOT-RENDERER' || 
                        node.tagName === 'YTD-RICH-ITEM-RENDERER' && node.querySelector('ytd-ad-slot-renderer') ||
                        node.tagName === 'TP-YT-IRON-OVERLAY-BACKDROP' || 
                        node.classList.contains('ytd-ad-slot-renderer') ||
                        node.id === 'player-ads' ||
                        node.id === 'offer-module') {
                        
                        node.style.setProperty('display', 'none', 'important');
                        node.style.setProperty('visibility', 'hidden', 'important');
                        node.innerHTML = ''; 
                        node.remove();      
                    }
                    
                    if (node.classList.contains('ytp-ad-overlay-container')) {
                        node.style.setProperty('display', 'none', 'important');
                        document.querySelector('.ytp-ad-overlay-close-button')?.click();
                    }
                }
            }
        }
    };

    const observer = new MutationObserver(observerCallback);
    observer.observe(document.body, { childList: true, subtree: true });
)JS_CODE";

// PART 2: CORE CSS & TIMING LOGIC
const char kQuantumCore[] = R"JS_CODE(
    // LAYER 11: CSS COMPACTOR
    const style = document.createElement('style');
    style.textContent = `
        .video-ads, .ytp-ad-module, .ytp-ad-overlay-container, .ytp-ad-player-overlay,
        #secondary #offer-module, ytd-engagement-panel-section-list-renderer[target-id*="engagement-panel-ads"],
        ytd-merch-shelf-renderer, ytd-banner-promo-renderer,
        yt-mealbar-promo-renderer, ytd-statement-banner-renderer, ytd-in-feed-ad-layout-renderer,
        ad-slot-renderer, ytm-promoted-sparkles-web-renderer, masthead-ad,
        ytd-popup-container[popup-type="DRAG_AND_DROP"], 
        tp-yt-iron-overlay-backdrop { display: none !important; }
    `;
    document.head.appendChild(style);

    // LAYER 12: BALANCED LOOP (Stability First)
    // "Turbo" was too aggressive (Buffering Issues).
    // We strictly use 100ms polling to let the main thread breathe.
    
    setInterval(() => {
        const video = document.querySelector('video');
        const player = document.querySelector('#movie_player');
        
        if (video && player) {
            const isAd = player.classList.contains('ad-showing') || 
                         player.classList.contains('ad-interrupting') ||
                         document.querySelector('.video-ads .ad-container');

            if (isAd) {
                // AD DETECTED -> STANDARD SKIP
                video.muted = true;
                video.playbackRate = 16.0;
                
                // Avoid complex duration checks to prevent seeking errors
                // UPDATE: Network filters are open, so ads WILL load. 
                // We MUST seek to end to skip them instantly.
                if (!isNaN(video.duration) && video.currentTime < video.duration - 0.1) {
                    video.currentTime = video.duration; // FORCE SEEK TO END
                }

                const skipBtn = document.querySelector('.ytp-ad-skip-button') || 
                                document.querySelector('.ytp-ad-skip-button-modern');
                if (skipBtn) {
                    skipBtn.click();
                }
                document.querySelector('.ytp-ad-overlay-close-button')?.click();
            } else {
                 // CONTENT MODE -> NORMALIZED
                 
                 // 1. Enforce Normal Speed
                 if (video.playbackRate > 1.0) video.playbackRate = 1.0; 
                 if (video.muted && video.volume > 0) video.muted = false;

                 // 2. PASSIVE Anti-Stuck
                 // Only click "Play" if the video is paused AND completely ready.
                 // We removed the aggressive "Force Play" that fought buffering.
                 // if (video.paused && video.readyState === 4) video.play(); 
            }
        }
        
        // SIDEBAR CLEANER
        const sidebarItems = document.querySelectorAll('#secondary-inner ytd-rich-item-renderer, #secondary-inner ytd-compact-video-renderer');
        sidebarItems.forEach(item => {
            if (item.innerText.includes("Sponsored") || item.innerText.includes("Ad")) {
                item.remove();
            }
        });
    }, 100); 
    // 100ms = 10 checks/sec. Fast enough for humans, slow enough for CPU.

    // CACHE NUKE
    if(navigator.serviceWorker) { 
        navigator.serviceWorker.getRegistrations().then(function(registrations) { 
            for(let registration of registrations) registration.unregister();
        }); 
    }
})();
)JS_CODE";

inline std::string GetPowerScript() {
    return std::string(kQuantumObs) + std::string(kQuantumCore);
}

} // namespace quantum
} // namespace clivon

#endif // QUANTUM_AD_BLOCK_H_
