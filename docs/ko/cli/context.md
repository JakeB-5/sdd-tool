# sdd context

작업 컨텍스트(현재 작업 중인 도메인)를 설정하고 관리합니다.

## 사용법

```bash
sdd context <command> [options]
```

## 명령어

### set

컨텍스트를 설정합니다.

```bash
sdd context set <domains...> [options]
```

**옵션:**

| 옵션 | 설명 |
|------|------|
| `--no-include-deps` | 의존 도메인을 추가하지 않음 (기본: 읽기 전용으로 추가) |

**예시:**

```bash
# 단일 도메인
sdd context set auth

# 여러 도메인
sdd context set auth order payment

# 의존 도메인 제외
sdd context set auth --no-include-deps
```

`billing`이 `auth`에 의존하면(`sdd domain depends billing --on auth`) `sdd context set billing`은
`billing`을 활성(편집 가능), `auth`를 읽기 전용으로 둡니다.

### show

현재 컨텍스트를 표시합니다.

```bash
sdd context show [options]
```

**옵션:**

| 옵션 | 설명 |
|------|------|
| `--json` | JSON 형식 출력 |

**출력 예시:**

```
현재 컨텍스트:

  활성 도메인 (편집 가능):
    billing - billing 도메인 (1 specs)

  읽기 전용 도메인 (의존성):
    auth - auth 도메인 (2 specs)

요약:
  총 도메인: 2
  총 스펙: 3
```

### add

컨텍스트에 도메인을 추가합니다.

```bash
sdd context add <domain> [--no-include-deps]
```

### remove

컨텍스트에서 도메인을 제거합니다. 컨텍스트에 없는 도메인이면 실패합니다.

```bash
sdd context remove <domain>      # 별칭: rm
```

### clear

컨텍스트를 해제합니다.

```bash
sdd context clear
```

### specs

컨텍스트에 포함된 스펙(활성 스펙, 읽기 전용 스펙)을 표시합니다.

```bash
sdd context specs [--json]
```

## 컨텍스트가 영향을 주는 것

컨텍스트는 **`sdd new`의 기본 도메인**을 정하는 데에만 쓰입니다:

```bash
sdd context set auth
sdd new user-login     # → auth/user-login 생성
```

- 활성 도메인이 정확히 하나: `sdd new <feature>`는 그 도메인에 스펙을 만듭니다.
- 컨텍스트가 없거나 활성 도메인이 여러 개: `sdd new <feature>`는 `common` 도메인으로 갑니다.
  `sdd new auth/user-login` 또는 `sdd new user-login -d auth`처럼 도메인을 명시하세요.
- 명시한 `<domain>/<feature>` 또는 `-d`가 항상 컨텍스트보다 우선하며, 아직 없는 도메인은 새로 만들어집니다.
  "컨텍스트 밖" 경고나 확인 프롬프트는 없고, `--force`로 우회할 것도 없습니다
  (`--force`는 기존 파일을 덮어쓰는 옵션입니다. [sdd new](/ko/cli/new) 참고).

`sdd list`, `sdd validate` 등 다른 명령은 컨텍스트로 **필터링하지 않습니다**. 범위 안의 스펙은
`sdd context specs`로 확인하고, 명령을 도메인으로 좁히려면 `sdd validate --domain <domain>` /
`sdd status --domain <domain>`을 사용하세요.

## 컨텍스트 파일

상태는 `.sdd/.context.json`에 저장됩니다:

```json
{
  "activeDomains": ["auth", "order"],
  "readOnlyDomains": ["core"],
  "updatedAt": "2025-12-29T10:30:00.000Z",
  "includeDependencies": true
}
```

## 관련 문서

- [컨텍스트 가이드](../guide/context.md)
- [도메인 시스템](../guide/domains.md)
- [sdd domain](./domain.md)
