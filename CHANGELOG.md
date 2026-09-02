# 1.1.0
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
