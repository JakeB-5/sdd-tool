/**
 * /sdd.migrate 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const migrateCommand: ClaudeCommand = {
  name: 'sdd.migrate',
  content: `---
description: 기존 프로젝트를 SDD로 마이그레이션합니다
allowed-tools: Bash, Read
argument-hint: [detect|openspec|speckit|docs] [--dry-run]
---

sdd migrate 명령어를 실행합니다.

\`\`\`bash
sdd migrate $ARGUMENTS
\`\`\`

## 서브커맨드

- \`detect\`: 기존 도구 감지
- \`openspec\`: OpenSpec에서 마이그레이션
- \`speckit\`: SpecKit에서 마이그레이션
- \`docs\`: 마크다운 문서 변환

## 옵션

- \`--dry-run\`: 미리보기
- \`--overwrite\`: 기존 스펙 덮어쓰기
- \`--source <path>\`: 소스 디렉토리

마이그레이션 결과를 확인하고 필요한 후속 작업을 안내해주세요.
`,
};
