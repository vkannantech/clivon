// 🛡️ CLIVON STEALTH AUTH PRELOAD (REFINED)
// Bypasses Google "Secure Browser" checks by masking Electron environment

// 0. REMOVE REQUIRE (Causes issues in Sandboxed mode)
// We don't need 'electron' module here, we are just patching globals.

// 1. DELETE AUTOMATION FLAGS (Aggressive)
const stripAutomation = () => {
    try {
        const newProto = navigator.__proto__;
        delete newProto.webdriver;
        navigator.__proto__ = newProto;
        delete window.navigator.webdriver;
    } catch (e) { }
};
stripAutomation();
// Repeat to fight race conditions
setInterval(stripAutomation, 100);

// 2. MOCK CHROME RUNTIME (Essential for Login)
// Google checks if 'window.chrome' exists. Electron removes it by default. We put it back.
if (!window.chrome) {
    window.chrome = {
        runtime: {
            connect: () => { },
            sendMessage: () => { },
            onMessage: { addListener: () => { }, removeListener: () => { } }
        },
        app: {
            isInstalled: false,
            InstallState: {
                DISABLED: 'disabled',
                INSTALLED: 'installed',
                NOT_INSTALLED: 'not_installed'
            },
            RunningState: {
                CANNOT_RUN: 'cannot_run',
                READY_TO_RUN: 'ready_to_run',
                RUNNING: 'running'
            }
        },
        // Mock loadTimes (legacy Chrome API often checked)
        loadTimes: () => {
            return {
                requestTime: new Date().getTime() / 1000,
                startLoadTime: new Date().getTime() / 1000,
                commitLoadTime: new Date().getTime() / 1000,
                finishDocumentLoadTime: new Date().getTime() / 1000,
                finishLoadTime: new Date().getTime() / 1000,
                firstPaintTime: new Date().getTime() / 1000,
                firstPaintAfterLoadTime: 0,
                navigationType: 'Other',
                wasFetchedViaSpdy: true,
                wasNpnNegotiated: true,
                npnNegotiatedProtocol: 'h2',
                wasAlternateProtocolAvailable: false,
                connectionInfo: 'h2'
            }
        },
        csi: () => { }
    };
}

// 3. SPOOF PLUGINS (Look like standard Chrome)
// Electron usually has empty plugins list.
Object.defineProperty(navigator, 'plugins', {
    get: () => {
        const ChromePDFPlugin = {
            0: { type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format", enabledPlugin: Plugin },
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin"
        };
        const PDFViewer = {
            0: { type: "application/pdf", suffixes: "pdf", description: "Portable Document Format", enabledPlugin: Plugin },
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "PDF Viewer"
        };
        return [ChromePDFPlugin, PDFViewer];
    }
});

// 4. WEBGL VENDOR SPOOFING (Optional but Recommended)
try {
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
        // UNMASKED_VENDOR_WEBGL
        if (parameter === 37445) {
            return 'Google Inc. (Intel)';
        }
        // UNMASKED_RENDERER_WEBGL
        if (parameter === 37446) {
            return 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)';
        }
        return getParameter(parameter);
    };
} catch (e) { }

console.log("👻 Auth Preload: Stealth Mode Active");
