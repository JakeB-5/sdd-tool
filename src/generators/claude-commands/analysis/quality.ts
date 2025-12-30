/**
 * /sdd.quality 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const qualityCommand: ClaudeCommand = {
  name: 'sdd.quality',
  content: `---
description: SDD 스펙 품질을 분석합니다
allowed-tools: Bash, Read
argument-hint: [specId] [--all] [--json]
---

sdd quality 명령어를 실행합니다.

\`\`\`bash
sdd quality $ARGUMENTS
\`\`\`

## 옵션

- \`--all\`: 모든 스펙 분석
- \`--json\`: JSON 형식 출력
- \`--min-score <n>\`: 최소 점수 기준

## 등급 기준

| 등급 | 점수 | 설명 |
|------|------|------|
| A | 90-100 | 우수 |
| B | 80-89 | 양호 |
| C | 70-79 | 보통 |
| D | 60-69 | 미흡 |
| F | 0-59 | 부족 |

분석 결과를 바탕으로 품질 개선 방안을 제안해주세요.
`,
};
