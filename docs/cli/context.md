# sdd context

작업 컨텍스트를 설정하고 관리합니다.

## 사용법

```bash
sdd context <command> [options]
```

## 명령어

### set

컨텍스트를 설정합니다.

```bash
sdd context set <domain...> [options]
```

**옵션:**

| 옵션 | 설명 |
|------|------|
| `--include-deps` | 의존 도메인 포함 |
| `--read-only` | 읽기 전용으로 설정 |

**예시:**

```bash
# 단일 도메인
sdd context set auth

# 여러 도메인
sdd context set auth order payment

# 의존성 포함
sdd context set auth --include-deps
```

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
📍 현재 컨텍스트

활성 도메인:
  ✏️  auth (수정 가능)
  ✏️  order (수정 가능)

읽기 전용:
  📖 core

스펙 수: 12
설정 시간: 2025-12-29 10:30:00
```

### add

도메인을 컨텍스트에 추가합니다.

```bash
sdd context add <domain...> [options]
```

**옵션:**

| 옵션 | 설명 |
|------|------|
| `--read-only` | 읽기 전용으로 추가 |

**예시:**

```bash
sdd context add payment
sdd context add notification --read-only
```

### remove

도메인을 컨텍스트에서 제거합니다.

```bash
sdd context remove <domain...>
```

**예시:**

```bash
sdd context remove order
sdd context remove order payment
```

### clear

컨텍스트를 해제합니다.

```bash
sdd context clear
```

### specs

컨텍스트 내 스펙 목록을 표시합니다.

```bash
sdd context specs [options]
```

**옵션:**

| 옵션 | 설명 |
|------|------|
| `--status` | 상태별 필터 (draft, approved, implemented) |
| `--domain` | 도메인별 필터 |
| `--json` | JSON 형식 출력 |

**예시:**

```bash
sdd context specs
sdd context specs --status draft
sdd context specs --domain auth
```

**출력 예시:**

```
📋 컨텍스트 스펙 (12개)

auth (4개):
  ✅ user-login
  ✅ oauth-google
  🔄 session-management
  📝 mfa-setup

order (5개):
  ✅ create-order
  ✅ update-order
  ✅ cancel-order
  🔄 payment
  📝 refund

core (3개) [읽기 전용]:
  ✅ data-model
  ✅ validation
  ✅ utils
```

### history

컨텍스트 변경 이력을 표시합니다.

```bash
sdd context history [options]
```

**옵션:**

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--limit`, `-n` | 표시할 항목 수 | 10 |

**출력 예시:**

```
📜 컨텍스트 이력

1. 2025-12-29 10:30:00  set auth, order
2. 2025-12-29 09:15:00  add payment
3. 2025-12-29 09:00:00  set core --include-deps
4. 2025-12-28 16:00:00  clear
```

### save / load

컨텍스트를 저장하고 불러옵니다.

```bash
sdd context save <name>
sdd context load <name>
sdd context list-saved
```

**예시:**

```bash
# 현재 컨텍스트 저장
sdd context save payment-feature

# 저장된 컨텍스트 불러오기
sdd context load payment-feature

# 저장된 컨텍스트 목록
sdd context list-saved
```

## 전역 옵션

| 옵션 | 설명 |
|------|------|
| `--help`, `-h` | 도움말 표시 |
| `--quiet`, `-q` | 최소 출력 |

## 컨텍스트 파일

상태는 `.sdd/.context.json`에 저장됩니다:

```json
{
  "active_domains": ["auth", "order"],
  "read_only_domains": ["core"],
  "updated_at": "2025-12-29T10:30:00Z",
  "saved_contexts": {
    "payment-feature": {
      "active_domains": ["order", "payment"],
      "read_only_domains": ["core", "auth"]
    }
  }
}
```

## 컨텍스트와 다른 명령어

### sdd new

컨텍스트가 설정된 상태에서 도메인을 자동 감지합니다:

```bash
sdd context set auth
sdd new user-login     # → auth/user-login 생성
```

도메인이 여러 개인 경우 선택을 요청합니다:

```bash
sdd context set auth order
sdd new payment
# 도메인을 선택하세요: [auth] [order]
```

### sdd list

컨텍스트 범위로 필터링됩니다:

```bash
sdd context set auth
sdd list               # auth 도메인 스펙만 표시
sdd list --all         # 전체 스펙 표시
```

### sdd validate

컨텍스트 범위로 검증됩니다:

```bash
sdd context set auth
sdd validate           # auth 관련 스펙만 검증
sdd validate --all     # 전체 검증
```

## 경고

컨텍스트 외부 도메인 수정 시 경고가 표시됩니다:

```
⚠️ 경고: payment 도메인은 현재 컨텍스트에 없습니다.
계속하시겠습니까? [y/N]
```

`--force` 옵션으로 우회할 수 있습니다:

```bash
sdd new payment/refund --force
```

## 관련 문서

- [컨텍스트 가이드](../guide/context.md)
- [도메인 시스템](../guide/domains.md)
- [sdd domain](./domain.md)
