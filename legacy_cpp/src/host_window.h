#ifndef CLIVON_HOST_WINDOW_H_
#define CLIVON_HOST_WINDOW_H_

#include <windows.h>

// Global handle to the host window
extern HWND g_hHostWnd;
// Global rect for the child browser
extern RECT g_browserRect;

// Initialize the application window class
void RegisterHostClass(HINSTANCE hInstance);

// Create the main host window
// Returns the handle to the window or NULL on failure
HWND CreateHostWindow(HINSTANCE hInstance, int nCmdShow);

// Window Procedure for the Host Window
LRESULT CALLBACK HostWndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam);

#endif // CLIVON_HOST_WINDOW_H_
