/**
 * sync 명령어 유닛 테스트
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  executeSyncCommand,
  SyncCommandResult,
  evaluateSyncGate,
  parseThreshold,
} from '../../../../src/cli/commands/sync.js';

describe('parseThreshold', () => {
  it('0~100 숫자를 허용한다', () => {
    expect(parseThreshold('80')).toBe(80);
    expect(parseThreshold('66.5')).toBe(66.5);
    expect(parseThreshold('0')).toBe(0);
  });

  it.each(['abc', '', '101', '-1', '80%'])('잘못된 값 %j는 에러', (value) => {
    expect(() => parseThreshold(value)).toThrow('0~100');
  });
});

describe('evaluateSyncGate', () => {
  it('--ci/--threshold가 없으면 게이트가 비활성화되어 항상 통과한다', () => {
    expect(evaluateSyncGate(10, {})).toMatchObject({ active: false, passed: true });
  });

  it('--ci는 기본 임계값 100을 사용한다', () => {
    expect(evaluateSyncGate(99, { ci: true })).toMatchObject({ active: true, passed: false, threshold: 100 });
    expect(evaluateSyncGate(100, { ci: true }).passed).toBe(true);
  });

  it('임계값 이상이면 미구현이 있어도 통과한다', () => {
    expect(evaluateSyncGate(66.67, { ci: true, threshold: 60 }).passed).toBe(true);
    expect(evaluateSyncGate(50, { threshold: 60 })).toMatchObject({ active: true, passed: false });
  });
});

// core/sync 모킹
vi.mock('../../../../src/core/sync/index.js', () => ({
  executeSync: vi.fn(),
}));

import { executeSync } from '../../../../src/core/sync/index.js';

describe('executeSyncCommand', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-sync-test-'));
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('동기화 결과를 반환한다', async () => {
    const mockSyncResult = {
      specs: [],
      syncRate: 100,
      requirements: [],
      implemented: [],
      missing: [],
      orphans: [],
      totalRequirements: 0,
      totalImplemented: 0,
    };

    vi.mocked(executeSync).mockResolvedValue({
      success: true,
      data: {
        result: mockSyncResult,
        output: '동기화율: 100%',
      },
    });

    const result = await executeSyncCommand(undefined, {}, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.result.syncRate).toBe(100);
      expect(result.data.output).toContain('100%');
    }
  });

  it('특정 스펙 ID로 동기화할 수 있다', async () => {
    const mockSyncResult = {
      specs: [{ id: 'user-auth', requirementCount: 5, implementedCount: 4, missingCount: 1, syncRate: 80 }],
      syncRate: 80,
      requirements: [],
      implemented: ['REQ-01', 'REQ-02', 'REQ-03', 'REQ-04'],
      missing: ['REQ-05'],
      orphans: [],
      totalRequirements: 5,
      totalImplemented: 4,
    };

    vi.mocked(executeSync).mockResolvedValue({
      success: true,
      data: {
        result: mockSyncResult,
        output: '동기화율: 80%',
      },
    });

    const result = await executeSyncCommand('user-auth', { specId: 'user-auth' }, tempDir);

    expect(result.success).toBe(true);
    expect(executeSync).toHaveBeenCalledWith(tempDir, expect.objectContaining({
      specId: 'user-auth',
    }));
  });

  it('실패 시 에러를 반환한다', async () => {
    vi.mocked(executeSync).mockResolvedValue({
      success: false,
      error: new Error('스펙을 찾을 수 없습니다'),
    });

    const result = await executeSyncCommand('invalid', {}, tempDir);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('스펙을 찾을 수 없습니다');
    }
  });

  it('data가 없으면 실패를 반환한다', async () => {
    vi.mocked(executeSync).mockResolvedValue({
      success: true,
      data: undefined,
    });

    const result = await executeSyncCommand(undefined, {}, tempDir);

    expect(result.success).toBe(false);
  });

  it('CI 모드 옵션을 전달한다', async () => {
    const mockSyncResult = {
      specs: [],
      syncRate: 90,
      requirements: [],
      implemented: [],
      missing: [],
      orphans: [],
      totalRequirements: 10,
      totalImplemented: 9,
    };

    vi.mocked(executeSync).mockResolvedValue({
      success: true,
      data: {
        result: mockSyncResult,
        output: 'CI 모드 결과',
      },
    });

    await executeSyncCommand(undefined, { ci: true, threshold: 80 }, tempDir);

    expect(executeSync).toHaveBeenCalledWith(tempDir, expect.objectContaining({
      ci: true,
      threshold: 80,
    }));
  });
});
