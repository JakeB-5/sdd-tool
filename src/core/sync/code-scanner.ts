/**
 * 코드 스캐너 - 소스 코드에서 @spec 주석 스캔
 */
import { promises as fs, statSync } from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';
import type { CodeReference } from './schemas.js';

/**
 * @spec 참조 패턴
 * - @spec REQ-001                  (bare: 유일한 스펙에만 매칭)
 * - @spec auth/login#REQ-001       (스펙 한정: <domain>/<feature>#REQ-xxx)
 * - @spec login#REQ-001            (스펙 한정: <feature>#REQ-xxx, feature가 유일할 때)
 * - @spec REQ-001, auth/login#REQ-002
 * - @spec: REQ-001
 */
export const SPEC_ANNOTATION_PATTERN =
  /@spec:?\s+((?:[^\s,#]+#)?REQ-\d+(?:\s*,\s*(?:[^\s,#]+#)?REQ-\d+)*)/gi;

/**
 * 단일 참조 추출 (group 1 = 스펙 한정자, group 2 = REQ-xxx)
 */
const SPEC_REF_PATTERN = /(?:([^\s,#'"`()[\]{}<>]+)#)?(REQ-\d+)/gi;

/**
 * 텍스트에서 `[<spec>#]REQ-xxx` 참조 추출
 */
export function extractSpecRefs(text: string): Array<{ reqId: string; specRef?: string }> {
  return [...text.matchAll(SPEC_REF_PATTERN)].map((m) => ({
    reqId: m[2].toUpperCase(),
    ...(m[1] ? { specRef: m[1] } : {}),
  }));
}

const COMMENT_OR_BLANK_LINE = /^\s*(?:$|\/\/|\/\*|\*)/;
const STRING_LITERAL = /(['"`])(?:\\.|(?!\1).)*\1/g;

/**
 * Last line (0-based, inclusive) of the code a qualified annotation applies to.
 *
 * The annotation applies to the statement it sits on, or - when it is in a comment -
 * to the first non-comment statement below it. If that statement opens brackets
 * (`describe(..., () => {`, `function f() {`) the scope extends to the matching close.
 */
function annotatedScopeEnd(lines: string[], annotationIdx: number): number {
  let stmtIdx = annotationIdx;
  while (stmtIdx < lines.length && COMMENT_OR_BLANK_LINE.test(lines[stmtIdx])) stmtIdx++;
  if (stmtIdx >= lines.length) return annotationIdx;

  let depth = 0;
  for (let j = stmtIdx; j < lines.length; j++) {
    const code = lines[j].replace(STRING_LITERAL, '');
    for (const ch of code) {
      if (ch === '{' || ch === '(' || ch === '[') depth++;
      else if (ch === '}' || ch === ')' || ch === ']') depth--;
    }
    if (depth <= 0) return j;
  }
  return stmtIdx; // unbalanced brackets: do not guess a larger scope
}

/**
 * Drop unqualified `REQ-xx` references that a qualified `<spec>#REQ-xx` reference covers.
 *
 * Without this, a test titled `it('REQ-01: ...')` under `// @spec auth/login#REQ-01` is
 * reported as an ambiguous bare reference even though the author already named the spec.
 *
 * A qualified reference covers a bare reference when, in the same file, both use the same
 * REQ number and the bare one sits on the qualified reference's line or inside the scope
 * it annotates (see annotatedScopeEnd): the declaration right below a `@spec` comment
 * (with blank/comment lines in between) including that declaration's whole block, so the
 * enclosing `describe` annotation covers the `it` titles within it.
 * Bare references outside any such scope are kept and stay subject to the ambiguity warning.
 */
export function dropCoveredBareRefs(refs: CodeReference[], lines: string[]): CodeReference[] {
  const scopes = refs
    .filter((r) => r.specRef)
    .map((r) => ({ reqId: r.reqId, start: r.line, end: annotatedScopeEnd(lines, r.line - 1) + 1 }));
  if (scopes.length === 0) return refs;

  return refs.filter(
    (r) =>
      r.specRef ||
      !scopes.some((s) => s.reqId === r.reqId && r.line >= s.start && r.line <= s.end)
  );
}

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
          for (const ref of extractSpecRefs(match[1])) {
            references.push({
              ...ref,
              file: path.relative(this.projectRoot, filePath),
              line: lineNum,
              type: 'code',
              context: line.trim(),
            });
          }
        }
      }

      return dropCoveredBareRefs(references, lines);
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
      const stat = statSync(this.srcDir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}
