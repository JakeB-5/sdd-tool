/**
 * finalizer 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import {
  finalizeSpec,
  finalizeAllApproved,
  finalizeDomain,
  finalizeById,
  formatFinalizeResult,
  getFinalizedSpecs,
} from '../../../../src/core/reverse/finalizer.js';
import { approveSpec } from '../../../../src/core/reverse/review.js';
import type { ExtractedSpec } from '../../../../src/core/reverse/spec-generator.js';

describe('finalizer', () => {
  let sddRoot: string;
  let sddPath: string;

  const createMockSpec = (overrides: Partial<ExtractedSpec> = {}): ExtractedSpec => ({
    id: 'auth/login',
    name: 'Login',
    domain: 'auth',
    description: 'Login functionality',
    sourceSymbols: [],
    confidence: {
      score: 75,
      grade: 'C',
      factors: {
        documentation: 60,
        naming: 80,
        structure: 70,
        testCoverage: 50,
        typing: 90,
      },
      suggestions: [],
    },
    scenarios: [
      {
        name: '로그인 성공',
        given: '유효한 자격증명이 주어졌을 때',
        when: '로그인을 시도하면',
        then: '인증 토큰이 반환되어야 한다',
        inferred: true,
      },
    ],
    contracts: [
      {
        type: 'input',
        description: '사용자 자격증명',
        signature: 'username: string, password: string',
      },
    ],
    relatedSpecs: ['user'],
    metadata: {
      extractedAt: new Date(),
      sourceFiles: ['src/auth/login.ts'],
      symbolCount: 5,
      version: '1.0.0',
      status: 'approved',
    },
    ...overrides,
  });

  beforeEach(async () => {
    sddRoot = path.join(os.tmpdir(), `sdd-finalize-test-${Date.now()}`);
    sddPath = path.join(sddRoot, '.sdd');
    await fs.mkdir(sddPath, { recursive: true });

    // 테스트용 승인된 스펙 저장
    const draftsPath = path.join(sddPath, '.reverse-drafts', 'auth');
    await fs.mkdir(draftsPath, { recursive: true });

    const spec = createMockSpec();
    await fs.writeFile(
      path.join(draftsPath, 'login.json'),
      JSON.stringify(spec),
      'utf-8'
    );
  });

  afterEach(async () => {
    await fs.rm(sddRoot, { recursive: true, force: true });
  });

  describe('finalizeSpec', () => {
    it('스펙 확정', async () => {
      const spec = createMockSpec();
      const result = await finalizeSpec(sddRoot, spec);

      expect(result.success).toBe(true);
      if (!result.success) return;

      // 도메인 기반 형식: id는 domain/feature-id
      expect(result.data.id).toBe('auth/login');
      expect(result.data.domain).toBe('auth');

      // 파일이 생성되었는지 확인: .sdd/specs/<domain>/<feature-id>/spec.md
      const specPath = path.join(sddPath, 'specs', 'auth', 'login', 'spec.md');
      const exists = await fs.stat(specPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('SDD 형식으로 변환', async () => {
      const spec = createMockSpec();
      await finalizeSpec(sddRoot, spec);

      // 도메인 기반 형식: .sdd/specs/<domain>/<feature-id>/spec.md
      const specPath = path.join(sddPath, 'specs', 'auth', 'login', 'spec.md');
      const content = await fs.readFile(specPath, 'utf-8');

      // 주요 섹션 확인
      expect(content).toContain('# Login');
      expect(content).toContain('## 시나리오');
      expect(content).toContain('Given');
      expect(content).toContain('When');
      expect(content).toContain('Then');
      expect(content).toContain('## 계약');
    });
  });

  describe('finalizeAllApproved', () => {
    it('모든 승인된 스펙 확정', async () => {
      // 스펙을 승인 상태로 설정
      await approveSpec(sddPath, 'auth/login');

      const result = await finalizeAllApproved(sddRoot);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.finalized.length).toBe(1);
    });

    it('승인된 스펙이 없으면 빈 결과', async () => {
      // 승인되지 않은 스펙 생성
      const unapprovedSpec = createMockSpec({
        id: 'user/profile',
        domain: 'user',
        metadata: { ...createMockSpec().metadata, status: 'draft' }
      });
      const userPath = path.join(sddPath, '.reverse-drafts', 'user');
      await fs.mkdir(userPath, { recursive: true });
      await fs.writeFile(
        path.join(userPath, 'profile.json'),
        JSON.stringify(unapprovedSpec),
        'utf-8'
      );

      // auth/login은 삭제 (기존 approved 상태)
      const authPath = path.join(sddPath, '.reverse-drafts', 'auth');
      await fs.rm(authPath, { recursive: true, force: true });

      const result = await finalizeAllApproved(sddRoot);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.finalized.length).toBe(0);
    });
  });

  describe('finalizeDomain', () => {
    it('특정 도메인 확정', async () => {
      await approveSpec(sddPath, 'auth/login');

      const result = await finalizeDomain(sddRoot, 'auth');
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.finalized.length).toBe(1);
      expect(result.data.finalized[0].domain).toBe('auth');
    });

    it('없는 도메인은 빈 결과', async () => {
      const result = await finalizeDomain(sddRoot, 'nonexistent');
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.finalized.length).toBe(0);
    });
  });

  describe('finalizeById', () => {
    it('특정 스펙 확정', async () => {
      await approveSpec(sddPath, 'auth/login');

      const result = await finalizeById(sddRoot, 'auth/login');
      expect(result.success).toBe(true);
      if (!result.success) return;

      // 도메인 기반 형식: id는 domain/feature-id
      expect(result.data.id).toBe('auth/login');
    });

    it('존재하지 않는 스펙은 실패', async () => {
      const result = await finalizeById(sddRoot, 'nonexistent/spec');
      expect(result.success).toBe(false);
    });
  });

  describe('formatFinalizeResult', () => {
    it('결과 포맷팅', () => {
      const result = {
        finalized: [
          {
            id: 'auth/login',
            domain: 'auth',
            specPath: '.sdd/specs/auth/login/spec.md',
            original: createMockSpec(),
            finalizedAt: new Date(),
          },
        ],
        skipped: [],
        errors: [],
      };

      const output = formatFinalizeResult(result);
      expect(output).toContain('스펙 확정 결과');
      expect(output).toContain('login');
      expect(output).toContain('다음 단계');
    });

    it('빈 결과 메시지', () => {
      const result = {
        finalized: [],
        skipped: [],
        errors: [],
      };

      const output = formatFinalizeResult(result);
      expect(output).toContain('확정할 스펙이 없습니다');
    });

    it('오류 표시', () => {
      const result = {
        finalized: [],
        skipped: [],
        errors: [{ specId: 'auth/login', error: '저장 실패' }],
      };

      const output = formatFinalizeResult(result);
      expect(output).toContain('오류');
      expect(output).toContain('저장 실패');
    });
  });

  describe('getFinalizedSpecs', () => {
    it('확정된 스펙 목록', async () => {
      // 스펙 확정
      await approveSpec(sddPath, 'auth/login');
      await finalizeById(sddRoot, 'auth/login');

      const result = await getFinalizedSpecs(sddRoot);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.length).toBe(1);
      expect(result.data[0].domain).toBe('auth');
    });

    it('스펙이 없으면 빈 배열', async () => {
      const result = await getFinalizedSpecs(sddRoot);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data).toEqual([]);
    });
  });
});
