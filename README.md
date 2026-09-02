# youtubeDownloader

A simple YouTube downloader made with Electron, React and TypeScript.
Guaranteed without malware or malicious code.

## Features

- Paste a YouTube URL and download it as **MP4** (video) or **MP3** (audio only)
- Choose the highest or lowest available quality
- Live download progress
- Cross-platform (Windows, macOS, Linux)

## Requirements

- [Node.js](https://nodejs.org/) (includes npm)

## Install & run from source

```bash
git clone https://github.com/SinOfLust/youtubeDownloader.git
cd youtubeDownloader
npm install
npm run dev      # run in development
```

## Build a distributable

```bash
npm run package
```

On Windows this produces a classic install wizard in the `release/` folder
(`youtubeDownloader Setup x.x.x.exe`) that lets the user choose the install
folder and creates desktop / start-menu shortcuts.

## Notes

- Downloads use [`@distube/ytdl-core`](https://github.com/distubejs/ytdl-core),
  an actively maintained fork that tracks changes to YouTube. If a download
  ever stops working, update it with `npm install @distube/ytdl-core@latest`
  inside the `app/` folder.
- MP4 downloads pick a single stream that already contains both audio and
  video, so the saved file plays without any extra processing.
- MP3 downloads save the raw audio track under an `.mp3` name. They are **not**
  re-encoded to the MP3 codec (that would require bundling FFmpeg); the file is
  the original audio stream and plays in most modern players.

## Development scripts

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `npm run dev`      | Run the app with hot reload     |
| `npm run lint`     | Lint the source                 |
| `npm run ts`       | Type-check with TypeScript      |
| `npm test`         | Run the unit tests              |
| `npm run package`  | Build a distributable installer |
