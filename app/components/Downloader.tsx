import React, { useEffect, useState } from 'react';
import { Circle } from 'rc-progress';
import registerListeners from './listeners';
import { OpenDialogResult } from '../actions/path';

type Props = {
  updateUrl: (value: string) => void;
  updateFormat: (value: string) => void;
  updatePath: (value: OpenDialogResult) => void;
};

type MediaType = 'mp4' | 'mp3';
type Quality = 'highest' | 'lowest';

export default function Downloader(props: Props) {
  const { updateUrl, updateFormat, updatePath } = props;
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('mp4');
  const [quality, setQuality] = useState<Quality>('highest');
  const [buttonText, setButtonText] = useState('Download');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    return registerListeners({
      setErrorMessage,
      setInputValue,
      setDownloadProgress,
      setButtonText,
      setIsDownloading
    });
  }, []);

  // Keep the main process in sync with the current format selection.
  useEffect(() => {
    updateFormat(`${mediaType} ${quality}`);
  }, [mediaType, quality, updateFormat]);

  const updateURL = (url: string) => {
    updateUrl(url);
    setInputValue(url);
  };

  const paste = () => {
    // eslint-disable-next-line global-require
    const { clipboard } = require('electron').remote;
    updateURL(clipboard.readText().trim());
  };

  const handleSubmit = async () => {
    if (isDownloading) return;

    if (!inputValue) {
      setErrorMessage('Please paste a YouTube URL first.');
      return;
    }

    // eslint-disable-next-line global-require
    const { dialog } = require('electron').remote;
    const result: OpenDialogResult = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      setErrorMessage('Select a folder to download the file into.');
      return;
    }

    setErrorMessage('');
    setDownloadProgress(0);
    setIsDownloading(true);
    setButtonText('Starting…');
    updatePath(result);
  };

  const isDone = downloadProgress >= 100;

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">
          <i className="fab fa-youtube" />
        </span>
        <h1 className="app-title">YouTube Downloader</h1>
        <p className="app-subtitle">Paste a link, pick a format, download.</p>
      </header>

      <div className="card">
        <div className="url-row">
          <input
            className="url-input"
            value={inputValue}
            type="text"
            placeholder="https://www.youtube.com/watch?v=…"
            onChange={e => updateURL(e.target.value)}
            spellCheck={false}
          />
          <button type="button" className="btn-paste" onClick={paste}>
            <i className="fas fa-paste" />
            <span>Paste</span>
          </button>
        </div>

        <div className="options">
          <div className="option-group">
            <span className="option-label">Format</span>
            <div className="segmented">
              <button
                type="button"
                className={mediaType === 'mp4' ? 'seg active' : 'seg'}
                onClick={() => setMediaType('mp4')}
              >
                <i className="fas fa-film" />
                <span>MP4</span>
              </button>
              <button
                type="button"
                className={mediaType === 'mp3' ? 'seg active' : 'seg'}
                onClick={() => setMediaType('mp3')}
              >
                <i className="fas fa-music" />
                <span>MP3</span>
              </button>
            </div>
          </div>

          <div className="option-group">
            <span className="option-label">Quality</span>
            <div className="segmented">
              <button
                type="button"
                className={quality === 'highest' ? 'seg active' : 'seg'}
                onClick={() => setQuality('highest')}
              >
                Highest
              </button>
              <button
                type="button"
                className={quality === 'lowest' ? 'seg active' : 'seg'}
                onClick={() => setQuality('lowest')}
              >
                Lowest
              </button>
            </div>
          </div>
        </div>

        <div className="download-zone">
          <button
            type="button"
            className={`download-btn${isDownloading ? ' downloading' : ''}${
              isDone ? ' done' : ''
            }`}
            onClick={handleSubmit}
            disabled={isDownloading}
          >
            <Circle
              className="progress-ring"
              percent={downloadProgress}
              strokeWidth={5}
              trailWidth={5}
              strokeColor="#ff0033"
              trailColor="rgba(255,255,255,0.12)"
            />
            <span className="download-label">{buttonText}</span>
          </button>
        </div>

        {errorMessage ? (
          <p className="status-error">
            <i className="fas fa-circle-exclamation" />
            <span>{errorMessage}</span>
          </p>
        ) : (
          <p className="status-hint">&nbsp;</p>
        )}
      </div>
    </div>
  );
}
