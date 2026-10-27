/**
 * 구현 계획 생성기 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  generatePlan,
  parsePlan,
  updatePlanStatus,
} from '../../../../src/core/new/plan-generator.js';

describe('generatePlan', () => {
  it('기본 계획 파일을 생성한다', () => {
    const content = generatePlan({
      featureId: 'auth-login',
      featureTitle: '로그인 기능',
      overview: '사용자 로그인 기능 구현',
    });

    expect(content).toContain('feature: auth-login');
    expect(content).toContain('status: draft');
    expect(content).toContain('# 구현 계획: 로그인 기능');
    expect(content).toContain('사용자 로그인 기능 구현');
  });

  it('다음 단계는 현재 CLI/스킬 이름으로 작업 분해를 안내한다', () => {
    const content = generatePlan({
      featureId: 'auth-login',
      featureTitle: '로그인 기능',
      overview: '개요',
    });

    expect(content).not.toMatch(/\/?sdd:/);
    expect(content).toContain('`sdd new tasks auth-login`');
    // tasks.md may already exist (sdd new --all): edit it instead of re-running sdd new tasks
    expect(content).toContain('tasks.md를 작업으로 채우기 (`sdd new --all`로 이미 생성된 경우 편집, 없으면 `sdd new tasks auth-login`)');
    expect(content).toContain('`/sdd-tasks`');
    expect(content).toContain('`$sdd-tasks`');
  });

  it('기술 결정을 포함할 수 있다', () => {
    const content = generatePlan({
      featureId: 'auth-login',
      featureTitle: '로그인 기능',
      overview: '구현 개요',
      techDecisions: [
        {
          decision: 'JWT 토큰 사용',
          rationale: '세션리스 인증 구현',
          alternatives: ['세션 기반', '쿠키 기반'],
        },
      ],
    });

    expect(content).toContain('### 결정 1: JWT 토큰 사용');
    expect(content).toContain('세션리스 인증 구현');
    expect(content).toContain('세션 기반');
    expect(content).toContain('쿠키 기반');
  });

  it('구현 단계를 포함할 수 있다', () => {
    const content = generatePlan({
      featureId: 'auth-login',
      featureTitle: '로그인 기능',
      overview: '구현 개요',
      phases: [
        {
          name: '기반 구조',
          description: 'JWT 라이브러리 설정',
          deliverables: ['jwt-utils.ts', 'auth-middleware.ts'],
        },
      ],
    });

    expect(content).toContain('### Phase 1: 기반 구조');
    expect(content).toContain('JWT 라이브러리 설정');
    expect(content).toContain('jwt-utils.ts');
    expect(content).toContain('auth-middleware.ts');
  });

  it('리스크 분석을 포함할 수 있다', () => {
    const content = generatePlan({
      featureId: 'auth-login',
      featureTitle: '로그인 기능',
      overview: '구현 개요',
      risks: [
        {
          risk: '토큰 탈취 위험',
          mitigation: 'HTTP Only 쿠키 사용',
          impact: 'high',
        },
      ],
    });

    expect(content).toContain('토큰 탈취 위험');
    expect(content).toContain('HTTP Only 쿠키 사용');
    expect(content).toContain('🔴');
    expect(content).toContain('HIGH');
  });
});

describe('parsePlan', () => {
  it('계획 내용을 파싱한다', () => {
    const content = `---
feature: auth-login
status: draft
---

# 구현 계획: 로그인 기능

> 개요

---

## 개요

사용자 로그인 기능 구현

---

## 기술 결정

### 결정 1: JWT 사용

**근거:** 세션리스 인증

---

## 구현 단계

### Phase 1: 기반 구조

기반 구조 설정

**산출물:**
- [ ] jwt-utils.ts
- [ ] auth-middleware.ts
`;

    const plan = parsePlan(content);

    expect(plan).not.toBeNull();
    expect(plan?.overview).toBe('사용자 로그인 기능 구현');
    expect(plan?.techDecisions).toHaveLength(1);
    expect(plan?.techDecisions[0].decision).toBe('JWT 사용');
    expect(plan?.phases).toHaveLength(1);
    expect(plan?.phases[0].name).toBe('기반 구조');
  });

  it('개요가 없으면 null을 반환한다', () => {
    const content = '# 제목만';
    expect(parsePlan(content)).toBeNull();
  });
});

describe('updatePlanStatus', () => {
  it('상태를 업데이트한다', () => {
    const content = `---
feature: auth
status: draft
---

# 계획
`;

    const updated = updatePlanStatus(content, 'approved');

    expect(updated).toContain('status: approved');
  });
});
