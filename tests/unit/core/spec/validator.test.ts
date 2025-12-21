/**
 * 스펙 검증기 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { validateSpecFile, validateSpecs } from '../../../../src/core/spec/validator.js';

const VALID_SPEC = `---
status: draft
created: 2025-12-21
---

# 유효한 스펙

> 테스트용 스펙

## Requirement: 기능

시스템은 기능을 제공해야 한다(SHALL).

### Scenario: 동작 확인

- **GIVEN** 조건
- **WHEN** 행동
- **THEN** 결과
`;

const INVALID_SPEC_NO_RFC = `---
status: draft
---

# 잘못된 스펙

## Requirement: 기능

일반적인 설명입니다.

### Scenario: 동작 확인

- **GIVEN** 조건
- **WHEN** 행동
- **THEN** 결과
`;

const INVALID_SPEC_NO_GWT = `---
status: draft
---

# 잘못된 스펙

## Requirement: 기능

시스템은 기능을 제공해야 한다(SHALL).
`;

describe('validateSpecFile', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-validator-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('유효한 스펙 파일을 통과시킨다', async () => {
    const filePath = path.join(tempDir, 'valid.md');
    await fs.writeFile(filePath, VALID_SPEC);

    const result = await validateSpecFile(filePath);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('RFC 2119 키워드가 없으면 에러를 반환한다', async () => {
    const filePath = path.join(tempDir, 'no-rfc.md');
    await fs.writeFile(filePath, INVALID_SPEC_NO_RFC);

    const result = await validateSpecFile(filePath);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'E204')).toBe(true);
  });

  it('GIVEN-WHEN-THEN이 없으면 에러를 반환한다', async () => {
    const filePath = path.join(tempDir, 'no-gwt.md');
    await fs.writeFile(filePath, INVALID_SPEC_NO_GWT);

    const result = await validateSpecFile(filePath);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'E205')).toBe(true);
  });

  it('created가 없으면 경고를 반환한다', async () => {
    const specWithoutCreated = `---
status: draft
---

# 스펙

## Requirement: 기능

시스템은 기능을 제공해야 한다(SHALL).

### Scenario: 동작

- **GIVEN** 조건
- **WHEN** 행동
- **THEN** 결과
`;
    const filePath = path.join(tempDir, 'no-created.md');
    await fs.writeFile(filePath, specWithoutCreated);

    const result = await validateSpecFile(filePath);

    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.message.includes('created'))).toBe(true);
  });

  it('strict 모드에서 경고도 에러로 처리한다', async () => {
    const specWithoutCreated = `---
status: draft
---

# 스펙

## Requirement: 기능

시스템은 기능을 제공해야 한다(SHALL).

### Scenario: 동작

- **GIVEN** 조건
- **WHEN** 행동
- **THEN** 결과
`;
    const filePath = path.join(tempDir, 'no-created.md');
    await fs.writeFile(filePath, specWithoutCreated);

    const result = await validateSpecFile(filePath, { strict: true });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('[STRICT]'))).toBe(true);
  });

  it('존재하지 않는 파일에 대해 에러를 반환한다', async () => {
    const filePath = path.join(tempDir, 'nonexistent.md');

    const result = await validateSpecFile(filePath);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'E102')).toBe(true);
  });
});

describe('validateSpecs', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-validator-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('디렉토리 내 모든 스펙을 검증한다', async () => {
    // 유효한 스펙 2개, 무효한 스펙 1개 생성
    await fs.writeFile(path.join(tempDir, 'valid1.md'), VALID_SPEC);
    await fs.writeFile(path.join(tempDir, 'valid2.md'), VALID_SPEC);
    await fs.writeFile(path.join(tempDir, 'invalid.md'), INVALID_SPEC_NO_RFC);

    const result = await validateSpecs(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.passed).toBe(2);
      expect(result.data.failed).toBe(1);
      expect(result.data.files).toHaveLength(3);
    }
  });

  it('하위 디렉토리도 검증한다', async () => {
    const subDir = path.join(tempDir, 'subdir');
    await fs.mkdir(subDir);
    await fs.writeFile(path.join(subDir, 'spec.md'), VALID_SPEC);

    const result = await validateSpecs(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.passed).toBe(1);
    }
  });

  it('index.md와 README.md는 제외한다', async () => {
    await fs.writeFile(path.join(tempDir, 'valid.md'), VALID_SPEC);
    await fs.writeFile(path.join(tempDir, 'index.md'), '# Index');
    await fs.writeFile(path.join(tempDir, 'README.md'), '# Readme');

    const result = await validateSpecs(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files).toHaveLength(1);
    }
  });

  it('단일 파일도 검증한다', async () => {
    const filePath = path.join(tempDir, 'single.md');
    await fs.writeFile(filePath, VALID_SPEC);

    const result = await validateSpecs(filePath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.passed).toBe(1);
      expect(result.data.files).toHaveLength(1);
    }
  });
});
