# Pomodoro Vibe Spotify

A modern Pomodoro app with Spotify vibes, built with Tauri v2, Vite + React, and YouTube integration.
- Multiple timer modes: Focus, Short Break, Long Break (adjustable durations)
- YouTube music integration for background music
- Motivational quotes in English and Vietnamese
- Auto Start Next feature for seamless workflow
- Multiple responsive UI modes (Full, Tall, Compact, Small, Mini)
- Movable frameless window with Always-on-top toggle
- Windows minimize/close controls

## Prerequisites
- Node.js 18+
- Rust toolchain (`rustup`), MSVC on Windows
- Tauri CLI: `cargo install tauri-cli`

## Features

### 🎵 Music Integration
- YouTube music player with custom URL input
- Background music during focus sessions
- Seamless music experience across all UI modes

### ⏱️ Timer System
- **Focus Mode**: 25 minutes (customizable)
- **Short Break**: 5 minutes (customizable) 
- **Long Break**: 15 minutes (customizable)
- **Auto Start Next**: Automatically transitions between focus and breaks
- **Rounds Per Cycle**: Complete 4 rounds before long break

### 🎨 Responsive UI Modes
- **Full Mode**: Large interface with YouTube player and quotes
- **Tall Mode**: Vertical layout for narrow screens
- **Compact Mode**: Condensed interface
- **Small Mode**: Minimal design for small windows
- **Mini Mode**: Ultra-compact floating timer

### 💬 Motivation
- Bilingual quotes (English & Vietnamese)
- Smooth animations and transitions
- Motivational text: "Nếu không hành động thì giấc mơ mãi mãi chỉ là giấc mơ..."

## Run in dev
```bash
npm install
npm run dev
```

## Build installer
```bash
cargo tauri build
```

## Notes
- Frameless dragging is enabled via the top titlebar (drag region)
- Multiple UI modes automatically switch based on window size
- YouTube integration requires internet connection
- Windows minimize/close controls in hover header