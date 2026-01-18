#include "src/simple_handler.h"
#include "include/cef_app.h"
#include "include/cef_parser.h"
#include "include/base/cef_bind.h"
#include "include/wrapper/cef_closure_task.h"
#include "quantum_ad_block.h"
#include "client_protection.h"
#include "network_optimizer.h"
#include "include/wrapper/cef_helpers.h"
#include <algorithm>
#include <string>
#include <iostream>
#include <windows.h>
#include <shellapi.h>

// Global instance pointer
namespace {
    SimpleHandler* g_instance = NULL;
}

// Static Init
// DEFAULT: DISABLED (Gray) as per user request.
// User must click shield to activate "Max Power" (Green).
bool SimpleHandler::is_adblock_enabled_ = false; 

void SimpleHandler::ToggleAdBlock() {
    is_adblock_enabled_ = !is_adblock_enabled_;
    std::cout << "AdBlock Toggled: " << (is_adblock_enabled_ ? "ON" : "OFF") << std::endl;
}

bool SimpleHandler::IsAdBlockEnabled() {
    return is_adblock_enabled_;
}

SimpleHandler::SimpleHandler() 
    : is_closing_(false) {
    g_instance = this;
}

SimpleHandler::~SimpleHandler() {
    g_instance = NULL;
}

// static
SimpleHandler* SimpleHandler::GetInstance() {
    return g_instance;
}

CefRefPtr<CefBrowser> SimpleHandler::GetBrowser() {
    if (!browser_list_.empty()) {
        return browser_list_.front();
    }
    return nullptr;
}


// -----------------------------------------------------------------------------
// LIFESPAN: POPUP BLOCKER (Single Window Policy)
// -----------------------------------------------------------------------------
bool SimpleHandler::OnBeforePopup(
    CefRefPtr<CefBrowser> browser,
    CefRefPtr<CefFrame> frame,
    int popup_id,
    const CefString& target_url,
    const CefString& target_frame_name,
    cef_window_open_disposition_t target_disposition,
    bool user_gesture,
    const CefPopupFeatures& popupFeatures,
    CefWindowInfo& windowInfo,
    CefRefPtr<CefClient>& client,
    CefBrowserSettings& settings,
    CefRefPtr<CefDictionaryValue>& extra_info,
    bool* no_javascript_access) {

    // LOGIC: SINGLE WINDOW MODE
    // 1. If valid URL, load in Main Window.
    // 2. BLOCK the new popup window from spawning.
    
    if (!target_url.empty()) {
         browser->GetMainFrame()->LoadURL(target_url);
    }
    
    return true; // TRUE = Cancel Popup Creation (Strict)
}

void SimpleHandler::OnAfterCreated(CefRefPtr<CefBrowser> browser) {
    CEF_REQUIRE_UI_THREAD();

    // Add to the list of existing browsers.
    browser_list_.push_back(browser);
    
    // Clivon V3: Force Layout Update
  // The browser is created as a child, but might be 0x0 initially.
  // We explicitly tell the Host Window to re-apply its layout logic.
  extern HWND g_hHostWnd;
  if (g_hHostWnd) {
      PostMessage(g_hHostWnd, WM_SIZE, 0, 0);
  }
}

bool SimpleHandler::DoClose(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();

  // Closing the main window requires special handling.
  // See the WebBrowserCpp implementation for details.
  if (browser_list_.size() == 1) {
    // Set a flag to indicate that the window close should be allowed.
    is_closing_ = true;
    
    // Trigger the Host Window to close now
    extern HWND g_hHostWnd;
    if (g_hHostWnd) {
        PostMessage(g_hHostWnd, WM_CLOSE, 0, 0);
    }
  }

  // Allow the close. For windowed browsers this will result in the OS close
  // event being sent.
  return false;
}

void SimpleHandler::OnBeforeClose(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();
  CefQuitMessageLoop();
}


// Filter URLs
bool SimpleHandler::OnBeforeBrowse(CefRefPtr<CefBrowser> browser,
                              CefRefPtr<CefFrame> frame,
                              CefRefPtr<CefRequest> request,
                              bool user_gesture,
                              bool is_redirect) {
  CEF_REQUIRE_UI_THREAD();

  CefString url = request->GetURL();
  std::string url_std = url.ToString();
  
  // Quick check for debug/devtools
  if (url_std.find("devtools://") == 0 || url_std.find("chrome-error://") == 0) {
      return false; // Allow
  }

  // Parse hostname
  CefURLParts url_parts;
  if (!CefParseURL(url, url_parts)) {
      return false; 
  }

  // Explicitly take address of the host cef_string_t structure
  // This avoids C2440 ambiguity
  const cef_string_t* host_ptr = &url_parts.host;
  CefString host_cef(host_ptr);
  std::string host = host_cef.ToString();
  std::transform(host.begin(), host.end(), host.begin(), ::tolower);

  // 1. POLICY: Internal Allow List (Broadened for Login/Redirects)
  bool is_internal = false;
  
  // Allow all Google and YouTube domains (accounts, support, regional TLDs)
  if (host.find("youtube.") != std::string::npos || 
      host.find("google.") != std::string::npos ||
      host.find("gstatic.com") != std::string::npos ||
      host.find("ggpht.com") != std::string::npos) {
      is_internal = true;
  }

  if (is_internal) {
      return false; // Allow navigation (Keep in App)
  }

  // 2. POLICY: Unlimited Internal Navigation (User Request: "All inside my app")
  // Instead of blocking "External" links or showing a popup, we treat Clivon 
  // as a capable browser that handles these links internally.
  
  if (frame->IsMain()) {
      // Allow the navigation to proceed in THIS window.
      // We rely on ClientProtection (AdBlock) to stop malicious redirects.
      return false; // ALLOW
  } else {
      // Sub-frames/Iframes
      // Still block broad cross-origin iframe navigation if needed,
      // but for now, rely on standard browser security + AdBlock.
      return false; // ALLOW
  }

  // Fallback (should not be reached if above allow)
  return false; 
}

void SimpleHandler::OnTitleChange(CefRefPtr<CefBrowser> browser,
                                  const CefString& title) {
  CEF_REQUIRE_UI_THREAD();

  // INSTANT LOAD LOGIC (Existing)
  CefWindowHandle hwnd = browser->GetHost()->GetWindowHandle();
  if (hwnd)
    SetWindowTextW(GetParent(hwnd), std::wstring(title).c_str());

  // CSS INJECTION (Visual AdBlock Backup)
  // This hides the containers that might flash before the engine blocks them.
  CefRefPtr<CefFrame> frame = browser->GetMainFrame();
  if (frame) {
      std::string css = 
          "ytd-ad-slot-renderer, .ytp-ad-module, .video-ads, "
          ".ytd-player-legacy-desktop-watch-ads-renderer, "
          "#masthead-ad { display: none !important; }";
          
      // Encode CSS into a data URI to inject safely
      // Actually, execute JavaScript is easier for dynamic injection
      std::string code = 
          "var style = document.createElement('style');"
          "style.type = 'text/css';"
          "style.innerHTML = '" + css + "';"
          "document.getElementsByTagName('head')[0].appendChild(style);";
          
      frame->ExecuteJavaScript(code, frame->GetURL(), 0);
  }
}

// -----------------------------------------------------------------------------
// ENGINE-LEVEL ADBLOCK (Layer 1 & 2)
// -----------------------------------------------------------------------------
CefResourceRequestHandler::ReturnValue SimpleHandler::OnBeforeResourceLoad(
    CefRefPtr<CefBrowser> browser,
    CefRefPtr<CefFrame> frame,
    CefRefPtr<CefRequest> request,
    CefRefPtr<CefCallback> callback) {
    
  std::string url = request->GetURL().ToString();

  // ---------------------------------------------------------------------------
  // STRICT SYNC: OFF means NAKED.
  // We only Optimize Headers (Strip Cookies) or Block Requests if Enabled.
  // ---------------------------------------------------------------------------
  if (SimpleHandler::IsAdBlockEnabled()) {
      // 1. OPTIMIZATION: Boost Priority & Anonymize (Client -> Server Control)
      clivon::optimizer::OptimizeHeaders(request);

      // 2. BLOCKING: Delegate to Client Protection Module
      if (clivon::protection::ShouldBlockRequest(url)) {
          // std::cout << "Clivon Shield: Blocked " << url << std::endl;
          return RV_CANCEL;
      }
  }

  // ---------------------------------------------------------------------------
  // LAYER 3: YOUTUBE API HARDENING
  // ---------------------------------------------------------------------------
  
  return RV_CONTINUE;
}

// -----------------------------------------------------------------------------
// LAYER 4: RESPONSE FILTER (MIME-Type & Header Blocking)
// -----------------------------------------------------------------------------
// This catches ads that slipped past the URL filter by checking what they ARE.
bool SimpleHandler::OnResourceResponse(
    CefRefPtr<CefBrowser> browser,
    CefRefPtr<CefFrame> frame,
    CefRefPtr<CefRequest> request,
    CefRefPtr<CefResponse> response) {
    
    std::string url = request->GetURL().ToString();
    std::string mime = response->GetMimeType().ToString();

    // 1. BLOCK AD SCRIPTS that come as "application/javascript"
    if (mime.find("javascript") != std::string::npos) {
        if (url.find("/pagead/") != std::string::npos ||
            url.find("doubleclick") != std::string::npos ||
            url.find("googlesyndication") != std::string::npos) {
            return true; // CANCEL (Block this script)
        }
    }

    // 2. BLOCK AD JSON CONFIGS
    // Commonly used for "player_response" ad injection
    if (mime.find("json") != std::string::npos || mime.find("xml") != std::string::npos) {
        if (url.find("player/ad_break") != std::string::npos ||
            url.find("api/stats/ads") != std::string::npos) {
            return true; // CANCEL (Block this config)
        }
    }

    return false; // Proceed safely
}


// -----------------------------------------------------------------------------
// SCRIPT INJECTION (Layer 4: The "Kill Switch")
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// ADBLOCK SCRIPT (Layer 3: UI/DOM Cleaner)
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// ADBLOCK SCRIPT (Source: Clivon "Stealth" Engine)
// -----------------------------------------------------------------------------
const char kAdBlockScript[] = R"JS_CODE(
(function() {
    // -------------------------------------------------------
    // LAYER 5: ANTI-DETECTION (Step 5 - The Shim)
    // Prevents YouTube from knowing we are stripping ads.
    // -------------------------------------------------------
    try {
        // 1. Sanitize the Player Response (The "Manifest")
        // This is where "AdBlock Detected" flags live.
        const clearAds = (obj) => {
            if (!obj) return;
            if (obj.playerAds) delete obj.playerAds;
            if (obj.adPlacements) delete obj.adPlacements;
            if (obj.adSlots) delete obj.adSlots;
        };

        // Trap the variable before it's even defined
        let _ytInitialPlayerResponse = window.ytInitialPlayerResponse;
        Object.defineProperty(window, 'ytInitialPlayerResponse', {
            get: function() { return _ytInitialPlayerResponse; },
            set: function(val) {
                if (val) clearAds(val);
                _ytInitialPlayerResponse = val;
            },
            configurable: true
        });

        // 2. Sanitize Page Data
        let _ytInitialData = window.ytInitialData;
        Object.defineProperty(window, 'ytInitialData', {
             get: function() { return _ytInitialData; },
             set: function(val) {
                 // Clean prompts
                 _ytInitialData = val;
             },
             configurable: true
        });
        
        console.log("Clivon Shield: Stealth Mode Active");
    } catch(e) { }

    // -------------------------------------------------------
    // LAYER 10: CACHE NUKE (Service Worker Killer)
    // Forces YouTube to reload clean data through our Network Filter
    // -------------------------------------------------------
    if(navigator.serviceWorker) { 
        navigator.serviceWorker.getRegistrations().then(function(registrations) { 
            for(let registration of registrations) { 
                registration.unregister();
                console.log("Clivon Shield: Service Worker Killed (Cache Cleared)");
            } 
        }); 
    }

    // -------------------------------------------------------
    // LAYER 11: CSS COMPACTOR (Visual Gap Remover)
    // -------------------------------------------------------
    const style = document.createElement('style');
    style.textContent = `
        /* MASTHEAD (Home Page Big Ad) */
        ytd-masthead-ad-renderer,
        #masthead-ad,
        ytd-ad-slot-renderer {
            display: none !important;
            height: 0 !important;
            max-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        /* GRID ADS (Home Page Grid) */
        ytd-rich-item-renderer:has(ytd-ad-slot-renderer),
        ytd-rich-item-renderer:has(.ytd-ad-slot-renderer) {
            display: none !important;
        }

        /* PLAYER ADS */
        .video-ads,
        .ytp-ad-module,
        .ytp-ad-overlay-container,
        .ytp-ad-player-overlay,
        
        /* SIDEBAR / COMPANION ADS (Fixes User Screenshot) */
        #secondary #offer-module,
        ytd-engagement-panel-section-list-renderer[target-id*="engagement-panel-ads"],
        ytd-merch-shelf-renderer,
        ytd-banner-promo-renderer-background,
        #player-ads,
        ytd-ad-slot-renderer {
            display: none !important;
            visibility: hidden !important;
            width: 0 !important;
            height: 0 !important;
        }
    `;
    document.head.appendChild(style);



    // -------------------------------------------------------
    // LAYER 20: QUANTUM DOM OBSERVER (Instant Killer)
    // -------------------------------------------------------
    // Instead of checking every 50ms, we watch the DOM for changes.
    // This catches ads the MICROSECOND they are inserted.
    const observerCallback = (mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) { // ELEMENT_NODE
                    // Check for Ad Containers
                    if (node.tagName === 'YTD-AD-SLOT-RENDERER' || 
                        node.tagName === 'YTD-RICH-ITEM-RENDERER' && node.querySelector('ytd-ad-slot-renderer') ||
                        node.classList.contains('ytd-ad-slot-renderer') ||
                        node.id === 'player-ads' ||
                        node.id === 'offer-module') {
                        
                        // QUANTUM NUKE: Triple Kill Strategy
                        node.style.setProperty('display', 'none', 'important');
                        node.style.setProperty('visibility', 'hidden', 'important');
                        node.innerHTML = ''; // 1. Cut Media Stream
                        node.remove();       // 2. Remove from DOM
                    }
                    
                    // Check for Player Overlay Ads (The "X" button ones)
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

    // -------------------------------------------------------
    // LAYER 12: FRAME-PERFECT AD SKIPPER (The "Speedster")
    // -------------------------------------------------------
    // Still needed for VIDEO STATE (Play/Pause/Speed) which doesn't trigger MutationObserver
    setInterval(() => {
        const video = document.querySelector('video');
        const player = document.querySelector('#movie_player');
        
        if (video && player) {
            // 1. DETECT AD STATE
            const isAd = player.classList.contains('ad-showing') || 
                         player.classList.contains('ad-interrupting') ||
                         document.querySelector('.video-ads .ad-container');

            if (isAd) {
                // 2. NEUTRALIZE
                video.muted = true;
                video.playbackRate = 16.0;
                if (video.duration > 0.5 && !isNaN(video.duration)) {
                    video.currentTime = video.duration; 
                }
                document.querySelector('.ytp-ad-skip-button')?.click();
                document.querySelector('.ytp-ad-skip-button-modern')?.click();
                document.querySelector('.ytp-ad-overlay-close-button')?.click();
            }
            
            // -------------------------------------------------------
            // LAYER 14: ANTI-STUCK (Fixes Black Screen)
            // -------------------------------------------------------
            // If video is paused at 0:00 for too long, switch to PLAY.
            if (video.paused && video.currentTime < 0.1 && !isAd) {
                 video.play();
            }
        }
        
        // Fail-safe cleaner for items missed by Observer (e.g. Attribute changes)
        const sidebarItems = document.querySelectorAll('#secondary-inner ytd-rich-item-renderer, #secondary-inner ytd-compact-video-renderer');
        sidebarItems.forEach(item => {
            if (item.innerText.includes("Sponsored") || item.innerText.includes("Ad")) {
                item.remove(); // Hard Remove
            }
        });

    }, 50); // High Speed Check

    // -------------------------------------------------------
    // LAYER 13: TIMELINE CLEANER (Remove Yellow Bars)
    // -------------------------------------------------------
    setInterval(() => {
       const ads = document.querySelectorAll('.ytp-ad-marker, .ytp-ad-marker-container');
       ads.forEach(ad => ad.style.display = 'none');
    }, 1000);

// End of Part 1 (Quantum Observer & Core Logic)
    })();
)JS_CODE";

// [Legacy AdBlock Logic Removed]

// [Legacy AdBlock Logic Removed - Functionality moved to Quantum Engine]
// [Legacy AdBlock Logic Removed]
void SimpleHandler::OnLoadStart(CefRefPtr<CefBrowser> browser,
                                CefRefPtr<CefFrame> frame,
                                TransitionType transition_type) {
    // Ensure we are on the UI thread (CefLoadHandler methods differ by version, but usually UI)
    // If we crash, we know we need the thread hop back.
    
    std::string url = frame->GetURL();
    if (url.find("youtube.com") != std::string::npos) {
        // INJECT QUANTUM ENGINE MAX (v450.39.23267)
        std::string fullScript = clivon::quantum::GetPowerScript();
        frame->ExecuteJavaScript(fullScript, frame->GetURL(), 0);
    }
}

// ADDRESS CHANGE: Theme Logic + AdBlock Reinforcement
void SimpleHandler::OnAddressChange(CefRefPtr<CefBrowser> browser,
                                    CefRefPtr<CefFrame> frame,
                                    const CefString& url) {
    CEF_REQUIRE_UI_THREAD();
    if (!frame->IsMain()) return;

    std::string urlStr = url.ToString();
    bool isYouTube = (urlStr.find("youtube.com") != std::string::npos);
    
    // 1. Theme Logic
    extern void SetGhostBarTheme(bool isDark);
    SetGhostBarTheme(isYouTube);
    
    // 2. Reinforce AdBlock
    if (isYouTube) {
        frame->ExecuteJavaScript(kAdBlockScript, frame->GetURL(), 0);
    }
}

// CefKeyboardHandler::OnPreKeyEvent
bool SimpleHandler::OnPreKeyEvent(CefRefPtr<CefBrowser> browser,
                                  const CefKeyEvent& event,
                                  CefEventHandle os_event,
                                  bool* is_keyboard_shortcut) {
  CEF_REQUIRE_UI_THREAD();
  
  if (event.type != KEYEVENT_RAWKEYDOWN)
    return false;

  // F11: Toggle Fullscreen
  // Currently we enforce fullscreen, so this just consumes the key to avoid YouTube default handling
  if (event.windows_key_code == VK_F11) {
    return true; 
  }

  // Esc: Quit App (Exit Fullscreen -> Quit)
  if (event.windows_key_code == VK_ESCAPE) {
      browser->GetHost()->CloseBrowser(true);
      return true;
  }

  // Ctrl+Q: Quit App
  if (event.windows_key_code == 'Q' && (event.modifiers & EVENTFLAG_CONTROL_DOWN)) {
      browser->GetHost()->CloseBrowser(true);
      return true;
  }

  // Ctrl+N: Block New Window (Strict Mode)
  if (event.windows_key_code == 'N' && (event.modifiers & EVENTFLAG_CONTROL_DOWN)) {
      return true; // Consume event, do nothing
  }
  if (event.windows_key_code == 'Q' && (event.modifiers & EVENTFLAG_CONTROL_DOWN)) {
      browser->GetHost()->CloseBrowser(true);
      return true;
  }
  
  // H: Home (Load YouTube)
  if (event.windows_key_code == 'H' && event.modifiers == 0) {
      browser->GetMainFrame()->LoadURL("https://www.youtube.com");
      return true;
  }

  return false;
}
// Level 4: Native AdBlock Engine
// Old definition removed.
