/**
 * 안전한 frontmatter 파서
 *
 * gray-matter supports `---js` / `---coffee` frontmatter, which is evaluated
 * with `eval`. Spec files are untrusted input, so executable engines are
 * replaced with stubs that throw before any code is evaluated.
 */
import matter from 'gray-matter';
import { parseDocument, stringify as stringifyYaml } from 'yaml';

function rejectExecutableEngine(language: string): () => never {
  return () => {
    throw new Error(
      `지원하지 않는 frontmatter 형식입니다: '${language}' (YAML 또는 JSON frontmatter만 허용됩니다)`
    );
  };
}

const SAFE_ENGINES = {
  js: rejectExecutableEngine('js'),
  javascript: rejectExecutableEngine('javascript'),
  coffee: rejectExecutableEngine('coffee'),
  coffeescript: rejectExecutableEngine('coffeescript'),
  cson: rejectExecutableEngine('cson'),
};

/**
 * Parse frontmatter without allowing executable (JS/CoffeeScript) engines.
 * Throws on non-YAML/JSON executable frontmatter; callers handle it as a parse error.
 */
export function parseFrontmatter(content: string): matter.GrayMatterFile<string> {
  return matter(content, { engines: SAFE_ENGINES });
}

/**
 * Normalize CRLF / CR line endings to LF.
 */
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

/**
 * 관대한 frontmatter 읽기 결과
 */
export interface FrontmatterDocument {
  /** Top-level YAML values (Date values converted to YYYY-MM-DD) */
  data: Record<string, unknown>;
  /** Body after the frontmatter block, with LF line endings */
  body: string;
  /** Whether the document starts with a complete (closed, parseable) frontmatter block */
  hasFrontmatter: boolean;
  /** Starts with `---` but the block is unclosed or not valid YAML (writers must not rewrite it) */
  malformed: boolean;
}

/** Opening delimiter, optional YAML lines, closing delimiter (group 1 = raw YAML) */
const FRONTMATTER_BLOCK = /^---[ \t]*\n((?:[\s\S]*?\n)?)---[ \t]*(?:\n|$)/;

/**
 * Raw YAML text of a closed frontmatter block (LF-normalized input), or null when there is none.
 * Unlike readFrontmatter this does not parse, so it also works for YAML that fails to parse
 * (e.g. an unquoted `{{PLACEHOLDER}}`).
 */
export function extractFrontmatterText(normalized: string): string | null {
  return normalized.match(FRONTMATTER_BLOCK)?.[1] ?? null;
}

/**
 * Frontmatter 블록 상태 (LF 정규화된 텍스트 기준)
 * - none: frontmatter 없음
 * - closed: 닫는 구분자까지 있는 블록
 * - unclosed: `---`로 시작하지만 닫는 구분자가 없음 (gray-matter는 파일 전체를 YAML로 읽음)
 */
export function detectFrontmatter(normalized: string): 'none' | 'closed' | 'unclosed' {
  if (FRONTMATTER_BLOCK.test(normalized)) return 'closed';
  return /^---[ \t]*\n/.test(normalized) ? 'unclosed' : 'none';
}

/**
 * Lenient frontmatter reader for listing/reporting code paths.
 * Normalizes line endings, converts YAML dates to YYYY-MM-DD strings and
 * treats missing, unclosed or malformed frontmatter as absent instead of throwing.
 */
export function readFrontmatter(content: string): FrontmatterDocument {
  const normalized = normalizeLineEndings(content);
  const state = detectFrontmatter(normalized);
  if (state !== 'closed') {
    return { data: {}, body: normalized, hasFrontmatter: false, malformed: state === 'unclosed' };
  }
  try {
    const parsed = parseFrontmatter(normalized);
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data as Record<string, unknown>)) {
      data[key] = value instanceof Date ? value.toISOString().split('T')[0] : value;
    }
    return { data, body: parsed.content, hasFrontmatter: true, malformed: false };
  } catch {
    return { data: {}, body: normalized, hasFrontmatter: false, malformed: true };
  }
}

/**
 * Serialize frontmatter data as YAML (properly quoted/escaped) and prepend it to the body.
 * Keys with undefined values are omitted.
 */
export function stringifyFrontmatter(data: Record<string, unknown>, body: string): string {
  return `---\n${stringifyYaml(data, { lineWidth: 0 })}---\n${body}`;
}

/**
 * Set fields in an existing frontmatter block, preserving everything else as written
 * (comments, quoting, `version: 1.0` scalars) and leaving the body untouched.
 * Keys with undefined values are skipped.
 *
 * Throws when the document has no frontmatter, an unclosed block or invalid YAML,
 * so callers never rewrite (and truncate) content they could not parse.
 */
export function updateFrontmatter(content: string, updates: Record<string, unknown>): string {
  const normalized = normalizeLineEndings(content);
  const match = normalized.match(FRONTMATTER_BLOCK);
  if (!match) {
    throw new Error(
      detectFrontmatter(normalized) === 'unclosed'
        ? 'frontmatter 닫는 구분자(---)가 없어 파일을 수정할 수 없습니다'
        : 'frontmatter가 없어 파일을 수정할 수 없습니다'
    );
  }

  const doc = parseDocument(match[1]);
  if (doc.errors.length > 0) {
    throw new Error(`frontmatter YAML 오류로 파일을 수정할 수 없습니다: ${doc.errors[0].message}`);
  }
  const body = normalized.slice(match[0].length);
  if (doc.contents === null) {
    // Empty block: nothing to preserve, serialize the updates directly
    return stringifyFrontmatter(updates, body);
  }
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      doc.set(key, value);
    }
  }

  return `---\n${doc.toString({ lineWidth: 0 })}---\n${body}`;
}
