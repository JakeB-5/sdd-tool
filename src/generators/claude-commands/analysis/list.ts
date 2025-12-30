/**
 * /sdd.list 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const listCommand: ClaudeCommand = {
  name: 'sdd.list',
  content: `---
description: SDD 항목 목록을 조회합니다
allowed-tools: Bash, Read
argument-hint: [features|changes|specs|templates] [--status draft]
---

sdd list 명령어를 실행합니다.

\`\`\`bash
sdd list $ARGUMENTS
\`\`\`

## 서브커맨드

- (없음): 프로젝트 요약
- \`features\` (f): 기능 목록
- \`changes\` (c): 변경 목록
- \`specs\` (s): 스펙 파일 목록
- \`templates\` (t): 템플릿 목록

## 옵션

- \`--status <status>\`: 상태별 필터 (features)
- \`--pending\`: 대기 중만 (changes)
- \`--archived\`: 아카이브만 (changes)

목록을 분석하고 요약해주세요.
`,
};
