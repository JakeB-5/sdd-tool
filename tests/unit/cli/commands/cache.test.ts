/**
 * cache 명령어 테스트
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getGlobalCache, clearGlobalCache, setCacheOptions, getCacheOptions } from '../../../../src/core/cache/index.js';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('cache command', () => {
  let tmpDir: string;
  let testFile1: string;
  let testFile2: string;

  beforeEach(async () => {
    clearGlobalCache();
    setCacheOptions({ enabled: true });

    // 임시 디렉토리 생성
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cache-test-'));
    testFile1 = path.join(tmpDir, 'test1.md');
    testFile2 = path.join(tmpDir, 'test2.md');

    // 테스트 파일 생성
    await fs.writeFile(testFile1, 'test content 1');
    await fs.writeFile(testFile2, 'test content 2');
  });

  afterEach(async () => {
    // 임시 디렉토리 삭제
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('cache stats', () => {
    it('should return cache statistics', () => {
      const cache = getGlobalCache<string>();

      // 캐시에 데이터 추가
      cache.set(testFile1, 'value1');
      cache.set(testFile2, 'value2');

      // 캐시 히트
      cache.get(testFile1);

      // 캐시 미스
      cache.get(path.join(tmpDir, 'nonexistent.md'));

      const stats = cache.getStats();

      expect(stats.entries).toBe(2);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRatio).toBeCloseTo(0.5);
    });

    it('should handle empty cache', () => {
      const cache = getGlobalCache<string>();
      const stats = cache.getStats();

      expect(stats.entries).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRatio).toBe(0);
    });
  });

  describe('cache clear', () => {
    it('should clear all cache entries', () => {
      const cache = getGlobalCache<string>();

      cache.set(testFile1, 'value1');
      cache.set(testFile2, 'value2');

      expect(cache.getStats().entries).toBe(2);

      clearGlobalCache();

      expect(cache.getStats().entries).toBe(0);
    });
  });

  describe('cache enable/disable', () => {
    it('should enable cache', () => {
      setCacheOptions({ enabled: false });
      expect(getCacheOptions().enabled).toBe(false);

      setCacheOptions({ enabled: true });
      expect(getCacheOptions().enabled).toBe(true);
    });

    it('should disable cache', () => {
      setCacheOptions({ enabled: true });
      expect(getCacheOptions().enabled).toBe(true);

      setCacheOptions({ enabled: false });
      expect(getCacheOptions().enabled).toBe(false);
    });

    it('should preserve other options when enabling/disabling', () => {
      setCacheOptions({ enabled: true, maxEntries: 100 });

      setCacheOptions({ enabled: false });
      const options = getCacheOptions();

      expect(options.enabled).toBe(false);
      expect(options.maxEntries).toBe(100);
    });
  });

  describe('cache options', () => {
    it('should get current cache options', () => {
      setCacheOptions({ enabled: true, maxEntries: 50 });

      const options = getCacheOptions();

      expect(options.enabled).toBe(true);
      expect(options.maxEntries).toBe(50);
    });

    it('should update partial options', () => {
      setCacheOptions({ enabled: true, maxEntries: 100 });
      setCacheOptions({ maxEntries: 200 });

      const options = getCacheOptions();

      expect(options.enabled).toBe(true);
      expect(options.maxEntries).toBe(200);
    });
  });
});
