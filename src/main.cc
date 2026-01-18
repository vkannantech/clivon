#include <windows.h>
#include "include/cef_app.h"
#include "src/simple_app.h"
#include "src/host_window.h"

// Program Entry Point
int APIENTRY wWinMain(HINSTANCE hInstance,
                      HINSTANCE hPrevInstance,
                      LPWSTR lpCmdLine,
                      int nCmdShow) {
  UNREFERENCED_PARAMETER(hPrevInstance);
  UNREFERENCED_PARAMETER(lpCmdLine);

  CefMainArgs main_args(hInstance);
  
  // 1. Create App
  CefRefPtr<SimpleApp> app(new SimpleApp);
  
  // 2. Fork (Critical: App must be passed here)
  int exit_code = CefExecuteProcess(main_args, app.get(), nullptr);
  if (exit_code >= 0) {
      return exit_code;
  }

  CefSettings settings;
  // NOTE: Chrome Runtime not supported in this CEF wrapper version.
  // Reverting to Alloy Mode with Network Optimizations.
  // settings.chrome_runtime = true; 

  settings.no_sandbox = true;
  settings.log_severity = LOGSEVERITY_VERBOSE; 
  settings.persist_session_cookies = true;
  
  // OPTIMIZATION: Match YouTube Dark Theme (#0F0F0F) to hide loading flash
  settings.background_color = CefColorSetARGB(255, 15, 15, 15);

  // Set cache path
  CefString(&settings.root_cache_path).FromASCII("d:\\Projects\\clivon\\cache");

  // ---------------------------------------------------------------------------
  // LAYER 51: THE MASK (User Agent Spoofing)
  // ---------------------------------------------------------------------------
  // Fixes "Your browser can't play this video" & "Update your browser"
  // Spoofs Windows 10 + Chrome 124.0.0.0
  CefString(&settings.user_agent).FromASCII(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
      "AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/124.0.0.0 Safari/537.36"
  );

  // 3. Register Window (Delegated to host_window.cc implementation)
  RegisterHostClass(hInstance);
  
  // 4. Create Window
  // Capture the handle so we can pass it to the App
  HWND hHost = CreateHostWindow(hInstance, SW_MAXIMIZE);
  if (!hHost) {
      return 0;
  }
  
  // CRITICAL: Link Window to App (Prevents "Separate Window" bug)
  app->SetHostWindow(hHost);
  
  // 5. Initialize CEF Main Loop
  if (g_hHostWnd) {
      app->SetHostWindow(g_hHostWnd);
  }

  // 5. Initialize CEF
  if (!CefInitialize(main_args, settings, app.get(), nullptr)) {
       return 0;
  }

  // 6. Run Loop
  CefRunMessageLoop();

  CefShutdown();

  return 0;
}
