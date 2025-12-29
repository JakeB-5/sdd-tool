/**
 * 컨텍스트 스토리지 유닛 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import {
  ContextStorage,
  createContextStorage,
  createEmptyContext,
  CONTEXT_FILE,
} from '../../../../src/core/context/storage.js';

describe('ContextStorage', () => {
  let testDir: string;
  let storage: ContextStorage;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-context-storage-'));
    storage = createContextStorage(testDir);

    // .sdd 디렉토리 생성
    await fs.mkdir(path.join(testDir, '.sdd'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('load', () => {
    it('파일이 없으면 빈 컨텍스트를 반환해야 함', async () => {
      const result = await storage.load();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activeDomains).toEqual([]);
        expect(result.data.readOnlyDomains).toEqual([]);
        expect(result.data.includeDependencies).toBe(true);
      }
    });

    it('저장된 컨텍스트를 로드해야 함', async () => {
      const contextPath = path.join(testDir, CONTEXT_FILE);
      await fs.writeFile(
        contextPath,
        JSON.stringify({
          activeDomains: ['auth'],
          readOnlyDomains: ['core'],
          updatedAt: '2025-12-29T10:00:00.000Z',
          includeDependencies: true,
        })
      );

      const result = await storage.load();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activeDomains).toEqual(['auth']);
        expect(result.data.readOnlyDomains).toEqual(['core']);
        expect(result.data.updatedAt).toBe('2025-12-29T10:00:00.000Z');
      }
    });

    it('잘못된 JSON은 에러를 반환해야 함', async () => {
      const contextPath = path.join(testDir, CONTEXT_FILE);
      await fs.writeFile(contextPath, 'invalid json');

      const result = await storage.load();

      expect(result.success).toBe(false);
    });
  });

  describe('save', () => {
    it('컨텍스트를 저장해야 함', async () => {
      const data = {
        activeDomains: ['auth', 'order'],
        readOnlyDomains: ['core'],
        updatedAt: undefined,
        includeDependencies: true,
      };

      const result = await storage.save(data);

      expect(result.success).toBe(true);

      // 파일 확인
      const contextPath = path.join(testDir, CONTEXT_FILE);
      const content = await fs.readFile(contextPath, 'utf-8');
      const saved = JSON.parse(content);

      expect(saved.activeDomains).toEqual(['auth', 'order']);
      expect(saved.readOnlyDomains).toEqual(['core']);
      expect(saved.updatedAt).toBeDefined();
    });
  });

  describe('clear', () => {
    it('컨텍스트를 초기화해야 함', async () => {
      // 먼저 저장
      await storage.save({
        activeDomains: ['auth'],
        readOnlyDomains: ['core'],
        updatedAt: undefined,
        includeDependencies: true,
      });

      const result = await storage.clear();

      expect(result.success).toBe(true);

      // 로드해서 확인
      const loadResult = await storage.load();
      expect(loadResult.success).toBe(true);
      if (loadResult.success) {
        expect(loadResult.data.activeDomains).toEqual([]);
      }
    });
  });

  describe('exists', () => {
    it('파일이 없으면 false를 반환해야 함', async () => {
      const result = await storage.exists();
      expect(result).toBe(false);
    });

    it('파일이 있으면 true를 반환해야 함', async () => {
      await storage.save(createEmptyContext());
      const result = await storage.exists();
      expect(result).toBe(true);
    });
  });
});

describe('createEmptyContext', () => {
  it('빈 컨텍스트를 생성해야 함', () => {
    const context = createEmptyContext();

    expect(context.activeDomains).toEqual([]);
    expect(context.readOnlyDomains).toEqual([]);
    expect(context.includeDependencies).toBe(true);
    expect(context.updatedAt).toBeUndefined();
  });
});
