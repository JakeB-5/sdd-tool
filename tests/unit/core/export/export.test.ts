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
    // Shape is always { specs: [...] }, even for a single spec
    expect(parsed.specs).toHaveLength(1);
    expect(parsed.specs[0].id).toBe('auth');
    expect(parsed.specs[0].requirements).toHaveLength(1);
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
    // Title must not be duplicated when the body already has an H1
    expect(content.match(/^# 사용자 인증$/gm)).toHaveLength(1);
  });

  it('마크다운 기본 출력 파일 확장자는 .md이다', async () => {
    const result = await executeExport(tempDir, { format: 'markdown', specIds: ['auth'] });

    expect(result.success).toBe(true);
    expect(result.outputPath).toMatch(/auth\.md$/);
  });

  it('pdf 등 지원하지 않는 형식은 파일을 쓰지 않고 실패한다', async () => {
    const result = await executeExport(tempDir, {
      format: 'pdf' as never,
      specIds: ['auth'],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('지원하지 않는 형식');
    await expect(fs.stat(path.join(tempDir, 'auth.html'))).rejects.toThrow();
  });

  it('--include-constitution / --include-changes 내용을 포함한다', async () => {
    await fs.writeFile(
      path.join(tempDir, '.sdd', 'constitution.md'),
      '---\nversion: 1.0.0\n---\n\n# Constitution: Test\n\n원칙 본문\n'
    );
    const changeDir = path.join(tempDir, '.sdd', 'changes', 'CHG-001');
    await fs.mkdir(changeDir, { recursive: true });
    await fs.writeFile(
      path.join(changeDir, 'proposal.md'),
      '---\nid: CHG-001\nstatus: proposed\ncreated: 2025-01-01\n---\n\n# 변경 제안: 로그인 개선\n\n제안 본문\n'
    );

    const mdPath = path.join(tempDir, 'out.md');
    await executeExport(tempDir, {
      format: 'markdown',
      output: mdPath,
      includeConstitution: true,
      includeChanges: true,
    });
    const md = await fs.readFile(mdPath, 'utf-8');
    expect(md).toContain('원칙 본문');
    expect(md).toContain('제안 본문');

    const jsonPath = path.join(tempDir, 'out.json');
    await executeExport(tempDir, {
      format: 'json',
      output: jsonPath,
      includeConstitution: true,
      includeChanges: true,
    });
    const json = JSON.parse(await fs.readFile(jsonPath, 'utf-8'));
    expect(json.constitution.content).toContain('원칙 본문');
    expect(json.changes[0].id).toBe('CHG-001');

    const htmlPath = path.join(tempDir, 'out.html');
    await executeExport(tempDir, { format: 'html', output: htmlPath, includeConstitution: true });
    expect(await fs.readFile(htmlPath, 'utf-8')).toContain('원칙 본문');
  });

  it('constitution.md가 없는데 --include-constitution이면 실패한다', async () => {
    const result = await executeExport(tempDir, { format: 'json', includeConstitution: true });

    expect(result.success).toBe(false);
    expect(result.error).toContain('constitution.md');
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
    expect(result.error).toContain('스펙을 찾을 수 없습니다: nonexistent');
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

    expect(output).toContain('SDD 내보내기');
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
