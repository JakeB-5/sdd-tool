/**
 * 스펙 검증기 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  validateSpecFile,
  validateSpecs,
  validateDependencies,
} from '../../../../src/core/spec/validator.js';

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

  it('plan.md와 tasks.md도 제외한다', async () => {
    await fs.writeFile(path.join(tempDir, 'valid.md'), VALID_SPEC);
    await fs.writeFile(path.join(tempDir, 'plan.md'), '# Plan');
    await fs.writeFile(path.join(tempDir, 'tasks.md'), '# Tasks');
    await fs.writeFile(path.join(tempDir, 'checklist.md'), '# Checklist');

    const result = await validateSpecs(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files).toHaveLength(1);
    }
  });
});

describe('validateDependencies', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-validate-deps-'));
    specsDir = path.join(tempDir, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  // 참고: SpecMetadataSchema에 dependencies 필드가 없어서
  // 현재 validateDependencies는 dependencies 배열을 감지하지 못함
  // 기본적인 동작만 테스트

  it('존재하지 않는 파일은 빈 배열을 반환한다', async () => {
    const brokenLinks = await validateDependencies('/nonexistent.md', specsDir);

    expect(brokenLinks).toHaveLength(0);
  });

  it('의존성이 없으면 빈 배열을 반환한다', async () => {
    const specPath = path.join(specsDir, 'no-deps.md');
    await fs.writeFile(
      specPath,
      `---
id: no-deps
title: "의존성 없음"
status: draft
depends: null
---

# 의존성 없음

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const brokenLinks = await validateDependencies(specPath, specsDir);

    expect(brokenLinks).toHaveLength(0);
  });

  it('파싱 실패 시 빈 배열을 반환한다', async () => {
    const specPath = path.join(specsDir, 'invalid.md');
    await fs.writeFile(specPath, 'invalid content without frontmatter');

    const brokenLinks = await validateDependencies(specPath, specsDir);

    expect(brokenLinks).toHaveLength(0);
  });
});

describe('validateSpecFile 링크 검증', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-link-test-'));
    specsDir = path.join(tempDir, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('깨진 내부 링크를 감지한다', async () => {
    const specPath = path.join(specsDir, 'broken-link.md');
    await fs.writeFile(
      specPath,
      `---
id: broken-link
title: "깨진 링크"
status: draft
created: 2025-01-01
depends: null
---

# 깨진 링크

시스템은 기능을 제공해야 한다(SHALL).

[관련 문서](./nonexistent.md)

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await validateSpecFile(specPath, {
      checkLinks: true,
      specsRoot: specsDir,
    });

    expect(result.brokenLinks).toBeDefined();
    expect(result.brokenLinks!.length).toBeGreaterThan(0);
    expect(result.brokenLinks![0].type).toBe('internal');
  });

  it('외부 링크는 무시한다', async () => {
    const specPath = path.join(specsDir, 'external-link.md');
    await fs.writeFile(
      specPath,
      `---
id: external-link
title: "외부 링크"
status: draft
created: 2025-01-01
depends: null
---

# 외부 링크

시스템은 기능을 제공해야 한다(SHALL).

[GitHub](https://github.com)
[Docs](http://example.com)
[Section](#section)

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await validateSpecFile(specPath, {
      checkLinks: true,
      specsRoot: specsDir,
    });

    expect(result.brokenLinks || []).toHaveLength(0);
  });

  it('유효한 내부 링크는 통과한다', async () => {
    // 참조할 파일 생성
    await fs.writeFile(path.join(specsDir, 'related.md'), '# Related');

    const specPath = path.join(specsDir, 'valid-link.md');
    await fs.writeFile(
      specPath,
      `---
id: valid-link
title: "유효한 링크"
status: draft
created: 2025-01-01
depends: null
---

# 유효한 링크

시스템은 기능을 제공해야 한다(SHALL).

[관련 문서](./related.md)

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await validateSpecFile(specPath, {
      checkLinks: true,
      specsRoot: specsDir,
    });

    expect(result.brokenLinks || []).toHaveLength(0);
  });

  it('스펙 참조 링크를 검증한다', async () => {
    // auth-service 스펙 생성
    const authDir = path.join(specsDir, 'auth-service');
    await fs.mkdir(authDir);
    await fs.writeFile(path.join(authDir, 'spec.md'), '# Auth');

    const specPath = path.join(specsDir, 'spec-ref.md');
    await fs.writeFile(
      specPath,
      `---
id: spec-ref
title: "스펙 참조"
status: draft
created: 2025-01-01
depends: null
---

# 스펙 참조

시스템은 기능을 제공해야 한다(SHALL).

참조: \`auth-service\`
참조: \`nonexistent-spec\`

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await validateSpecFile(specPath, {
      checkLinks: true,
      specsRoot: specsDir,
    });

    // nonexistent-spec은 깨진 링크로 감지되어야 함
    const specRefs = (result.brokenLinks || []).filter(
      (l) => l.type === 'spec-reference'
    );
    expect(specRefs.length).toBeGreaterThanOrEqual(1);
  });
});
