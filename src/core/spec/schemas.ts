/**
 * 스펙 관련 Zod 스키마 정의
 */
import { z } from 'zod';
import { SpecStatusSchema } from './status.js';
import { normalizeVersion } from '../constitution/schemas.js';

export { SpecStatusSchema, type SpecStatus } from './status.js';

/**
 * RFC 2119 키워드
 */
export const RFC2119_KEYWORDS = [
  'SHALL',
  'MUST',
  'SHOULD',
  'MAY',
  'SHALL NOT',
  'MUST NOT',
  'SHOULD NOT',
] as const;
export type Rfc2119Keyword = (typeof RFC2119_KEYWORDS)[number];

/**
 * 날짜 스키마 (Date 객체 또는 문자열 허용, 문자열로 변환)
 */
const DateStringSchema = z.preprocess(
  (val) => {
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    return val;
  },
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식: YYYY-MM-DD').optional()
);

/**
 * YAML이 숫자로 읽은 버전 값을 문자열로 변환 (`1.0` → "1.0", `2.5` → "2.5")
 */
export function toVersionString(val: unknown): unknown {
  if (typeof val === 'number') {
    return Number.isInteger(val) ? `${val}.0` : String(val);
  }
  return val;
}

/**
 * 버전 문자열 스키마
 */
const VersionStringSchema = z.preprocess(toVersionString, z.string().optional());

/**
 * constitution_version 스키마: X.Y.Z로 정규화 (`1.0` → "1.0.0")
 * Unparseable values are kept verbatim so the constitution check can warn about them.
 */
const ConstitutionVersionSchema = z.preprocess(
  (val) => (val === undefined || val === null ? undefined : (normalizeVersion(val) ?? String(val))),
  z.string().optional()
);

/**
 * 단일 문자열/쉼표 구분 문자열/목록을 문자열 목록으로 정규화 (그 외 값은 그대로)
 */
export function toStringList(val: unknown): unknown {
  if (typeof val === 'string') {
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (Array.isArray(val)) {
    return val.filter((v) => v !== null && v !== undefined && v !== '').map(String);
  }
  return val;
}

/**
 * 문자열 목록 스키마 (단일 문자열/쉼표 구분 문자열/목록 허용 → string[])
 */
const StringListSchema = z.preprocess(toStringList, z.array(z.string()).nullable().optional());

/**
 * 스펙 메타데이터 (YAML frontmatter)
 *
 * Unknown fields are kept (passthrough) so tools reading the parsed metadata
 * see the same frontmatter the author wrote.
 */
export const SpecMetadataSchema = z.object({
  status: SpecStatusSchema.default('draft'),
  created: DateStringSchema,
  updated: DateStringSchema,
  title: z.coerce.string().optional(),
  version: VersionStringSchema,
  depends: StringListSchema,
  command: z.string().optional(),
  author: z.string().optional(),
  id: z.coerce.string().optional(),
  constitution_version: ConstitutionVersionSchema,
  dependencies: StringListSchema,
  tags: StringListSchema,
  phase: z.coerce.string().optional(),
  /** 소속 도메인 ID (Phase 1 추가) */
  domain: z.string().optional(),
  /** 추출 출처 (역추출 시 사용) */
  extracted_from: z.string().optional(),
  /** 리뷰 필요 플래그 */
  needs_review: z.boolean().optional(),
  /** 신뢰도 점수 (역추출 시 사용, 0-100) */
  confidence: z.number().min(0).max(100).optional(),
}).passthrough();
export type SpecMetadata = z.infer<typeof SpecMetadataSchema>;

/**
 * 요구사항 레벨
 */
export const RequirementLevelSchema = z.enum(['SHALL', 'MUST', 'SHOULD', 'MAY']);
export type RequirementLevel = z.infer<typeof RequirementLevelSchema>;

/**
 * 요구사항
 */
export const RequirementSchema = z.object({
  id: z.string(),
  level: RequirementLevelSchema,
  /** 부정형 키워드(SHALL NOT, MUST NOT, SHOULD NOT)로 정의된 요구사항 */
  negated: z.boolean().optional(),
  description: z.string(),
  raw: z.string(),
});
export type Requirement = z.infer<typeof RequirementSchema>;

/**
 * 시나리오 (GIVEN-WHEN-THEN)
 */
export const ScenarioSchema = z.object({
  name: z.string(),
  given: z.array(z.string()).min(1, 'GIVEN 조건이 최소 1개 필요합니다'),
  when: z.string().min(1, 'WHEN 조건이 필요합니다'),
  then: z.array(z.string()).min(1, 'THEN 결과가 최소 1개 필요합니다'),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

/**
 * 파싱된 스펙 문서
 */
export const ParsedSpecSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  metadata: SpecMetadataSchema,
  /** frontmatter의 status가 레거시 별칭이었을 때 원래 값 (metadata.status는 정규화됨) */
  legacyStatus: z.string().optional(),
  requirements: z.array(RequirementSchema),
  scenarios: z.array(ScenarioSchema),
  rawContent: z.string(),
});
export type ParsedSpec = z.infer<typeof ParsedSpecSchema>;

/**
 * 키워드가 RFC 2119 키워드인지 확인
 */
export function isRfc2119Keyword(keyword: string): keyword is Rfc2119Keyword {
  return RFC2119_KEYWORDS.includes(keyword as Rfc2119Keyword);
}

/**
 * 문자열에서 RFC 2119 키워드 추출
 *
 * RFC 2119 keywords are only meaningful in uppercase, so matching is
 * case-sensitive and bounded by word boundaries ("This may be fine." has none).
 */
export function extractRfc2119Keywords(text: string): Rfc2119Keyword[] {
  const keywords: Rfc2119Keyword[] = [];

  // Negated forms first (longer patterns)
  if (/\bSHALL\s+NOT\b/.test(text)) keywords.push('SHALL NOT');
  if (/\bMUST\s+NOT\b/.test(text)) keywords.push('MUST NOT');
  if (/\bSHOULD\s+NOT\b/.test(text)) keywords.push('SHOULD NOT');

  // Positive forms (not followed by NOT)
  if (/\bSHALL\b(?!\s+NOT\b)/.test(text)) keywords.push('SHALL');
  if (/\bMUST\b(?!\s+NOT\b)/.test(text)) keywords.push('MUST');
  if (/\bSHOULD\b(?!\s+NOT\b)/.test(text)) keywords.push('SHOULD');
  if (/\bMAY\b/.test(text)) keywords.push('MAY');

  return keywords;
}

/**
 * 키워드 목록에서 요구사항 레벨 결정
 * SHALL/MUST (NOT 포함) > SHOULD (NOT 포함) > MAY
 */
export function resolveRequirementLevel(
  keywords: readonly Rfc2119Keyword[]
): { level: RequirementLevel; negated: boolean } {
  const has = (k: Rfc2119Keyword): boolean => keywords.includes(k);

  if (has('SHALL') || has('SHALL NOT')) return { level: 'SHALL', negated: !has('SHALL') };
  if (has('MUST') || has('MUST NOT')) return { level: 'MUST', negated: !has('MUST') };
  if (has('SHOULD') || has('SHOULD NOT')) return { level: 'SHOULD', negated: !has('SHOULD') };
  return { level: 'MAY', negated: false };
}
