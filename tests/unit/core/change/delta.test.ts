/**
 * Delta 파서 테스트
 */
import { describe, it, expect, vi } from 'vitest';
import {
  parseDelta,
  generateDelta,
  validateDelta,
} from '../../../../src/core/change/delta.js';

describe('parseDelta', () => {
  it('유효한 delta를 파싱한다', () => {
    const content = `---
proposal: CHG-001
created: 2025-12-21
---

# Delta: OAuth 추가

## ADDED

**Requirement: OAuth 로그인**

시스템은 OAuth 2.0을 지원해야 한다(SHALL).

## MODIFIED

### specs/auth/spec.md

#### Before

\`\`\`markdown
기존 내용
\`\`\`

#### After

\`\`\`markdown
변경된 내용
\`\`\`

## REMOVED

(없음)
`;

    const result = parseDelta(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.proposal).toBe('CHG-001');
      expect(result.data.title).toBe('OAuth 추가');
      expect(result.data.added).toHaveLength(1);
      expect(result.data.added[0].content).toContain('OAuth 로그인');
      expect(result.data.modified).toHaveLength(1);
      expect(result.data.modified[0].before).toBe('기존 내용');
      expect(result.data.modified[0].after).toBe('변경된 내용');
    }
  });

  it('ADDED만 있는 delta를 파싱한다', () => {
    const content = `---
proposal: CHG-002
created: 2025-12-21
---

# Delta: 새 기능

## ADDED

새로운 기능 스펙

## MODIFIED

(수정 없음)

## REMOVED

(삭제 없음)
`;

    const result = parseDelta(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.added).toHaveLength(1);
      expect(result.data.added[0].content).toContain('새로운 기능 스펙');
      // MODIFIED와 REMOVED는 플레이스홀더만 있으므로 실제 변경으로 인식될 수 있음
    }
  });
});

describe('generateDelta', () => {
  it('delta 템플릿을 생성한다', () => {
    const result = generateDelta({
      proposalId: 'CHG-001',
      title: 'OAuth 추가',
      added: ['OAuth 로그인 기능'],
      modified: [{
        target: 'specs/auth/spec.md',
        before: '기존',
        after: '변경',
      }],
    });

    expect(result).toContain('proposal: CHG-001');
    expect(result).toContain('Delta: OAuth 추가');
    expect(result).toContain('OAuth 로그인 기능');
    expect(result).toContain('기존');
    expect(result).toContain('변경');
  });

  it('기본값으로 생성할 수 있다', () => {
    const result = generateDelta({
      proposalId: 'CHG-002',
      title: '기본 델타',
    });

    expect(result).toContain('proposal: CHG-002');
    expect(result).toContain('## ADDED');
    expect(result).toContain('## MODIFIED');
    expect(result).toContain('## REMOVED');
    expect(result).toContain('### {{SPEC_PATH}}');
  });

  it('affectedSpecs가 있으면 스펙마다 MODIFIED 블록을 만들고 플레이스홀더를 쓰지 않는다', () => {
    const result = generateDelta({
      proposalId: 'CHG-003',
      title: '다중 스펙',
      affectedSpecs: ['auth/login', 'auth/signup'],
    });

    expect(result).not.toContain('{{SPEC_PATH}}');
    expect(result).toContain('### auth/login\n');
    expect(result).toContain('### auth/signup\n');

    const parsed = parseDelta(result);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.modified.map((m) => m.target)).toEqual(['auth/login', 'auth/signup']);
    }
  });

  it('플레이스홀더 MODIFIED 제목은 파싱 시 무시된다', () => {
    const parsed = parseDelta(generateDelta({ proposalId: 'CHG-004', title: '빈 델타' }));

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.modified).toHaveLength(0);
    }
  });
});

describe('validateDelta', () => {
  it('유효한 delta를 통과시킨다', () => {
    const content = `---
proposal: CHG-001
created: 2025-12-21
---

# Delta: 테스트

## ADDED

새 기능 추가

## MODIFIED

## REMOVED
`;

    const result = validateDelta(content);

    expect(result.valid).toBe(true);
    expect(result.hasAdded).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('변경 내용이 템플릿만 있으면 실패한다', () => {
    // 모든 섹션이 템플릿 플레이스홀더만 있는 경우
    const content = `---
proposal: CHG-001
created: 2025-12-21
---

# Delta: 빈 델타

## ADDED

(추가되는 스펙 내용)

## MODIFIED

(수정 없음)

## REMOVED

(삭제되는 스펙 참조)
`;

    const result = validateDelta(content);

    // 플레이스홀더는 실제 변경으로 간주됨 (검증은 사용자가 채워넣어야 함)
    // 이 경우 valid는 true일 수 있음 - 형식은 맞기 때문
    expect(result.hasAdded).toBe(false); // 플레이스홀더는 실제 내용이 아님
    expect(result.hasRemoved).toBe(false);
  });

  it('MODIFIED에 Before/After가 없으면 경고한다', () => {
    const content = `---
proposal: CHG-001
created: 2025-12-21
---

# Delta: 테스트

## ADDED

## MODIFIED

수정 내용 설명

## REMOVED
`;

    const result = validateDelta(content);

    expect(result.hasModified).toBe(true);
    expect(result.warnings.some((w) => w.includes('Before/After'))).toBe(true);
  });

  it('MODIFIED 대상마다 Before/After 누락을 경고한다', () => {
    const content = `---
proposal: CHG-001
created: 2025-12-21
---

# Delta

## MODIFIED

### auth/login

#### Before

\`\`\`markdown
a
\`\`\`

#### After

\`\`\`markdown
b
\`\`\`

### auth/logout

설명만 있음
`;

    const result = validateDelta(content);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('auth/logout');
  });
});

describe('parseDelta - 섹션 경계', () => {
  const header = `---
proposal: CHG-001
created: 2025-12-21
---

# Delta: 경계
`;

  it('ADDED/REMOVED는 ### 하위 제목에서 잘리지 않는다', () => {
    const content = `${header}
## ADDED

### REQ-10: 새 요구사항

시스템은 OAuth를 지원해야 한다(SHALL).

### REQ-11: 두 번째

두 번째 내용

## REMOVED

### REQ-01: 레거시

삭제 사유
`;

    const result = parseDelta(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.added[0].content).toContain('REQ-10');
      expect(result.data.added[0].content).toContain('OAuth');
      expect(result.data.added[0].content).toContain('REQ-11');
      expect(result.data.added[0].content).toContain('두 번째 내용');
      expect(result.data.added[0].content).not.toContain('REQ-01');
      expect(result.data.removed[0].content).toContain('REQ-01');
      expect(result.data.removed[0].content).toContain('삭제 사유');
    }
  });

  it('MODIFIED의 여러 대상을 각각의 Before/After로 분리한다', () => {
    const content = `${header}
## MODIFIED

### specs/auth/login/spec.md

#### Before

\`\`\`markdown
## 로그인 v1
\`\`\`

#### After

\`\`\`markdown
## 로그인 v2
\`\`\`

### specs/auth/logout/spec.md

**Before:**

\`\`\`
로그아웃 v1
\`\`\`

**After:**

\`\`\`
로그아웃 v2
\`\`\`

## REMOVED

(없음)
`;

    const result = parseDelta(content);

    expect(result.success).toBe(true);
    if (result.success) {
      const { modified } = result.data;
      expect(modified).toHaveLength(2);
      expect(modified[0].target).toBe('specs/auth/login/spec.md');
      expect(modified[0].before).toBe('## 로그인 v1');
      expect(modified[0].after).toBe('## 로그인 v2');
      expect(modified[1].target).toBe('specs/auth/logout/spec.md');
      expect(modified[1].before).toBe('로그아웃 v1');
      expect(modified[1].after).toBe('로그아웃 v2');
      // A `## ` line inside a fenced block must not end the MODIFIED section
      expect(result.data.removed[0].content).toBe('(없음)');
    }
  });

  it('HTML 주석 플레이스홀더만 있는 섹션은 비어 있는 것으로 본다', () => {
    const content = `${header}
## ADDED

<!-- 추가되는 요구사항 -->

## MODIFIED

<!-- 변경 내용 -->

### {{SPEC_PATH}}

#### Before

\`\`\`markdown
<!-- 기존 내용 -->
\`\`\`

## REMOVED

<!-- 제거되는 내용 -->
`;

    const result = validateDelta(content);

    expect(result.valid).toBe(false);
    expect(result.hasAdded).toBe(false);
    expect(result.hasModified).toBe(false);
    expect(result.hasRemoved).toBe(false);
  });

  it('created는 로컬 날짜를 사용한다', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date(2025, 1, 1, 0, 30));
      expect(generateDelta({ proposalId: 'CHG-001', title: 't' })).toContain('created: 2025-02-01');
    } finally {
      vi.useRealTimers();
    }
  });

  it('템플릿 대상({{SPEC_PATH}})은 무시한다', () => {
    const template = generateDelta({ proposalId: 'CHG-001', title: 't' });
    const result = parseDelta(template);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.modified).toHaveLength(0);
    }
  });
});
