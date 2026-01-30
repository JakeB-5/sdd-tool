# sdd prepare

구현에 필요한 서브에이전트와 스킬을 점검합니다.

## 사용법

```bash
sdd prepare <feature> [options]
```

## 인수

| 인수 | 설명 |
|------|------|
| `feature` | 기능 이름 |

## 옵션

| 옵션 | 설명 |
|------|------|
| `--dry-run` | 미리보기만 |
| `--auto-approve` | 자동 생성 |

## 감지 키워드

| 키워드 | 서브에이전트 | 스킬 |
|--------|-------------|------|
| 테스트, test | test-runner | test |
| api, rest | api-scaffold | gen-api |
| component | component-gen | gen-component |
| database | - | db-migrate |
| 문서, doc | - | gen-doc |
| review | code-reviewer | review |

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

점검 결과는 `.sdd/specs/<feature>/prepare.md`에 저장됩니다.

```markdown
# 도구 점검 결과

## 필요한 도구

- [x] test-runner (존재함)
- [ ] api-scaffold (생성 필요)

## 권장 사항

- API 스캐폴딩 서브에이전트 생성 권장
```
