/**
 * scanner 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import { scanProject, quickScan, scanPath } from '../../../../src/core/reverse/scanner.js';

describe('scanner', () => {
  let tempDir: string;

  beforeEach(async () => {
    // 임시 디렉토리 생성
    tempDir = path.join(os.tmpdir(), `sdd-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // 테스트용 파일 구조 생성
    await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'src', 'auth'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'src', 'user'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'lib'), { recursive: true });

    // 파일 생성
    await fs.writeFile(path.join(tempDir, 'src', 'index.ts'), 'export {};');
    await fs.writeFile(path.join(tempDir, 'src', 'auth', 'login.ts'), 'export function login() {}');
    await fs.writeFile(path.join(tempDir, 'src', 'auth', 'logout.ts'), 'export function logout() {}');
    await fs.writeFile(path.join(tempDir, 'src', 'user', 'profile.ts'), 'export class Profile {}');
    await fs.writeFile(path.join(tempDir, 'lib', 'utils.js'), 'module.exports = {};');
    await fs.writeFile(path.join(tempDir, 'README.md'), '# Test Project');
  });

  afterEach(async () => {
    // 임시 디렉토리 삭제
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('scanProject', () => {
    it('프로젝트 스캔 성공', async () => {
      const result = await scanProject(tempDir);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.path).toBe(tempDir);
      expect(result.data.files.length).toBeGreaterThan(0);
    });

    it('스캔 결과에 파일 목록 포함', async () => {
      const result = await scanProject(tempDir);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.files).toContain('src/index.ts');
      expect(result.data.files).toContain('src/auth/login.ts');
    });

    it('스캔 결과에 디렉토리 구조 포함', async () => {
      const result = await scanProject(tempDir);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.directories).toContain('src');
      expect(result.data.directories).toContain('src/auth');
    });

    it('언어 분포 계산', async () => {
      const result = await scanProject(tempDir);
      expect(result.success).toBe(true);
      if (!result.success) return;

      const { languageDistribution } = result.data.summary;
      expect(languageDistribution.typescript).toBeDefined();
      expect(languageDistribution.typescript).toBeGreaterThan(0);
    });

    it('도메인 추정', async () => {
      const result = await scanProject(tempDir);
      expect(result.success).toBe(true);
      if (!result.success) return;

      const { suggestedDomains } = result.data.summary;
      // src/auth, src/user가 도메인으로 추정되어야 함
      const domainNames = suggestedDomains.map(d => d.name);
      expect(domainNames).toContain('auth');
      expect(domainNames).toContain('user');
    });

    it('복잡도 계산', async () => {
      const result = await scanProject(tempDir);
      expect(result.success).toBe(true);
      if (!result.success) return;

      const { complexity } = result.data.summary;
      expect(complexity.grade).toBeDefined();
      expect(['low', 'medium', 'high', 'very-high']).toContain(complexity.grade);
    });

    it('depth 옵션 적용', async () => {
      const shallow = await scanProject(tempDir, { depth: 1 });
      const deep = await scanProject(tempDir, { depth: 5 });

      expect(shallow.success).toBe(true);
      expect(deep.success).toBe(true);
      if (!shallow.success || !deep.success) return;

      // 깊이가 더 깊으면 더 많은 파일을 찾아야 함 (일반적으로)
      expect(deep.data.files.length).toBeGreaterThanOrEqual(shallow.data.files.length);
    });

    it('include 옵션으로 파일 필터링', async () => {
      const result = await scanProject(tempDir, { include: 'auth' });
      expect(result.success).toBe(true);
      if (!result.success) return;

      // auth 경로만 포함
      for (const file of result.data.files) {
        expect(file).toContain('auth');
      }
    });

    it('exclude 옵션으로 파일 제외', async () => {
      const result = await scanProject(tempDir, { exclude: 'auth' });
      expect(result.success).toBe(true);
      if (!result.success) return;

      // auth 경로 제외
      for (const file of result.data.files) {
        expect(file).not.toContain('auth');
      }
    });

    it('language 옵션으로 언어 필터링', async () => {
      const result = await scanProject(tempDir, { language: 'ts' });
      expect(result.success).toBe(true);
      if (!result.success) return;

      // .ts 파일만 포함
      for (const file of result.data.files) {
        expect(file).toMatch(/\.ts$|ts/);
      }
    });

    it('존재하지 않는 경로는 실패', async () => {
      const result = await scanProject('/nonexistent/path');
      expect(result.success).toBe(false);
    });

    it('진행 콜백 호출', async () => {
      const progressCallback = vi.fn();
      await scanProject(tempDir, {}, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      const calls = progressCallback.mock.calls;

      // 최소한 listing과 summarizing 단계가 있어야 함
      const phases = calls.map(call => call[0].phase);
      expect(phases).toContain('listing');
    });
  });

  describe('quickScan', () => {
    it('빠른 스캔 성공', async () => {
      const result = await quickScan(tempDir);
      expect(result.success).toBe(true);
    });

    it('파일과 디렉토리 목록만 반환', async () => {
      const result = await quickScan(tempDir);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.files).toBeDefined();
      expect(result.data.directories).toBeDefined();
      expect(result.data.summary).toBeDefined();
    });
  });

  describe('scanPath', () => {
    it('특정 하위 경로만 스캔', async () => {
      const result = await scanPath(tempDir, 'src/auth');
      expect(result.success).toBe(true);
      if (!result.success) return;

      // auth 디렉토리 내 파일만 포함
      expect(result.data.files.length).toBeGreaterThan(0);
      for (const file of result.data.files) {
        expect(file.endsWith('.ts')).toBe(true);
      }
    });

    it('존재하지 않는 하위 경로는 실패', async () => {
      const result = await scanPath(tempDir, 'nonexistent');
      expect(result.success).toBe(false);
    });
  });
});
