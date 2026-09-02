import { useEffect, useState } from 'react';
import type { MediaType, Quality } from '../../shared/ipc';
import { YoutubeIcon, PasteIcon, FilmIcon, MusicIcon, AlertIcon } from './icons';

type Status = 'idle' | 'downloading' | 'done' | 'error';

const RADIUS = 47;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function App(): JSX.Element {
  const [url, setUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('mp4');
  const [quality, setQuality] = useState<Quality>('highest');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    return window.api.onProgress((percent) => setProgress(Math.floor(percent)));
  }, []);

  const paste = async (): Promise<void> => {
    const text = await window.api.readClipboard();
    if (text) {
      setUrl(text);
      setMessage('');
    }
  };

  const download = async (): Promise<void> => {
    if (status === 'downloading') return;

    if (!url.trim()) {
      setStatus('error');
      setMessage('Please paste a YouTube URL first.');
      return;
    }

    const destDir = await window.api.chooseFolder();
    if (!destDir) {
      setStatus('error');
      setMessage('Select a folder to download the file into.');
      return;
    }

    setStatus('downloading');
    setMessage('');
    setProgress(0);

    const result = await window.api.download({
      url: url.trim(),
      format: mediaType,
      quality,
      destDir
    });

    if (result.ok) {
      setStatus('done');
      setProgress(100);
      setMessage(`Saved “${result.title}”.`);
    } else {
      setStatus('error');
      setMessage(result.error);
    }
  };

  const buttonLabel =
    status === 'downloading'
      ? `${progress} %`
      : status === 'done'
        ? 'Done!'
        : 'Download';

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">
          <YoutubeIcon />
        </span>
        <h1 className="app-title">YouTube Downloader</h1>
        <p className="app-subtitle">Paste a link, pick a format, download.</p>
      </header>

      <div className="card">
        <div className="url-row">
          <input
            className="url-input"
            value={url}
            type="text"
            placeholder="https://www.youtube.com/watch?v=…"
            spellCheck={false}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="button" className="btn-paste" onClick={paste}>
            <PasteIcon />
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
                <FilmIcon />
                <span>MP4</span>
              </button>
              <button
                type="button"
                className={mediaType === 'mp3' ? 'seg active' : 'seg'}
                onClick={() => setMediaType('mp3')}
              >
                <MusicIcon />
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
            className={`download-btn ${status}`}
            onClick={download}
            disabled={status === 'downloading'}
          >
            <svg className="progress-ring" viewBox="0 0 100 100">
              <circle
                className="ring-trail"
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                strokeWidth="5"
              />
              <circle
                className="ring-progress"
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress / 100)}
              />
            </svg>
            <span className="download-label">{buttonLabel}</span>
          </button>
        </div>

        {message ? (
          <p className={status === 'error' ? 'status-error' : 'status-ok'}>
            {status === 'error' ? <AlertIcon /> : null}
            <span>{message}</span>
          </p>
        ) : (
          <p className="status-hint">&nbsp;</p>
        )}
      </div>
    </div>
  );
}
