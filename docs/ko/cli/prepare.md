# sdd prepare

구현에 필요한 서브에이전트와 스킬을 점검합니다.

## 사용법

```bash
sdd prepare <feature> [options]
```

## 인수

| 인수 | 설명 |
|------|------|
| `feature` | `<domain>/<feature>` 또는 유일한 기능 이름 |

## 옵션

| 옵션 | 설명 |
|------|------|
| `--dry-run` | 미리보기만 |
| `--auto-approve` | 자동 생성 |
| `--json` | JSON 형식 출력 |

`sdd prepare`는 기능의 tasks.md를 읽고 Claude Code 레이아웃(`.claude/agents/`, `.claude/skills/`)에 파일을 씁니다.
Codex에서는 생성된 스킬과 `.codex/agents/*.toml` 서브에이전트가 대응물이므로 직접 복사하거나 맞춰 쓰세요.

## 감지 키워드

키워드는 기능의 tasks.md, plan.md, spec.md에서 찾습니다(대소문자 무시, 단어 단위. `테스트`, `문서`, `리뷰` 같은 한글 키워드는 부분 문자열로 매칭).

| 키워드 | 서브에이전트 | 스킬 |
|--------|-------------|------|
| test, vitest, jest, unit test, 테스트 | test-runner | test |
| api, rest, endpoint, graphql, 엔드포인트 | api-scaffold | gen-api |
| component, react, vue, ui, 컴포넌트 | component-gen | gen-component |
| db, database, prisma, migration, 데이터베이스 | - | db-migrate |
| doc, readme, jsdoc, documentation, 문서 | doc-generator | doc |
| type, schema, zod, typescript, 타입 | - | gen-types |
| lint, eslint, prettier, format, 포맷 | - | lint |
| review, code review, 리뷰, 검증 | code-reviewer | review |

## 예시

### 대화형 점검

```bash
sdd prepare user-auth
```

### 미리보기

```bash
sdd prepare user-auth --dry-run
```

### 자동 생성

```bash
sdd prepare user-auth --auto-approve
```

## 생성되는 파일

### 서브에이전트

```
.claude/agents/
├── test-runner.md
├── api-scaffold.md
└── code-reviewer.md
```

### 스킬

```
.claude/skills/
├── test/
│   └── SKILL.md
├── gen-api/
│   └── SKILL.md
└── gen-component/
    └── SKILL.md
```

## 점검 보고서

점검 결과는 `.sdd/specs/<domain>/<feature>/prepare.md`에 저장됩니다.

```markdown
# 도구 점검 결과

## 필요한 도구

- [x] test-runner (존재함)
- [ ] api-scaffold (생성 필요)

## 권장 사항

- API 스캐폴딩 서브에이전트 생성 권장
```
