/**
 * Serena MCP 통합 모듈
 *
 * Serena는 30+ 언어를 지원하는 시맨틱 코드 분석 MCP 서버입니다.
 * 이 모듈은 sdd reverse 명령어에서 코드 분석에 사용됩니다.
 */

// 타입 정의
export type {
  SymbolInfo,
  SymbolOverview,
  ReferenceInfo,
  DirectoryInfo,
  DirectoryEntry,
  SearchResult,
  SearchMatch,
  ProjectStructure,
  SymbolStats,
  FileLocation,
  ConnectionInfo,
  ConnectionStatus,
  SerenaResult,
  SerenaError,
  SerenaLanguage,
  // 파라미터 타입
  ListDirParams,
  GetSymbolsOverviewParams,
  FindSymbolParams,
  FindReferencingSymbolsParams,
  SearchForPatternParams,
  ReadFileParams,
} from './types.js';

export {
  SymbolKind,
  SymbolKindNames,
  SERENA_SUPPORTED_LANGUAGES,
  FILE_EXTENSION_TO_LANGUAGE,
} from './types.js';

// 클라이언트
export type { ISerenaMcpClient } from './client.js';
export {
  createSerenaMcpClient,
  isSerenaAvailable,
  SERENA_REQUIRED_MESSAGE,
  calculateSymbolStats,
  analyzeProjectStructure,
  filterSymbolsByKind,
  groupSymbolsByPath,
  extractMainSymbols,
  extractSignature,
} from './client.js';

// 연결 관리
export type {
  ConnectionConfig,
  SerenaCheckResult,
  ConnectionEventListener,
} from './connection.js';
export {
  DEFAULT_CONNECTION_CONFIG,
  getConnectionState,
  getConnectionInfo,
  updateConnectionState,
  handleConnectionSuccess,
  handleConnectionError,
  handleDisconnect,
  canRetry,
  waitForRetry,
  resetConnectionState,
  isConnected,
  hasConnectionError,
  checkSerenaConnection,
  formatConnectionStatus,
  createSerenaRequiredError,
  onConnectionChange,
  emitConnectionChange,
} from './connection.js';

// 요구사항 체크
export type {
  RequirementCheckResult,
  RequirementCheckOptions,
} from './requirement-checker.js';
export {
  SERENA_INSTALL_URL,
  SERENA_DOCS_URL,
  createInstallGuide,
  createLanguageSupportMessage,
  createQuickStartGuide,
  createRequirementError,
  checkRequirements,
  ensureSerenaAvailable,
  requireSerena,
  getSerenaHint,
} from './requirement-checker.js';
