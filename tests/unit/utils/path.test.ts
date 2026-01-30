import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import {
  normalizePathForGit,
  normalizePathForGlob,
  isAbsolutePath,
  normalizePath,
  pathsEqual,
} from '../../../src/utils/path';

describe('path utilities', () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
    });
  });

  describe('normalizePathForGit', () => {
    it('should convert Windows backslashes to forward slashes', () => {
      const input = 'src\\commands\\sync.ts';
      const expected = 'src/commands/sync.ts';
      expect(normalizePathForGit(input)).toBe(expected);
    });

    it('should handle already normalized paths', () => {
      const input = 'src/commands/sync.ts';
      expect(normalizePathForGit(input)).toBe(input);
    });

    it('should handle absolute Windows paths', () => {
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
      });

      const input = 'C:\\projects\\ai-kits\\sdd-tool\\src\\index.ts';
      const expected = 'C:/projects/ai-kits/sdd-tool/src/index.ts';
      expect(normalizePathForGit(input)).toBe(expected);
    });

    it('should handle Unix absolute paths', () => {
      const input = '/home/user/project/src/index.ts';
      expect(normalizePathForGit(input)).toBe(input);
    });

    it('should handle empty path', () => {
      expect(normalizePathForGit('')).toBe('');
    });
  });

  describe('normalizePathForGlob', () => {
    it('should convert all backslashes to forward slashes', () => {
      const input = 'src\\**\\*.ts';
      const expected = 'src/**/*.ts';
      expect(normalizePathForGlob(input)).toBe(expected);
    });

    it('should handle Windows paths with mixed separators', () => {
      const input = 'src\\commands/sync.ts';
      const expected = 'src/commands/sync.ts';
      expect(normalizePathForGlob(input)).toBe(expected);
    });

    it('should handle already normalized glob patterns', () => {
      const input = 'src/**/*.ts';
      expect(normalizePathForGlob(input)).toBe(input);
    });

    it('should handle absolute Windows paths', () => {
      const input = 'C:\\projects\\**\\*.ts';
      const expected = 'C:/projects/**/*.ts';
      expect(normalizePathForGlob(input)).toBe(expected);
    });

    it('should handle empty path', () => {
      expect(normalizePathForGlob('')).toBe('');
    });
  });

  describe('isAbsolutePath', () => {
    it('should recognize Unix absolute paths', () => {
      expect(isAbsolutePath('/home/user/project')).toBe(true);
      expect(isAbsolutePath('/usr/bin')).toBe(true);
    });

    it('should recognize relative Unix paths', () => {
      expect(isAbsolutePath('src/index.ts')).toBe(false);
      expect(isAbsolutePath('./src/index.ts')).toBe(false);
      expect(isAbsolutePath('../project')).toBe(false);
    });

    // Platform-specific tests
    if (process.platform === 'win32') {
      it('should recognize Windows absolute paths', () => {
        expect(isAbsolutePath('C:\\projects')).toBe(true);
        expect(isAbsolutePath('D:\\workspace')).toBe(true);
        expect(isAbsolutePath('\\\\server\\share')).toBe(true);
      });

      it('should recognize relative Windows paths', () => {
        expect(isAbsolutePath('src\\index.ts')).toBe(false);
        expect(isAbsolutePath('.\\src\\index.ts')).toBe(false);
        expect(isAbsolutePath('..\\project')).toBe(false);
      });
    }

    it('should handle empty path', () => {
      expect(isAbsolutePath('')).toBe(false);
    });
  });

  describe('normalizePath', () => {
    it('should normalize path separators for current platform', () => {
      const input = 'src/commands/../utils/index.ts';
      const normalized = normalizePath(input);

      // Should resolve .. and use platform separator
      expect(normalized).toBe(path.normalize(input));
    });

    it('should handle redundant separators', () => {
      const input = 'src//commands///index.ts';
      const normalized = normalizePath(input);

      expect(normalized).toBe(path.normalize(input));
    });

    it('should handle trailing separators', () => {
      const input = 'src/commands/';
      const normalized = normalizePath(input);

      expect(normalized).toBe(path.normalize(input));
    });

    it('should handle . and .. segments', () => {
      const input = './src/./commands/../utils';
      const normalized = normalizePath(input);

      expect(normalized).toBe(path.normalize(input));
    });

    it('should handle empty path', () => {
      expect(normalizePath('')).toBe('.');
    });
  });

  describe('pathsEqual', () => {
    it('should compare normalized paths on Unix', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true,
      });

      expect(pathsEqual('/home/user/project', '/home/user/project')).toBe(true);
      expect(pathsEqual('src/index.ts', 'src/index.ts')).toBe(true);
      expect(pathsEqual('/home/user/project', '/home/user/other')).toBe(false);
    });

    it('should be case-sensitive on Unix', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true,
      });

      expect(pathsEqual('/home/User/project', '/home/user/project')).toBe(false);
      expect(pathsEqual('src/Index.ts', 'src/index.ts')).toBe(false);
    });

    it('should compare normalized paths on Windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
      });

      expect(pathsEqual('C:\\projects\\ai-kits', 'C:\\projects\\ai-kits')).toBe(true);
      expect(pathsEqual('src\\index.ts', 'src\\index.ts')).toBe(true);
      expect(pathsEqual('C:\\projects\\ai-kits', 'C:\\projects\\other')).toBe(false);
    });

    it('should be case-insensitive on Windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
      });

      expect(pathsEqual('C:\\Projects\\AI-Kits', 'c:\\projects\\ai-kits')).toBe(true);
      expect(pathsEqual('src\\Index.ts', 'src\\index.ts')).toBe(true);
    });

    it('should handle paths with different separators', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
      });

      // path.normalize will convert forward slashes to backslashes on Windows
      expect(pathsEqual('src/commands/sync.ts', 'src\\commands\\sync.ts')).toBe(true);
    });

    it('should normalize before comparing', () => {
      expect(pathsEqual('src/./index.ts', 'src/index.ts')).toBe(true);
      expect(pathsEqual('src/commands/../index.ts', 'src/index.ts')).toBe(true);
      expect(pathsEqual('src//index.ts', 'src/index.ts')).toBe(true);
    });

    it('should handle empty paths', () => {
      expect(pathsEqual('', '')).toBe(true);
      expect(pathsEqual('', 'src/index.ts')).toBe(false);
    });
  });
});
