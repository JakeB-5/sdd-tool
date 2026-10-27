/**
 * 역추출 초안 확정 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { approveDraft, loadReviewState, getDraftsDir } from '../../../../src/core/reverse/drafts.js';
import { finalizeDrafts } from '../../../../src/core/reverse/finalize.js';
import { createDomainService } from '../../../../src/core/domain/service.js';
import { validSpec, writeDraft } from './fixtures.js';

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

describe('finalizeDrafts', () => {
  let root: string;
  let sddPath: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-finalize-'));
    sddPath = path.join(root, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('moves approved drafts, registers the domain and removes the draft', async () => {
    const draftFile = await writeDraft(sddPath, 'auth/login', validSpec('login'));
    await writeDraft(sddPath, 'auth/logout', validSpec('logout', 'Logout'));
    await approveDraft(sddPath, 'auth/login');

    const result = await finalizeDrafts(root);
    if (!result.success) throw result.error;

    expect(result.data.finalized).toEqual([
      {
        id: 'auth/login',
        specPath: path.join('.sdd', 'specs', 'auth', 'login', 'spec.md'),
        domainCreated: true,
        overwritten: false,
      },
    ]);
    const target = path.join(sddPath, 'specs', 'auth', 'login', 'spec.md');
    expect(await fs.readFile(target, 'utf-8')).toBe(validSpec('login'));
    expect(await exists(draftFile)).toBe(false);
    // Pending sibling draft is untouched
    expect(await exists(path.join(getDraftsDir(sddPath), 'auth', 'logout', 'spec.md'))).toBe(true);

    const domain = await createDomainService(root).get('auth');
    expect(domain.success && domain.data?.specs).toEqual(['login']);

    const state = await loadReviewState(sddPath);
    expect(state.success && state.data.drafts).toEqual({});
  });

  it('reuses an existing domain', async () => {
    await createDomainService(root).create('auth', { description: 'Auth' });
    await writeDraft(sddPath, 'auth/login', validSpec('login'));
    await approveDraft(sddPath, 'auth/login');

    const result = await finalizeDrafts(root);
    if (!result.success) throw result.error;
    expect(result.data.finalized[0].domainCreated).toBe(false);
  });

  it('removes the empty draft domain directory', async () => {
    await writeDraft(sddPath, 'auth/login', validSpec('login'));
    await approveDraft(sddPath, 'auth/login');
    await finalizeDrafts(root);
    expect(await exists(path.join(getDraftsDir(sddPath), 'auth'))).toBe(false);
  });

  it('refuses to overwrite an existing spec without --force', async () => {
    const target = path.join(sddPath, 'specs', 'auth', 'login', 'spec.md');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, 'original');

    const draftFile = await writeDraft(sddPath, 'auth/login', validSpec('login'));
    await approveDraft(sddPath, 'auth/login');

    const refused = await finalizeDrafts(root);
    if (!refused.success) throw refused.error;
    expect(refused.data.finalized).toEqual([]);
    expect(refused.data.skipped[0].id).toBe('auth/login');
    expect(await fs.readFile(target, 'utf-8')).toBe('original');
    expect(await exists(draftFile)).toBe(true);

    const forced = await finalizeDrafts(root, { force: true });
    if (!forced.success) throw forced.error;
    expect(forced.data.finalized[0].overwritten).toBe(true);
    expect(await fs.readFile(target, 'utf-8')).toBe(validSpec('login'));
  });

  it('finalizes a single ref and refuses unapproved drafts', async () => {
    await writeDraft(sddPath, 'auth/login', validSpec('login'));
    await writeDraft(sddPath, 'auth/logout', validSpec('logout'));
    await approveDraft(sddPath, 'auth/login');
    await approveDraft(sddPath, 'auth/logout');

    const pending = await writeDraft(sddPath, 'billing/invoice', validSpec('invoice'));
    const refused = await finalizeDrafts(root, { ref: 'billing/invoice' });
    expect(refused.success).toBe(false);
    if (!refused.success) expect(refused.error.message).toContain('승인되지 않은 초안');
    expect(await exists(pending)).toBe(true);

    const single = await finalizeDrafts(root, { ref: 'logout' });
    if (!single.success) throw single.error;
    expect(single.data.finalized.map((f) => f.id)).toEqual(['auth/logout']);
    expect(await exists(path.join(sddPath, 'specs', 'auth', 'login', 'spec.md'))).toBe(false);
  });

  it('returns an empty result when nothing is approved', async () => {
    await writeDraft(sddPath, 'auth/login', validSpec('login'));
    const result = await finalizeDrafts(root);
    expect(result).toEqual({ success: true, data: { finalized: [], skipped: [], errors: [], warnings: [] } });
  });

  describe('symlink safety', () => {
    /** Force an approval entry into review.json, bypassing approveDraft's validation gate */
    async function forceApprove(ref: string, content: string): Promise<void> {
      const hash = createHash('sha256').update(content).digest('hex');
      await fs.mkdir(getDraftsDir(sddPath), { recursive: true });
      await fs.writeFile(
        path.join(getDraftsDir(sddPath), 'review.json'),
        JSON.stringify({ version: 1, drafts: { [ref]: { status: 'approved', hash, reviewedAt: 'x' } } })
      );
    }

    it('does not delete the real spec when a draft domain links into .sdd/specs', async () => {
      const realSpec = path.join(sddPath, 'specs', 'auth', 'login', 'spec.md');
      await fs.mkdir(path.dirname(realSpec), { recursive: true });
      await fs.writeFile(realSpec, validSpec('login'));
      await fs.mkdir(getDraftsDir(sddPath), { recursive: true });
      await fs.symlink(path.join('..', 'specs', 'auth'), path.join(getDraftsDir(sddPath), 'auth'), 'dir');

      const approve = await approveDraft(sddPath, 'auth/login');
      expect(approve.success).toBe(false);

      await forceApprove('auth/login', validSpec('login'));
      const result = await finalizeDrafts(root, { force: true });
      if (!result.success) throw result.error;
      expect(result.data.finalized).toEqual([]);
      expect(result.data.errors.map((e) => e.id)).toEqual(['auth/login']);
      expect(await fs.readFile(realSpec, 'utf-8')).toBe(validSpec('login'));
    });

    it('does not delete external files when a draft domain links outside the project', async () => {
      const external = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-external-'));
      try {
        const externalSpec = path.join(external, 'login', 'spec.md');
        await fs.mkdir(path.dirname(externalSpec), { recursive: true });
        await fs.writeFile(externalSpec, validSpec('login'));
        await fs.mkdir(getDraftsDir(sddPath), { recursive: true });
        await fs.symlink(external, path.join(getDraftsDir(sddPath), 'auth'), 'dir');

        expect((await approveDraft(sddPath, 'auth/login')).success).toBe(false);

        await forceApprove('auth/login', validSpec('login'));
        const result = await finalizeDrafts(root, { force: true });
        if (!result.success) throw result.error;
        expect(result.data.finalized).toEqual([]);
        expect(await fs.readFile(externalSpec, 'utf-8')).toBe(validSpec('login'));
        expect(await exists(path.join(sddPath, 'specs', 'auth', 'login', 'spec.md'))).toBe(false);
      } finally {
        await fs.rm(external, { recursive: true, force: true });
      }
    });

    it('refuses to finalize onto a target that links back into the drafts directory', async () => {
      const draftFile = await writeDraft(sddPath, 'auth/login', validSpec('login'));
      await approveDraft(sddPath, 'auth/login');
      await fs.mkdir(path.join(sddPath, 'specs'), { recursive: true });
      await fs.symlink(path.join('..', '.reverse-drafts', 'auth'), path.join(sddPath, 'specs', 'auth'), 'dir');

      const result = await finalizeDrafts(root, { force: true });
      if (!result.success) throw result.error;
      expect(result.data.finalized).toEqual([]);
      expect(result.data.errors[0].error).toContain('겹칩니다');
      expect(await fs.readFile(draftFile, 'utf-8')).toBe(validSpec('login'));
    });
  });

  describe('partial failures', () => {
    it('does not register the domain when the copy fails', async () => {
      // A file where the spec directory should be makes mkdir/copy fail
      await fs.mkdir(path.join(sddPath, 'specs', 'auth'), { recursive: true });
      await fs.writeFile(path.join(sddPath, 'specs', 'auth', 'login'), 'not a directory');
      const draftFile = await writeDraft(sddPath, 'auth/login', validSpec('login'));
      await approveDraft(sddPath, 'auth/login');

      const result = await finalizeDrafts(root);
      if (!result.success) throw result.error;
      expect(result.data.finalized).toEqual([]);
      expect(result.data.errors[0].error).toContain('스펙 복사 실패');
      expect(await exists(draftFile)).toBe(true);

      const domain = await createDomainService(root).get('auth');
      expect(domain.success && domain.data).toBeUndefined();
      const state = await loadReviewState(sddPath);
      expect(state.success && state.data.drafts['auth/login']?.status).toBe('approved');
    });

    it('downgrades post-move cleanup problems to warnings and clears the review entry', async () => {
      const draftFile = await writeDraft(sddPath, 'auth/login', validSpec('login'));
      const notes = path.join(path.dirname(draftFile), 'notes.md');
      await fs.writeFile(notes, 'keep me');
      await approveDraft(sddPath, 'auth/login');

      const result = await finalizeDrafts(root);
      if (!result.success) throw result.error;
      expect(result.data.finalized.map((f) => f.id)).toEqual(['auth/login']);
      expect(result.data.errors).toEqual([]);
      expect(result.data.warnings[0].message).toContain('다른 파일이 남아');
      expect(await exists(draftFile)).toBe(false);
      expect(await fs.readFile(notes, 'utf-8')).toBe('keep me');

      const state = await loadReviewState(sddPath);
      expect(state.success && state.data.drafts).toEqual({});
    });
  });
});
