/**
 * 스펙 위치 탐색기 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  listSpecs,
  resolveDomainSpecRef,
  resolveSpec,
  resolveSpecIn,
  resolveSpecRef,
} from '../../../../src/core/spec/locator.js';

describe('spec locator', () => {
  let tempDir: string;
  let sddPath: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-locator-'));
    sddPath = path.join(tempDir, '.sdd');
    specsDir = path.join(sddPath, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function writeSpec(relDir: string, extraFiles: string[] = []): Promise<void> {
    const dir = path.join(specsDir, relDir);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'spec.md'), `# ${relDir}\n`);
    for (const file of extraFiles) {
      await fs.writeFile(path.join(dir, file), `# ${file}\n`);
    }
  }

  describe('listSpecs', () => {
    it('specs 디렉토리가 없으면 빈 배열을 반환한다', async () => {
      await fs.rm(specsDir, { recursive: true });
      expect(await listSpecs(sddPath)).toEqual([]);
    });

    it('레거시 평면 레이아웃을 탐색한다', async () => {
      await writeSpec('login');

      const specs = await listSpecs(sddPath);

      expect(specs).toEqual([
        {
          id: 'login',
          domain: null,
          feature: 'login',
          dir: path.join(specsDir, 'login'),
          specPath: path.join(specsDir, 'login', 'spec.md'),
        },
      ]);
    });

    it('도메인 레이아웃을 canonical id로 탐색한다', async () => {
      await writeSpec('auth/login');

      const specs = await listSpecs(sddPath);

      expect(specs).toEqual([
        {
          id: 'auth/login',
          domain: 'auth',
          feature: 'login',
          dir: path.join(specsDir, 'auth', 'login'),
          specPath: path.join(specsDir, 'auth', 'login', 'spec.md'),
        },
      ]);
    });

    it('혼합 레이아웃을 결정적 순서로 반환한다', async () => {
      await writeSpec('common/signup');
      await writeSpec('legacy');
      await writeSpec('auth/login');
      await writeSpec('auth/logout');

      const ids = (await listSpecs(sddPath)).map((s) => s.id);

      expect(ids).toEqual(['auth/login', 'auth/logout', 'common/signup', 'legacy']);
    });

    it('spec.md만 스펙으로 인정하고 plan/tasks/checklist/prepare는 무시한다', async () => {
      await writeSpec('auth/login', ['plan.md', 'tasks.md', 'checklist.md', 'prepare.md']);
      // spec.md 없이 보조 문서만 있는 디렉토리는 스펙이 아님
      await fs.mkdir(path.join(specsDir, 'auth', 'draft'), { recursive: true });
      await fs.writeFile(path.join(specsDir, 'auth', 'draft', 'plan.md'), '# plan');

      const ids = (await listSpecs(sddPath)).map((s) => s.id);

      expect(ids).toEqual(['auth/login']);
    });

    it('점(.)으로 시작하는 디렉토리는 무시한다', async () => {
      await writeSpec('.hidden');
      await writeSpec('.cache/login');
      await writeSpec('auth/.draft');
      await writeSpec('auth/login');

      const ids = (await listSpecs(sddPath)).map((s) => s.id);

      expect(ids).toEqual(['auth/login']);
    });

    it('최상위 spec.md가 있는 디렉토리의 하위 스펙도 함께 탐색한다', async () => {
      await writeSpec('auth');
      await writeSpec('auth/login');

      const specs = await listSpecs(sddPath);

      expect(specs.map((s) => [s.id, s.domain, s.feature])).toEqual([
        ['auth', null, 'auth'],
        ['auth/login', 'auth', 'login'],
      ]);
    });

    it('디렉토리를 가리키는 심볼릭 링크(스펙/도메인)를 따라간다', async () => {
      const external = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-locator-ext-'));
      try {
        await fs.mkdir(path.join(external, 'billing', 'invoice'), { recursive: true });
        await fs.writeFile(path.join(external, 'billing', 'invoice', 'spec.md'), '# invoice');
        await fs.mkdir(path.join(external, 'shared'), { recursive: true });
        await fs.writeFile(path.join(external, 'shared', 'spec.md'), '# shared');

        await fs.symlink(path.join(external, 'billing'), path.join(specsDir, 'billing'), 'dir');
        await fs.mkdir(path.join(specsDir, 'auth'), { recursive: true });
        await fs.symlink(path.join(external, 'shared'), path.join(specsDir, 'auth', 'shared'), 'dir');

        const ids = (await listSpecs(sddPath)).map((s) => s.id);

        expect(ids).toEqual(['auth/shared', 'billing/invoice']);
      } finally {
        await fs.rm(external, { recursive: true, force: true });
      }
    });

    it('순환/별칭 심볼릭 링크는 한 번만 집계하고 깨진 링크는 무시한다', async () => {
      await writeSpec('auth/login');
      // alias to an already-listed spec, a link back to the specs root, and a broken link
      await fs.mkdir(path.join(specsDir, 'common'), { recursive: true });
      await fs.symlink(path.join(specsDir, 'auth', 'login'), path.join(specsDir, 'common', 'login'), 'dir');
      await fs.symlink(specsDir, path.join(specsDir, 'auth', 'loop'), 'dir');
      await fs.symlink(path.join(tempDir, 'missing'), path.join(specsDir, 'broken'), 'dir');

      const ids = (await listSpecs(sddPath)).map((s) => s.id);

      expect(ids).toEqual(['auth/login']);
    });

    it('별칭 링크가 정렬상 앞서도 실제 경로의 id를 유지한다', async () => {
      await writeSpec('auth/login');
      await fs.symlink(path.join(specsDir, 'auth'), path.join(specsDir, 'aalias'), 'dir');

      const ids = (await listSpecs(sddPath)).map((s) => s.id);

      expect(ids).toEqual(['auth/login']);
    });
  });

  describe('resolveSpec', () => {
    beforeEach(async () => {
      await writeSpec('auth/login');
      await writeSpec('auth/core');
      await writeSpec('billing/core');
      await writeSpec('legacy');
    });

    it('canonical id를 해석한다', async () => {
      const result = await resolveSpec(sddPath, 'auth/login');
      expect(result.success && result.data.id).toBe('auth/login');
    });

    it('유일한 bare feature를 해석한다', async () => {
      const result = await resolveSpec(sddPath, 'login');
      expect(result.success && result.data.id).toBe('auth/login');
    });

    it('레거시 평면 id를 해석한다', async () => {
      const result = await resolveSpec(sddPath, 'legacy');
      expect(result.success && result.data.domain).toBe(null);
    });

    it('모호한 bare feature는 후보 목록과 함께 실패한다', async () => {
      const result = await resolveSpec(sddPath, 'core');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.reason).toBe('ambiguous');
        expect(result.error.candidates).toEqual(['auth/core', 'billing/core']);
        expect(result.error.message).toContain('여러 도메인');
        expect(result.error.message).toContain('auth/core, billing/core');
      }
    });

    it('없는 스펙은 not_found로 실패한다', async () => {
      const result = await resolveSpec(sddPath, 'nope');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.reason).toBe('not_found');
        expect(result.error.message).toContain('스펙을 찾을 수 없습니다');
      }
    });

    it('존재하지 않는 domain/feature는 bare로 재해석하지 않는다', async () => {
      const result = await resolveSpec(sddPath, 'billing/login');
      expect(result.success).toBe(false);
    });

    it('resolveSpecIn은 조회된 목록에서 같은 규칙으로 해석한다', async () => {
      const all = await listSpecs(sddPath);

      const login = resolveSpecIn(all, 'login');
      expect(login.success && login.data.dir).toBe(path.join(specsDir, 'auth', 'login'));

      const core = resolveSpecIn(all, 'core');
      expect(!core.success && core.error.reason).toBe('ambiguous');
    });
  });

  describe('resolveDomainSpecRef', () => {
    it('도메인 범위의 bare 참조는 레거시 평면 스펙보다 <domain>/<feature>를 우선한다', async () => {
      await writeSpec('login');
      await writeSpec('auth/login');
      const all = await listSpecs(sddPath);

      expect(resolveDomainSpecRef(all, 'auth', 'login')?.id).toBe('auth/login');
      expect(resolveDomainSpecRef(all, 'billing', 'login')?.id).toBe('login');
      expect(resolveDomainSpecRef(all, 'billing', 'auth/login')?.id).toBe('auth/login');
    });
  });

  describe('resolveSpecRef', () => {
    it('canonical id → 같은 도메인 → 유일한 bare feature 순으로 해석한다', async () => {
      await writeSpec('auth/core');
      await writeSpec('billing/core');
      await writeSpec('auth/login');
      const all = await listSpecs(sddPath);

      expect(resolveSpecRef(all, 'billing/core', 'auth')?.id).toBe('billing/core');
      expect(resolveSpecRef(all, 'core', 'auth')?.id).toBe('auth/core');
      expect(resolveSpecRef(all, 'core', 'billing')?.id).toBe('billing/core');
      expect(resolveSpecRef(all, 'core')).toBeUndefined();
      expect(resolveSpecRef(all, 'login', 'billing')?.id).toBe('auth/login');
      expect(resolveSpecRef(all, 'missing', 'auth')).toBeUndefined();
    });
  });
});
