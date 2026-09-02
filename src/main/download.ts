/**
 * Pure helpers for driving yt-dlp: building its argument list and parsing its
 * line-based output. Free of Electron / process side-effects so they can be
 * unit tested.
 */
import type { MediaType, Quality } from '../shared/ipc';

export interface BuildArgsInput {
  url: string;
  format: MediaType;
  quality: Quality;
  destDir: string;
  ffmpegPath: string;
  /** yt-dlp output template, defaults to "<title>.<ext>". */
  outputTemplate?: string;
}

/**
 * Translate the UI selection into a yt-dlp command line.
 *
 * - MP4 muxes the best (or worst) video+audio into a single .mp4 (FFmpeg).
 * - MP3 extracts the audio track and re-encodes it to real MP3 (FFmpeg).
 */
export function buildYtDlpArgs(input: BuildArgsInput): string[] {
  const { url, format, quality, destDir, ffmpegPath } = input;
  const template = input.outputTemplate ?? '%(title)s.%(ext)s';
  const output = `${destDir}/${template}`;

  const common = [
    '--no-playlist',
    '--newline',
    '--no-mtime',
    '--ffmpeg-location',
    ffmpegPath,
    '-o',
    output
  ];

  let selection: string[];
  if (format === 'mp3') {
    selection = [
      '-x',
      '--audio-format',
      'mp3',
      '--audio-quality',
      quality === 'lowest' ? '9' : '0'
    ];
  } else {
    selection = [
      '-f',
      quality === 'lowest' ? 'wv*+wa/w' : 'bv*+ba/b',
      '--merge-output-format',
      'mp4'
    ];
  }

  return [...selection, ...common, url];
}

/** Parse a download-progress percentage (0-100) from a yt-dlp output line. */
export function parseProgress(line: string): number | null {
  const match = line.match(/^\[download\]\s+([\d.]+)%/);
  if (!match) return null;
  const percent = Number(match[1]);
  return Number.isFinite(percent) ? percent : null;
}

/** Parse the final output file path from a yt-dlp output line, if present. */
export function parseDestination(line: string): string | null {
  const patterns = [
    /^\[Merger\] Merging formats into "(.+)"$/,
    /^\[ExtractAudio\] Destination:\s+(.+)$/,
    /^\[download\] Destination:\s+(.+)$/,
    /^\[download\] (.+) has already been downloaded$/
  ];
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}
