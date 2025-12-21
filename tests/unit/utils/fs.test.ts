/**
 * 파일 시스템 유틸리티 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  fileExists,
  directoryExists,
  readFile,
  writeFile,
  ensureDir,
  listFiles,
} from '../../../src/utils/fs.js';

describe('파일 시스템 유틸리티', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('fileExists', () => {
    it('존재하는 파일에 대해 true를 반환한다', async () => {
      const filePath = path.join(tempDir, 'test.txt');
      await fs.writeFile(filePath, 'content');

      expect(await fileExists(filePath)).toBe(true);
    });

    it('존재하지 않는 파일에 대해 false를 반환한다', async () => {
      const filePath = path.join(tempDir, 'nonexistent.txt');

      expect(await fileExists(filePath)).toBe(false);
    });
  });

  describe('directoryExists', () => {
    it('존재하는 디렉토리에 대해 true를 반환한다', async () => {
      expect(await directoryExists(tempDir)).toBe(true);
    });

    it('존재하지 않는 디렉토리에 대해 false를 반환한다', async () => {
      const dirPath = path.join(tempDir, 'nonexistent');

      expect(await directoryExists(dirPath)).toBe(false);
    });

    it('파일에 대해 false를 반환한다', async () => {
      const filePath = path.join(tempDir, 'file.txt');
      await fs.writeFile(filePath, 'content');

      expect(await directoryExists(filePath)).toBe(false);
    });
  });

  describe('readFile', () => {
    it('파일 내용을 읽는다', async () => {
      const filePath = path.join(tempDir, 'test.txt');
      await fs.writeFile(filePath, '테스트 내용');

      const result = await readFile(filePath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('테스트 내용');
      }
    });

    it('존재하지 않는 파일에 대해 에러를 반환한다', async () => {
      const filePath = path.join(tempDir, 'nonexistent.txt');

      const result = await readFile(filePath);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('E101');
      }
    });
  });

  describe('writeFile', () => {
    it('파일을 생성하고 내용을 쓴다', async () => {
      const filePath = path.join(tempDir, 'output.txt');

      const result = await writeFile(filePath, '출력 내용');

      expect(result.success).toBe(true);
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('출력 내용');
    });

    it('중첩 디렉토리를 자동으로 생성한다', async () => {
      const filePath = path.join(tempDir, 'a', 'b', 'c', 'file.txt');

      const result = await writeFile(filePath, 'content');

      expect(result.success).toBe(true);
      expect(await fileExists(filePath)).toBe(true);
    });
  });

  describe('ensureDir', () => {
    it('디렉토리를 생성한다', async () => {
      const dirPath = path.join(tempDir, 'new-dir');

      const result = await ensureDir(dirPath);

      expect(result.success).toBe(true);
      expect(await directoryExists(dirPath)).toBe(true);
    });

    it('중첩 디렉토리를 생성한다', async () => {
      const dirPath = path.join(tempDir, 'a', 'b', 'c');

      const result = await ensureDir(dirPath);

      expect(result.success).toBe(true);
      expect(await directoryExists(dirPath)).toBe(true);
    });
  });

  describe('listFiles', () => {
    it('디렉토리 내 파일 목록을 반환한다', async () => {
      await fs.writeFile(path.join(tempDir, 'a.txt'), '');
      await fs.writeFile(path.join(tempDir, 'b.txt'), '');
      await fs.mkdir(path.join(tempDir, 'subdir'));

      const result = await listFiles(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data.some((f) => f.endsWith('a.txt'))).toBe(true);
        expect(result.data.some((f) => f.endsWith('b.txt'))).toBe(true);
      }
    });

    it('패턴으로 파일을 필터링한다', async () => {
      await fs.writeFile(path.join(tempDir, 'test.md'), '');
      await fs.writeFile(path.join(tempDir, 'test.txt'), '');

      const result = await listFiles(tempDir, /\.md$/);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toMatch(/test\.md$/);
      }
    });
  });
});
