/**
 * Constitution 파서 테스트
 */
import { describe, it, expect } from 'vitest';
import { parseConstitution, validateConstitution } from '../../../../src/core/constitution/parser.js';

const VALID_CONSTITUTION = `---
version: 1.0.0
created: 2025-12-21
---

# Constitution: TaskFlow

> 프로젝트의 모든 설계와 구현은 아래 원칙을 준수해야 한다(SHALL).

## 핵심 원칙

### 1. 사용자 경험 우선

- 모든 UI는 직관적이어야 한다(SHALL)
- API 응답은 1초 이내여야 한다(SHALL)

### 2. 보안

- 비밀번호는 해싱하여 저장해야 한다(SHALL)

## 금지 사항

- 비밀번호를 평문으로 저장해서는 안 된다(SHALL NOT)
- 테스트 없이 배포해서는 안 된다(SHALL NOT)

## 기술 스택

- Backend: Node.js
- Database: PostgreSQL
- Frontend: React

## 품질 기준

- 테스트 커버리지: 80% 이상(SHOULD)
`;

describe('parseConstitution', () => {
  it('유효한 Constitution을 파싱한다', () => {
    const result = parseConstitution(VALID_CONSTITUTION);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectName).toBe('TaskFlow');
      expect(result.data.metadata.version).toBe('1.0.0');
      expect(result.data.metadata.created).toBe('2025-12-21');
    }
  });

  it('원칙을 추출한다', () => {
    const result = parseConstitution(VALID_CONSTITUTION);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.principles.length).toBe(2);
      expect(result.data.principles[0].title).toContain('사용자 경험');
      expect(result.data.principles[0].rules.length).toBe(2);
    }
  });

  it('금지 사항을 추출한다', () => {
    const result = parseConstitution(VALID_CONSTITUTION);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.forbidden.length).toBe(2);
      expect(result.data.forbidden[0]).toContain('평문');
    }
  });

  it('기술 스택을 추출한다', () => {
    const result = parseConstitution(VALID_CONSTITUTION);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.techStack.length).toBe(3);
      expect(result.data.techStack).toContain('Backend: Node.js');
    }
  });

  it('품질 기준을 추출한다', () => {
    const result = parseConstitution(VALID_CONSTITUTION);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.qualityStandards.length).toBe(1);
      expect(result.data.qualityStandards[0]).toContain('80%');
    }
  });

  it('프로젝트명이 없으면 에러를 반환한다', () => {
    const noProject = `---
version: 1.0.0
---

# 잘못된 Constitution

내용
`;
    const result = parseConstitution(noProject);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('프로젝트명');
    }
  });
});

describe('validateConstitution', () => {
  it('유효한 Constitution에 성공을 반환한다', () => {
    const parseResult = parseConstitution(VALID_CONSTITUTION);
    expect(parseResult.success).toBe(true);
    if (parseResult.success) {
      const result = validateConstitution(parseResult.data);
      expect(result.success).toBe(true);
    }
  });

  it('원칙이 없으면 에러를 반환한다', () => {
    const emptyConstitution = {
      projectName: 'Test',
      metadata: { version: '1.0.0', created: '2025-12-21' },
      principles: [],
      forbidden: [],
      techStack: [],
      qualityStandards: [],
      rawContent: '',
    };

    const result = validateConstitution(emptyConstitution);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('원칙');
    }
  });
});
