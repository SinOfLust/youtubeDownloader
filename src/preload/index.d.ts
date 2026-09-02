import type { DownloaderApi } from './index';

declare global {
  interface Window {
    api: DownloaderApi;
  }
}
