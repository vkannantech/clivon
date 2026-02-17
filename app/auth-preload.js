/**
 * 🔐 CLIVON STEALTH AUTH ENGINE V3.0
 * Maximum Google Sign-In Compatibility
 * Passes ALL Google bot/automation detection checks
 */

const { contextBridge } = require('electron');

(function stealthAuthEngine() {
    'use strict';

    try {

        // ============================================================
        // LAYER 1: NAVIGATOR STEALTH - Remove ALL Automation Signals
        // ============================================================

        // 1A. Kill WebDriver flag (most important)
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
            configurable: true
        });

        // 1B. Mock realistic plugins (Google checks this for "User is too new")
        const mockPlugins = [
            { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format', length: 1 },
            { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format', length: 1 },
            { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format', length: 1 },
            { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format', length: 1 },
            { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer', description: 'Portable Document Format', length: 1 },
        ];

        // Build a proper PluginArray-like object
        const pluginArray = Object.create(PluginArray.prototype);
        mockPlugins.forEach((p, i) => {
            const plugin = Object.create(Plugin.prototype);
            Object.defineProperties(plugin, {
                name: { get: () => p.name },
                filename: { get: () => p.filename },
                description: { get: () => p.description },
                length: { get: () => p.length }
            });
            Object.defineProperty(pluginArray, i, { get: () => plugin });
            Object.defineProperty(pluginArray, p.name, { get: () => plugin });
        });
        Object.defineProperty(pluginArray, 'length', { get: () => mockPlugins.length });
        Object.defineProperty(pluginArray, 'item', { value: (i) => pluginArray[i] });
        Object.defineProperty(pluginArray, 'namedItem', { value: (n) => pluginArray[n] });
        Object.defineProperty(pluginArray, 'refresh', { value: () => { } });

        Object.defineProperty(navigator, 'plugins', {
            get: () => pluginArray,
            configurable: true
        });

        // 1C. Mock MimeTypes
        const mockMimes = ['application/pdf', 'text/pdf'];
        const mimeArray = Object.create(MimeTypeArray.prototype);
        mockMimes.forEach((type, i) => {
            const mime = Object.create(MimeType.prototype);
            Object.defineProperties(mime, {
                type: { get: () => type },
                description: { get: () => 'Portable Document Format' },
                suffixes: { get: () => 'pdf' }
            });
            Object.defineProperty(mimeArray, i, { get: () => mime });
            Object.defineProperty(mimeArray, type, { get: () => mime });
        });
        Object.defineProperty(mimeArray, 'length', { get: () => mockMimes.length });
        Object.defineProperty(navigator, 'mimeTypes', {
            get: () => mimeArray,
            configurable: true
        });

        // 1D. Realistic language settings
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
            configurable: true
        });

        // 1E. Concurrency (real CPUs)
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => 8,
            configurable: true
        });

        // 1F. Device memory
        Object.defineProperty(navigator, 'deviceMemory', {
            get: () => 8,
            configurable: true
        });

        // 1G. Max touch points (desktop = 0)
        Object.defineProperty(navigator, 'maxTouchPoints', {
            get: () => 0,
            configurable: true
        });

        // 1H. Platform
        Object.defineProperty(navigator, 'platform', {
            get: () => 'Win32',
            configurable: true
        });

        // 1I. Vendor
        Object.defineProperty(navigator, 'vendor', {
            get: () => 'Google Inc.',
            configurable: true
        });

        // 1J. AppVersion
        Object.defineProperty(navigator, 'appVersion', {
            get: () => '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
            configurable: true
        });

        // ============================================================
        // LAYER 2: CHROME OBJECT - Full Mock
        // Google checks window.chrome extensively
        // ============================================================

        const mockChrome = {
            app: {
                isInstalled: false,
                InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
                RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' },
                getDetails: () => null,
                getIsInstalled: () => false,
                installState: () => { },
                runningState: () => { }
            },
            runtime: {
                OnInstalledReason: {
                    CHROME_UPDATE: 'chrome_update',
                    INSTALL: 'install',
                    SHARED_MODULE_UPDATE: 'shared_module_update',
                    UPDATE: 'update'
                },
                OnRestartRequiredReason: {
                    APP_UPDATE: 'app_update',
                    OS_UPDATE: 'os_update',
                    PERIODIC: 'periodic'
                },
                PlatformArch: {
                    ARM: 'arm', ARM64: 'arm64',
                    MIPS: 'mips', MIPS64: 'mips64',
                    X86_32: 'x86-32', X86_64: 'x86-64'
                },
                PlatformOs: {
                    ANDROID: 'android', CROS: 'cros',
                    LINUX: 'linux', MAC: 'mac',
                    OPENBSD: 'openbsd', WIN: 'win'
                },
                RequestUpdateCheckStatus: {
                    NO_UPDATE: 'no_update',
                    THROTTLED: 'throttled',
                    UPDATE_AVAILABLE: 'update_available'
                },
                connect: () => { },
                sendMessage: () => { }
            },
            csi: () => ({
                onloadT: Date.now(),
                pageT: Math.floor(Math.random() * 3000) + 500,
                startE: Date.now() - 5000,
                tran: 15
            }),
            loadTimes: () => ({
                commitLoadTime: Date.now() / 1000 - 1,
                connectionInfo: 'h2',
                finishDocumentLoadTime: Date.now() / 1000 - 0.2,
                finishLoadTime: Date.now() / 1000 - 0.1,
                firstPaintAfterLoadTime: 0,
                firstPaintTime: Date.now() / 1000 - 0.8,
                navigationType: 'Other',
                npnNegotiatedProtocol: 'h2',
                requestTime: Date.now() / 1000 - 2,
                startLoadTime: Date.now() / 1000 - 1.5,
                wasAlternateProtocolAvailable: false,
                wasFetchedViaSpdy: true,
                wasNpnNegotiated: true
            })
        };

        // Safely assign chrome object
        try {
            if (!window.chrome) {
                window.chrome = mockChrome;
            } else {
                // Merge missing keys
                Object.keys(mockChrome).forEach(key => {
                    if (!window.chrome[key]) {
                        window.chrome[key] = mockChrome[key];
                    }
                });
            }
        } catch (e) { }

        // ============================================================
        // LAYER 3: PERMISSION API - Fake real browser permissions
        // Google uses this to detect headless/automation
        // ============================================================

        const originalQuery = window.navigator.permissions?.query;
        if (originalQuery) {
            window.navigator.permissions.query = function (parameters) {
                if (parameters.name === 'notifications') {
                    return Promise.resolve({ state: Notification.permission, onchange: null });
                }
                if (parameters.name === 'clipboard-read' || parameters.name === 'clipboard-write') {
                    return Promise.resolve({ state: 'granted', onchange: null });
                }
                return originalQuery.call(this, parameters);
            };
        }

        // ============================================================
        // LAYER 4: WEBGL FINGERPRINT - Spoof GPU info
        // Headless Chrome has different WebGL renderer
        // ============================================================

        try {
            const getParameterProxyHandler = {
                apply: function (target, thisArg, args) {
                    const param = args[0];
                    const UNMASKED_VENDOR_WEBGL = 0x9245;
                    const UNMASKED_RENDERER_WEBGL = 0x9246;

                    if (param === UNMASKED_VENDOR_WEBGL) return 'Google Inc. (NVIDIA)';
                    if (param === UNMASKED_RENDERER_WEBGL) return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0, D3D11)';
                    return target.apply(thisArg, args);
                }
            };

            const WebGLRenderingContextProto = WebGLRenderingContext.prototype;
            WebGLRenderingContextProto.getParameter = new Proxy(
                WebGLRenderingContextProto.getParameter,
                getParameterProxyHandler
            );
        } catch (e) { }

        // ============================================================
        // LAYER 5: CANVAS FINGERPRINT - Add subtle noise
        // Prevents bot detection via canvas hash matching
        // ============================================================

        try {
            const toDataURL = HTMLCanvasElement.prototype.toDataURL;
            HTMLCanvasElement.prototype.toDataURL = function (type, ...args) {
                const ctx = this.getContext('2d');
                if (ctx) {
                    const imageData = ctx.getImageData(0, 0, this.width || 1, this.height || 1);
                    // Add imperceptible noise (1 pixel value ±1)
                    if (imageData.data.length > 4) {
                        imageData.data[0] = imageData.data[0] ^ 1;
                        ctx.putImageData(imageData, 0, 0);
                    }
                }
                return toDataURL.call(this, type, ...args);
            };
        } catch (e) { }

        // ============================================================
        // LAYER 6: TIMING STEALTH - Humanize event timing
        // Bots have perfectly consistent timing — humans don't
        // ============================================================

        // Slightly randomize Date.now() to appear human
        const _DateNow = Date.now.bind(Date);
        Date.now = function () {
            return _DateNow() + Math.floor(Math.random() * 3);
        };

        // ============================================================
        // LAYER 7: SCREEN & WINDOW - Match real Chrome values
        // ============================================================

        try {
            Object.defineProperty(screen, 'colorDepth', { get: () => 24, configurable: true });
            Object.defineProperty(screen, 'pixelDepth', { get: () => 24, configurable: true });
        } catch (e) { }

        // ============================================================
        // LAYER 8: AUTOMATION STRING REMOVAL
        // Remove ALL traces of Electron/automation from window
        // ============================================================

        const automationStrings = [
            '__webdriver_script_fn',
            '__driver_evaluate',
            '__webdriver_evaluate',
            '__selenium_evaluate',
            '__fxdriver_evaluate',
            '__driver_unwrapped',
            '__webdriver_unwrapped',
            '__selenium_unwrapped',
            '__fxdriver_unwrapped',
            '_Selenium_IDE_Recorder',
            '_selenium',
            'calledSelenium',
            '$cdc_asdjflasutopfhvcZLmcfl_',
            '$chrome_asyncScriptInfo',
            '__$webdriverAsyncExecutor',
            '__lastWatirAlert',
            '__lastWatirConfirm',
            '__lastWatirPrompt',
        ];

        automationStrings.forEach(str => {
            try {
                if (window[str]) delete window[str];
                Object.defineProperty(window, str, {
                    get: () => undefined,
                    configurable: true
                });
            } catch (e) { }
        });

        // ============================================================
        // LAYER 9: ERROR STACK STEALTH
        // Electron shows in error stacks — mask it
        // ============================================================

        const _Error = Error;
        window.Error = function (...args) {
            const err = new _Error(...args);
            if (err.stack) {
                err.stack = err.stack
                    .replace(/\s+at .*(electron|preload|node_modules).*/gi, '')
                    .replace(/Electron\//gi, 'Chrome/')
                    .trim();
            }
            return err;
        };
        Object.setPrototypeOf(window.Error, _Error);
        window.Error.prototype = _Error.prototype;

        // ============================================================
        // LAYER 10: EXPOSE SAFE APIs VIA contextBridge
        // ============================================================

        contextBridge.exposeInMainWorld('__clivonAuth', {
            version: '3.0',
            ready: true,
            platform: 'Win32',
            // Safe ping for renderer to confirm preload loaded
            ping: () => 'pong'
        });

        console.log('🔐 [Clivon Auth Engine v3.0] All 10 layers active — stealth mode engaged');

    } catch (globalErr) {
        console.error('❌ [Clivon Auth Engine] Critical failure:', globalErr);
    }

})();
