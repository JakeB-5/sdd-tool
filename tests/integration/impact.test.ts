/**
 * sdd impact 명령어 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

describe('sdd impact', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-impact-test-'));
    cliPath = path.join(process.cwd(), 'bin', 'sdd.js');

    // sdd init 실행
    await execAsync(`node "${cliPath}" init`, { cwd: tempDir });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('기본 영향도 분석', () => {
    it('기능의 영향도를 분석한다', async () => {
      // 기능 생성
      await execAsync(
        `node "${cliPath}" new auth --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" impact auth`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/영향|impact|분석/i);
    });

    it('존재하지 않는 기능에 에러를 반환한다', async () => {
      try {
        await execAsync(
          `node "${cliPath}" impact non-existent`,
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

  describe('--graph 옵션', () => {
    it('Mermaid 그래프를 출력한다', async () => {
      await execAsync(
        `node "${cliPath}" new graph-test --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" impact graph-test --graph`,
        { cwd: tempDir }
      );

      // Mermaid 문법이 포함되어야 함
      expect(stdout).toMatch(/graph|flowchart|mermaid|─|→/i);
    });
  });

  describe('--code 옵션', () => {
    it('코드 영향도를 분석한다', async () => {
      await execAsync(
        `node "${cliPath}" new code-impact --no-branch`,
        { cwd: tempDir }
      );

      // 소스 파일 생성 (스펙 참조 포함)
      const srcDir = path.join(tempDir, 'src');
      await fs.mkdir(srcDir, { recursive: true });
      await fs.writeFile(
        path.join(srcDir, 'feature.ts'),
        `// @spec: code-impact\nexport function feature() {}`
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" impact code-impact --code`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/코드|code|파일|file/i);
    });
  });

  describe('--json 옵션', () => {
    it('JSON 형식으로 출력한다', async () => {
      await execAsync(
        `node "${cliPath}" new json-impact --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" impact json-impact --json`,
        { cwd: tempDir }
      );

      // JSON 파싱 가능해야 함
      const parsed = JSON.parse(stdout);
      expect(parsed).toBeDefined();
    });
  });

  describe('report 서브커맨드', () => {
    it('전체 프로젝트 영향도 리포트를 생성한다', async () => {
      await execAsync(
        `node "${cliPath}" new report-test --no-branch`,
        { cwd: tempDir }
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" impact report`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/리포트|report|분석/i);
    });
  });

  describe('change 서브커맨드', () => {
    it('변경 제안의 영향도를 분석한다', async () => {
      // 변경 제안 생성
      await execAsync(
        `node "${cliPath}" change -t "영향도 테스트"`,
        { cwd: tempDir }
      );

      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      const changeId = changes[0];

      const { stdout } = await execAsync(
        `node "${cliPath}" impact change ${changeId}`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/영향|impact|변경/i);
    });
  });

  describe('simulate 서브커맨드', () => {
    it('What-if 시뮬레이션을 수행한다', async () => {
      await execAsync(
        `node "${cliPath}" new simulate-base --no-branch`,
        { cwd: tempDir }
      );

      // 변경 제안 생성
      await execAsync(
        `node "${cliPath}" change -t "시뮬레이션 테스트"`,
        { cwd: tempDir }
      );

      const changesPath = path.join(tempDir, '.sdd', 'changes');
      const changes = await fs.readdir(changesPath);
      const changeId = changes[0];

      const { stdout } = await execAsync(
        `node "${cliPath}" impact simulate simulate-base ${changeId}`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/시뮬레이션|simulate|영향/i);
    });
  });

  describe('의존성 분석', () => {
    it('의존하는 스펙을 분석한다', async () => {
      // 기본 스펙 생성
      await execAsync(
        `node "${cliPath}" new base-feature --no-branch`,
        { cwd: tempDir }
      );

      // 의존하는 스펙 생성 (depends 설정)
      const dependentDir = path.join(tempDir, '.sdd', 'specs', 'dependent-feature');
      await fs.mkdir(dependentDir, { recursive: true });
      await fs.writeFile(
        path.join(dependentDir, 'spec.md'),
        `---
id: dependent-feature
title: "의존 기능"
status: draft
depends:
  - base-feature
---

# 의존 기능

이 기능은 base-feature에 의존합니다(SHALL).

## Scenario: 의존성 테스트

- **GIVEN** base-feature가 구현되어 있을 때
- **WHEN** 이 기능을 사용하면
- **THEN** 정상 동작한다
`
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" impact base-feature`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/의존|depend|영향/i);
    });
  });
});
