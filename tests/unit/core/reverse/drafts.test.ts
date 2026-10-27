/**
 * 역추출 초안 리뷰 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  listDrafts,
  approveDraft,
  rejectDraft,
  resolveDraft,
  loadReviewState,
  getDraftsDir,
} from '../../../../src/core/reverse/drafts.js';
import { validSpec, writeDraft } from './fixtures.js';

describe('draft review', () => {
  let root: string;
  let sddPath: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-drafts-'));
    sddPath = path.join(root, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('returns an empty list when there are no drafts', async () => {
    const result = await listDrafts(sddPath);
    expect(result).toEqual({ success: true, data: [] });
  });

  it('lists drafts of every status with validation results', async () => {
    await writeDraft(sddPath, 'auth/login', validSpec('login'));
    await writeDraft(sddPath, 'auth/logout', validSpec('logout', 'Logout'));
    await writeDraft(sddPath, 'billing/invoice', '---\nid: invoice\n---\n\n# Invoice\n\nno requirements\n');

    expect((await approveDraft(sddPath, 'auth/login')).success).toBe(true);
    expect((await rejectDraft(sddPath, 'logout', 'too vague')).success).toBe(true);

    const result = await listDrafts(sddPath);
    if (!result.success) throw result.error;
    const byId = Object.fromEntries(result.data.map((d) => [d.id, d]));

    expect(Object.keys(byId)).toEqual(['auth/login', 'auth/logout', 'billing/invoice']);
    expect(byId['auth/login'].status).toBe('approved');
    expect(byId['auth/login'].valid).toBe(true);
    expect(byId['auth/login'].title).toBe('Login');
    expect(byId['auth/logout'].status).toBe('rejected');
    expect(byId['auth/logout'].reason).toBe('too vague');
    expect(byId['billing/invoice'].status).toBe('pending');
    expect(byId['billing/invoice'].valid).toBe(false);
    expect(byId['billing/invoice'].errors.length).toBeGreaterThan(0);
  });

  it('refuses to approve drafts with validation errors', async () => {
    await writeDraft(sddPath, 'billing/invoice', '---\nid: invoice\n---\n\n# Invoice\n');
    const result = await approveDraft(sddPath, 'billing/invoice');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toContain('검증에 실패한 초안');
  });

  it('flags invalid domain ids and flat drafts', async () => {
    await writeDraft(sddPath, 'Auth_Module/login', validSpec('login'));
    await writeDraft(sddPath, 'flat', validSpec('flat'));

    const result = await listDrafts(sddPath);
    if (!result.success) throw result.error;
    const byId = Object.fromEntries(result.data.map((d) => [d.id, d]));
    expect(byId['Auth_Module/login'].valid).toBe(false);
    expect(byId['Auth_Module/login'].errors[0].message).toContain('유효하지 않은 도메인 ID');
    expect(byId['flat'].valid).toBe(false);

    expect((await approveDraft(sddPath, 'Auth_Module/login')).success).toBe(false);
  });

  it('requires a canonical feature id', async () => {
    await writeDraft(sddPath, 'auth/Login Flow', validSpec('Login Flow'));
    const result = await approveDraft(sddPath, 'auth/Login Flow');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toContain('유효하지 않은 기능 ID');
  });

  it('requires frontmatter id and domain to match the draft directory', async () => {
    await writeDraft(sddPath, 'auth/signup', validSpec('wrongid'));
    await writeDraft(sddPath, 'auth/login', validSpec('login').replace('status: draft', 'status: draft\ndomain: billing'));
    await writeDraft(sddPath, 'auth/logout', validSpec('logout').replace('status: draft', 'status: draft\ndomain: auth'));

    const list = await listDrafts(sddPath);
    if (!list.success) throw list.error;
    const byId = Object.fromEntries(list.data.map((d) => [d.id, d]));
    expect(byId['auth/signup'].errors.map((e) => e.code)).toContain('R005');
    expect(byId['auth/login'].errors.map((e) => e.code)).toContain('R006');
    expect(byId['auth/logout'].valid).toBe(true);

    expect((await approveDraft(sddPath, 'auth/signup')).success).toBe(false);
    expect((await approveDraft(sddPath, 'auth/login')).success).toBe(false);
  });

  it('rejects drafts reached through symlinks', async () => {
    const external = path.join(root, 'elsewhere');
    await fs.mkdir(path.join(external, 'login'), { recursive: true });
    await fs.writeFile(path.join(external, 'login', 'spec.md'), validSpec('login'));
    await fs.mkdir(getDraftsDir(sddPath), { recursive: true });
    await fs.symlink(external, path.join(getDraftsDir(sddPath), 'auth'), 'dir');

    const list = await listDrafts(sddPath);
    if (!list.success) throw list.error;
    expect(list.data[0].id).toBe('auth/login');
    expect(list.data[0].errors.map((e) => e.code)).toContain('R004');
    expect((await approveDraft(sddPath, 'auth/login')).success).toBe(false);
  });

  it('resets an approval when the draft changes afterwards', async () => {
    const file = await writeDraft(sddPath, 'auth/login', validSpec('login'));
    await approveDraft(sddPath, 'auth/login');
    await fs.writeFile(file, validSpec('login', 'Login v2'));

    const result = await listDrafts(sddPath);
    if (!result.success) throw result.error;
    expect(result.data[0].status).toBe('pending');
    expect(result.data[0].modifiedSinceReview).toBe(true);
  });

  it('resolves bare feature refs and reports ambiguity', async () => {
    await writeDraft(sddPath, 'auth/login', validSpec('login'));
    await writeDraft(sddPath, 'admin/login', validSpec('login'));
    await writeDraft(sddPath, 'auth/logout', validSpec('logout'));

    const list = await listDrafts(sddPath);
    if (!list.success) throw list.error;

    const unique = resolveDraft(list.data, 'logout');
    expect(unique.success && unique.data.id).toBe('auth/logout');

    const ambiguous = resolveDraft(list.data, 'login');
    expect(ambiguous.success).toBe(false);

    const missing = resolveDraft(list.data, 'nope');
    expect(missing.success).toBe(false);
    if (!missing.success) expect(missing.error.message).toContain('초안을 찾을 수 없습니다');
  });

  it('returns a clear error for a corrupt review.json instead of crashing', async () => {
    await writeDraft(sddPath, 'auth/login', validSpec('login'));
    await fs.writeFile(path.join(getDraftsDir(sddPath), 'review.json'), '{not json');

    const list = await listDrafts(sddPath);
    expect(list.success).toBe(false);
    if (!list.success) expect(list.error.message).toContain('손상');

    const approve = await approveDraft(sddPath, 'auth/login');
    expect(approve.success).toBe(false);
  });

  it('rejects review.json with an invalid schema', async () => {
    await fs.mkdir(getDraftsDir(sddPath), { recursive: true });
    await fs.writeFile(
      path.join(getDraftsDir(sddPath), 'review.json'),
      JSON.stringify({ version: 1, drafts: { 'auth/login': { status: 'maybe' } } })
    );
    const state = await loadReviewState(sddPath);
    expect(state.success).toBe(false);
    if (!state.success) expect(state.error.message).toContain('형식이 올바르지 않습니다');
  });
});
