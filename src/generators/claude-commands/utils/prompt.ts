/**
 * /sdd.prompt 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const promptCommand: ClaudeCommand = {
  name: 'sdd.prompt',
  content: `---
description: SDD 작업용 AI 프롬프트를 출력합니다
allowed-tools: Bash, Read
argument-hint: [new|plan|tasks|change|apply|archive|impact|validate] [--list]
---

sdd prompt 명령어를 실행합니다.

\`\`\`bash
sdd prompt $ARGUMENTS
\`\`\`

## 사용 가능한 프롬프트

- \`new\`: 신규 기능 명세 작성
- \`plan\`: 구현 계획 작성
- \`tasks\`: 작업 분해
- \`change\`: 변경 제안 작성
- \`apply\`: 변경 적용
- \`archive\`: 변경 아카이브
- \`impact\`: 영향도 분석
- \`validate\`: 스펙 검증

## 옵션

- \`--list\`: 사용 가능한 프롬프트 목록

프롬프트 내용을 출력하고 사용 방법을 안내해주세요.
`,
};
