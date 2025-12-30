/**
 * /sdd.domain 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const domainCommand: ClaudeCommand = {
  name: 'sdd.domain',
  content: `도메인을 관리합니다.

## 개요

SDD 프로젝트의 도메인을 생성, 조회, 수정, 삭제합니다.
대규모 프로젝트에서 스펙을 논리적으로 그룹화할 때 사용합니다.

## 하위 명령어

\`\`\`
/sdd.domain create <name>          # 도메인 생성
/sdd.domain list                   # 도메인 목록
/sdd.domain show <name>            # 상세 정보
/sdd.domain link <domain> <spec>   # 스펙 연결
/sdd.domain graph                  # 의존성 그래프
\`\`\`

### create

새 도메인을 생성합니다.

\`\`\`bash
sdd domain create auth
sdd domain create payment --description "결제 처리"
\`\`\`

### list

모든 도메인을 조회합니다.

\`\`\`bash
sdd domain list
sdd domain list --tree      # 트리 형태
\`\`\`

### show

특정 도메인의 상세 정보를 표시합니다.

\`\`\`bash
sdd domain show auth
\`\`\`

### link / unlink

스펙을 도메인에 연결하거나 해제합니다.

\`\`\`bash
sdd domain link auth user-login
sdd domain unlink auth user-login
\`\`\`

### depends

도메인 간 의존성을 설정합니다.

\`\`\`bash
sdd domain depends payment --on auth
\`\`\`

### graph

도메인 의존성 그래프를 시각화합니다.

\`\`\`bash
sdd domain graph              # Mermaid 형식
sdd domain graph --format dot # DOT 형식
\`\`\`

### validate

도메인 구조를 검증합니다.

\`\`\`bash
sdd domain validate
\`\`\`

검증 항목:
- 순환 의존성 감지
- 고아 스펙 확인
- 스키마 유효성

## 다음 단계

- 도메인 생성 후: \`/sdd.context set <domain>\`으로 작업 컨텍스트 설정
- 스펙 연결 후: \`/sdd.domain graph\`로 구조 확인
`,
};
