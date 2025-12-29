/**
 * Serena MCP 타입 정의
 *
 * Serena는 30+ 언어를 지원하는 시맨틱 코드 분석 MCP 서버입니다.
 * 이 파일은 Serena MCP 도구의 요청/응답 타입을 정의합니다.
 */

/**
 * LSP 심볼 종류 (Language Server Protocol)
 * https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#symbolKind
 */
export enum SymbolKind {
  File = 1,
  Module = 2,
  Namespace = 3,
  Package = 4,
  Class = 5,
  Method = 6,
  Property = 7,
  Field = 8,
  Constructor = 9,
  Enum = 10,
  Interface = 11,
  Function = 12,
  Variable = 13,
  Constant = 14,
  String = 15,
  Number = 16,
  Boolean = 17,
  Array = 18,
  Object = 19,
  Key = 20,
  Null = 21,
  EnumMember = 22,
  Struct = 23,
  Event = 24,
  Operator = 25,
  TypeParameter = 26,
}

/**
 * 심볼 종류 이름 매핑
 */
export const SymbolKindNames: Record<SymbolKind, string> = {
  [SymbolKind.File]: 'file',
  [SymbolKind.Module]: 'module',
  [SymbolKind.Namespace]: 'namespace',
  [SymbolKind.Package]: 'package',
  [SymbolKind.Class]: 'class',
  [SymbolKind.Method]: 'method',
  [SymbolKind.Property]: 'property',
  [SymbolKind.Field]: 'field',
  [SymbolKind.Constructor]: 'constructor',
  [SymbolKind.Enum]: 'enum',
  [SymbolKind.Interface]: 'interface',
  [SymbolKind.Function]: 'function',
  [SymbolKind.Variable]: 'variable',
  [SymbolKind.Constant]: 'constant',
  [SymbolKind.String]: 'string',
  [SymbolKind.Number]: 'number',
  [SymbolKind.Boolean]: 'boolean',
  [SymbolKind.Array]: 'array',
  [SymbolKind.Object]: 'object',
  [SymbolKind.Key]: 'key',
  [SymbolKind.Null]: 'null',
  [SymbolKind.EnumMember]: 'enumMember',
  [SymbolKind.Struct]: 'struct',
  [SymbolKind.Event]: 'event',
  [SymbolKind.Operator]: 'operator',
  [SymbolKind.TypeParameter]: 'typeParameter',
};

/**
 * 파일 위치 정보
 */
export interface FileLocation {
  /** 상대 파일 경로 */
  relativePath: string;
  /** 시작 줄 (0-based) */
  startLine: number;
  /** 끝 줄 (0-based) */
  endLine: number;
  /** 시작 컬럼 (0-based, 선택) */
  startColumn?: number;
  /** 끝 컬럼 (0-based, 선택) */
  endColumn?: number;
}

/**
 * 심볼 정보
 */
export interface SymbolInfo {
  /** 심볼 이름 */
  name: string;
  /** 심볼 종류 (LSP SymbolKind) */
  kind: SymbolKind;
  /** 네임 패스 (예: "MyClass/myMethod") */
  namePath: string;
  /** 파일 위치 */
  location: FileLocation;
  /** 심볼 시그니처 (함수의 경우 파라미터 포함) */
  signature?: string;
  /** 심볼 본문 (include_body=true인 경우) */
  body?: string;
  /** 자식 심볼 (depth > 0인 경우) */
  children?: SymbolInfo[];
  /** 문서 주석 */
  documentation?: string;
}

/**
 * 심볼 오버뷰 (파일 단위)
 */
export interface SymbolOverview {
  /** 상대 파일 경로 */
  relativePath: string;
  /** 최상위 심볼 목록 */
  symbols: SymbolInfo[];
}

/**
 * 참조 정보
 */
export interface ReferenceInfo {
  /** 참조하는 심볼 */
  referencingSymbol: SymbolInfo;
  /** 참조 위치의 코드 스니펫 */
  codeSnippet: string;
  /** 참조 위치 */
  location: FileLocation;
}

/**
 * 디렉토리 항목
 */
export interface DirectoryEntry {
  /** 항목 이름 */
  name: string;
  /** 상대 경로 */
  relativePath: string;
  /** 디렉토리 여부 */
  isDirectory: boolean;
  /** 자식 항목 (recursive=true인 경우) */
  children?: DirectoryEntry[];
}

/**
 * 디렉토리 정보
 */
export interface DirectoryInfo {
  /** 상대 경로 */
  relativePath: string;
  /** 디렉토리 목록 */
  directories: string[];
  /** 파일 목록 */
  files: string[];
}

/**
 * 검색 결과 매치
 */
export interface SearchMatch {
  /** 상대 파일 경로 */
  relativePath: string;
  /** 매치된 줄 번호 (1-based) */
  lineNumber: number;
  /** 매치된 줄 내용 */
  lineContent: string;
  /** 전후 컨텍스트 줄 */
  context?: {
    before: string[];
    after: string[];
  };
}

/**
 * 검색 결과
 */
export interface SearchResult {
  /** 검색 패턴 */
  pattern: string;
  /** 매치 목록 */
  matches: SearchMatch[];
  /** 총 매치 수 */
  totalMatches: number;
}

/**
 * 프로젝트 구조 요약
 */
export interface ProjectStructure {
  /** 프로젝트 루트 경로 */
  rootPath: string;
  /** 총 파일 수 */
  fileCount: number;
  /** 총 심볼 수 */
  symbolCount: number;
  /** 언어별 파일 수 */
  languageDistribution: Record<string, number>;
  /** 주요 디렉토리 */
  directories: string[];
  /** 추정 도메인 (디렉토리 기반) */
  suggestedDomains: string[];
}

/**
 * 심볼 통계
 */
export interface SymbolStats {
  /** 총 심볼 수 */
  total: number;
  /** 종류별 심볼 수 */
  byKind: Partial<Record<SymbolKind, number>>;
  /** 파일별 심볼 수 */
  byFile: Record<string, number>;
}

/**
 * list_dir 요청 파라미터
 */
export interface ListDirParams {
  /** 상대 경로 ("."은 프로젝트 루트) */
  relativePath: string;
  /** 재귀 스캔 여부 */
  recursive: boolean;
  /** 무시된 파일 건너뛰기 */
  skipIgnoredFiles?: boolean;
  /** 최대 응답 문자 수 */
  maxAnswerChars?: number;
}

/**
 * get_symbols_overview 요청 파라미터
 */
export interface GetSymbolsOverviewParams {
  /** 상대 파일 경로 */
  relativePath: string;
  /** 자식 심볼 깊이 (기본값 0) */
  depth?: number;
  /** 최대 응답 문자 수 */
  maxAnswerChars?: number;
}

/**
 * find_symbol 요청 파라미터
 */
export interface FindSymbolParams {
  /** 네임 패스 패턴 (예: "MyClass/myMethod", "myFunction") */
  namePathPattern: string;
  /** 검색 범위 (파일 또는 디렉토리) */
  relativePath?: string;
  /** 본문 포함 여부 */
  includeBody?: boolean;
  /** 자식 심볼 깊이 */
  depth?: number;
  /** 포함할 심볼 종류 (LSP 정수값) */
  includeKinds?: SymbolKind[];
  /** 제외할 심볼 종류 */
  excludeKinds?: SymbolKind[];
  /** 서브스트링 매칭 */
  substringMatching?: boolean;
  /** 최대 응답 문자 수 */
  maxAnswerChars?: number;
}

/**
 * find_referencing_symbols 요청 파라미터
 */
export interface FindReferencingSymbolsParams {
  /** 참조 대상 심볼의 네임 패스 */
  namePath: string;
  /** 심볼이 있는 파일 경로 */
  relativePath: string;
  /** 포함할 심볼 종류 */
  includeKinds?: SymbolKind[];
  /** 제외할 심볼 종류 */
  excludeKinds?: SymbolKind[];
  /** 최대 응답 문자 수 */
  maxAnswerChars?: number;
}

/**
 * search_for_pattern 요청 파라미터
 */
export interface SearchForPatternParams {
  /** 검색할 정규식 패턴 */
  substringPattern: string;
  /** 검색 범위 (파일 또는 디렉토리) */
  relativePath?: string;
  /** 코드 파일만 검색 */
  restrictSearchToCodeFiles?: boolean;
  /** 포함할 glob 패턴 */
  pathsIncludeGlob?: string;
  /** 제외할 glob 패턴 */
  pathsExcludeGlob?: string;
  /** 매치 앞 컨텍스트 줄 수 */
  contextLinesBefore?: number;
  /** 매치 뒤 컨텍스트 줄 수 */
  contextLinesAfter?: number;
  /** 최대 응답 문자 수 */
  maxAnswerChars?: number;
}

/**
 * read_file 요청 파라미터
 */
export interface ReadFileParams {
  /** 상대 파일 경로 */
  relativePath: string;
  /** 시작 줄 (0-based) */
  startLine?: number;
  /** 끝 줄 (0-based, 포함) */
  endLine?: number;
  /** 최대 응답 문자 수 */
  maxAnswerChars?: number;
}

/**
 * Serena 연결 상태
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

/**
 * Serena 연결 정보
 */
export interface ConnectionInfo {
  /** 연결 상태 */
  status: ConnectionStatus;
  /** 프로젝트 이름 */
  projectName?: string;
  /** 마지막 연결 시간 */
  lastConnected?: Date;
  /** 에러 메시지 (에러 상태인 경우) */
  errorMessage?: string;
}

/**
 * Serena 지원 언어
 */
export const SERENA_SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'java',
  'kotlin',
  'go',
  'rust',
  'c',
  'cpp',
  'csharp',
  'ruby',
  'php',
  'swift',
  'scala',
  'haskell',
  'elixir',
  'clojure',
  'dart',
  'lua',
  'perl',
  'r',
  'julia',
  'ocaml',
  'fsharp',
  'erlang',
  'zig',
  'nim',
  'crystal',
  'v',
  'odin',
] as const;

export type SerenaLanguage = (typeof SERENA_SUPPORTED_LANGUAGES)[number];

/**
 * 파일 확장자 → 언어 매핑
 */
export const FILE_EXTENSION_TO_LANGUAGE: Record<string, SerenaLanguage> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.pyi': 'python',
  '.java': 'java',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.go': 'go',
  '.rs': 'rust',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cxx': 'cpp',
  '.cc': 'cpp',
  '.hpp': 'cpp',
  '.hxx': 'cpp',
  '.cs': 'csharp',
  '.rb': 'ruby',
  '.php': 'php',
  '.swift': 'swift',
  '.scala': 'scala',
  '.sc': 'scala',
  '.hs': 'haskell',
  '.lhs': 'haskell',
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.clj': 'clojure',
  '.cljs': 'clojure',
  '.cljc': 'clojure',
  '.dart': 'dart',
  '.lua': 'lua',
  '.pl': 'perl',
  '.pm': 'perl',
  '.r': 'r',
  '.R': 'r',
  '.jl': 'julia',
  '.ml': 'ocaml',
  '.mli': 'ocaml',
  '.fs': 'fsharp',
  '.fsi': 'fsharp',
  '.fsx': 'fsharp',
  '.erl': 'erlang',
  '.hrl': 'erlang',
  '.zig': 'zig',
  '.nim': 'nim',
  '.cr': 'crystal',
  '.v': 'v',
  '.odin': 'odin',
};

/**
 * MCP 도구 에러
 */
export interface SerenaError {
  /** 에러 코드 */
  code: string;
  /** 에러 메시지 */
  message: string;
  /** 추가 상세 정보 */
  details?: Record<string, unknown>;
}

/**
 * MCP 도구 결과
 */
export type SerenaResult<T> =
  | { success: true; data: T }
  | { success: false; error: SerenaError };
