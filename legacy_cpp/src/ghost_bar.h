#ifndef CLIVON_GHOST_BAR_H_
#define CLIVON_GHOST_BAR_H_

#include <windows.h>

extern HWND g_hGhostBarWnd;

// Dimensions
#define GHOST_BAR_HEIGHT 56

// Command IDs
#define IDM_HOME        101
#define IDM_BACK        102
#define IDM_FORWARD     103
#define IDM_SEARCH      104
#define IDM_FOCUS       105
#define IDM_PIP         106
#define IDM_FULLSCREEN  107
#define IDM_SETTINGS    108
#define IDM_MINIMIZE    109 
#define IDM_CLOSE       110
#define IDM_ADBLOCK     111 // New AdGuard Toggle

// Command Popup IDs
#define IDM_CMD_HOME    201
#define IDM_CMD_FOCUS   202
#define IDM_CMD_PIP     203
#define IDM_CMD_FULL    204
#define IDM_CMD_QUIT    205

void RegisterGhostBarClass(HINSTANCE hInstance);
HWND CreateGhostBar(HWND hParent);
void SetGhostBarState(bool visible);

// NEW: Dynamic Theme API
void SetGhostBarTheme(bool isDark); 

#endif // CLIVON_GHOST_BAR_H_
