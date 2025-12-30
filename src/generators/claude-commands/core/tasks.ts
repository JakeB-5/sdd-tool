/**
 * /sdd.tasks 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const tasksCommand: ClaudeCommand = {
  name: 'sdd.tasks',
  content: `구현 계획을 실행 가능한 작업으로 분해합니다.

## 지시사항

1. 해당 기능의 \`plan.md\`를 읽고 구현 단계를 확인하세요
2. \`sdd new tasks <feature-id>\` 명령어로 작업 목록을 생성하세요
3. 각 작업에 우선순위와 상태를 지정하세요

## 작업 분해 규칙

- 각 작업은 2-4시간 내 완료 가능한 크기로 분해
- 작업 간 의존성을 명확히 표시
- 우선순위: HIGH(🔴), MEDIUM(🟡), LOW(🟢)
- 상태: 대기, 진행 중, 완료, 차단됨

## 작업 구조

\`\`\`markdown
### <feature>-task-001: [작업 제목]

- **상태:** 대기
- **우선순위:** 🔴 HIGH
- **의존성:** 없음

#### 설명
[작업 상세 설명]

#### 완료 조건
- [ ] 조건 1
- [ ] 조건 2
\`\`\`

완료 후 \`/sdd.implement\`로 구현을 시작하세요.
`,
};
