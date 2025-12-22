/**
 * 리포트 생성기 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { generateReport } from '../../../../src/core/report/reporter.js';

describe('generateReport', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-report-test-'));
    specsDir = path.join(tempDir, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('스펙 디렉토리가 없으면 에러를 반환한다', async () => {
    await fs.rm(specsDir, { recursive: true });
    const result = await generateReport(tempDir, { format: 'html' });

    expect(result.success).toBe(false);
  });

  it('HTML 리포트를 생성한다', async () => {
    await fs.mkdir(path.join(specsDir, 'test-spec'));
    await fs.writeFile(
      path.join(specsDir, 'test-spec', 'spec.md'),
      `---
id: test-spec
title: "테스트 스펙"
status: draft
depends: null
---

# 테스트 스펙

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await generateReport(tempDir, {
      format: 'html',
      title: '테스트 리포트',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe('html');
      expect(result.data.content).toContain('<!DOCTYPE html>');
      expect(result.data.content).toContain('테스트 리포트');
      expect(result.data.content).toContain('test-spec');
    }
  });

  it('Markdown 리포트를 생성한다', async () => {
    await fs.mkdir(path.join(specsDir, 'md-spec'));
    await fs.writeFile(
      path.join(specsDir, 'md-spec', 'spec.md'),
      `---
id: md-spec
title: "마크다운 스펙"
status: review
depends: null
---

# 마크다운 스펙

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await generateReport(tempDir, {
      format: 'markdown',
      title: 'MD 리포트',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe('markdown');
      expect(result.data.content).toContain('# MD 리포트');
      expect(result.data.content).toContain('md-spec');
    }
  });

  it('JSON 리포트를 생성한다', async () => {
    await fs.mkdir(path.join(specsDir, 'json-spec'));
    await fs.writeFile(
      path.join(specsDir, 'json-spec', 'spec.md'),
      `---
id: json-spec
title: "JSON 스펙"
status: approved
depends: null
---

# JSON 스펙

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await generateReport(tempDir, {
      format: 'json',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe('json');
      const parsed = JSON.parse(result.data.content);
      expect(parsed).toHaveProperty('specs');
      expect(parsed.specs.length).toBe(1);
      expect(parsed.specs[0].id).toBe('json-spec');
    }
  });

  it('파일로 저장한다', async () => {
    await fs.mkdir(path.join(specsDir, 'file-spec'));
    await fs.writeFile(
      path.join(specsDir, 'file-spec', 'spec.md'),
      `---
id: file-spec
title: "파일 스펙"
status: draft
depends: null
---

# 파일 스펙

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const outputPath = path.join(tempDir, 'output', 'report.html');
    const result = await generateReport(tempDir, {
      format: 'html',
      outputPath,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.outputPath).toBe(outputPath);
      const exists = await fs.stat(outputPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    }
  });

  it('품질 분석을 포함한다', async () => {
    await fs.mkdir(path.join(specsDir, 'quality-spec'));
    await fs.writeFile(
      path.join(specsDir, 'quality-spec', 'spec.md'),
      `---
id: quality-spec
title: "품질 스펙"
status: draft
depends: null
---

# 품질 스펙

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await generateReport(tempDir, {
      format: 'html',
      includeQuality: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toContain('품질');
    }
  });

  it('검증 결과를 포함한다', async () => {
    await fs.mkdir(path.join(specsDir, 'validation-spec'));
    await fs.writeFile(
      path.join(specsDir, 'validation-spec', 'spec.md'),
      `---
id: validation-spec
title: "검증 스펙"
status: draft
depends: null
---

# 검증 스펙

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await generateReport(tempDir, {
      format: 'html',
      includeValidation: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toContain('검증');
    }
  });

  it('Phase별 분포를 계산한다', async () => {
    // 다양한 phase의 스펙 생성
    for (const phase of ['phase1', 'phase2', 'phase3']) {
      await fs.mkdir(path.join(specsDir, `${phase}-spec`));
      await fs.writeFile(
        path.join(specsDir, `${phase}-spec`, 'spec.md'),
        `---
id: ${phase}-spec
title: "${phase} 스펙"
status: draft
phase: ${phase}
depends: null
---

# ${phase} 스펙

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
      );
    }

    const result = await generateReport(tempDir, {
      format: 'json',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.data.content);
      expect(parsed.summary.totalSpecs).toBe(3);
    }
  });

  it('품질 분석을 제외할 수 있다', async () => {
    await fs.mkdir(path.join(specsDir, 'no-quality-spec'));
    await fs.writeFile(
      path.join(specsDir, 'no-quality-spec', 'spec.md'),
      `---
id: no-quality-spec
title: "품질 제외 스펙"
status: draft
depends: null
---

# 품질 제외 스펙

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await generateReport(tempDir, {
      format: 'json',
      includeQuality: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.data.content);
      expect(parsed.quality).toBeUndefined();
    }
  });

  it('검증 결과를 제외할 수 있다', async () => {
    await fs.mkdir(path.join(specsDir, 'no-validation-spec'));
    await fs.writeFile(
      path.join(specsDir, 'no-validation-spec', 'spec.md'),
      `---
id: no-validation-spec
title: "검증 제외 스펙"
status: draft
depends: null
---

# 검증 제외 스펙

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await generateReport(tempDir, {
      format: 'json',
      includeValidation: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.data.content);
      expect(parsed.validation).toBeUndefined();
    }
  });

  it('상태별 분포를 계산한다', async () => {
    // 다양한 status의 스펙 생성
    for (const status of ['draft', 'review', 'approved']) {
      await fs.mkdir(path.join(specsDir, `${status}-status`));
      await fs.writeFile(
        path.join(specsDir, `${status}-status`, 'spec.md'),
        `---
id: ${status}-status
title: "${status} 스펙"
status: ${status}
depends: null
---

# ${status} 스펙

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
      );
    }

    const result = await generateReport(tempDir, {
      format: 'json',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.data.content);
      expect(parsed.summary.byStatus.draft).toBe(1);
      expect(parsed.summary.byStatus.review).toBe(1);
      expect(parsed.summary.byStatus.approved).toBe(1);
    }
  });

  it('빈 스펙 디렉토리에서도 리포트를 생성한다', async () => {
    const result = await generateReport(tempDir, {
      format: 'json',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.data.content);
      expect(parsed.specs).toHaveLength(0);
      expect(parsed.summary.totalSpecs).toBe(0);
    }
  });

  it('Markdown 리포트에 품질 등급을 포함한다', async () => {
    await fs.mkdir(path.join(specsDir, 'quality-md-spec'));
    await fs.writeFile(
      path.join(specsDir, 'quality-md-spec', 'spec.md'),
      `---
id: quality-md-spec
title: "품질 마크다운 스펙"
status: draft
depends: null
---

# 품질 마크다운 스펙

시스템은 기능을 제공해야 한다(SHALL).

## 요구사항

### REQ-01: 테스트 요구사항

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await generateReport(tempDir, {
      format: 'markdown',
      includeQuality: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toContain('## 품질 분석');
      expect(result.data.content).toMatch(/평균 점수:.*%/);
    }
  });

  it('frontmatter 없는 스펙도 처리한다', async () => {
    await fs.mkdir(path.join(specsDir, 'no-frontmatter'));
    await fs.writeFile(
      path.join(specsDir, 'no-frontmatter', 'spec.md'),
      `# No Frontmatter Spec

This spec has no frontmatter.
`
    );

    const result = await generateReport(tempDir, {
      format: 'json',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(result.data.content);
      expect(parsed.specs.length).toBe(1);
      expect(parsed.specs[0].id).toBe('no-frontmatter');
      // title, status, phase는 undefined일 것
    }
  });
});
