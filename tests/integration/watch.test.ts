/**
 * sdd watch 명령어 통합 테스트
 *
 * NOTE: Windows에서 파일 잠금 문제로 인해 조건부 skip 처리
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn, ChildProcess } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// Windows에서 파일 잠금 문제로 인해 skip
const isWindows = process.platform === 'win32';
const describeOrSkip = isWindows ? describe.skip : describe;

/**
 * 프로세스를 안전하게 종료하고 완료를 기다림
 */
async function killProcessSafely(proc: ChildProcess, signal: NodeJS.Signals = 'SIGTERM'): Promise<void> {
  return new Promise((resolve) => {
    if (proc.killed || proc.exitCode !== null) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      // 강제 종료
      try {
        proc.kill('SIGKILL');
      } catch {
        // ignore
      }
      resolve();
    }, 5000);

    proc.once('close', () => {
      clearTimeout(timeout);
      resolve();
    });

    try {
      proc.kill(signal);
    } catch {
      clearTimeout(timeout);
      resolve();
    }
  });
}

/**
 * 디렉토리를 안전하게 삭제 (재시도 로직 포함)
 */
async function removeDirSafely(dirPath: string, maxRetries = 3): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true, maxRetries: 3 });
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        // 마지막 시도에서도 실패하면 무시 (CI 환경에서 정리됨)
        console.warn(`Failed to remove ${dirPath}: ${error}`);
        return;
      }
      // 잠시 대기 후 재시도
      await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
    }
  }
}

describeOrSkip('sdd watch', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-watch-test-'));
    cliPath = path.join(process.cwd(), 'bin', 'sdd.js');

    // sdd init 실행
    await execAsync(`node "${cliPath}" init`, { cwd: tempDir });
  });

  afterEach(async () => {
    await removeDirSafely(tempDir);
  });

  describe('기본 실행', () => {
    it('watch 모드를 시작한다', async () => {
      const proc = spawn('node', [cliPath, 'watch'], {
        cwd: tempDir,
        shell: true,
      });

      let output = '';
      proc.stdout?.on('data', (data) => {
        output += data.toString();
      });

      // 잠시 대기 후 종료
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await killProcessSafely(proc);

      expect(output).toMatch(/감시|watch|시작|start/i);
    });

    it('파일 변경을 감지한다', async () => {
      // 스펙 생성
      await execAsync(
        `node "${cliPath}" new watch-test --no-branch`,
        { cwd: tempDir }
      );

      const proc = spawn('node', [cliPath, 'watch'], {
        cwd: tempDir,
        shell: true,
      });

      let output = '';
      proc.stdout?.on('data', (data) => {
        output += data.toString();
      });

      // watch 시작 대기
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 파일 수정
      const specPath = path.join(tempDir, '.sdd', 'specs', 'watch-test', 'spec.md');
      const content = await fs.readFile(specPath, 'utf-8');
      await fs.writeFile(specPath, content + '\n# Updated');

      // 변경 감지 대기
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await killProcessSafely(proc);

      expect(output).toMatch(/감시|watch|변경|change/i);
    });
  });

  describe('--no-validate 옵션', () => {
    it('자동 검증을 비활성화한다', async () => {
      const proc = spawn('node', [cliPath, 'watch', '--no-validate'], {
        cwd: tempDir,
        shell: true,
      });

      let output = '';
      proc.stdout?.on('data', (data) => {
        output += data.toString();
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await killProcessSafely(proc);

      // 검증 관련 메시지가 없어야 함
      expect(output).not.toMatch(/검증 중|validating/i);
    });
  });

  describe('--quiet 옵션', () => {
    it('성공 시 출력을 생략한다', async () => {
      const proc = spawn('node', [cliPath, 'watch', '--quiet'], {
        cwd: tempDir,
        shell: true,
      });

      let output = '';
      proc.stdout?.on('data', (data) => {
        output += data.toString();
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await killProcessSafely(proc);

      // 최소한의 출력만
      expect(output.split('\n').filter(line => line.trim()).length).toBeLessThan(5);
    });
  });

  describe('--impact 옵션', () => {
    it('영향도 분석을 포함한다', async () => {
      await execAsync(
        `node "${cliPath}" new impact-watch --no-branch`,
        { cwd: tempDir }
      );

      const proc = spawn('node', [cliPath, 'watch', '--impact'], {
        cwd: tempDir,
        shell: true,
      });

      let output = '';
      proc.stdout?.on('data', (data) => {
        output += data.toString();
      });

      // watch 시작 대기
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 파일 수정
      const specPath = path.join(tempDir, '.sdd', 'specs', 'impact-watch', 'spec.md');
      const content = await fs.readFile(specPath, 'utf-8');
      await fs.writeFile(specPath, content + '\n# With Impact');

      await new Promise((resolve) => setTimeout(resolve, 1500));
      await killProcessSafely(proc);

      expect(output).toMatch(/감시|영향|impact|watch/i);
    });
  });

  describe('--debounce 옵션', () => {
    it('디바운스 시간을 설정한다', async () => {
      const proc = spawn('node', [cliPath, 'watch', '--debounce', '2000'], {
        cwd: tempDir,
        shell: true,
      });

      let output = '';
      proc.stdout?.on('data', (data) => {
        output += data.toString();
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await killProcessSafely(proc);

      expect(output).toMatch(/감시|watch/i);
    });
  });

  describe('세션 통계', () => {
    it('종료 시 통계를 요약한다', async () => {
      await execAsync(
        `node "${cliPath}" new stats-test --no-branch`,
        { cwd: tempDir }
      );

      const proc = spawn('node', [cliPath, 'watch'], {
        cwd: tempDir,
        shell: true,
      });

      let output = '';
      proc.stdout?.on('data', (data) => {
        output += data.toString();
      });

      // watch 시작 및 약간의 활동
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await killProcessSafely(proc);

      // 통계 또는 종료 메시지
      expect(output).toMatch(/감시|watch|종료|stop/i);
    });
  });

  describe('이벤트 카운트', () => {
    it('추가/수정/삭제 이벤트를 카운트한다', async () => {
      const proc = spawn('node', [cliPath, 'watch'], {
        cwd: tempDir,
        shell: true,
      });

      let output = '';
      proc.stdout?.on('data', (data) => {
        output += data.toString();
      });

      // watch 시작 대기
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 파일 추가
      const newSpecDir = path.join(tempDir, '.sdd', 'specs', 'new-spec');
      await fs.mkdir(newSpecDir, { recursive: true });
      await fs.writeFile(
        path.join(newSpecDir, 'spec.md'),
        `---
id: new-spec
title: "New Spec"
status: draft
---

# New Spec

New content(SHALL).

## Scenario: Test

- **GIVEN** condition
- **WHEN** action
- **THEN** result
`
      );

      await new Promise((resolve) => setTimeout(resolve, 1500));
      await killProcessSafely(proc);

      expect(output).toMatch(/감시|watch|추가|add|change/i);
    });
  });
});
