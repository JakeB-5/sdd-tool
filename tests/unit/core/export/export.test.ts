/**
 * Export 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { executeExport, formatExportResult } from '../../../../src/core/export/index.js';

describe('executeExport', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-export-test-'));
    specsDir = path.join(tempDir, '.sdd', 'specs');
    await fs.mkdir(specsDir, { recursive: true });

    // 테스트 스펙 생성
    const authDir = path.join(specsDir, 'auth');
    await fs.mkdir(authDir);
    await fs.writeFile(
      path.join(authDir, 'spec.md'),
      `---
id: auth
title: "사용자 인증"
status: draft
version: 1.0.0
---

# 사용자 인증

> JWT 기반 인증 시스템

### REQ-001: 로그인

시스템은 이메일/비밀번호 로그인을 지원해야 한다(SHALL).

### Scenario 1: 성공적인 로그인

- **GIVEN** 유효한 사용자 계정이 있을 때
- **WHEN** 올바른 이메일과 비밀번호로 로그인하면
- **THEN** JWT 토큰이 반환된다
`
    );
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('HTML로 내보낸다', async () => {
    const outputPath = path.join(tempDir, 'output.html');

    const result = await executeExport(tempDir, {
      format: 'html',
      output: outputPath,
      specIds: ['auth'],
    });

    expect(result.success).toBe(true);
    expect(result.format).toBe('html');
    expect(result.specsExported).toBe(1);
    expect(result.outputPath).toBe(outputPath);

    const content = await fs.readFile(outputPath, 'utf-8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('사용자 인증');
    expect(content).toContain('REQ-001');
  });

  it('JSON으로 내보낸다', async () => {
    const outputPath = path.join(tempDir, 'output.json');

    const result = await executeExport(tempDir, {
      format: 'json',
      output: outputPath,
      specIds: ['auth'],
    });

    expect(result.success).toBe(true);
    expect(result.format).toBe('json');

    const content = await fs.readFile(outputPath, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed.id).toBe('auth');
    expect(parsed.requirements).toHaveLength(1);
  });

  it('마크다운으로 내보낸다', async () => {
    const outputPath = path.join(tempDir, 'output.md');

    const result = await executeExport(tempDir, {
      format: 'markdown',
      output: outputPath,
      specIds: ['auth'],
    });

    expect(result.success).toBe(true);
    expect(result.format).toBe('markdown');

    const content = await fs.readFile(outputPath, 'utf-8');
    expect(content).toContain('# 사용자 인증');
    expect(content).toContain('REQ-001');
  });

  it('전체 스펙을 내보낸다', async () => {
    // 추가 스펙 생성
    const profileDir = path.join(specsDir, 'profile');
    await fs.mkdir(profileDir);
    await fs.writeFile(
      path.join(profileDir, 'spec.md'),
      `---
id: profile
title: "프로필"
---
# 프로필
`
    );

    const outputPath = path.join(tempDir, 'all-specs.html');

    const result = await executeExport(tempDir, {
      format: 'html',
      output: outputPath,
      all: true,
    });

    expect(result.success).toBe(true);
    expect(result.specsExported).toBe(2);

    const content = await fs.readFile(outputPath, 'utf-8');
    expect(content).toContain('사용자 인증');
    expect(content).toContain('프로필');
  });

  it('다크 테마를 적용한다', async () => {
    const outputPath = path.join(tempDir, 'dark.html');

    const result = await executeExport(tempDir, {
      format: 'html',
      output: outputPath,
      theme: 'dark',
      specIds: ['auth'],
    });

    expect(result.success).toBe(true);

    const content = await fs.readFile(outputPath, 'utf-8');
    expect(content).toContain('--bg-color: #1a1a2e');
  });

  it('목차를 제외할 수 있다', async () => {
    const outputPath = path.join(tempDir, 'no-toc.html');

    const result = await executeExport(tempDir, {
      format: 'html',
      output: outputPath,
      includeToc: false,
      specIds: ['auth'],
    });

    expect(result.success).toBe(true);

    const content = await fs.readFile(outputPath, 'utf-8');
    expect(content).not.toContain('class="toc"');
  });

  it('스펙이 없으면 오류를 반환한다', async () => {
    const result = await executeExport(tempDir, {
      format: 'html',
      specIds: ['nonexistent'],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('내보낼 스펙이 없습니다');
  });

  it('기본 출력 경로를 사용한다', async () => {
    const result = await executeExport(tempDir, {
      format: 'html',
      specIds: ['auth'],
    });

    expect(result.success).toBe(true);
    expect(result.outputPath).toContain('auth.html');
  });

  it('크기 정보를 반환한다', async () => {
    const result = await executeExport(tempDir, {
      format: 'html',
      specIds: ['auth'],
    });

    expect(result.success).toBe(true);
    expect(result.size).toBeGreaterThan(0);
  });
});

describe('formatExportResult', () => {
  it('성공 결과를 포맷한다', () => {
    const output = formatExportResult({
      success: true,
      format: 'html',
      specsExported: 3,
      outputPath: '/path/to/output.html',
      size: 1024,
    });

    expect(output).toContain('SDD Export');
    expect(output).toContain('HTML');
    expect(output).toContain('3개');
    expect(output).toContain('/path/to/output.html');
    expect(output).toContain('KB');
  });

  it('오류 결과를 포맷한다', () => {
    const output = formatExportResult({
      success: false,
      format: 'html',
      specsExported: 0,
      error: '스펙을 찾을 수 없습니다',
    });

    expect(output).toContain('오류');
    expect(output).toContain('스펙을 찾을 수 없습니다');
  });
});
