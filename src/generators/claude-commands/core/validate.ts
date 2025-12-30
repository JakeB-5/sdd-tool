/**
 * /sdd.validate 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const validateCommand: ClaudeCommand = {
  name: 'sdd.validate',
  content: `스펙 파일의 형식과 규칙을 검증합니다.

## 지시사항

\`sdd validate\` 명령어를 실행하여 모든 스펙을 검증하세요.

## 검증 항목

1. **RFC 2119 키워드**: SHALL, MUST, SHOULD, MAY 등 포함 여부
2. **GIVEN-WHEN-THEN**: 시나리오 형식 준수 여부
3. **메타데이터**: YAML frontmatter 필수 필드 확인
4. **구조**: 필수 섹션 존재 여부

## 사용법

\`\`\`bash
# 전체 스펙 검증
sdd validate

# 특정 파일 검증
sdd validate .sdd/specs/user-auth/spec.md

# 엄격 모드 (경고도 에러로 처리)
sdd validate --strict
\`\`\`

## 오류 해결

검증 실패 시 해당 파일을 열어 오류를 수정하세요.
각 오류 메시지에는 해결 방법이 포함되어 있습니다.

## 다음 단계

검증 결과에 따라:

- **모두 통과**: 커밋 후 PR 생성 또는 머지
- **오류 발생**: 오류 수정 후 \`sdd validate\` 재실행
- **경고만 발생**: 경고 검토 후 진행 여부 결정

검증 통과 후 권장 워크플로우:
1. \`git add .sdd/\` - 스펙 변경 스테이징
2. \`git commit -m "spec: <설명>"\` - 커밋
3. PR 생성 및 리뷰 요청
`,
};
