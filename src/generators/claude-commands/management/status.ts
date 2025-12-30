/**
 * /sdd.status 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const statusCommand: ClaudeCommand = {
  name: 'sdd.status',
  content: `현재 SDD 프로젝트 상태를 확인합니다.

## 지시사항

\`sdd status\` 명령어를 실행하여 프로젝트 상태를 확인하세요.

## 확인 항목

- 프로젝트 구조 (constitution.md, AGENTS.md 존재 여부)
- 기능 목록 및 상태
- 현재 Git 브랜치
- 다음 단계 제안

## 추가 명령어

\`\`\`bash
# 프로젝트 요약
sdd list

# 기능 목록
sdd list features

# 스펙 파일 목록
sdd list specs

# JSON 형식 출력
sdd status --json
\`\`\`
`,
};
