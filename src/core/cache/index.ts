/**
 * 캐시 모듈 엔트리포인트
 */
export { SpecCache, CacheEntry, CacheStats } from './spec-cache.js';

import { SpecCache } from './spec-cache.js';

// 전역 캐시 인스턴스
let globalSpecCache: SpecCache | null = null;

export function getGlobalCache<T = unknown>(): SpecCache<T> {
  if (!globalSpecCache) {
    globalSpecCache = new SpecCache<T>();
  }
  return globalSpecCache as SpecCache<T>;
}

export function clearGlobalCache(): void {
  if (globalSpecCache) {
    globalSpecCache.clear();
  }
}

export interface CacheOptions {
  enabled: boolean;
  maxEntries?: number;
}

let cacheOptions: CacheOptions = { enabled: true };

export function setCacheOptions(options: Partial<CacheOptions>): void {
  cacheOptions = { ...cacheOptions, ...options };
}

export function getCacheOptions(): CacheOptions {
  return { ...cacheOptions };
}

export function isCacheEnabled(): boolean {
  return cacheOptions.enabled;
}
