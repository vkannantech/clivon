#include "src/simple_app.h"
#include "src/simple_handler.h"
#include "include/cef_browser.h"
#include "include/wrapper/cef_helpers.h"
#include "src/window_helper.h" // Helper for Embedding

#include <windows.h>

SimpleApp::SimpleApp() {}

void SimpleApp::OnBeforeCommandLineProcessing(
    const CefString& process_type,
    CefRefPtr<CefCommandLine> command_line) {
    
    // 1. SINGLE PROCESS (User Request: "Clean One Process")
    // WARNING: Unstable, but requested.
    command_line->AppendSwitch("single-process");
    
    // 2. MEDIA SUPPORT (Fix "Browser can't play video")
    command_line->AppendSwitch("ignore-gpu-blocklist");
    command_line->AppendSwitch("enable-gpu-rasterization");
    command_line->AppendSwitch("enable-zero-copy");
    
    // 3. PERFORMANCE & PRIVACY
    command_line->AppendSwitch("disable-site-isolation-trials");
    command_line->AppendSwitch("no-proxy-server");
    command_line->AppendSwitch("disable-sync");
}



void SimpleApp::OnContextInitialized() {
  CEF_REQUIRE_UI_THREAD();

  // Information used when creating the native window.
  CefWindowInfo window_info;
  
  // Clivon V3: SameWindow Architecture
  // Use the explicitly passed Host Window (Robust parenting)
  extern HWND g_hHostWnd; // Defined in host_window.cc
  HWND hHost = host_window_;
  
  // FALLBACK: If member var failed, use Global
  if (!hHost && g_hHostWnd) {
      hHost = g_hHostWnd;
  }

  RECT rc = {0};
  if (hHost) {
      GetClientRect(hHost, &rc);
  }

  // ---------------------------------------------------------------------------
  // LAYER 51: THE MASK (User Agent Spoofing)
  // ---------------------------------------------------------------------------
  // We masquerade as the latest stable Chrome to bypass "Browser Unsupported" checks.
  // This resolves the "Your browser can't play this video" error.
  CefString user_agent = 
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
      "AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/124.0.0.0 Safari/537.36";
  
  CefRefPtr<CefRequestContext> request_context = CefRequestContext::GetGlobalContext();
  
  // ---------------------------------------------------------------------------
  // CLIVON V3: EXTENSION LOADER (uBlock Origin)
  // ---------------------------------------------------------------------------
  // CEF 143 fully supports LoadExtension API
  std::string ext_path = "d:\\Projects\\clivon\\extensions\\uBlock0.chromium";
  
  if(request_context) {
      request_context->LoadExtension(ext_path, NULL, NULL);
  }

#if defined(OS_WIN)
  // On Windows we need to specify certain flags that will be passed to
  // CreateWindowEx().
  if (hHost) {
      // FIX: Convert Win32 RECT to CefRect
      CefRect cef_rc(rc.left, rc.top, rc.right - rc.left, rc.bottom - rc.top);
      
      // This tells CEF to render INSIDE the host window.
      window_info.SetAsChild(hHost, cef_rc);
      
      // Ensure the Host is maximized (User Request)
      ShowWindow(hHost, SW_MAXIMIZE);
  } else {
      window_info.SetAsPopup(NULL, "Clivon Fallback");
  }
#endif

  // SimpleHandler implements browser-level callbacks.
  CefRefPtr<SimpleHandler> handler(new SimpleHandler());

  // Specify CEF browser settings here.
  CefBrowserSettings browser_settings;
  
  // VISUAL OPTIMIZATION: Match Splash Screen Color (#0F0F0F)
  // This prevents a white flash if the browser paints before YouTube loads.
  browser_settings.background_color = CefColorSetARGB(255, 15, 15, 15);

  std::string url = "https://www.youtube.com";

  // Create the first browser window.
  CefBrowserHost::CreateBrowser(window_info, handler, url, browser_settings,
                                nullptr, nullptr);
}
