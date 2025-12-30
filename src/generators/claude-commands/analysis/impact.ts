/**
 * /sdd.impact 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const impactCommand: ClaudeCommand = {
  name: 'sdd.impact',
  content: `---
description: SDD 스펙 변경의 영향도를 분석합니다
allowed-tools: Bash, Read
argument-hint: <specId> [--graph] [--code] [--json]
---

sdd impact 명령어를 실행합니다.

\`\`\`bash
sdd impact $ARGUMENTS
\`\`\`

## 옵션

- \`--graph\`: Mermaid 의존성 그래프 출력
- \`--code\`: 코드 영향도 분석
- \`--json\`: JSON 형식 출력

## 서브커맨드

- \`report\`: 전체 프로젝트 영향도 리포트
- \`change <id>\`: 변경 제안의 영향도
- \`simulate --remove <spec>\`: What-if 시뮬레이션

영향받는 스펙과 코드를 분석하고 변경 전략을 제안해주세요.
`,
};
