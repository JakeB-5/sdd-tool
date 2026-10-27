/**
 * 매처 테스트
 */
import { describe, it, expect } from 'vitest';
import { SyncMatcher } from '../../../../src/core/sync/matcher.js';
import type { ExtractedRequirement, CodeReference } from '../../../../src/core/sync/schemas.js';

describe('SyncMatcher', () => {
  describe('match', () => {
    it('스펙과 코드를 매칭한다', () => {
      const requirements: ExtractedRequirement[] = [
        { id: 'REQ-001', specId: 'auth', title: '로그인', line: 10, keyword: 'SHALL' },
        { id: 'REQ-002', specId: 'auth', title: '로그아웃', line: 20, keyword: 'SHOULD' },
      ];

      const codeRefs: CodeReference[] = [
        { reqId: 'REQ-001', file: 'src/auth.ts', line: 15, type: 'code' },
      ];

      const testRefs: CodeReference[] = [
        { reqId: 'REQ-001', file: 'tests/auth.test.ts', line: 10, type: 'test' },
      ];

      const matcher = new SyncMatcher();
      const result = matcher.match(requirements, codeRefs, testRefs);

      expect(result.totalRequirements).toBe(2);
      expect(result.totalImplemented).toBe(1);
      expect(result.implemented).toContain('REQ-001');
      expect(result.missing).toContain('REQ-002');
      expect(result.syncRate).toBe(50);
    });

    it('스펙 요약 제목은 첫 요구사항 제목이 아니라 스펙 제목이다', () => {
      const requirements: ExtractedRequirement[] = [
        { id: 'REQ-01', specId: 'pricing/cart', specTitle: '카트', title: '빈 카트 생성', line: 10 },
        { id: 'REQ-02', specId: 'pricing/cart', specTitle: '카트', title: '상품 추가', line: 20 },
      ];

      const result = new SyncMatcher().match(requirements, [], []);

      expect(result.specs[0].title).toBe('카트');
      expect(result.requirements[0].title).toBe('빈 카트 생성');
    });

    it('모두 구현되면 동기화율 100%', () => {
      const requirements: ExtractedRequirement[] = [
        { id: 'REQ-001', specId: 'feature', line: 10 },
        { id: 'REQ-002', specId: 'feature', line: 20 },
      ];

      const codeRefs: CodeReference[] = [
        { reqId: 'REQ-001', file: 'src/a.ts', line: 1, type: 'code' },
        { reqId: 'REQ-002', file: 'src/b.ts', line: 1, type: 'code' },
      ];

      const matcher = new SyncMatcher();
      const result = matcher.match(requirements, codeRefs, []);

      expect(result.syncRate).toBe(100);
      expect(result.missing).toHaveLength(0);
    });

    it('요구사항이 없으면 동기화율 100%', () => {
      const matcher = new SyncMatcher();
      const result = matcher.match([], [], []);

      expect(result.syncRate).toBe(100);
      expect(result.totalRequirements).toBe(0);
    });

    it('고아 코드를 감지한다', () => {
      const requirements: ExtractedRequirement[] = [
        { id: 'REQ-001', specId: 'feature', line: 10 },
      ];

      const codeRefs: CodeReference[] = [
        { reqId: 'REQ-001', file: 'src/a.ts', line: 1, type: 'code' },
        { reqId: 'REQ-999', file: 'src/orphan.ts', line: 5, type: 'code', context: 'orphan code' },
      ];

      const matcher = new SyncMatcher();
      const result = matcher.match(requirements, codeRefs, []);

      expect(result.orphans).toHaveLength(1);
      expect(result.orphans[0].file).toBe('src/orphan.ts');
    });

    it('스펙별 요약을 생성한다', () => {
      const requirements: ExtractedRequirement[] = [
        { id: 'REQ-001', specId: 'auth', line: 10 },
        { id: 'REQ-002', specId: 'auth', line: 20 },
        { id: 'REQ-003', specId: 'profile', line: 10 },
      ];

      const codeRefs: CodeReference[] = [
        { reqId: 'REQ-001', file: 'src/auth.ts', line: 1, type: 'code' },
        { reqId: 'REQ-003', file: 'src/profile.ts', line: 1, type: 'code' },
      ];

      const matcher = new SyncMatcher();
      const result = matcher.match(requirements, codeRefs, []);

      expect(result.specs).toHaveLength(2);

      const authSpec = result.specs.find(s => s.id === 'auth');
      expect(authSpec).toBeDefined();
      expect(authSpec!.requirementCount).toBe(2);
      expect(authSpec!.implementedCount).toBe(1);
      expect(authSpec!.syncRate).toBe(50);

      const profileSpec = result.specs.find(s => s.id === 'profile');
      expect(profileSpec).toBeDefined();
      expect(profileSpec!.syncRate).toBe(100);
    });

    it('요구사항 상태에 위치 정보를 포함한다', () => {
      const requirements: ExtractedRequirement[] = [
        { id: 'REQ-001', specId: 'feature', line: 10, title: '기능' },
      ];

      const codeRefs: CodeReference[] = [
        { reqId: 'REQ-001', file: 'src/impl.ts', line: 25, type: 'code' },
      ];

      const testRefs: CodeReference[] = [
        { reqId: 'REQ-001', file: 'tests/impl.test.ts', line: 10, type: 'test' },
      ];

      const matcher = new SyncMatcher();
      const result = matcher.match(requirements, codeRefs, testRefs);

      const status = result.requirements.find(r => r.id === 'REQ-001');
      expect(status).toBeDefined();
      expect(status!.locations).toHaveLength(2);
      expect(status!.locations.some(l => l.type === 'code')).toBe(true);
      expect(status!.locations.some(l => l.type === 'test')).toBe(true);
    });

    it('테스트만 있어도 구현으로 간주한다', () => {
      const requirements: ExtractedRequirement[] = [
        { id: 'REQ-001', specId: 'feature', line: 10 },
      ];

      const testRefs: CodeReference[] = [
        { reqId: 'REQ-001', file: 'tests/a.test.ts', line: 5, type: 'test' },
      ];

      const matcher = new SyncMatcher();
      const result = matcher.match(requirements, [], testRefs);

      expect(result.implemented).toContain('REQ-001');
      expect(result.syncRate).toBe(100);
    });
  });

  describe('스펙 범위 참조', () => {
    const requirements: ExtractedRequirement[] = [
      { id: 'REQ-01', specId: 'auth/login', line: 1 },
      { id: 'REQ-01', specId: 'billing/pay', line: 1 },
      { id: 'REQ-02', specId: 'auth/login', line: 2 },
    ];

    const statusOf = (result: ReturnType<SyncMatcher['match']>, specId: string, id: string) =>
      result.requirements.find(r => r.specId === specId && r.id === id)?.status;

    it('<domain>/<feature>#REQ-xx는 해당 스펙만 구현으로 표시한다', () => {
      const result = new SyncMatcher().match(requirements, [
        { reqId: 'REQ-01', specRef: 'auth/login', file: 'src/a.ts', line: 1, type: 'code' },
      ], []);

      expect(statusOf(result, 'auth/login', 'REQ-01')).toBe('implemented');
      expect(statusOf(result, 'billing/pay', 'REQ-01')).toBe('missing');
    });

    it('유일한 feature 이름(<feature>#REQ-xx)으로도 지정할 수 있다', () => {
      const result = new SyncMatcher().match(requirements, [
        { reqId: 'REQ-01', specRef: 'pay', file: 'src/p.ts', line: 1, type: 'code' },
      ], []);

      expect(statusOf(result, 'billing/pay', 'REQ-01')).toBe('implemented');
      expect(statusOf(result, 'auth/login', 'REQ-01')).toBe('missing');
    });

    it('여러 스펙에 있는 bare REQ 참조는 무시하고 경고한다', () => {
      const result = new SyncMatcher().match(requirements, [
        { reqId: 'REQ-01', file: 'src/a.ts', line: 3, type: 'code' },
      ], []);

      expect(statusOf(result, 'auth/login', 'REQ-01')).toBe('missing');
      expect(statusOf(result, 'billing/pay', 'REQ-01')).toBe('missing');
      expect(result.orphans).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings![0]).toContain('src/a.ts:3');
      expect(result.warnings![0]).toContain('auth/login, billing/pay');
    });

    it('한 스펙에만 있는 bare REQ 참조는 그대로 매칭한다', () => {
      const result = new SyncMatcher().match(requirements, [
        { reqId: 'REQ-02', file: 'src/a.ts', line: 3, type: 'code' },
      ], []);

      expect(statusOf(result, 'auth/login', 'REQ-02')).toBe('implemented');
      expect(result.warnings).toHaveLength(0);
    });

    it('특정 스펙만 검사해도 전체 요구사항 기준으로 모호성을 판단한다', () => {
      const loginOnly = requirements.filter(r => r.specId === 'auth/login');
      const result = new SyncMatcher().match(loginOnly, [
        { reqId: 'REQ-01', file: 'src/a.ts', line: 3, type: 'code' },
        { reqId: 'REQ-01', specRef: 'billing/pay', file: 'src/p.ts', line: 1, type: 'code' },
      ], [], requirements);

      expect(statusOf(result, 'auth/login', 'REQ-01')).toBe('missing');
      expect(result.warnings).toHaveLength(1);
      // A ref to another spec's requirement is not an orphan
      expect(result.orphans).toHaveLength(0);
    });

    it('존재하지 않는 스펙을 한정한 참조는 고아로 보고한다', () => {
      const result = new SyncMatcher().match(requirements, [
        { reqId: 'REQ-01', specRef: 'nope', file: 'src/x.ts', line: 1, type: 'code' },
      ], []);

      expect(result.orphans).toHaveLength(1);
      expect(result.orphans[0].text).toContain('nope#REQ-01');
    });
  });
});
