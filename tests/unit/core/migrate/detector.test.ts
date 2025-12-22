/**
 * 마이그레이션 감지기 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  detectExternalTools,
  migrateFromOpenSpec,
  migrateFromSpecKit,
} from '../../../../src/core/migrate/detector.js';

describe('detectExternalTools', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-migrate-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('빈 디렉토리에서 빈 결과를 반환한다', async () => {
    const result = await detectExternalTools(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  describe('OpenSpec 감지', () => {
    it('openspec 디렉토리를 감지한다', async () => {
      // OpenSpec 구조 생성
      const openspecPath = path.join(tempDir, 'openspec');
      await fs.mkdir(path.join(openspecPath, 'specs', 'auth'), { recursive: true });
      await fs.writeFile(
        path.join(openspecPath, 'specs', 'auth', 'spec.md'),
        `---
title: "인증 스펙"
status: draft
---

# 인증 스펙

인증 기능 명세
`
      );

      const result = await detectExternalTools(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeGreaterThan(0);
        const openspec = result.data.find((r) => r.tool === 'openspec');
        expect(openspec).toBeDefined();
        expect(openspec!.specCount).toBe(1);
        expect(openspec!.specs[0].id).toBe('auth');
      }
    });

    it('AGENTS.md가 있으면 높은 신뢰도로 감지한다', async () => {
      const openspecPath = path.join(tempDir, 'openspec');
      await fs.mkdir(openspecPath, { recursive: true });
      await fs.writeFile(path.join(openspecPath, 'AGENTS.md'), '# Agents Guide');

      const result = await detectExternalTools(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        const openspec = result.data.find((r) => r.tool === 'openspec');
        expect(openspec).toBeDefined();
        expect(openspec!.confidence).toBe('high');
      }
    });

    it('specs와 changes가 있으면 중간 신뢰도로 감지한다', async () => {
      const openspecPath = path.join(tempDir, 'openspec');
      await fs.mkdir(path.join(openspecPath, 'specs'), { recursive: true });
      await fs.mkdir(path.join(openspecPath, 'changes'), { recursive: true });

      const result = await detectExternalTools(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        const openspec = result.data.find((r) => r.tool === 'openspec');
        expect(openspec).toBeDefined();
        expect(openspec!.confidence).toBe('medium');
      }
    });
  });

  describe('Spec Kit 감지', () => {
    it('.specify 디렉토리를 감지한다', async () => {
      // Spec Kit 구조 생성
      const specifyPath = path.join(tempDir, '.specify');
      await fs.mkdir(path.join(specifyPath, 'specs', 'login'), { recursive: true });
      await fs.writeFile(
        path.join(specifyPath, 'specs', 'login', 'spec.md'),
        `---
title: "로그인 스펙"
status: draft
---

# 로그인 스펙

로그인 기능 명세
`
      );

      const result = await detectExternalTools(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        const speckit = result.data.find((r) => r.tool === 'speckit');
        expect(speckit).toBeDefined();
        expect(speckit!.specCount).toBe(1);
        expect(speckit!.specs[0].id).toBe('login');
      }
    });

    it('constitution.md가 있으면 높은 신뢰도로 감지한다', async () => {
      const specifyPath = path.join(tempDir, '.specify');
      await fs.mkdir(path.join(specifyPath, 'specs'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'memory'), { recursive: true });
      await fs.writeFile(path.join(tempDir, 'memory', 'constitution.md'), '# Constitution');

      const result = await detectExternalTools(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        const speckit = result.data.find((r) => r.tool === 'speckit');
        expect(speckit).toBeDefined();
        expect(speckit!.confidence).toBe('high');
      }
    });

    it('tasks.md가 있으면 status를 in-progress로 설정한다', async () => {
      const specifyPath = path.join(tempDir, '.specify');
      const specPath = path.join(specifyPath, 'specs', 'feature');
      await fs.mkdir(specPath, { recursive: true });
      await fs.writeFile(
        path.join(specPath, 'spec.md'),
        `---
title: "기능 스펙"
status: draft
---

# 기능 스펙
`
      );
      await fs.writeFile(path.join(specPath, 'tasks.md'), '# Tasks');

      const result = await detectExternalTools(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        const speckit = result.data.find((r) => r.tool === 'speckit');
        expect(speckit).toBeDefined();
        expect(speckit!.specs[0].status).toBe('in-progress');
      }
    });
  });

  describe('SDD 감지', () => {
    it('.sdd 디렉토리를 감지한다', async () => {
      // SDD 구조 생성
      const sddPath = path.join(tempDir, '.sdd');
      await fs.mkdir(path.join(sddPath, 'specs', 'payment'), { recursive: true });
      await fs.writeFile(
        path.join(sddPath, 'specs', 'payment', 'spec.md'),
        `---
title: "결제 스펙"
status: draft
---

# 결제 스펙

결제 기능 명세
`
      );

      const result = await detectExternalTools(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        const sdd = result.data.find((r) => r.tool === 'sdd');
        expect(sdd).toBeDefined();
        expect(sdd!.specCount).toBe(1);
        expect(sdd!.specs[0].id).toBe('payment');
      }
    });

    it('config.yaml이 있으면 높은 신뢰도로 감지한다', async () => {
      const sddPath = path.join(tempDir, '.sdd');
      await fs.mkdir(path.join(sddPath, 'specs'), { recursive: true });
      await fs.writeFile(path.join(sddPath, 'config.yaml'), 'version: 1.0');

      const result = await detectExternalTools(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        const sdd = result.data.find((r) => r.tool === 'sdd');
        expect(sdd).toBeDefined();
        expect(sdd!.confidence).toBe('high');
      }
    });
  });

  it('여러 도구를 동시에 감지한다', async () => {
    // OpenSpec
    await fs.mkdir(path.join(tempDir, 'openspec', 'specs'), { recursive: true });

    // Spec Kit
    await fs.mkdir(path.join(tempDir, '.specify', 'specs'), { recursive: true });

    // SDD
    await fs.mkdir(path.join(tempDir, '.sdd', 'specs'), { recursive: true });

    const result = await detectExternalTools(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(3);
      expect(result.data.map((r) => r.tool).sort()).toEqual(['openspec', 'sdd', 'speckit']);
    }
  });
});

describe('migrateFromOpenSpec', () => {
  let tempDir: string;
  let sourcePath: string;
  let targetPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-migrate-openspec-'));
    sourcePath = path.join(tempDir, 'openspec');
    targetPath = path.join(tempDir, '.sdd');

    // OpenSpec 소스 구조 생성
    await fs.mkdir(path.join(sourcePath, 'specs', 'auth'), { recursive: true });
    await fs.writeFile(
      path.join(sourcePath, 'specs', 'auth', 'spec.md'),
      `---
title: "인증 스펙"
status: approved
---

# 인증 스펙

사용자 인증 기능 명세
`
    );

    // 대상 디렉토리 생성
    await fs.mkdir(path.join(targetPath, 'specs'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('스펙 디렉토리가 없으면 에러를 반환한다', async () => {
    const emptyPath = path.join(tempDir, 'empty');
    await fs.mkdir(emptyPath, { recursive: true });

    const result = await migrateFromOpenSpec(emptyPath, targetPath);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('specs 디렉토리');
    }
  });

  it('스펙을 마이그레이션한다', async () => {
    const result = await migrateFromOpenSpec(sourcePath, targetPath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe('openspec');
      expect(result.data.specsCreated).toBe(1);
      expect(result.data.specsSkipped).toBe(0);

      // 파일이 생성되었는지 확인
      const specPath = path.join(targetPath, 'specs', 'auth', 'spec.md');
      const content = await fs.readFile(specPath, 'utf-8');
      expect(content).toContain('phase: migrated');
      expect(content).toContain('source: openspec');
    }
  });

  it('dryRun 모드에서 파일을 생성하지 않는다', async () => {
    const result = await migrateFromOpenSpec(sourcePath, targetPath, { dryRun: true });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.specsCreated).toBe(1);

      // 파일이 생성되지 않았는지 확인
      const specPath = path.join(targetPath, 'specs', 'auth', 'spec.md');
      await expect(fs.stat(specPath)).rejects.toThrow();
    }
  });

  it('이미 존재하는 스펙은 스킵한다', async () => {
    // 대상에 이미 스펙 존재
    await fs.mkdir(path.join(targetPath, 'specs', 'auth'), { recursive: true });
    await fs.writeFile(
      path.join(targetPath, 'specs', 'auth', 'spec.md'),
      'existing content'
    );

    const result = await migrateFromOpenSpec(sourcePath, targetPath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.specsSkipped).toBe(1);
      expect(result.data.specsCreated).toBe(0);
    }
  });

  it('overwrite 옵션으로 기존 스펙을 덮어쓴다', async () => {
    // 대상에 이미 스펙 존재
    await fs.mkdir(path.join(targetPath, 'specs', 'auth'), { recursive: true });
    await fs.writeFile(
      path.join(targetPath, 'specs', 'auth', 'spec.md'),
      'existing content'
    );

    const result = await migrateFromOpenSpec(sourcePath, targetPath, { overwrite: true });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.specsCreated).toBe(1);

      // 파일이 덮어쓰기되었는지 확인
      const specPath = path.join(targetPath, 'specs', 'auth', 'spec.md');
      const content = await fs.readFile(specPath, 'utf-8');
      expect(content).toContain('source: openspec');
    }
  });

  it('frontmatter가 없는 스펙도 변환한다', async () => {
    // frontmatter 없는 스펙 생성
    await fs.mkdir(path.join(sourcePath, 'specs', 'no-fm'), { recursive: true });
    await fs.writeFile(
      path.join(sourcePath, 'specs', 'no-fm', 'spec.md'),
      `# No Frontmatter Spec

This spec has no frontmatter.
`
    );

    const result = await migrateFromOpenSpec(sourcePath, targetPath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.specsCreated).toBe(2);

      // 변환된 파일 확인
      const specPath = path.join(targetPath, 'specs', 'no-fm', 'spec.md');
      const content = await fs.readFile(specPath, 'utf-8');
      expect(content).toContain('---');
      expect(content).toContain('id: no-fm');
      expect(content).toContain('source: openspec');
    }
  });
});

describe('migrateFromSpecKit', () => {
  let tempDir: string;
  let sourcePath: string;
  let targetPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-migrate-speckit-'));
    sourcePath = path.join(tempDir, '.specify');
    targetPath = path.join(tempDir, '.sdd');

    // Spec Kit 소스 구조 생성
    await fs.mkdir(path.join(sourcePath, 'specs', 'login'), { recursive: true });
    await fs.writeFile(
      path.join(sourcePath, 'specs', 'login', 'spec.md'),
      `---
title: "로그인 스펙"
status: draft
---

# 로그인 스펙

사용자 로그인 기능 명세
`
    );

    // 대상 디렉토리 생성
    await fs.mkdir(path.join(targetPath, 'specs'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('스펙 디렉토리가 없으면 에러를 반환한다', async () => {
    const emptyPath = path.join(tempDir, 'empty');
    await fs.mkdir(emptyPath, { recursive: true });

    const result = await migrateFromSpecKit(emptyPath, targetPath);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('specs 디렉토리');
    }
  });

  it('스펙을 마이그레이션한다', async () => {
    const result = await migrateFromSpecKit(sourcePath, targetPath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe('speckit');
      expect(result.data.specsCreated).toBe(1);
      expect(result.data.specsSkipped).toBe(0);

      // 파일이 생성되었는지 확인
      const specPath = path.join(targetPath, 'specs', 'login', 'spec.md');
      const content = await fs.readFile(specPath, 'utf-8');
      expect(content).toContain('phase: migrated');
      expect(content).toContain('source: speckit');
    }
  });

  it('dryRun 모드에서 파일을 생성하지 않는다', async () => {
    const result = await migrateFromSpecKit(sourcePath, targetPath, { dryRun: true });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.specsCreated).toBe(1);

      // 파일이 생성되지 않았는지 확인
      const specPath = path.join(targetPath, 'specs', 'login', 'spec.md');
      await expect(fs.stat(specPath)).rejects.toThrow();
    }
  });

  it('plan.md만 있는 경우에도 감지한다', async () => {
    await fs.mkdir(path.join(sourcePath, 'specs', 'plan-only'), { recursive: true });
    await fs.writeFile(
      path.join(sourcePath, 'specs', 'plan-only', 'plan.md'),
      '# Plan\n\nImplementation plan'
    );

    const result = await migrateFromSpecKit(sourcePath, targetPath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.specsCreated).toBe(2);
    }
  });

  it('frontmatter가 없는 스펙도 변환한다', async () => {
    await fs.mkdir(path.join(sourcePath, 'specs', 'no-fm'), { recursive: true });
    await fs.writeFile(
      path.join(sourcePath, 'specs', 'no-fm', 'spec.md'),
      `# No Frontmatter Spec

This spec has no frontmatter.
`
    );

    const result = await migrateFromSpecKit(sourcePath, targetPath);

    expect(result.success).toBe(true);
    if (result.success) {
      const specPath = path.join(targetPath, 'specs', 'no-fm', 'spec.md');
      const content = await fs.readFile(specPath, 'utf-8');
      expect(content).toContain('---');
      expect(content).toContain('id: no-fm');
      expect(content).toContain('source: speckit');
    }
  });
});
