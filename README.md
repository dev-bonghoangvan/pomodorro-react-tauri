# Pomodoro Tauri + Pixi

A tiny Pomodoro app built with Tauri (v1), Vite + React, and Pixi.js.
- Default 30-minute session (adjustable)
- Motivational quotes while focusing
- Start with Windows (registry) – Windows only
- Movable frameless window, Always-on-top toggle

## Prerequisites
- Node.js 18+
- Rust toolchain (`rustup`), MSVC on Windows
- Tauri CLI: `npm i -D @tauri-apps/cli`

## Run in dev
```bash
npm install
npm run tauri:dev
```

## Build installer
```bash
npm run tauri:build
```

## Notes
- Frameless dragging is enabled via the top titlebar (drag region).
- Autostart uses Windows registry at `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` with key `PomodoroTauri`.
- If you're not on Windows, the autostart toggle will be a no-op.