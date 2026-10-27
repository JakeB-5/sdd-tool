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
| `--with-domains` | 도메인 설정 파일 `.sdd/domains.yml`도 생성 |
| `--no-skills` | 스킬 생성 건너뛰기 (`.claude/skills/`, `.agents/skills/`) |
| `--legacy-commands` | 레거시 한국어 슬래시 커맨드를 `.claude/commands/sdd.*.md`에 추가로 생성 |

## 생성되는 파일

`sdd init`은 항상 Claude Code와 OpenAI Codex 양쪽 파일을 함께 생성합니다.

```
your-project/
├── .sdd/
│   ├── constitution.md     # 프로젝트 헌법 템플릿
│   ├── specs/              # 기능 명세 디렉토리
│   ├── changes/            # 변경 제안 디렉토리
│   ├── archive/            # 완료된 변경 아카이브
│   └── templates/          # 스펙 템플릿
│
├── AGENTS.md               # <!-- sdd:begin --> … <!-- sdd:end --> 블록의 SDD 지침
├── CLAUDE.md               # `@AGENTS.md`로 지침을 import
│
├── .claude/                # Claude Code
│   ├── skills/             # sdd-* 스킬 30개 — 영어, 케밥 케이스
│   │   └── sdd-start/SKILL.md ...
│   └── agents/             # sdd-spec-reviewer.md, sdd-implementer.md, sdd-impact-analyst.md
├── .agents/
│   └── skills/             # Codex: 같은 sdd-* 스킬 30개
│       ├── sdd-start/SKILL.md ...
│       └── sdd-watch/agents/openai.yaml   # 명시 호출 전용 스킬
└── .codex/
    └── agents/             # Codex: sdd-spec-reviewer.toml, sdd-implementer.toml, sdd-impact-analyst.toml
```

`.claude/commands/`는 기본적으로 생성되지 않습니다. 필요하면 `--legacy-commands`(아래)를 사용하세요.

스킬과 서브에이전트는 도구가 관리하는 파일이라 실행할 때마다 그대로 다시 생성됩니다. `--force` 백업은 내용이 바뀐 `.sdd/` 파일에만 적용됩니다.

## 스킬

`sdd init`은 `.claude/skills/sdd-*/SKILL.md`에 영어 스킬 30개를 생성합니다. Claude Code는 각 스킬을 스킬 이름 그대로의 슬래시 커맨드(예: `/sdd-start`, `/sdd-spec`)로 노출합니다. 스킬은 다음 프론트매터 필드를 포함합니다:

- **`context: fork`** — 분석/도메인 스킬 7개가 포크된 컨텍스트에서 실행됨 (`sdd-analyze`, `sdd-impact`, `sdd-report`, `sdd-research`, `sdd-reverse`, `sdd-search`, `sdd-sync`)
- **`disable-model-invocation: true`** — 사용자만 호출할 수 있는 유틸리티 스킬 5개 (`sdd-chat`, `sdd-cicd`, `sdd-guide`, `sdd-migrate`, `sdd-watch`)
- **`argument-hint`** — 인수를 받는 스킬
- **`allowed-tools`** — 스킬별 최소 권한 패턴 (예: `Bash(sdd validate*)`)

스킬 생성을 건너뛰려면:

```bash
sdd init --no-skills        # .claude/skills/, .agents/skills/ 전체 건너뛰기
```

## Codex 지원

같은 스킬 정의 30개가 Codex용으로 `.agents/skills/sdd-*/SKILL.md`에도 생성됩니다:

- 프론트매터에는 `name`과 `description`만 들어갑니다 (위의 Claude 전용 필드는 제외).
- 다른 스킬 참조는 Codex 표기를 씁니다: `/sdd-plan` 대신 `$sdd-plan`.
- 명시 호출 전용 스킬 5개에는 `agents/openai.yaml`(`policy.allow_implicit_invocation: false`)이 함께 생성되어, 사용자가 직접 호출할 때만 실행됩니다.

Codex에서는 `$sdd-spec auth/login`처럼 호출하거나 `/skills`에서 고릅니다. 요청이 설명(description)과 맞으면 Codex가 스킬을 암묵적으로 선택하기도 합니다.

## 서브에이전트

서브에이전트 3개가 두 도구 모두에 생성됩니다 — `.claude/agents/<name>.md`(프론트매터 `name`, `description`, `tools`, `model: inherit`)와 `.codex/agents/<name>.toml`(`name`, `description`, `developer_instructions`):

| 서브에이전트 | 역할 | Claude Code 도구 |
|--------------|------|------------------|
| `sdd-spec-reviewer` | 읽기 전용 스펙 리뷰 (RFC 2119, GIVEN-WHEN-THEN, 헌법); `sdd validate` / `sdd quality` 실행 후 문제 보고 | `Read, Grep, Glob, Bash` |
| `sdd-implementer` | `tasks.md` 작업을 테스트 우선으로 구현, 프로젝트 테스트 실행, 스펙 범위 유지 | `Read, Grep, Glob, Bash, Edit, Write` |
| `sdd-impact-analyst` | 스펙 변경 전 `sdd impact`로 읽기 전용 영향도 분석 | `Read, Grep, Glob, Bash` |

"sdd-spec-reviewer로 auth/login 스펙을 리뷰해줘"처럼 이름을 지정해 위임합니다.

::: warning 읽기 전용은 지침으로 지켜집니다
읽기 전용 에이전트도 `sdd` 명령을 실행하려면 셸이 필요합니다. Claude Code에서는 `Edit`/`Write` 도구를 주지 않지만 `Bash`로 파일을 바꿀 수는 있고, Codex는 에이전트별로 샌드박스를 제한할 수 없습니다. 따라서 읽기 전용 동작은 강제 권한이 아니라 에이전트 지침에 의존합니다.
:::

## AGENTS.md 블록

SDD 워크플로우 지침은 Codex가 직접 읽는 프로젝트 루트 `AGENTS.md`에 기록됩니다:

- `AGENTS.md`가 없으면 블록만 담은 파일을 만듭니다.
- 있으면 `<!-- sdd:begin -->` … `<!-- sdd:end -->` 블록만 교체하거나, 블록이 없으면 끝에 추가합니다. 블록 밖 내용과 CRLF 줄바꿈은 그대로 유지됩니다.
- 마커 짝이 맞지 않으면(시작만 있고 끝이 없는 경우 등) `sdd init`은 아무것도 쓰지 않고 실패합니다.
- 루트에 `AGENTS.override.md`가 있으면 경고합니다. Codex는 그 파일을 `AGENTS.md` 대신 읽으므로 SDD 블록이 가려집니다.
- `.sdd/AGENTS.md`는 더 이상 생성하지 않습니다. 기존 파일은 그대로 두고 더 이상 생성하지 않는 파일로 보고합니다.

## CLAUDE.md import

Claude Code는 `CLAUDE.md`가 있으면 `AGENTS.md`를 직접 읽지 않으므로, `sdd init`은 `CLAUDE.md`가 이를 import하도록 보장합니다:

- `CLAUDE.md`가 없으면 짧은 헤더와 `@AGENTS.md` 한 줄이 담긴 파일을 새로 만듭니다.
- `.claude/CLAUDE.md`만 있으면 그 파일에 `@../AGENTS.md`를 추가합니다.
- 이미 있지만 import가 없으면 줄을 끝에 추가합니다. 기존 내용은 절대 덮어쓰지 않습니다.
- 이전 버전의 `@.sdd/AGENTS.md` import 줄은 그 자리에서 새 import로 교체합니다.
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

1. Claude Code(`claude`) 또는 Codex(`codex`) 실행
2. 워크플로우 시작: `/sdd-start` (Codex: `$sdd-start`)

## 관련 문서

- [sdd git](/cli/git) - Git 워크플로우 설정
- [sdd cicd](/cli/cicd) - CI/CD 파이프라인 설정
- [커밋 컨벤션](/guide/commit-convention)
- [CI/CD 설정 가이드](/guide/cicd-setup)
