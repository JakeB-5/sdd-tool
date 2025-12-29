/**
 * Serena MCP 클라이언트
 *
 * MCP 프로토콜을 통해 Serena 도구를 호출하는 클라이언트입니다.
 * 실제 MCP 통신은 Claude Code가 처리하므로, 이 클라이언트는
 * 도구 호출 결과를 파싱하고 타입 안전성을 제공합니다.
 */

import type {
  DirectoryInfo,
  SymbolOverview,
  SymbolInfo,
  ReferenceInfo,
  SearchResult,
  ListDirParams,
  GetSymbolsOverviewParams,
  FindSymbolParams,
  FindReferencingSymbolsParams,
  SearchForPatternParams,
  ReadFileParams,
  ConnectionInfo,
  SerenaResult,
  ProjectStructure,
  SymbolStats,
  SymbolKind,
} from './types.js';

/**
 * Serena MCP 클라이언트 인터페이스
 *
 * 이 인터페이스는 Claude Code MCP 환경에서 Serena 도구를 호출하기 위한
 * 추상화 계층을 제공합니다. 실제 구현은 MCP 프로토콜을 통해 이루어집니다.
 */
export interface ISerenaMcpClient {
  // ============================================================
  // 연결 관리
  // ============================================================

  /**
   * Serena 연결 상태 확인
   */
  getConnectionStatus(): Promise<ConnectionInfo>;

  /**
   * 프로젝트 활성화
   * @param project 프로젝트 이름 또는 경로
   */
  activateProject(project: string): Promise<SerenaResult<void>>;

  /**
   * 현재 설정 조회
   */
  getCurrentConfig(): Promise<SerenaResult<Record<string, unknown>>>;

  // ============================================================
  // 파일 시스템 탐색
  // ============================================================

  /**
   * 디렉토리 내용 조회
   * @param params 조회 파라미터
   */
  listDir(params: ListDirParams): Promise<SerenaResult<DirectoryInfo>>;

  /**
   * 파일 찾기 (글로브 패턴)
   * @param fileMask 파일명 또는 패턴
   * @param relativePath 검색 시작 경로
   */
  findFile(
    fileMask: string,
    relativePath: string
  ): Promise<SerenaResult<string[]>>;

  /**
   * 파일 읽기
   * @param params 읽기 파라미터
   */
  readFile(params: ReadFileParams): Promise<SerenaResult<string>>;

  // ============================================================
  // 심볼 분석
  // ============================================================

  /**
   * 파일의 심볼 오버뷰 조회
   * @param params 조회 파라미터
   */
  getSymbolsOverview(
    params: GetSymbolsOverviewParams
  ): Promise<SerenaResult<SymbolOverview>>;

  /**
   * 심볼 찾기
   * @param params 검색 파라미터
   */
  findSymbol(params: FindSymbolParams): Promise<SerenaResult<SymbolInfo[]>>;

  /**
   * 심볼을 참조하는 심볼 찾기
   * @param params 검색 파라미터
   */
  findReferencingSymbols(
    params: FindReferencingSymbolsParams
  ): Promise<SerenaResult<ReferenceInfo[]>>;

  // ============================================================
  // 패턴 검색
  // ============================================================

  /**
   * 코드베이스에서 패턴 검색
   * @param params 검색 파라미터
   */
  searchForPattern(
    params: SearchForPatternParams
  ): Promise<SerenaResult<SearchResult>>;

  // ============================================================
  // 코드 수정 (선택적, 읽기 전용 모드에서는 사용 불가)
  // ============================================================

  /**
   * 심볼 본문 교체
   * @param namePath 심볼 네임 패스
   * @param relativePath 파일 경로
   * @param body 새 본문
   */
  replaceSymbolBody?(
    namePath: string,
    relativePath: string,
    body: string
  ): Promise<SerenaResult<void>>;

  /**
   * 파일 내용 교체 (정규식 또는 리터럴)
   * @param relativePath 파일 경로
   * @param needle 검색 패턴
   * @param repl 교체 문자열
   * @param mode 매칭 모드
   */
  replaceContent?(
    relativePath: string,
    needle: string,
    repl: string,
    mode: 'literal' | 'regex'
  ): Promise<SerenaResult<void>>;
}

/**
 * 심볼 통계 계산 유틸리티
 */
export function calculateSymbolStats(symbols: SymbolInfo[]): SymbolStats {
  const stats: SymbolStats = {
    total: 0,
    byKind: {},
    byFile: {},
  };

  function countSymbol(symbol: SymbolInfo): void {
    stats.total++;
    stats.byKind[symbol.kind] = (stats.byKind[symbol.kind] || 0) + 1;
    stats.byFile[symbol.location.relativePath] =
      (stats.byFile[symbol.location.relativePath] || 0) + 1;

    if (symbol.children) {
      symbol.children.forEach(countSymbol);
    }
  }

  symbols.forEach(countSymbol);
  return stats;
}

/**
 * 프로젝트 구조 분석 유틸리티
 */
export function analyzeProjectStructure(
  rootPath: string,
  directories: string[],
  symbols: SymbolInfo[],
  languageDistribution: Record<string, number>
): ProjectStructure {
  // 디렉토리 기반 도메인 추정
  const suggestedDomains = directories
    .filter((dir) => {
      // src/core, src/auth 같은 패턴 찾기
      const parts = dir.split('/');
      return (
        parts.length >= 2 &&
        (parts[0] === 'src' ||
          parts[0] === 'lib' ||
          parts[0] === 'packages' ||
          parts[0] === 'modules')
      );
    })
    .map((dir) => {
      const parts = dir.split('/');
      return parts[1]; // src/auth → auth
    })
    .filter((name, index, arr) => arr.indexOf(name) === index); // 중복 제거

  return {
    rootPath,
    fileCount: Object.keys(languageDistribution).reduce(
      (sum, lang) => sum + languageDistribution[lang],
      0
    ),
    symbolCount: symbols.length,
    languageDistribution,
    directories,
    suggestedDomains,
  };
}

/**
 * 심볼 종류별 필터링
 */
export function filterSymbolsByKind(
  symbols: SymbolInfo[],
  kinds: SymbolKind[]
): SymbolInfo[] {
  return symbols.filter((s) => kinds.includes(s.kind));
}

/**
 * 심볼을 도메인별로 그룹화
 */
export function groupSymbolsByPath(
  symbols: SymbolInfo[]
): Map<string, SymbolInfo[]> {
  const groups = new Map<string, SymbolInfo[]>();

  for (const symbol of symbols) {
    const path = symbol.location.relativePath;
    const parts = path.split('/');

    // src/domain/... 패턴에서 도메인 추출
    let domain = 'unknown';
    if (parts.length >= 2 && (parts[0] === 'src' || parts[0] === 'lib')) {
      domain = parts[1];
    }

    if (!groups.has(domain)) {
      groups.set(domain, []);
    }
    groups.get(domain)!.push(symbol);
  }

  return groups;
}

/**
 * 클래스/함수 심볼만 추출
 */
export function extractMainSymbols(symbols: SymbolInfo[]): SymbolInfo[] {
  const mainKinds: SymbolKind[] = [
    5, // Class
    6, // Method
    11, // Interface
    12, // Function
  ];
  return filterSymbolsByKind(symbols, mainKinds);
}

/**
 * 심볼에서 시그니처 추출 (함수/메서드)
 */
export function extractSignature(symbol: SymbolInfo): string {
  if (symbol.signature) {
    return symbol.signature;
  }

  // 본문에서 첫 줄 추출
  if (symbol.body) {
    const firstLine = symbol.body.split('\n')[0].trim();
    return firstLine;
  }

  return `${symbol.name}`;
}

/**
 * Serena 클라이언트 팩토리
 *
 * 실제 MCP 환경에서 사용할 클라이언트 인스턴스를 생성합니다.
 * 테스트 환경에서는 모킹된 클라이언트를 주입할 수 있습니다.
 */
export function createSerenaMcpClient(): ISerenaMcpClient | null {
  // 실제 구현은 MCP 환경에서 Claude Code가 제공
  // 이 함수는 런타임에서 Serena MCP 사용 가능 여부를 확인하는 데 사용
  // SDD CLI는 슬래시 커맨드를 통해 Claude Code 환경에서 실행되므로,
  // Serena 도구 호출은 프롬프트 기반으로 이루어집니다.
  return null;
}

/**
 * Serena 도구 호출 가능 여부 확인
 *
 * Claude Code 환경에서 Serena MCP가 설정되어 있는지 확인합니다.
 * 이 함수는 reverse 명령어 실행 전 체크에 사용됩니다.
 */
export async function isSerenaAvailable(): Promise<boolean> {
  // MCP 환경에서는 mcp__serena__ 접두사 도구 존재 여부로 확인
  // CLI 환경에서는 설정 파일 확인
  // 현재는 항상 false 반환 (실제 체크 로직은 TASK-R0.6에서 구현)
  return false;
}

/**
 * Serena 필수 에러 메시지
 */
export const SERENA_REQUIRED_MESSAGE = `
Serena MCP가 필요합니다.

sdd reverse 명령어는 코드베이스 분석을 위해 Serena MCP가 필요합니다.
Serena는 30개 이상의 프로그래밍 언어를 지원하는 시맨틱 코드 분석 도구입니다.

설치 방법:
  1. Serena MCP 설치: https://github.com/serena-ai/serena-mcp
  2. Claude Code MCP 설정에 Serena 추가
  3. 프로젝트 활성화: mcp__serena__activate_project

자세한 내용: sdd reverse --help 또는 docs/guide/serena-setup.md
`;
