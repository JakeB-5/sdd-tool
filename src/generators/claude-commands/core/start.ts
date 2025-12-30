/**
 * /sdd.start 커맨드
 */
import type { ClaudeCommand } from '../types.js';

export const startCommand: ClaudeCommand = {
  name: 'sdd.start',
  content: `SDD 워크플로우를 시작합니다 (통합 진입점).

## 개요

이 커맨드는 SDD 프로젝트의 통합 진입점입니다.
현재 상태를 확인하고 적절한 워크플로우를 안내합니다.

## 지시사항

1. 먼저 프로젝트 구조를 분석하세요:
   - .sdd/ 디렉토리 존재 여부 확인
   - .git/ 디렉토리 존재 여부 확인
   - .git/hooks/ 디렉토리의 SDD 훅 설치 여부 확인
   - .github/workflows/ 디렉토리의 SDD 워크플로우 존재 여부 확인

2. 분석 결과에 따라 사용자에게 안내하세요:
   - SDD 미초기화: \`sdd init\` 실행 권장
   - Git Hooks 미설치: Git 워크플로우 설정 권장
   - CI/CD 미설정: GitHub Actions 설정 권장

3. 설정이 필요한 경우 사용자에게 **질문**하고 **승인**을 받은 후 실행하세요

## Git 워크플로우 설정 확인

다음 명령어로 프로젝트 상태를 확인할 수 있습니다:

\`\`\`bash
# 프로젝트 상태 확인
sdd status

# Git 워크플로우 설정
sdd git setup

# CI/CD 설정
sdd cicd setup github
\`\`\`

### 설정 제안 시나리오

1. **Git Hooks가 없는 경우**:
   "Git Hooks가 설치되지 않았습니다. 커밋/푸시 시 자동 스펙 검증을 활성화하시겠습니까?"
   → 승인 시: \`sdd git hooks install\` 실행

2. **커밋 템플릿이 없는 경우**:
   "커밋 메시지 템플릿을 설치하시겠습니까? 일관된 커밋 형식을 사용할 수 있습니다."
   → 승인 시: \`sdd git template install\` 실행

3. **GitHub Actions가 없는 경우**:
   "GitHub Actions CI/CD를 설정하시겠습니까? PR 시 자동으로 스펙을 검증합니다."
   → 승인 시: \`sdd cicd setup github\` 실행

## 사용 가능한 워크플로우

- **new-feature**: 새 기능 명세 작성
- **change-spec**: 기존 스펙 변경
- **validate**: 명세 검증
- **status**: 상태 확인
- **constitution**: Constitution 관리
- **git-setup**: Git 워크플로우 설정

## 명령어

\`\`\`bash
# 프로젝트 상태 및 워크플로우 메뉴
sdd start

# 상태만 확인
sdd start --status

# 특정 워크플로우 바로 시작
sdd start --workflow new-feature
sdd start --workflow change-spec
sdd start --workflow validate
\`\`\`

## 프로젝트 미초기화 시

프로젝트가 초기화되지 않은 경우:
1. \`sdd init\`으로 프로젝트를 초기화하세요 (Git/CI-CD 설정 포함)
2. \`/sdd.constitution\`으로 프로젝트 원칙을 정의하세요
3. \`/sdd.new\`로 첫 기능 명세를 작성하세요

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
