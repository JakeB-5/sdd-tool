/**
 * Serena MCP 연결 관리 테스트
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getConnectionState,
  getConnectionInfo,
  updateConnectionState,
  handleConnectionSuccess,
  handleConnectionError,
  handleDisconnect,
  canRetry,
  resetConnectionState,
  isConnected,
  hasConnectionError,
  formatConnectionStatus,
  DEFAULT_CONNECTION_CONFIG,
} from '../../../../src/integrations/serena/connection.js';

describe('연결 상태 관리', () => {
  beforeEach(() => {
    resetConnectionState();
  });

  it('초기 상태는 disconnected이다', () => {
    const state = getConnectionState();
    expect(state.status).toBe('disconnected');
    expect(state.retryCount).toBe(0);
  });

  it('연결 성공을 처리한다', () => {
    handleConnectionSuccess('test-project');

    const info = getConnectionInfo();
    expect(info.status).toBe('connected');
    expect(info.projectName).toBe('test-project');
    expect(info.lastConnected).toBeInstanceOf(Date);
  });

  it('연결 실패를 처리한다', () => {
    handleConnectionError('Connection refused');

    const info = getConnectionInfo();
    expect(info.status).toBe('error');
    expect(info.errorMessage).toBe('Connection refused');
  });

  it('연결 해제를 처리한다', () => {
    handleConnectionSuccess('test-project');
    handleDisconnect();

    const info = getConnectionInfo();
    expect(info.status).toBe('disconnected');
    expect(info.projectName).toBeUndefined();
  });

  it('재시도 횟수를 추적한다', () => {
    handleConnectionError('Error 1');
    handleConnectionError('Error 2');
    handleConnectionError('Error 3');

    const state = getConnectionState();
    expect(state.retryCount).toBe(3);
  });
});

describe('isConnected', () => {
  beforeEach(() => {
    resetConnectionState();
  });

  it('연결되면 true를 반환한다', () => {
    handleConnectionSuccess();
    expect(isConnected()).toBe(true);
  });

  it('연결 안 되면 false를 반환한다', () => {
    expect(isConnected()).toBe(false);
  });
});

describe('hasConnectionError', () => {
  beforeEach(() => {
    resetConnectionState();
  });

  it('에러 상태면 true를 반환한다', () => {
    handleConnectionError('Error');
    expect(hasConnectionError()).toBe(true);
  });

  it('에러 아니면 false를 반환한다', () => {
    expect(hasConnectionError()).toBe(false);
  });
});

describe('canRetry', () => {
  beforeEach(() => {
    resetConnectionState();
  });

  it('최대 재시도 횟수 이내면 true를 반환한다', () => {
    expect(canRetry()).toBe(true);

    handleConnectionError('Error 1');
    handleConnectionError('Error 2');
    expect(canRetry()).toBe(true);
  });

  it('최대 재시도 횟수 초과하면 false를 반환한다', () => {
    for (let i = 0; i < DEFAULT_CONNECTION_CONFIG.maxRetries; i++) {
      handleConnectionError(`Error ${i + 1}`);
    }
    expect(canRetry()).toBe(false);
  });
});

describe('formatConnectionStatus', () => {
  it('연결된 상태를 포맷한다', () => {
    const info = {
      status: 'connected' as const,
      projectName: 'my-project',
      lastConnected: new Date(),
    };

    const formatted = formatConnectionStatus(info);
    expect(formatted).toContain('✅');
    expect(formatted).toContain('연결됨');
    expect(formatted).toContain('my-project');
  });

  it('에러 상태를 포맷한다', () => {
    const info = {
      status: 'error' as const,
      errorMessage: 'Connection failed',
    };

    const formatted = formatConnectionStatus(info);
    expect(formatted).toContain('❌');
    expect(formatted).toContain('오류');
    expect(formatted).toContain('Connection failed');
  });

  it('연결 해제 상태를 포맷한다', () => {
    const info = {
      status: 'disconnected' as const,
    };

    const formatted = formatConnectionStatus(info);
    expect(formatted).toContain('⚪');
    expect(formatted).toContain('연결 안 됨');
  });
});
