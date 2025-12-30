/**
 * /sdd.cicd 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const cicdCommand: ClaudeCommand = {
  name: 'sdd.cicd',
  content: `---
description: CI/CD 파이프라인을 설정합니다
allowed-tools: Bash, Read, Write
argument-hint: [setup|hooks|check] [--platform github]
---

sdd cicd 명령어를 실행합니다.

\`\`\`bash
sdd cicd $ARGUMENTS
\`\`\`

## 서브커맨드

- \`setup\`: CI/CD 워크플로우 생성
- \`hooks\`: Git hooks 설정
- \`check\`: CI 검증 실행

## 옵션

- \`--platform <type>\`: github, gitlab, all

생성된 CI/CD 설정을 확인하고 추가 설정이 필요하면 안내해주세요.
`,
};
