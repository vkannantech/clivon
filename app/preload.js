// [FAIL-SAFE] PREVENT AD-SHIELD ON GOOGLE SIGN-IN PAGES
if (window.location.hostname === 'accounts.google.com' || window.location.href.includes('google.com/signin') || window.location.href.includes('googleapis.com')) {
    console.warn('⚠️ Google Sign-In Detected: Aborting Ad-Shield Loading for Safety');
    // Ensure minimal stealth is still applied if auth-preload failed to load, but don't load ad-blockers
    try {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    } catch (e) { }
    // We do NOT return here because we might need some basic polyfills, but we should skip the HEAVY stuff.
    // However, for maximum safety, let's just EXIT entirely if we are in the wrong preload context.
    if (!window.location.href.includes('youtube.com')) {
        return;
    }
}

const { contextBridge, ipcRenderer, webFrame } = require('electron');

// [FIX] Trusted Types Policy for CSP Compliance
if (window.trustedTypes && window.trustedTypes.createPolicy) {
    if (!window.trustedTypes.defaultPolicy) {
        try {
            window.trustedTypes.createPolicy('default', {
                createHTML: (string) => string,
                createScript: (string) => string,
                createScriptURL: (string) => string,
            });
        } catch (e) { console.warn('Trusted Types policy creation failed:', e); }
    }
}

// [FIX] Deep Stealth: Remove defined webdriver property completely
try {
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
    });

    // [FIX] Mock Plugins to pass "User is too new" / Bot checks
    Object.defineProperty(navigator, 'plugins', {
        get: () => [
            { name: "PDF Viewer", filename: "internal-pdf-viewer", description: "Portable Document Format" },
            { name: "Chrome PDF Viewer", filename: "internal-pdf-viewer", description: "Portable Document Format" },
            { name: "Chromium PDF Viewer", filename: "internal-pdf-viewer", description: "Portable Document Format" },
            { name: "Microsoft Edge PDF Viewer", filename: "internal-pdf-viewer", description: "Portable Document Format" },
            { name: "WebKit built-in PDF", filename: "internal-pdf-viewer", description: "Portable Document Format" }
        ]
    });
} catch (e) { }

// [REMOVED] IMPORT C++ PORTED ENGINES
// const { QuantumHyperNuclear } = require('./quantum-shield.js');
// const ClientAdBlockEngine = require('./client-adblock-engine.js');

// ============================================================================
// CLIVON ADVANCED AD-SHIELD v2.1.SURGICAL
// Surgical Ad-Neutralization and Playback-Guard
// ============================================================================

const FastAdSkipper = {
    version: '2.1.SURGICAL',
    isActive: false,
    skipInterval: null,
    observer: null,
    skipCount: 0,
    playGuardInterval: null,

    activate() {
        if (this.isActive) return true;

        if (!document.body || !document.head) {
            setTimeout(() => this.activate(), 50);
            return false;
        }

        this.isActive = true;
        console.log(`🚀 Clivon v${this.version} - VANILLA MODE ACTIVE`);

        // 1. Surgical Ad-Shield (Core) - DISABLED
        // this.injectAggressiveCSS();
        // this.startHighSpeedSkipping();
        // this.startMutationShield();
        // this.startPlayGuard();

        // Only keep Premium Status Detection (Passive)
        this.checkPremiumStatus();
        this.spoofPremiumStatus(); // Kept as passive measure

        // 2-3. C++ Engines - DISABLED
        return true;
    },

    // --- PRIVATE METHODS ---

    injectAggressiveCSS() {
        if (document.getElementById('aggressive-ad-shield-css')) return;
        const style = document.createElement('style');
        style.id = 'aggressive-ad-shield-css';
        style.textContent = `
            /* Instant Nuke for ad containers - Surgical */
            .ytp-ad-module, 
            .ytp-ad-overlay-container, 
            .video-ads, 
            .ytp-ad-player-overlay,
            #player-ads,
            ytd-ad-slot-renderer,
            ytd-promoted-sparkles-web-renderer,
            ytd-player-legacy-desktop-watch-ads-renderer {
                display: none !important;
                visibility: hidden !important;
                width: 0 !important;
                height: 0 !important;
                pointer-events: none !important;
            }
            
            /* Guard skip button */
            .ytp-ad-skip-button, .ytp-ad-skip-button-modern {
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
                z-index: 2147483647 !important;
            }
        `;
        document.head.appendChild(style);
    },

    startHighSpeedSkipping() {
        if (this.skipInterval) clearInterval(this.skipInterval);
        this.skipInterval = setInterval(() => this.skipAdImmediately(), 150); // Slightly slower for stability
    },

    startMutationShield() {
        if (this.observer) this.observer.disconnect();
        if (!document.body) return; // Final guard

        this.observer = new MutationObserver(() => this.skipAdImmediately());
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    },

    startPlayGuard() {
        if (this.playGuardInterval) clearInterval(this.playGuardInterval);
        this.playGuardInterval = setInterval(() => {
            const video = document.querySelector('video');
            const player = document.querySelector('#movie_player');

            // If video is stalled in a non-ad state, force play
            if (video && video.paused && player && !player.classList.contains('ad-showing')) {
                // Only force play if the player is actually meant to be playing
                const playButton = document.querySelector('.ytp-play-button');
                if (playButton && playButton.getAttribute('aria-label')?.includes('Pause')) {
                    video.play().catch(() => { });
                }
            }
        }, 1000);
    },

    skipAdImmediately() {
        try {
            let skipped = false;

            // 1. CLICK SKIP BUTTONS
            const skipSelectors = ['.ytp-ad-skip-button', '.ytp-ad-skip-button-modern', '.ytp-ad-skip-button-slot'];
            skipSelectors.forEach(selector => {
                const btn = document.querySelector(selector);
                if (btn) {
                    btn.click();
                    skipped = true;
                }
            });

            // 2. VORTEX NUKE 2.1: Surgical Neutralization
            const player = document.querySelector('#movie_player');
            const video = document.querySelector('video');

            if (player && (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting'))) {
                if (video && video.duration > 0) {
                    // Instead of stripping state instantly, we accelerate the ad to 16x 
                    // and jump to the very end. This lets YouTube handle the transition naturally.
                    video.muted = true;
                    video.playbackRate = 16;

                    // Always stay near the end to trigger auto-transition
                    if (video.currentTime < video.duration - 0.2) {
                        video.currentTime = video.duration - 0.1;
                    }
                    skipped = true;
                }
            }

            // 3. SHORTS AD DESTROYER
            const activeShort = document.querySelector('ytd-reel-video-renderer[is-active]');
            if (activeShort && activeShort.querySelector('.ytd-ad-slot-renderer, #player-ads')) {
                if (video) video.currentTime = video.duration - 0.1;
                skipped = true;
            }

            if (skipped) {
                this.skipCount++;
            }

            return skipped;
        } catch (e) { return false; }
    },

    checkPremiumStatus() {
        const check = () => {
            const isPremium = !!(
                document.querySelector('ytd-topbar-logo-renderer #premium-container') ||
                document.querySelector('yt-icon#premium-logo') ||
                document.title.includes('Premium')
            );

            if (isPremium) {
                console.log("💎 [Clivon Shield] PREV PRIVILEGE DETECTED: YouTube Premium is Active");
                // In Premium mode, we still watch for ads but expect none.
                // We'll reduce the skip interval to save resources.
                if (this.skipInterval) {
                    clearInterval(this.skipInterval);
                    this.skipInterval = setInterval(() => this.skipAdImmediately(), 500);
                }
            } else {
                console.log("⭐ [Clivon Shield] REGULAR ACCOUNT: Aggressive Ad-Blocking is Active");
            }
        };

        // Check after initial load and then periodically
        setTimeout(check, 5000);
        setInterval(check, 30000);
    },

    spoofPremiumStatus() {
        console.log("💉 [Clivon Shield] Injecting Premium Spoofing Engine...");

        // This script will be executed in the main world to override ytcfg
        const spoofScript = `
            try {
                // 1. Force ytcfg overrides
                const forcePremium = (cfg) => {
                    if (!cfg) return;
                    
                    // Essential Premium flags
                    const flags = {
                        'is_premium': true,
                        'web_player_is_premium': true,
                        'web_enable_premium_player': true,
                        'PLAYER_VARS': { 
                            'ad_slots': '',
                            'is_premium': '1'
                        },
                        'EXPERIMENT_FLAGS': {
                            'ad_slots_in_player': false,
                            'is_premium': true,
                            'web_player_ad_headers': false,
                            'web_enable_premium_player': true,
                            'web_premium_subscriber_state': 'ACTIVE'
                        },
                        'INNERTUBE_CONTEXT': {
                            'user': { 'isSubscribed': true }
                        }
                    };

                    // Deep merge or assign flags
                    Object.assign(cfg, flags);
                    if (cfg.EXPERIMENT_FLAGS) Object.assign(cfg.EXPERIMENT_FLAGS, flags.EXPERIMENT_FLAGS);
                    
                    console.log("💎 [Clivon MainWorld] Internal Premium State Forced");
                };

                // Apply to existing config
                if (window.ytcfg) forcePremium(window.ytcfg);

                // Intercept future config sets
                const originalSet = window.ytcfg && window.ytcfg.set;
                if (originalSet) {
                    window.ytcfg.set = function(name, value) {
                        if (name === 'EXPERIMENT_FLAGS' || name === 'PLAYER_VARS') {
                            // Neutralize ad-related values
                            if (value && typeof value === 'object') {
                                value.ad_slots_in_player = false;
                                value.is_premium = true;
                            }
                        }
                        return originalSet.apply(this, arguments);
                    };
                }

                // 2. Mock 'yt' global object if it exists
                if (window.yt && window.yt.config_) {
                    window.yt.config_.IS_PREMIUM = true;
                }

            } catch (e) { console.error("Premium Spoof Error:", e); }
        `;

        // Inject as a direct script tag to bypass isolation for internal YouTube scripts
        const script = document.createElement('script');
        script.textContent = spoofScript;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
    },

    getStats() {
        return { version: this.version, isActive: this.isActive, skipCount: this.skipCount };
    }
};

// ============================================================================
// LAYER 2: QUANTUM HYPER NUCLEAR (Ported C++)
// ============================================================================
class QuantumHyperNuclear {
    constructor() {
        this.stats = { adElementsRemoved: 0 };
    }

    engage() {
        console.log(`⚡ QUANTUM NUCLEAR: FUTURE ENGINE ACTIVATION`);
        this.injectSmartCSS();
        this.setupMutationGuard();
    }

    injectSmartCSS() {
        const css = `.ytp-ad-module, .ytp-ad-overlay-container, ytd-ad-slot-renderer { visibility: hidden !important; opacity: 0 !important; }`;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    setupMutationGuard() {
        const observer = new MutationObserver(() => this.cleanup());
        observer.observe(document.body, { childList: true, subtree: true });
    }

    cleanup() {
        const ads = document.querySelectorAll('.ad-showing, .ad-interrupting');
        ads.forEach(ad => {
            ad.classList.remove('ad-showing', 'ad-interrupting');
            this.stats.adElementsRemoved++;
        });
    }
}

// ============================================================================
// LAYER 3: CLIENT AD-BLOCK ENGINE (Ported C++)
// ============================================================================
class ClientAdBlockEngine {
    constructor() {
        this.init();
    }

    init() {
        console.log('🔥 CLIENT ENGINE: Operational');
        setInterval(() => this.forceSkip(), 100);
    }

    forceSkip() {
        const video = document.querySelector('video');
        const ad = document.querySelector('.ad-showing, .video-ads, .ytp-ad-module');
        if (video && ad) {
            video.currentTime = video.duration || 999;
            const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern');
            if (skipBtn) skipBtn.click();
        }
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

if (window.location.hostname.includes('youtube.com')) {
    // Run immediately if DOM is ready, otherwise wait for DOMContentLoaded
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => {
            window.clivonAdBlocker = FastAdSkipper;
            window.clivonAdBlocker.activate();
        });
    } else {
        window.clivonAdBlocker = FastAdSkipper;
        window.clivonAdBlocker.activate();
    }
}

// ============================================================================
// CONTEXT BRIDGE
// ============================================================================

contextBridge.exposeInMainWorld('clivonAPI', {
    minimize: () => ipcRenderer.invoke('minimize-window'),
    maximize: () => ipcRenderer.invoke('maximize-window'),
    close: () => ipcRenderer.invoke('close-window'),
    quit: () => ipcRenderer.invoke('quit-app'),
    adBlocker: {
        getStats: () => window.clivonAdBlocker?.getStats() || { version: 'none', isActive: false, skipCount: 0 }
    }
});

console.log("⚡ Clivon Surgical Ad-Shield Deployed");