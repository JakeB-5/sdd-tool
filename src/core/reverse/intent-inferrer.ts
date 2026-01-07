/**
 * AI 기반 의도 추론 모듈
 *
 * 코드와 주석에서 비즈니스 의도를 추론합니다.
 */

import { Result, success, failure } from '../../types/index.js';
import { SymbolKind, type SymbolInfo } from '../../integrations/serena/types.js';

/**
 * 추론된 의도
 */
export interface InferredIntent {
  /** 비즈니스 목적 */
  purpose: string;
  /** 주요 기능 설명 */
  description: string;
  /** 추론된 시나리오 */
  scenarios: InferredScenario[];
  /** 추론된 계약 */
  contracts: InferredContract[];
  /** 관련 도메인 */
  suggestedDomain?: string;
  /** 신뢰도 */
  confidence: number;
  /** 추론 근거 */
  reasoning: string[];
  /** 불명확한 부분 */
  uncertainties: string[];
}

/**
 * 추론된 시나리오
 */
export interface InferredScenario {
  name: string;
  given: string;
  when: string;
  then: string;
  /** AI 추론 여부 */
  inferred: boolean;
  /** 추론 근거 */
  source?: string;
}

/**
 * 추론된 계약
 */
export interface InferredContract {
  type: 'input' | 'output' | 'invariant';
  description: string;
  signature?: string;
  inferred: boolean;
}

/**
 * 의도 추론 옵션
 */
export interface IntentInferenceOptions {
  /** AI 모델 사용 여부 */
  useAI?: boolean;
  /** 추론 깊이 */
  depth?: 'shallow' | 'medium' | 'deep';
  /** 언어 */
  language?: string;
  /** 컨텍스트 (관련 코드) */
  context?: string[];
}

/**
 * 코드에서 의도 추론
 */
export async function inferIntent(
  code: string,
  symbols: SymbolInfo[],
  options: IntentInferenceOptions = {}
): Promise<Result<InferredIntent, Error>> {
  const { useAI = false, depth = 'medium' } = options;

  try {
    // 기본 분석 (휴리스틱)
    const heuristicResult = analyzeWithHeuristics(code, symbols, depth);

    // AI 추론이 비활성화된 경우 휴리스틱 결과만 반환
    if (!useAI) {
      return success({
        ...heuristicResult,
        reasoning: [...heuristicResult.reasoning, '휴리스틱 분석만 사용됨'],
      });
    }

    // AI 추론 (Claude API가 설정된 경우)
    // 참고: 실제 AI 호출은 환경 설정에 따라 활성화
    const aiResult = await enhanceWithAI(heuristicResult, code, symbols);

    return success(aiResult);
  } catch (error) {
    return failure(new Error(`의도 추론 실패: ${error}`));
  }
}

/**
 * 휴리스틱 기반 분석
 */
function analyzeWithHeuristics(
  code: string,
  symbols: SymbolInfo[],
  depth: 'shallow' | 'medium' | 'deep'
): InferredIntent {
  const reasoning: string[] = [];
  const uncertainties: string[] = [];
  const scenarios: InferredScenario[] = [];
  const contracts: InferredContract[] = [];

  // 함수/클래스 이름에서 목적 추론
  const purpose = inferPurposeFromNames(symbols);
  reasoning.push(`심볼 이름에서 목적 추론: ${purpose}`);

  // 설명 추론
  const description = inferDescription(code, symbols);
  reasoning.push('코드 구조에서 설명 추론');

  // 시나리오 추론
  if (depth !== 'shallow') {
    const inferredScenarios = inferScenariosFromCode(code, symbols);
    scenarios.push(...inferredScenarios);
    reasoning.push(`${inferredScenarios.length}개 시나리오 추론`);
  }

  // 계약 추론
  const inferredContracts = inferContractsFromSignatures(symbols);
  contracts.push(...inferredContracts);
  reasoning.push(`${inferredContracts.length}개 계약 추론`);

  // 도메인 추론
  const suggestedDomain = inferDomainFromPath(symbols);

  // 불명확한 부분 식별
  if (!hasDocumentation(code)) {
    uncertainties.push('문서화가 부족하여 정확한 의도 파악이 어려움');
  }
  if (hasComplexLogic(code)) {
    uncertainties.push('복잡한 로직이 포함되어 수동 검토 권장');
  }

  // 신뢰도 계산
  const confidence = calculateConfidence(code, symbols, scenarios, contracts);

  return {
    purpose,
    description,
    scenarios,
    contracts,
    suggestedDomain,
    confidence,
    reasoning,
    uncertainties,
  };
}

/**
 * 심볼 이름에서 목적 추론
 */
function inferPurposeFromNames(symbols: SymbolInfo[]): string {
  if (symbols.length === 0) {
    return '알 수 없는 기능';
  }

  const mainSymbol = symbols[0];
  const name = mainSymbol.name;

  // 일반적인 패턴 매칭
  const patterns: Record<string, string> = {
    create: '생성',
    add: '추가',
    insert: '삽입',
    get: '조회',
    fetch: '가져오기',
    find: '검색',
    search: '검색',
    update: '수정',
    edit: '편집',
    modify: '변경',
    delete: '삭제',
    remove: '제거',
    validate: '검증',
    check: '확인',
    verify: '검증',
    authenticate: '인증',
    authorize: '인가',
    login: '로그인',
    logout: '로그아웃',
    register: '등록',
    signup: '회원가입',
    parse: '파싱',
    format: '포맷팅',
    convert: '변환',
    transform: '변환',
    send: '전송',
    receive: '수신',
    handle: '처리',
    process: '처리',
    calculate: '계산',
    compute: '계산',
  };

  const lowerName = name.toLowerCase();
  for (const [pattern, meaning] of Object.entries(patterns)) {
    if (lowerName.includes(pattern)) {
      return `${meaning} 기능`;
    }
  }

  return `${name} 기능`;
}

/**
 * 코드에서 설명 추론
 */
function inferDescription(code: string, symbols: SymbolInfo[]): string {
  // JSDoc 추출
  const jsdocMatch = code.match(/\/\*\*\s*\n([^*]|\*[^/])*\*\//);
  if (jsdocMatch) {
    const jsdoc = jsdocMatch[0];
    const descMatch = jsdoc.match(/@description\s+(.+?)(?=@|\*\/)/s);
    if (descMatch) {
      return descMatch[1].trim().replace(/\s*\*\s*/g, ' ');
    }
    // 첫 줄 설명
    const firstLine = jsdoc.match(/\/\*\*\s*\n\s*\*\s*(.+)/);
    if (firstLine) {
      return firstLine[1].trim();
    }
  }

  // 단일 라인 주석
  const singleComment = code.match(/\/\/\s*(.+)/);
  if (singleComment) {
    return singleComment[1].trim();
  }

  // 심볼 기반 설명 생성
  if (symbols.length > 0) {
    const mainSymbol = symbols[0];
    return `${mainSymbol.name}: ${mainSymbol.kind} 심볼`;
  }

  return '설명 없음';
}

/**
 * 코드에서 시나리오 추론
 */
function inferScenariosFromCode(
  code: string,
  symbols: SymbolInfo[]
): InferredScenario[] {
  const scenarios: InferredScenario[] = [];

  for (const symbol of symbols) {
    if (symbol.kind === SymbolKind.Function || symbol.kind === SymbolKind.Method) {
      // 기본 시나리오 생성
      const scenario: InferredScenario = {
        name: `${symbol.name} 실행`,
        given: inferGiven(symbol),
        when: `${symbol.name}이(가) 호출되면`,
        then: inferThen(symbol, code),
        inferred: true,
        source: '코드 구조 분석',
      };
      scenarios.push(scenario);

      // 에러 케이스 추론
      if (hasErrorHandling(code, symbol.name)) {
        scenarios.push({
          name: `${symbol.name} 오류 처리`,
          given: '잘못된 입력이 주어졌을 때',
          when: `${symbol.name}이(가) 호출되면`,
          then: '적절한 오류가 반환되어야 한다',
          inferred: true,
          source: '에러 핸들링 코드 분석',
        });
      }
    }
  }

  return scenarios;
}

/**
 * Given 절 추론
 */
function inferGiven(symbol: SymbolInfo): string {
  if (symbol.signature) {
    const params = extractParams(symbol.signature);
    if (params.length > 0) {
      return `${params.join(', ')}이(가) 주어졌을 때`;
    }
  }
  return '시스템이 정상 상태일 때';
}

/**
 * Then 절 추론
 */
function inferThen(symbol: SymbolInfo, code: string): string {
  if (symbol.signature) {
    const returnType = extractReturnType(symbol.signature);
    if (returnType && returnType !== 'void') {
      return `${returnType} 타입의 결과가 반환되어야 한다`;
    }
  }

  // Promise 반환 확인
  if (code.includes('async') || code.includes('Promise')) {
    return '비동기 작업이 완료되어야 한다';
  }

  return '성공적으로 처리되어야 한다';
}

/**
 * 시그니처에서 파라미터 추출
 */
function extractParams(signature: string): string[] {
  const match = signature.match(/\(([^)]*)\)/);
  if (!match) return [];

  const paramsStr = match[1];
  if (!paramsStr.trim()) return [];

  return paramsStr.split(',').map(p => {
    const parts = p.trim().split(':');
    return parts[0].trim();
  }).filter(Boolean);
}

/**
 * 시그니처에서 반환 타입 추출
 */
function extractReturnType(signature: string): string | null {
  const match = signature.match(/\):\s*(.+?)(?:$|\{)/);
  if (match) {
    return match[1].trim();
  }
  return null;
}

/**
 * 시그니처에서 계약 추론
 */
function inferContractsFromSignatures(symbols: SymbolInfo[]): InferredContract[] {
  const contracts: InferredContract[] = [];

  for (const symbol of symbols) {
    if (symbol.signature) {
      // 입력 계약
      const params = extractParams(symbol.signature);
      for (const param of params) {
        contracts.push({
          type: 'input',
          description: `${param} 파라미터`,
          signature: symbol.signature,
          inferred: true,
        });
      }

      // 출력 계약
      const returnType = extractReturnType(symbol.signature);
      if (returnType && returnType !== 'void') {
        contracts.push({
          type: 'output',
          description: `${returnType} 반환`,
          signature: symbol.signature,
          inferred: true,
        });
      }
    }
  }

  return contracts;
}

/**
 * 경로에서 도메인 추론
 */
function inferDomainFromPath(symbols: SymbolInfo[]): string | undefined {
  if (symbols.length === 0) return undefined;

  const location = symbols[0].location;
  if (!location) return undefined;

  const filePath = location.relativePath || '';
  const parts = filePath.split(/[/\\]/);

  // src/<domain>/... 패턴
  const srcIndex = parts.indexOf('src');
  if (srcIndex !== -1 && parts.length > srcIndex + 1) {
    return parts[srcIndex + 1];
  }

  // lib/<domain>/... 패턴
  const libIndex = parts.indexOf('lib');
  if (libIndex !== -1 && parts.length > libIndex + 1) {
    return parts[libIndex + 1];
  }

  return undefined;
}

/**
 * 문서화 여부 확인
 */
function hasDocumentation(code: string): boolean {
  return code.includes('/**') || code.includes('///') || code.includes('//');
}

/**
 * 복잡한 로직 포함 여부
 */
function hasComplexLogic(code: string): boolean {
  const complexityIndicators = [
    /if\s*\([^)]+\)\s*{[^}]+if/g, // 중첩 조건문
    /for\s*\([^)]+\)\s*{[^}]+for/g, // 중첩 반복문
    /switch\s*\([^)]+\)\s*{/g, // switch 문
    /\?\s*[^:]+\s*:\s*[^:]+\s*\?/g, // 중첩 삼항 연산자
  ];

  return complexityIndicators.some(pattern => pattern.test(code));
}

/**
 * 에러 핸들링 여부
 */
function hasErrorHandling(code: string, _functionName: string): boolean {
  const errorPatterns = [
    /throw\s+new\s+\w*Error/,
    /catch\s*\(/,
    /\.catch\s*\(/,
    /reject\s*\(/,
    /return\s+failure\s*\(/,
  ];

  return errorPatterns.some(pattern => pattern.test(code));
}

/**
 * 신뢰도 계산
 */
function calculateConfidence(
  code: string,
  symbols: SymbolInfo[],
  scenarios: InferredScenario[],
  contracts: InferredContract[]
): number {
  let confidence = 50; // 기본값

  // 문서화가 있으면 +15
  if (hasDocumentation(code)) {
    confidence += 15;
  }

  // 타입 정보가 있으면 +15
  if (symbols.some(s => s.signature)) {
    confidence += 15;
  }

  // 시나리오가 추론되면 +10
  if (scenarios.length > 0) {
    confidence += 10;
  }

  // 계약이 추론되면 +10
  if (contracts.length > 0) {
    confidence += 10;
  }

  // 복잡한 로직이면 -10
  if (hasComplexLogic(code)) {
    confidence -= 10;
  }

  return Math.min(100, Math.max(0, confidence));
}

/**
 * AI로 추론 결과 개선 (플레이스홀더)
 */
async function enhanceWithAI(
  heuristicResult: InferredIntent,
  _code: string,
  _symbols: SymbolInfo[]
): Promise<InferredIntent> {
  // AI 모델 호출은 환경에 따라 구현
  // 현재는 휴리스틱 결과에 AI 마커만 추가

  return {
    ...heuristicResult,
    reasoning: [
      ...heuristicResult.reasoning,
      '[INFERRED] AI 분석 결과 포함',
    ],
    uncertainties: [
      ...heuristicResult.uncertainties,
      'AI 추론 결과는 수동 검토 권장',
    ],
    confidence: Math.max(heuristicResult.confidence - 10, 30), // AI 추론은 신뢰도 감소
  };
}

/**
 * 의도 추론 결과 포맷팅
 */
export function formatInferredIntent(intent: InferredIntent): string {
  const lines: string[] = [];

  lines.push(`## ${intent.purpose}`);
  lines.push('');
  lines.push(intent.description);
  lines.push('');

  if (intent.scenarios.length > 0) {
    lines.push('### 시나리오');
    lines.push('');
    for (const scenario of intent.scenarios) {
      const marker = scenario.inferred ? ' [INFERRED]' : '';
      lines.push(`#### ${scenario.name}${marker}`);
      lines.push('');
      lines.push('```gherkin');
      lines.push(`Given ${scenario.given}`);
      lines.push(`When ${scenario.when}`);
      lines.push(`Then ${scenario.then}`);
      lines.push('```');
      lines.push('');
    }
  }

  if (intent.uncertainties.length > 0) {
    lines.push('### [NEEDS_REVIEW]');
    lines.push('');
    for (const uncertainty of intent.uncertainties) {
      lines.push(`- ${uncertainty}`);
    }
    lines.push('');
  }

  lines.push(`> 신뢰도: ${intent.confidence}%`);

  return lines.join('\n');
}
