/**
 * /sdd.spec 커맨드 - 통합 진입점
 */
import type { ClaudeCommand } from '../types.js';

export const specCommand: ClaudeCommand = {
  name: 'sdd.spec',
  content: `기능 명세를 작성하거나 수정합니다. (통합 진입점)

## 개요

\`/sdd.spec\`은 새 기능 작성(\`/sdd.new\`)과 기존 기능 수정(\`/sdd.change\`)을 
자동으로 판단하여 적절한 워크플로우로 안내합니다.

## 지시사항

1. 사용자에게 **도메인명**과 **기능명**을 요청하세요
2. \`.sdd/specs/<domain>/<feature-id>/spec.md\` 존재 여부를 확인하세요
3. **자동 분기:**

### 스펙이 없으면 (새 기능) → /sdd.new 워크플로우

\`\`\`bash
sdd new <domain>/<feature-id> --all
\`\`\`

- \`.sdd/specs/<domain>/<feature-id>/\` 디렉토리 생성
- \`spec.md\`, \`plan.md\`, \`tasks.md\` 생성
- RFC 2119 키워드와 GIVEN-WHEN-THEN 형식으로 명세 작성

### 스펙이 있으면 (기존 수정) → 변경 규모에 따라 분기

**작은 수정** (오타, 문구 수정, 요구사항 1-2개 추가):
- 직접 \`spec.md\` 파일을 수정
- \`sdd validate\`로 검증

**큰 변경** (요구사항 다수 변경, 구조 변경, 삭제):
- \`.sdd/changes/CHG-xxx.md\` 변경 제안서 작성
- 검토 → 승인 → 반영 워크플로우

## 변경 규모 판단 기준

| 규모 | 예시 | 권장 방식 |
|------|------|----------|
| 작음 | 오타 수정, 문구 개선 | 직접 수정 |
| 중간 | 요구사항 1-2개 추가 | 직접 수정 |
| 큼 | 요구사항 3개 이상 변경 | 변경 제안서 |
| 큼 | 기존 요구사항 삭제 | 변경 제안서 |
| 큼 | 시나리오 구조 변경 | 변경 제안서 |

## 예시 워크플로우

\`\`\`
사용자: "로그인 기능 작성해줘"

AI: .sdd/specs/ 확인... 
    → auth/login 없음
    → "새 기능입니다. 스펙을 생성합니다."
    → sdd new auth/login --all 실행
    → spec.md 작성 안내
\`\`\`

\`\`\`
사용자: "로그인에 소셜 로그인 추가해줘"

AI: .sdd/specs/ 확인...
    → auth/login/spec.md 존재
    → "기존 스펙이 있습니다. 변경 규모를 확인합니다."
    → 요구사항 1개 추가 → "작은 변경이므로 직접 수정합니다."
    → spec.md에 REQ-xx 추가
\`\`\`

## 다음 단계

- 새 스펙 작성 후: \`/sdd.plan\` → \`/sdd.tasks\` → \`/sdd.implement\`
- 스펙 수정 후: \`sdd validate\` → 커밋
`,
};
