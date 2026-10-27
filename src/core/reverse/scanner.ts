/**
 * 프로젝트 스캐너
 *
 * 디렉토리 구조를 결정적으로 스캔하여 파일 목록, 언어 분포, 라인 수와
 * 디렉토리 기반 도메인 후보를 계산합니다. 코드 의미 분석은 AI(sdd-reverse 스킬)가 담당합니다.
 */

import path from 'node:path';
import { promises as fs } from 'node:fs';
import chalk from 'chalk';
import { minimatch } from 'minimatch';
import { Result, success, failure } from '../../types/index.js';
import { analyzeLanguageDistribution, detectLanguage, resolveLanguage } from '../../utils/language-detector.js';
import { isValidDomainId } from '../../schemas/domains.schema.js';

/**
 * 스캔 옵션
 */
export interface ScanOptions {
  /** Glob patterns; a file is kept when it matches at least one (default: all) */
  include?: string[];
  /** Glob patterns; a file is dropped when it matches any */
  exclude?: string[];
  /** Language id or extension (e.g. "typescript", "ts") */
  language?: string;
  /** Max directory depth below the scan root (0 = root files only, default: unlimited) */
  depth?: number;
}

/**
 * 도메인 후보
 */
export interface ScannedDomain {
  /** Suggested domain id (valid domain id) */
  id: string;
  /** Domain directory (relative to the base directory) */
  path: string;
  fileCount: number;
  lines: number;
  languages: Record<string, number>;
  files: string[];
}

/**
 * 스캔 결과
 */
export interface ScanResult {
  /** Scan root (relative to the base directory, "." when identical) */
  root: string;
  scannedAt: string;
  options: ScanOptions;
  summary: {
    /** Files left after include/exclude/language filters */
    fileCount: number;
    /** Files with a recognized programming language */
    sourceFileCount: number;
    /** Total line count of source files */
    lines: number;
    languages: Record<string, number>;
  };
  domains: ScannedDomain[];
  /** Source files not assigned to any suggested domain */
  unassigned: string[];
}

/** Directories never descended into (dot-directories are skipped as well) */
const IGNORED_DIRS = new Set([
  'node_modules',
  'bower_components',
  'dist',
  'build',
  'out',
  'target',
  'coverage',
  'vendor',
  '__pycache__',
  'venv',
]);

/** Top-level directories whose children are domain candidates */
const CONTAINER_DIRS = new Set(['src', 'lib', 'packages', 'modules', 'apps']);

/** Directory names that are not treated as domains */
const NON_DOMAIN_DIRS = new Set([
  'utils',
  'helpers',
  'types',
  'config',
  'test',
  'tests',
  '__tests__',
  '__mocks__',
  'docs',
  'scripts',
  'examples',
  'fixtures',
  'bin',
]);

function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

/**
 * 디렉토리 재귀 탐색 (심볼릭 링크는 따라가지 않음)
 */
async function listFiles(root: string, maxDepth: number | undefined): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string, depth: number): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        if (maxDepth === undefined || depth < maxDepth) {
          await walk(fullPath, depth + 1);
        }
      } else if (entry.isFile()) {
        files.push(toPosix(path.relative(root, fullPath)));
      }
    }
  }

  await walk(root, 0);
  return files;
}

/**
 * Normalize user glob patterns: Windows separators → "/" (paths are matched in POSIX form)
 */
function normalizePatterns(patterns: string[] | undefined): string[] {
  return (patterns ?? []).map((p) => p.replace(/\\/g, '/')).filter((p) => p.length > 0);
}

function matchesAny(file: string, patterns: string[]): boolean {
  return patterns.some((pattern) => minimatch(file, pattern, { matchBase: true, dot: true }));
}

async function countLines(filePath: string): Promise<number> {
  try {
    const buffer = await fs.readFile(filePath);
    if (buffer.length === 0) return 0;
    let lines = 0;
    for (let i = buffer.indexOf(0x0a); i !== -1; i = buffer.indexOf(0x0a, i + 1)) {
      lines++;
    }
    return buffer[buffer.length - 1] === 0x0a ? lines : lines + 1;
  } catch {
    return 0;
  }
}

/**
 * 디렉토리 이름을 도메인 ID로 변환 (변환 불가 시 null)
 *
 * 예: "userProfile" → "user-profile", "user_profile" → "user-profile"
 */
export function toDomainId(name: string): string | null {
  const id = name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return isValidDomainId(id) ? id : null;
}

/**
 * 파일 경로에서 도메인 후보 디렉토리 추출
 */
function containerCandidate(file: string): { name: string; dir: string } | null {
  const segments = file.split('/');
  if (segments.length >= 3 && CONTAINER_DIRS.has(segments[0])) {
    return { name: segments[1], dir: `${segments[0]}/${segments[1]}` };
  }
  return null;
}

function topLevelCandidate(file: string): { name: string; dir: string } | null {
  const segments = file.split('/');
  if (segments.length >= 2 && !CONTAINER_DIRS.has(segments[0])) {
    return { name: segments[0], dir: segments[0] };
  }
  return null;
}

/**
 * 소스 파일을 디렉토리 기반 도메인 후보로 그룹화
 *
 * src/, lib/, packages/, modules/, apps/ 아래 파일은 그 하위 디렉토리를,
 * 그 밖의 최상위 디렉토리(예: app/) 아래 파일은 최상위 디렉토리를 후보로 사용합니다.
 */
function groupByDomain(sourceFiles: string[]): {
  groups: Array<{ id: string; dir: string; files: string[] }>;
  unassigned: string[];
} {
  const byDir = new Map<string, { name: string; files: string[] }>();
  const unassigned: string[] = [];

  for (const file of sourceFiles) {
    const c = containerCandidate(file) ?? topLevelCandidate(file);
    if (!c || NON_DOMAIN_DIRS.has(c.name.toLowerCase()) || toDomainId(c.name) === null) {
      unassigned.push(file);
      continue;
    }
    const entry = byDir.get(c.dir) ?? { name: c.name, files: [] };
    entry.files.push(file);
    byDir.set(c.dir, entry);
  }

  // Deterministic ids: directories in path order, suffix on collision
  const usedIds = new Set<string>();
  const groups = [...byDir.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([dir, entry]) => {
      const baseId = toDomainId(entry.name) as string;
      let id = baseId;
      for (let n = 2; usedIds.has(id); n++) id = `${baseId}-${n}`;
      usedIds.add(id);
      return { id, dir, files: entry.files };
    });

  return { groups, unassigned };
}

/**
 * 프로젝트 스캔 실행
 *
 * @param root 스캔 루트 디렉토리
 * @param options 스캔 옵션
 * @param baseDir 결과 경로의 기준 디렉토리 (기본: root)
 */
export async function scanProject(
  root: string,
  options: ScanOptions = {},
  baseDir: string = root
): Promise<Result<ScanResult, Error>> {
  try {
    const stat = await fs.stat(root);
    if (!stat.isDirectory()) {
      return failure(new Error(`디렉토리가 아닙니다: ${root}`));
    }
  } catch {
    return failure(new Error(`경로를 찾을 수 없습니다: ${root}`));
  }

  if (options.depth !== undefined && (!Number.isInteger(options.depth) || options.depth < 0)) {
    return failure(new Error(`depth는 0 이상의 정수여야 합니다: ${options.depth}`));
  }

  let language: string | null = null;
  if (options.language !== undefined) {
    language = resolveLanguage(options.language);
    if (!language) {
      return failure(new Error(`알 수 없는 언어입니다: ${options.language}`));
    }
  }

  let files = await listFiles(root, options.depth);

  const include = normalizePatterns(options.include);
  const exclude = normalizePatterns(options.exclude);
  if (include.length > 0) {
    files = files.filter((f) => matchesAny(f, include));
  }
  if (exclude.length > 0) {
    files = files.filter((f) => !matchesAny(f, exclude));
  }
  if (language) {
    files = files.filter((f) => detectLanguage(f) === language);
  }

  const sourceFiles = files.filter((f) => detectLanguage(f) !== null);
  const lineCounts = new Map<string, number>();
  for (const file of sourceFiles) {
    lineCounts.set(file, await countLines(path.join(root, file)));
  }
  const sumLines = (list: string[]) => list.reduce((acc, f) => acc + (lineCounts.get(f) ?? 0), 0);

  const prefix = toPosix(path.relative(baseDir, root));
  const display = (rel: string) => (prefix ? `${prefix}/${rel}` : rel);

  const { groups, unassigned } = groupByDomain(sourceFiles);
  const domains: ScannedDomain[] = groups
    .map((g) => ({
      id: g.id,
      path: display(g.dir),
      fileCount: g.files.length,
      lines: sumLines(g.files),
      languages: analyzeLanguageDistribution(g.files),
      files: g.files.map(display),
    }))
    .sort((a, b) => b.fileCount - a.fileCount || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  return success({
    root: prefix || '.',
    scannedAt: new Date().toISOString(),
    options,
    summary: {
      fileCount: files.length,
      sourceFileCount: sourceFiles.length,
      lines: sumLines(sourceFiles),
      languages: analyzeLanguageDistribution(sourceFiles),
    },
    domains,
    unassigned: unassigned.map(display),
  });
}

function formatLanguages(languages: Record<string, number>): string {
  const entries = Object.entries(languages).sort(([, a], [, b]) => b - a);
  return entries.length > 0 ? entries.map(([lang, n]) => `${lang} ${n}`).join(', ') : '-';
}

/**
 * 스캔 결과 텍스트 포맷
 */
export function formatScanResult(result: ScanResult): string {
  const lines: string[] = [];
  const { summary } = result;

  lines.push('');
  lines.push(chalk.bold(`📊 스캔 결과: ${result.root}`));
  lines.push('─'.repeat(50));
  lines.push(`   파일: ${summary.fileCount}개 (소스 ${summary.sourceFileCount}개, ${summary.lines}줄)`);
  lines.push(`   언어: ${formatLanguages(summary.languages)}`);
  lines.push('');

  if (result.domains.length === 0) {
    lines.push(chalk.yellow('   제안할 도메인이 없습니다.'));
  } else {
    lines.push(chalk.bold(`📁 제안 도메인 (${result.domains.length}개):`));
    const idWidth = Math.max(...result.domains.map((d) => d.id.length));
    const pathWidth = Math.max(...result.domains.map((d) => d.path.length));
    for (const domain of result.domains) {
      lines.push(
        `   ${chalk.cyan(domain.id.padEnd(idWidth))}  ${domain.path.padEnd(pathWidth)}  ` +
          `${domain.fileCount}개 파일, ${domain.lines}줄 (${formatLanguages(domain.languages)})`
      );
    }
  }

  if (result.unassigned.length > 0) {
    lines.push('');
    lines.push(chalk.dim(`   도메인 미지정 소스 파일: ${result.unassigned.length}개`));
  }
  lines.push('');

  return lines.join('\n');
}
