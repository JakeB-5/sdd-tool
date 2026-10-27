# /sdd-start

SDD 워크플로우의 진입점입니다. 프로젝트 설정을 점검하고, 설정 마법사를 실행한 뒤, 다음 스킬을 추천합니다.

## 사용법

```
/sdd-start
```

Codex에서는 `$sdd-start`로 호출합니다. 인수는 없습니다.

## 동작

초기 설정이 항상 먼저입니다. 설정이 끝나기 전에는 어떤 워크플로우(역추출, 새 스펙 등)도 제안하지 않습니다.

### 1. 프로젝트 분석

스킬이 프로젝트를 점검해 결과를 표로 보여줍니다:

| 항목 | 확인 방법 |
|------|-----------|
| SDD 초기화 | `.sdd/` 디렉토리 존재 |
| 스펙 파일 | `.sdd/specs/**/*.md` 파일 수 |
| 기존 코드 | `src/`, `lib/`, `app/` 존재 |
| Git 저장소 | `.git/` 존재 |
| Git 훅 | `.git/hooks/pre-commit` 존재 |
| CI/CD | `.github/workflows/sdd-*.yml` 존재 |

### 2. 설정 마법사

`.sdd/`, pre-commit 훅, CI 워크플로우 중 없는 것이 있으면 어떤 항목을 설정할지 묻고(복수 선택 가능), 선택한 항목을 바로 실행합니다:

| 항목 | 명령어 |
|------|--------|
| SDD 초기화 | `sdd init --skip-git-setup` |
| Git 훅 | `sdd git hooks install` |
| CI/CD | `sdd cicd setup github` |

### 3. 워크플로우 안내

설정이 모두 끝난 뒤에만 다음 단계를 추천합니다:

| 프로젝트 상태 | 추천 스킬 |
|---------------|-----------|
| 기존 코드 있음, 스펙 없음 (브라운필드) | `/sdd-reverse` |
| 기존 코드 없음 (그린필드) | `/sdd-spec` |
| 스펙이 이미 있음 | `/sdd-status` 또는 `/sdd-implement` |

브라운필드는 소스 디렉토리(`src/`, `lib/`, `app/`) 존재, `.sdd/specs/`의 스펙이 거의 없음, `package.json` 같은 프로젝트 설정 파일 존재로 판단합니다. 이 경우 `/sdd-reverse`가 코드를 스캔해 스펙 초안을 작성하고, 사용자가 승인·확정합니다. 이후 새 기능은 `/sdd-spec`을 사용합니다.

## 설치되는 Git 훅

| 훅 | 시점 | 기능 |
|----|------|------|
| pre-commit | 커밋 전 | 변경된 스펙 검증 |
| commit-msg | 커밋 메시지 작성 후 | `<type>(<scope>): <message>` 형식 요구. type은 스펙 타입(`spec`, `plan`, `tasks`, `constitution`, ...) 또는 Conventional Commits 타입(`feat`, `fix`, ...) |
| pre-push | 푸시 전 | 전체 스펙 검증 |

## 생성되는 GitHub Actions

| 워크플로우 | 기능 |
|------------|------|
| `sdd-validate.yml` | PR / 푸시 시 스펙 자동 검증 |
| `sdd-labeler.yml` | PR에 도메인 라벨 자동 추가 |

## 관련 명령어

- [`sdd init`](/ko/cli/init) - 프로젝트 초기화
- [`sdd git`](/ko/cli/git) - Git 훅
- [`sdd cicd`](/ko/cli/cicd) - CI/CD 워크플로우
- [`/sdd-spec`](/ko/commands/sdd-spec) - 스펙 작성
- [`/sdd-reverse`](/ko/commands/sdd-reverse) - 기존 코드에서 스펙 초안 작성
