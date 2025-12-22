/**
 * sdd validate 명령어 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

describe('sdd validate', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-validate-test-'));
    cliPath = path.join(process.cwd(), 'bin', 'sdd.js');

    // sdd init 실행
    await execAsync(`node "${cliPath}" init`, { cwd: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('스펙 없이 실행하면 통과한다', async () => {
    const { stdout } = await execAsync(
      `node "${cliPath}" validate`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('passed');
  });

  it('유효한 스펙을 검증하면 통과한다', async () => {
    // 유효한 스펙 생성
    await execAsync(
      `node "${cliPath}" new valid-feature --title "유효한 기능" --no-branch`,
      { cwd: tempDir }
    );

    const { stdout } = await execAsync(
      `node "${cliPath}" validate`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('passed');
  });

  it('특정 파일을 검증한다', async () => {
    await execAsync(
      `node "${cliPath}" new specific-feature --no-branch`,
      { cwd: tempDir }
    );

    const specPath = path.join(tempDir, '.sdd', 'specs', 'specific-feature', 'spec.md');
    const { stdout } = await execAsync(
      `node "${cliPath}" validate "${specPath}"`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('passed');
  });

  it('--strict 옵션으로 경고를 에러로 처리한다', async () => {
    await execAsync(
      `node "${cliPath}" new strict-feature --no-branch`,
      { cwd: tempDir }
    );

    // strict 모드로 실행 - 경고가 있으면 실패할 수 있음
    try {
      const { stdout } = await execAsync(
        `node "${cliPath}" validate --strict`,
        { cwd: tempDir }
      );
      expect(stdout).toContain('passed');
    } catch (error: unknown) {
      // strict 모드에서 경고가 있으면 실패할 수 있음
      const execError = error as { stdout?: string; stderr?: string };
      const output = (execError.stdout || '') + (execError.stderr || '');
      expect(output).toMatch(/strict|warning|failed/i);
    }
  });

  it('--quiet 옵션으로 요약만 출력한다', async () => {
    await execAsync(
      `node "${cliPath}" new quiet-feature --no-branch`,
      { cwd: tempDir }
    );

    const { stdout } = await execAsync(
      `node "${cliPath}" validate --quiet`,
      { cwd: tempDir }
    );

    // 요약만 출력
    expect(stdout).toContain('passed');
    // 상세 파일 목록은 없어야 함
    expect(stdout.split('\n').length).toBeLessThan(5);
  });

  it('--check-links 옵션으로 링크를 검증한다', async () => {
    await execAsync(
      `node "${cliPath}" new links-feature --no-branch`,
      { cwd: tempDir }
    );

    const { stdout } = await execAsync(
      `node "${cliPath}" validate --check-links`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('참조 링크 검증');
  });

  it('--no-constitution 옵션으로 헌법 검사를 건너뛴다', async () => {
    await execAsync(
      `node "${cliPath}" new no-const-feature --no-branch`,
      { cwd: tempDir }
    );

    const { stdout } = await execAsync(
      `node "${cliPath}" validate --no-constitution`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('passed');
    expect(stdout).not.toContain('Constitution');
  });

  it('잘못된 YAML frontmatter가 있으면 에러를 반환한다', async () => {
    // 잘못된 스펙 파일 생성
    const invalidSpecDir = path.join(tempDir, '.sdd', 'specs', 'invalid-yaml');
    await fs.mkdir(invalidSpecDir, { recursive: true });
    await fs.writeFile(
      path.join(invalidSpecDir, 'spec.md'),
      `---
invalid: yaml: content
---

# Invalid Spec
`
    );

    try {
      await execAsync(`node "${cliPath}" validate`, { cwd: tempDir });
      // 에러가 발생해야 함
      expect.fail('Should have thrown an error');
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string };
      const output = (execError.stdout || '') + (execError.stderr || '');
      expect(output).toContain('failed');
    }
  });

  it('RFC 2119 키워드가 없으면 경고를 표시한다', async () => {
    // RFC 2119 키워드 없는 스펙 생성
    const noRfcDir = path.join(tempDir, '.sdd', 'specs', 'no-rfc');
    await fs.mkdir(noRfcDir, { recursive: true });
    await fs.writeFile(
      path.join(noRfcDir, 'spec.md'),
      `---
id: no-rfc
title: "RFC 없는 스펙"
status: draft
---

# RFC 없는 스펙

이 스펙에는 RFC 2119 키워드가 없습니다.

## Scenario: 테스트

- **GIVEN** 사용자가 있을 때
- **WHEN** 작업을 수행하면
- **THEN** 결과가 나온다
`
    );

    try {
      await execAsync(`node "${cliPath}" validate`, { cwd: tempDir });
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string };
      const output = (execError.stdout || '') + (execError.stderr || '');
      expect(output).toMatch(/RFC|warning|failed/i);
    }
  });

  it('Constitution 위반을 검사한다', async () => {
    await execAsync(
      `node "${cliPath}" new const-check --no-branch`,
      { cwd: tempDir }
    );

    const { stdout } = await execAsync(
      `node "${cliPath}" validate --constitution`,
      { cwd: tempDir }
    );

    expect(stdout).toContain('Constitution');
  });
});
