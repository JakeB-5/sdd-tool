/**
 * /sdd.new 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const newCommand: ClaudeCommand = {
  name: 'sdd.new',
  content: `새로운 기능 명세를 작성합니다.

## 지시사항

1. 사용자에게 **도메인명**, 기능명, 간단한 설명을 요청하세요
2. \`sdd new <domain>/<feature-id> --all\` 명령어를 실행하여 기본 구조를 생성하세요
   - 도메인 미지정 시 \`common\` 폴더에 생성됩니다
3. 생성된 \`.sdd/specs/<domain>/<feature-id>/spec.md\` 파일을 열어 내용을 작성하세요

## 디렉토리 구조

\`\`\`
.sdd/specs/
├── auth/                    # 인증 도메인
│   ├── login/
│   │   ├── spec.md
│   │   ├── plan.md
│   │   └── tasks.md
│   └── signup/
├── payment/                 # 결제 도메인
│   └── checkout/
└── common/                  # 도메인 미지정 시 기본 위치
    └── settings/
\`\`\`

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
