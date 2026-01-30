/**
 * 크로스 플랫폼 경로 유틸리티
 */
import path from 'node:path';

/**
 * Git용 경로 정규화 (Windows 백슬래시 → 슬래시)
 * 크로스 플랫폼 호환성을 위해 명시적으로 백슬래시 변환
 */
export function normalizePathForGit(filePath: string): string {
  return filePath.replace(/\\/g, '/');
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
 * 크로스 플랫폼 호환성을 위해 경로 구분자 통일
 */
export function pathsEqual(path1: string, path2: string): boolean {
  // 모든 플랫폼에서 일관된 비교를 위해 슬래시로 통일
  const normalized1 = path.normalize(path1).replace(/\\/g, '/');
  const normalized2 = path.normalize(path2).replace(/\\/g, '/');

  if (process.platform === 'win32') {
    return normalized1.toLowerCase() === normalized2.toLowerCase();
  }
  return normalized1 === normalized2;
}
