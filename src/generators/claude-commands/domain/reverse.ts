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

## 중요 지시사항

**반드시 CLI 명령어를 사용하세요!**
- 스펙 파일을 직접 작성하지 마세요
- \`sdd reverse <subcommand>\` CLI를 실행하세요
- 초안은 \`.sdd/.reverse-drafts/\`에 저장됩니다 (직접 건드리지 마세요)
- \`.sdd/specs/\`에는 finalize 후에만 파일이 생성됩니다

## 하위 명령어

\`\`\`
/sdd.reverse scan [path]         # 프로젝트 구조 스캔 (CLI 실행)
/sdd.reverse extract [path]      # 코드에서 스펙 추출 (CLI 실행)
/sdd.reverse review [spec-id]    # 추출된 스펙 리뷰 (CLI 실행)
/sdd.reverse finalize [spec-id]  # 승인된 스펙 확정 (CLI 실행)
\`\`\`

## 워크플로우

\`\`\`
scan (+ 도메인 자동 생성) → extract → review → finalize
\`\`\`

**각 단계는 순차적으로 진행합니다. 이전 단계를 건너뛰지 마세요!**

### 1. Scan (스캔 + 도메인 생성)

**Claude 지시:** \`sdd reverse scan\` CLI 명령어를 실행하세요.

\`\`\`bash
sdd reverse scan                    # 스캔 + 도메인 자동 생성
sdd reverse scan src/               # 특정 경로 스캔
sdd reverse scan --no-create-domains  # 도메인 생성 없이 스캔만
\`\`\`

**수행 작업:**
- 프로젝트 구조 분석 (src/, lib/, packages/ 등)
- 언어 분포 확인
- 도메인 자동 생성 (.sdd/domains.yml에 추가)
- 스캔 메타데이터 저장 (.sdd/.reverse-meta.json)

**완료 후 안내:** "스캔이 완료되었습니다. \`/sdd.reverse extract\`로 코드에서 스펙을 추출하세요."

### 2. Extract (추출)

**Claude 지시:** \`sdd reverse extract\` CLI 명령어를 실행하세요.
**주의:** 스펙 파일을 직접 작성하지 마세요! CLI가 \`.sdd/.reverse-drafts/\`에 초안을 생성합니다.

\`\`\`bash
sdd reverse extract                 # 전체 추출
sdd reverse extract --domain auth   # 특정 도메인만
sdd reverse extract --depth deep    # 깊은 분석
\`\`\`

**수행 작업:**
- 코드 심볼 분석
- 스펙 초안 생성 → \`.sdd/.reverse-drafts/<domain>/<name>.json\`
- 상태: \`pending\` (아직 승인되지 않음)

**완료 후 안내:** "추출이 완료되었습니다. \`/sdd.reverse review\`로 스펙을 리뷰하세요."

### 3. Review (리뷰)

**Claude 지시:** \`sdd reverse review\` CLI 명령어를 실행하세요.

\`\`\`bash
sdd reverse review                      # 리뷰 대기 목록 확인
sdd reverse review auth/login           # 특정 스펙 상세 보기
sdd reverse review auth/login --approve # 스펙 승인
sdd reverse review auth/login --reject  # 스펙 거부
\`\`\`

**수행 작업:**
- 추출된 초안 검토
- \`--approve\`로 승인, \`--reject\`로 거부

**완료 후 안내:** "리뷰가 완료되었습니다. \`/sdd.reverse finalize\`로 승인된 스펙을 확정하세요."

### 4. Finalize (확정)

**Claude 지시:** \`sdd reverse finalize\` CLI 명령어를 실행하세요.
**주의:** finalize 후에만 \`.sdd/specs/\`에 스펙이 생성됩니다!

\`\`\`bash
sdd reverse finalize --all        # 모든 승인 스펙 확정
sdd reverse finalize auth/login   # 특정 스펙 확정
sdd reverse finalize -d auth      # 특정 도메인 확정
\`\`\`

**수행 작업:**
- \`.sdd/.reverse-drafts/\`에서 승인된 스펙 읽기
- \`.sdd/specs/<feature-id>/spec.md\` 생성
- 초안 파일 삭제

**완료 후 안내:** "스펙 확정이 완료되었습니다. \`/sdd.validate\`로 스펙을 검증하거나 \`/sdd.new\`로 새 기능을 추가할 수 있습니다."

## 출력 파일

**주의:** CLI가 생성하는 파일 형식을 정확히 따르세요!

| 파일 | 설명 | 생성 시점 |
|------|------|----------|
| \`.sdd/domains.yml\` | 도메인 설정 (YAML 형식, JSON 아님!) | scan |
| \`.sdd/domains/<domain>/domain.md\` | 도메인별 문서 | scan |
| \`.sdd/.reverse-meta.json\` | 스캔/추출 메타데이터 | scan, extract |
| \`.sdd/.reverse-drafts/\` | 스펙 초안 디렉토리 | extract |
| \`.sdd/specs/<feature-id>/spec.md\` | 확정된 스펙 | finalize |

**파일을 직접 생성하지 마세요!** 모든 파일은 CLI 명령어로 생성됩니다.

## 다음 단계

- 확정 후: \`/sdd.validate\`로 스펙 검증
- 도메인 수정: \`/sdd.domain\`으로 도메인 상세 조정 (이름 변경, 의존성 추가 등)
- 새 기능: \`/sdd.new\`로 새 스펙 작성
`,
};
