/**
 * 구조적 Diff 테스트
 */
import { describe, it, expect } from 'vitest';
import { compareSpecs } from '../../../../src/core/diff/structural-diff.js';

describe('structural-diff', () => {
  describe('compareSpecs', () => {
    describe('요구사항 비교', () => {
      it('추가된 요구사항을 감지한다', () => {
        const before = `### REQ-001: 로그인

시스템은 로그인을 지원해야 한다(SHALL).`;

        const after = `### REQ-001: 로그인

시스템은 로그인을 지원해야 한다(SHALL).

### REQ-002: 로그아웃

시스템은 로그아웃을 지원해야 한다(SHALL).`;

        const diff = compareSpecs(before, after, 'test.md');

        expect(diff.requirements).toHaveLength(1);
        expect(diff.requirements[0].id).toBe('REQ-002');
        expect(diff.requirements[0].type).toBe('added');
      });

      it('삭제된 요구사항을 감지한다', () => {
        const before = `### REQ-001: 로그인

시스템은 로그인을 지원해야 한다(SHALL).

### REQ-002: 로그아웃

시스템은 로그아웃을 지원해야 한다(SHALL).`;

        const after = `### REQ-001: 로그인

시스템은 로그인을 지원해야 한다(SHALL).`;

        const diff = compareSpecs(before, after, 'test.md');

        expect(diff.requirements).toHaveLength(1);
        expect(diff.requirements[0].id).toBe('REQ-002');
        expect(diff.requirements[0].type).toBe('removed');
      });

      it('수정된 요구사항을 감지한다', () => {
        const before = `### REQ-001: 로그인

시스템은 이메일 로그인을 지원해야 한다(SHALL).`;

        const after = `### REQ-001: 로그인

시스템은 이메일과 소셜 로그인을 지원해야 한다(SHALL).`;

        const diff = compareSpecs(before, after, 'test.md');

        expect(diff.requirements).toHaveLength(1);
        expect(diff.requirements[0].id).toBe('REQ-001');
        expect(diff.requirements[0].type).toBe('modified');
      });

      it('변경이 없으면 빈 배열을 반환한다', () => {
        const content = `### REQ-001: 로그인

시스템은 로그인을 지원해야 한다(SHALL).`;

        const diff = compareSpecs(content, content, 'test.md');

        expect(diff.requirements).toHaveLength(0);
      });
    });

    describe('시나리오 비교', () => {
      it('추가된 시나리오를 감지한다', () => {
        const before = `### Scenario: 로그인 성공

- **GIVEN** 유효한 사용자
- **WHEN** 로그인
- **THEN** 성공`;

        const after = `### Scenario: 로그인 성공

- **GIVEN** 유효한 사용자
- **WHEN** 로그인
- **THEN** 성공

### Scenario: 로그인 실패

- **GIVEN** 잘못된 비밀번호
- **WHEN** 로그인
- **THEN** 실패`;

        const diff = compareSpecs(before, after, 'test.md');

        expect(diff.scenarios).toHaveLength(1);
        expect(diff.scenarios[0].name).toBe('로그인 실패');
        expect(diff.scenarios[0].type).toBe('added');
      });

      it('삭제된 시나리오를 감지한다', () => {
        const before = `### Scenario: 로그인 성공

- **GIVEN** 유효한 사용자
- **WHEN** 로그인
- **THEN** 성공

### Scenario: 로그인 실패

- **GIVEN** 잘못된 비밀번호
- **WHEN** 로그인
- **THEN** 실패`;

        const after = `### Scenario: 로그인 성공

- **GIVEN** 유효한 사용자
- **WHEN** 로그인
- **THEN** 성공`;

        const diff = compareSpecs(before, after, 'test.md');

        expect(diff.scenarios).toHaveLength(1);
        expect(diff.scenarios[0].name).toBe('로그인 실패');
        expect(diff.scenarios[0].type).toBe('removed');
      });
    });

    describe('키워드 변경 감지', () => {
      it('키워드 강화를 감지한다', () => {
        const before = `### REQ-001: 로그인

시스템은 로그인을 지원해야 한다(SHOULD).`;

        const after = `### REQ-001: 로그인

시스템은 로그인을 지원해야 한다(SHALL).`;

        const diff = compareSpecs(before, after, 'test.md');

        expect(diff.keywordChanges).toHaveLength(1);
        expect(diff.keywordChanges[0].reqId).toBe('REQ-001');
        expect(diff.keywordChanges[0].before).toBe('SHOULD');
        expect(diff.keywordChanges[0].after).toBe('SHALL');
        expect(diff.keywordChanges[0].impact).toBe('strengthened');
      });
    });

    describe('메타데이터 비교', () => {
      it('메타데이터 변경을 감지한다', () => {
        const before = `---
id: test
status: draft
---

# 테스트`;

        const after = `---
id: test
status: approved
---

# 테스트`;

        const diff = compareSpecs(before, after, 'test.md');

        expect(diff.metadata).toBeDefined();
        expect(diff.metadata?.type).toBe('modified');
        expect(diff.metadata?.changedFields).toContain('status');
      });

      it('메타데이터 추가를 감지한다', () => {
        const before = `# 테스트`;

        const after = `---
id: test
---

# 테스트`;

        const diff = compareSpecs(before, after, 'test.md');

        expect(diff.metadata).toBeDefined();
        expect(diff.metadata?.type).toBe('added');
      });
    });

    describe('새 파일/삭제된 파일', () => {
      it('새 파일을 처리한다', () => {
        const after = `### REQ-001: 로그인

시스템은 로그인을 지원해야 한다(SHALL).`;

        const diff = compareSpecs(undefined, after, 'new.md');

        expect(diff.requirements).toHaveLength(1);
        expect(diff.requirements[0].type).toBe('added');
      });

      it('삭제된 파일을 처리한다', () => {
        const before = `### REQ-001: 로그인

시스템은 로그인을 지원해야 한다(SHALL).`;

        const diff = compareSpecs(before, undefined, 'deleted.md');

        expect(diff.requirements).toHaveLength(1);
        expect(diff.requirements[0].type).toBe('removed');
      });
    });
  });
});
