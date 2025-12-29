/**
 * sdd domain 명령어 유닛 테스트
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import {
  executeDomainCreate,
  executeDomainList,
  executeDomainShow,
  executeDomainDelete,
  executeDomainRename,
  executeDomainGraph,
  executeDomainValidate,
  executeDomainLink,
  executeDomainUnlink,
  executeDomainDepends,
  executeDomainUpdate,
} from '../../../../src/cli/commands/domain.js';

describe('sdd domain', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-domain-test-'));

    // 기본 SDD 프로젝트 구조 생성
    await fs.mkdir(path.join(testDir, '.sdd'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.sdd', 'domains'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.sdd', 'specs'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('executeDomainCreate', () => {
    it('새 도메인을 생성해야 함', async () => {
      const result = await executeDomainCreate('auth', { description: '인증 도메인' }, testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('auth');
        expect(result.data.domainPath).toContain('auth');
      }
    });

    it('기본 설명으로 도메인을 생성해야 함', async () => {
      const result = await executeDomainCreate('core', {}, testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('core');
      }

      // domains.yml 파일 확인
      const domainsYml = await fs.readFile(path.join(testDir, '.sdd', 'domains.yml'), 'utf-8');
      expect(domainsYml).toContain('core');
      expect(domainsYml).toContain('core 도메인');
    });

    it('경로와 의존성을 포함한 도메인을 생성해야 함', async () => {
      // core 먼저 생성
      await executeDomainCreate('core', { description: '핵심' }, testDir);

      // auth 생성 (core에 의존)
      const result = await executeDomainCreate(
        'auth',
        {
          description: '인증',
          path: 'src/auth',
          dependsOn: ['core'],
        },
        testDir
      );

      expect(result.success).toBe(true);

      // domains.yml 확인
      const domainsYml = await fs.readFile(path.join(testDir, '.sdd', 'domains.yml'), 'utf-8');
      expect(domainsYml).toContain('auth');
      expect(domainsYml).toContain('src/auth');
      expect(domainsYml).toContain('core');
    });

    it('domain.md 파일을 생성해야 함', async () => {
      await executeDomainCreate('auth', { description: '인증 도메인' }, testDir);

      const domainMdPath = path.join(testDir, '.sdd', 'domains', 'auth', 'domain.md');
      const domainMd = await fs.readFile(domainMdPath, 'utf-8');
      expect(domainMd).toContain('# 도메인: auth');
      expect(domainMd).toContain('인증 도메인');
    });

    it('이미 존재하는 도메인은 생성 실패해야 함', async () => {
      await executeDomainCreate('auth', { description: '인증' }, testDir);
      const result = await executeDomainCreate('auth', { description: '인증2' }, testDir);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('이미 존재');
      }
    });
  });

  describe('executeDomainList', () => {
    beforeEach(async () => {
      await executeDomainCreate('core', { description: '핵심' }, testDir);
      await executeDomainCreate('auth', { description: '인증', dependsOn: ['core'] }, testDir);
    });

    it('도메인 목록을 반환해야 함', async () => {
      const result = await executeDomainList({}, testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data.map((d) => d.id)).toContain('core');
        expect(result.data.map((d) => d.id)).toContain('auth');
      }
    });

    it('--orphan 옵션으로 스펙 없는 도메인만 필터링해야 함', async () => {
      const result = await executeDomainList({ orphan: true }, testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        // 모든 도메인이 스펙 없으므로 모두 반환
        expect(result.data).toHaveLength(2);
      }
    });
  });

  describe('executeDomainShow', () => {
    beforeEach(async () => {
      await executeDomainCreate('core', { description: '핵심' }, testDir);
      await executeDomainCreate('auth', { description: '인증', dependsOn: ['core'] }, testDir);
    });

    it('도메인 상세 정보를 반환해야 함', async () => {
      const result = await executeDomainShow('auth', testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('auth');
        expect(result.data.description).toBe('인증');
        expect(result.data.dependsOn).toContain('core');
      }
    });

    it('존재하지 않는 도메인은 에러 반환해야 함', async () => {
      const result = await executeDomainShow('nonexistent', testDir);

      expect(result.success).toBe(false);
    });
  });

  describe('executeDomainDelete', () => {
    beforeEach(async () => {
      await executeDomainCreate('auth', { description: '인증' }, testDir);
    });

    it('도메인을 삭제해야 함', async () => {
      const result = await executeDomainDelete('auth', {}, testDir);

      expect(result.success).toBe(true);

      // 목록에서 확인
      const listResult = await executeDomainList({}, testDir);
      expect(listResult.success).toBe(true);
      if (listResult.success) {
        expect(listResult.data.map((d) => d.id)).not.toContain('auth');
      }
    });

    it('존재하지 않는 도메인 삭제는 실패해야 함', async () => {
      const result = await executeDomainDelete('nonexistent', {}, testDir);

      expect(result.success).toBe(false);
    });
  });

  describe('executeDomainRename', () => {
    beforeEach(async () => {
      await executeDomainCreate('auth', { description: '인증' }, testDir);
    });

    it('도메인 이름을 변경해야 함', async () => {
      const result = await executeDomainRename('auth', 'authentication', testDir);

      expect(result.success).toBe(true);

      // 새 이름으로 조회 가능
      const showResult = await executeDomainShow('authentication', testDir);
      expect(showResult.success).toBe(true);

      // 기존 이름은 조회 불가
      const oldResult = await executeDomainShow('auth', testDir);
      expect(oldResult.success).toBe(false);
    });
  });

  describe('executeDomainGraph', () => {
    beforeEach(async () => {
      await executeDomainCreate('core', { description: '핵심' }, testDir);
      await executeDomainCreate('auth', { description: '인증', dependsOn: ['core'] }, testDir);
    });

    it('Mermaid 형식으로 그래프를 생성해야 함', async () => {
      const result = await executeDomainGraph({ format: 'mermaid' }, testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('graph LR');
        expect(result.data).toContain('auth');
        expect(result.data).toContain('core');
      }
    });

    it('DOT 형식으로 그래프를 생성해야 함', async () => {
      const result = await executeDomainGraph({ format: 'dot' }, testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('digraph');
        expect(result.data).toContain('auth -> core');
      }
    });

    it('JSON 형식으로 그래프를 생성해야 함', async () => {
      const result = await executeDomainGraph({ format: 'json' }, testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        const json = JSON.parse(result.data);
        expect(json.nodes).toBeDefined();
        expect(json.edges).toBeDefined();
      }
    });

    it('파일에 그래프를 저장해야 함', async () => {
      const outputPath = path.join(testDir, 'graph.md');
      const result = await executeDomainGraph({ format: 'mermaid', output: outputPath }, testDir);

      expect(result.success).toBe(true);

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('graph LR');
    });
  });

  describe('executeDomainValidate', () => {
    it('유효한 도메인 구조는 통과해야 함', async () => {
      await executeDomainCreate('core', { description: '핵심' }, testDir);
      await executeDomainCreate('auth', { description: '인증', dependsOn: ['core'] }, testDir);

      const result = await executeDomainValidate(testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it('도메인이 없으면 통과해야 함', async () => {
      const result = await executeDomainValidate(testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });
  });

  describe('executeDomainLink/Unlink', () => {
    beforeEach(async () => {
      await executeDomainCreate('auth', { description: '인증' }, testDir);
    });

    it('스펙을 도메인에 연결해야 함', async () => {
      const result = await executeDomainLink('auth', ['user-login'], testDir);

      expect(result.success).toBe(true);

      // 조회해서 확인
      const showResult = await executeDomainShow('auth', testDir);
      expect(showResult.success).toBe(true);
      if (showResult.success) {
        expect(showResult.data.specs).toContain('user-login');
      }
    });

    it('스펙 연결을 해제해야 함', async () => {
      await executeDomainLink('auth', ['user-login'], testDir);
      const result = await executeDomainUnlink('auth', ['user-login'], testDir);

      expect(result.success).toBe(true);

      // 조회해서 확인
      const showResult = await executeDomainShow('auth', testDir);
      expect(showResult.success).toBe(true);
      if (showResult.success) {
        expect(showResult.data.specs).not.toContain('user-login');
      }
    });
  });

  describe('executeDomainDepends', () => {
    beforeEach(async () => {
      await executeDomainCreate('core', { description: '핵심' }, testDir);
      await executeDomainCreate('auth', { description: '인증' }, testDir);
    });

    it('의존성을 추가해야 함', async () => {
      const result = await executeDomainDepends('auth', { on: 'core', type: 'uses' }, testDir);

      expect(result.success).toBe(true);

      // 조회해서 확인
      const showResult = await executeDomainShow('auth', testDir);
      expect(showResult.success).toBe(true);
      if (showResult.success) {
        expect(showResult.data.dependsOn).toContain('core');
      }
    });

    it('의존성을 제거해야 함', async () => {
      await executeDomainDepends('auth', { on: 'core', type: 'uses' }, testDir);
      const result = await executeDomainDepends('auth', { on: 'core', type: 'uses', remove: true }, testDir);

      expect(result.success).toBe(true);

      // 조회해서 확인
      const showResult = await executeDomainShow('auth', testDir);
      expect(showResult.success).toBe(true);
      if (showResult.success) {
        expect(showResult.data.dependsOn).not.toContain('core');
      }
    });

    it('--on 옵션 없이 실행하면 실패해야 함', async () => {
      const result = await executeDomainDepends('auth', {}, testDir);

      expect(result.success).toBe(false);
    });
  });

  describe('executeDomainUpdate', () => {
    beforeEach(async () => {
      await executeDomainCreate('auth', { description: '인증' }, testDir);
    });

    it('도메인 설명을 업데이트해야 함', async () => {
      const result = await executeDomainUpdate('auth', { description: '인증 및 인가' }, testDir);

      expect(result.success).toBe(true);

      // 조회해서 확인
      const showResult = await executeDomainShow('auth', testDir);
      expect(showResult.success).toBe(true);
      if (showResult.success) {
        expect(showResult.data.description).toBe('인증 및 인가');
      }
    });

    it('도메인 경로를 업데이트해야 함', async () => {
      const result = await executeDomainUpdate('auth', { path: 'src/authentication' }, testDir);

      expect(result.success).toBe(true);

      // 조회해서 확인
      const showResult = await executeDomainShow('auth', testDir);
      expect(showResult.success).toBe(true);
      if (showResult.success) {
        expect(showResult.data.path).toBe('src/authentication');
      }
    });

    it('존재하지 않는 도메인 업데이트는 실패해야 함', async () => {
      const result = await executeDomainUpdate('nonexistent', { description: '테스트' }, testDir);

      expect(result.success).toBe(false);
    });
  });
});
