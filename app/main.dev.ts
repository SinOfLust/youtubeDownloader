/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveDownloadOptions, buildOutputPath } from './utils/download';

const fs = require('fs');
// Installed into app/node_modules and bundled as an Electron external.
// eslint-disable-next-line import/no-unresolved
const ytdl = require('@distube/ytdl-core');

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let URL: string;
let format: string;
let quality: string;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: true,
    width: 1024,
    height: 728,

    webPreferences:
      process.env.NODE_ENV === 'development' || process.env.E2E_BUILD === 'true'
        ? {
            nodeIntegration: true
          }
        : {
            preload: path.join(__dirname, 'dist/renderer.prod.js'),
            nodeIntegration: true
          }
  });
  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  ipcMain.on('format', (_event, info) => {
    [format, quality] = info.format.split(' ');
  });

  ipcMain.on('URL', async (_event, info) => {
    URL = info.URL.toString();
  });

  ipcMain.on('submit', async (event, info) => {
    const destDir = info && info.path;

    if (!URL || !ytdl.validateURL(URL)) {
      event.reply('error', 'Please paste a valid YouTube URL.');
      return;
    }
    if (!format || !quality) {
      event.reply('error', 'Please choose a format before downloading.');
      return;
    }
    if (!destDir) {
      event.reply(
        'error',
        'No destination folder selected, click download again.'
      );
      return;
    }

    event.reply('error', '');

    const options = resolveDownloadOptions(format, quality);

    let details;
    try {
      const data = await ytdl.getInfo(URL);
      details = data.videoDetails;
    } catch (err) {
      log.error('Failed to fetch video info', err);
      event.reply(
        'error',
        'Could not fetch the video. It may be private, age-restricted or unavailable.'
      );
      return;
    }

    const fullPath = buildOutputPath(
      path.join,
      destDir,
      details.title,
      options.container,
      fs.existsSync
    );

    let stream: any;
    try {
      stream = ytdl(URL, {
        filter: options.filter,
        quality: options.quality
      });
    } catch (err) {
      log.error('Failed to start download stream', err);
      event.reply(
        'error',
        'The selected format is not available for this video.'
      );
      return;
    }

    const file = fs.createWriteStream(fullPath);

    stream.on(
      'progress',
      (_chunkLength: number, downloaded: number, total: number) => {
        const percent = total > 0 ? (downloaded / total) * 100 : 0;
        if (mainWindow) {
          mainWindow.webContents.send('downloadProgress', percent.toFixed(2));
        }
      }
    );

    stream.on('error', (err: Error) => {
      log.error('Download stream error', err);
      file.destroy();
      event.reply('error', `Download failed: ${err.message}`);
    });

    file.on('error', (err: Error) => {
      log.error('File write error', err);
      stream.destroy();
      event.reply('error', `Could not save the file: ${err.message}`);
    });

    file.on('finish', () => {
      if (mainWindow) {
        mainWindow.webContents.send('downloadProgress', '100.00');
      }
    });

    stream.pipe(file);
  });
  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};
/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', createWindow);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});
