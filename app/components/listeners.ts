import { IpcRendererEvent } from 'electron';

const { ipcRenderer } = require('electron');

interface ListenerHandlers {
  setErrorMessage: (value: string) => void;
  setInputValue: (value: string) => void;
  setDownloadProgress: (value: number) => void;
  setButtonText: (value: string) => void;
  setIsDownloading: (value: boolean) => void;
}

/**
 * Register the IPC listeners the Downloader needs and return a function that
 * removes them again. Callers must invoke the returned cleanup (e.g. from a
 * React `useEffect`) so handlers are not stacked on every render.
 */
export default function registerListeners(handlers: ListenerHandlers) {
  const {
    setErrorMessage,
    setInputValue,
    setDownloadProgress,
    setButtonText,
    setIsDownloading
  } = handlers;

  const onError = (_event: IpcRendererEvent, err: string) => {
    setErrorMessage(err);
    if (err) {
      setIsDownloading(false);
      setDownloadProgress(0);
      setButtonText('Download');
    }
  };

  const onInput = (_event: IpcRendererEvent, message: string) => {
    setInputValue(message);
  };

  const onDownloadProgress = (_event: IpcRendererEvent, progress: string) => {
    const percent = Math.floor(Number(progress)); // Drop the decimal part.
    setDownloadProgress(percent);
    if (percent >= 100) {
      setButtonText('Success!');
      setIsDownloading(false);
    } else {
      setButtonText(`${percent} %`);
    }
  };

  ipcRenderer.on('error', onError);
  ipcRenderer.on('input', onInput);
  ipcRenderer.on('downloadProgress', onDownloadProgress);

  return () => {
    ipcRenderer.removeListener('error', onError);
    ipcRenderer.removeListener('input', onInput);
    ipcRenderer.removeListener('downloadProgress', onDownloadProgress);
  };
}
