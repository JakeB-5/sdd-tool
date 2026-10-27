/**
 * 도메인 서비스 테스트 (ID 검증)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DomainService } from '../../../../src/core/domain/service.js';

describe('DomainService ID 검증', () => {
  let tempDir: string;
  let service: DomainService;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-domain-service-'));
    await fs.mkdir(path.join(tempDir, '.sdd'), { recursive: true });
    service = new DomainService(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('create는 경로 조작 도메인 ID를 거부한다', async () => {
    const result = await service.create('../x', { description: 'evil' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('유효하지 않은 도메인 ID');
    }
    const escaped = await fs
      .stat(path.join(tempDir, '.sdd', 'x'))
      .then(() => true)
      .catch(() => false);
    expect(escaped).toBe(false);
  });

  it('rename은 경로 조작 대상 ID를 거부하고 기존 도메인을 유지한다', async () => {
    const created = await service.create('auth', { description: '인증' });
    expect(created.success).toBe(true);

    const result = await service.rename('auth', '../../escape');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('유효하지 않은 도메인 ID');
    }

    const loaded = await service.load();
    expect(loaded.success).toBe(true);
    if (loaded.success) {
      expect(loaded.data.domains['auth']).toBeDefined();
    }
  });

  it('rename은 유효한 ID로는 정상 동작한다', async () => {
    await service.create('auth', { description: '인증' });

    const result = await service.rename('auth', 'identity');

    expect(result.success).toBe(true);
  });
});
