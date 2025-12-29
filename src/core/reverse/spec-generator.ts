/**
 * 스펙 생성기
 *
 * 추출된 심볼 정보를 SDD 스펙 형식으로 변환합니다.
 */

import type { SymbolInfo, SymbolKind } from '../../integrations/serena/types.js';
import { SymbolKindNames } from '../../integrations/serena/types.js';
import type { ConfidenceResult } from './confidence.js';

/**
 * 추출된 스펙 초안
 */
export interface ExtractedSpec {
  /** 스펙 ID */
  id: string;
  /** 스펙 이름 */
  name: string;
  /** 도메인 */
  domain: string;
  /** 설명 */
  description: string;
  /** 원본 심볼 */
  sourceSymbols: SymbolInfo[];
  /** 신뢰도 */
  confidence: ConfidenceResult;
  /** 시나리오 */
  scenarios: ExtractedScenario[];
  /** 계약 */
  contracts: ExtractedContract[];
  /** 관련 스펙 */
  relatedSpecs: string[];
  /** 메타데이터 */
  metadata: ExtractedSpecMeta;
}

/**
 * 추출된 시나리오
 */
export interface ExtractedScenario {
  /** 시나리오 이름 */
  name: string;
  /** Given (전제조건) */
  given: string;
  /** When (실행) */
  when: string;
  /** Then (결과) */
  then: string;
  /** 추론됨 여부 */
  inferred: boolean;
}

/**
 * 추출된 계약
 */
export interface ExtractedContract {
  /** 계약 타입 */
  type: 'input' | 'output' | 'invariant' | 'dependency';
  /** 설명 */
  description: string;
  /** 시그니처 */
  signature?: string;
}

/**
 * 스펙 메타데이터
 */
export interface ExtractedSpecMeta {
  /** 추출 시간 */
  extractedAt: Date;
  /** 원본 파일 */
  sourceFiles: string[];
  /** 원본 심볼 수 */
  symbolCount: number;
  /** 추출 버전 */
  version: string;
  /** 상태 */
  status: 'draft' | 'pending_review' | 'approved' | 'rejected';
}

/**
 * 스펙 ID 생성
 */
export function generateSpecId(domain: string, name: string): string {
  const sanitizedDomain = domain.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return `${sanitizedDomain}/${sanitizedName}`;
}

/**
 * 심볼에서 스펙 이름 추론
 */
export function inferSpecName(symbols: SymbolInfo[]): string {
  if (symbols.length === 0) return 'unknown';

  // 클래스가 있으면 클래스 이름 사용
  const classSymbol = symbols.find(s => s.kind === 5); // Class
  if (classSymbol) {
    return formatSpecName(classSymbol.name);
  }

  // 함수가 있으면 가장 긴 이름 사용
  const functionSymbols = symbols.filter(s => s.kind === 12 || s.kind === 6); // Function, Method
  if (functionSymbols.length > 0) {
    const longestName = functionSymbols.reduce((a, b) =>
      a.name.length >= b.name.length ? a : b
    );
    return formatSpecName(longestName.name);
  }

  // 첫 번째 심볼 이름 사용
  return formatSpecName(symbols[0].name);
}

/**
 * 스펙 이름 포맷팅
 */
function formatSpecName(name: string): string {
  // camelCase/PascalCase를 공백으로 분리
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .trim();
}

/**
 * 심볼에서 설명 추론
 */
export function inferDescription(symbols: SymbolInfo[]): string {
  // 문서화가 있는 심볼에서 설명 추출
  for (const symbol of symbols) {
    if (symbol.documentation) {
      // 첫 문장 추출
      const firstSentence = symbol.documentation.split(/[.!?]/)[0];
      if (firstSentence.length > 10) {
        return firstSentence.trim();
      }
    }
  }

  // 문서화가 없으면 심볼 정보로 생성
  const symbolTypes = new Set(symbols.map(s => SymbolKindNames[s.kind] || 'symbol'));
  const typeList = [...symbolTypes].slice(0, 3).join(', ');
  return `${symbols.length}개의 ${typeList}을(를) 포함하는 모듈`;
}

/**
 * 시나리오 추론
 */
export function inferScenarios(symbols: SymbolInfo[]): ExtractedScenario[] {
  const scenarios: ExtractedScenario[] = [];

  for (const symbol of symbols) {
    // 함수/메서드에서 시나리오 생성
    if (symbol.kind === 6 || symbol.kind === 12) { // Method, Function
      const scenario = createScenarioFromFunction(symbol);
      if (scenario) {
        scenarios.push(scenario);
      }
    }
  }

  // 시나리오가 없으면 기본 시나리오 생성
  if (scenarios.length === 0) {
    scenarios.push({
      name: '기본 동작',
      given: '시스템이 초기화되었을 때',
      when: '사용자가 기능을 호출하면',
      then: '예상된 결과가 반환되어야 한다',
      inferred: true,
    });
  }

  return scenarios;
}

/**
 * 함수에서 시나리오 생성
 */
function createScenarioFromFunction(symbol: SymbolInfo): ExtractedScenario | null {
  const name = symbol.name;

  // 동사 기반 시나리오 생성
  const verbPatterns: [RegExp, (match: RegExpMatchArray) => ExtractedScenario][] = [
    [/^get(.+)$/i, (m) => ({
      name: `${m[1]} 조회`,
      given: `${m[1]}이(가) 존재할 때`,
      when: `${name}을(를) 호출하면`,
      then: `${m[1]} 정보가 반환되어야 한다`,
      inferred: true,
    })],
    [/^create(.+)$/i, (m) => ({
      name: `${m[1]} 생성`,
      given: `유효한 ${m[1]} 데이터가 주어졌을 때`,
      when: `${name}을(를) 호출하면`,
      then: `새로운 ${m[1]}이(가) 생성되어야 한다`,
      inferred: true,
    })],
    [/^update(.+)$/i, (m) => ({
      name: `${m[1]} 수정`,
      given: `기존 ${m[1]}이(가) 존재할 때`,
      when: `${name}을(를) 호출하면`,
      then: `${m[1]}이(가) 수정되어야 한다`,
      inferred: true,
    })],
    [/^delete(.+)$/i, (m) => ({
      name: `${m[1]} 삭제`,
      given: `${m[1]}이(가) 존재할 때`,
      when: `${name}을(를) 호출하면`,
      then: `${m[1]}이(가) 삭제되어야 한다`,
      inferred: true,
    })],
    [/^find(.+)$/i, (m) => ({
      name: `${m[1]} 검색`,
      given: `검색 조건이 주어졌을 때`,
      when: `${name}을(를) 호출하면`,
      then: `조건에 맞는 ${m[1]}이(가) 반환되어야 한다`,
      inferred: true,
    })],
    [/^validate(.+)$/i, (m) => ({
      name: `${m[1]} 검증`,
      given: `${m[1]} 데이터가 주어졌을 때`,
      when: `${name}을(를) 호출하면`,
      then: `유효성 검사 결과가 반환되어야 한다`,
      inferred: true,
    })],
    [/^is(.+)$|^has(.+)$|^can(.+)$/i, (m) => ({
      name: `${m[1] || m[2] || m[3]} 확인`,
      given: `대상이 주어졌을 때`,
      when: `${name}을(를) 호출하면`,
      then: `boolean 결과가 반환되어야 한다`,
      inferred: true,
    })],
  ];

  for (const [pattern, generator] of verbPatterns) {
    const match = name.match(pattern);
    if (match) {
      return generator(match);
    }
  }

  // 일반적인 시나리오
  return {
    name: `${formatSpecName(name)} 실행`,
    given: '필요한 전제조건이 충족되었을 때',
    when: `${name}을(를) 호출하면`,
    then: '예상된 결과가 반환되어야 한다',
    inferred: true,
  };
}

/**
 * 계약 추론
 */
export function inferContracts(symbols: SymbolInfo[]): ExtractedContract[] {
  const contracts: ExtractedContract[] = [];

  for (const symbol of symbols) {
    // 시그니처에서 입출력 계약 추출
    if (symbol.signature) {
      const inputContract = extractInputContract(symbol);
      if (inputContract) {
        contracts.push(inputContract);
      }

      const outputContract = extractOutputContract(symbol);
      if (outputContract) {
        contracts.push(outputContract);
      }
    }
  }

  return contracts;
}

/**
 * 입력 계약 추출
 */
function extractInputContract(symbol: SymbolInfo): ExtractedContract | null {
  if (!symbol.signature) return null;

  // 파라미터 추출 (간단한 파싱)
  const paramMatch = symbol.signature.match(/\((.*?)\)/);
  if (paramMatch && paramMatch[1].trim()) {
    return {
      type: 'input',
      description: `${symbol.name}의 입력 파라미터`,
      signature: paramMatch[1].trim(),
    };
  }

  return null;
}

/**
 * 출력 계약 추출
 */
function extractOutputContract(symbol: SymbolInfo): ExtractedContract | null {
  if (!symbol.signature) return null;

  // 반환 타입 추출
  const returnMatch = symbol.signature.match(/:\s*([^=]+)$/);
  if (returnMatch) {
    return {
      type: 'output',
      description: `${symbol.name}의 반환 타입`,
      signature: returnMatch[1].trim(),
    };
  }

  return null;
}

/**
 * 관련 스펙 추론
 */
export function inferRelatedSpecs(
  symbols: SymbolInfo[],
  allDomains: string[]
): string[] {
  const relatedSpecs: Set<string> = new Set();

  for (const symbol of symbols) {
    // 임포트 분석 (시그니처나 문서에서 다른 모듈 참조)
    if (symbol.documentation) {
      for (const domain of allDomains) {
        if (symbol.documentation.toLowerCase().includes(domain.toLowerCase())) {
          relatedSpecs.add(domain);
        }
      }
    }
  }

  return [...relatedSpecs];
}

/**
 * 심볼들로부터 스펙 초안 생성
 */
export function generateSpec(
  domain: string,
  symbols: SymbolInfo[],
  confidence: ConfidenceResult,
  allDomains: string[] = []
): ExtractedSpec {
  const name = inferSpecName(symbols);
  const id = generateSpecId(domain, name);

  return {
    id,
    name,
    domain,
    description: inferDescription(symbols),
    sourceSymbols: symbols,
    confidence,
    scenarios: inferScenarios(symbols),
    contracts: inferContracts(symbols),
    relatedSpecs: inferRelatedSpecs(symbols, allDomains),
    metadata: {
      extractedAt: new Date(),
      sourceFiles: [...new Set(symbols.map(s => s.location.relativePath))],
      symbolCount: symbols.length,
      version: '1.0.0',
      status: 'draft',
    },
  };
}

/**
 * 스펙을 마크다운으로 포맷팅
 */
export function formatSpecAsMarkdown(spec: ExtractedSpec): string {
  const lines: string[] = [];

  // 헤더
  lines.push(`# ${spec.name}`);
  lines.push('');
  lines.push(`> 도메인: \`${spec.domain}\``);
  lines.push(`> 신뢰도: ${spec.confidence.grade} (${spec.confidence.score}%)`);
  lines.push(`> 상태: ${spec.metadata.status}`);
  lines.push('');

  // 설명
  lines.push('## 설명');
  lines.push('');
  lines.push(spec.description);
  lines.push('');

  // 시나리오
  if (spec.scenarios.length > 0) {
    lines.push('## 시나리오');
    lines.push('');
    for (const scenario of spec.scenarios) {
      lines.push(`### ${scenario.name}${scenario.inferred ? ' *(추론됨)*' : ''}`);
      lines.push('');
      lines.push(`**Given** ${scenario.given}`);
      lines.push(`**When** ${scenario.when}`);
      lines.push(`**Then** ${scenario.then}`);
      lines.push('');
    }
  }

  // 계약
  if (spec.contracts.length > 0) {
    lines.push('## 계약');
    lines.push('');
    for (const contract of spec.contracts) {
      lines.push(`### ${contract.type.toUpperCase()}`);
      lines.push('');
      lines.push(contract.description);
      if (contract.signature) {
        lines.push('');
        lines.push('```typescript');
        lines.push(contract.signature);
        lines.push('```');
      }
      lines.push('');
    }
  }

  // 관련 스펙
  if (spec.relatedSpecs.length > 0) {
    lines.push('## 관련 스펙');
    lines.push('');
    for (const related of spec.relatedSpecs) {
      lines.push(`- ${related}`);
    }
    lines.push('');
  }

  // 메타데이터
  lines.push('---');
  lines.push('');
  lines.push('## 메타데이터');
  lines.push('');
  lines.push(`- 추출 시간: ${spec.metadata.extractedAt.toISOString()}`);
  lines.push(`- 원본 파일: ${spec.metadata.sourceFiles.join(', ')}`);
  lines.push(`- 심볼 수: ${spec.metadata.symbolCount}`);
  lines.push(`- 버전: ${spec.metadata.version}`);
  lines.push('');

  // 신뢰도 상세
  if (spec.confidence.suggestions.length > 0) {
    lines.push('### 개선 제안');
    lines.push('');
    for (const suggestion of spec.confidence.suggestions) {
      lines.push(`- ${suggestion}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 스펙을 JSON으로 포맷팅
 */
export function formatSpecAsJson(spec: ExtractedSpec): string {
  return JSON.stringify(spec, (key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }, 2);
}
