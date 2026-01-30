import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  getGlobalCache,
  clearGlobalCache,
  setCacheOptions,
  getCacheOptions,
  isCacheEnabled,
} from '../../../../src/core/cache/index.js';

describe('Cache Module', () => {
  let tempDir: string;
  let testFile: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-module-test-'));
    testFile = path.join(tempDir, 'test.txt');
    fs.writeFileSync(testFile, 'test content');
    clearGlobalCache();
    setCacheOptions({ enabled: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('getGlobalCache', () => {
    it('should return singleton cache instance', () => {
      const cache1 = getGlobalCache();
      const cache2 = getGlobalCache();
      expect(cache1).toBe(cache2);
    });

    it('should persist data across multiple calls', () => {
      const cache1 = getGlobalCache<string>();
      cache1.set(testFile, 'data');

      const cache2 = getGlobalCache<string>();
      expect(cache2.get(testFile)).toBe('data');
    });
  });

  describe('clearGlobalCache', () => {
    it('should clear all entries', () => {
      const cache = getGlobalCache<string>();
      cache.set(testFile, 'data');

      clearGlobalCache();

      const stats = cache.getStats();
      expect(stats.entries).toBe(0);
    });

    it('should not throw if cache not initialized', () => {
      expect(() => clearGlobalCache()).not.toThrow();
    });
  });

  describe('cache options', () => {
    it('should get default options', () => {
      const options = getCacheOptions();
      expect(options.enabled).toBe(true);
      expect(options.maxEntries).toBeUndefined();
    });

    it('should set cache options', () => {
      setCacheOptions({ enabled: false, maxEntries: 500 });

      const options = getCacheOptions();
      expect(options.enabled).toBe(false);
      expect(options.maxEntries).toBe(500);
    });

    it('should partially update options', () => {
      setCacheOptions({ enabled: true, maxEntries: 1000 });
      setCacheOptions({ maxEntries: 2000 });

      const options = getCacheOptions();
      expect(options.enabled).toBe(true);
      expect(options.maxEntries).toBe(2000);
    });

    it('should check if cache is enabled', () => {
      setCacheOptions({ enabled: true });
      expect(isCacheEnabled()).toBe(true);

      setCacheOptions({ enabled: false });
      expect(isCacheEnabled()).toBe(false);
    });
  });

  describe('typed cache', () => {
    it('should work with typed data', () => {
      interface ParsedSpec {
        title: string;
        sections: string[];
      }

      const cache = getGlobalCache<ParsedSpec>();
      const spec: ParsedSpec = {
        title: 'Test Spec',
        sections: ['intro', 'body', 'conclusion'],
      };

      cache.set(testFile, spec);
      const retrieved = cache.get(testFile);

      expect(retrieved).toEqual(spec);
      expect(retrieved?.title).toBe('Test Spec');
      expect(retrieved?.sections).toHaveLength(3);
    });
  });
});
