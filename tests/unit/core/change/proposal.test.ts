/**
 * Proposal 파서 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  parseProposal,
  generateProposal,
  updateProposalStatus,
} from '../../../../src/core/change/proposal.js';

describe('parseProposal', () => {
  it('유효한 proposal을 파싱한다', () => {
    const content = `---
id: CHG-001
status: draft
created: 2025-12-21
---

# 변경 제안: OAuth 추가

> OAuth 로그인 지원 추가

---

## 배경

소셜 로그인이 필요합니다.

---

## 영향 범위

### 영향받는 스펙

- \`specs/auth/spec.md\`
- \`specs/user/spec.md\`

### 변경 유형

- [x] 신규 추가 (ADDED)
- [x] 수정 (MODIFIED)
- [ ] 삭제 (REMOVED)

---

## 변경 내용

OAuth 로그인 기능 추가

---

## 리스크 평가

- 영향도: 높음
- 복잡도: 중간
`;

    const result = parseProposal(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.id).toBe('CHG-001');
      expect(result.data.metadata.status).toBe('draft');
      expect(result.data.title).toBe('OAuth 추가');
      expect(result.data.rationale).toContain('소셜 로그인');
      expect(result.data.affectedSpecs).toContain('specs/auth/spec.md');
      expect(result.data.changeType).toContain('ADDED');
      expect(result.data.changeType).toContain('MODIFIED');
      expect(result.data.riskLevel).toBe('high');
      expect(result.data.complexity).toBe('medium');
    }
  });

  it('잘못된 ID 형식은 에러를 반환한다', () => {
    const content = `---
id: INVALID
status: draft
created: 2025-12-21
---

# 변경 제안: 테스트
`;

    const result = parseProposal(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('ID 형식');
    }
  });

  it('날짜 객체도 처리한다', () => {
    // gray-matter가 날짜를 Date 객체로 변환할 수 있음
    const content = `---
id: CHG-002
status: draft
created: 2025-12-21
---

# 변경 제안: 테스트
`;

    const result = parseProposal(content);

    expect(result.success).toBe(true);
  });
});

describe('generateProposal', () => {
  it('proposal 템플릿을 생성한다', () => {
    const result = generateProposal({
      id: 'CHG-001',
      title: 'OAuth 추가',
      rationale: '소셜 로그인 지원',
      affectedSpecs: ['specs/auth/spec.md'],
      changeType: ['ADDED'],
    });

    expect(result).toContain('id: CHG-001');
    expect(result).toContain('OAuth 추가');
    expect(result).toContain('소셜 로그인 지원');
    expect(result).toContain('specs/auth/spec.md');
    expect(result).toContain('[x] 신규 추가');
  });

  it('기본값으로 생성할 수 있다', () => {
    const result = generateProposal({
      id: 'CHG-002',
      title: '기본 제안',
    });

    expect(result).toContain('id: CHG-002');
    expect(result).toContain('기본 제안');
    expect(result).toContain('status: draft');
  });
});

describe('updateProposalStatus', () => {
  it('상태를 업데이트한다', () => {
    const content = `---
id: CHG-001
status: draft
created: 2025-12-21
---

# 변경 제안: 테스트
`;

    const result = updateProposalStatus(content, 'approved');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toContain('status: approved');
      expect(result.data).toContain('updated:');
    }
  });
});
