# YouTube Downloader

A simple desktop app to download YouTube videos (MP4) or audio (MP3).
Built with **Electron + Vite + React + TypeScript**. No malware, no ads.

## Features

- Paste a YouTube URL and download it as **MP4** (video) or **MP3** (audio only)
- Choose the highest or lowest available quality
- Live circular progress
- Ships as a classic installer (Windows `.exe` wizard, macOS `.dmg`,
  Linux AppImage/deb)

## Requirements

- [Node.js](https://nodejs.org/) **18, 20 or newer** (includes npm)

## Run from source

```bash
git clone https://github.com/SinOfLust/youtubeDownloader.git
cd youtubeDownloader
npm install
npm run dev
```

## Build an installer

```bash
npm run package          # for the current OS
npm run package-win      # Windows .exe (NSIS wizard)
npm run package-mac      # macOS .dmg
npm run package-linux    # Linux AppImage + .deb
```

Installers are written to the `release/` folder. On Windows the wizard lets the
user pick the install folder and creates desktop / start-menu shortcuts, so it
installs like any classic application.

## Project layout

```
src/
  main/       Electron main process (window + download over IPC)
  preload/    Secure contextBridge API exposed to the renderer
  renderer/   React UI
  shared/     Types shared across processes
```

## Architecture / security notes

- `contextIsolation` is on and `nodeIntegration` is off. The renderer never
  touches Node directly; it talks to the main process through a small, typed
  `window.api` exposed by the preload script.
- Downloads use [`@distube/ytdl-core`](https://github.com/distubejs/ytdl-core),
  an actively maintained fork that tracks changes to YouTube. If a download
  ever stops working, update it: `npm install @distube/ytdl-core@latest`.
- MP4 downloads pick a single stream that already contains audio and video, so
  the saved file plays without any extra processing.
- MP3 downloads save the raw audio track under an `.mp3` name; they are not
  re-encoded to the MP3 codec (that would require bundling FFmpeg).

## Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Run the app with hot reload          |
| `npm run build`     | Build main/preload/renderer bundles  |
| `npm run typecheck` | Type-check every process             |
| `npm test`          | Run the unit tests (Vitest)          |
| `npm run package`   | Build a distributable installer      |
