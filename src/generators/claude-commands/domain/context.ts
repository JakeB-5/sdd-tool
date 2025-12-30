/**
 * /sdd.context 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const contextCommand: ClaudeCommand = {
  name: 'sdd.context',
  content: `작업 컨텍스트를 관리합니다.

## 개요

현재 작업 중인 도메인 범위를 설정합니다.
대규모 프로젝트에서 관련 스펙만 집중하여 작업할 때 사용합니다.

## 하위 명령어

\`\`\`
/sdd.context set <domain...>  # 컨텍스트 설정
/sdd.context show             # 현재 컨텍스트
/sdd.context clear            # 컨텍스트 해제
/sdd.context specs            # 컨텍스트 내 스펙 목록
/sdd.context export           # 프롬프트 내보내기
\`\`\`

### set

작업 컨텍스트를 설정합니다.

\`\`\`bash
sdd context set auth
sdd context set auth payment order
sdd context set auth --include-deps  # 의존 도메인 포함
\`\`\`

### show

현재 설정된 컨텍스트를 표시합니다.

\`\`\`bash
sdd context show
\`\`\`

### add / remove

컨텍스트에 도메인을 추가하거나 제거합니다.

\`\`\`bash
sdd context add order
sdd context remove payment
\`\`\`

### clear

컨텍스트를 해제합니다.

\`\`\`bash
sdd context clear
\`\`\`

### specs

컨텍스트 내 스펙 목록을 표시합니다.

\`\`\`bash
sdd context specs
\`\`\`

### export

컨텍스트 기반 프롬프트를 내보냅니다.

\`\`\`bash
sdd context export
sdd context export --format markdown
\`\`\`

## 컨텍스트 효과

컨텍스트가 설정되면:

1. **스펙 생성**: \`/sdd.new\`에서 도메인 자동 감지
2. **검증**: \`/sdd.validate\`에서 해당 도메인만 검증
3. **목록**: \`/sdd.list\`에서 컨텍스트 스펙만 표시
4. **구현**: 구현 시 관련 스펙 참조

## 다음 단계

- 컨텍스트 설정 후: \`/sdd.new\`로 스펙 작성
- 작업 완료 후: \`/sdd.context clear\`로 해제
`,
};
