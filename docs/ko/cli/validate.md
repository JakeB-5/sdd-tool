# sdd validate

스펙 문서를 검증합니다.

## 사용법

```bash
sdd validate [path] [options]
```

## 인수

| 인수 | 설명 |
|------|------|
| `path` | 검증할 파일 또는 디렉토리 (생략 시 전체 스펙) |

## 옵션

| 옵션 | 설명 |
|------|------|
| `-s, --strict` | 경고를 에러로 처리 |
| `-q, --quiet` | 요약만 출력 |
| `-l, --check-links` | 참조 링크 검증 |
| `-c, --constitution` | 헌법 버전 확인 (기본값) |
| `--no-constitution` | 헌법 검사 건너뛰기 |
| `-d, --domain <domain>` | 특정 도메인 스펙만 검증 |
| `--orphan-specs` | 도메인에 속하지 않은 스펙 검사 |

## 종료 코드

| 상황 | 종료 코드 |
|------|-----------|
| 모든 스펙 통과 (경고는 허용) | 0 |
| 스펙 실패, 경로를 읽을 수 없음 (`--strict`에서는 경고 포함) | 2 (`VALIDATION_FAILED`) |
| SDD 프로젝트 안이 아님 | 1 |

## 검증 항목

### 필수 검증

- YAML frontmatter 형식
- 필수 메타데이터 (id, title, status)
- `status`는 `draft`, `review`, `approved`, `planned`, `tasked`, `implementing`, `implemented`, `deprecated` 중 하나 (레거시 `specified` / `completed`는 각각 `review` / `implemented`로 읽고 경고 W006)
- 마크다운 문법

### 경고 검증

- RFC 2119 키워드 사용 (키워드는 대문자여야 하며, HTML 주석과 코드 펜스 안의 키워드는 무시)
- GIVEN-WHEN-THEN 형식
- 요구사항 ID 형식
- 남아 있는 템플릿 플레이스홀더 (<code v-pre>id: "{{FEATURE_ID}}"</code> 같은 frontmatter를 포함한 <code v-pre>{{...}}</code> 값과 `[...]` 문구) — 채우지 않은 스펙 템플릿은 `--strict`에서 실패합니다

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
sdd validate .sdd/specs/auth/user-auth/spec.md
```

### 특정 도메인만

```bash
sdd validate --domain auth
```

### 엄격 모드

```bash
sdd validate --strict
```

### CI/CD에서 사용

```bash
sdd validate --quiet
```

## 출력 예시

```
ℹ 검증 중: /path/to/project/.sdd/specs

✓ auth/user-auth/spec.md
✓ auth/profile/spec.md
✓ common/settings/spec.md
  ⚠ RFC 2119 키워드가 없습니다

결과: 3개 통과, 0개 실패, 1개 경고
```

경고는 `--strict`를 지정하지 않으면 검증 실패로 처리되지 않습니다.
