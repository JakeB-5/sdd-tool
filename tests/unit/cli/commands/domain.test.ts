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

    describe('연결된 스펙이 있는 경우', () => {
      const specPath = (): string => path.join(testDir, '.sdd', 'specs', 'auth', 'login', 'spec.md');

      beforeEach(async () => {
        await fs.mkdir(path.dirname(specPath()), { recursive: true });
        await fs.writeFile(
          specPath(),
          '---\nid: login\ntitle: 로그인\nstatus: draft\ndomain: auth\n---\n\n# 로그인\n'
        );
        await executeDomainLink('auth', ['login'], testDir);
      });

      it('옵션 없이는 삭제를 거부해야 함', async () => {
        const result = await executeDomainDelete('auth', {}, testDir);
        expect(result.success).toBe(false);
      });

      it('--force만으로 삭제되어야 함 (스펙 파일은 유지)', async () => {
        const result = await executeDomainDelete('auth', { force: true }, testDir);
        expect(result.success).toBe(true);

        const listResult = await executeDomainList({}, testDir);
        expect(listResult.success && listResult.data.map((d) => d.id)).not.toContain('auth');
        // --force does not touch spec frontmatter
        expect(await fs.readFile(specPath(), 'utf-8')).toContain('domain: auth');
      });

      it('--unlink-specs는 스펙 frontmatter의 domain 필드를 제거해야 함', async () => {
        const result = await executeDomainDelete('auth', { unlinkSpecs: true }, testDir);
        expect(result.success).toBe(true);

        const content = await fs.readFile(specPath(), 'utf-8');
        expect(content).not.toMatch(/^domain:/m);
        expect(content).toContain('title: 로그인');
        expect(content).toContain('# 로그인');
      });

      it('--unlink-specs는 domain 키만 지우고 주석·목록 서식은 유지해야 함', async () => {
        const original =
          '---\nid: login\n# owner comment\ntags: [a, b]\ndomain: auth\ndepends:\n  - core\n---\n\n# 로그인\n';
        await fs.writeFile(specPath(), original);

        const result = await executeDomainDelete('auth', { unlinkSpecs: true }, testDir);
        expect(result.success).toBe(true);

        expect(await fs.readFile(specPath(), 'utf-8')).toBe(
          '---\nid: login\n# owner comment\ntags: [a, b]\ndepends:\n  - core\n---\n\n# 로그인\n'
        );
      });

      it('domains.yml 저장 실패 시 스펙 수정을 되돌려야 함', async () => {
        const original = await fs.readFile(specPath(), 'utf-8');
        const configPath = path.join(testDir, '.sdd', 'domains.yml');
        await fs.chmod(configPath, 0o444);

        try {
          const result = await executeDomainDelete('auth', { unlinkSpecs: true }, testDir);
          expect(result.success).toBe(false);
          expect(await fs.readFile(specPath(), 'utf-8')).toBe(original);
        } finally {
          await fs.chmod(configPath, 0o644);
        }
      });
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

    it('스펙 폴더를 이동하고 스펙의 domain 필드를 갱신해야 함', async () => {
      const oldSpec = path.join(testDir, '.sdd', 'specs', 'auth', 'login', 'spec.md');
      await fs.mkdir(path.dirname(oldSpec), { recursive: true });
      await fs.writeFile(oldSpec, '---\nid: login\n# keep comment\ndomain: auth\n---\n\n# 로그인\n');

      const result = await executeDomainRename('auth', 'identity', testDir);
      expect(result.success).toBe(true);

      const newSpec = path.join(testDir, '.sdd', 'specs', 'identity', 'login', 'spec.md');
      const content = await fs.readFile(newSpec, 'utf-8');
      expect(content).toContain('domain: identity');
      expect(content).toContain('# keep comment');
      await expect(fs.access(path.join(testDir, '.sdd', 'specs', 'auth'))).rejects.toThrow();
    });

    it('다른 스펙의 depends와 변경 제안 target의 <old>/... 참조를 갱신하고 개수를 보고해야 함', async () => {
      const specsDir = path.join(testDir, '.sdd', 'specs');
      await fs.mkdir(path.join(specsDir, 'auth', 'login'), { recursive: true });
      await fs.writeFile(path.join(specsDir, 'auth', 'login', 'spec.md'), '---\nid: login\ndomain: auth\n---\n');
      await fs.mkdir(path.join(specsDir, 'billing', 'pay'), { recursive: true });
      await fs.writeFile(
        path.join(specsDir, 'billing', 'pay', 'spec.md'),
        '---\nid: pay\n# keep\ndepends:\n  - auth/login\n  - billing/cart\n---\n# 결제\n'
      );
      await fs.mkdir(path.join(specsDir, 'billing', 'cart'), { recursive: true });
      await fs.writeFile(path.join(specsDir, 'billing', 'cart', 'spec.md'), '---\nid: cart\ndepends: auth/login, core\n---\n');
      const changeDir = path.join(testDir, '.sdd', 'changes', 'CHG-001');
      await fs.mkdir(changeDir, { recursive: true });
      await fs.writeFile(
        path.join(changeDir, 'proposal.md'),
        '---\nid: CHG-001\nstatus: draft\ncreated: 2025-01-01\ntarget: auth/login\n---\n# 제안\n'
      );

      const result = await executeDomainRename('auth', 'identity', testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ specDomainFields: 1, references: 3 });
      }
      const pay = await fs.readFile(path.join(specsDir, 'billing', 'pay', 'spec.md'), 'utf-8');
      expect(pay).toContain('- identity/login');
      expect(pay).toContain('- billing/cart');
      expect(pay).toContain('# keep');
      const cart = await fs.readFile(path.join(specsDir, 'billing', 'cart', 'spec.md'), 'utf-8');
      expect(cart).toContain('depends: identity/login, core');
      expect(await fs.readFile(path.join(changeDir, 'proposal.md'), 'utf-8')).toContain('target: identity/login');
    });

    it('domains.yml 저장 실패 시 스펙 폴더 이동과 참조 수정을 되돌려야 함', async () => {
      const specsDir = path.join(testDir, '.sdd', 'specs');
      const loginSpec = path.join(specsDir, 'auth', 'login', 'spec.md');
      await fs.mkdir(path.dirname(loginSpec), { recursive: true });
      await fs.writeFile(loginSpec, '---\nid: login\ndomain: auth\n---\n');
      const configPath = path.join(testDir, '.sdd', 'domains.yml');
      await fs.chmod(configPath, 0o444);

      try {
        const result = await executeDomainRename('auth', 'identity', testDir);
        expect(result.success).toBe(false);
        expect(await fs.readFile(loginSpec, 'utf-8')).toContain('domain: auth');
        await expect(fs.access(path.join(specsDir, 'identity'))).rejects.toThrow();
      } finally {
        await fs.chmod(configPath, 0o644);
      }
    });

    it('대상 스펙 폴더가 이미 있으면 거부하고 아무것도 바꾸지 않아야 함', async () => {
      await fs.mkdir(path.join(testDir, '.sdd', 'specs', 'auth', 'login'), { recursive: true });
      await fs.writeFile(path.join(testDir, '.sdd', 'specs', 'auth', 'login', 'spec.md'), '---\nid: login\n---\n');
      await fs.mkdir(path.join(testDir, '.sdd', 'specs', 'identity'), { recursive: true });

      const result = await executeDomainRename('auth', 'identity', testDir);
      expect(result.success).toBe(false);

      // domains.yml unchanged and spec folder still in place
      expect((await executeDomainShow('auth', testDir)).success).toBe(true);
      await expect(
        fs.access(path.join(testDir, '.sdd', 'specs', 'auth', 'login', 'spec.md'))
      ).resolves.toBeUndefined();
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
        expect(result.data).toContain('"auth" -> "core"');
      }
    });

    it('DOT 형식에서 --direction을 반영해야 함 (TD → rankdir=TB)', async () => {
      const result = await executeDomainGraph({ format: 'dot', direction: 'TD' }, testDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('rankdir=TB;');
        expect(result.data).not.toContain('rankdir=LR;');
      }
    });

    it('지원하지 않는 방향은 실패해야 함', async () => {
      const result = await executeDomainGraph(
        { format: 'dot', direction: 'XX' as unknown as 'LR' },
        testDir
      );
      expect(result.success).toBe(false);
    });

    it('하이픈 ID와 따옴표가 있는 설명도 유효한 DOT/Mermaid를 생성해야 함', async () => {
      await executeDomainCreate('user-profile', { description: 'say "hi"', dependsOn: ['core'] }, testDir);

      const dot = await executeDomainGraph({ format: 'dot' }, testDir);
      expect(dot.success).toBe(true);
      if (dot.success) {
        expect(dot.data).toContain('"user-profile" [label="user-profile\\nsay \\"hi\\""];');
        expect(dot.data).toContain('"user-profile" -> "core";');
      }

      const mermaid = await executeDomainGraph({ format: 'mermaid' }, testDir);
      expect(mermaid.success).toBe(true);
      if (mermaid.success) {
        expect(mermaid.data).toContain('user_profile["say #quot;hi#quot;"]');
        expect(mermaid.data).toContain('user_profile -->|uses| core');
        expect(mermaid.data).not.toMatch(/user-profile\s*-->/);
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
