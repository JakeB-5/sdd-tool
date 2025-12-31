/**
 * /sdd.start 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const startCommand: ClaudeCommand = {
  name: 'sdd.start',
  content: `SDD 워크플로우를 시작합니다 (통합 진입점).

## 핵심 원칙

**초기 설정이 워크플로우 제안보다 항상 우선합니다.**
- 초기 설정이 완료되지 않은 상태에서 워크플로우(reverse, new 등)를 제안하지 마세요.
- 반드시 초기 설정 Wizard를 먼저 진행하고, 완료 후에만 다음 워크플로우를 안내하세요.

---

## Step 1: 프로젝트 분석 (자동 실행)

다음 항목을 **자동으로 분석**하고 결과를 테이블로 보여주세요:

| 항목 | 확인 방법 |
|------|----------|
| SDD 초기화 | .sdd/ 디렉토리 존재 여부 |
| 스펙 파일 | .sdd/specs/**/*.md 개수 |
| 기존 코드 | src/, lib/, app/ 존재 여부 |
| Git 저장소 | .git/ 존재 여부 |
| Git Hooks | .git/hooks/pre-commit 존재 여부 |
| CI/CD | .github/workflows/sdd-*.yml 존재 여부 |

---

## Step 2: 초기 설정 Wizard (최우선)

**아래 조건 중 하나라도 해당하면 반드시 초기 설정 Wizard를 먼저 실행하세요:**

1. .sdd/ 디렉토리 없음 → SDD 초기화 필요
2. .git/hooks/pre-commit 없음 → Git Hooks 설치 필요
3. .github/workflows/sdd-*.yml 없음 → CI/CD 설정 필요

### Wizard 실행 방법

\`AskUserQuestion\` 도구를 사용하여 **multiSelect: true**로 질문:

\`\`\`
질문: "프로젝트 초기 설정이 필요합니다. 진행할 항목을 선택하세요."
옵션:
- SDD 초기화 (.sdd 디렉토리 생성)
- Git Hooks 설치 (커밋 시 자동 검증)
- GitHub Actions CI/CD 설정
\`\`\`

### 선택된 항목 실행

사용자가 선택한 항목을 **즉시 순차 실행**:

| 항목 | 실행 명령어 |
|------|------------|
| SDD 초기화 | \`sdd init --skip-git-setup\` |
| Git Hooks | \`sdd git hooks install\` |
| CI/CD | \`sdd cicd setup github\` |

각 실행 시:
- 시작: "🔄 [항목명] 설정 중..."
- 완료: "✅ [항목명] 완료"

---

## Step 3: 다음 워크플로우 안내 (초기 설정 완료 후에만)

**초기 설정이 모두 완료된 경우에만** 다음 워크플로우를 안내하세요:

| 프로젝트 상태 | 권장 워크플로우 |
|--------------|----------------|
| 기존 코드 있음 + 스펙 없음 (브라운필드) | \`/sdd.reverse\` |
| 기존 코드 없음 (그린필드) | \`/sdd.new\` |
| 스펙 있음 | \`/sdd.status\` 또는 \`/sdd.implement\` |

---

## 브라운필드 프로젝트 (기존 코드베이스)

기존 코드가 있는 프로젝트에서 SDD를 도입할 때:

1. **스펙 역추출**: \`/sdd.reverse scan\`으로 프로젝트 구조 분석
2. **스펙 추출**: \`/sdd.reverse extract\`로 코드에서 스펙 초안 생성
3. **리뷰 및 확정**: \`/sdd.reverse review\` → \`/sdd.reverse finalize\`
4. 이후 새 기능은 \`/sdd.new\`로 작성

**브라운필드 판별 기준**:
- src/, lib/, app/ 등 소스 디렉토리가 존재
- .sdd/specs/ 에 스펙 파일이 없거나 적음
- package.json, requirements.txt 등 프로젝트 설정 파일 존재

## Git 워크플로우 상세

### 설치되는 Git Hooks

| 훅 | 시점 | 기능 |
|----|------|------|
| pre-commit | 커밋 전 | 변경된 스펙 검증 |
| commit-msg | 커밋 메시지 작성 후 | 메시지 형식 검증 |
| pre-push | 푸시 전 | 전체 스펙 검증 |

### 생성되는 GitHub Actions

| 워크플로우 | 기능 |
|-----------|------|
| sdd-validate.yml | PR/푸시 시 스펙 자동 검증 |
| sdd-labeler.yml | PR에 도메인별 라벨 자동 추가 |
`,
};
