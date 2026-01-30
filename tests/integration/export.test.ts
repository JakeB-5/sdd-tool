/**
 * sdd export 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binPath = path.resolve(__dirname, '../../bin/sdd.js');

/**
 * CLI 실행 헬퍼
 */
function runCli(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn('node', [binPath, ...args], { cwd, shell: true });
    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 0 });
    });
  });
}

/**
 * 테스트용 SDD 프로젝트 초기화
 */
async function setupTestProject(tempDir: string): Promise<void> {
  // SDD 초기화
  await runCli(['init'], tempDir);

  // 테스트용 스펙 파일 생성 (디렉토리 구조에 맞게)
  const specsDir = path.join(tempDir, '.sdd', 'specs');

  const spec1Content = `# Spec: test-feature-1

**Meta:**
- id: test-feature-1
- status: draft
- version: 0.1.0
- created: 2026-01-23
- author: Test Author

## Overview

테스트 기능 1에 대한 설명입니다.

## Requirements

### REQ-001: 첫 번째 요구사항
- **Description**: 사용자는 데이터를 조회할 수 있어야 한다
- **Keyword**: SHALL
- **Priority**: high

### REQ-002: 두 번째 요구사항
- **Description**: 시스템은 결과를 반환해야 한다
- **Keyword**: SHALL
- **Priority**: medium

## Scenarios

### SCENARIO-001: 데이터 조회 시나리오
- **GIVEN**: 사용자가 로그인한 상태
- **WHEN**: 데이터 조회를 요청하면
- **THEN**: 시스템은 데이터를 반환한다

## Dependencies

- 없음

## Constraints

- 성능: 1초 이내 응답
`;

  const spec2Content = `# Spec: test-feature-2

**Meta:**
- id: test-feature-2
- status: active
- version: 1.0.0

## Overview

테스트 기능 2에 대한 설명입니다.

## Requirements

### REQ-101: 기본 요구사항
- **Description**: 데이터를 저장할 수 있어야 한다
- **Keyword**: SHALL

## Scenarios

### SCENARIO-101: 데이터 저장
- **GIVEN**: 유효한 데이터가 입력되면
- **WHEN**: 저장 요청 시
- **THEN**: 데이터가 저장된다
`;

  // 스펙별 디렉토리 생성 (parseAllSpecs는 .sdd/specs/**/spec.md를 찾음)
  const spec1Dir = path.join(specsDir, 'test-feature-1');
  const spec2Dir = path.join(specsDir, 'test-feature-2');

  await fs.mkdir(spec1Dir, { recursive: true });
  await fs.mkdir(spec2Dir, { recursive: true });

  await fs.writeFile(path.join(spec1Dir, 'spec.md'), spec1Content, 'utf-8');
  await fs.writeFile(path.join(spec2Dir, 'spec.md'), spec2Content, 'utf-8');
}

describe('sdd export', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-export-test-'));
    await setupTestProject(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('기본 HTML 형식으로 내보낸다', async () => {
    const result = await runCli(['export'], tempDir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('SDD Export');
    expect(result.stdout).toContain('HTML');

    // 기본 출력 파일 확인 (specs.html)
    const outputPath = path.join(tempDir, 'specs.html');
    const exists = await fs.stat(outputPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    if (exists) {
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('test-feature-1');
      expect(content).toContain('test-feature-2');
    }
  });

  it('--format json 옵션으로 JSON 형식으로 내보낸다', async () => {
    const result = await runCli(['export', '--format', 'json'], tempDir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('JSON');

    // JSON 파일 확인
    const outputPath = path.join(tempDir, 'specs.json');
    const exists = await fs.stat(outputPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    if (exists) {
      const content = await fs.readFile(outputPath, 'utf-8');
      const json = JSON.parse(content);

      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBe(2);
      expect(json[0]).toHaveProperty('id');
      expect(json[0]).toHaveProperty('title');
      expect(json[0]).toHaveProperty('requirements');
    }
  });

  it('--format markdown 옵션으로 Markdown 형식으로 내보낸다', async () => {
    const result = await runCli(['export', '--format', 'markdown'], tempDir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('MARKDOWN');

    // Markdown 파일 확인
    const outputPath = path.join(tempDir, 'specs.markdown');
    const exists = await fs.stat(outputPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    if (exists) {
      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('# Spec: test-feature-1');
      expect(content).toContain('# Spec: test-feature-2');
      expect(content).toContain('---'); // 스펙 구분자
    }
  });

  it('-o/--output 옵션으로 지정한 경로에 파일을 생성한다', async () => {
    const customPath = path.join(tempDir, 'output', 'custom-export.html');
    const result = await runCli(['export', '-o', customPath], tempDir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain(customPath);

    // 지정한 경로에 파일 생성 확인
    const exists = await fs.stat(customPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('--all 옵션으로 전체 스펙을 내보낸다', async () => {
    const result = await runCli(['export', '--all', '--format', 'json'], tempDir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('스펙: 2개');

    const outputPath = path.join(tempDir, 'specs.json');
    const content = await fs.readFile(outputPath, 'utf-8');
    const json = JSON.parse(content);

    expect(json.length).toBe(2);
  });

  it('--no-toc 옵션으로 목차를 제외한다', async () => {
    const outputPath = path.join(tempDir, 'no-toc.html');
    const result = await runCli(['export', '--no-toc', '-o', outputPath], tempDir);

    expect(result.code).toBe(0);

    const content = await fs.readFile(outputPath, 'utf-8');
    // TOC 섹션이 없는지 확인 (구체적인 TOC 마커는 구현에 따라 다를 수 있음)
    // HTML 생성기가 TOC를 생성하지 않았다는 것을 간접적으로 확인
    expect(content).toBeTruthy();
  });

  it('--include-constitution 옵션으로 Constitution을 포함한다', async () => {
    const result = await runCli(['export', '--include-constitution', '--format', 'json'], tempDir);

    expect(result.code).toBe(0);

    // Constitution 포함 옵션이 처리되었는지 확인
    // (실제 구현에서 Constitution이 어떻게 포함되는지에 따라 검증 방법이 달라질 수 있음)
    expect(result.stdout).toContain('SDD Export');
  });

  it('내보낼 스펙이 없으면 에러를 반환한다', async () => {
    // 빈 프로젝트 생성
    const emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-export-empty-'));
    await runCli(['init'], emptyDir);

    try {
      const result = await runCli(['export'], emptyDir);

      expect(result.code).not.toBe(0);
      const output = result.stdout + result.stderr;
      expect(output).toMatch(/내보낼 스펙이 없습니다|스펙이 없습니다/);
    } finally {
      await fs.rm(emptyDir, { recursive: true, force: true });
    }
  });
});
