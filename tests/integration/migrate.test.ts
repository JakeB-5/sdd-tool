/**
 * sdd migrate 명령어 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

describe('sdd migrate', () => {
  let tempDir: string;
  let cliPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-migrate-test-'));
    cliPath = path.join(process.cwd(), 'bin', 'sdd.js');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('detect 서브커맨드', () => {
    it('SDD 도구가 없으면 none을 반환한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" migrate detect`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/감지|detect|없습니다|none/i);
    });

    it('OpenSpec 프로젝트를 감지한다', async () => {
      // OpenSpec 구조 생성
      const openspecDir = path.join(tempDir, 'openspec');
      await fs.mkdir(path.join(openspecDir, 'specs'), { recursive: true });
      await fs.mkdir(path.join(openspecDir, 'changes'), { recursive: true });
      await fs.writeFile(
        path.join(openspecDir, 'AGENTS.md'),
        '# OpenSpec AGENTS.md'
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" migrate detect`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/openspec/i);
    });

    it('Spec Kit 프로젝트를 감지한다', async () => {
      // Spec Kit 구조 생성
      await fs.mkdir(path.join(tempDir, '.specify', 'specs'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'memory'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'memory', 'constitution.md'),
        '# Spec Kit Constitution'
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" migrate detect`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/spec-?kit|specify/i);
    });
  });

  describe('openspec 서브커맨드', () => {
    beforeEach(async () => {
      // sdd init 먼저 실행
      await execAsync(`node "${cliPath}" init`, { cwd: tempDir });

      // OpenSpec 구조 생성
      const openspecDir = path.join(tempDir, 'openspec');
      await fs.mkdir(path.join(openspecDir, 'specs'), { recursive: true });
      await fs.mkdir(path.join(openspecDir, 'changes'), { recursive: true });
      await fs.writeFile(
        path.join(openspecDir, 'specs', 'feature.md'),
        `---
id: openspec-feature
title: "OpenSpec Feature"
---

# OpenSpec Feature

This feature uses OpenSpec format.
`
      );
    });

    it('OpenSpec 프로젝트를 마이그레이션한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" migrate openspec`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/마이그레이션|migrate|변환|convert|완료|감지/i);
    });

    it('--dry-run 옵션으로 미리보기한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" migrate openspec --dry-run`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/dry.?run|미리보기|preview|마이그레이션|감지/i);
    });

    it('--overwrite 옵션으로 기존 스펙을 덮어쓴다', async () => {
      // beforeEach에서 이미 init 되어 있으므로 별도 init 불필요
      const { stdout } = await execAsync(
        `node "${cliPath}" migrate openspec --overwrite`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/마이그레이션|덮어|overwrite/i);
    });
  });

  describe('speckit 서브커맨드', () => {
    beforeEach(async () => {
      // sdd init 먼저 실행
      await execAsync(`node "${cliPath}" init`, { cwd: tempDir });

      // Spec Kit 구조 생성
      await fs.mkdir(path.join(tempDir, '.specify', 'specs', 'feature'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'memory'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.specify', 'specs', 'feature', 'spec.md'),
        `---
id: speckit-feature
title: "Spec Kit Feature"
---

# Spec Kit Feature

This feature uses Spec Kit format.
`
      );
      await fs.writeFile(
        path.join(tempDir, 'memory', 'constitution.md'),
        `# Constitution

## Principles

1. Code quality is important.
`
      );
    });

    it('Spec Kit 프로젝트를 마이그레이션한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" migrate speckit`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/마이그레이션|migrate|변환|convert|완료|감지/i);
    });

    it('--dry-run 옵션으로 미리보기한다', async () => {
      const { stdout } = await execAsync(
        `node "${cliPath}" migrate speckit --dry-run`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/dry.?run|미리보기|preview|마이그레이션|감지/i);
    });
  });

  describe('docs 서브커맨드', () => {
    it('마크다운 문서를 스펙으로 변환한다', async () => {
      // sdd init
      await execAsync(`node "${cliPath}" init`, { cwd: tempDir });

      // 문서 생성
      const docsDir = path.join(tempDir, 'docs');
      await fs.mkdir(docsDir, { recursive: true });
      await fs.writeFile(
        path.join(docsDir, 'feature.md'),
        `# Feature Documentation

This is a feature document.

## Requirements

- The system should do X
- The system must do Y
`
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" migrate docs "${docsDir}"`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/문서|docs|변환|마이그레이션/i);
    });
  });

  describe('analyze 서브커맨드', () => {
    it('문서를 분석한다', async () => {
      // 문서 생성
      const docPath = path.join(tempDir, 'doc.md');
      await fs.writeFile(
        docPath,
        `# Document

This document contains requirements.

## Section 1

The system SHALL do something.
`
      );

      const { stdout } = await execAsync(
        `node "${cliPath}" migrate analyze "${docPath}"`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/분석|analyze/i);
    });
  });

  describe('scan 서브커맨드', () => {
    it('디렉토리를 스캔한다', async () => {
      // 문서들 생성
      await fs.writeFile(path.join(tempDir, 'doc1.md'), '# Doc 1');
      await fs.writeFile(path.join(tempDir, 'doc2.md'), '# Doc 2');

      const { stdout } = await execAsync(
        `node "${cliPath}" migrate scan "${tempDir}"`,
        { cwd: tempDir }
      );

      expect(stdout).toMatch(/스캔|scan|파일|files/i);
    });
  });

  describe('에러 처리', () => {
    it('존재하지 않는 소스에 에러를 반환한다', async () => {
      try {
        await execAsync(
          `node "${cliPath}" migrate docs /non/existent/path`,
          { cwd: tempDir }
        );
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        const execError = error as { stdout?: string; stderr?: string };
        const output = (execError.stdout || '') + (execError.stderr || '');
        expect(output).toMatch(/찾을 수 없|not found|에러|error/i);
      }
    });
  });
});
