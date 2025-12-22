/**
 * report 명령어 핵심 로직 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  executeReport,
  isValidReportFormat,
  resolveOutputPath,
} from '../../../../src/cli/commands/report.js';

describe('isValidReportFormat', () => {
  it('유효한 형식을 인식한다', () => {
    expect(isValidReportFormat('html')).toBe(true);
    expect(isValidReportFormat('markdown')).toBe(true);
    expect(isValidReportFormat('json')).toBe(true);
  });

  it('유효하지 않은 형식을 거부한다', () => {
    expect(isValidReportFormat('pdf')).toBe(false);
    expect(isValidReportFormat('xml')).toBe(false);
    expect(isValidReportFormat('')).toBe(false);
  });
});

describe('resolveOutputPath', () => {
  it('기본 출력 경로를 생성한다', () => {
    const projectRoot = '/project';
    const today = new Date().toISOString().slice(0, 10);

    const htmlPath = resolveOutputPath('html', undefined, projectRoot);
    expect(htmlPath).toContain(`sdd-report-${today}.html`);

    const mdPath = resolveOutputPath('markdown', undefined, projectRoot);
    expect(mdPath).toContain(`sdd-report-${today}.md`);

    const jsonPath = resolveOutputPath('json', undefined, projectRoot);
    expect(jsonPath).toContain(`sdd-report-${today}.json`);
  });

  it('상대 경로를 절대 경로로 변환한다', () => {
    const projectRoot = '/project';
    const result = resolveOutputPath('html', 'reports/output.html', projectRoot);

    expect(result).toBe(path.join('/project', 'reports/output.html'));
  });

  it('절대 경로는 그대로 사용한다', () => {
    const projectRoot = '/project';
    const absolutePath = '/absolute/path/report.html';
    const result = resolveOutputPath('html', absolutePath, projectRoot);

    expect(result).toBe(absolutePath);
  });
});

describe('executeReport', () => {
  let tempDir: string;
  let sddPath: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-report-cmd-'));
    sddPath = path.join(tempDir, '.sdd');
    specsDir = path.join(sddPath, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('지원하지 않는 형식에 에러를 반환한다', async () => {
    const result = await executeReport({ format: 'pdf' }, tempDir);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('지원하지 않는 형식');
    }
  });

  it('HTML 리포트를 생성한다', async () => {
    // 스펙 생성
    const specDir = path.join(specsDir, 'test');
    await fs.mkdir(specDir);
    await fs.writeFile(
      path.join(specDir, 'spec.md'),
      `---
id: test
title: "테스트"
status: draft
created: 2025-01-01
depends: null
---

# 테스트

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await executeReport(
      { format: 'html', output: path.join(tempDir, 'report.html') },
      tempDir
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe('html');
      expect(result.data.content).toContain('<html');
    }
  });

  it('JSON 리포트를 생성한다', async () => {
    const specDir = path.join(specsDir, 'api');
    await fs.mkdir(specDir);
    await fs.writeFile(
      path.join(specDir, 'spec.md'),
      `---
id: api
title: "API"
status: draft
created: 2025-01-01
depends: null
---

# API

시스템은 API를 제공해야 한다(SHALL).

## Scenario: API

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await executeReport(
      { format: 'json', output: path.join(tempDir, 'report.json') },
      tempDir
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe('json');
      // JSON 파싱 가능 확인
      const parsed = JSON.parse(result.data.content);
      expect(parsed).toBeDefined();
    }
  });
});
