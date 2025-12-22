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
  readDir,
  findSddRoot,
  copyDir,
  removeDir,
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

    it('존재하지 않는 디렉토리에 에러를 반환한다', async () => {
      const result = await listFiles('/nonexistent/path');

      expect(result.success).toBe(false);
    });
  });

  describe('readDir', () => {
    it('디렉토리 내 항목 목록을 반환한다', async () => {
      await fs.writeFile(path.join(tempDir, 'file1.txt'), '');
      await fs.mkdir(path.join(tempDir, 'subdir'));

      const result = await readDir(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('file1.txt');
        expect(result.data).toContain('subdir');
      }
    });

    it('존재하지 않는 디렉토리에 에러를 반환한다', async () => {
      const result = await readDir('/nonexistent/path');

      expect(result.success).toBe(false);
    });
  });

  describe('findSddRoot', () => {
    it('.sdd 디렉토리가 있는 경로를 찾는다', async () => {
      const sddDir = path.join(tempDir, '.sdd');
      await fs.mkdir(sddDir);
      const subDir = path.join(tempDir, 'sub', 'nested');
      await fs.mkdir(subDir, { recursive: true });

      const result = await findSddRoot(subDir);

      expect(result).toBe(tempDir);
    });

    it('.sdd 디렉토리가 없으면 null을 반환한다', async () => {
      const result = await findSddRoot(tempDir);

      expect(result).toBeNull();
    });
  });

  describe('copyDir', () => {
    it('디렉토리를 재귀적으로 복사한다', async () => {
      const srcDir = path.join(tempDir, 'src');
      const destDir = path.join(tempDir, 'dest');

      await fs.mkdir(srcDir);
      await fs.writeFile(path.join(srcDir, 'file.txt'), 'content');
      await fs.mkdir(path.join(srcDir, 'subdir'));
      await fs.writeFile(path.join(srcDir, 'subdir', 'nested.txt'), 'nested');

      const result = await copyDir(srcDir, destDir);

      expect(result.success).toBe(true);
      expect(await fileExists(path.join(destDir, 'file.txt'))).toBe(true);
      expect(await fileExists(path.join(destDir, 'subdir', 'nested.txt'))).toBe(true);

      const content = await fs.readFile(path.join(destDir, 'file.txt'), 'utf-8');
      expect(content).toBe('content');
    });

    it('빈 디렉토리를 복사한다', async () => {
      const srcDir = path.join(tempDir, 'empty-src');
      const destDir = path.join(tempDir, 'empty-dest');

      await fs.mkdir(srcDir);

      const result = await copyDir(srcDir, destDir);

      expect(result.success).toBe(true);
      expect(await directoryExists(destDir)).toBe(true);
    });
  });

  describe('removeDir', () => {
    it('디렉토리를 재귀적으로 삭제한다', async () => {
      const dirToRemove = path.join(tempDir, 'to-remove');
      await fs.mkdir(dirToRemove);
      await fs.writeFile(path.join(dirToRemove, 'file.txt'), 'content');
      await fs.mkdir(path.join(dirToRemove, 'subdir'));

      const result = await removeDir(dirToRemove);

      expect(result.success).toBe(true);
      expect(await directoryExists(dirToRemove)).toBe(false);
    });

    it('존재하지 않는 디렉토리도 성공을 반환한다', async () => {
      const result = await removeDir(path.join(tempDir, 'nonexistent'));

      expect(result.success).toBe(true);
    });
  });

  describe('readFile 추가 케이스', () => {
    it('빈 파일을 읽는다', async () => {
      const filePath = path.join(tempDir, 'empty.txt');
      await fs.writeFile(filePath, '');

      const result = await readFile(filePath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('');
      }
    });

    it('유니코드 내용을 읽는다', async () => {
      const filePath = path.join(tempDir, 'unicode.txt');
      await fs.writeFile(filePath, '한글 테스트 🎉 émoji');

      const result = await readFile(filePath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('한글 테스트 🎉 émoji');
      }
    });
  });

  describe('writeFile 추가 케이스', () => {
    it('빈 내용을 쓴다', async () => {
      const filePath = path.join(tempDir, 'empty-write.txt');

      const result = await writeFile(filePath, '');

      expect(result.success).toBe(true);
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('');
    });

    it('기존 파일을 덮어쓴다', async () => {
      const filePath = path.join(tempDir, 'overwrite.txt');
      await fs.writeFile(filePath, 'original');

      const result = await writeFile(filePath, 'new content');

      expect(result.success).toBe(true);
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('new content');
    });
  });
});
