# 컨텍스트 가이드

대규모 프로젝트에서 작업 범위를 설정하는 컨텍스트 시스템 가이드입니다.

## 개요

컨텍스트는 현재 작업 중인 도메인 범위를 정의합니다. 대규모 프로젝트에서 특정 영역에 집중하여 작업 효율을 높일 수 있습니다.

## 컨텍스트란?

컨텍스트가 설정되면:

- 해당 도메인의 스펙만 표시됩니다
- 의존 도메인은 읽기 전용으로 포함됩니다
- AI 어시스턴트가 도메인 경계를 인식합니다
- 새 스펙 생성 시 도메인이 자동 감지됩니다

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
sdd context set auth --include-deps
```

`auth`가 `core`에 의존하면 `core`도 읽기 전용으로 포함됩니다.

## 컨텍스트 조회

### 현재 상태

```bash
sdd context show
```

출력 예시:
```
📍 현재 컨텍스트

활성 도메인:
  ✏️  auth (수정 가능)
  ✏️  order (수정 가능)

읽기 전용:
  📖 core

스펙 수: 12
```

### 스펙 목록

```bash
sdd context specs
sdd context specs --status draft
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
  "active_domains": ["auth", "order"],
  "read_only_domains": ["core"],
  "updated_at": "2025-12-29T10:00:00Z"
}
```

## 사용 사례

### 1. 기능 개발 집중

```bash
# 인증 관련 작업
sdd context set auth
sdd list                    # auth 스펙만 표시
sdd new mfa-setup          # auth/mfa-setup으로 자동 생성
```

### 2. 관련 도메인 통합 작업

```bash
# 결제 플로우 전체 작업
sdd context set order payment --include-deps
```

### 3. 리뷰 모드

```bash
# 특정 도메인 리뷰
sdd context set auth
sdd validate                # auth 관련만 검증
```

## 컨텍스트와 다른 명령어

### sdd new

컨텍스트가 설정된 상태에서:

```bash
sdd context set auth
sdd new user-login          # → auth/user-login 생성
```

### sdd list

```bash
sdd context set auth
sdd list                    # auth 도메인 스펙만 표시
sdd list --all              # 전체 스펙 표시
```

### sdd validate

```bash
sdd context set auth
sdd validate                # auth 관련 스펙만 검증
sdd validate --all          # 전체 검증
```

## 경고 시스템

컨텍스트 외부 도메인 수정 시:

```
⚠️ 경고: payment 도메인은 현재 컨텍스트에 없습니다.
계속하시겠습니까? [y/N]
```

`--force` 옵션으로 우회:

```bash
sdd new payment/refund --force
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
sdd context set order --include-deps
sdd context specs           # 영향 범위 확인
```

## 관련 문서

- [도메인 시스템](./domains.md)
- [대규모 프로젝트](./large-projects.md)
- [CLI: context](../cli/context.md)
