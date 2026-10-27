# sdd init

프로젝트를 SDD Tool로 초기화합니다.

## 사용법

```bash
sdd init [options]
```

## 옵션

| 옵션 | 설명 |
|------|------|
| `-f, --force` | 기존 설정 덮어쓰기 (내용이 다른 `.sdd/` 파일은 `<파일>.bak`, 이미 있으면 `<파일>.1.bak`…으로 백업 후 보고. 백업은 확인 후 삭제하고 커밋하지 마세요: `.gitignore`에 `.sdd/**/*.bak` 권장) |
| `--skip-git-setup` | Git/CI-CD 설정 건너뛰기 |
| `--auto-approve` | 모든 설정을 자동 승인 |
| `--no-skills` | `.claude/skills/` 생성 건너뛰기 |
| `--legacy-commands` | 레거시 한국어 슬래시 커맨드를 `.claude/commands/sdd.*.md`에 추가로 생성 |

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
├── CLAUDE.md               # `@.sdd/AGENTS.md`로 에이전트 가이드를 import
│
└── .claude/
    └── skills/             # Claude Code 스킬 — 영어, 케밥 케이스
        ├── sdd-start/
        │   └── SKILL.md
        ├── sdd-spec/
        │   └── SKILL.md
        └── ...             # sdd-* 스킬 30개
```

`.claude/commands/`는 기본적으로 생성되지 않습니다. 필요하면 `--legacy-commands`(아래)를 사용하세요.

## 스킬

`sdd init`은 `.claude/skills/sdd-*/SKILL.md`에 영어 스킬 30개를 생성합니다. Claude Code는 각 스킬을 스킬 이름 그대로의 슬래시 커맨드(예: `/sdd-start`, `/sdd-spec`)로 노출합니다. 스킬은 다음 프론트매터 필드를 포함합니다:

- **`context: fork`** — 분석/도메인 스킬 7개가 포크된 컨텍스트에서 실행됨 (`sdd-analyze`, `sdd-impact`, `sdd-report`, `sdd-research`, `sdd-reverse`, `sdd-search`, `sdd-sync`)
- **`disable-model-invocation: true`** — 사용자만 호출할 수 있는 유틸리티 스킬 5개 (`sdd-chat`, `sdd-cicd`, `sdd-guide`, `sdd-migrate`, `sdd-watch`)
- **`argument-hint`** — 인수를 받는 스킬
- **`allowed-tools`** — 스킬별 최소 권한 패턴 (예: `Bash(sdd validate*)`)

스킬 생성을 건너뛰려면:

```bash
sdd init --no-skills        # .claude/skills/ 전체 건너뛰기
```

## CLAUDE.md import

`sdd init`은 프로젝트 루트의 `CLAUDE.md`가 에이전트 가이드를 import하도록 보장합니다:

- `CLAUDE.md`가 없으면 짧은 헤더와 `@.sdd/AGENTS.md` 한 줄이 담긴 파일을 새로 만듭니다.
- 이미 있지만 import가 없으면 `@.sdd/AGENTS.md` 줄을 끝에 추가합니다. 기존 내용은 절대 덮어쓰지 않습니다.
- `sdd init`을 다시 실행해도 줄이 중복 추가되지 않습니다.

## 레거시 커맨드

Claude Code가 커스텀 커맨드를 스킬로 통합했으므로 커맨드는 더 이상 기본 생성되지 않습니다. 기존 한국어 점 표기법 슬래시 커맨드(`/sdd.start` 등)를 `.claude/commands/sdd.*.md`에 계속 쓰고 싶다면 `--legacy-commands`를 추가하세요:

```bash
sdd init --legacy-commands  # .claude/commands/sdd.*.md도 함께 생성 (레거시)
```

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
2. 워크플로우 시작: `/sdd-start`

## 관련 문서

- [sdd git](/cli/git) - Git 워크플로우 설정
- [sdd cicd](/cli/cicd) - CI/CD 파이프라인 설정
- [커밋 컨벤션](/guide/commit-convention)
- [CI/CD 설정 가이드](/guide/cicd-setup)
