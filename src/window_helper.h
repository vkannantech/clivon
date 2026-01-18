#ifndef CLIVON_WINDOW_HELPER_H_
#define CLIVON_WINDOW_HELPER_H_

#include <windows.h>
#include "include/cef_base.h"

// Helper to Embed the Browser into the Host Window safely
inline void EmbedBrowser(CefWindowInfo& window_info, HWND hHost) {
    if (hHost && IsWindow(hHost)) {
        // Get the dimensions of the host window
        RECT rc;
        GetClientRect(hHost, &rc);
        
        // Convert Win32 RECT to CefRect (x, y, width, height)
        CefRect cef_rect(rc.left, rc.top, rc.right - rc.left, rc.bottom - rc.top);
        
        // Embed the browser as a child
        window_info.SetAsChild(hHost, cef_rect);
        
        // Force the Host to Maximize (User Request: "Full Screen")
        ShowWindow(hHost, SW_MAXIMIZE);
    } else {
        // Fallback if Host is invalid (should not happen if main.cc is correct)
        window_info.SetAsPopup(NULL, "Clivon Fallback");
    }
}

#endif // CLIVON_WINDOW_HELPER_H_
