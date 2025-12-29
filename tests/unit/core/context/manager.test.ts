/**
 * 컨텍스트 매니저 유닛 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { ContextManager, createContextManager } from '../../../../src/core/context/manager.js';
import { executeDomainCreate } from '../../../../src/cli/commands/domain.js';

describe('ContextManager', () => {
  let testDir: string;
  let manager: ContextManager;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-context-manager-'));
    manager = createContextManager(testDir);

    // SDD 프로젝트 구조 생성
    await fs.mkdir(path.join(testDir, '.sdd'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.sdd', 'domains'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.sdd', 'specs'), { recursive: true });

    // 테스트용 도메인 생성
    await executeDomainCreate('core', { description: '핵심' }, testDir);
    await executeDomainCreate('auth', { description: '인증', dependsOn: ['core'] }, testDir);
    await executeDomainCreate('order', { description: '주문', dependsOn: ['core', 'auth'] }, testDir);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('get', () => {
    it('초기 상태에서 빈 컨텍스트를 반환해야 함', async () => {
      const result = await manager.get();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activeDomains).toEqual([]);
        expect(result.data.readOnlyDomains).toEqual([]);
        expect(result.data.totalSpecs).toBe(0);
      }
    });
  });

  describe('set', () => {
    it('컨텍스트를 설정해야 함', async () => {
      const result = await manager.set(['auth']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activeDomains).toEqual(['auth']);
        expect(result.data.readOnlyDomains).toContain('core'); // 의존성 자동 포함
      }
    });

    it('여러 도메인을 설정해야 함', async () => {
      const result = await manager.set(['auth', 'order']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activeDomains).toContain('auth');
        expect(result.data.activeDomains).toContain('order');
        expect(result.data.readOnlyDomains).toContain('core');
      }
    });

    it('존재하지 않는 도메인은 에러를 반환해야 함', async () => {
      const result = await manager.set(['nonexistent']);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('존재하지 않는 도메인');
      }
    });

    it('의존성 포함을 비활성화할 수 있어야 함', async () => {
      const result = await manager.set(['auth'], { includeDependencies: false });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activeDomains).toEqual(['auth']);
        expect(result.data.readOnlyDomains).toEqual([]);
      }
    });
  });

  describe('addDomain', () => {
    it('컨텍스트에 도메인을 추가해야 함', async () => {
      await manager.set(['core']);
      const result = await manager.addDomain('auth');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activeDomains).toContain('core');
        expect(result.data.activeDomains).toContain('auth');
      }
    });

    it('이미 있는 도메인 추가 시 변경 없어야 함', async () => {
      await manager.set(['auth']);
      const result = await manager.addDomain('auth');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activeDomains.filter((d) => d === 'auth')).toHaveLength(1);
      }
    });
  });

  describe('removeDomain', () => {
    it('컨텍스트에서 도메인을 제거해야 함', async () => {
      await manager.set(['auth', 'order']);
      const result = await manager.removeDomain('order');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.activeDomains).toContain('auth');
        expect(result.data.activeDomains).not.toContain('order');
      }
    });
  });

  describe('clear', () => {
    it('컨텍스트를 초기화해야 함', async () => {
      await manager.set(['auth']);
      const result = await manager.clear();

      expect(result.success).toBe(true);

      const getResult = await manager.get();
      expect(getResult.success).toBe(true);
      if (getResult.success) {
        expect(getResult.data.activeDomains).toEqual([]);
      }
    });
  });

  describe('isActive', () => {
    it('컨텍스트가 없으면 false를 반환해야 함', async () => {
      const result = await manager.isActive();
      expect(result).toBe(false);
    });

    it('컨텍스트가 있으면 true를 반환해야 함', async () => {
      await manager.set(['auth']);
      const result = await manager.isActive();
      expect(result).toBe(true);
    });
  });

  describe('isDomainInContext', () => {
    it('활성 도메인은 true를 반환해야 함', async () => {
      await manager.set(['auth']);
      const result = await manager.isDomainInContext('auth');
      expect(result).toBe(true);
    });

    it('읽기 전용 도메인도 true를 반환해야 함', async () => {
      await manager.set(['auth']);
      const result = await manager.isDomainInContext('core');
      expect(result).toBe(true);
    });

    it('컨텍스트에 없는 도메인은 false를 반환해야 함', async () => {
      await manager.set(['auth']);
      const result = await manager.isDomainInContext('order');
      expect(result).toBe(false);
    });
  });

  describe('isDomainActive', () => {
    it('활성 도메인은 true를 반환해야 함', async () => {
      await manager.set(['auth']);
      const result = await manager.isDomainActive('auth');
      expect(result).toBe(true);
    });

    it('읽기 전용 도메인은 false를 반환해야 함', async () => {
      await manager.set(['auth']);
      const result = await manager.isDomainActive('core');
      expect(result).toBe(false);
    });
  });

  describe('filterSpecs', () => {
    it('컨텍스트가 없으면 모든 스펙을 반환해야 함', async () => {
      const specs = [{ id: 'spec1', domain: 'auth' }, { id: 'spec2', domain: 'core' }];
      const result = await manager.filterSpecs(specs);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active).toHaveLength(2);
        expect(result.data.readOnly).toHaveLength(0);
      }
    });

    it('컨텍스트에 따라 스펙을 필터링해야 함', async () => {
      await manager.set(['auth']);

      const specs = [
        { id: 'spec1', domain: 'auth' },
        { id: 'spec2', domain: 'core' },
        { id: 'spec3', domain: 'order' },
      ];
      const result = await manager.filterSpecs(specs);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.active.map((s) => s.id)).toEqual(['spec1']);
        expect(result.data.readOnly.map((s) => s.id)).toEqual(['spec2']);
      }
    });
  });
});
