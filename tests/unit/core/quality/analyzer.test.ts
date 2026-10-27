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

  describe('의존성 필드 인식', () => {
    const analyzeWithFrontmatter = async (name: string, extra: string) => {
      const specDir = path.join(specsDir, name);
      await fs.mkdir(specDir);
      const specPath = path.join(specDir, 'spec.md');
      await fs.writeFile(
        specPath,
        `---\nstatus: draft\ncreated: 2025-01-01\n${extra}---\n\n# 스펙\n\n시스템은 동작해야 한다(SHALL).\n`
      );
      const result = await analyzeSpecQuality(specPath, tempDir);
      expect(result.success).toBe(true);
      if (!result.success) throw result.error;
      return result.data.items.find((i) => i.name.includes('의존성'))!;
    };

    it.each([
      ['목록', 'depends: [cart]\n', '의존성: cart'],
      ['쉼표 구분 문자열', 'depends: cart, coupon\n', '의존성: cart, coupon'],
      ['dependencies 별칭', 'dependencies: [cart]\n', '의존성: cart'],
      ['빈 목록', 'depends: []\n', '의존성 없음 (명시적 선언)'],
      ['null', 'depends: null\n', '의존성 없음 (명시적 선언)'],
    ])('%s 형태의 선언을 인식한다', async (name, extra, detail) => {
      const item = await analyzeWithFrontmatter(`deps-${name.length}-${extra.length}`, extra);

      expect(item.score).toBe(item.maxScore);
      expect(item.details).toContain(detail);
      expect(item.details.join()).not.toContain('필드 없음');
    });

    it('필드가 없을 때만 필드 없음으로 보고하고 추가를 제안한다', async () => {
      const item = await analyzeWithFrontmatter('deps-missing', '');

      expect(item.score).toBeLessThan(item.maxScore);
      expect(item.details.join()).toContain('의존성 필드 없음');
      expect(item.suggestions.join()).toContain('depends');
    });
  });

  describe('시나리오 섹션 인식', () => {
    const structureItem = async (name: string, body: string) => {
      const specDir = path.join(specsDir, name);
      await fs.mkdir(specDir);
      const specPath = path.join(specDir, 'spec.md');
      await fs.writeFile(specPath, `---\nstatus: draft\ncreated: 2025-01-01\ndepends: []\n---\n\n${body}`);
      const result = await analyzeSpecQuality(specPath, tempDir);
      expect(result.success).toBe(true);
      if (!result.success) throw result.error;
      return result.data.items.find((i) => i.name === '문서 구조')!;
    };

    const scenario = '- **GIVEN** 조건\n- **WHEN** 동작\n- **THEN** 결과\n';

    it('요구사항 하위의 #### Scenario를 시나리오 섹션으로 인정한다', async () => {
      const item = await structureItem(
        'per-req-h4',
        `# 스펙\n\n## 요구사항\n\n### REQ-01: 기능\n\n시스템은 동작해야 한다(SHALL).\n\n#### Scenario: 성공\n\n${scenario}`
      );

      expect(item.suggestions.join()).not.toContain('시나리오 섹션');
      expect(item.details.join()).toContain('시나리오 섹션');
    });

    it('### Scenario와 ### 시나리오 제목도 인정한다', async () => {
      for (const [name, heading] of [['h3-en', '### Scenario: 성공'], ['h3-ko', '### 시나리오: 성공']]) {
        const item = await structureItem(
          name,
          `# 스펙\n\n## 요구사항\n\n### REQ-01: 기능\n\n${heading}\n\n${scenario}`
        );
        expect(item.suggestions.join()).not.toContain('시나리오 섹션');
      }
    });

    it('시나리오가 전혀 없으면 여전히 누락으로 보고한다', async () => {
      const item = await structureItem('none', '# 스펙\n\n## 요구사항\n\n### REQ-01: 기능\n\n시스템은 동작해야 한다(SHALL).\n');

      expect(item.suggestions.join()).toContain('시나리오 섹션');
    });
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
      expect(result.data.failedSpecs).toEqual([]);
    }
  });

  it('분석에 실패한 스펙을 0점으로 평균에 포함한다', async () => {
    const goodDir = path.join(specsDir, 'good');
    await fs.mkdir(goodDir);
    await fs.writeFile(
      path.join(goodDir, 'spec.md'),
      `---
id: good
title: "좋은 스펙"
status: draft
---

# 좋은 스펙

시스템은 기능을 제공해야 한다(SHALL).
`
    );
    const badDir = path.join(specsDir, 'bad');
    await fs.mkdir(badDir);
    await fs.writeFile(path.join(badDir, 'spec.md'), 'invalid content without frontmatter');

    const single = await analyzeProjectQuality(tempDir);
    expect(single.success).toBe(true);
    if (!single.success) return;

    expect(single.data.totalSpecs).toBe(2);
    expect(single.data.specResults).toHaveLength(1);
    expect(single.data.failedSpecs).toHaveLength(1);
    expect(single.data.averagePercentage).toBe(
      Math.round(single.data.specResults[0].percentage / 2)
    );
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
      failedSpecs: [{ specPath: '/path/spec3.md', error: '스펙 파싱 실패' }],
      summary: '프로젝트 요약',
    };

    const formatted = formatProjectQualityResult(result);

    expect(formatted).toContain('분석 실패');
    expect(formatted).toContain('/path/spec3.md');
    expect(formatted).toContain('70%');
    expect(formatted).toContain('C');
    expect(formatted).toContain('spec1');
    expect(formatted).toContain('spec2');
  });

  it('각 등급별 아이콘을 표시한다', () => {
    const result = {
      averageScore: 95,
      averagePercentage: 95,
      grade: 'A' as const,
      totalSpecs: 5,
      specResults: [
        { specId: 'a-spec', specPath: '', totalScore: 95, maxScore: 100, percentage: 95, grade: 'A' as const, items: [], summary: '', topSuggestions: [] },
        { specId: 'b-spec', specPath: '', totalScore: 85, maxScore: 100, percentage: 85, grade: 'B' as const, items: [], summary: '', topSuggestions: [] },
        { specId: 'c-spec', specPath: '', totalScore: 75, maxScore: 100, percentage: 75, grade: 'C' as const, items: [], summary: '', topSuggestions: [] },
        { specId: 'd-spec', specPath: '', totalScore: 65, maxScore: 100, percentage: 65, grade: 'D' as const, items: [], summary: '', topSuggestions: [] },
        { specId: 'f-spec', specPath: '', totalScore: 50, maxScore: 100, percentage: 50, grade: 'F' as const, items: [], summary: '', topSuggestions: [] },
      ],
      failedSpecs: [],
      summary: '',
    };

    const formatted = formatProjectQualityResult(result);

    expect(formatted).toContain('🏆'); // A 등급
    expect(formatted).toContain('✅'); // B 등급
    expect(formatted).toContain('🟡'); // C 등급
    expect(formatted).toContain('🟠'); // D 등급
    expect(formatted).toContain('🔴'); // F 등급
  });
});

describe('analyzeSpecQuality with Constitution', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-constitution-quality-'));
    specsDir = path.join(tempDir, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('Constitution이 있을 때 constitution_version 필드를 평가한다', async () => {
    // Constitution 파일 생성
    await fs.writeFile(
      path.join(tempDir, 'constitution.md'),
      `---
version: "1.0.0"
---

# 프로젝트 헌법
`
    );

    // constitution_version이 있는 스펙
    const specDir = path.join(specsDir, 'with-cv');
    await fs.mkdir(specDir);
    await fs.writeFile(
      path.join(specDir, 'spec.md'),
      `---
id: with-cv
title: "CV 스펙"
status: draft
depends: null
constitution_version: "1.0.0"
---

# CV 스펙

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await analyzeSpecQuality(path.join(specDir, 'spec.md'), tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      const cvItem = result.data.items.find((i) => i.name.includes('Constitution'));
      expect(cvItem).toBeDefined();
      // Constitution 평가 항목이 존재하고 점수가 계산되었는지 확인
      expect(cvItem!.maxScore).toBe(10);
    }
  });

  it('Constitution이 있지만 스펙에 constitution_version이 없으면 제안을 생성한다', async () => {
    // Constitution 파일 생성
    await fs.writeFile(
      path.join(tempDir, 'constitution.md'),
      `---
version: "1.0.0"
---

# 프로젝트 헌법
`
    );

    // constitution_version이 없는 스펙
    const specDir = path.join(specsDir, 'without-cv');
    await fs.mkdir(specDir);
    await fs.writeFile(
      path.join(specDir, 'spec.md'),
      `---
id: without-cv
title: "No CV 스펙"
status: draft
depends: null
---

# No CV 스펙

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await analyzeSpecQuality(path.join(specDir, 'spec.md'), tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      const cvItem = result.data.items.find((i) => i.name.includes('Constitution'));
      expect(cvItem).toBeDefined();
      expect(cvItem!.suggestions.length).toBeGreaterThan(0);
    }
  });
});

describe('analyzeProjectQuality nested directories', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-nested-quality-'));
    specsDir = path.join(tempDir, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('중첩된 디렉토리의 스펙도 분석한다', async () => {
    // 1단계 스펙
    const spec1Dir = path.join(specsDir, 'feature1');
    await fs.mkdir(spec1Dir);
    await fs.writeFile(
      path.join(spec1Dir, 'spec.md'),
      `---
id: feature1
status: draft
depends: null
---

# Feature 1

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    // 2단계 중첩 스펙 (id는 디렉토리명 'login'에서 추출됨)
    const spec2Dir = path.join(specsDir, 'auth', 'login');
    await fs.mkdir(spec2Dir, { recursive: true });
    await fs.writeFile(
      path.join(spec2Dir, 'spec.md'),
      `---
status: draft
depends: null
---

# Auth Login

시스템은 로그인을 제공해야 한다(SHALL).

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
      const specIds = result.data.specResults.map((r) => r.specId);
      expect(specIds).toContain('feature1');
      // specId가 없으면 디렉토리명에서 추출됨 (login)
      expect(specIds).toContain('login');
    }
  });
});

describe('formatQualityResult edge cases', () => {
  it('F 등급에 적절한 아이콘을 표시한다', () => {
    const result = {
      specId: 'low-quality',
      specPath: '/path/to/spec.md',
      totalScore: 30,
      maxScore: 100,
      percentage: 30,
      grade: 'F' as const,
      items: [],
      summary: '',
      topSuggestions: ['개선 필요 1', '개선 필요 2'],
    };

    const formatted = formatQualityResult(result);

    expect(formatted).toContain('🔴');
    expect(formatted).toContain('F');
    expect(formatted).toContain('개선 필요 1');
  });

  it('개선 제안이 없으면 제안 섹션을 생략한다', () => {
    const result = {
      specId: 'perfect',
      specPath: '/path/to/spec.md',
      totalScore: 100,
      maxScore: 100,
      percentage: 100,
      grade: 'A' as const,
      items: [],
      summary: '',
      topSuggestions: [],
    };

    const formatted = formatQualityResult(result);

    expect(formatted).toContain('🏆');
    expect(formatted).not.toContain('개선 제안:');
  });
});
