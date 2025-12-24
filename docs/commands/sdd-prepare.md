# /sdd.prepare

구현에 필요한 서브에이전트와 스킬을 점검합니다.

## 사용법

```
/sdd.prepare [feature-id]
```

## 인수

| 인수 | 설명 |
|------|------|
| feature-id | 기능 ID (생략 시 최근 작성한 스펙) |

## 동작

1. tasks.md 분석
2. 필요한 도구 감지
3. 존재 여부 확인
4. 누락된 도구 생성 제안

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

```
/sdd.prepare user-auth

AI: user-auth 작업을 분석하여 필요한 도구를 점검합니다.

    필요한 도구:
    ✓ test-runner (존재함)
    ✗ api-scaffold (누락)

    api-scaffold 서브에이전트를 생성할까요? [Y/n]
```

## 생성되는 도구

### 서브에이전트

```
.claude/agents/api-scaffold.md
```

### 스킬

```
.claude/skills/gen-api/SKILL.md
```

## 점검 보고서

```
.sdd/specs/<feature-id>/prepare.md
```

```markdown
# 도구 점검 결과

## 분석된 작업
- T3: 비밀번호 해싱 유틸 → test 필요
- T4: JWT 서비스 → test 필요
- T5: 로그인 서비스 → api, test 필요

## 필요한 도구

| 도구 | 유형 | 상태 |
|------|------|------|
| test-runner | agent | ✓ 존재 |
| api-scaffold | agent | ✗ 생성됨 |
| test | skill | ✓ 존재 |
```

## 다음 단계

도구 점검 후:

```
/sdd.implement  → 구현 시작
```
