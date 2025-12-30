/**
 * /sdd.search 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const searchCommand: ClaudeCommand = {
  name: 'sdd.search',
  content: `---
description: SDD 스펙을 검색합니다
allowed-tools: Bash, Read
argument-hint: [query] [--status draft] [--phase phase1]
---

sdd search 명령어를 실행합니다.

\`\`\`bash
sdd search $ARGUMENTS
\`\`\`

## 옵션

- \`--status <status>\`: 상태 필터 (draft, review, approved)
- \`--phase <phase>\`: Phase 필터
- \`--author <name>\`: 작성자 필터
- \`--tags <tags>\`: 태그 필터 (콤마 구분)
- \`--depends-on <spec>\`: 의존성 필터
- \`--limit <n>\`: 결과 제한
- \`--sort-by <field>\`: 정렬 기준 (relevance, created, updated, title, status)
- \`-r, --regex\`: 정규식 검색
- \`-c, --case-sensitive\`: 대소문자 구분
- \`--json\`: JSON 출력

검색 결과를 분석하고 관련 스펙 정보를 요약해주세요.
`,
};
