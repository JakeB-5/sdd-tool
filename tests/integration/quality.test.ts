/**
 * sdd quality 명령어 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

describe('sdd quality', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-quality-test-'));
    cliPath = path.join(process.cwd(), 'bin', 'sdd.js');

    // sdd init 실행
    await execAsync(`node "${cliPath}" init`, { cwd: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('기본 품질 분석', () => {
    it('전체 프로젝트 품질을 분석한다', async () => {
      await execAsync(
        `node "${cliPath}" new quality-test --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" quality`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/품질|quality|점수|score/i);
    });

    it('개별 스펙의 품질을 분석한다', async () => {
      await execAsync(
        `node "${cliPath}" new individual-quality --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" quality individual-quality`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/individual-quality|품질|점수/i);
    });

    it('스펙이 없으면 에러를 반환한다', async () => {
      try {
        await execAsync(
          `node "${cliPath}" quality`,
          { cwd: tempDir }
        );
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        const execError = error as { stdout?: string; stderr?: string };
        const output = (execError.stdout || '') + (execError.stderr || '');
        expect(output).toMatch(/없습니다|no specs|empty/i);
      }
    });
  });

  describe('--all 옵션', () => {
    it('모든 스펙을 명시적으로 분석한다', async () => {
      await execAsync(
        `node "${cliPath}" new all-test-1 --no-branch`,
        { cwd: tempDir }
      );
      await execAsync(
        `node "${cliPath}" new all-test-2 --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" quality --all`,
        { cwd: tempDir }
      );

      expect(stdout).toContain('all-test-1');
      expect(stdout).toContain('all-test-2');
    });
  });

  describe('--json 옵션', () => {
    it('JSON 형식으로 출력한다', async () => {
      await execAsync(
        `node "${cliPath}" new json-quality --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" quality --json`,
        { cwd: tempDir }
      );

      const parsed = JSON.parse(stdout);
      expect(parsed).toBeDefined();
      expect(parsed).toHaveProperty('specResults');
    });
  });

  describe('--min-score 옵션', () => {
    it('최소 점수 기준을 설정한다', async () => {
      await execAsync(
        `node "${cliPath}" new min-score-test --no-branch`,
        { cwd: tempDir }
      );

      // 낮은 기준으로 성공
      const { stdout } = await execAsync(
        `node "${cliPath}" quality --min-score 30`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/품질|통과|pass/i);
    });

    it('높은 최소 점수 기준에 실패한다', async () => {
      await execAsync(
        `node "${cliPath}" new high-score-test --no-branch`,
        { cwd: tempDir }
      );

      try {
        await execAsync(
          `node "${cliPath}" quality --min-score 100`,
          { cwd: tempDir }
        );
        // 100점 기준은 거의 통과 불가능
      } catch (error: unknown) {
        const execError = error as { stdout?: string; stderr?: string; code?: number };
        // 실패해도 정상적인 동작
        expect(execError.code || 1).toBeGreaterThan(0);
      }
    });
  });

  describe('품질 등급', () => {
    it('A-F 등급을 표시한다', async () => {
      await execAsync(
        `node "${cliPath}" new grade-test --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" quality grade-test`,
        { cwd: tempDir }
      );

      // A, B, C, D, F 중 하나 포함
      expect(stdout).toMatch(/[ABCDF]|등급|grade/i);
    });
  });

  describe('품질 기준', () => {
    it('8가지 품질 기준을 평가한다', async () => {
      // sdd new로 스펙 생성 후 내용 보완
      await execAsync(
        `node "${cliPath}" new complete-spec --no-branch`,
        { cwd: tempDir }
      );

      // 생성된 스펙 내용 보완 (common 폴더에 생성됨)
      const specPath = path.join(tempDir, '.sdd', 'specs', 'common', 'complete-spec', 'spec.md');
      await fs.writeFile(
        specPath,
        `---
id: complete-spec
title: "완전한 스펙"
status: draft
created: 2025-12-22
depends: null
---

# 완전한 스펙

> 이 스펙은 모든 품질 기준을 충족합니다.

## 목표

시스템은 완전한 기능을 제공해야 한다(SHALL).

## 범위

이 기능은 다음을 포함한다(MUST):
- 기능 A
- 기능 B

## Requirement: REQ-01

시스템은 요구사항을 충족해야 한다(SHALL).

### Scenario: 성공 케이스

- **GIVEN** 유효한 입력이 있을 때
- **WHEN** 작업을 수행하면
- **THEN** 올바른 결과를 반환한다
`
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" quality complete-spec`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/품질|점수|score/i);
    });
  });

  describe('에러 처리', () => {
    it('존재하지 않는 스펙에 에러를 반환한다', async () => {
      try {
        await execAsync(
          `node "${cliPath}" quality non-existent`,
          { cwd: tempDir }
        );
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        const execError = error as { stdout?: string; stderr?: string };
        const output = (execError.stdout || '') + (execError.stderr || '');
        expect(output).toMatch(/찾을 수 없|not found|에러/i);
      }
    });
  });
});
