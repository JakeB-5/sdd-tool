/**
 * /sdd.report 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const reportCommand: ClaudeCommand = {
  name: 'sdd.report',
  content: `---
description: SDD 프로젝트 리포트를 생성합니다
allowed-tools: Bash, Read, Write
argument-hint: [--format html] [-o report.html]
---

sdd report 명령어를 실행합니다.

\`\`\`bash
sdd report $ARGUMENTS
\`\`\`

## 옵션

- \`--format <type>\`: 출력 형식 (html, markdown, json)
- \`-o, --output <path>\`: 파일로 저장
- \`--title <title>\`: 리포트 제목
- \`--no-quality\`: 품질 분석 제외
- \`--no-validation\`: 검증 결과 제외

리포트 내용을 요약하고 주요 지표를 설명해주세요.
`,
};
