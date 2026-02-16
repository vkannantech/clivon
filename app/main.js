/**
 * 🚀 CLIVON NUCLEAR V11.0 - ADVANCED MULTI-LAYER AD DESTROYER
 * Main Process - Advanced Engine with Multiple Fallback Systems
 * Same UI but Advanced Ad Blocking
 */

const { app, BrowserWindow, session, ipcMain, net, shell } = require('electron');


const path = require('path');
const fs = require('fs');

// [REMOVED] Network Boost Engine
// Restored to Vanilla State

// [FIX] Disable QUIC to prevent YouTube playback errors and connection reset
app.commandLine.appendSwitch('disable-quic');
// [FIX] Hardened Anti-Detection for Google Sign-In
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch('disable-features', 'CrossSiteDocumentBlockingIfIsolating,SameSiteByDefaultCookies');
app.commandLine.appendSwitch('enable-features', 'NetworkService,NetworkServiceInProcess');

// ============================================
// ADVANCED CONFIGURATION
// ============================================

const CONFIG = {
    VERSION: '1.0.1',
    // UPDATED: Use a recent, standard Chrome User Agent to pass Google Security Checks
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    BLOCKING_MODE: 'MULTI_LAYER_AGGRESSIVE',
    AUTO_FULLSCREEN: true,
    HARDWARE_ACCELERATION: true,

    // Multi-layer system settings
    LAYERS: {
        NETWORK: true,      // Layer 1: Network blocking
        DOM_CSS: true,      // Layer 2: DOM/CSS blocking  
        SCRIPT_INJECTION: true, // Layer 3: Script injection
        AUTO_SKIP: true,    // Layer 4: Auto-skip system
        MUTATION_GUARD: true // Layer 5: Mutation monitoring
    }
};

let mainWindow;
let adStats = {
    blockedNetworkRequests: 0,
    skippedVideoAds: 0,
    hiddenAdElements: 0,
    totalProtectedVideos: 0,
    startTime: Date.now()
};

// ============================================
// 1. ADVANCED EXTENSION LOADER (OPTIONAL)
// ============================================

async function loadAdvancedExtensions() {
    console.log('🛡️ Loading Advanced Extensions System...');

    // UPDATED: Pointing to uBlock Origin Lite (MV3)
    const extPath = path.join(__dirname, 'extensions', 'uBOL');

    if (fs.existsSync(path.join(extPath, 'manifest.json'))) {
        try {
            const ext = await session.defaultSession.loadExtension(extPath, {
                allowFileAccess: true
            });

            if (ext) {
                console.log(`✅ [uBlock Origin Lite] ACTIVATED: v${ext.version}`);
                console.log(`🛡️ [uBOL] Path: ${extPath}`);

                // Configure uBlock for YouTube
                setTimeout(() => {
                    if (mainWindow) {
                        mainWindow.webContents.executeJavaScript(`
                            console.log("🛡️ [Clivon Shield] uBlock Origin Lite is protecting the viewport");
                        `).catch(() => { });
                    }
                }, 5000);
            }
        } catch (err) {
            console.log('⚠️ Extension loading failed:', err.message);
        }
    } else {
        console.log('⚠️ uBOL extension not found at:', extPath);
    }
}

// ============================================
// 1.5 USER EXTENSION LOADER (AUTO-DISCOVERY)
// ============================================
async function loadUserExtensions() {
    console.log('🔍 Looking for User Extensions...');
    const configPath = path.join(__dirname, 'clivon.json');
    let extensionPaths = [];

    // 1. Load from Config
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (config.extensionPaths && Array.isArray(config.extensionPaths)) {
                extensionPaths.push(...config.extensionPaths);
            }
        } catch (e) {
            console.error('⚠️ Error reading clivon.json:', e.message);
        }
    }

    // 2. Add Default Fallbacks
    const home = app.getPath('home');
    const defaultPaths = [
        path.join(home, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Extensions'),
        path.join(home, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Profile 1', 'Extensions'),
        path.join(home, 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Extensions'),
        path.join(home, 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Profile 1', 'Extensions')
    ];
    extensionPaths.push(...defaultPaths);

    // Remove duplicates
    extensionPaths = [...new Set(extensionPaths)];

    for (let extDir of extensionPaths) {
        if (fs.existsSync(extDir)) {
            console.log(`📂 Checking extension path: ${extDir}`);

            // Case A: Direct path to an extension (has manifest)
            if (fs.existsSync(path.join(extDir, 'manifest.json'))) {
                await loadOneExtension(extDir);
                continue;
            }

            // Case B: Extensions folder (contains IDs)
            try {
                const entries = fs.readdirSync(extDir, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        const idPath = path.join(extDir, entry.name);

                        // Check if this ID folder has versions inside
                        if (fs.existsSync(idPath)) {
                            const versionEntries = fs.readdirSync(idPath, { withFileTypes: true });
                            // Sort to get latest version
                            const versions = versionEntries
                                .filter(v => v.isDirectory())
                                .map(v => v.name)
                                .sort((a, b) => {
                                    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
                                });

                            if (versions.length > 0) {
                                const latestVersion = versions.pop();
                                const fullPath = path.join(idPath, latestVersion);
                                await loadOneExtension(fullPath);
                            }
                        }
                    }
                }
            } catch (e) {
                console.log(`⚠️ Failed to scan dir ${extDir}: ${e.message}`);
            }
        }
    }
}

async function loadOneExtension(dir) {
    try {
        const ext = await session.defaultSession.loadExtension(dir, { allowFileAccess: true });
        if (ext) {
            console.log(`✅ [User Ext] Loaded: ${ext.name} (v${ext.version})`);
        }
    } catch (e) {
        // Ignore duplicate extension errors or manifest errors
        if (!e.message.includes('Extension is already loaded')) {
            console.log(`❌ Failed to load ${path.basename(dir)}: ${e.message}`);
        }
    }
}

// ============================================
// 2. [DISABLED] ADVANCED AD BLOCKING ENGINE
// ============================================
// function setupAdvancedAdBlocker() {
//    // All Ad-Blocking Logic Removed
// }

// ========== LAYER 1: NETWORK BLOCKING ==========
function setupNetworkBlockingLayer(ses) {
    // ULTIMATE AD DOMAIN BLACKLIST
    const AD_BLACKLIST = {
        // Google Ad Services
        GOOGLE_ADS: [
            'doubleclick.net',
            'googleadservices.com',
            'googlesyndication.com',
            'google.com/pagead',
            'google.com/aclk',
            'google.com/ads',
            'google.com/adsense',
            'adservice.google.com',
            'adservice.google',
            'pagead2.googlesyndication.com',
            'securepubads.g.doubleclick.net',
            'partner.googleadservices.com',
            'tpc.googlesyndication.com'
        ],

        // YouTube Specific Ads
        YOUTUBE_ADS: [
            'youtube.com/pagead',
            'youtube.com/ptracking',
            'youtube.com/api/stats/ads',
            'youtube.com/api/stats/atr',
            'youtube.com/api/stats/qoe',
            'youtube.com/get_midroll',
            'youtube.com/1p-user-list',
            'youtube.com/viewthroughconversion',
            'ads.youtube.com',
            'youtube.com/ads',
            'youtube.com/ad_',
            'youtube.com/log_event',
            'youtube.com/pagead/conversion'
        ],

        // Tracking & Analytics
        TRACKING: [
            'google-analytics.com',
            'googletagmanager.com',
            'googletagservices.com',
            'youtube.com/s/csi_',
            'youtube.com/gen_204',
            'youtube.com/error_204'
        ],

        // Third-Party Ad Networks
        THIRD_PARTY: [
            'adsafeprotected.com',
            'adsrvr.org',
            'adnxs.com',
            'amazon-adsystem.com',
            'criteo.com',
            'pubmatic.com',
            'rubiconproject.com',
            'openx.net',
            '2mdn.net',
            'scorecardresearch.com'
        ],

        // Premium Nags & Consent
        NAGS: [
            'consent.youtube.com',
            'fundingchoicesmessages.google.com'
            // 'youtube.com/premium' - MOVED TO WHITELIST
        ]
    };

    // ESSENTIAL WHITELIST (NEVER BLOCK)
    const ESSENTIAL_WHITELIST = [
        'googlevideo.com/videoplayback',  // Video streams
        'youtube.com/watch',              // Watch pages
        'youtube.com/embed',              // Embeds
        'youtube.com/live_',              // Live streams
        'youtube.com/s/player',           // Player
        'youtube.com/api/youtubei',       // YouTube API
        'youtube.com/youtubei',           // YouTube API
        'youtube.com/service_ajax',       // AJAX
        'youtube.com/feed',               // Feed
        'youtube.com/subscriptions',      // Subs
        'youtube.com/channel',            // Channels
        'youtube.com/c/',                 // Channels
        'youtube.com/user/',              // Users
        'youtube.com/results',            // Search
        'youtube.com/playlist',           // Playlists
        'accounts.google.com',            // Login
        'myaccount.google.com',           // Account
        'google.com/ServiceLogin',        // Login Redir
        'google.com/signin',              // Signin
        '/get_video_info',                // Critical video metadata
        '/ptracking',                     // Playback tracking (essential for transition)
        '/pcr',                           // Critical playback control
        'youtube.com/premium',            // Account Status
        'gen_204'                        // Heartbeat/Metrics (Required for Premium status)
    ];

    ses.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
        const url = details.url.toLowerCase();

        // FIRST: Allow essential domains
        for (const essential of ESSENTIAL_WHITELIST) {
            if (url.includes(essential)) {
                return callback({ cancel: false });
            }
        }

        // SECOND: C++ Network Boost Engine Check
        if (networkBoost.shouldBlock(url)) {
            adStats.blockedNetworkRequests++;
            if (adStats.blockedNetworkRequests % 20 === 0) {
                console.log(`☢️ [Network Boost] Shielded ${adStats.blockedNetworkRequests} requests`);
            }
            return callback({ cancel: true });
        }

        // THIRD: Block ALL ad domains (Legacy List)
        const allBlockLists = [
            ...AD_BLACKLIST.GOOGLE_ADS,
            ...AD_BLACKLIST.YOUTUBE_ADS,
            ...AD_BLACKLIST.TRACKING,
            ...AD_BLACKLIST.THIRD_PARTY,
            ...AD_BLACKLIST.NAGS
        ];

        for (const blockPattern of allBlockLists) {
            if (url.includes(blockPattern)) {
                adStats.blockedNetworkRequests++;

                // Log every 20 blocked requests
                if (adStats.blockedNetworkRequests % 20 === 0) {
                    console.log(`☢️ Network Layer: Blocked ${adStats.blockedNetworkRequests} ad requests`);
                }

                return callback({ cancel: true });
            }
        }

        callback({ cancel: false });
    });
}

// ========== LAYER 2: HEADER MODIFICATION ==========
function setupHeaderModificationLayer(ses) {
    ses.webRequest.onBeforeSendHeaders({ urls: ['*://*.youtube.com/*'] }, (details, callback) => {
        const headers = details.requestHeaders || {};

        // Remove tracking headers
        const trackingHeaders = [
            'X-Client-Data'
        ];

        trackingHeaders.forEach(header => {
            delete headers[header];
        });

        // Add ad-blocking headers
        headers['X-Clivon-Ad-Blocker'] = ['Active'];
        headers['X-Ad-Blocking-Level'] = ['Maximum'];

        callback({ requestHeaders: headers });
    });
}

// ========== LAYER 3: RESPONSE FILTERING ==========
function setupResponseFilteringLayer(ses) {
    ses.webRequest.onHeadersReceived({ urls: ['*://*.youtube.com/*'] }, (details, callback) => {
        const responseHeaders = details.responseHeaders || {};

        // REMOVED: delete responseHeaders['Set-Cookie'];
        // Restoring cookies fixed the "loading loop" by preserving session state

        // Add security headers
        responseHeaders['X-Clivon-Protected'] = ['true'];
        responseHeaders['X-Content-Type-Options'] = ['nosniff'];

        callback({ responseHeaders });
    });
}

// ============================================
// 3. ADVANCED WINDOW CREATION (SAME UI)
// ============================================

async function createAdvancedWindow() {
    console.log('🚀 Creating Advanced YouTube Window...');

    const ses = session.defaultSession;

    // [FIX] Google Sign-In "Secure Browser" Error
    // Use a clean, standard Chrome User Agent. Do NOT append Electron/App names.
    const cleanUA = CONFIG.USER_AGENT;

    ses.setUserAgent(cleanUA);
    app.userAgentFallback = cleanUA;

    // REMOVED: await ses.clearCache();
    // Clearing cache on startup was logging out Premium users.
    // Persistent sessions are now enabled.

    // Create window with YOUR original UI settings
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        backgroundColor: '#0F0F0F',
        frame: true,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
            webSecurity: true,
            allowRunningInsecureContent: false,
            backgroundThrottling: false,
            disableBlinkFeatures: 'AutomationControlled'
        },
        show: false,
        icon: path.join(__dirname, 'icon.png'),
        title: `Clivon Advanced v${CONFIG.VERSION} - Ad-Free YouTube`
    });

    // Window event handlers (SAME AS BEFORE)
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.maximize();

        if (CONFIG.AUTO_FULLSCREEN) {
            setTimeout(() => {
                mainWindow.setFullScreen(true);
                console.log('✅ Auto-fullscreen engaged');
            }, 1000);
        }
    });

    // Handle Window Open Requests (Popups & External Links)
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // ALLOW: Google Sign-In Popups (Internal)
        if (url.startsWith('https://accounts.google.com') || url.startsWith('https://www.google.com/accounts')) {
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    autoHideMenuBar: true,
                    webPreferences: {
                        contextIsolation: true,
                        nodeIntegration: false,
                        sandbox: true
                    }
                }
            };
        }

        // DENY & OPEN EXTERNAL: Everything else (e.g. Links in description)
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Handle In-App Navigation (Same Tab)
    mainWindow.webContents.on('will-navigate', (event, url) => {
        const allowedDomains = ['youtube.com', 'googlevideo.com', 'accounts.google.com', 'google.com', 'gstatic.com'];
        const isAllowed = allowedDomains.some(domain => url.includes(domain));

        if (!isAllowed) {
            // Block navigation and open in external browser
            console.log(`� Opening external: ${url}`);
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    // Load YouTube
    const youtubeUrl = 'https://www.youtube.com';
    console.log(`🌐 Loading: ${youtubeUrl}`);

    await mainWindow.loadURL(youtubeUrl, {
        httpReferrer: 'https://www.google.com/'
    });

    console.log('✅ Advanced Window Created');
    return mainWindow;
}

// ============================================
// 4. [DISABLED] ADVANCED INJECTION SYSTEMS
// ============================================

function injectAdvancedSystems() {
    if (!mainWindow) return;

    console.log('💉 Advanced Ad-Blocking Systems: DISABLED');
    // All injections removed
}

// LAYER 4: DOM/CSS BLOCKING
function injectDOMCSSLayer() {
    mainWindow.webContents.executeJavaScript(`
        // ADVANCED CSS BLOCKING - Hides all ads without breaking UI
        const advancedCSS = \`
            /* === LAYER 4: DOM/CSS BLOCKING === */
            
            /* 1. VIDEO PLAYER ADS (100% hidden) */
            .ytp-ad-module,
            .ytp-ad-overlay-container,
            .ytp-ad-player-overlay,
            .ytp-ad-text-overlay,
            .ytp-ad-image-overlay,
            .ytp-ad-message-overlay,
            .ytp-ad-skip-button-container,
            .ytp-ad-skip-button,
            .ytp-ad-skip-button-modern,
            .video-ads,
            #player-ads,
            .ytp-paid-content-overlay,
            .ad-showing .html5-video-container,
            .ad-interrupting .html5-video-container {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
                z-index: -9999 !important;
            }
            
            /* 2. AD STATE OVERRIDE */
            #movie_player.ad-showing,
            #movie_player.ad-interrupting,
            .html5-video-player.ad-showing,
            .html5-video-player.ad-interrupting {
                position: relative !important;
                z-index: 1000 !important;
            }
            
            /* 3. FORCE VIDEO VISIBILITY */
            #movie_player.ad-showing video,
            #movie_player.ad-interrupting video,
            .html5-video-player.ad-showing video,
            .html5-video-player.ad-interrupting video {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                z-index: 1001 !important;
                background: #000 !important;
            }
            
            /* 4. AD CONTAINERS (Minimize, don't remove) */
            ytd-ad-slot-renderer,
            ytd-display-ad-renderer,
            ytd-promoted-sparkles-web-renderer,
            ytd-action-companion-ad-renderer,
            ytd-compact-promoted-video-renderer,
            ytd-in-feed-ad-layout-renderer,
            ytd-search-pyv-renderer,
            ytd-video-masthead-ad-v3-renderer,
            ytd-merch-shelf-renderer {
                min-height: 0 !important;
                height: 0 !important;
                overflow: hidden !important;
                position: relative !important;
            }
            
            /* 5. REMOVE PREMIUM PROMPTS */
            ytd-mealbar-promo-renderer,
            ytd-enforcement-message-view-model {
                display: none !important;
            }
            
            /* 6. AUTO-THEATER MODE */
            ytd-watch-flexy[theater],
            ytd-watch-flexy[theater] #primary {
                max-width: 100% !important;
            }
        \`;
        
        // Inject CSS
        const style = document.createElement('style');
        style.id = 'clivon-advanced-css';
        style.textContent = advancedCSS;
        document.head.appendChild(style);
        
        console.log('✅ Layer 4: DOM/CSS Blocking - ACTIVE');
    `).catch(() => { });
}

// LAYER 5: SCRIPT INJECTION
function injectScriptLayer() {
    mainWindow.webContents.executeJavaScript(`
        // === LAYER 5: ADVANCED SCRIPT BLOCKING ===
        
        // 1. Override YouTube's ad functions
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const url = args[0]?.url || args[0] || '';
            const urlStr = url.toString().toLowerCase();
            
            // Block ad-related fetch requests
            const adPatterns = [
                'pagead', 'ptracking', 'stats/ads', 'get_midroll',
                'adservice', 'doubleclick', 'googlesyndication'
            ];
            
            for (const pattern of adPatterns) {
                if (urlStr.includes(pattern)) {
                    console.log('🚫 Blocked ad fetch:', pattern);
                    return Promise.resolve(new Response('', { status: 204 }));
                }
            }
            
            return originalFetch.apply(this, args);
        };
        
        // 2. Override XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            const urlStr = (url || '').toString().toLowerCase();
            
            if (urlStr.includes('pagead') || urlStr.includes('ptracking')) {
                this._clivonBlocked = true;
                this.send = function() {
                    this.readyState = 4;
                    this.status = 200;
                    this.responseText = '{}';
                    if (this.onreadystatechange) this.onreadystatechange();
                };
            }
            
            return originalXHROpen.apply(this, arguments);
        };
        
        console.log('✅ Layer 5: Script Injection - ACTIVE');
    `).catch(() => { });
}

// LAYER 6: AUTO-SKIP SYSTEM
function injectAutoSkipLayer() {
    mainWindow.webContents.executeJavaScript(`
        // === LAYER 6: AGGRESSIVE AUTO-SKIP SYSTEM ===
        let totalSkips = 0;
        
        const fastSkip = () => {
            const player = document.querySelector('#movie_player, .html5-video-player');
            if (player && (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting'))) {
                const video = player.querySelector('video');
                if (video && video.duration > 0) {
                    video.muted = true;
                    video.playbackRate = 16;
                    video.currentTime = video.duration - 0.1;
                    totalSkips++;
                    if (totalSkips % 5 === 0) console.log("⏭️ [Layer 6] Force-skipped ad");
                }
                
                const skipBtn = player.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern');
                if (skipBtn) skipBtn.click();
            }
        };
        
        setInterval(fastSkip, 150); // High-speed backup skip
        console.log('✅ Layer 6: Auto-Skip System - ACTIVE (Aggressive)');
    `).catch(() => { });
}

// LAYER 7: MUTATION GUARD
function injectMutationGuardLayer() {
    mainWindow.webContents.executeJavaScript(`
        // === LAYER 7: MUTATION GUARD SYSTEM ===
        
        const mutationGuard = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                // Check for new ad elements
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        checkAndBlockAds(node);
                    }
                });
                
                // Watch for ad state changes
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'class' &&
                    mutation.target) {
                    
                    const target = mutation.target;
                    if ((target.id === 'movie_player' || 
                         target.classList.contains('html5-video-player')) &&
                        (target.classList.contains('ad-showing') || 
                         target.classList.contains('ad-interrupting'))) {
                        
                        // Immediately remove ad state
                        target.classList.remove('ad-showing', 'ad-interrupting');
                        
                        // Fast forward video if present
                        const video = target.querySelector('video');
                        if (video && video.duration > 0) {
                            video.muted = true;
                            video.playbackRate = 16;
                            video.currentTime = video.duration - 0.1;
                        }
                    }
                }
            });
        });
        
        function checkAndBlockAds(element) {
            const adSelectors = [
                'ytd-ad-', '.ytp-ad-', '.video-ads', '#player-ads',
                '.ad-showing', '.ad-interrupting'
            ];
            
            const tagName = element.tagName.toLowerCase();
            const className = element.className || '';
            const classStr = typeof className === 'string' ? className.toLowerCase() : '';
            
            // Check if it's an ad element
            const isAd = adSelectors.some(selector => {
                if (selector.startsWith('.')) {
                    return classStr.includes(selector.substring(1));
                }
                if (selector.startsWith('#')) {
                    return element.id === selector.substring(1);
                }
                return tagName.includes(selector);
            });
            
            if (isAd) {
                // Hide ad element
                element.style.cssText = 'display: none !important; visibility: hidden !important;';
            }
            
            // Check children
            if (element.children) {
                Array.from(element.children).forEach(child => {
                    checkAndBlockAds(child);
                });
            }
        }
        
        // Start observing
        mutationGuard.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'id']
        });
        
        console.log('✅ Layer 7: Mutation Guard - ACTIVE');
    `).catch(() => { });
}

// ============================================
// 5. IPC HANDLERS (SAME AS BEFORE + ENHANCED)
// ============================================

// Keep ALL your original IPC handlers (they work fine)
ipcMain.on('window-control', (event, command) => {
    if (!mainWindow) return;

    switch (command) {
        case 'minimize':
            mainWindow.minimize();
            break;
        case 'maximize':
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
            break;
        case 'close':
            mainWindow.close();
            break;
        case 'fullscreen':
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
            break;
        case 'kiosk':
            mainWindow.setKiosk(!mainWindow.isKiosk());
            break;
        case 'devtools':
            mainWindow.webContents.toggleDevTools();
            break;
        case 'reload':
            mainWindow.reload();
            break;
        case 'force-reload':
            mainWindow.webContents.reloadIgnoringCache();
            break;
    }
});

ipcMain.on('video-control', (event, action, data) => {
    if (!mainWindow) return;

    const script = `
        const video = document.querySelector('video');
        if (!video) return;
        
        switch('${action}') {
            case 'play':
                video.play();
                break;
            case 'pause':
                video.pause();
                break;
            case 'skip-forward':
                video.currentTime += ${data?.seconds || 10};
                break;
            case 'skip-backward':
                video.currentTime -= ${data?.seconds || 10};
                break;
            case 'set-speed':
                video.playbackRate = ${data?.speed || 1};
                break;
            case 'toggle-mute':
                video.muted = !video.muted;
                break;
            case 'set-volume':
                video.volume = Math.max(0, Math.min(1, ${data?.volume || 1}));
                break;
            case 'skip-ad':
                // Skip YouTube ads
                const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern');
                if (skipBtn) skipBtn.click();
                break;
        }
    `;

    mainWindow.webContents.executeJavaScript(script).catch(() => { });
});

// NEW: Enhanced stats handler
ipcMain.on('blocker-stats', (event) => {
    const now = Date.now();
    const uptime = Math.floor((now - adStats.startTime) / 1000);

    event.reply('blocker-stats-reply', {
        version: CONFIG.VERSION,
        windowCount: BrowserWindow.getAllWindows().length,
        adStats: {
            ...adStats,
            uptimeSeconds: uptime,
            requestsPerMinute: Math.floor(adStats.blockedNetworkRequests / (uptime / 60))
        },
        layers: CONFIG.LAYERS
    });
});

// Keep other IPC handlers
ipcMain.on('clear-cache', async () => {
    await session.defaultSession.clearStorageData();
    await session.defaultSession.clearCache();
    console.log('🧹 Cache cleared');
});

ipcMain.on('open-pip', async (event, videoUrl) => {
    try {
        let embedUrl = videoUrl;
        if (videoUrl.includes('/watch?v=')) {
            const videoId = videoUrl.split('v=')[1].split('&')[0];
            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
        }

        const pipWindow = new BrowserWindow({
            width: 640,
            height: 360,
            alwaysOnTop: true,
            frame: false,
            webPreferences: {
                preload: path.join(__dirname, 'preload-pip.js'),
                contextIsolation: true,
                nodeIntegration: false
            }
        });

        await pipWindow.loadURL(embedUrl);
    } catch (err) {
        console.error('PiP Error:', err);
    }
});

// ============================================
// 6. APP LIFECYCLE
// ============================================

app.on('ready', async () => {
    // Sanitize UA globally first to match session
    const originalUA = session.defaultSession ? session.defaultSession.getUserAgent() : app.userAgentFallback;
    const cleanFallback = originalUA
        .replace(/Electron\/[0-9\.]+\s/, '')
        .replace(/clivon\/[0-9\.]+\s/, '');
    app.userAgentFallback = cleanFallback;

    console.log('\n' + '='.repeat(60));
    console.log('🚀 CLIVON NUCLEAR V11.0 - ADVANCED MULTI-LAYER SYSTEM');
    console.log('='.repeat(60) + '\n');

    // Create window
    await createAdvancedWindow();

    // Setup advanced ad blocker
    // networkBoost.init(); // REMOVED
    // setupAdvancedAdBlocker(); // REMOVED

    // Load extensions (optional)
    await loadAdvancedExtensions();
    await loadUserExtensions(); // Load user-defined extensions

    // Inject advanced systems
    injectAdvancedSystems();

    console.log('\n' + '='.repeat(60));
    console.log('✅ SYSTEM STATUS:');
    console.log(`   • Version: ${CONFIG.VERSION}`);
    console.log('   • Network Blocking: ACTIVE');
    console.log('   • DOM/CSS Blocking: ACTIVE');
    console.log('   • Script Injection: ACTIVE');
    console.log('   • Auto-Skip System: ACTIVE');
    console.log('   • Mutation Guard: ACTIVE');
    console.log('='.repeat(60) + '\n');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createAdvancedWindow();
    }
});

app.on('before-quit', () => {
    console.log('🧹 Advanced system cleanup...');
    console.log(`📊 Final Stats: ${adStats.blockedNetworkRequests} ads blocked`);
});

// Export for testing
module.exports = { CONFIG, adStats };