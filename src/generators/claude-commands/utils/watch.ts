/**
 * /sdd.watch 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const watchCommand: ClaudeCommand = {
  name: 'sdd.watch',
  content: `---
description: 스펙 파일 변경을 감시합니다
allowed-tools: Bash
argument-hint: [--no-validate] [--impact] [--quiet] [--debounce <ms>]
---

sdd watch 명령어를 실행합니다. (.sdd/specs 감시)

\`\`\`bash
sdd watch $ARGUMENTS
\`\`\`

## 옵션

- \`--no-validate\`: 변경 시 자동 검증 비활성화
- \`--impact\`: 영향도 분석 포함
- \`-q, --quiet\`: 성공 시 출력 생략
- \`--debounce <ms>\`: 디바운스 시간 (기본 500ms)

Ctrl+C로 종료합니다.
`,
};
