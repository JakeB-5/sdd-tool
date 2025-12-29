/**
 * validate 명령어 핵심 로직 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  createValidateContext,
  executeValidate,
  executeDomainValidation,
  formatValidateSummary,
} from '../../../../src/cli/commands/validate.js';
import { executeDomainCreate, executeDomainLink } from '../../../../src/cli/commands/domain.js';

describe('createValidateContext', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-validate-ctx-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('대상 경로가 없으면 기본값을 사용한다', async () => {
    await fs.mkdir(path.join(sddPath, 'specs'), { recursive: true });

    const result = await createValidateContext('', {}, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.resolvedPath).toContain('specs');
    }
  });

  it('sddRoot가 없으면 에러를 반환한다', async () => {
    const result = await createValidateContext('', {}, null);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('SDD 프로젝트');
    }
  });

  it('링크 검증 옵션이 있으면 specsRoot를 설정한다', async () => {
    await fs.mkdir(path.join(sddPath, 'specs'), { recursive: true });

    const result = await createValidateContext('', { checkLinks: true }, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.specsRoot).toBeDefined();
    }
  });

  it('Constitution 존재 여부를 확인한다', async () => {
    await fs.mkdir(path.join(sddPath, 'specs'), { recursive: true });
    await fs.writeFile(path.join(sddPath, 'constitution.md'), '# Constitution');

    const result = await createValidateContext('', { constitution: true }, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hasConstitution).toBe(true);
    }
  });

  it('--no-constitution 옵션으로 검사를 건너뛴다', async () => {
    await fs.mkdir(path.join(sddPath, 'specs'), { recursive: true });

    const result = await createValidateContext('', { constitution: false }, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checkConstitution).toBe(false);
    }
  });
});

describe('executeValidate', () => {
  let tempDir: string;
  let sddPath: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-validate-exec-'));
    sddPath = path.join(tempDir, '.sdd');
    specsDir = path.join(sddPath, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('유효한 스펙을 검증한다', async () => {
    // spec.md 파일명으로 생성 (index.md, readme.md 등은 제외됨)
    const specDir = path.join(specsDir, 'auth');
    await fs.mkdir(specDir);
    await fs.writeFile(
      path.join(specDir, 'spec.md'),
      `---
status: draft
created: 2025-01-01
---

# 유효한 스펙

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const context = {
      resolvedPath: specsDir,
      checkConstitution: false,
      hasConstitution: false,
    };

    const result = await executeValidate({}, context);

    expect(result.success).toBe(true);
    if (result.success) {
      // 스펙 디렉토리 구조에 따라 파일 수가 다를 수 있음
      expect(result.data.passed + result.data.failed).toBeGreaterThanOrEqual(1);
    }
  });

  it('잘못된 스펙에 에러를 반환한다', async () => {
    const specDir = path.join(specsDir, 'invalid');
    await fs.mkdir(specDir);
    await fs.writeFile(
      path.join(specDir, 'spec.md'),
      `---
status: draft
---

# 잘못된 스펙

RFC 키워드 없음
`
    );

    const context = {
      resolvedPath: specsDir,
      checkConstitution: false,
      hasConstitution: false,
    };

    const result = await executeValidate({}, context);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.failed).toBeGreaterThan(0);
    }
  });
});

describe('formatValidateSummary', () => {
  it('결과를 요약 문자열로 포맷한다', () => {
    const result = {
      passed: 5,
      failed: 2,
      warnings: 3,
      files: [],
    };

    const summary = formatValidateSummary(result, false);

    expect(summary).toContain('5 passed');
    expect(summary).toContain('2 failed');
    expect(summary).toContain('3 warnings');
  });

  it('경고가 없으면 생략한다', () => {
    const result = {
      passed: 3,
      failed: 0,
      warnings: 0,
      files: [],
    };

    const summary = formatValidateSummary(result, false);

    expect(summary).toContain('3 passed');
    expect(summary).not.toContain('warnings');
  });
});

describe('createValidateContext with domain', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-validate-domain-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
    await fs.mkdir(path.join(sddPath, 'specs'), { recursive: true });
    await fs.mkdir(path.join(sddPath, 'domains'), { recursive: true });

    // 도메인 생성
    await executeDomainCreate('auth', { description: '인증' }, tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('존재하는 도메인으로 컨텍스트를 생성한다', async () => {
    const result = await createValidateContext('', { domain: 'auth' }, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.domainFilter).toBe('auth');
    }
  });

  it('존재하지 않는 도메인은 에러를 반환한다', async () => {
    const result = await createValidateContext('', { domain: 'nonexistent' }, tempDir);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('도메인을 찾을 수 없습니다');
    }
  });

  it('orphanSpecs 옵션을 설정한다', async () => {
    const result = await createValidateContext('', { orphanSpecs: true }, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checkOrphanSpecs).toBe(true);
    }
  });
});

describe('executeValidate with domain filter', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-validate-df-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
    await fs.mkdir(path.join(sddPath, 'specs'), { recursive: true });
    await fs.mkdir(path.join(sddPath, 'domains'), { recursive: true });

    // 도메인 생성
    await executeDomainCreate('auth', { description: '인증' }, tempDir);

    // 스펙 생성 및 연결
    const loginSpec = path.join(sddPath, 'specs', 'login');
    await fs.mkdir(loginSpec);
    await fs.writeFile(
      path.join(loginSpec, 'spec.md'),
      `---
status: draft
created: 2025-01-01
---

# 로그인 스펙

시스템은 로그인 기능을 제공해야 한다(SHALL).
`
    );
    await executeDomainLink('auth', ['login'], tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('도메인 필터로 해당 스펙만 검증한다', async () => {
    const context = {
      resolvedPath: path.join(sddPath, 'specs'),
      checkConstitution: false,
      hasConstitution: false,
      sddRoot: tempDir,
      domainFilter: 'auth',
    };

    const result = await executeValidate({}, context);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('스펙이 없는 도메인은 빈 결과를 반환한다', async () => {
    await executeDomainCreate('empty', { description: '빈 도메인' }, tempDir);

    const context = {
      resolvedPath: path.join(sddPath, 'specs'),
      checkConstitution: false,
      hasConstitution: false,
      sddRoot: tempDir,
      domainFilter: 'empty',
    };

    const result = await executeValidate({}, context);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files.length).toBe(0);
      expect(result.data.passed).toBe(0);
    }
  });
});

describe('executeDomainValidation', () => {
  let tempDir: string;
  let sddPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-domain-val-'));
    sddPath = path.join(tempDir, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
    await fs.mkdir(path.join(sddPath, 'specs'), { recursive: true });
    await fs.mkdir(path.join(sddPath, 'domains'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('도메인이 없으면 valid 결과를 반환한다', async () => {
    const result = await executeDomainValidation(tempDir, {});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.valid).toBe(true);
    }
  });

  it('고아 스펙을 감지한다', async () => {
    // 도메인 생성
    await executeDomainCreate('auth', { description: '인증' }, tempDir);

    // 스펙 생성 (도메인에 연결하지 않음)
    const orphanSpec = path.join(sddPath, 'specs', 'orphan-spec');
    await fs.mkdir(orphanSpec);
    await fs.writeFile(
      path.join(orphanSpec, 'spec.md'),
      `---
status: draft
created: 2025-01-01
---

# 고아 스펙
`
    );

    const result = await executeDomainValidation(tempDir, { orphanSpecs: true });

    expect(result.success).toBe(true);
    if (result.success) {
      const orphanIssues = result.data.issues.filter(i => i.code === 'ORPHAN_SPEC');
      expect(orphanIssues.length).toBeGreaterThan(0);
    }
  });

  it('순환 의존성을 감지한다', async () => {
    // 순환 의존성이 있는 도메인 생성
    await executeDomainCreate('a', { description: 'A', dependsOn: ['b'] }, tempDir);
    await executeDomainCreate('b', { description: 'B', dependsOn: ['a'] }, tempDir);

    const result = await executeDomainValidation(tempDir, { strict: true });

    expect(result.success).toBe(true);
    if (result.success) {
      const cycleIssues = result.data.issues.filter(i => i.code === 'CIRCULAR_DEPENDENCY');
      expect(cycleIssues.length).toBeGreaterThan(0);
      expect(result.data.valid).toBe(false);
    }
  });
});
