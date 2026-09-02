import { contextBridge, ipcRenderer } from 'electron';
import { IPC, DownloadRequest, DownloadResult } from '../shared/ipc';

const api = {
  /** Read the system clipboard (used by the Paste button). */
  readClipboard: (): Promise<string> => ipcRenderer.invoke(IPC.readClipboard),

  /** Open the native folder picker; resolves to a path or null if cancelled. */
  chooseFolder: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC.chooseFolder),

  /** Start a download; resolves when it finishes or fails. */
  download: (request: DownloadRequest): Promise<DownloadResult> =>
    ipcRenderer.invoke(IPC.download, request),

  /**
   * Subscribe to download progress (0-100). Returns an unsubscribe function.
   */
  onProgress: (callback: (percent: number) => void): (() => void) => {
    const listener = (_event: unknown, percent: number): void =>
      callback(percent);
    ipcRenderer.on(IPC.progress, listener);
    return () => ipcRenderer.removeListener(IPC.progress, listener);
  }
};

export type DownloaderApi = typeof api;

contextBridge.exposeInMainWorld('api', api);
