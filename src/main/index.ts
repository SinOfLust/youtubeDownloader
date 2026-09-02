import { join, dirname, basename, extname } from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { app, shell, BrowserWindow, ipcMain, dialog, clipboard } from 'electron';
import log from 'electron-log/main';
import ffmpegStatic from 'ffmpeg-static';
import { IPC, DownloadRequest, DownloadResult } from '../shared/ipc';
import { buildYtDlpArgs, parseProgress, parseDestination } from './download';

const isDev = !app.isPackaged;

/** Absolute path to the bundled yt-dlp binary for this platform. */
function ytDlpPath(): string {
  const name = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const dir = app.isPackaged
    ? join(process.resourcesPath, 'bin')
    : join(app.getAppPath(), 'resources', 'bin');
  return join(dir, name);
}

/** Absolute path to the bundled ffmpeg binary (from ffmpeg-static). */
function ffmpegPath(): string {
  const p = (ffmpegStatic as unknown as string) || '';
  // In a packaged app the binary lives in app.asar.unpacked, not the asar.
  return app.isPackaged ? p.replace('app.asar', 'app.asar.unpacked') : p;
}

function setupLogging(): void {
  log.initialize();
  log.transports.file.level = 'info';
  log.transports.console.level = 'debug';
  log.errorHandler.startCatching();
  log.info(`Starting YouTube Downloader ${app.getVersion()} (dev=${isDev})`);
  log.info(`Log file: ${log.transports.file.getFile().path}`);
  log.info(`yt-dlp: ${ytDlpPath()}`);
  log.info(`ffmpeg: ${ffmpegPath()}`);
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

function runDownload(
  req: DownloadRequest,
  onProgress: (percent: number) => void
): Promise<DownloadResult> {
  return new Promise((resolve) => {
    const bin = ytDlpPath();
    if (!fs.existsSync(bin)) {
      resolve({
        ok: false,
        error:
          'The yt-dlp downloader is missing. Please reinstall the app (or run npm install).'
      });
      return;
    }

    const args = buildYtDlpArgs({
      url: req.url,
      format: req.format,
      quality: req.quality,
      destDir: req.destDir,
      ffmpegPath: ffmpegPath()
    });

    log.info(`Running: ${bin} ${args.join(' ')}`);

    let finalPath = '';
    let lastError = '';

    const child = spawn(bin, args, { windowsHide: true });

    const handleLine = (line: string): void => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const percent = parseProgress(trimmed);
      if (percent !== null) {
        onProgress(percent);
        return;
      }
      const dest = parseDestination(trimmed);
      if (dest) finalPath = dest;
      if (/^ERROR:/.test(trimmed)) lastError = trimmed.replace(/^ERROR:\s*/, '');
      log.info(`[yt-dlp] ${trimmed}`);
    };

    let outBuffer = '';
    child.stdout.on('data', (chunk: Buffer) => {
      outBuffer += chunk.toString();
      const lines = outBuffer.split(/\r?\n/);
      outBuffer = lines.pop() ?? '';
      lines.forEach(handleLine);
    });

    let errBuffer = '';
    child.stderr.on('data', (chunk: Buffer) => {
      errBuffer += chunk.toString();
      const lines = errBuffer.split(/\r?\n/);
      errBuffer = lines.pop() ?? '';
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        if (/^ERROR:/.test(trimmed)) lastError = trimmed.replace(/^ERROR:\s*/, '');
        log.warn(`[yt-dlp:err] ${trimmed}`);
      });
    });

    child.on('error', (err) => {
      resolve({ ok: false, error: `Could not start yt-dlp: ${err.message}` });
    });

    child.on('close', (code) => {
      if (code === 0) {
        onProgress(100);
        const title = finalPath
          ? basename(finalPath, extname(finalPath))
          : 'video';
        log.info(`Download finished: ${finalPath || req.destDir}`);
        resolve({ ok: true, filePath: finalPath || req.destDir, title });
      } else {
        const error =
          lastError ||
          'The video could not be downloaded. It may be private, ' +
            'region-locked, or the format is unavailable.';
        log.error(`yt-dlp exited with code ${code}: ${error}`);
        resolve({ ok: false, error });
      }
    });
  });
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

  ipcMain.on(IPC.rendererLog, (_event, level: string, message: string) => {
    if (level === 'error') log.error(`[renderer] ${message}`);
    else log.info(`[renderer] ${message}`);
  });

  ipcMain.handle(
    IPC.download,
    async (event, req: DownloadRequest): Promise<DownloadResult> => {
      log.info(`Download requested: ${req.format}/${req.quality} ${req.url}`);

      if (!req.url || !/^https?:\/\/.+/.test(req.url)) {
        return { ok: false, error: 'Please paste a valid YouTube URL.' };
      }
      if (!req.destDir) {
        return { ok: false, error: 'No destination folder selected.' };
      }

      return runDownload(req, (percent) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send(IPC.progress, Number(percent.toFixed(2)));
        }
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
