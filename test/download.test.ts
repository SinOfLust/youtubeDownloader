import { describe, it, expect } from 'vitest';
import {
  sanitizeFilename,
  resolveDownloadOptions,
  buildOutputPath
} from '../src/main/download';

describe('sanitizeFilename', () => {
  it('removes characters that are illegal in file names', () => {
    expect(sanitizeFilename('a/b\\c:d*e?f"g<h>i|j')).toBe('abcdefghij');
  });

  it('keeps spaces and hyphens and collapses whitespace', () => {
    expect(sanitizeFilename('My   Cool - Video')).toBe('My Cool - Video');
  });

  it('falls back to "video" for empty or all-illegal input', () => {
    expect(sanitizeFilename('')).toBe('video');
    expect(sanitizeFilename('///')).toBe('video');
    expect(sanitizeFilename(undefined as unknown as string)).toBe('video');
  });

  it('caps very long titles', () => {
    expect(sanitizeFilename('x'.repeat(500)).length).toBeLessThanOrEqual(100);
  });
});

describe('resolveDownloadOptions', () => {
  it('returns a combined audio+video stream for mp4', () => {
    expect(resolveDownloadOptions('mp4', 'highest')).toEqual({
      filter: 'audioandvideo',
      quality: 'highest',
      container: 'mp4'
    });
    expect(resolveDownloadOptions('mp4', 'lowest').quality).toBe('lowest');
  });

  it('returns an audio-only stream for mp3', () => {
    expect(resolveDownloadOptions('mp3', 'highest')).toEqual({
      filter: 'audioonly',
      quality: 'highestaudio',
      container: 'mp3'
    });
    expect(resolveDownloadOptions('mp3', 'lowest').quality).toBe('lowestaudio');
  });
});

describe('buildOutputPath', () => {
  const join = (dir: string, file: string): string => `${dir}/${file}`;

  it('builds a simple path when nothing collides', () => {
    expect(buildOutputPath(join, '/out', 'My Video', 'mp4', () => false)).toBe(
      '/out/My Video.mp4'
    );
  });

  it('appends a counter when the target already exists', () => {
    const taken = new Set(['/out/My Video.mp4', '/out/My Video (1).mp4']);
    expect(
      buildOutputPath(join, '/out', 'My Video', 'mp4', (c) => taken.has(c))
    ).toBe('/out/My Video (2).mp4');
  });
});
