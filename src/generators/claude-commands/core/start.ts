/**
 * /sdd.start 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const startCommand: ClaudeCommand = {
  name: 'sdd.start',
  content: `SDD 워크플로우를 시작합니다 (통합 진입점).

## 개요

이 커맨드는 SDD 프로젝트의 통합 진입점입니다.
현재 상태를 확인하고 **wizard 형태**로 필요한 설정을 한 번에 진행합니다.

## 지시사항

### Phase 1: 프로젝트 분석 (자동)

다음 항목을 **자동으로 분석**하고 결과를 요약 테이블로 보여주세요:

| 항목 | 확인 방법 | 결과 |
|------|----------|------|
| SDD 초기화 | .sdd/ 디렉토리 존재 | ✓/✗ |
| 스펙 파일 | .sdd/specs/*.md 존재 | 0개/N개 |
| 기존 코드 | src/, lib/, app/ 존재 | ✓/✗ (브라운필드) |
| Git 저장소 | .git/ 존재 | ✓/✗ |
| Git Hooks | .git/hooks/pre-commit 등 | ✓/✗ |
| CI/CD | .github/workflows/*.yml | ✓/✗ |

### Phase 2: Wizard - 필요한 설정 일괄 선택 요청

분석 결과 **필요한 설정이 있으면**, \`AskUserQuestion\` 도구를 사용하여 **한 번에 선택**받으세요.

**중요**: multiSelect: true를 사용하여 사용자가 원하는 항목만 선택할 수 있게 하세요.

예시 질문:
\`\`\`
"다음 중 진행할 작업을 선택하세요 (복수 선택 가능)"
옵션:
- SDD 초기화 (sdd init)
- Git Hooks 설치
- GitHub Actions CI/CD 설정
- Constitution 작성 (/sdd.constitution)
\`\`\`

### Phase 3: 선택된 항목 자동 실행

사용자가 선택한 항목들을 **순차적으로 실행**하고 진행 상황을 보고하세요:

1. 각 작업 시작 전: "🔄 [작업명] 진행 중..."
2. 작업 완료 후: "✅ [작업명] 완료"
3. 모든 작업 완료 후: 다음 단계 안내

### Phase 4: 다음 워크플로우 안내

설정 완료 후 프로젝트 상태에 따라 안내:
- **그린필드** (기존 코드 없음): \`/sdd.new\`로 첫 기능 명세 작성 권장
- **브라운필드** (기존 코드 있음): \`/sdd.reverse\`로 스펙 역추출 권장
- **스펙 있음**: \`/sdd.status\`로 현황 확인 또는 \`/sdd.implement\`로 구현 진행

## 실행할 명령어 매핑

| 설정 항목 | 실행 명령어 |
|----------|------------|
| SDD 초기화 | \`sdd init --skip-git-setup\` |
| Git Hooks | \`sdd git hooks install\` |
| 커밋 템플릿 | \`sdd git template install\` |
| GitHub Actions | \`sdd cicd setup github\` |

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
