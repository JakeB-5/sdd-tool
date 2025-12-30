/**
 * /sdd.watch 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const watchCommand: ClaudeCommand = {
  name: 'sdd.watch',
  content: `---
description: 스펙 파일 변경을 감시합니다
allowed-tools: Bash
argument-hint: [--validate] [--path .sdd/specs]
---

sdd watch 명령어를 실행합니다.

\`\`\`bash
sdd watch $ARGUMENTS
\`\`\`

## 옵션

- \`--path <dir>\`: 감시할 디렉토리
- \`--validate\`: 변경 시 자동 검증
- \`--quality\`: 변경 시 품질 검사

Ctrl+C로 종료합니다.
`,
};
