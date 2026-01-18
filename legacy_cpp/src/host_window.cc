#include "src/host_window.h"
#include "src/ghost_bar.h"

// MACRO FIX: Undefine Windows macros that conflict with CEF methods
#undef GetFirstChild
#undef GetNextSibling

#include "include/cef_app.h"
#include "src/simple_handler.h" // For SimpleHandler instance

// Global
HWND g_hHostWnd = NULL;
RECT g_browserRect = {0};
static bool g_isCommandMode = false;
const int kBarHeight = 56; // Spec V1

// -----------------------------------------------------------------------------
// HELPER: RESIZE LAYOUT
// -----------------------------------------------------------------------------
void UpdateHostLayout(HWND hHost) {
    RECT rcHost;
    GetClientRect(hHost, &rcHost);
    int w = rcHost.right - rcHost.left;
    int h = rcHost.bottom - rcHost.top;

    int cefY = 0;
    int cefH = h;

    // If Command Mode is Active (Ghost Bar Visible), Push CEF Down
    if (g_isCommandMode) {
        cefY = kBarHeight;
        cefH = h - kBarHeight;
    }

    // Resize All Child Windows (CEF)
    HWND hChild = GetWindow(hHost, GW_CHILD);
    while (hChild) {
        // CEF Window is a child of Host
        SetWindowPos(hChild, NULL, 0, cefY, w, cefH, SWP_NOZORDER | SWP_NOACTIVATE);
        hChild = GetWindow(hChild, GW_HWNDNEXT);
    }
}

// -----------------------------------------------------------------------------
// WINDOW PROCEDURE
// -----------------------------------------------------------------------------
LRESULT CALLBACK HostWndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
    switch (message) {
    
    // -------------------------------------------------------------------------
    // COMMAND HANDLING (From Ghost Bar)
    // -------------------------------------------------------------------------
    case WM_COMMAND:
        {
            int wmId = LOWORD(wParam);
            CefRefPtr<CefBrowser> browser = nullptr;
            if (SimpleHandler::GetInstance()) {
                browser = SimpleHandler::GetInstance()->GetBrowser();
            }

            switch (wmId) {
            case IDM_CLOSE:
                // 1. INSTANT FEEDBACK: Hide UI immediately
                ShowWindow(hWnd, SW_HIDE);
                if (g_hGhostBarWnd) ShowWindow(g_hGhostBarWnd, SW_HIDE);
                
                // 2. LOGIC: Close Browser Gracefully
                if (browser) {
                    browser->GetHost()->CloseBrowser(false);
                } else {
                    DestroyWindow(hWnd);
                }
                break;

            case IDM_HOME: 
                if (browser) browser->GetMainFrame()->LoadURL("https://www.youtube.com"); 
                break;
            
            case IDM_BACK: 
                if (browser && browser->CanGoBack()) browser->GoBack(); 
                break;
            
            case IDM_FORWARD: 
                if (browser && browser->CanGoForward()) browser->GoForward(); 
                break;
            
            case IDM_FULLSCREEN: 
                if (IsZoomed(hWnd)) ShowWindow(hWnd, SW_RESTORE);
                else ShowWindow(hWnd, SW_MAXIMIZE);
                break;
            
            case IDM_FOCUS: 
                MessageBoxW(hWnd, L"Focus Mode Active", L"Clivon", MB_OK); 
                break;
                
            case IDM_PIP:
                MessageBoxW(hWnd, L"PiP Mode Active", L"Clivon", MB_OK);
                break;
                
            case IDM_SETTINGS: MessageBoxW(hWnd, L"Settings Panel", L"Clivon", MB_OK); break;
            case IDM_MINIMIZE: ShowWindow(hWnd, SW_MINIMIZE); break;
            }
        }
        break;

    // -------------------------------------------------------------------------
    // PAINT: Native "Splash" Screen (Clivon Logo)
    // -------------------------------------------------------------------------
    case WM_PAINT:
        {
            PAINTSTRUCT ps;
            HDC hdc = BeginPaint(hWnd, &ps);
            
            // Background Setup
            RECT rc; GetClientRect(hWnd, &rc);
            HBRUSH hBrush = CreateSolidBrush(RGB(15, 15, 15));
            FillRect(hdc, &rc, hBrush);
            DeleteObject(hBrush);
            
            SetBkMode(hdc, OPAQUE);
            SetBkColor(hdc, RGB(15, 15, 15));

            // 1. MAIN TITLE: "Clivon"
            HFONT hTitleFont = CreateFontW(72, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, 
                                     ANSI_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
                                     CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_SWISS, L"Segoe UI");
            HFONT hOldFont = (HFONT)SelectObject(hdc, hTitleFont);
            SetTextColor(hdc, RGB(255, 255, 255));
            
            // Shift up slightly to make room for subtitle
            RECT rcTitle = rc;
            rcTitle.bottom = (rc.bottom + rc.top) / 2 + 20; // Center-ish
            DrawTextW(hdc, L"Clivon", -1, &rcTitle, DT_CENTER | DT_BOTTOM | DT_SINGLELINE);
            
            SelectObject(hdc, hOldFont);
            DeleteObject(hTitleFont);

            // 2. SUBTITLE: "Developed By KannanTech"
            HFONT hSubFont = CreateFontW(24, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE, 
                                     ANSI_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
                                     CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_SWISS, L"Segoe UI");
            SelectObject(hdc, hSubFont);
            SetTextColor(hdc, RGB(170, 170, 170)); // Light Gray
            
            RECT rcSub = rc;
            rcSub.top = (rc.bottom + rc.top) / 2 + 30; // Below Title
            DrawTextW(hdc, L"Developed By KannanTech", -1, &rcSub, DT_CENTER | DT_TOP | DT_SINGLELINE);

            SelectObject(hdc, hOldFont); // Restore original
            DeleteObject(hSubFont);
            
            EndPaint(hWnd, &ps);
        }
        return 0;

    // -------------------------------------------------------------------------
    // MOUSE TRIGGER (Logic for Auto-Show)
    // -------------------------------------------------------------------------
    case WM_TIMER:
        // SAFETY TIMER (ID 999): Force Show if network invalid
        if (wParam == 999) {
            KillTimer(hWnd, 999);
            if (!IsWindowVisible(hWnd)) {
                ShowWindow(hWnd, SW_MAXIMIZE);
            }
        }
        
        // GHOST BAR TIMER (ID 1)
        if (wParam == 1 && g_hGhostBarWnd) {
            POINT pt; GetCursorPos(&pt);
            RECT rcHost; GetWindowRect(hWnd, &rcHost);
            
            // Interaction Zones
            bool hoverTop = (pt.x >= rcHost.left && pt.x <= rcHost.right && (pt.y - rcHost.top) < 6); // Top edge
            bool hoverBar = (pt.x >= rcHost.left && pt.x <= rcHost.right && (pt.y - rcHost.top) < kBarHeight); // Inside Bar
            
            bool targetState = g_isCommandMode;
            if (hoverTop) targetState = true;        // Show on top edge
            else if (!hoverBar) targetState = false; // Hide if left bar area
            
            if (targetState != g_isCommandMode) {
                g_isCommandMode = targetState;
                SetGhostBarState(g_isCommandMode);
                UpdateHostLayout(hWnd);
            }
        }
        break;

    // -------------------------------------------------------------------------
    // LAYOUT SYNC
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // LAYOUT SYNC (ROBUST)
    // -------------------------------------------------------------------------
    case WM_WINDOWPOSCHANGED:
        {
            WINDOWPOS* wp = (WINDOWPOS*)lParam;
            if (!(wp->flags & SWP_NOSIZE)) {
                // Size Changed: Update layout
                GetClientRect(hWnd, &g_browserRect);
                UpdateHostLayout(hWnd);
                
                // Resize GhostBar
                if (g_hGhostBarWnd) {
                    SetWindowPos(g_hGhostBarWnd, HWND_TOPMOST, wp->x, wp->y, wp->cx, kBarHeight, SWP_NOACTIVATE);
                }
            }
            else if (!(wp->flags & SWP_NOMOVE)) {
                // Position Changed: Move GhostBar
                if (g_hGhostBarWnd) {
                    SetWindowPos(g_hGhostBarWnd, HWND_TOPMOST, wp->x, wp->y, 0, 0, SWP_NOSIZE | SWP_NOACTIVATE);
                }
            }
        }
        break;
        
    case WM_SIZE:
        if (wParam == SIZE_MINIMIZED) {
            // Host Minimized -> Hide Ghost Bar Forcefully
            if (g_hGhostBarWnd) ShowWindow(g_hGhostBarWnd, SW_HIDE);
        } else if (wParam == SIZE_RESTORED || wParam == SIZE_MAXIMIZED) {
            // Host Restored -> Ensure Ghost Bar is properly positioned (handled by POSCHANGED)
            // But we might want to check if it should be visible? 
            // Default design: Ghost Bar is auto-hide. So on restore, it starts hidden (interactive).
            // This is correct.
            UpdateHostLayout(hWnd);
        }
        break;
        
    case WM_MOVE:
        // Handled in WINDOWPOSCHANGED
        break;

    // -------------------------------------------------------------------------
    // LIFECYCLE: ACTIVATION & FOCUS
    // -------------------------------------------------------------------------
    case WM_ACTIVATE:
        if (LOWORD(wParam) == WA_INACTIVE) {
            // App lost focus (e.g. Alt-Tab) -> Hide Ghost Bar
            // Exception: If we are just activating the Ghost Bar itself (which is owned), 
            // the Host stays logically active in some setups, but let's be strict:
            // If user clicks outside (WA_INACTIVE), hide the bar.
            // Note: Clicking the Ghost Bar *might* trigger INACTIVE on Host if not careful.
            // But since Ghost Bar sends commands to Host, we usually want it to stay.
            
            // For now, strict rule: Lost focus = Cleanup
            if (g_hGhostBarWnd) {
                // Check if the window gaining focus is the Ghost Bar itself? 
                // lParam is the handle of the window being activated.
                HWND hActive = (HWND)lParam;
                if (hActive != g_hGhostBarWnd && hActive != hWnd) {
                    g_isCommandMode = false;
                    SetGhostBarState(false);
                    UpdateHostLayout(hWnd);
                }
            }
        }
        break;

    // -------------------------------------------------------------------------
    // LIFECYCLE INTERCEPTION
    // -------------------------------------------------------------------------
    case WM_KEYDOWN:
        if (wParam == VK_ESCAPE) {
             // Clivon Spec: ESC exits fullscreen only
             if (IsZoomed(hWnd)) ShowWindow(hWnd, SW_RESTORE);
        }
        break;

    case WM_CLOSE:
        {
            // INSTANT HIDE
            ShowWindow(hWnd, SW_HIDE);
            if (g_hGhostBarWnd) ShowWindow(g_hGhostBarWnd, SW_HIDE);

            CefRefPtr<CefBrowser> browser = nullptr;
             if (SimpleHandler::GetInstance()) {
                browser = SimpleHandler::GetInstance()->GetBrowser();
             }
            
            // Check if we need to close browser first
            if (browser && !SimpleHandler::GetInstance()->IsClosing()) {
                browser->GetHost()->CloseBrowser(false);
                return 0; // Cancel Window destruction, let CEF handle it
            }
        }
        // If no browser or IsClosing is true (re-entrant), destroy window
        DestroyWindow(hWnd);
        return 0;

    case WM_DESTROY:
        // Force kill Ghost Bar if still alive
        if (g_hGhostBarWnd && IsWindow(g_hGhostBarWnd)) {
            DestroyWindow(g_hGhostBarWnd);
            g_hGhostBarWnd = NULL;
        }
        
        // PostQuitMessage only when window is truly gone
        PostQuitMessage(0);
        break;

    default:
        return DefWindowProcW(hWnd, message, wParam, lParam);
    }
    return 0;
}

// -----------------------------------------------------------------------------
// CREATION
// -----------------------------------------------------------------------------
void RegisterHostClass(HINSTANCE hInstance) {
    WNDCLASSEXW wcex = {0};
    wcex.cbSize = sizeof(WNDCLASSEXW);
    wcex.style = CS_HREDRAW | CS_VREDRAW;
    wcex.lpfnWndProc = HostWndProc;
    wcex.hInstance = hInstance;
    wcex.hIcon = LoadIcon(NULL, IDI_APPLICATION);
    wcex.hCursor = LoadCursor(NULL, IDC_ARROW);
    
    // OPTIMIZATION: Match YouTube Dark Theme (#0F0F0F)
    // This hides the visual flash during CEF initialization.
    wcex.hbrBackground = CreateSolidBrush(RGB(15, 15, 15));
    
    wcex.lpszClassName = L"ClivonHostWindow";
    RegisterClassExW(&wcex);
    
    RegisterGhostBarClass(hInstance);
}

HWND CreateHostWindow(HINSTANCE hInstance, int nCmdShow) {
    int screenWidth = GetSystemMetrics(SM_CXSCREEN);
    int screenHeight = GetSystemMetrics(SM_CYSCREEN);

    HWND hWnd = CreateWindowExW(
        0, L"ClivonHostWindow", L"Clivon Host", 
        WS_POPUP | WS_VISIBLE | WS_CLIPCHILDREN, // RESTORED: Instant Show
        0, 0, screenWidth, screenHeight, 
        NULL, NULL, hInstance, NULL
    );

    if (hWnd) {
        g_hHostWnd = hWnd;
        CreateGhostBar(hWnd);
        SetTimer(hWnd, 1, 100, NULL); // Mouse Check Timer
        
        // NO DELAY: Show immediately.
        ShowWindow(hWnd, nCmdShow);
        UpdateWindow(hWnd);
    }
    return hWnd;
}
