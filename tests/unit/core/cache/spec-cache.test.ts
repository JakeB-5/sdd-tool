import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SpecCache } from '../../../../src/core/cache/spec-cache.js';

describe('SpecCache', () => {
  let cache: SpecCache<string>;
  let tempDir: string;
  let testFile: string;

  beforeEach(() => {
    cache = new SpecCache<string>(3); // Small max for LRU testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-cache-test-'));
    testFile = path.join(tempDir, 'test.txt');
    fs.writeFileSync(testFile, 'test content');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('get/set', () => {
    it('should return undefined for missing key', () => {
      expect(cache.get(testFile)).toBeUndefined();
    });

    it('should cache and retrieve data', () => {
      cache.set(testFile, 'cached data');
      expect(cache.get(testFile)).toBe('cached data');
    });

    it('should invalidate cache when file is modified', async () => {
      cache.set(testFile, 'original data');
      expect(cache.get(testFile)).toBe('original data');

      // Wait a bit to ensure mtime changes
      await new Promise(resolve => setTimeout(resolve, 10));
      fs.writeFileSync(testFile, 'modified content');

      expect(cache.get(testFile)).toBeUndefined();
    });

    it('should invalidate cache when file is deleted', () => {
      cache.set(testFile, 'data');
      fs.unlinkSync(testFile);
      expect(cache.get(testFile)).toBeUndefined();
    });

    it('should not cache data for non-existent file', () => {
      const nonExistent = path.join(tempDir, 'missing.txt');
      cache.set(nonExistent, 'data');
      expect(cache.get(nonExistent)).toBeUndefined();
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entry when max entries exceeded', () => {
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');
      const file3 = path.join(tempDir, 'file3.txt');
      const file4 = path.join(tempDir, 'file4.txt');

      fs.writeFileSync(file1, 'content1');
      fs.writeFileSync(file2, 'content2');
      fs.writeFileSync(file3, 'content3');
      fs.writeFileSync(file4, 'content4');

      cache.set(file1, 'data1');
      cache.set(file2, 'data2');
      cache.set(file3, 'data3');

      const stats = cache.getStats();
      expect(stats.entries).toBe(3);

      // Adding 4th should evict first
      cache.set(file4, 'data4');
      expect(cache.getStats().entries).toBe(3);
      expect(cache.get(file1)).toBeUndefined(); // Evicted
      expect(cache.get(file4)).toBe('data4'); // New entry
    });
  });

  describe('stats', () => {
    it('should track hits and misses', () => {
      cache.set(testFile, 'data');

      cache.get(testFile); // hit
      cache.get(testFile); // hit
      cache.get(path.join(tempDir, 'missing.txt')); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.entries).toBe(1);
      expect(stats.hitRatio).toBeCloseTo(2/3);
    });

    it('should return 0 hit ratio when no accesses', () => {
      const stats = cache.getStats();
      expect(stats.hitRatio).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all entries and reset stats', () => {
      cache.set(testFile, 'data');
      cache.get(testFile);

      cache.clear();

      const stats = cache.getStats();
      expect(stats.entries).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('invalidate', () => {
    it('should remove specific entry', () => {
      cache.set(testFile, 'data');
      expect(cache.invalidate(testFile)).toBe(true);
      expect(cache.get(testFile)).toBeUndefined();
    });

    it('should return false for non-existent entry', () => {
      expect(cache.invalidate(testFile)).toBe(false);
    });
  });

  describe('serialize/deserialize', () => {
    it('should serialize and deserialize cache', () => {
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');
      fs.writeFileSync(file1, 'content1');
      fs.writeFileSync(file2, 'content2');

      cache.set(file1, 'data1');
      cache.set(file2, 'data2');
      cache.get(file1); // 1 hit
      cache.get('missing'); // 1 miss

      const json = cache.serialize();

      const newCache = new SpecCache<string>();
      newCache.deserialize(json);

      expect(newCache.get(file1)).toBe('data1');
      expect(newCache.get(file2)).toBe('data2');

      const stats = newCache.getStats();
      expect(stats.hits).toBe(3); // 2 from gets above + 1 from original
      expect(stats.misses).toBe(1);
    });

    it('should handle invalid JSON gracefully', () => {
      cache.deserialize('invalid json');
      expect(cache.getStats().entries).toBe(0);
    });

    it('should handle empty object', () => {
      cache.deserialize('{}');
      expect(cache.getStats().entries).toBe(0);
    });
  });

  describe('complex data types', () => {
    it('should cache objects', () => {
      const objCache = new SpecCache<{ value: number }>();
      const data = { value: 42 };

      objCache.set(testFile, data);
      const retrieved = objCache.get(testFile);

      expect(retrieved).toEqual(data);
      expect(retrieved).toBe(data); // Same reference
    });

    it('should cache arrays', () => {
      const arrCache = new SpecCache<number[]>();
      const data = [1, 2, 3];

      arrCache.set(testFile, data);
      const retrieved = arrCache.get(testFile);

      expect(retrieved).toEqual(data);
    });
  });
});
