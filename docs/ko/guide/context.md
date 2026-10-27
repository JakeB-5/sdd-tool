# 컨텍스트 가이드

대규모 프로젝트에서 작업 범위를 설정하는 컨텍스트 시스템 가이드입니다.

## 개요

컨텍스트는 현재 작업 중인 도메인 범위를 정의합니다. 대규모 프로젝트에서 특정 영역에 집중하여 작업 효율을 높일 수 있습니다.

## 컨텍스트란?

컨텍스트가 설정되면:

- 작업 중인 도메인이 활성(편집 가능)으로 표시됩니다
- 그 도메인이 의존하는 도메인은 읽기 전용으로 포함됩니다
- `sdd context specs`로 범위 안의 스펙을 볼 수 있습니다
- 활성 도메인이 정확히 하나이면 `sdd new <feature>`가 그 도메인을 사용합니다

컨텍스트는 다른 명령을 필터링하지 않습니다. `sdd list`, `sdd validate`, `sdd status`는 여전히 모든 스펙을 대상으로 하며,
`--domain` 옵션(`sdd validate --domain auth`, `sdd status --domain auth`)으로 범위를 좁힙니다.

## 컨텍스트 설정

### 단일 도메인

```bash
sdd context set auth
```

### 여러 도메인

```bash
sdd context set auth order payment
```

### 의존성 포함

```bash
sdd context set auth
```

`auth`가 `core`에 의존하면(`sdd domain depends auth --on core`) `core`도 읽기 전용으로 포함됩니다.
의존 도메인을 빼려면 `--no-include-deps`를 붙이세요.

## 컨텍스트 조회

### 현재 상태

```bash
sdd context show
```

출력 예시:
```
현재 컨텍스트:

  활성 도메인 (편집 가능):
    auth - auth 도메인 (4 specs)
    order - order 도메인 (5 specs)

  읽기 전용 도메인 (의존성):
    core - core 도메인 (3 specs)

요약:
  총 도메인: 3
  총 스펙: 12
```

### 스펙 목록

```bash
sdd context specs
sdd context specs --json
```

## 컨텍스트 관리

### 도메인 추가

```bash
sdd context add payment
```

### 도메인 제거

```bash
sdd context remove order
```

### 컨텍스트 해제

```bash
sdd context clear
```

## 컨텍스트 파일

상태는 `.sdd/.context.json`에 저장됩니다:

```json
{
  "activeDomains": ["auth", "order"],
  "readOnlyDomains": ["core"],
  "updatedAt": "2025-12-29T10:00:00.000Z",
  "includeDependencies": true
}
```

## 사용 사례

### 1. 기능 개발 집중

```bash
# 인증 관련 작업
sdd context set auth
sdd context specs           # auth 스펙(과 읽기 전용 의존 스펙) 표시
sdd new mfa-setup          # auth/mfa-setup으로 자동 생성
```

### 2. 관련 도메인 통합 작업

```bash
# 결제 플로우 전체 작업
sdd context set order payment
```

활성 도메인이 여러 개이면 `sdd new <feature>`가 도메인을 고르지 못하고 `common`으로 가므로
`sdd new payment/refund`처럼 도메인을 명시하세요.

### 3. 리뷰 모드

```bash
# 특정 도메인 리뷰
sdd context set auth
sdd validate --domain auth  # auth 도메인만 검증
```

## 컨텍스트와 다른 명령어

### sdd new

활성 도메인이 정확히 하나이면 그 도메인에 만들어집니다:

```bash
sdd context set auth
sdd new user-login          # → auth/user-login 생성
```

컨텍스트가 없거나 활성 도메인이 여러 개이면 기본값은 `common`입니다. 명시한 `<domain>/<feature>` 또는 `-d <domain>`이
항상 우선하고, 아직 없는 도메인은 새로 만들어집니다. "컨텍스트 밖" 경고는 없으며, `--force`로 우회할 것도 없습니다
(`--force`는 기존 파일을 덮어쓰는 옵션입니다. [sdd new](/ko/cli/new) 참고).

### sdd list / sdd validate

컨텍스트를 무시합니다. 명시적으로 좁히세요:

```bash
sdd validate --domain auth
sdd status --domain auth
```

## 모범 사례

### 작업 시작 시

```bash
# 1. 작업할 도메인 설정
sdd context set auth

# 2. 현재 상태 확인
sdd context specs

# 3. 작업 진행
sdd new oauth-google
```

### 작업 전환 시

```bash
# 1. 현재 컨텍스트 해제
sdd context clear

# 2. 새 컨텍스트 설정
sdd context set payment
```

### 대규모 변경 시

```bash
# 의존성 포함하여 전체 파악
sdd context set order
sdd context specs           # 영향 범위 확인
```

## 관련 문서

- [도메인 시스템](./domains.md)
- [대규모 프로젝트](./large-projects.md)
- [CLI: context](../cli/context.md)
