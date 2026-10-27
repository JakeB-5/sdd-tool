/**
 * /sdd.cicd 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const cicdCommand: ClaudeCommand = {
  name: 'sdd.cicd',
  content: `---
description: CI/CD 파이프라인을 설정합니다
allowed-tools: Bash, Read, Write
argument-hint: [setup [github|gitlab|all] | hooks [type] | check]
---

sdd cicd 명령어를 실행합니다.

\`\`\`bash
sdd cicd $ARGUMENTS
\`\`\`

## 서브커맨드

- \`setup [platform]\`: CI/CD 워크플로우 생성 (platform: github(기본), gitlab, all)
- \`hooks [type]\`: Git hooks 설정 (\`--install\`: husky 설치 포함)
- \`check\`: CI 검증 실행 (\`--strict\`, \`--fail-on-warning\`)

## 예시

\`\`\`bash
sdd cicd setup gitlab
sdd cicd setup all --strict
\`\`\`

생성된 CI/CD 설정을 확인하고 추가 설정이 필요하면 안내해주세요.
`,
};
