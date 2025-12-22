/**
 * 품질 분석기 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  analyzeSpecQuality,
  analyzeProjectQuality,
  formatQualityResult,
  formatProjectQualityResult,
} from '../../../../src/core/quality/analyzer.js';

describe('analyzeSpecQuality', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-quality-test-'));
    specsDir = path.join(tempDir, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('존재하지 않는 파일에 에러를 반환한다', async () => {
    const result = await analyzeSpecQuality('/non/existent/file.md', tempDir);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toMatch(/찾을 수 없|not found/i);
    }
  });

  it('잘못된 형식의 파일에 에러를 반환한다', async () => {
    const specPath = path.join(tempDir, 'invalid.md');
    await fs.writeFile(specPath, 'invalid content without frontmatter');

    const result = await analyzeSpecQuality(specPath, tempDir);

    expect(result.success).toBe(false);
  });

  it('기본 스펙의 품질을 분석한다', async () => {
    const specDir = path.join(specsDir, 'basic');
    await fs.mkdir(specDir);
    const specPath = path.join(specDir, 'spec.md');
    await fs.writeFile(
      specPath,
      `---
id: basic
title: "기본 스펙"
status: draft
depends: null
---

# 기본 스펙

> 기본 기능 명세

## 요구사항

### REQ-01: 기본 요구사항

시스템은 기본 기능을 제공해야 한다(SHALL).

## 시나리오

### Scenario: 기본 테스트

- **GIVEN** 조건이 있을 때
- **WHEN** 동작을 수행하면
- **THEN** 결과가 나온다
`
    );

    const result = await analyzeSpecQuality(specPath, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.specId).toBe('basic');
      expect(result.data.percentage).toBeGreaterThanOrEqual(0);
      expect(result.data.percentage).toBeLessThanOrEqual(100);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.data.grade);
      expect(result.data.items).toHaveLength(8); // 8가지 품질 기준
    }
  });

  it('RFC 2119 키워드를 평가한다', async () => {
    const specDir = path.join(specsDir, 'rfc');
    await fs.mkdir(specDir);
    const specPath = path.join(specDir, 'spec.md');
    await fs.writeFile(
      specPath,
      `---
id: rfc
title: "RFC 스펙"
status: draft
depends: null
---

# RFC 스펙

시스템은 기능 A를 제공해야 한다(SHALL).
시스템은 기능 B를 제공해야 한다(MUST).
시스템은 기능 C를 제공할 수 있다(SHOULD).
시스템은 기능 D를 제공할 수 있다(MAY).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await analyzeSpecQuality(specPath, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      const rfcItem = result.data.items.find((i) => i.name.includes('RFC'));
      expect(rfcItem).toBeDefined();
      expect(rfcItem!.score).toBeGreaterThan(0);
    }
  });

  it('GIVEN-WHEN-THEN 시나리오를 평가한다', async () => {
    const specDir = path.join(specsDir, 'gwt');
    await fs.mkdir(specDir);
    const specPath = path.join(specDir, 'spec.md');
    await fs.writeFile(
      specPath,
      `---
id: gwt
title: "GWT 스펙"
status: draft
depends: null
---

# GWT 스펙

시스템은 기능을 제공해야 한다(SHALL).

## 시나리오

### Scenario: 성공 케이스

- **GIVEN** 유효한 입력이 있을 때
- **WHEN** 처리를 실행하면
- **THEN** 성공 결과를 반환한다

### Scenario: 실패 케이스

- **GIVEN** 잘못된 입력이 있을 때
- **WHEN** 처리를 실행하면
- **THEN** 에러를 반환한다

### Scenario: 경계 케이스

- **GIVEN** 경계값 입력이 있을 때
- **WHEN** 처리를 실행하면
- **THEN** 적절한 결과를 반환한다
`
    );

    const result = await analyzeSpecQuality(specPath, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      const gwtItem = result.data.items.find((i) => i.name.includes('GIVEN'));
      expect(gwtItem).toBeDefined();
      expect(gwtItem!.score).toBeGreaterThan(0);
    }
  });

  it('의존성 명시를 평가한다', async () => {
    const specDir = path.join(specsDir, 'deps');
    await fs.mkdir(specDir);
    const specPath = path.join(specDir, 'spec.md');
    await fs.writeFile(
      specPath,
      `---
status: draft
created: 2025-01-01
depends: auth
---

# 의존성 스펙

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await analyzeSpecQuality(specPath, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      const depsItem = result.data.items.find((i) => i.name.includes('의존성'));
      expect(depsItem).toBeDefined();
      expect(depsItem!.score).toBe(depsItem!.maxScore); // 의존성이 명시되면 만점
    }
  });

  it('등급을 올바르게 산출한다', async () => {
    // 완전한 스펙으로 높은 등급 기대
    const specDir = path.join(specsDir, 'complete');
    await fs.mkdir(specDir);
    const specPath = path.join(specDir, 'spec.md');
    await fs.writeFile(
      specPath,
      `---
status: draft
created: 2025-01-01
author: test
depends: core
---

# 완전한 스펙

> 완전한 기능 명세

## 개요

이 스펙은 완전한 품질을 갖추고 있습니다.

## 요구사항

### REQ-01: 필수 요구사항

시스템은 기능 A를 제공해야 한다(SHALL).
시스템은 기능 B를 반드시 지원해야 한다(MUST).

### REQ-02: 권장 요구사항

시스템은 기능 C를 제공해야 한다(SHOULD).

## 시나리오

### Scenario: 성공 케이스

- **GIVEN** 유효한 입력이 있을 때
- **WHEN** 처리를 실행하면
- **THEN** 성공 결과를 반환한다

### Scenario: 에러 케이스

- **GIVEN** 잘못된 입력이 있을 때
- **WHEN** 처리를 실행하면
- **THEN** 에러를 반환한다

## 참고

- [관련 문서](./related.md)
- [API 문서](./api.md)
`
    );

    const result = await analyzeSpecQuality(specPath, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.percentage).toBeGreaterThanOrEqual(50);
      expect(['A', 'B', 'C', 'D']).toContain(result.data.grade);
    }
  });
});

describe('analyzeProjectQuality', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-project-quality-'));
    specsDir = path.join(tempDir, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('스펙 디렉토리가 없으면 에러를 반환한다', async () => {
    await fs.rm(specsDir, { recursive: true });
    const result = await analyzeProjectQuality(tempDir);

    expect(result.success).toBe(false);
  });

  it('스펙이 없으면 에러를 반환한다', async () => {
    const result = await analyzeProjectQuality(tempDir);

    expect(result.success).toBe(false);
  });

  it('프로젝트 평균 품질을 계산한다', async () => {
    // 두 개의 스펙 생성
    const spec1Dir = path.join(specsDir, 'spec1');
    await fs.mkdir(spec1Dir);
    await fs.writeFile(
      path.join(spec1Dir, 'spec.md'),
      `---
id: spec1
title: "스펙 1"
status: draft
depends: null
---

# 스펙 1

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const spec2Dir = path.join(specsDir, 'spec2');
    await fs.mkdir(spec2Dir);
    await fs.writeFile(
      path.join(spec2Dir, 'spec.md'),
      `---
id: spec2
title: "스펙 2"
status: draft
depends: null
---

# 스펙 2

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await analyzeProjectQuality(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalSpecs).toBe(2);
      expect(result.data.specResults).toHaveLength(2);
      expect(result.data.averagePercentage).toBeGreaterThanOrEqual(0);
      expect(result.data.averagePercentage).toBeLessThanOrEqual(100);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.data.grade);
    }
  });
});

describe('formatQualityResult', () => {
  it('품질 결과를 포맷팅한다', () => {
    const result = {
      specId: 'test-spec',
      specPath: '/path/to/spec.md',
      totalScore: 75,
      maxScore: 100,
      percentage: 75,
      grade: 'C' as const,
      items: [
        {
          name: 'RFC 2119 키워드',
          score: 8,
          maxScore: 10,
          percentage: 80,
          details: ['발견된 키워드: SHALL: 2개'],
          suggestions: [],
        },
      ],
      summary: '테스트 요약',
      topSuggestions: ['제안 1'],
    };

    const formatted = formatQualityResult(result);

    expect(formatted).toContain('test-spec');
    expect(formatted).toContain('C');
    expect(formatted).toContain('75%');
    expect(formatted).toContain('RFC 2119');
  });
});

describe('formatProjectQualityResult', () => {
  it('프로젝트 품질 결과를 포맷팅한다', () => {
    const result = {
      averageScore: 70,
      averagePercentage: 70,
      grade: 'C' as const,
      totalSpecs: 3,
      specResults: [
        {
          specId: 'spec1',
          specPath: '/path/spec1.md',
          totalScore: 80,
          maxScore: 100,
          percentage: 80,
          grade: 'B' as const,
          items: [],
          summary: '',
          topSuggestions: [],
        },
        {
          specId: 'spec2',
          specPath: '/path/spec2.md',
          totalScore: 60,
          maxScore: 100,
          percentage: 60,
          grade: 'D' as const,
          items: [],
          summary: '',
          topSuggestions: [],
        },
      ],
      summary: '프로젝트 요약',
    };

    const formatted = formatProjectQualityResult(result);

    expect(formatted).toContain('70%');
    expect(formatted).toContain('C');
    expect(formatted).toContain('spec1');
    expect(formatted).toContain('spec2');
  });
});
