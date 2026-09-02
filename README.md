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
- An internet connection for the first `npm install` (it downloads the yt-dlp
  binary)

## Run from source

```bash
git clone https://github.com/SinOfLust/youtubeDownloader.git
cd youtubeDownloader
npm install          # also downloads yt-dlp into resources/bin/
npm run dev
```

## Build an installer

```bash
npm run package              # for the current OS
npm run package-win          # Windows: NSIS installer + portable .exe
npm run package-win-portable # Windows: portable .exe only
npm run package-mac          # macOS .dmg
npm run package-linux        # Linux AppImage + .deb
```

Artifacts are written to the `release/` folder. On Windows you get two files:

- `YouTube Downloader Setup <version>.exe` — a classic install wizard (pick the
  folder, desktop / start-menu shortcuts).
- `YouTube-Downloader-<version>-portable.exe` — a single self-contained `.exe`
  that runs without installing anything (double-click, or copy to a USB stick).

Both are unsigned, so on first launch Windows SmartScreen shows "Unknown
publisher" — choose **More info → Run anyway**.

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
- Downloads are powered by [**yt-dlp**](https://github.com/yt-dlp/yt-dlp), the
  actively maintained downloader, invoked as a bundled subprocess. The binary is
  fetched on `npm install` (`scripts/download-ytdlp.mjs`) and shipped with the
  installer. To update it, delete `resources/bin/` and reinstall, or drop a new
  `yt-dlp` binary there.
- [**FFmpeg**](https://ffmpeg.org/) is bundled via `ffmpeg-static` and used to
  merge the best video+audio into MP4 and to convert audio to real MP3.
- MP4 = best (or worst) video merged with audio into a single `.mp4`.
  MP3 = audio extracted and re-encoded to MP3.
- If a specific video ever fails, check the log (the **Open logs** button in the
  app) for the exact yt-dlp error.

## Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Run the app with hot reload          |
| `npm run build`     | Build main/preload/renderer bundles  |
| `npm run typecheck` | Type-check every process             |
| `npm test`          | Run the unit tests (Vitest)          |
| `npm run package`   | Build a distributable installer      |
