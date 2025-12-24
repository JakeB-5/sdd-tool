# /sdd.validate

명세가 올바르게 작성되었는지 검증합니다.

## 사용법

```
/sdd.validate [feature-id]
```

## 인수

| 인수 | 설명 |
|------|------|
| feature-id | 기능 ID (생략 시 전체) |

## 검증 항목

### 필수 검증 (에러)

- YAML frontmatter 형식
- 필수 메타데이터: id, title, status
- 마크다운 문법

### 권장 검증 (경고)

- RFC 2119 키워드 사용
- GIVEN-WHEN-THEN 형식
- 요구사항 ID 형식 (REQ-XX)

### 헌법 검증

- constitution_version 일치
- 금지 사항 위반 여부

## 예시

```
/sdd.validate

AI: 전체 스펙을 검증합니다.

    ✓ user-auth/spec.md
      - 요구사항 5개
      - 시나리오 3개
      - RFC 2119 키워드 ✓

    ⚠ profile/spec.md
      - RFC 2119 키워드가 없습니다
      - GIVEN-WHEN-THEN 형식이 아닙니다

    ✗ settings/spec.md
      - YAML frontmatter가 잘못되었습니다
      - 필수 필드 'id'가 없습니다

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━
    결과: 1 통과, 1 경고, 1 에러
```

## 자동 수정

일부 문제는 자동 수정 가능:

```
/sdd.validate --fix

AI: 자동 수정 가능한 문제:
    - profile/spec.md: SHOULD 키워드 추가

    수정할까요? [Y/n]
```

## CI/CD 통합

```bash
sdd validate --strict --quiet
```

에러 또는 경고 시 exit code 1 반환
