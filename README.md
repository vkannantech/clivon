# YouTube Desktop by Clivon

> **Experience YouTube like never before. Native performance. Zero distractions. Ultimate control.**

![Clivon YouTube Client](public/icon.png)

## 🚀 Overview

**YouTube Desktop** is a cutting-edge, high-performance client designed for power users who demand more than a browser tab. Built on the **Tauri V2** engine, it leverages a unique **Native Window Architecture** to deliver a lag-free, ad-blocked*, and tracking-minimized experience.

Unlike other clients that use heavy Electron wrappers, Clivon's engine uses Rust to spawn lightweight, native OS webviews. This ensures:
- **Instant Launch Times**
- **Native 403 Bypass** (No "Video Unavailable" errors)
- **Zero White Flashing** (Custom Dark Loader Injection)

---

## ✨ Features

### 🖥️ Native Hyper-Browser
Bypassing fragile proxy methods, our **Native Child Window System** launches a direct portal to YouTube's engine. This ensures 100% compatibility with 4K HDR streaming while stripping away browser overhead.

### 🎭 Multi-Window Mini Player (PiP Pro)
Work and watch simultaneously.
- **Always-on-Top**: Never lose sight of your video.
- **Borderless & Resizeable**: Fits perfectly in any corner.
- **Crash-Proof**: Intelligent environment detection prevents usage outside the desktop app.

### 🧘 Zen Mode
Hit `Ctrl + B` (or use the dock) to vanish all UI elements. Just you and the content.
- **Hidden Sidebar/Tabs**
- **Immersive Viewing**

### 🔒 Built-in Privacy & Speed
- **Tracker Domain Filtering**: Actively blocks known tracking domains at the network request level.
- **Performance**: Rust-based connection pooling and Brotli compression for lightning-fast asset loading.

---

## ⌨️ Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + T` | New Tab |
| `Ctrl + W` | Close Tab |
| `Ctrl + M` | Toggle Mini Player |
| `Ctrl + B` | Toggle Zen Mode |

---

## 📦 Installation / Development

To build the app yourself:

```bash
# 1. Install Dependencies
npm install

# 2. Run Development Mode (Desktop App)
npm run tauri dev

# 3. Build Production Release (MSI/DMG/Deb)
npm run tauri build
```

---

## 🛡️ License & Credits

**Published by Clivon**
© 2024 Clivon Inc. All Rights Reserved.

*This project is an independent client and is not affiliated with Google LLC. YouTube is a trademark of Google LLC.*
