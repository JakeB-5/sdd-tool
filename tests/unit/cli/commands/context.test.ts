/**
 * sdd context 명령어 유닛 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import {
  executeContextSet,
  executeContextShow,
  executeContextClear,
  executeContextAdd,
  executeContextRemove,
  executeContextSpecs,
} from '../../../../src/cli/commands/context.js';
import { executeDomainCreate, executeDomainLink } from '../../../../src/cli/commands/domain.js';

describe('sdd context', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-context-cli-'));

    // SDD 프로젝트 구조 생성
    await fs.mkdir(path.join(testDir, '.sdd'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.sdd', 'domains'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.sdd', 'specs'), { recursive: true });

    // 테스트용 도메인 생성
    await executeDomainCreate('core', { description: '핵심' }, testDir);
    await executeDomainCreate('auth', { description: '인증', dependsOn: ['core'] }, testDir);
    await executeDomainCreate('order', { description: '주문', dependsOn: ['core', 'auth'] }, testDir);

    // 테스트용 스펙 연결
    await executeDomainLink('core', ['utils', 'config'], testDir);
    await executeDomainLink('auth', ['login', 'oauth'], testDir);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('executeContextSet', () => {
    it('컨텍스트를 설정해야 함', async () => {
      const result = await executeContextSet(['auth'], {}, testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activeDomains).toEqual(['auth']);
        expect(result.data.readOnlyDomains).toContain('core');
      }
    });

    it('여러 도메인을 설정해야 함', async () => {
      const result = await executeContextSet(['auth', 'order'], {}, testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activeDomains).toContain('auth');
        expect(result.data.activeDomains).toContain('order');
      }
    });

    it('빈 도메인 목록은 에러를 반환해야 함', async () => {
      const result = await executeContextSet([], {}, testDir);

      expect(result.success).toBe(false);
    });

    it('존재하지 않는 도메인은 에러를 반환해야 함', async () => {
      const result = await executeContextSet(['nonexistent'], {}, testDir);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('존재하지 않는 도메인');
      }
    });

    it('의존성 포함을 비활성화할 수 있어야 함', async () => {
      const result = await executeContextSet(['auth'], { includeDeps: false }, testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.readOnlyDomains).toEqual([]);
      }
    });
  });

  describe('executeContextShow', () => {
    it('빈 컨텍스트를 표시해야 함', async () => {
      const result = await executeContextShow(testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activeDomains).toEqual([]);
      }
    });

    it('설정된 컨텍스트를 표시해야 함', async () => {
      await executeContextSet(['auth'], {}, testDir);
      const result = await executeContextShow(testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activeDomains).toEqual(['auth']);
        expect(result.data.activeDomainInfos[0].description).toBe('인증');
      }
    });
  });

  describe('executeContextClear', () => {
    it('컨텍스트를 해제해야 함', async () => {
      await executeContextSet(['auth'], {}, testDir);
      const result = await executeContextClear(testDir);

      expect(result.success).toBe(true);

      const showResult = await executeContextShow(testDir);
      expect(showResult.success).toBe(true);
      if (showResult.success) {
        expect(showResult.data.activeDomains).toEqual([]);
      }
    });
  });

  describe('executeContextAdd', () => {
    it('컨텍스트에 도메인을 추가해야 함', async () => {
      await executeContextSet(['core'], {}, testDir);
      const result = await executeContextAdd('auth', {}, testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activeDomains).toContain('core');
        expect(result.data.activeDomains).toContain('auth');
      }
    });
  });

  describe('executeContextRemove', () => {
    it('컨텍스트에서 도메인을 제거해야 함', async () => {
      await executeContextSet(['auth', 'order'], {}, testDir);
      const result = await executeContextRemove('order', testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activeDomains).not.toContain('order');
        expect(result.data.activeDomains).toContain('auth');
      }
    });
  });

  describe('executeContextSpecs', () => {
    it('컨텍스트의 스펙 목록을 반환해야 함', async () => {
      await executeContextSet(['auth'], {}, testDir);
      const result = await executeContextSpecs({}, testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toContain('login');
        expect(result.data.active).toContain('oauth');
        expect(result.data.readOnly).toContain('utils');
        expect(result.data.readOnly).toContain('config');
      }
    });

    it('빈 컨텍스트는 빈 목록을 반환해야 함', async () => {
      const result = await executeContextSpecs({}, testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toEqual([]);
        expect(result.data.readOnly).toEqual([]);
      }
    });
  });
});
