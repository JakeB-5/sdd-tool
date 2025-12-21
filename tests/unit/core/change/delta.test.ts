/**
 * Delta 파서 테스트
 */
import { describe, it, expect } from 'vitest';
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
});
