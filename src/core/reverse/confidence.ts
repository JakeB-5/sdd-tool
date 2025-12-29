/**
 * 추출 신뢰도 계산
 *
 * 역추출된 스펙의 품질을 평가합니다.
 */

import type { SymbolInfo, SymbolKind } from '../../integrations/serena/types.js';

/**
 * 신뢰도 요인
 */
export interface ConfidenceFactors {
  /** 문서화 품질 (0-100) */
  documentation: number;
  /** 네이밍 명확성 (0-100) */
  naming: number;
  /** 구조 일관성 (0-100) */
  structure: number;
  /** 테스트 커버리지 (0-100) */
  testCoverage: number;
  /** 타입 명확성 (0-100) */
  typing: number;
}

/**
 * 신뢰도 결과
 */
export interface ConfidenceResult {
  /** 종합 점수 (0-100) */
  score: number;
  /** 등급 */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** 세부 요인 */
  factors: ConfidenceFactors;
  /** 개선 제안 */
  suggestions: string[];
}

/**
 * 문서화 품질 평가
 */
export function evaluateDocumentation(symbol: SymbolInfo): number {
  let score = 0;

  // JSDoc/docstring 존재
  if (symbol.documentation) {
    score += 30;

    const doc = symbol.documentation;
    // 설명 길이
    if (doc.length > 50) score += 20;
    if (doc.length > 100) score += 10;

    // @param, @returns 등 태그
    if (doc.includes('@param') || doc.includes(':param')) score += 15;
    if (doc.includes('@returns') || doc.includes(':returns')) score += 10;
    if (doc.includes('@example') || doc.includes('Example')) score += 15;
  }

  return Math.min(score, 100);
}

/**
 * 네이밍 명확성 평가
 */
export function evaluateNaming(symbol: SymbolInfo): number {
  const name = symbol.name;
  let score = 50; // 기본 점수

  // 길이
  if (name.length >= 3 && name.length <= 30) score += 10;
  if (name.length < 3) score -= 20;
  if (name.length > 50) score -= 10;

  // 카멜케이스/스네이크케이스 사용
  const isCamelCase = /^[a-z][a-zA-Z0-9]*$/.test(name);
  const isPascalCase = /^[A-Z][a-zA-Z0-9]*$/.test(name);
  const isSnakeCase = /^[a-z][a-z0-9_]*$/.test(name);
  if (isCamelCase || isPascalCase || isSnakeCase) score += 15;

  // 동사로 시작하는 함수명 (좋은 패턴)
  const verbPrefixes = ['get', 'set', 'create', 'update', 'delete', 'find', 'is', 'has', 'can', 'should', 'validate', 'process', 'handle', 'parse', 'format', 'build', 'init', 'load', 'save'];
  if (verbPrefixes.some(v => name.toLowerCase().startsWith(v))) score += 15;

  // 단일 문자 이름은 페널티
  if (name.length === 1) score -= 30;

  // 숫자로 시작하면 페널티
  if (/^[0-9]/.test(name)) score -= 20;

  // 약어만 있는 경우 페널티
  if (/^[A-Z]{2,}$/.test(name)) score -= 10;

  return Math.max(0, Math.min(score, 100));
}

/**
 * 구조 일관성 평가
 */
export function evaluateStructure(
  symbol: SymbolInfo,
  siblingSymbols: SymbolInfo[]
): number {
  let score = 50;

  // 같은 파일의 심볼들과 비교
  const siblings = siblingSymbols.filter(
    s => s.location.relativePath === symbol.location.relativePath
  );

  if (siblings.length === 0) return score;

  // 네이밍 패턴 일관성
  const namingPatterns = siblings.map(s => detectNamingPattern(s.name));
  const thisPattern = detectNamingPattern(symbol.name);
  const patternConsistency = namingPatterns.filter(p => p === thisPattern).length / siblings.length;
  score += patternConsistency * 30;

  // 심볼 종류 분포
  const kindCounts = new Map<SymbolKind, number>();
  for (const s of siblings) {
    kindCounts.set(s.kind, (kindCounts.get(s.kind) || 0) + 1);
  }
  const kindVariety = kindCounts.size;
  if (kindVariety <= 3) score += 10; // 종류가 적으면 집중된 파일
  if (kindVariety > 5) score -= 10; // 너무 많으면 혼잡

  return Math.max(0, Math.min(score, 100));
}

/**
 * 네이밍 패턴 감지
 */
function detectNamingPattern(name: string): string {
  if (/^[a-z][a-zA-Z0-9]*$/.test(name)) return 'camelCase';
  if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) return 'PascalCase';
  if (/^[a-z][a-z0-9_]*$/.test(name)) return 'snake_case';
  if (/^[A-Z][A-Z0-9_]*$/.test(name)) return 'SCREAMING_SNAKE_CASE';
  return 'mixed';
}

/**
 * 테스트 커버리지 추정
 */
export function estimateTestCoverage(
  symbol: SymbolInfo,
  allSymbols: SymbolInfo[]
): number {
  const symbolPath = symbol.location.relativePath;
  const testPatterns = [
    symbolPath.replace(/\.([^.]+)$/, '.test.$1'),
    symbolPath.replace(/\.([^.]+)$/, '.spec.$1'),
    symbolPath.replace(/src\//, 'tests/'),
    symbolPath.replace(/src\//, '__tests__/'),
  ];

  // 테스트 파일 존재 여부
  const hasTestFile = allSymbols.some(s =>
    testPatterns.some(p =>
      s.location.relativePath.includes(p.replace(/\\/g, '/')) ||
      s.location.relativePath.includes(p.replace(/\//g, '\\'))
    )
  );

  if (hasTestFile) {
    return 60; // 테스트 파일 존재
  }

  // describe/it/test 심볼 존재 확인
  const hasTestSymbols = allSymbols.some(s =>
    s.name.toLowerCase().includes('test') ||
    s.name.toLowerCase().includes('spec')
  );

  if (hasTestSymbols) {
    return 30;
  }

  return 0;
}

/**
 * 타입 명확성 평가
 */
export function evaluateTyping(symbol: SymbolInfo): number {
  let score = 40; // 기본 점수

  // 시그니처 존재
  if (symbol.signature) {
    score += 20;

    const sig = symbol.signature;

    // 반환 타입 명시
    if (sig.includes(':') || sig.includes('->')) score += 15;

    // 파라미터 타입 명시
    if (sig.includes(': ') && sig.includes('(')) score += 15;

    // any 타입 사용 페널티
    if (sig.includes('any')) score -= 20;

    // unknown 타입 (적절한 사용)
    if (sig.includes('unknown')) score += 5;

    // 제네릭 사용
    if (sig.includes('<') && sig.includes('>')) score += 10;
  }

  return Math.max(0, Math.min(score, 100));
}

/**
 * 등급 계산
 */
export function calculateGrade(score: number): ConfidenceResult['grade'] {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * 개선 제안 생성
 */
export function generateSuggestions(factors: ConfidenceFactors): string[] {
  const suggestions: string[] = [];

  if (factors.documentation < 50) {
    suggestions.push('JSDoc/docstring을 추가하여 문서화를 개선하세요');
  }

  if (factors.naming < 50) {
    suggestions.push('명확한 네이밍 규칙을 적용하세요 (동사+명사 패턴)');
  }

  if (factors.structure < 50) {
    suggestions.push('파일 내 심볼 구조를 정리하세요');
  }

  if (factors.testCoverage < 30) {
    suggestions.push('테스트 파일을 추가하세요');
  }

  if (factors.typing < 50) {
    suggestions.push('타입 시그니처를 명시하세요');
  }

  return suggestions;
}

/**
 * 심볼의 신뢰도 계산
 */
export function calculateConfidence(
  symbol: SymbolInfo,
  allSymbols: SymbolInfo[]
): ConfidenceResult {
  const factors: ConfidenceFactors = {
    documentation: evaluateDocumentation(symbol),
    naming: evaluateNaming(symbol),
    structure: evaluateStructure(symbol, allSymbols),
    testCoverage: estimateTestCoverage(symbol, allSymbols),
    typing: evaluateTyping(symbol),
  };

  // 가중 평균
  const weights = {
    documentation: 0.25,
    naming: 0.2,
    structure: 0.15,
    testCoverage: 0.2,
    typing: 0.2,
  };

  const score = Math.round(
    factors.documentation * weights.documentation +
    factors.naming * weights.naming +
    factors.structure * weights.structure +
    factors.testCoverage * weights.testCoverage +
    factors.typing * weights.typing
  );

  return {
    score,
    grade: calculateGrade(score),
    factors,
    suggestions: generateSuggestions(factors),
  };
}

/**
 * 여러 심볼의 평균 신뢰도 계산
 */
export function calculateAverageConfidence(
  symbols: SymbolInfo[],
  allSymbols: SymbolInfo[]
): ConfidenceResult {
  if (symbols.length === 0) {
    return {
      score: 0,
      grade: 'F',
      factors: {
        documentation: 0,
        naming: 0,
        structure: 0,
        testCoverage: 0,
        typing: 0,
      },
      suggestions: ['분석할 심볼이 없습니다'],
    };
  }

  const results = symbols.map(s => calculateConfidence(s, allSymbols));

  const avgFactors: ConfidenceFactors = {
    documentation: average(results.map(r => r.factors.documentation)),
    naming: average(results.map(r => r.factors.naming)),
    structure: average(results.map(r => r.factors.structure)),
    testCoverage: average(results.map(r => r.factors.testCoverage)),
    typing: average(results.map(r => r.factors.typing)),
  };

  const avgScore = average(results.map(r => r.score));

  return {
    score: Math.round(avgScore),
    grade: calculateGrade(avgScore),
    factors: avgFactors,
    suggestions: generateSuggestions(avgFactors),
  };
}

/**
 * 평균 계산
 */
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}
