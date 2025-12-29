/**
 * 스펙 관련 Zod 스키마 정의
 */
import { z } from 'zod';

/**
 * RFC 2119 키워드
 */
export const RFC2119_KEYWORDS = ['SHALL', 'MUST', 'SHOULD', 'MAY', 'SHALL NOT', 'MUST NOT'] as const;
export type Rfc2119Keyword = (typeof RFC2119_KEYWORDS)[number];

/**
 * 스펙 상태
 */
export const SpecStatusSchema = z.enum(['draft', 'review', 'approved', 'implemented']);
export type SpecStatus = z.infer<typeof SpecStatusSchema>;

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
 * 스펙 메타데이터 (YAML frontmatter)
 */
export const SpecMetadataSchema = z.object({
  status: SpecStatusSchema.default('draft'),
  created: DateStringSchema,
  depends: z.string().nullable().optional(),
  command: z.string().optional(),
  author: z.string().optional(),
  id: z.string().optional(),
  constitution_version: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  /** 소속 도메인 ID (Phase 1 추가) */
  domain: z.string().optional(),
  /** 추출 출처 (역추출 시 사용) */
  extracted_from: z.string().optional(),
  /** 리뷰 필요 플래그 */
  needs_review: z.boolean().optional(),
  /** 신뢰도 점수 (역추출 시 사용, 0-100) */
  confidence: z.number().min(0).max(100).optional(),
});
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
 */
export function extractRfc2119Keywords(text: string): Rfc2119Keyword[] {
  const keywords: Rfc2119Keyword[] = [];

  // SHALL NOT, MUST NOT를 먼저 체크 (더 긴 패턴)
  if (/SHALL\s+NOT/i.test(text)) keywords.push('SHALL NOT');
  if (/MUST\s+NOT/i.test(text)) keywords.push('MUST NOT');

  // 단일 키워드 체크 (NOT이 붙지 않은 경우만)
  if (/(?<!NOT\s)SHALL(?!\s+NOT)/i.test(text)) keywords.push('SHALL');
  if (/(?<!NOT\s)MUST(?!\s+NOT)/i.test(text)) keywords.push('MUST');
  if (/SHOULD/i.test(text)) keywords.push('SHOULD');
  if (/MAY/i.test(text)) keywords.push('MAY');

  return [...new Set(keywords)];
}
