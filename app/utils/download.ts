/**
 * Pure helpers for turning the user's format/quality choice into
 * ytdl-core download options and a safe output filename.
 *
 * Keeping this logic free of Electron / filesystem side-effects makes it
 * unit-testable and reusable from the main process.
 */

export type MediaContainer = 'mp4' | 'mp3';

export interface DownloadOptions {
  /** ytdl-core stream filter. */
  filter: 'audioandvideo' | 'audioonly';
  /** ytdl-core quality label. */
  quality: 'highest' | 'lowest' | 'highestaudio' | 'lowestaudio';
  /** File extension / container to write. */
  container: MediaContainer;
}

// Characters that are illegal in file names on Windows and macOS.
// Spaces and hyphens are intentionally preserved.
const ILLEGAL_FILENAME_CHARS = /[<>:"/\\|?*]/g;

/**
 * Strip illegal characters, collapse whitespace and cap the length so the
 * resulting name is a valid path segment on every platform.
 */
export function sanitizeFilename(title: string): string {
  const cleaned = (title || '')
    .replace(ILLEGAL_FILENAME_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
    .trim();

  return cleaned || 'video';
}

/**
 * Translate the UI selection ("mp4"/"mp3" + "highest"/"lowest") into the
 * options ytdl-core actually understands.
 *
 * For video we request a single stream that already contains audio
 * (`audioandvideo`) so the saved file is playable without post-processing.
 * For audio-only we pick the best/worst audio track.
 */
export function resolveDownloadOptions(
  format: string,
  quality: string
): DownloadOptions {
  const wantsLowest = quality === 'lowest';

  if (format === 'mp3') {
    return {
      filter: 'audioonly',
      quality: wantsLowest ? 'lowestaudio' : 'highestaudio',
      container: 'mp3'
    };
  }

  return {
    filter: 'audioandvideo',
    quality: wantsLowest ? 'lowest' : 'highest',
    container: 'mp4'
  };
}

/**
 * Build a collision-free destination path. `join` and `exists` are injected
 * (the caller passes `path.join` and `fs.existsSync`) so this stays pure and
 * testable. If `name.ext` is taken it appends " (1)", " (2)", ... until free.
 */
export function buildOutputPath(
  join: (dir: string, file: string) => string,
  dir: string,
  title: string,
  container: MediaContainer,
  exists: (candidate: string) => boolean
): string {
  const base = sanitizeFilename(title);
  let candidate = join(dir, `${base}.${container}`);
  let counter = 1;

  while (exists(candidate)) {
    candidate = join(dir, `${base} (${counter}).${container}`);
    counter += 1;
  }

  return candidate;
}
