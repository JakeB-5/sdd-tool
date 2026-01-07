/**
 * sync 명령어 유닛 테스트
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { executeSyncCommand, SyncCommandResult } from '../../../../src/cli/commands/sync.js';

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
