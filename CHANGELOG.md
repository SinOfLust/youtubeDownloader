# 2.0.0
- Replace the download engine with **yt-dlp + FFmpeg**. `@distube/ytdl-core`
  can no longer decipher YouTube's current player ("Could not parse decipher
  function"), so downloads produced nothing. yt-dlp is the actively maintained
  tool that tracks YouTube; FFmpeg (bundled via `ffmpeg-static`) merges MP4 and
  produces real MP3. The yt-dlp binary is fetched on install and bundled by
  electron-builder (extraResources); FFmpeg is unpacked from the asar.
- Add logging (electron-log, file + console), surface the real error in the UI,
  add an "Open logs" button, and harden the renderer so failures can no longer
  happen silently.
- Full modernization so the app builds and runs on current Node (18/20/22).
  Rebuilt on **electron-vite + Vite 5 + React 18 + TypeScript 5**, replacing the
  2020-era electron-react-boilerplate stack (webpack 4, Babel, node-sass) that
  no longer installs on modern Node and carried 400+ known vulnerabilities.
- Upgraded Electron 7 → 31 with a secure model: `contextIsolation` on,
  `nodeIntegration` off, a typed `window.api` exposed via a preload
  `contextBridge`, and downloads driven over `ipcMain.handle` (no `remote`).
- Dropped Redux — the small UI now uses local React state and calls the
  preload API directly.
- Replaced the icon-font/CDN dependency with inline SVG icons and the
  rc-progress ring with a pure-SVG progress ring (no external requests; strict
  Content-Security-Policy).
- Packaging unchanged in spirit: `electron-builder` still produces a classic
  NSIS install wizard on Windows, plus `.dmg` (macOS) and AppImage/`.deb`
  (Linux).
- Tests run on Vitest.

# 1.1.0
- Migrate the tooling from Yarn to npm: all scripts use `npm run`, removed the
  Yarn-only preinstall gate, `yarn.lock` files and the bundled `yarn` dep, and
  regenerated `package-lock.json`. Install and run with `npm install` / `npm run dev`
- Remove the invalid legacy `devEngines` field that broke `npm install` on modern npm
- Convert the GitHub Actions and Azure pipelines to npm (and off removed CI images)
- Fix downloading with modern YouTube by switching to the maintained `@distube/ytdl-core` fork
- Read the video title from `videoDetails` (the old `info.title` no longer exists), sanitize it for the filesystem and avoid overwriting existing files
- MP4 now downloads a single stream containing both audio and video
- Add error handling around fetching video info and the download/write streams, surfaced in the UI
- Report progress from ytdl's `progress` event instead of the often-missing `content-length` header
- Fix an IPC listener leak that stacked new handlers on every render
- UI: editable URL field with a dedicated Paste button, controlled format selection, and a disabled state while downloading
- Replace the externally-hosted radio-button image with pure CSS
- Remove dead boilerplate (Counter) tests and add real unit tests for the download helpers

# 1.0.2
- Fix a bug on the download button that occur when you close the file explorer without select a path and add a error message
- Add changelog
- fix a bug on the auto updater

#1.0.1
- Added a pointer while hovering the circle

#1.0.0
- Added a paste button on right-click
- Enabled 3 keyboard shortcut ( Fullscreen, paste and close the app)
- Disabled reloading shortcut
- added a top menu
- resized the clickable area
- reduced by 2 the app size 
