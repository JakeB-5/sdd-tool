/**
 * /sdd.reverse 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const reverseCommand: ClaudeCommand = {
  name: 'sdd.reverse',
  content: `레거시 코드베이스에서 SDD 스펙을 역추출합니다.

## 개요

기존 코드를 분석하여 SDD 스펙 초안을 자동 생성합니다.
리뷰와 승인 과정을 통해 정식 스펙으로 확정합니다.

## 하위 명령어

\`\`\`
/sdd.reverse scan [path]         # 프로젝트 구조 스캔
/sdd.reverse extract [path]      # 코드에서 스펙 추출
/sdd.reverse review [spec-id]    # 추출된 스펙 리뷰
/sdd.reverse finalize [spec-id]  # 승인된 스펙 확정
\`\`\`

## 워크플로우

\`\`\`
scan → extract → review → finalize
\`\`\`

### 1. Scan (스캔)

프로젝트를 분석하여 디렉토리 구조, 언어 분포, 도메인을 추정합니다.

\`\`\`bash
sdd reverse scan
sdd reverse scan src/
\`\`\`

### 2. Extract (추출)

스캔 결과를 기반으로 코드에서 스펙 초안을 추출합니다.

\`\`\`bash
sdd reverse extract
sdd reverse extract --domain auth
sdd reverse extract --depth deep
\`\`\`

**옵션:**
- \`--domain <name>\`: 특정 도메인만 추출
- \`--depth <level>\`: 분석 깊이 (shallow, medium, deep)
- \`--min-confidence <n>\`: 최소 신뢰도 필터

### 3. Review (리뷰)

추출된 스펙 초안을 리뷰하고 승인/거부합니다.

\`\`\`bash
sdd reverse review              # 리뷰 대기 목록
sdd reverse review auth/login   # 특정 스펙 상세
\`\`\`

### 4. Finalize (확정)

승인된 스펙을 정식 SDD 스펙으로 변환합니다.

\`\`\`bash
sdd reverse finalize --all      # 모든 승인 스펙 확정
sdd reverse finalize auth/login # 특정 스펙 확정
\`\`\`

## 출력 파일

| 파일 | 설명 |
|------|------|
| \`.sdd/.reverse-meta.json\` | 스캔 결과 메타데이터 |
| \`.sdd/.reverse-drafts/\` | 스펙 초안 디렉토리 |
| \`.sdd/specs/\` | 확정된 스펙 디렉토리 |

## 다음 단계

- 확정 후: \`/sdd.validate\`로 스펙 검증
- 도메인 정리: \`/sdd.domain\`으로 도메인 구조화
`,
};
