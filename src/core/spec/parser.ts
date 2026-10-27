/**
 * 스펙 마크다운 파서
 */
import {
  parseFrontmatter,
  normalizeLineEndings,
  readFrontmatter,
  detectFrontmatter,
  extractFrontmatterText,
} from '../../utils/frontmatter.js';
import {
  ParsedSpec,
  SpecMetadataSchema,
  Requirement,
  Scenario,
  extractRfc2119Keywords,
  resolveRequirementLevel,
  type SpecMetadata,
} from './schemas.js';
import { isLegacySpecStatus } from './status.js';
import { Result, success, failure } from '../../types/index.js';
import { ValidationError, ErrorCode } from '../../errors/index.js';

/**
 * `sdd new` / transition 템플릿이 남기는 플레이스홀더
 */
export const TEMPLATE_PLACEHOLDERS = [
  '[요구사항 제목]',
  '[요구사항 상세 설명]',
  '[기능]',
  '[시나리오명]',
  '[전제 조건]',
  '[행동/트리거]',
  '[예상 결과]',
  '[N]',
  '[보안 요구사항]',
  '[기술적 제약사항]',
  '[비즈니스 제약사항]',
  '[용어1]',
  '[정의1]',
] as const;

const TEMPLATE_PLACEHOLDER_PATTERN = new RegExp(
  [
    // Bracket placeholders from the `sdd new` generator, excluding words (`arr[N]`), wiki links,
    // inline links `[x](url)`, reference links `[x][1]` / `[x][]` and definitions `[x]: url`
    ...TEMPLATE_PLACEHOLDERS.map(
      (p) => `(?<![\\w\\[])${p.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?![(\\[\\]:])`
    ),
    // {{UPPER_SNAKE}} placeholders from templates/spec.md
    '\\{\\{[A-Z][A-Z0-9_]*\\}\\}',
  ].join('|'),
  'g'
);

/**
 * HTML 주석과 펜스 코드 블록 제거 (줄 수는 유지)
 */
export function stripNonContent(text: string): string {
  const blank = (block: string): string => block.replace(/[^\n]/g, '');
  return normalizeLineEndings(text)
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, blank);
}

/** `{{FEATURE_ID}}`-style placeholders from templates/spec.md */
const FRONTMATTER_PLACEHOLDER_PATTERN = /\{\{[A-Z][A-Z0-9_]*\}\}/g;

/**
 * 스펙에 남아 있는 템플릿 플레이스홀더 목록 (중복 제거, 주석/코드 블록 제외)
 *
 * Body: bracket and `{{X}}` placeholders. Frontmatter: only `{{X}}` placeholders
 * (e.g. `id: "{{FEATURE_ID}}"`), since bracket values like `[a, b]` are valid YAML.
 */
export function findTemplatePlaceholders(content: string): string[] {
  const frontmatterText = extractFrontmatterText(normalizeLineEndings(content)) ?? '';
  const frontmatterFound = frontmatterText
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .flatMap((line) => line.match(FRONTMATTER_PLACEHOLDER_PATTERN) ?? []);

  const body = stripNonContent(readFrontmatter(content).body);
  // Shortcut reference links `[x]` whose definition `[x]: url` exists are real links
  const definedLabels = new Set(
    [...body.matchAll(/^ {0,3}(\[[^\]\n]+\]):/gm)].map((m) => m[1].toLowerCase())
  );
  const found = (body.match(TEMPLATE_PLACEHOLDER_PATTERN) ?? []).filter(
    (p) => !definedLabels.has(p.toLowerCase())
  );
  return [...new Set([...frontmatterFound, ...found])];
}

/**
 * 대문자 RFC 2119 키워드 없이 소문자(must, shall, should, may)만 쓰인 경우 그 키워드 목록
 * (frontmatter/주석/코드 블록 제외). 대문자 키워드가 하나라도 있으면 빈 배열.
 */
export function findLowercaseRfc2119Keywords(content: string): string[] {
  const body = stripNonContent(readFrontmatter(content).body);
  if (extractRfc2119Keywords(body).length > 0) {
    return [];
  }
  const found = (body.match(/\b(?:must|shall|should|may)(?:\s+not)?\b/gi) ?? [])
    .filter((k) => k !== k.toUpperCase())
    .map((k) => k.toLowerCase().replace(/\s+/g, ' '));
  return [...new Set(found)];
}

/**
 * 마크다운 스펙 파일 파싱
 */
export function parseSpec(content: string): Result<ParsedSpec, ValidationError> {
  try {
    // 1. Frontmatter 파싱 (CRLF 정규화)
    const normalized = normalizeLineEndings(content);
    if (detectFrontmatter(normalized) === 'unclosed') {
      // gray-matter would otherwise read the entire file as YAML
      return failure(new ValidationError(
        ErrorCode.SPEC_INVALID_FORMAT,
        'frontmatter 닫는 구분자(---)가 없습니다'
      ));
    }
    const { data: rawMeta, content: rawBody } = parseFrontmatter(normalized);
    // Comments and code blocks never carry requirements or scenarios
    const body = stripNonContent(rawBody);

    // 2. 메타데이터 검증
    const metaResult = SpecMetadataSchema.safeParse(rawMeta);
    if (!metaResult.success) {
      const errors = metaResult.error.errors
        .map((e) => (e.path.length > 0 ? `${e.path.join('.')}: ${e.message}` : e.message))
        .join(', ');
      return failure(new ValidationError(ErrorCode.SPEC_INVALID_FORMAT, `메타데이터 오류: ${errors}`));
    }
    const metadata: SpecMetadata = metaResult.data;
    const rawStatus = typeof rawMeta.status === 'string' ? rawMeta.status.trim().toLowerCase() : undefined;
    const legacyStatus = isLegacySpecStatus(rawStatus) ? rawStatus : undefined;

    // 3. 제목 추출
    const titleMatch = body.match(/^#\s+(.+)$/m);
    if (!titleMatch) {
      return failure(new ValidationError(ErrorCode.SPEC_MISSING_REQUIRED, '제목(# Title)이 필요합니다'));
    }
    const title = titleMatch[1].trim();

    // 4. 설명 추출 (제목 다음 줄의 blockquote)
    const descMatch = body.match(/^#\s+.+\n+>\s*(.+)$/m);
    const description = descMatch?.[1]?.trim();

    // 5. 요구사항 추출
    const requirements = parseRequirements(body);

    // 6. 시나리오 추출
    const scenarios = parseScenarios(body);

    return success({
      title,
      description,
      metadata,
      ...(legacyStatus ? { legacyStatus } : {}),
      requirements,
      scenarios,
      rawContent: content,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failure(new ValidationError(ErrorCode.SPEC_PARSE_ERROR, message));
  }
}

/**
 * 요구사항 파싱
 */
function parseRequirements(content: string): Requirement[] {
  // 요구사항 섹션 찾기 (## 요구사항 또는 ## Requirements)
  const reqSectionMatch = content.match(/##\s+(?:요구사항|Requirements?)\s*\n([\s\S]*?)(?=\n##\s+[^#]|\n---|$)/i);
  if (!reqSectionMatch) {
    // 전체 문서에서 RFC 2119 키워드 찾기
    return parseRequirementsFromContent(content);
  }

  return parseRequirementsFromContent(reqSectionMatch[1]);
}

/**
 * 컨텐츠에서 요구사항 추출
 */
function parseRequirementsFromContent(content: string): Requirement[] {
  const requirements: Requirement[] = [];
  const lines = content.split('\n');
  let reqId = 1;

  for (const line of lines) {
    const keywords = extractRfc2119Keywords(line);
    if (keywords.length > 0) {
      // 가장 강한 키워드 사용 (SHALL/MUST (NOT) > SHOULD (NOT) > MAY)
      const { level, negated } = resolveRequirementLevel(keywords);

      requirements.push({
        id: `REQ-${String(reqId++).padStart(3, '0')}`,
        level,
        ...(negated ? { negated } : {}),
        description: line.trim(),
        raw: line,
      });
    }
  }

  return requirements;
}

/**
 * 시나리오 파싱 (GIVEN-WHEN-THEN)
 */
function parseScenarios(content: string): Scenario[] {
  const scenarios: Scenario[] = [];

  // ### Scenario 섹션 찾기 (Scenario:, Scenario 1:, Scenario 1. 등 다양한 형식 지원)
  // `$` without the m flag is end of input, so the last scenario is kept even without a trailing newline
  const scenarioRegex = /###\s+Scenario[:\s]+(.+?)(?=\n###|\n##|\n---|$)/gis;
  let match: RegExpExecArray | null;

  while ((match = scenarioRegex.exec(content)) !== null) {
    const sectionContent = match[0];
    // "Scenario: name", "Scenario 1: name", "Scenario 1. name" → "name"
    // A leading number is only stripped when followed by a separator ("Scenario 2FA login" keeps "2FA")
    const nameMatch = sectionContent.match(/###[ \t]+Scenario[ \t]*(?:\d+(?=[:.)\s])[ \t]*)?[:.)]?[ \t]*(.+)/i);
    const name = nameMatch?.[1]?.trim() ?? 'Unnamed';

    const given: string[] = [];
    const then: string[] = [];
    let when = '';

    const lines = sectionContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // GIVEN 파싱
      const givenMatch = trimmed.match(/[-*]\s*\*?\*?GIVEN\*?\*?\s+(.+)/i);
      if (givenMatch) {
        given.push(givenMatch[1].trim());
        continue;
      }

      // WHEN 파싱
      const whenMatch = trimmed.match(/[-*]\s*\*?\*?WHEN\*?\*?\s+(.+)/i);
      if (whenMatch) {
        when = whenMatch[1].trim();
        continue;
      }

      // THEN 파싱
      const thenMatch = trimmed.match(/[-*]\s*\*?\*?THEN\*?\*?\s+(.+)/i);
      if (thenMatch) {
        then.push(thenMatch[1].trim());
      }
    }

    if (given.length > 0 && when && then.length > 0) {
      scenarios.push({ name, given, when, then });
    }
  }

  return scenarios;
}

/**
 * 스펙 파일 검증만 수행 (파싱 + 검증)
 */
export function validateSpecFormat(content: string): Result<true, ValidationError> {
  const result = parseSpec(content);
  if (!result.success) {
    return result as Result<true, ValidationError>;
  }

  const spec = result.data;

  // 요구사항 필수 검증
  if (spec.requirements.length === 0) {
    return failure(
      new ValidationError(
        ErrorCode.RFC2119_VIOLATION,
        'RFC 2119 키워드(SHALL, MUST, SHOULD, MAY)가 포함된 요구사항이 없습니다'
      )
    );
  }

  // 시나리오 필수 검증
  if (spec.scenarios.length === 0) {
    return failure(
      new ValidationError(
        ErrorCode.GWT_INVALID_FORMAT,
        'GIVEN-WHEN-THEN 형식의 시나리오가 없습니다'
      )
    );
  }

  return success(true);
}
