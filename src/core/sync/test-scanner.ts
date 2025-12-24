/**
 * 테스트 스캐너 - 테스트 파일에서 REQ-xxx 참조 스캔
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';
import type { CodeReference } from './schemas.js';

/**
 * 테스트 설명에서 REQ-xxx 패턴
 * - it('REQ-001: 설명', ...)
 * - test('REQ-001: 설명', ...)
 * - describe('REQ-001: 설명', ...)
 * - it('should do something (REQ-001)', ...)
 */
const TEST_REQ_PATTERN = /(?:it|test|describe)\s*\(\s*['"`]([^'"`]*REQ-\d+[^'"`]*)/gi;

/**
 * 단일 REQ-xxx 추출
 */
const REQ_ID_PATTERN = /REQ-\d+/gi;

/**
 * 테스트 파일 패턴
 */
const TEST_PATTERNS = [
  '**/*.test.ts',
  '**/*.test.js',
  '**/*.spec.ts',
  '**/*.spec.js',
  '**/test/**/*.ts',
  '**/test/**/*.js',
  '**/tests/**/*.ts',
  '**/tests/**/*.js',
  '**/__tests__/**/*.ts',
  '**/__tests__/**/*.js',
];

/**
 * 제외 패턴
 */
const EXCLUDE_PATTERNS = ['**/node_modules/**', '**/dist/**', '**/build/**'];

export class TestScanner {
  private testDirs: string[];

  constructor(
    private projectRoot: string,
    options: {
      testDirs?: string[];
    } = {}
  ) {
    this.testDirs = options.testDirs || [projectRoot];
  }

  /**
   * 테스트 파일에서 REQ-xxx 참조 스캔
   */
  async scan(): Promise<CodeReference[]> {
    const files = await this.findTestFiles();
    const references: CodeReference[] = [];

    for (const file of files) {
      const fileRefs = await this.scanFile(file);
      references.push(...fileRefs);
    }

    return references;
  }

  /**
   * 단일 테스트 파일 스캔
   */
  async scanFile(filePath: string): Promise<CodeReference[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const references: CodeReference[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // 테스트 설명에서 REQ-xxx 찾기
        const matches = line.matchAll(TEST_REQ_PATTERN);
        for (const match of matches) {
          const testDescription = match[1];
          const reqIds = testDescription.matchAll(REQ_ID_PATTERN);

          for (const reqMatch of reqIds) {
            references.push({
              reqId: reqMatch[0].toUpperCase(),
              file: path.relative(this.projectRoot, filePath),
              line: lineNum,
              type: 'test',
              context: testDescription.trim(),
            });
          }
        }

        // @spec 주석도 확인 (테스트 파일에서도 사용 가능)
        const specMatch = line.match(/@spec:?\s+(REQ-\d+(?:\s*,\s*REQ-\d+)*)/i);
        if (specMatch) {
          const reqIds = specMatch[1].matchAll(REQ_ID_PATTERN);
          for (const reqMatch of reqIds) {
            // 중복 방지
            const reqId = reqMatch[0].toUpperCase();
            const exists = references.some(
              r => r.reqId === reqId && r.file === path.relative(this.projectRoot, filePath) && r.line === lineNum
            );
            if (!exists) {
              references.push({
                reqId,
                file: path.relative(this.projectRoot, filePath),
                line: lineNum,
                type: 'test',
                context: line.trim(),
              });
            }
          }
        }
      }

      return references;
    } catch {
      return [];
    }
  }

  /**
   * 테스트 파일 목록 조회
   */
  private async findTestFiles(): Promise<string[]> {
    const allFiles: string[] = [];

    for (const dir of this.testDirs) {
      // Windows에서 glob은 forward slash를 사용해야 함
      const normalizedDir = dir.replace(/\\/g, '/');
      const patterns = TEST_PATTERNS.map(p => `${normalizedDir}/${p}`);

      try {
        const files = await glob(patterns, {
          ignore: EXCLUDE_PATTERNS,
          absolute: true,
          nodir: true,
        });
        allFiles.push(...files);
      } catch {
        // 디렉토리가 없으면 무시
      }
    }

    // 중복 제거
    return [...new Set(allFiles)];
  }
}
