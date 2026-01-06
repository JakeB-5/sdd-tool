/**
 * /sdd.change 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const changeCommand: ClaudeCommand = {
  name: 'sdd.change',
  content: `기존 스펙에 대한 변경을 제안합니다.

## 지시사항

1. 변경이 필요한 스펙을 확인하세요
2. \`.sdd/changes/\` 디렉토리에 변경 제안서를 작성하세요
3. 변경 유형(ADDED, MODIFIED, REMOVED)을 명시하세요

## 변경 제안서 구조

\`\`\`markdown
---
id: CHG-001
status: draft
created: YYYY-MM-DD
---

# 변경 제안: [제목]

## 배경
왜 이 변경이 필요한가?

## 영향 범위
### 영향받는 스펙
- \`.sdd/specs/auth/user-auth/spec.md\`

### 변경 유형
- [x] 수정 (MODIFIED)

## 변경 내용

### MODIFIED

#### Before
\`\`\`markdown
기존 내용
\`\`\`

#### After
\`\`\`markdown
변경된 내용
\`\`\`
\`\`\`

검토 후 승인되면 스펙에 반영하세요.
`,
};
