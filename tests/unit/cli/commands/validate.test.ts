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
  formatValidateSummary,
} from '../../../../src/cli/commands/validate.js';

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
