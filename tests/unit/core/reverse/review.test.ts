/**
 * review 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import {
  loadReviewList,
  approveSpec,
  rejectSpec,
  requestRevision,
  calculateReviewSummary,
  formatReviewList,
  formatSpecDetail,
  getApprovedSpecs,
  type ReviewItem,
} from '../../../../src/core/reverse/review.js';
import type { ExtractedSpec } from '../../../../src/core/reverse/spec-generator.js';

describe('review', () => {
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
      suggestions: ['문서화 개선 필요'],
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
    contracts: [],
    relatedSpecs: [],
    metadata: {
      extractedAt: new Date(),
      sourceFiles: ['src/auth/login.ts'],
      symbolCount: 5,
      version: '1.0.0',
      status: 'draft',
    },
    ...overrides,
  });

  beforeEach(async () => {
    sddPath = path.join(os.tmpdir(), `sdd-review-test-${Date.now()}`);
    await fs.mkdir(sddPath, { recursive: true });

    // 테스트용 스펙 저장
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
    await fs.rm(sddPath, { recursive: true, force: true });
  });

  describe('loadReviewList', () => {
    it('리뷰 목록 로드', async () => {
      const result = await loadReviewList(sddPath);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.length).toBe(1);
      expect(result.data[0].specId).toBe('auth/login');
    });

    it('빈 디렉토리는 빈 배열', async () => {
      const emptyPath = path.join(os.tmpdir(), `sdd-empty-${Date.now()}`);
      await fs.mkdir(emptyPath, { recursive: true });

      const result = await loadReviewList(emptyPath);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data).toEqual([]);

      await fs.rm(emptyPath, { recursive: true, force: true });
    });
  });

  describe('approveSpec', () => {
    it('스펙 승인', async () => {
      const result = await approveSpec(sddPath, 'auth/login', '좋은 스펙입니다');
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.status).toBe('approved');
      expect(result.data.spec.metadata.status).toBe('approved');
    });

    it('존재하지 않는 스펙은 실패', async () => {
      const result = await approveSpec(sddPath, 'nonexistent/spec');
      expect(result.success).toBe(false);
    });
  });

  describe('rejectSpec', () => {
    it('스펙 거부', async () => {
      const result = await rejectSpec(sddPath, 'auth/login', '품질이 낮습니다');
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.status).toBe('rejected');
      expect(result.data.comments.some(c => c.message.includes('품질'))).toBe(true);
    });
  });

  describe('requestRevision', () => {
    it('수정 요청', async () => {
      const suggestions = ['시나리오 추가', '계약 명시'];
      const result = await requestRevision(sddPath, 'auth/login', suggestions);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.status).toBe('needs_revision');
      expect(result.data.suggestions).toContain('시나리오 추가');
    });
  });

  describe('calculateReviewSummary', () => {
    it('요약 계산', () => {
      const items: ReviewItem[] = [
        { specId: '1', spec: createMockSpec(), status: 'pending', comments: [], suggestions: [] },
        { specId: '2', spec: createMockSpec(), status: 'approved', comments: [], suggestions: [] },
        { specId: '3', spec: createMockSpec(), status: 'rejected', comments: [], suggestions: [] },
        { specId: '4', spec: createMockSpec(), status: 'needs_revision', comments: [], suggestions: [] },
        { specId: '5', spec: createMockSpec(), status: 'pending', comments: [], suggestions: [] },
      ];

      const summary = calculateReviewSummary(items);
      expect(summary.total).toBe(5);
      expect(summary.pending).toBe(2);
      expect(summary.approved).toBe(1);
      expect(summary.rejected).toBe(1);
      expect(summary.needsRevision).toBe(1);
    });
  });

  describe('formatReviewList', () => {
    it('리뷰 목록 포맷팅', () => {
      const items: ReviewItem[] = [
        { specId: 'auth/login', spec: createMockSpec(), status: 'pending', comments: [], suggestions: [] },
      ];

      const output = formatReviewList(items);
      expect(output).toContain('스펙 리뷰 목록');
      expect(output).toContain('auth/login');
    });

    it('빈 목록 메시지', () => {
      const output = formatReviewList([]);
      expect(output).toContain('리뷰할 스펙이 없습니다');
    });
  });

  describe('formatSpecDetail', () => {
    it('스펙 상세 포맷팅', () => {
      const item: ReviewItem = {
        specId: 'auth/login',
        spec: createMockSpec(),
        status: 'pending',
        comments: [],
        suggestions: ['개선 필요'],
      };

      const output = formatSpecDetail(item);
      expect(output).toContain('Login');
      expect(output).toContain('auth');
      expect(output).toContain('로그인 성공');
    });
  });

  describe('getApprovedSpecs', () => {
    it('승인된 스펙 조회', async () => {
      // 먼저 승인
      await approveSpec(sddPath, 'auth/login');

      const result = await getApprovedSpecs(sddPath);
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('auth/login');
    });
  });
});
