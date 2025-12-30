/**
 * /sdd.new 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const newCommand: ClaudeCommand = {
  name: 'sdd.new',
  content: `새로운 기능 명세를 작성합니다.

## 지시사항

1. 사용자에게 기능명과 간단한 설명을 요청하세요
2. \`sdd new <feature-id> --all\` 명령어를 실행하여 기본 구조를 생성하세요
3. 생성된 \`.sdd/specs/<feature-id>/spec.md\` 파일을 열어 내용을 작성하세요

## 명세 작성 규칙

- RFC 2119 키워드 사용: SHALL, MUST, SHOULD, MAY, SHALL NOT
- GIVEN-WHEN-THEN 형식의 시나리오 포함 필수
- 각 요구사항에 고유 ID 부여 (REQ-001, REQ-002, ...)

## 예시

\`\`\`markdown
### REQ-01: 사용자 인증

시스템은 이메일과 비밀번호로 사용자를 인증해야 한다(SHALL).

### Scenario: 올바른 자격 증명으로 로그인

- **GIVEN** 등록된 사용자가 존재할 때
- **WHEN** 올바른 이메일과 비밀번호로 로그인을 시도하면
- **THEN** 액세스 토큰이 발급되어야 한다
\`\`\`

완료 후 \`sdd validate\`로 명세를 검증하세요.
`,
};
