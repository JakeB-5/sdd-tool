/**
 * RFC 2119 키워드 변경 감지
 */
import type { Rfc2119Keyword, KeywordChange, KeywordImpact } from './schemas.js';

/**
 * RFC 2119 키워드 패턴
 */
const KEYWORD_PATTERN = /\b(SHALL NOT|SHALL|MUST NOT|MUST|SHOULD NOT|SHOULD|REQUIRED|RECOMMENDED|OPTIONAL|MAY)\b/gi;

/**
 * 키워드 강도 순위 (높을수록 강함)
 */
const KEYWORD_STRENGTH: Record<string, number> = {
  'SHALL': 3,
  'MUST': 3,
  'REQUIRED': 3,
  'SHALL NOT': 3,
  'MUST NOT': 3,
  'SHOULD': 2,
  'RECOMMENDED': 2,
  'SHOULD NOT': 2,
  'MAY': 1,
  'OPTIONAL': 1,
};

/**
 * 키워드 정규화 (대문자로)
 */
function normalizeKeyword(keyword: string): Rfc2119Keyword {
  return keyword.toUpperCase() as Rfc2119Keyword;
}

/**
 * 텍스트에서 RFC 2119 키워드 추출
 */
export function extractKeywords(content: string): Rfc2119Keyword[] {
  const matches = content.match(KEYWORD_PATTERN);
  if (!matches) return [];

  return matches.map(normalizeKeyword);
}

/**
 * 키워드 변경 영향도 계산
 */
export function getKeywordImpact(
  before: Rfc2119Keyword,
  after: Rfc2119Keyword
): KeywordImpact {
  const beforeStrength = KEYWORD_STRENGTH[before] || 0;
  const afterStrength = KEYWORD_STRENGTH[after] || 0;

  if (afterStrength > beforeStrength) return 'strengthened';
  if (afterStrength < beforeStrength) return 'weakened';
  return 'changed';
}

/**
 * 두 텍스트의 키워드 변경 분석
 */
export function analyzeKeywordChanges(
  reqId: string,
  beforeContent: string,
  afterContent: string
): KeywordChange[] {
  const beforeKeywords = extractKeywords(beforeContent);
  const afterKeywords = extractKeywords(afterContent);

  const changes: KeywordChange[] = [];

  // 간단한 비교: 위치별 비교
  const maxLen = Math.max(beforeKeywords.length, afterKeywords.length);

  for (let i = 0; i < maxLen; i++) {
    const before = beforeKeywords[i];
    const after = afterKeywords[i];

    if (before && after && before !== after) {
      changes.push({
        reqId,
        before,
        after,
        impact: getKeywordImpact(before, after),
      });
    }
  }

  return changes;
}

/**
 * 키워드 변경에 대한 경고 메시지 생성
 */
export function formatKeywordWarning(change: KeywordChange): string {
  const impactText = {
    strengthened: '강화',
    weakened: '약화',
    changed: '변경',
  };

  const impactEmoji = {
    strengthened: '⚠️',
    weakened: '⚡',
    changed: '🔄',
  };

  return `${impactEmoji[change.impact]} ${change.reqId}: ${change.before} → ${change.after} (${impactText[change.impact]})`;
}

/**
 * 여러 키워드 변경 요약
 */
export function summarizeKeywordChanges(changes: KeywordChange[]): {
  strengthened: number;
  weakened: number;
  changed: number;
} {
  const summary = {
    strengthened: 0,
    weakened: 0,
    changed: 0,
  };

  for (const change of changes) {
    summary[change.impact]++;
  }

  return summary;
}
