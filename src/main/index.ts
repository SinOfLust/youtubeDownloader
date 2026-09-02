import { join } from 'path';
import fs from 'fs';
import { app, shell, BrowserWindow, ipcMain, dialog, clipboard } from 'electron';
import ytdl from '@distube/ytdl-core';
import { IPC, DownloadRequest, DownloadResult } from '../shared/ipc';
import { resolveDownloadOptions, buildOutputPath } from './download';

const isDev = !app.isPackaged;

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

  // Open external links in the user's browser, never inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // electron-vite injects the dev server URL in development.
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

  ipcMain.handle(
    IPC.download,
    async (event, req: DownloadRequest): Promise<DownloadResult> => {
      const { url, format, quality, destDir } = req;

      if (!url || !ytdl.validateURL(url)) {
        return { ok: false, error: 'Please paste a valid YouTube URL.' };
      }
      if (!destDir) {
        return { ok: false, error: 'No destination folder selected.' };
      }

      const options = resolveDownloadOptions(format, quality);

      let title: string;
      try {
        const info = await ytdl.getInfo(url);
        title = info.videoDetails.title;
      } catch {
        return {
          ok: false,
          error:
            'Could not fetch the video. It may be private, age-restricted or unavailable.'
        };
      }

      const filePath = buildOutputPath(
        join,
        destDir,
        title,
        options.container,
        fs.existsSync
      );

      return new Promise<DownloadResult>((resolve) => {
        let settled = false;
        const finish = (result: DownloadResult): void => {
          if (settled) return;
          settled = true;
          resolve(result);
        };

        let stream: ReturnType<typeof ytdl>;
        try {
          stream = ytdl(url, {
            filter: options.filter,
            quality: options.quality
          });
        } catch {
          finish({
            ok: false,
            error: 'The selected format is not available for this video.'
          });
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
          if (!event.sender.isDestroyed()) {
            event.sender.send(IPC.progress, 100);
          }
          finish({ ok: true, filePath, title });
        });

        stream.pipe(file);
      });
    }
  );
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
