# youtubeDownloader

A simple YouTube downloader made with Electron, React and TypeScript.
Guaranteed without malware or malicious code.

## Features

- Paste a YouTube URL and download it as **MP4** (video) or **MP3** (audio only)
- Choose the highest or lowest available quality
- Live download progress
- Cross-platform (Windows, macOS, Linux)

## Requirements

- [Node.js](https://nodejs.org/) and [Yarn](https://yarnpkg.com/)

## Install & run from source

```bash
git clone https://github.com/SinOfLust/youtubeDownloader.git
cd youtubeDownloader
yarn
yarn dev      # run in development
```

## Build a distributable

```bash
yarn package
```

The installer is generated in the `release/` folder
(e.g. `youtubeDownloader Setup x.x.x.exe` on Windows).

## Notes

- Downloads use [`@distube/ytdl-core`](https://github.com/distubejs/ytdl-core),
  an actively maintained fork that tracks changes to YouTube. If a download
  ever stops working, update it with `yarn upgrade @distube/ytdl-core` inside
  the `app/` package.
- MP4 downloads pick a single stream that already contains both audio and
  video, so the saved file plays without any extra processing.
- MP3 downloads save the raw audio track under an `.mp3` name. They are **not**
  re-encoded to the MP3 codec (that would require bundling FFmpeg); the file is
  the original audio stream and plays in most modern players.

## Development scripts

| Command       | Description                        |
| ------------- | ---------------------------------- |
| `yarn dev`    | Run the app with hot reload        |
| `yarn lint`   | Lint the source                    |
| `yarn ts`     | Type-check with TypeScript         |
| `yarn test`   | Run the unit tests                 |
| `yarn package`| Build a distributable installer    |
