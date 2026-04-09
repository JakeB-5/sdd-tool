# sdd init

프로젝트를 SDD Tool로 초기화합니다.

## 사용법

```bash
sdd init [options]
```

## 옵션

| 옵션 | 설명 |
|------|------|
| `-f, --force` | 기존 설정 덮어쓰기 |
| `--skip-git-setup` | Git/CI-CD 설정 건너뛰기 |
| `--auto-approve` | 모든 설정을 자동 승인 |
| `--no-skills` | `.claude/skills/` 생성 건너뛰기 (`dev-*` 및 `sdd-*` 모두) |
| `--no-commands` | `.claude/commands/` 슬래시 커맨드 생성 건너뛰기 |

## 생성되는 파일

```
your-project/
├── .sdd/
│   ├── constitution.md     # 프로젝트 헌법 템플릿
│   ├── AGENTS.md           # AI 워크플로우 가이드
│   ├── specs/              # 기능 명세 디렉토리
│   ├── changes/            # 변경 제안 디렉토리
│   ├── archive/            # 완료된 변경 아카이브
│   └── templates/          # 스펙 템플릿
│
└── .claude/
    ├── commands/           # 슬래시 커맨드 — 한국어, 점 표기법
    │   ├── sdd.start.md
    │   ├── sdd.spec.md
    │   ├── sdd.plan.md
    │   └── ...
    └── skills/             # 스킬 2.0 — 영어, 케밥 케이스 (v1.6.0)
        ├── dev-implement/
        │   └── SKILL.md
        ├── dev-test/
        │   └── SKILL.md
        ├── sdd-start/
        │   └── SKILL.md
        ├── sdd-spec/
        │   └── SKILL.md
        └── ...             # sdd-* 스킬 32개
```

## 스킬 2.0

v1.6.0부터 `sdd init`은 기존 슬래시 커맨드와 함께 `.claude/skills/sdd-*/SKILL.md`에 영어 스킬 2.0 정의 32개를 생성합니다.

각 `sdd.foo` 슬래시 커맨드는 대응하는 `sdd-foo` 스킬을 가집니다. 스킬은 영어로 작성되며 스킬 2.0 프론트매터를 포함합니다:

- **`context: fork`** — 분석/도메인 스킬 7개가 포크된 컨텍스트에서 실행됨 (`sdd-analyze`, `sdd-impact`, `sdd-sync`, `sdd-search`, `sdd-report`, `sdd-reverse`, `sdd-research`)
- **`context: manual-invoke-only`** — `sdd-watch` (장기 실행, 자동 트리거 안 됨)
- **`disable-model-invocation: true`** — CLI 명령어 하나만 실행하는 유틸리티 스킬 5개 (`sdd-guide`, `sdd-chat`, `sdd-cicd`, `sdd-watch`, `sdd-migrate`)
- **`allowed-tools`** — 스킬별 최소 권한 glob 패턴 (예: `Bash(sdd validate*)`)

스킬 생성을 건너뛰려면:

```bash
sdd init --no-skills        # .claude/skills/ 전체 건너뛰기
sdd init --no-commands      # .claude/commands/ 전체 건너뛰기
```

두 플래그 모두 backward-compatible입니다. 생략 시 기본값으로 모두 생성됩니다.

## Git 워크플로우 설정

초기화 완료 후, 프로젝트 구조를 분석하고 Git 워크플로우 설정을 제안합니다:

1. **Git Hooks 설치**: 커밋/푸시 시 자동 스펙 검증
2. **커밋 템플릿 설치**: 일관된 커밋 메시지 형식
3. **GitHub Actions 설정**: PR 시 자동 검증 및 라벨링

각 설정은 **사용자 승인 후** 실행됩니다.

## 예시

### 기본 초기화 (대화형)

```bash
sdd init
```

출력 예시:
```
SDD 프로젝트를 초기화합니다...
✓ SDD 프로젝트가 초기화되었습니다.

🔍 프로젝트 구조를 분석합니다...

=== 프로젝트 분석 결과 ===

📁 프로젝트 타입:
   TypeScript (Node.js)

🔧 Git 상태:
   저장소: ✅ 초기화됨
   Hooks: ❌ 미설치
   커밋 템플릿: ❌ 없음

🚀 CI/CD 상태:
   GitHub Actions: ❌ 미설정

📋 권장 설정:
   • Git Hooks: 커밋/푸시 시 자동 스펙 검증
   • 커밋 템플릿: 일관된 커밋 메시지 형식
   • GitHub Actions: PR 시 자동 검증 및 라벨링

Git 워크플로우(Hooks + 템플릿)를 설치하시겠습니까? (y/n): y
✓ Git 워크플로우 설치 완료!

GitHub Actions CI/CD를 설정하시겠습니까? (y/n): y
✓ sdd-validate.yml 생성 완료
✓ sdd-labeler.yml 생성 완료
```

### 자동 승인 (CI/스크립트용)

```bash
sdd init --auto-approve
```

모든 설정이 질문 없이 자동으로 적용됩니다.

### Git 설정 건너뛰기

```bash
sdd init --skip-git-setup
```

SDD 구조만 초기화하고 Git/CI-CD 설정은 건너뜁니다.

### 기존 설정 덮어쓰기

```bash
sdd init --force
```

## 초기화 후

1. Claude Code 실행: `claude`
2. 워크플로우 시작: `/sdd.start`

## 관련 문서

- [sdd git](/cli/git) - Git 워크플로우 설정
- [sdd cicd](/cli/cicd) - CI/CD 파이프라인 설정
- [커밋 컨벤션](/guide/commit-convention)
- [CI/CD 설정 가이드](/guide/cicd-setup)
