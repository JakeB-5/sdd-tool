/**
 * reverse 명령어 핵심 로직 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  executeScanCommand,
  executeReviewCommand,
  executeFinalizeCommand,
} from '../../../../src/cli/commands/reverse.js';
import { validSpec, writeDraft } from '../../core/reverse/fixtures.js';

describe('reverse command core', () => {
  let root: string;
  let sddPath: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-reverse-cli-'));
    sddPath = path.join(root, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('scans a target path relative to the project root', async () => {
    await fs.mkdir(path.join(root, 'src', 'auth'), { recursive: true });
    await fs.writeFile(path.join(root, 'src', 'auth', 'login.ts'), 'x\n');

    const result = await executeScanCommand(path.join(root, 'src'), {}, root);
    if (!result.success) throw result.error;
    expect(result.data.root).toBe('src');
    expect(result.data.domains[0]).toMatchObject({ id: 'auth', path: 'src/auth', files: ['src/auth/login.ts'] });
  });

  it('rejects conflicting review flags', async () => {
    const both = await executeReviewCommand('auth/login', { approve: true, reject: true }, root);
    expect(both.success).toBe(false);

    const noRef = await executeReviewCommand(undefined, { approve: true }, root);
    expect(noRef.success).toBe(false);

    const reasonOnly = await executeReviewCommand('auth/login', { reason: 'x' }, root);
    expect(reasonOnly.success).toBe(false);
  });

  it('lists, shows, approves and rejects drafts', async () => {
    await writeDraft(sddPath, 'auth/login', validSpec('login'));

    const list = await executeReviewCommand(undefined, {}, root);
    expect(list.success && list.data.action).toBe('list');

    const detail = await executeReviewCommand('login', {}, root);
    expect(detail.success && detail.data.action).toBe('detail');

    const listFlag = await executeReviewCommand('login', { list: true }, root);
    expect(listFlag.success && listFlag.data.action).toBe('list');

    const rejected = await executeReviewCommand('auth/login', { reject: true, reason: 'nope' }, root);
    expect(rejected.success && rejected.data.action).toBe('rejected');

    const approved = await executeReviewCommand('auth/login', { approve: true }, root);
    expect(approved.success && approved.data.action).toBe('approved');
  });

  it('rejects a ref combined with --all on finalize', async () => {
    const result = await executeFinalizeCommand('auth/login', { all: true }, root);
    expect(result.success).toBe(false);
  });
});
