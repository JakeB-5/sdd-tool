/**
 * reverse 명령어 유닛 테스트
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  executeReviewCommand,
  executeFinalizeCommand,
  executeCheckSerenaCommand,
} from '../../../../src/cli/commands/reverse.js';

// core/reverse 모킹
vi.mock('../../../../src/core/reverse/index.js', () => ({
  scanProject: vi.fn(),
  formatScanResult: vi.fn(),
  formatScanResultJson: vi.fn(),
  addScanToMeta: vi.fn(),
  getLastScan: vi.fn(),
  extractSpecs: vi.fn(),
  saveExtractedSpecs: vi.fn(),
  updateExtractionStatus: vi.fn(),
  loadReviewList: vi.fn(),
  formatReviewList: vi.fn(),
  formatSpecDetail: vi.fn(),
  approveSpec: vi.fn(),
  rejectSpec: vi.fn(),
  finalizeAllApproved: vi.fn(),
  finalizeDomain: vi.fn(),
  finalizeById: vi.fn(),
  formatFinalizeResult: vi.fn(),
}));

// core/domain 모킹
vi.mock('../../../../src/core/domain/service.js', () => ({
  createDomainService: vi.fn(() => ({
    list: vi.fn().mockResolvedValue({ success: true, data: [] }),
    create: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

// integrations/serena 모킹
vi.mock('../../../../src/integrations/serena/index.js', () => ({
  ensureSerenaAvailable: vi.fn(),
  createInstallGuide: vi.fn(),
  getSerenaHint: vi.fn(),
}));

import { loadReviewList, finalizeById, finalizeAllApproved, finalizeDomain } from '../../../../src/core/reverse/index.js';
import { ensureSerenaAvailable } from '../../../../src/integrations/serena/index.js';

describe('executeReviewCommand', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-review-test-'));
    await fs.mkdir(path.join(tempDir, '.sdd'), { recursive: true });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('drafts 디렉토리가 없으면 no_drafts를 반환한다', async () => {
    const result = await executeReviewCommand(undefined, {}, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action).toBe('no_drafts');
    }
  });

  it('리뷰 목록이 비어있으면 empty를 반환한다', async () => {
    await fs.mkdir(path.join(tempDir, '.sdd', '.reverse-drafts'), { recursive: true });
    vi.mocked(loadReviewList).mockResolvedValue({
      success: true as const,
      data: [],
    });

    const result = await executeReviewCommand(undefined, {}, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action).toBe('empty');
    }
  });
});

describe('executeFinalizeCommand', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-finalize-test-'));
    await fs.mkdir(path.join(tempDir, '.sdd'), { recursive: true });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('옵션 없이 실행하면 no_target을 반환한다', async () => {
    const result = await executeFinalizeCommand(undefined, {}, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action).toBe('no_target');
    }
  });

  it('특정 스펙 ID로 확정할 수 있다', async () => {
    vi.mocked(finalizeById).mockResolvedValue({
      success: true as const,
      data: {
        id: 'auth/login',
        domain: 'auth',
        specPath: '.sdd/specs/auth/login/spec.md',
        original: {} as never,
        finalizedAt: new Date(),
      },
    });

    const result = await executeFinalizeCommand('auth/login', {}, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action).toBe('single');
    }
  });

  it('--all 옵션으로 모든 승인 스펙을 확정한다', async () => {
    vi.mocked(finalizeAllApproved).mockResolvedValue({
      success: true as const,
      data: {
        finalized: [],
        skipped: [],
        errors: [],
      },
    });

    const result = await executeFinalizeCommand(undefined, { all: true }, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action).toBe('all');
    }
  });

  it('--domain 옵션으로 도메인별 확정한다', async () => {
    vi.mocked(finalizeDomain).mockResolvedValue({
      success: true as const,
      data: {
        finalized: [],
        skipped: [],
        errors: [],
      },
    });

    const result = await executeFinalizeCommand(undefined, { domain: 'auth' }, tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action).toBe('domain');
    }
  });
});

describe('executeCheckSerenaCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Serena 사용 가능 시 available: true를 반환한다', async () => {
    vi.mocked(ensureSerenaAvailable).mockResolvedValue({
      success: true as const,
      data: undefined,
    });

    const result = await executeCheckSerenaCommand();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.available).toBe(true);
    }
  });

  it('Serena 사용 불가 시 available: false를 반환한다', async () => {
    vi.mocked(ensureSerenaAvailable).mockResolvedValue({
      success: false as const,
      error: new Error('Serena not available'),
    });

    const result = await executeCheckSerenaCommand();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.available).toBe(false);
    }
  });
});
