/**
 * 코드 스캐너 - 소스 코드에서 @spec 주석 스캔
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';
import type { CodeReference } from './schemas.js';

/**
 * @spec REQ-001 패턴
 * - @spec REQ-001
 * - @spec REQ-001, REQ-002
 * - @spec: REQ-001
 */
const SPEC_ANNOTATION_PATTERN = /@spec:?\s+(REQ-\d+(?:\s*,\s*REQ-\d+)*)/gi;

/**
 * 단일 REQ-xxx 추출
 */
const REQ_ID_PATTERN = /REQ-\d+/gi;

/**
 * 기본 제외 패턴
 */
const DEFAULT_EXCLUDE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/coverage/**',
  '**/*.test.ts',
  '**/*.test.js',
  '**/*.spec.ts',
  '**/*.spec.js',
];

/**
 * 기본 포함 패턴
 */
const DEFAULT_INCLUDE = ['**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx'];

export class CodeScanner {
  private srcDir: string;
  private include: string[];
  private exclude: string[];

  constructor(
    private projectRoot: string,
    options: {
      srcDir?: string;
      include?: string[];
      exclude?: string[];
    } = {}
  ) {
    this.srcDir = options.srcDir || path.join(projectRoot, 'src');
    this.include = options.include || DEFAULT_INCLUDE;
    this.exclude = options.exclude || DEFAULT_EXCLUDE;
  }

  /**
   * 소스 코드에서 @spec 주석 스캔
   */
  async scan(): Promise<CodeReference[]> {
    const files = await this.findFiles();
    const references: CodeReference[] = [];

    for (const file of files) {
      const fileRefs = await this.scanFile(file);
      references.push(...fileRefs);
    }

    return references;
  }

  /**
   * 단일 파일 스캔
   */
  async scanFile(filePath: string): Promise<CodeReference[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const references: CodeReference[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // @spec 주석 찾기
        const matches = line.matchAll(SPEC_ANNOTATION_PATTERN);
        for (const match of matches) {
          const reqIds = match[1].matchAll(REQ_ID_PATTERN);
          for (const reqMatch of reqIds) {
            references.push({
              reqId: reqMatch[0].toUpperCase(),
              file: path.relative(this.projectRoot, filePath),
              line: lineNum,
              type: 'code',
              context: line.trim(),
            });
          }
        }
      }

      return references;
    } catch {
      return [];
    }
  }

  /**
   * 스캔할 파일 목록 조회
   */
  private async findFiles(): Promise<string[]> {
    // Windows에서 glob은 forward slash를 사용해야 함
    const normalizedSrcDir = this.srcDir.replace(/\\/g, '/');
    const patterns = this.include.map(p => `${normalizedSrcDir}/${p}`);

    try {
      const files = await glob(patterns, {
        ignore: this.exclude,
        absolute: true,
        nodir: true,
      });
      return files;
    } catch {
      return [];
    }
  }

  /**
   * 소스 디렉토리 존재 여부
   */
  exists(): boolean {
    try {
      const stat = require('fs').statSync(this.srcDir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}
