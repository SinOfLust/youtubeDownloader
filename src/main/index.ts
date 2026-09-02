import { join, dirname } from 'path';
import fs from 'fs';
import { app, shell, BrowserWindow, ipcMain, dialog, clipboard } from 'electron';
import log from 'electron-log/main';
import ytdl from '@distube/ytdl-core';
import { IPC, DownloadRequest, DownloadResult } from '../shared/ipc';
import { resolveDownloadOptions, buildOutputPath } from './download';

const isDev = !app.isPackaged;

// A desktop User-Agent reduces (does not eliminate) YouTube "confirm you're not
// a bot" responses on requests made without a signed-in session.
const requestOptions = {
  headers: {
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  }
};

function setupLogging(): void {
  log.initialize();
  log.transports.file.level = 'info';
  log.transports.console.level = 'debug';
  log.errorHandler.startCatching();
  log.info(`Starting YouTube Downloader ${app.getVersion()} (dev=${isDev})`);
  log.info(`Log file: ${log.transports.file.getFile().path}`);
}

/** Reject if `promise` does not settle within `ms`. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    )
  ]);
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 720,
    minWidth: 640,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0f1117',
    title: 'YouTube Downloader',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle(IPC.readClipboard, () => clipboard.readText().trim());

  ipcMain.handle(IPC.chooseFolder, async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(IPC.openLogs, () =>
    shell.openPath(dirname(log.transports.file.getFile().path))
  );

  // Forward renderer-side logs/errors into the same log file.
  ipcMain.on(IPC.rendererLog, (_event, level: string, message: string) => {
    if (level === 'error') log.error(`[renderer] ${message}`);
    else log.info(`[renderer] ${message}`);
  });

  ipcMain.handle(
    IPC.download,
    async (event, req: DownloadRequest): Promise<DownloadResult> => {
      const { url, format, quality, destDir } = req;
      log.info(`Download requested: ${format}/${quality} ${url} -> ${destDir}`);

      if (!url || !ytdl.validateURL(url)) {
        return { ok: false, error: 'Please paste a valid YouTube URL.' };
      }
      if (!destDir) {
        return { ok: false, error: 'No destination folder selected.' };
      }

      const options = resolveDownloadOptions(format, quality);

      let title: string;
      try {
        const info = await withTimeout(
          ytdl.getInfo(url, { requestOptions }),
          30000,
          'Fetching video info'
        );
        title = info.videoDetails.title;
        log.info(`Video info OK: "${title}"`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log.error('getInfo failed:', message);
        return {
          ok: false,
          error: `Could not fetch the video: ${message}`
        };
      }

      const filePath = buildOutputPath(
        join,
        destDir,
        title,
        options.container,
        fs.existsSync
      );
      log.info(`Saving to: ${filePath}`);

      return new Promise<DownloadResult>((resolve) => {
        let settled = false;
        const finish = (result: DownloadResult): void => {
          if (settled) return;
          settled = true;
          if (result.ok) log.info(`Download finished: ${result.filePath}`);
          else log.error(`Download failed: ${result.error}`);
          resolve(result);
        };

        let stream: ReturnType<typeof ytdl>;
        try {
          stream = ytdl(url, {
            filter: options.filter,
            quality: options.quality,
            requestOptions
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          finish({ ok: false, error: `The selected format is not available: ${message}` });
          return;
        }

        const file = fs.createWriteStream(filePath);

        stream.on('progress', (_chunk: number, downloaded: number, total: number) => {
          const percent = total > 0 ? (downloaded / total) * 100 : 0;
          if (!event.sender.isDestroyed()) {
            event.sender.send(IPC.progress, Number(percent.toFixed(2)));
          }
        });

        stream.on('error', (err: Error) => {
          file.destroy();
          finish({ ok: false, error: `Download failed: ${err.message}` });
        });

        file.on('error', (err: Error) => {
          stream.destroy();
          finish({ ok: false, error: `Could not save the file: ${err.message}` });
        });

        file.on('finish', () => {
          if (!event.sender.isDestroyed()) event.sender.send(IPC.progress, 100);
          finish({ ok: true, filePath, title });
        });

        stream.pipe(file);
      });
    }
  );
}

app.whenReady().then(() => {
  setupLogging();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
