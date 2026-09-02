/** Types shared across the main, preload and renderer processes. */

export type MediaType = 'mp4' | 'mp3';
export type Quality = 'highest' | 'lowest';

export interface DownloadRequest {
  url: string;
  format: MediaType;
  quality: Quality;
  destDir: string;
}

export type DownloadResult =
  | { ok: true; filePath: string; title: string }
  | { ok: false; error: string };

/** Channel names used between renderer and main. */
export const IPC = {
  chooseFolder: 'dialog:chooseFolder',
  readClipboard: 'clipboard:read',
  download: 'download:start',
  progress: 'download:progress'
} as const;
