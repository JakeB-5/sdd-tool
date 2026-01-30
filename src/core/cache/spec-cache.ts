/**
 * 스펙 파싱 결과 캐싱 시스템
 */
import fs from 'node:fs';
import path from 'node:path';

export interface CacheEntry<T> {
  data: T;
  mtime: number;
  createdAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRatio: number;
}

export class SpecCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private hits = 0;
  private misses = 0;

  constructor(private readonly maxEntries: number = 1000) {}

  /**
   * 캐시에서 값 조회
   */
  get(filePath: string): T | undefined {
    const entry = this.cache.get(filePath);
    if (!entry) {
      this.misses++;
      return undefined;
    }

    // mtime 체크
    try {
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs > entry.mtime) {
        this.cache.delete(filePath);
        this.misses++;
        return undefined;
      }
    } catch {
      this.cache.delete(filePath);
      this.misses++;
      return undefined;
    }

    this.hits++;
    return entry.data;
  }

  /**
   * 캐시에 값 저장
   */
  set(filePath: string, data: T): void {
    try {
      const stat = fs.statSync(filePath);

      // LRU: 최대 엔트리 초과 시 가장 오래된 것 제거
      if (this.cache.size >= this.maxEntries) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) this.cache.delete(oldestKey);
      }

      this.cache.set(filePath, {
        data,
        mtime: stat.mtimeMs,
        createdAt: Date.now(),
      });
    } catch {
      // 파일이 없으면 캐시하지 않음
    }
  }

  /**
   * 캐시 통계 조회
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      entries: this.cache.size,
      hitRatio: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * 캐시 초기화
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 특정 엔트리 무효화
   */
  invalidate(filePath: string): boolean {
    return this.cache.delete(filePath);
  }

  /**
   * 캐시 직렬화 (JSON)
   */
  serialize(): string {
    const entries: Record<string, CacheEntry<T>> = {};
    for (const [key, value] of this.cache) {
      entries[key] = value;
    }
    return JSON.stringify({
      entries,
      stats: { hits: this.hits, misses: this.misses },
    });
  }

  /**
   * 캐시 역직렬화
   */
  deserialize(json: string): void {
    try {
      const data = JSON.parse(json);
      this.cache.clear();
      for (const [key, value] of Object.entries(data.entries)) {
        this.cache.set(key, value as CacheEntry<T>);
      }
      this.hits = data.stats?.hits ?? 0;
      this.misses = data.stats?.misses ?? 0;
    } catch {
      // 파싱 실패 시 무시
    }
  }
}
