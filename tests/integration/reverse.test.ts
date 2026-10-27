/**
 * sdd reverse 통합 테스트 (빌드된 CLI 사용)
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
 * Windows EBUSY 문제 해결을 위한 재시도 삭제
 */
async function rmWithRetry(dir: string, retries = 3, delay = 100): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

/**
 * CLI 실행 헬퍼 (shell 없이 실행하여 인자를 그대로 전달)
 */
function runCli(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, [binPath, ...args], {
      cwd,
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });
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

const DRAFT = `---
id: login
title: Login
status: draft
created: 2026-01-01
domain: auth
depends: null
---

# Login

> Authenticates users with a username and password.

## Overview

Implemented in \`src/auth/login.ts\`.

## Requirements

### REQ-01: Credential check

The system SHALL reject a login when the password does not match.

## Scenarios

### Scenario 1: Wrong password

- **GIVEN** a registered user
- **WHEN** the user submits a wrong password
- **THEN** the login is rejected
`;

async function writeFile(root: string, rel: string, content: string): Promise<void> {
  const full = path.join(root, rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, 'utf-8');
}

describe('sdd reverse', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-reverse-test-'));
    await runCli(['init'], tempDir);
    await writeFile(
      tempDir,
      'src/auth/login.ts',
      'export function login(user: string, password: string): boolean {\n  return password === "secret";\n}\n'
    );
    await writeFile(tempDir, 'src/billing/invoice.ts', 'export const total = (xs: number[]) => xs.reduce((a, b) => a + b, 0);\n');
    await writeFile(tempDir, 'src/c++/engine.cpp', 'int main() { return 0; }\n');
  });

  afterEach(async () => {
    await rmWithRetry(tempDir);
  });

  it('prints help for scan/review/finalize only', async () => {
    const result = await runCli(['reverse', '--help'], tempDir);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('scan');
    expect(result.stdout).toContain('review');
    expect(result.stdout).toContain('finalize');
    expect(result.stdout).not.toContain('extract');
  });

  it('scan --json emits pure JSON with suggested domains', async () => {
    const result = await runCli(['reverse', 'scan', '--json'], tempDir);
    expect(result.code).toBe(0);

    const data = JSON.parse(result.stdout);
    expect(data.domains.map((d: { id: string }) => d.id).sort()).toEqual(['auth', 'billing', 'c']);
    expect(data.summary.languages).toEqual({ typescript: 2, cpp: 1 });
    expect(data.domains.find((d: { id: string }) => d.id === 'auth').files).toEqual(['src/auth/login.ts']);
  });

  it('scan accepts glob patterns with regex metacharacters', async () => {
    const result = await runCli(['reverse', 'scan', '--json', '--include', 'src/c++/**'], tempDir);
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout).summary.fileCount).toBe(1);
  });

  it('runs the draft → review → finalize flow', async () => {
    await writeFile(tempDir, '.sdd/.reverse-drafts/auth/login/spec.md', DRAFT);

    const validateDrafts = await runCli(['validate', '.sdd/.reverse-drafts'], tempDir);
    expect(validateDrafts.code).toBe(0);

    const list = await runCli(['reverse', 'review', '--list'], tempDir);
    expect(list.code).toBe(0);
    expect(list.stdout).toContain('auth/login');

    const approve = await runCli(['reverse', 'review', 'auth/login', '--approve'], tempDir);
    expect(approve.code).toBe(0);

    const finalize = await runCli(['reverse', 'finalize'], tempDir);
    expect(finalize.code).toBe(0);

    const specPath = path.join(tempDir, '.sdd', 'specs', 'auth', 'login', 'spec.md');
    expect(await fs.readFile(specPath, 'utf-8')).toBe(DRAFT);

    const domains = await fs.readFile(path.join(tempDir, '.sdd', 'domains.yml'), 'utf-8');
    expect(domains).toContain('auth');

    const validate = await runCli(['validate'], tempDir);
    expect(validate.code).toBe(0);

    // A second draft for the same spec must not overwrite it without --force
    const changed = DRAFT.replace('Authenticates users', 'Authenticates accounts');
    await writeFile(tempDir, '.sdd/.reverse-drafts/auth/login/spec.md', changed);
    expect((await runCli(['reverse', 'review', 'auth/login', '--approve'], tempDir)).code).toBe(0);

    const refused = await runCli(['reverse', 'finalize'], tempDir);
    expect(refused.code).not.toBe(0);
    expect(refused.stdout).toContain('--force');
    expect(await fs.readFile(specPath, 'utf-8')).toBe(DRAFT);

    const forced = await runCli(['reverse', 'finalize', '--force'], tempDir);
    expect(forced.code).toBe(0);
    expect(await fs.readFile(specPath, 'utf-8')).toBe(changed);
  });

  it('refuses to approve an invalid draft', async () => {
    await writeFile(tempDir, '.sdd/.reverse-drafts/auth/broken/spec.md', '---\nid: broken\n---\n\n# Broken\n');
    const approve = await runCli(['reverse', 'review', 'auth/broken', '--approve'], tempDir);
    expect(approve.code).not.toBe(0);
    expect(approve.stderr).toContain('검증에 실패한 초안');
  });

  it('reports a corrupt review.json without crashing', async () => {
    await writeFile(tempDir, '.sdd/.reverse-drafts/auth/login/spec.md', DRAFT);
    await writeFile(tempDir, '.sdd/.reverse-drafts/review.json', '{oops');
    const list = await runCli(['reverse', 'review', '--list'], tempDir);
    expect(list.code).toBe(1);
    expect(list.stderr).toContain('review.json');
    expect(list.stderr).toContain('손상');
    // No stack trace
    expect(list.stderr).not.toMatch(/\n\s+at /);
  });
});
