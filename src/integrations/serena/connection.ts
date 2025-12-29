/**
 * Serena MCP 연결 상태 관리
 *
 * Claude Code 환경에서 Serena MCP 연결 상태를 관리합니다.
 */

import type {
  ConnectionStatus,
  ConnectionInfo,
  SerenaResult,
} from './types.js';
import { Result, success, failure } from '../../types/index.js';

/**
 * 연결 상태 저장소
 */
interface ConnectionState {
  status: ConnectionStatus;
  projectName?: string;
  lastConnected?: Date;
  lastError?: string;
  retryCount: number;
}

/**
 * 연결 설정
 */
export interface ConnectionConfig {
  /** 최대 재연결 시도 횟수 */
  maxRetries: number;
  /** 재연결 대기 시간 (ms) */
  retryDelayMs: number;
  /** 연결 타임아웃 (ms) */
  timeoutMs: number;
}

/**
 * 기본 연결 설정
 */
export const DEFAULT_CONNECTION_CONFIG: ConnectionConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 30000,
};

/**
 * 전역 연결 상태
 */
let globalState: ConnectionState = {
  status: 'disconnected',
  retryCount: 0,
};

/**
 * 연결 상태 조회
 */
export function getConnectionState(): ConnectionState {
  return { ...globalState };
}

/**
 * 연결 상태 정보 조회
 */
export function getConnectionInfo(): ConnectionInfo {
  return {
    status: globalState.status,
    projectName: globalState.projectName,
    lastConnected: globalState.lastConnected,
    errorMessage: globalState.lastError,
  };
}

/**
 * 연결 상태 업데이트
 */
export function updateConnectionState(
  update: Partial<ConnectionState>
): void {
  globalState = { ...globalState, ...update };
}

/**
 * 연결 성공 처리
 */
export function handleConnectionSuccess(projectName?: string): void {
  updateConnectionState({
    status: 'connected',
    projectName,
    lastConnected: new Date(),
    lastError: undefined,
    retryCount: 0,
  });
}

/**
 * 연결 실패 처리
 */
export function handleConnectionError(error: string): void {
  updateConnectionState({
    status: 'error',
    lastError: error,
    retryCount: globalState.retryCount + 1,
  });
}

/**
 * 연결 해제 처리
 */
export function handleDisconnect(): void {
  updateConnectionState({
    status: 'disconnected',
    projectName: undefined,
  });
}

/**
 * 재연결 가능 여부 확인
 */
export function canRetry(config: ConnectionConfig = DEFAULT_CONNECTION_CONFIG): boolean {
  return globalState.retryCount < config.maxRetries;
}

/**
 * 재연결 대기
 */
export async function waitForRetry(
  config: ConnectionConfig = DEFAULT_CONNECTION_CONFIG
): Promise<void> {
  // 지수 백오프: 1초, 2초, 4초...
  const delay = config.retryDelayMs * Math.pow(2, globalState.retryCount);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * 연결 상태 초기화
 */
export function resetConnectionState(): void {
  globalState = {
    status: 'disconnected',
    retryCount: 0,
  };
}

/**
 * 연결 상태가 사용 가능한지 확인
 */
export function isConnected(): boolean {
  return globalState.status === 'connected';
}

/**
 * 연결 상태가 에러인지 확인
 */
export function hasConnectionError(): boolean {
  return globalState.status === 'error';
}

/**
 * Serena MCP 연결 확인 결과
 */
export interface SerenaCheckResult {
  /** Serena 사용 가능 여부 */
  available: boolean;
  /** 연결 상태 */
  status: ConnectionStatus;
  /** 활성 프로젝트 */
  projectName?: string;
  /** 에러 메시지 */
  errorMessage?: string;
  /** 설치 필요 여부 */
  needsInstall: boolean;
  /** 설정 필요 여부 */
  needsConfig: boolean;
}

/**
 * Serena MCP 연결 확인
 *
 * Claude Code 환경에서 Serena MCP가 설정되어 있는지 확인합니다.
 * MCP 도구 목록에서 mcp__serena__ 접두사를 가진 도구가 있는지 확인합니다.
 */
export async function checkSerenaConnection(): Promise<SerenaCheckResult> {
  // 기본 결과: 사용 불가
  const result: SerenaCheckResult = {
    available: false,
    status: 'disconnected',
    needsInstall: true,
    needsConfig: false,
  };

  // CLI 환경에서는 MCP 도구에 직접 접근할 수 없음
  // 슬래시 커맨드를 통해 실행될 때만 Serena 사용 가능
  // 이 함수는 주로 에러 메시지 생성에 사용됨

  // 환경 변수로 Serena 활성화 여부 확인 (테스트/개발용)
  if (process.env.SDD_SERENA_AVAILABLE === 'true') {
    result.available = true;
    result.status = 'connected';
    result.needsInstall = false;
    result.projectName = process.env.SDD_SERENA_PROJECT;
    handleConnectionSuccess(result.projectName);
  }

  return result;
}

/**
 * Serena 연결 상태를 문자열로 포맷팅
 */
export function formatConnectionStatus(info: ConnectionInfo): string {
  const lines: string[] = [];

  switch (info.status) {
    case 'connected':
      lines.push('✅ Serena MCP 연결됨');
      if (info.projectName) {
        lines.push(`   프로젝트: ${info.projectName}`);
      }
      if (info.lastConnected) {
        lines.push(`   연결 시간: ${info.lastConnected.toISOString()}`);
      }
      break;

    case 'connecting':
      lines.push('⏳ Serena MCP 연결 중...');
      break;

    case 'disconnected':
      lines.push('⚪ Serena MCP 연결 안 됨');
      break;

    case 'error':
      lines.push('❌ Serena MCP 연결 오류');
      if (info.errorMessage) {
        lines.push(`   오류: ${info.errorMessage}`);
      }
      break;
  }

  return lines.join('\n');
}

/**
 * Serena 연결 필요 에러 생성
 */
export function createSerenaRequiredError(
  operation: string
): Result<never, Error> {
  const message = `
Serena MCP 연결이 필요합니다.

'${operation}' 작업을 수행하려면 Serena MCP가 필요합니다.

해결 방법:
1. Serena MCP 설치 확인
2. Claude Code에서 Serena MCP 서버 설정
3. mcp__serena__activate_project 도구로 프로젝트 활성화

자세한 내용: sdd reverse --help
`;

  return failure(new Error(message.trim()));
}

/**
 * 연결 이벤트 리스너 타입
 */
export type ConnectionEventListener = (info: ConnectionInfo) => void;

/**
 * 연결 이벤트 구독자 목록
 */
const eventListeners: Set<ConnectionEventListener> = new Set();

/**
 * 연결 이벤트 구독
 */
export function onConnectionChange(listener: ConnectionEventListener): () => void {
  eventListeners.add(listener);
  return () => eventListeners.delete(listener);
}

/**
 * 연결 이벤트 발행
 */
export function emitConnectionChange(): void {
  const info = getConnectionInfo();
  eventListeners.forEach((listener) => listener(info));
}
