/**
 * 프로젝트 스캐너 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scanProject, toDomainId } from '../../../../src/core/reverse/scanner.js';

async function write(root: string, rel: string, content = 'line1\nline2\n'): Promise<void> {
  const full = path.join(root, rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content);
}

describe('scanProject', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-scan-'));
    await write(root, 'src/auth/login.ts', 'a\nb\nc\n');
    await write(root, 'src/auth/session.ts', 'a\nb');
    await write(root, 'src/billing/invoice.py', 'x\n');
    await write(root, 'src/billing/README.md', '# billing\n');
    await write(root, 'src/utils/strings.ts', 'u\n');
    await write(root, 'src/c++/engine.cpp', 'int main() {}\n');
    await write(root, 'src/index.ts', 'export {};\n');
    await write(root, 'src/auth/login.test.ts', 't\n');
    await write(root, 'node_modules/dep/index.js', 'ignored\n');
    await write(root, '.hidden/secret.ts', 'ignored\n');
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('reports real file, line and language counts', async () => {
    const result = await scanProject(root);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const { summary } = result.data;
    expect(summary.fileCount).toBe(8);
    expect(summary.sourceFileCount).toBe(7);
    // 3 + 2 + 1 + 1 + 1 + 1 + 1 lines (README is not a source file)
    expect(summary.lines).toBe(10);
    expect(summary.languages).toEqual({ typescript: 5, python: 1, cpp: 1 });
  });

  it('suggests directory-based domains with per-domain file lists', async () => {
    const result = await scanProject(root);
    if (!result.success) throw result.error;

    const ids = result.data.domains.map((d) => d.id);
    expect(ids).toEqual(['auth', 'billing', 'c']);

    const auth = result.data.domains[0];
    expect(auth.path).toBe('src/auth');
    expect(auth.files).toEqual(['src/auth/login.test.ts', 'src/auth/login.ts', 'src/auth/session.ts']);
    expect(auth.fileCount).toBe(3);
    expect(auth.lines).toBe(6);
    expect(auth.languages).toEqual({ typescript: 3 });

    // utils is not a domain; root-level src files are unassigned
    expect(result.data.unassigned.sort()).toEqual(['src/index.ts', 'src/utils/strings.ts']);
  });

  it('treats --include patterns as globs (no RegExp crash on c++)', async () => {
    const result = await scanProject(root, { include: ['src/c++/**'] });
    if (!result.success) throw result.error;
    expect(result.data.summary.fileCount).toBe(1);
    expect(result.data.domains[0].files).toEqual(['src/c++/engine.cpp']);
  });

  it('matches basename-only globs anywhere and applies excludes', async () => {
    const result = await scanProject(root, { include: ['*.ts'], exclude: ['*.test.ts'] });
    if (!result.success) throw result.error;
    expect(result.data.summary.fileCount).toBe(4);
    expect(result.data.domains.find((d) => d.id === 'auth')?.files).toEqual([
      'src/auth/login.ts',
      'src/auth/session.ts',
    ]);
  });

  it('filters by language id or extension, not by path substring', async () => {
    await write(root, 'src/ts-tools/build.py', 'p\n');

    const byExt = await scanProject(root, { language: 'ts' });
    if (!byExt.success) throw byExt.error;
    expect(Object.keys(byExt.data.summary.languages)).toEqual(['typescript']);
    expect(byExt.data.summary.fileCount).toBe(5);

    const byId = await scanProject(root, { language: 'python' });
    if (!byId.success) throw byId.error;
    expect(byId.data.summary.fileCount).toBe(2);
  });

  it('rejects unknown languages', async () => {
    const result = await scanProject(root, { language: 'klingon' });
    expect(result.success).toBe(false);
  });

  it('honours depth 0 (root files only)', async () => {
    await write(root, 'top.ts', 'x\n');
    const result = await scanProject(root, { depth: 0 });
    if (!result.success) throw result.error;
    expect(result.data.summary.fileCount).toBe(1);
    expect(result.data.domains).toEqual([]);
    expect(result.data.unassigned).toEqual(['top.ts']);
  });

  it('honours depth 1', async () => {
    const result = await scanProject(root, { depth: 1 });
    if (!result.success) throw result.error;
    expect(result.data.summary.fileCount).toBe(1); // src/index.ts
  });

  it('rejects negative or fractional depth', async () => {
    expect((await scanProject(root, { depth: -1 })).success).toBe(false);
    expect((await scanProject(root, { depth: 1.5 })).success).toBe(false);
  });

  it('falls back to top-level directories when there is no src/lib layout', async () => {
    const sub = path.join(root, 'src');
    const result = await scanProject(sub, {}, root);
    if (!result.success) throw result.error;
    expect(result.data.root).toBe('src');
    expect(result.data.domains.map((d) => d.id)).toEqual(['auth', 'billing', 'c']);
    // Paths stay relative to the base directory
    expect(result.data.domains[0].path).toBe('src/auth');
    expect(result.data.domains[0].files[0]).toBe('src/auth/login.test.ts');
  });

  it('assigns other top-level directories alongside src/ children', async () => {
    await write(root, 'app/routes/home.ts', 'h\n');
    await write(root, 'scripts/release.ts', 's\n');
    const result = await scanProject(root);
    if (!result.success) throw result.error;
    const app = result.data.domains.find((d) => d.id === 'app');
    expect(app?.path).toBe('app');
    expect(app?.files).toEqual(['app/routes/home.ts']);
    // Non-domain directories stay unassigned
    expect(result.data.unassigned).toContain('scripts/release.ts');
  });

  it('skips vendored and generated directories by default', async () => {
    for (const dir of ['vendor', 'target', 'out', '__pycache__', 'venv', 'bower_components']) {
      await write(root, `${dir}/x.py`, 'x\n');
      await write(root, `src/auth/${dir}/y.py`, 'y\n');
    }
    const result = await scanProject(root);
    if (!result.success) throw result.error;
    expect(result.data.summary.fileCount).toBe(8);
  });

  it('normalizes backslashes in include/exclude patterns', async () => {
    const result = await scanProject(root, { include: ['src\\auth\\**'], exclude: ['src\\auth\\*.test.ts'] });
    if (!result.success) throw result.error;
    expect(result.data.domains[0].files).toEqual(['src/auth/login.ts', 'src/auth/session.ts']);
  });

  it('counts lines in large files and handles a missing trailing newline', async () => {
    await write(root, 'src/big/a.ts', 'x\n'.repeat(10000) + 'last');
    const result = await scanProject(root, { include: ['src/big/**'] });
    if (!result.success) throw result.error;
    expect(result.data.summary.lines).toBe(10001);
  });

  it('fails for a missing path', async () => {
    const result = await scanProject(path.join(root, 'nope'));
    expect(result.success).toBe(false);
  });

  it('produces JSON-serializable output', async () => {
    const result = await scanProject(root);
    if (!result.success) throw result.error;
    const parsed = JSON.parse(JSON.stringify(result.data));
    expect(parsed.domains.length).toBe(3);
    expect(typeof parsed.scannedAt).toBe('string');
  });
});

describe('toDomainId', () => {
  it('normalizes directory names into valid domain ids', () => {
    expect(toDomainId('auth')).toBe('auth');
    expect(toDomainId('userProfile')).toBe('user-profile');
    expect(toDomainId('user_profile')).toBe('user-profile');
    expect(toDomainId('c++')).toBe('c');
  });

  it('returns null when no valid id can be derived', () => {
    expect(toDomainId('2fa')).toBeNull();
    expect(toDomainId('___')).toBeNull();
  });
});
