// Downloads the yt-dlp binary for the current platform into resources/bin/.
// Runs automatically on `npm install` (postinstall). The binary is git-ignored
// and bundled into the app at package time via electron-builder extraResources.
import { createWriteStream, existsSync, mkdirSync, chmodSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const binDir = join(__dirname, '..', 'resources', 'bin');

const RELEASE = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download';
const ASSET = {
  win32: 'yt-dlp.exe',
  darwin: 'yt-dlp_macos',
  linux: 'yt-dlp_linux'
};

const asset = ASSET[process.platform];
if (!asset) {
  console.warn(`[yt-dlp] Unsupported platform "${process.platform}"; skipping.`);
  process.exit(0);
}

const target = join(binDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

if (existsSync(target)) {
  console.log(`[yt-dlp] Already present at ${target}`);
  process.exit(0);
}

mkdirSync(binDir, { recursive: true });

function download(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 10) {
      reject(new Error('Too many redirects'));
      return;
    }
    https
      .get(url, { headers: { 'User-Agent': 'youtubeDownloader-setup' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          resolve(download(res.headers.location, dest, redirects + 1));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const file = createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve()));
        file.on('error', reject);
      })
      .on('error', reject);
  });
}

console.log(`[yt-dlp] Downloading ${asset} …`);
download(`${RELEASE}/${asset}`, target)
  .then(() => {
    if (process.platform !== 'win32') chmodSync(target, 0o755);
    console.log(`[yt-dlp] Saved to ${target}`);
  })
  .catch((err) => {
    console.warn(
      `[yt-dlp] Could not download the binary (${err.message}). ` +
        'The app will not be able to download videos until it is present in ' +
        `${binDir}. You can fetch it manually from https://github.com/yt-dlp/yt-dlp/releases`
    );
    // Do not fail the whole install if the network is unavailable.
    process.exit(0);
  });
