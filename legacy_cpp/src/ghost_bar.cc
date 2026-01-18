#include <windows.h>
#include <windowsx.h>
#include <vector>
#include <string>

// Include header AFTER windows.h to ensure types are defined
#include "src/ghost_bar.h"

// Global
HWND g_hGhostBarWnd = NULL;

// CONSTANTS
const int kBarHeight = 56;
const int kBtnSize   = 36;
const int kBtnGap    = 8;

// THEME STATE
static bool g_isDarkMode = true; // Default

// THEME PALETTE (Dynamic)
COLORREF GetBgColor()     { return g_isDarkMode ? RGB(15, 15, 15) : RGB(242, 242, 242); }
COLORREF GetIconIdle()    { return g_isDarkMode ? RGB(230, 230, 230) : RGB(80, 80, 80); }
COLORREF GetIconHover()   { return g_isDarkMode ? RGB(0, 243, 255) : RGB(0, 120, 215); } 
COLORREF GetSearchBg()    { return g_isDarkMode ? RGB(40, 40, 40) : RGB(255, 255, 255); }
COLORREF GetTextColor()   { return g_isDarkMode ? RGB(140, 140, 140) : RGB(100, 100, 100); }
COLORREF GetQuitColor()   { return RGB(255, 60, 60); } 
const COLORREF kAccentColor = RGB(0, 243, 255); 

static int g_hoverBtnID = -1; 

// -----------------------------------------------------------------------------
// EXTERNAL API
// -----------------------------------------------------------------------------
void SetGhostBarTheme(bool isDark) {
    if (g_isDarkMode != isDark) {
        g_isDarkMode = isDark;
        if (g_hGhostBarWnd) InvalidateRect(g_hGhostBarWnd, NULL, FALSE);
    }
}

// -----------------------------------------------------------------------------
// LAYOUT (SIMPLIFIED V2)
// -----------------------------------------------------------------------------
// MACRO FIX: Undefine Windows macros that conflict with CEF
#undef GetFirstChild
#undef GetNextSibling

#include "src/simple_handler.h" // For IsAdBlockEnabled state

RECT GetRectBack()      { return { 12, 10, 12 + kBtnSize, 10 + kBtnSize }; }
RECT GetRectForward()   { return { 12 + kBtnSize + kBtnGap, 10, 12 + kBtnSize*2 + kBtnGap, 10 + kBtnSize }; }
RECT GetRectHome()      { return { 12 + kBtnSize*2 + kBtnGap*2, 10, 12 + kBtnSize*3 + kBtnGap*2, 10 + kBtnSize }; }
RECT GetRectAdBlock()   { return { 12 + kBtnSize*3 + kBtnGap*3, 10, 12 + kBtnSize*4 + kBtnGap*3, 10 + kBtnSize }; } // Fourth button

RECT GetRectQuit(int w)       { return { w - 12 - kBtnSize, 10, w - 12, 10 + kBtnSize }; }
RECT GetRectFullscreen(int w) { return { w - 12 - kBtnSize*2 - kBtnGap, 10, w - 12 - kBtnSize - kBtnGap, 10 + kBtnSize }; }
RECT GetRectMinimize(int w)   { return { w - 12 - kBtnSize*3 - kBtnGap*2, 10, w - 12 - kBtnSize*2 - kBtnGap*2, 10 + kBtnSize }; }

RECT GetRectSearch(int w) {
    int leftLimit = GetRectAdBlock().right + 20; // Adjusted for AdBlock btn
    int rightLimit = GetRectMinimize(w).left - 20; 
    int availW = rightLimit - leftLimit;
    
    int targetW = (w * 50) / 100; 
    if (targetW > availW) targetW = availW; 
    if (targetW < 200) targetW = 200;       
    
    int actualLeft = leftLimit + (availW - targetW) / 2;
    return { actualLeft, 10, actualLeft + targetW, 10 + 36 };
}

// ... Drawing ...

void DrawIconAdBlock(HDC hdc, RECT rc, COLORREF color) {
    // TOGGLE SWITCH DESIGN
    // 1. Setup metrics
    int margin = 4;
    int w = rc.right - rc.left;
    int h = rc.bottom - rc.top;
    
    // Switch Body (Pill)
    RECT rcSwitch = { rc.left + margin, rc.top + margin + 4, rc.right - margin, rc.bottom - margin - 4 };
    
    // Check Status
    bool isActive = SimpleHandler::IsAdBlockEnabled();
    
    // 2. Draw Background (Pill)
    // ON = Bright Green, OFF = Dark Gray
    COLORREF bgColor = isActive ? RGB(0, 220, 100) : RGB(80, 80, 80); 
    HBRUSH hBr = CreateSolidBrush(bgColor);
    HPEN hPen = CreatePen(PS_SOLID, 1, bgColor);
    HGDIOBJ oldBr = SelectObject(hdc, hBr);
    HGDIOBJ oldPen = SelectObject(hdc, hPen);
    
    RoundRect(hdc, rcSwitch.left, rcSwitch.top, rcSwitch.right, rcSwitch.bottom, 12, 12);
    
    SelectObject(hdc, oldBr);
    SelectObject(hdc, oldPen);
    DeleteObject(hBr);
    DeleteObject(hPen);
    
    // 3. Draw Knob (Circle)
    int knobSize = (rcSwitch.bottom - rcSwitch.top) - 4;
    int knobX = isActive ? (rcSwitch.right - knobSize - 2) : (rcSwitch.left + 2);
    int knobY = rcSwitch.top + 2;
    
    HBRUSH hBrKnob = CreateSolidBrush(RGB(255, 255, 255));
    HGDIOBJ oldKnobBr = SelectObject(hdc, hBrKnob);
    // Remove border for knob
    HPEN hNullPen = CreatePen(PS_NULL, 0, 0); 
    HGDIOBJ oldKnobPen = SelectObject(hdc, hNullPen);
    
    Ellipse(hdc, knobX, knobY, knobX + knobSize, knobY + knobSize);
    
    SelectObject(hdc, oldKnobBr);
    SelectObject(hdc, oldKnobPen);
    DeleteObject(hBrKnob);
    DeleteObject(hNullPen);
}

// -----------------------------------------------------------------------------
// GDI DRAWING
// -----------------------------------------------------------------------------
void DrawLineIcon(HDC hdc, POINT* pts, int count, COLORREF color) {
    HPEN hPen = CreatePen(PS_SOLID, 2, color);
    HGDIOBJ old = SelectObject(hdc, hPen);
    Polyline(hdc, pts, count);
    SelectObject(hdc, old);
    DeleteObject(hPen);
}

void DrawIconBack(HDC hdc, RECT rc, COLORREF color) {
    int cx = (rc.left + rc.right)/2; int cy = (rc.top + rc.bottom)/2;
    POINT pts[] = { {cx+4, cy-8}, {cx-4, cy}, {cx+4, cy+8} };
    DrawLineIcon(hdc, pts, 3, color);
}
void DrawIconForward(HDC hdc, RECT rc, COLORREF color) {
    int cx = (rc.left + rc.right)/2; int cy = (rc.top + rc.bottom)/2;
    POINT pts[] = { {cx-4, cy-8}, {cx+4, cy}, {cx-4, cy+8} };
    DrawLineIcon(hdc, pts, 3, color);
}
void DrawIconHome(HDC hdc, RECT rc, COLORREF color) {
    int cx = (rc.left + rc.right)/2; int cy = (rc.top + rc.bottom)/2;
    POINT roof[] = { {cx-8, cy-2}, {cx, cy-10}, {cx+8, cy-2} };
    DrawLineIcon(hdc, roof, 3, color);
    POINT box[] = { {cx-6, cy-2}, {cx-6, cy+8}, {cx+6, cy+8}, {cx+6, cy-2} };
    DrawLineIcon(hdc, box, 4, color);
}
void DrawIconQuit(HDC hdc, RECT rc, COLORREF color) {
    int cx = (rc.left + rc.right)/2; int cy = (rc.top + rc.bottom)/2;
    POINT l1[] = { {cx-7, cy-7}, {cx+7, cy+7} };
    POINT l2[] = { {cx+7, cy-7}, {cx-7, cy+7} };
    DrawLineIcon(hdc, l1, 2, color);
    DrawLineIcon(hdc, l2, 2, color);
}
void DrawIconMinimize(HDC hdc, RECT rc, COLORREF color) {
    int cx = (rc.left + rc.right)/2; int cy = (rc.top + rc.bottom)/2;
    POINT pts[] = { {cx-7, cy+5}, {cx+7, cy+5} };
    DrawLineIcon(hdc, pts, 2, color);
}
void DrawIconFull(HDC hdc, RECT rc, COLORREF color) {
    int cx = (rc.left + rc.right)/2; int cy = (rc.top + rc.bottom)/2;
    POINT tl[] = {{cx-8, cy-4}, {cx-8, cy-8}, {cx-4, cy-8}};
    POINT tr[] = {{cx+4, cy-8}, {cx+8, cy-8}, {cx+8, cy-4}};
    POINT bl[] = {{cx-8, cy+4}, {cx-8, cy+8}, {cx-4, cy+8}};
    POINT br[] = {{cx+4, cy+8}, {cx+8, cy+8}, {cx+8, cy+4}};
    DrawLineIcon(hdc, tl, 3, color); DrawLineIcon(hdc, tr, 3, color);
    DrawLineIcon(hdc, bl, 3, color); DrawLineIcon(hdc, br, 3, color);
}

// -----------------------------------------------------------------------------
// MODERN POPUP (SAAS DESIGN)
// -----------------------------------------------------------------------------
struct PopupItem {
    std::wstring text;
    std::wstring icon; // Simple text icon for now
    int id;
    bool isDestructive;
};

// Popup Global State
HWND g_hPopup = NULL;
int g_popupHoverIndex = -1;
const int kPopupWidth = 220;
const int kRowHeight = 42;
std::vector<PopupItem> g_menuItems;

LRESULT CALLBACK PopupWndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
    switch (message) {
    case WM_ERASEBKGND: return 1;
    
    case WM_PAINT: 
        {
            PAINTSTRUCT ps;
            HDC hdcParams = BeginPaint(hWnd, &ps);
            RECT rc; GetClientRect(hWnd, &rc);
            
            HDC hdc = CreateCompatibleDC(hdcParams);
            HBITMAP hBmp = CreateCompatibleBitmap(hdcParams, rc.right, rc.bottom);
            HGDIOBJ oldBmp = SelectObject(hdc, hBmp);

            // 1. Background
            HBRUSH hBrBg = CreateSolidBrush(g_isDarkMode ? RGB(32, 32, 32) : RGB(255, 255, 255));
            FillRect(hdc, &rc, hBrBg); DeleteObject(hBrBg);

            // 2. Border
            HPEN hPenBorder = CreatePen(PS_SOLID, 1, g_isDarkMode ? RGB(60, 60, 60) : RGB(220, 220, 220));
            HGDIOBJ oldPen = SelectObject(hdc, hPenBorder);
            SelectObject(hdc, GetStockObject(NULL_BRUSH));
            Rectangle(hdc, 0, 0, rc.right, rc.bottom);
            SelectObject(hdc, oldPen); DeleteObject(hPenBorder);

            // 3. Items
            HFONT hFontIcon = CreateFontW(18, 0, 0, 0, FW_NORMAL, 0, 0, 0, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI Emoji");
            HFONT hFontText = CreateFontW(19, 0, 0, 0, FW_SEMIBOLD, 0, 0, 0, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI");
            
            SetBkMode(hdc, TRANSPARENT);

            for (size_t i = 0; i < g_menuItems.size(); i++) {
                RECT rRow = { 1, (LONG)i * kRowHeight + 1, rc.right - 1, (LONG)(i + 1) * kRowHeight + 1 };
                
                // Hover State
                if (i == g_popupHoverIndex) {
                    HBRUSH hBrHover = CreateSolidBrush(g_isDarkMode ? RGB(50, 50, 50) : RGB(240, 240, 240));
                    FillRect(hdc, &rRow, hBrHover);
                    DeleteObject(hBrHover);
                }

                // Text Color
                COLORREF txtColor = g_isDarkMode ? RGB(220, 220, 220) : RGB(30, 30, 30);
                if (g_menuItems[i].isDestructive) txtColor = RGB(255, 80, 80);
                SetTextColor(hdc, txtColor);

                // Icon
                RECT rIcon = rRow; rIcon.right = rIcon.left + 40;
                SelectObject(hdc, hFontIcon);
                // Icons: Secondary usually. Accent if hovered. Danger if destructive.
                COLORREF iconColor = g_isDarkMode ? RGB(180, 180, 180) : RGB(100, 100, 100); // Default secondary
                if (g_menuItems[i].isDestructive) iconColor = RGB(255, 80, 80);
                else if (i == g_popupHoverIndex) iconColor = kAccentColor; // RESTORE NEON HOVER
                
                SetTextColor(hdc, iconColor);
                DrawTextW(hdc, g_menuItems[i].icon.c_str(), -1, &rIcon, DT_CENTER | DT_VCENTER | DT_SINGLELINE);

                // Label (Reset color for text)
                SetTextColor(hdc, txtColor);
                RECT rText = rRow; rText.left += 40; rText.right -= 15;
                SelectObject(hdc, hFontText);
                DrawTextW(hdc, g_menuItems[i].text.c_str(), -1, &rText, DT_LEFT | DT_VCENTER | DT_SINGLELINE);
            }

            DeleteObject(hFontIcon);
            DeleteObject(hFontText);
            
            BitBlt(hdcParams, 0, 0, rc.right, rc.bottom, hdc, 0, 0, SRCCOPY);
            SelectObject(hdc, oldBmp); DeleteObject(hBmp); DeleteDC(hdc);
            EndPaint(hWnd, &ps);
        }
        break;

    case WM_MOUSEMOVE:
        {
            int y = GET_Y_LPARAM(lParam);
            int index = (y - 1) / kRowHeight;
            if (index < 0 || index >= (int)g_menuItems.size()) index = -1;
            
            if (index != g_popupHoverIndex) {
                g_popupHoverIndex = index;
                InvalidateRect(hWnd, NULL, FALSE);
                
                TRACKMOUSEEVENT tme = { sizeof(TRACKMOUSEEVENT), TME_LEAVE, hWnd, 0 };
                TrackMouseEvent(&tme);
            }
        }
        break;

    case WM_MOUSELEAVE:
        g_popupHoverIndex = -1;
        InvalidateRect(hWnd, NULL, FALSE);
        break;

    case WM_LBUTTONUP:
        {
            int y = GET_Y_LPARAM(lParam);
            int index = (y - 1) / kRowHeight;
            if (index >= 0 && index < (int)g_menuItems.size()) {
                int cmd = g_menuItems[index].id;
                // Close Popup
                DestroyWindow(hWnd);
                // Execute
                if (g_hGhostBarWnd) 
                    PostMessage(GetParent(g_hGhostBarWnd), WM_COMMAND, MAKEWPARAM(cmd, 0), 0);
            }
        }
        break;

    case WM_ACTIVATE:
        if (LOWORD(wParam) == WA_INACTIVE) {
            DestroyWindow(hWnd);
        }
        break;
    
    case WM_DESTROY:
        g_hPopup = NULL;
        break;

    default: return DefWindowProc(hWnd, message, wParam, lParam);
    }
    return 0;
}

void ShowCmdPopup(HWND hParent, POINT pt) {
    if (g_hPopup) { DestroyWindow(g_hPopup); return; }

    // Register Class (Once)
    static bool reg = false;
    if (!reg) {
        WNDCLASSEXW w = { sizeof(WNDCLASSEX), CS_DROPSHADOW | CS_HREDRAW | CS_VREDRAW, PopupWndProc, 0,0, GetModuleHandle(NULL), 0, LoadCursor(NULL, IDC_ARROW), 0, NULL, L"ClivonPopup", 0 };
        RegisterClassExW(&w);
        reg = true;
    }

    // Prepare Items
    g_menuItems = {
        { L"Home Dashboard", L"🏠", IDM_HOME, false },
        { L"Focus Mode (Zen)", L"🧠", IDM_FOCUS, false }, 
        { L"Toggle Fullscreen", L"⛶", IDM_FULLSCREEN, false },
        { L"Quit Application", L"❌", IDM_CLOSE, true }
    };

    int h = (int)g_menuItems.size() * kRowHeight + 2;
    int w = kPopupWidth;
    
    // Adjust Position (Center under mouse/button)
    int x = pt.x - (w / 2);
    int y = pt.y + 8; // Tighter gap (8px)

    g_hPopup = CreateWindowExW(WS_EX_TOOLWINDOW | WS_EX_TOPMOST | WS_EX_NOACTIVATE, 
        L"ClivonPopup", NULL, WS_POPUP, 
        x, y, w, h, hParent, NULL, GetModuleHandle(NULL), NULL);

    if (g_hPopup) {
         // Animation: Smooth Fade In (100ms)
         AnimateWindow(g_hPopup, 100, AW_BLEND | AW_ACTIVATE);
         SetFocus(g_hPopup); 
    }
}

// -----------------------------------------------------------------------------
// MAIN WNDPROC
// -----------------------------------------------------------------------------
LRESULT CALLBACK GhostBarWndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
    switch (message) {
    case WM_ERASEBKGND: return 1;

    case WM_PAINT:
        {
            PAINTSTRUCT ps;
            HDC hdcParams = BeginPaint(hWnd, &ps);
            
            RECT rc; GetClientRect(hWnd, &rc);
            int w = rc.right; int h = rc.bottom;

            HDC hdc = CreateCompatibleDC(hdcParams);
            HBITMAP hBmp = CreateCompatibleBitmap(hdcParams, w, h);
            HGDIOBJ oldBmp = SelectObject(hdc, hBmp);

            // Draw Background (Dynamic)
            HBRUSH hBrBg = CreateSolidBrush(GetBgColor());
            FillRect(hdc, &rc, hBrBg); DeleteObject(hBrBg);
            
            // Search Bar (Dynamic)
            RECT rcSearch = GetRectSearch(w);
            HBRUSH hBrSearch = CreateSolidBrush(GetSearchBg());
            HGDIOBJ oldBr = SelectObject(hdc, hBrSearch);
            // Search Border? Maybe faint line in light mode
            HPEN hPenSearch = CreatePen(PS_SOLID, 1, g_isDarkMode ? RGB(60,60,60) : RGB(200,200,200));
            SelectObject(hdc, hPenSearch);
            RoundRect(hdc, rcSearch.left, rcSearch.top, rcSearch.right, rcSearch.bottom, 18, 18);
            DeleteObject(hPenSearch);
            
            SetBkMode(hdc, TRANSPARENT);
            SetTextColor(hdc, GetTextColor());
            HFONT hFont = CreateFontW(17, 0, 0, 0, FW_NORMAL, 0, 0, 0, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI");
            HGDIOBJ oldFont = SelectObject(hdc, hFont);
            DrawTextW(hdc, L"Type a command... (Click for Menu)", -1, &rcSearch, DT_CENTER | DT_VCENTER | DT_SINGLELINE);
            SelectObject(hdc, oldFont); SelectObject(hdc, oldBr);
            DeleteObject(hBrSearch); DeleteObject(hFont);

            // Icons
            auto DrawBtn = [&](RECT r, void(*draw)(HDC, RECT, COLORREF), int id) {
                COLORREF c = (g_hoverBtnID == id) ? GetIconHover() : GetIconIdle();
                if (id == IDM_CLOSE) c = GetQuitColor(); 
                draw(hdc, r, c);
            };

            DrawBtn(GetRectBack(), DrawIconBack, IDM_BACK);
            DrawBtn(GetRectForward(), DrawIconForward, IDM_FORWARD);
            DrawBtn(GetRectHome(), DrawIconHome, IDM_HOME);
            DrawBtn(GetRectAdBlock(), DrawIconAdBlock, IDM_ADBLOCK); // FIX: Actually Draw It!
            
            DrawBtn(GetRectMinimize(w), DrawIconMinimize, IDM_MINIMIZE); 
            DrawBtn(GetRectFullscreen(w), DrawIconFull, IDM_FULLSCREEN);
            DrawBtn(GetRectQuit(w), DrawIconQuit, IDM_CLOSE);

            BitBlt(hdcParams, 0, 0, w, h, hdc, 0, 0, SRCCOPY);
            SelectObject(hdc, oldBmp); DeleteObject(hBmp); DeleteDC(hdc);
            EndPaint(hWnd, &ps);
        }
        break;

    case WM_MOUSEMOVE:
        {
            int x = GET_X_LPARAM(lParam); int y = GET_Y_LPARAM(lParam);
            POINT pt = {x, y};
            RECT rc; GetClientRect(hWnd, &rc);
            int w = rc.right;

            int newHover = -1;
            if (PtInRect(&GetRectBack(), pt)) newHover = IDM_BACK;
            else if (PtInRect(&GetRectForward(), pt)) newHover = IDM_FORWARD;
            else if (PtInRect(&GetRectHome(), pt)) newHover = IDM_HOME;
            else if (PtInRect(&GetRectAdBlock(), pt)) newHover = IDM_ADBLOCK; // HIT TEST
            else if (PtInRect(&GetRectMinimize(w), pt)) newHover = IDM_MINIMIZE;
            else if (PtInRect(&GetRectFullscreen(w), pt)) newHover = IDM_FULLSCREEN;
            else if (PtInRect(&GetRectQuit(w), pt)) newHover = IDM_CLOSE;

            if (newHover != g_hoverBtnID) {
                g_hoverBtnID = newHover;
                InvalidateRect(hWnd, NULL, FALSE);
                TRACKMOUSEEVENT tme = { sizeof(TRACKMOUSEEVENT), TME_LEAVE, hWnd, 0 };
                TrackMouseEvent(&tme);
            }
        }
        break;

    case WM_LBUTTONDOWN:
        {
            // DRAG LOGIC
            int x = GET_X_LPARAM(lParam); int y = GET_Y_LPARAM(lParam);
            POINT pt = {x, y};
            RECT rc; GetClientRect(hWnd, &rc);
            int w = rc.right;

            bool isInteractive = 
                PtInRect(&GetRectBack(), pt) || PtInRect(&GetRectForward(), pt) || PtInRect(&GetRectHome(), pt) ||
                PtInRect(&GetRectMinimize(w), pt) || PtInRect(&GetRectFullscreen(w), pt) || PtInRect(&GetRectQuit(w), pt) ||
                PtInRect(&GetRectSearch(w), pt);

            if (!isInteractive) {
                ReleaseCapture();
                SendMessage(GetParent(hWnd), WM_NCLBUTTONDOWN, HTCAPTION, 0);
                return 0; 
            }
        }
        break;

    case WM_MOUSELEAVE:
        g_hoverBtnID = -1; InvalidateRect(hWnd, NULL, FALSE);
        break;

    case WM_LBUTTONUP:
        {
            int x = GET_X_LPARAM(lParam); int y = GET_Y_LPARAM(lParam);
            POINT pt = {x, y};
            RECT rc; GetClientRect(hWnd, &rc);
            int w = rc.right;

            // CHECK SEARCH CLICK
            if (PtInRect(&GetRectSearch(w), pt)) {
                POINT screenPt = pt;
                ClientToScreen(hWnd, &screenPt);
                ShowCmdPopup(hWnd, screenPt); 
                return 0;
            }

            // CHECK BUTTONS
            int cmd = -1;
            if (PtInRect(&GetRectBack(), pt)) cmd = IDM_BACK;
            else if (PtInRect(&GetRectForward(), pt)) cmd = IDM_FORWARD;
            else if (PtInRect(&GetRectHome(), pt)) cmd = IDM_HOME;
            else if (PtInRect(&GetRectAdBlock(), pt)) cmd = IDM_ADBLOCK; // CLICK
            else if (PtInRect(&GetRectMinimize(w), pt)) cmd = IDM_MINIMIZE;
            else if (PtInRect(&GetRectFullscreen(w), pt)) cmd = IDM_FULLSCREEN;
            else if (PtInRect(&GetRectQuit(w), pt)) cmd = IDM_CLOSE;

            if (cmd != -1) {
                PostMessage(GetParent(hWnd), WM_COMMAND, MAKEWPARAM(cmd, 0), 0);
            }
        }
        break;

    case WM_SETCURSOR:
        SetCursor(LoadCursor(NULL, IDC_HAND)); return TRUE;

    default:
        return DefWindowProc(hWnd, message, wParam, lParam);
    }
    return 0;
}

void RegisterGhostBarClass(HINSTANCE hInstance) {
    WNDCLASSEXW wcex = {0};
    wcex.cbSize = sizeof(WNDCLASSEXW);
    wcex.style = CS_HREDRAW | CS_VREDRAW;
    wcex.lpfnWndProc = GhostBarWndProc;
    wcex.hInstance = hInstance;
    wcex.hCursor = LoadCursor(NULL, IDC_ARROW);
    wcex.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);
    wcex.lpszClassName = L"ClivonGhostBar";
    RegisterClassExW(&wcex);
}

HWND CreateGhostBar(HWND hParent) {
    RECT rc; GetWindowRect(hParent, &rc);
    int w = rc.right - rc.left;
    // REMOVED WS_EX_TOPMOST: Relies on Owner Z-Order to stay above Host
    HWND hWnd = CreateWindowExW(WS_EX_LAYERED | WS_EX_TOOLWINDOW,
        L"ClivonGhostBar", NULL, WS_POPUP | WS_VISIBLE,
        rc.left, rc.top, w, kBarHeight, hParent, NULL, GetModuleHandle(NULL), NULL);
    if (hWnd) {
        g_hGhostBarWnd = hWnd;
        SetGhostBarState(false);
    }
    return hWnd;
}

void SetGhostBarState(bool visible) {
    if (!g_hGhostBarWnd) return;
    LONG_PTR style = GetWindowLongPtr(g_hGhostBarWnd, GWL_EXSTYLE);
    if (visible) {
        SetWindowLongPtr(g_hGhostBarWnd, GWL_EXSTYLE, style & ~WS_EX_TRANSPARENT);
        SetLayeredWindowAttributes(g_hGhostBarWnd, 0, 255, LWA_ALPHA); 
        InvalidateRect(g_hGhostBarWnd, NULL, FALSE);
    } else {
        SetWindowLongPtr(g_hGhostBarWnd, GWL_EXSTYLE, style | WS_EX_TRANSPARENT);
        SetLayeredWindowAttributes(g_hGhostBarWnd, 0, 0, LWA_ALPHA); 
    }
}
