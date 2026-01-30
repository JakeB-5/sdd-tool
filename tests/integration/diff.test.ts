/**
 * sdd diff 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, execSync } from 'node:child_process';
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
 * Git 명령어 실행 헬퍼
 */
function gitExec(command: string, cwd: string): void {
  execSync(command, { cwd, stdio: 'pipe' });
}

describe('sdd diff', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-diff-test-'));

    // SDD 프로젝트 초기화
    await runCli(['init'], tempDir);

    // Git 저장소 초기화
    gitExec('git init', tempDir);
    gitExec('git config user.name "Test User"', tempDir);
    gitExec('git config user.email "test@example.com"', tempDir);
    gitExec('git add .', tempDir);
    gitExec('git commit -m "Initial commit"', tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('기본 diff 명령어는 작업 트리 변경사항을 표시한다', async () => {
    // 기존 스펙 파일 생성 및 커밋
    const specPath = path.join(tempDir, '.sdd', 'specs', 'test-feature.md');
    await fs.writeFile(
      specPath,
      `---
id: test-feature
version: 1.0.0
---

# Test Feature

## Requirements

- SHALL implement basic functionality
`
    );
    gitExec('git add .', tempDir);
    gitExec('git commit -m "Add test feature"', tempDir);

    // 스펙 파일 수정
    await fs.writeFile(
      specPath,
      `---
id: test-feature
version: 1.0.0
---

# Test Feature

## Requirements

- SHALL implement basic functionality
- SHALL handle errors gracefully

## Scenarios

### Scenario: Basic Usage
**GIVEN** a user
**WHEN** they use the feature
**THEN** it should work
`
    );

    // diff 실행
    const result = await runCli(['diff'], tempDir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('test-feature.md');
    // 시나리오가 추가되었음을 확인
    expect(result.stdout).toContain('Basic Usage');
  });

  it('--staged 옵션은 스테이징된 변경사항만 표시한다', async () => {
    // 스펙 파일 생성 및 스테이징
    const specPath = path.join(tempDir, '.sdd', 'specs', 'staged-feature.md');
    await fs.writeFile(
      specPath,
      `---
id: staged-feature
version: 1.0.0
---

# Staged Feature

## Requirements

- SHALL be staged
`
    );
    gitExec('git add .', tempDir);

    // 스테이징되지 않은 파일 생성
    const unstagedPath = path.join(tempDir, '.sdd', 'specs', 'unstaged-feature.md');
    await fs.writeFile(
      unstagedPath,
      `---
id: unstaged-feature
version: 1.0.0
---

# Unstaged Feature

## Requirements

- SHALL not be staged
`
    );

    // --staged diff 실행
    const result = await runCli(['diff', '--staged'], tempDir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('staged-feature.md');
    expect(result.stdout).not.toContain('unstaged-feature.md');
  });

  it('--stat 옵션은 변경 통계를 표시한다', async () => {
    // 기존 스펙 파일 생성 및 커밋
    const specPath = path.join(tempDir, '.sdd', 'specs', 'stats-feature.md');
    await fs.writeFile(
      specPath,
      `---
id: stats-feature
version: 1.0.0
---

# Stats Feature

## Requirements

- SHALL show statistics
`
    );
    gitExec('git add .', tempDir);
    gitExec('git commit -m "Add stats feature"', tempDir);

    // 스펙 파일 수정
    await fs.writeFile(
      specPath,
      `---
id: stats-feature
version: 1.0.0
---

# Stats Feature

## Requirements

- SHALL show statistics
- SHALL count changes

## Scenarios

### Scenario: Display Stats
**GIVEN** changes exist
**WHEN** --stat is used
**THEN** show statistics
`
    );

    // diff 실행
    const result = await runCli(['diff', '--stat'], tempDir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('변경'); // "총 변경:" 텍스트 포함
    expect(result.stdout).toContain('파일');
    // 통계 요약이 포함되어야 함
    expect(result.stdout).toMatch(/\d+/); // 숫자가 포함되어야 함
  });

  it('--name-only 옵션은 파일명만 표시한다', async () => {
    // 기존 스펙 파일 생성 및 커밋
    const spec1Path = path.join(tempDir, '.sdd', 'specs', 'feature1.md');
    const spec2Path = path.join(tempDir, '.sdd', 'specs', 'feature2.md');

    await fs.writeFile(
      spec1Path,
      `---
id: feature1
version: 1.0.0
---

# Feature 1

The system SHALL have a feature.

## Scenarios

### Scenario: Basic
**GIVEN** initial state
**WHEN** action happens
**THEN** result occurs
`
    );

    await fs.writeFile(
      spec2Path,
      `---
id: feature2
version: 1.0.0
---

# Feature 2

The system SHALL have another feature.

## Scenarios

### Scenario: Another
**GIVEN** another state
**WHEN** something happens
**THEN** outcome occurs
`
    );
    gitExec('git add .', tempDir);
    gitExec('git commit -m "Add features"', tempDir);

    // 두 파일 모두 수정 - 시나리오 추가
    await fs.writeFile(
      spec1Path,
      `---
id: feature1
version: 1.0.0
---

# Feature 1

The system SHALL have a feature.

## Scenarios

### Scenario: Basic
**GIVEN** initial state
**WHEN** action happens
**THEN** result occurs

### Scenario: Advanced
**GIVEN** advanced state
**WHEN** complex action happens
**THEN** advanced result occurs
`
    );

    await fs.writeFile(
      spec2Path,
      `---
id: feature2
version: 1.0.0
---

# Feature 2

The system SHALL have another feature.

## Scenarios

### Scenario: Another
**GIVEN** another state
**WHEN** something happens
**THEN** outcome occurs

### Scenario: Extended
**GIVEN** extended state
**WHEN** extended action happens
**THEN** extended outcome occurs
`
    );

    // diff 실행
    const result = await runCli(['diff', '--name-only'], tempDir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('feature1.md');
    expect(result.stdout).toContain('feature2.md');
    // 상세 내용은 표시되지 않아야 함 (name-only 모드)
    expect(result.stdout).not.toContain('Advanced');
    expect(result.stdout).not.toContain('Extended');
  });

  it('--json 옵션은 JSON 형식으로 출력한다', async () => {
    // 스펙 파일 생성
    const specPath = path.join(tempDir, '.sdd', 'specs', 'json-feature.md');
    await fs.writeFile(
      specPath,
      `---
id: json-feature
version: 1.0.0
---

# JSON Feature

## Requirements

- SHALL output JSON
`
    );

    // diff 실행
    const result = await runCli(['diff', '--json'], tempDir);

    expect(result.code).toBe(0);

    // JSON 파싱 가능 확인
    const jsonOutput = JSON.parse(result.stdout);
    expect(jsonOutput).toHaveProperty('files');
    expect(jsonOutput).toHaveProperty('summary');
    expect(Array.isArray(jsonOutput.files)).toBe(true);
  });

  it('두 커밋 간의 diff를 표시한다', async () => {
    // 첫 번째 스펙 생성 및 커밋
    const specPath = path.join(tempDir, '.sdd', 'specs', 'evolving-feature.md');
    await fs.writeFile(
      specPath,
      `---
id: evolving-feature
version: 1.0.0
---

# Evolving Feature

## Requirements

- SHALL have initial functionality
`
    );
    gitExec('git add .', tempDir);
    gitExec('git commit -m "Add initial spec"', tempDir);

    const commit1 = execSync('git rev-parse HEAD', { cwd: tempDir }).toString().trim();

    // 스펙 수정 및 커밋
    await fs.writeFile(
      specPath,
      `---
id: evolving-feature
version: 2.0.0
---

# Evolving Feature

## Requirements

- SHALL have initial functionality
- SHALL have enhanced functionality
`
    );
    gitExec('git add .', tempDir);
    gitExec('git commit -m "Update spec"', tempDir);

    const commit2 = execSync('git rev-parse HEAD', { cwd: tempDir }).toString().trim();

    // 두 커밋 간 diff 실행
    const result = await runCli(['diff', commit1, commit2], tempDir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('evolving-feature.md');
    // 변경사항이 있어야 함 (파일명 외에 추가 정보가 있음)
    expect(result.stdout.length).toBeGreaterThan(50);
  });

  it('Git 저장소가 아니면 에러를 반환한다', async () => {
    // 새로운 디렉토리 생성 (Git 저장소 아님)
    const nonGitDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-non-git-'));

    try {
      // SDD 프로젝트 초기화만 수행
      await runCli(['init'], nonGitDir);

      // diff 실행
      const result = await runCli(['diff'], nonGitDir);

      expect(result.code).not.toBe(0);
      const output = result.stdout + result.stderr;
      expect(output).toContain('Git 저장소');
    } finally {
      await fs.rm(nonGitDir, { recursive: true, force: true });
    }
  });

  it('변경사항이 없으면 빈 diff를 출력한다', async () => {
    // 변경사항 없이 diff 실행
    const result = await runCli(['diff'], tempDir);

    expect(result.code).toBe(0);

    // 출력이 비어있거나 "변경사항 없음" 메시지를 포함해야 함
    const hasNoChanges =
      result.stdout.trim() === '' ||
      result.stdout.includes('변경사항') ||
      result.stdout.includes('없음') ||
      result.stdout.includes('0');

    expect(hasNoChanges).toBe(true);
  });
});
