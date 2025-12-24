# sdd validate

스펙 문서를 검증합니다.

## 사용법

```bash
sdd validate [files...] [options]
```

## 인수

| 인수 | 설명 |
|------|------|
| `files` | 검증할 파일 (생략 시 전체) |

## 옵션

| 옵션 | 설명 |
|------|------|
| `--strict` | 경고를 에러로 처리 |
| `--quiet` | 요약만 출력 |
| `--json` | JSON 형식 출력 |
| `--check-links` | 링크 검증 |
| `--no-constitution` | 헌법 검사 건너뛰기 |

## 검증 항목

### 필수 검증

- YAML frontmatter 형식
- 필수 메타데이터 (id, title, status)
- 마크다운 문법

### 경고 검증

- RFC 2119 키워드 사용
- GIVEN-WHEN-THEN 형식
- 요구사항 ID 형식

### 헌법 검증

- constitution_version 일치
- 금지 사항 위반 여부

## 예시

### 전체 스펙 검증

```bash
sdd validate
```

### 특정 파일 검증

```bash
sdd validate .sdd/specs/user-auth/spec.md
```

### 엄격 모드

```bash
sdd validate --strict
```

### CI/CD에서 사용

```bash
sdd validate --quiet --json
```

## 출력 예시

```
SDD Validate

  ✓ user-auth/spec.md
  ✓ profile/spec.md
  ⚠ settings/spec.md
    - RFC 2119 키워드가 없습니다

Summary: 2 passed, 1 warning, 0 errors
```
