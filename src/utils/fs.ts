/**
 * 파일 시스템 유틸리티
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { FileSystemError } from '../errors/index.js';
import { ErrorCode } from '../errors/codes.js';
import { Result, success, failure } from '../types/index.js';

/**
 * 파일 존재 여부 확인
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 디렉토리 존재 여부 확인
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * 파일 읽기
 */
export async function readFile(filePath: string): Promise<Result<string, FileSystemError>> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return success(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return failure(new FileSystemError(ErrorCode.FILE_NOT_FOUND, filePath));
    }
    return failure(new FileSystemError(ErrorCode.FILE_READ_ERROR, filePath));
  }
}

/**
 * 파일 쓰기
 */
export async function writeFile(
  filePath: string,
  content: string
): Promise<Result<void, FileSystemError>> {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    return success(undefined);
  } catch {
    return failure(new FileSystemError(ErrorCode.FILE_WRITE_ERROR, filePath));
  }
}

/**
 * 디렉토리 생성
 */
export async function ensureDir(dirPath: string): Promise<Result<void, FileSystemError>> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return success(undefined);
  } catch {
    return failure(new FileSystemError(ErrorCode.FILE_WRITE_ERROR, dirPath));
  }
}

/**
 * 디렉토리 내 파일 목록
 */
export async function listFiles(
  dirPath: string,
  pattern?: RegExp
): Promise<Result<string[], FileSystemError>> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(dirPath, entry.name));

    if (pattern) {
      files = files.filter((file) => pattern.test(path.basename(file)));
    }

    return success(files);
  } catch {
    return failure(new FileSystemError(ErrorCode.DIRECTORY_NOT_FOUND, dirPath));
  }
}

/**
 * 디렉토리 내 항목 목록
 */
export async function readDir(dirPath: string): Promise<Result<string[], FileSystemError>> {
  try {
    const entries = await fs.readdir(dirPath);
    return success(entries);
  } catch {
    return failure(new FileSystemError(ErrorCode.DIRECTORY_NOT_FOUND, dirPath));
  }
}

/**
 * SDD 프로젝트 루트 찾기
 */
export async function findSddRoot(startPath: string = process.cwd()): Promise<string | null> {
  let currentPath = path.resolve(startPath);
  const root = path.parse(currentPath).root;

  while (currentPath !== root) {
    const sddPath = path.join(currentPath, '.sdd');
    if (await directoryExists(sddPath)) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }

  return null;
}

/**
 * 디렉토리 복사 (재귀)
 */
export async function copyDir(
  srcPath: string,
  destPath: string
): Promise<Result<void, FileSystemError>> {
  try {
    await fs.mkdir(destPath, { recursive: true });

    const entries = await fs.readdir(srcPath, { withFileTypes: true });

    for (const entry of entries) {
      const srcEntry = path.join(srcPath, entry.name);
      const destEntry = path.join(destPath, entry.name);

      if (entry.isDirectory()) {
        const result = await copyDir(srcEntry, destEntry);
        if (!result.success) {
          return result;
        }
      } else {
        await fs.copyFile(srcEntry, destEntry);
      }
    }

    return success(undefined);
  } catch {
    return failure(new FileSystemError(ErrorCode.FILE_WRITE_ERROR, destPath));
  }
}

/**
 * 디렉토리 삭제 (재귀)
 */
export async function removeDir(dirPath: string): Promise<Result<void, FileSystemError>> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
    return success(undefined);
  } catch {
    return failure(new FileSystemError(ErrorCode.FILE_WRITE_ERROR, dirPath));
  }
}
