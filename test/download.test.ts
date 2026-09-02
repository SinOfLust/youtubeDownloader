import { describe, it, expect } from 'vitest';
import {
  buildYtDlpArgs,
  parseProgress,
  parseDestination
} from '../src/main/download';

const base = {
  url: 'https://youtu.be/abc',
  destDir: '/out',
  ffmpegPath: '/bin/ffmpeg'
} as const;

describe('buildYtDlpArgs', () => {
  it('builds a merged MP4 command for highest video', () => {
    const args = buildYtDlpArgs({ ...base, format: 'mp4', quality: 'highest' });
    expect(args).toContain('bv*+ba/b');
    expect(args).toEqual(
      expect.arrayContaining(['--merge-output-format', 'mp4'])
    );
    expect(args).toEqual(expect.arrayContaining(['--ffmpeg-location', '/bin/ffmpeg']));
    expect(args).toEqual(expect.arrayContaining(['-o', '/out/%(title)s.%(ext)s']));
    expect(args[args.length - 1]).toBe('https://youtu.be/abc');
  });

  it('uses the worst selector for lowest MP4', () => {
    const args = buildYtDlpArgs({ ...base, format: 'mp4', quality: 'lowest' });
    expect(args).toContain('wv*+wa/w');
  });

  it('extracts and converts to MP3 with the right quality', () => {
    const high = buildYtDlpArgs({ ...base, format: 'mp3', quality: 'highest' });
    expect(high).toEqual(
      expect.arrayContaining(['-x', '--audio-format', 'mp3', '--audio-quality', '0'])
    );
    const low = buildYtDlpArgs({ ...base, format: 'mp3', quality: 'lowest' });
    expect(low).toEqual(expect.arrayContaining(['--audio-quality', '9']));
  });
});

describe('parseProgress', () => {
  it('reads a percentage from a download line', () => {
    expect(parseProgress('[download]   4.2% of ~ 1.23MiB at 500KiB/s')).toBe(4.2);
    expect(parseProgress('[download] 100% of 1.00MiB')).toBe(100);
  });

  it('ignores non-progress lines', () => {
    expect(parseProgress('[youtube] Extracting URL')).toBeNull();
    expect(parseProgress('')).toBeNull();
  });
});

describe('parseDestination', () => {
  it('reads the destination from the various yt-dlp messages', () => {
    expect(parseDestination('[download] Destination: /out/Song.webm')).toBe(
      '/out/Song.webm'
    );
    expect(
      parseDestination('[Merger] Merging formats into "/out/My Video.mp4"')
    ).toBe('/out/My Video.mp4');
    expect(parseDestination('[ExtractAudio] Destination: /out/Song.mp3')).toBe(
      '/out/Song.mp3'
    );
  });

  it('returns null when there is no destination', () => {
    expect(parseDestination('[download]  50.0% of 2MiB')).toBeNull();
  });
});
