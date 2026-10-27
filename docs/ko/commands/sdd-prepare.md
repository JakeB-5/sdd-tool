# /sdd-prepare

구현 전에 기능에 필요한 서브에이전트와 스킬을 점검하고, 누락된 것은 `sdd prepare`로 생성합니다.

## 사용법

```
/sdd-prepare <feature> [--dry-run]
```

Codex에서는 `$sdd-prepare <feature>`로 호출합니다.

## 인수

| 인수 | 설명 |
|------|------|
| feature | `<domain>/<feature>` 또는 프로젝트에서 유일한 기능 이름 (예: `auth/login` 또는 `login`) |
| --dry-run | 파일을 만들지 않고 분석 결과만 출력 |

## 동작

스킬이 CLI를 실행하고 결과를 안내합니다:

1. `sdd prepare <feature>` 실행. CLI가 기능의 `spec.md`, `plan.md`, `tasks.md`를 읽고 키워드를 매칭합니다.
2. 감지된 서브에이전트/스킬과 각각의 존재 여부 확인
3. 누락된 도구를 생성할지 결정. 기본 실행은 확인 질문을 하지 않습니다. 분석하고 `prepare.md` 보고서를 저장한 뒤 `--auto-approve`로 다시 실행하라는 안내를 출력합니다.

```bash
sdd prepare login                  # 분석 + prepare.md 저장 (질문 없음)
sdd prepare login --dry-run        # 미리보기 (파일 생성 안 함)
sdd prepare login --auto-approve   # 누락된 도구도 함께 생성
sdd prepare login --json           # JSON 출력
```

## 감지 키워드

키워드는 기능 문서에서 대소문자 구분 없이 매칭됩니다. 표에는 영어 키워드와 대표 한국어 키워드를 적었습니다.

| 키워드 | 서브에이전트 | 스킬 |
|--------|--------------|------|
| test, vitest, jest, unit test, 테스트 | test-runner | test |
| api, rest, endpoint, graphql, 엔드포인트 | api-scaffold | gen-api |
| component, react, vue, ui, 컴포넌트 | component-gen | gen-component |
| db, database, prisma, migration, 마이그레이션, 데이터베이스 | - | db-migrate |
| doc, readme, jsdoc, documentation, 문서, 주석 | doc-generator | doc |
| type, schema, zod, typescript, 타입 | - | gen-types |
| lint, eslint, prettier, format, 포맷 | - | lint |
| review, code review, 리뷰, 검증, 코드 리뷰 | code-reviewer | review |

## 출력

`sdd prepare`는 분석한 작업 수, 필요한/누락된 서브에이전트와 스킬을 출력하고, `--dry-run`이 아니면 보고서를 저장합니다:

```
.sdd/specs/<domain>/<feature>/prepare.md
```

`--auto-approve`를 쓰면 누락된 파일도 생성합니다:

```
.claude/
├── agents/
│   └── api-scaffold.md
└── skills/
    └── gen-api/
        └── SKILL.md
```

## Codex

`sdd prepare`는 Claude Code 레이아웃(`.claude/agents/`, `.claude/skills/`)만 점검하고 생성하며, Codex 파일은 점검하거나 만들지 않습니다. Codex에서는 감지된 목록을 체크리스트로 쓰고 누락된 파일을 직접 만드세요:

- 서브에이전트: `.codex/agents/<name>.toml` (`name`, `description`, `developer_instructions`)
- 스킬: `.agents/skills/<name>/SKILL.md`

## 다음 단계

```
/sdd-spec -> /sdd-plan -> /sdd-tasks -> /sdd-prepare -> /sdd-implement
```

점검이 끝나면 `/sdd-implement`로 구현을 시작합니다.

## 관련 명령어

- [`sdd prepare`](/ko/cli/prepare) - CLI 레퍼런스
- [`/sdd-tasks`](/ko/commands/sdd-tasks) - 작업 분해
- [`/sdd-implement`](/ko/commands/sdd-implement) - 구현
