/**
 * 크로스 플랫폼 경로 유틸리티
 */
import path from 'node:path';

/**
 * Git용 경로 정규화 (Windows 백슬래시 → 슬래시)
 */
export function normalizePathForGit(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

/**
 * Glob 패턴용 경로 정규화
 */
export function normalizePathForGlob(filePath: string): string {
  // Windows 경로를 glob 패턴으로 변환
  return filePath.replace(/\\/g, '/');
}

/**
 * 크로스 플랫폼 절대 경로 확인
 */
export function isAbsolutePath(filePath: string): boolean {
  // Windows: C:\, D:\, \\server\share
  // Unix: /
  return path.isAbsolute(filePath);
}

/**
 * 경로를 플랫폼에 맞게 정규화
 */
export function normalizePath(filePath: string): string {
  return path.normalize(filePath);
}

/**
 * 두 경로가 같은지 비교 (대소문자 무시 on Windows)
 */
export function pathsEqual(path1: string, path2: string): boolean {
  const normalized1 = path.normalize(path1);
  const normalized2 = path.normalize(path2);

  if (process.platform === 'win32') {
    return normalized1.toLowerCase() === normalized2.toLowerCase();
  }
  return normalized1 === normalized2;
}
