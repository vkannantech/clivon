# Changelog

All notable changes to the **Clivon YouTube Desktop** project will be documented in this file.

## [1.0.1] - 2024-01-15 (Robustness Update)

### 🚀 Improved
- **Native Window Stability**: Enhanced environment detection (`window.__TAURI__`) to preventing crashes in web browsers.
- **Icon Standardization**: Enforced strict **Circular Branding** across all OS surfaces (Taskbar, Window Title, Installer).
- **Code Quality**: Removed unused state variables (`activeView`) and optimized re-renders in `App.tsx`.
- **UX Polish**: "Home" button in Floating Dock now correctly resets to the Main Tab.

### 🐛 Fixed
- Fixed an issue where default Tauri/Vite icons would persist in some cache layers.
- Resolved a lint warning regarding unused variables in the production build.

---

## [1.0.0] - 2024-01-15 (Initial Release)

### ✨ Features
- **Native Hyper-Browser**: Direct YouTube loading without 403 errors.
- **Mini Player**: Always-on-top, borderless picture-in-picture mode.
- **Zen Mode**: Distraction-free full-width viewing.
- **Privacy Core**: Built-in tracking domain blocker.
