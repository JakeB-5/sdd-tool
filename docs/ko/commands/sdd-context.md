# /sdd-context

작업 컨텍스트를 관리하는 슬래시 커맨드입니다.

## 개요

`/sdd-context`는 현재 작업 중인 도메인 범위를 설정합니다. 대규모 프로젝트에서 관련 스펙만 집중하여 작업할 때 사용합니다.

## 사용법

```
/sdd-context set <domain...>  # 컨텍스트 설정
/sdd-context show             # 현재 컨텍스트
/sdd-context clear            # 컨텍스트 해제
/sdd-context specs            # 컨텍스트 내 스펙 목록
```

## 하위 명령어

### set

작업 컨텍스트를 설정합니다.

```
/sdd-context set auth
/sdd-context set auth payment order
/sdd-context set auth --no-include-deps  # 의존 도메인 제외
```

의존 도메인은 기본적으로 포함됩니다.

### show

현재 설정된 컨텍스트를 표시합니다.

```
/sdd-context show
```

**출력:**
```
🎯 현재 컨텍스트: auth, payment

포함된 도메인:
  - auth (5 specs)
  - payment (3 specs)

의존 도메인:
  - core (자동 포함)
```

### add / remove

컨텍스트에 도메인을 추가하거나 제거합니다.

```
/sdd-context add order
/sdd-context remove payment
```

### clear

컨텍스트를 해제합니다.

```
/sdd-context clear
```

### specs

컨텍스트 내 스펙 목록을 표시합니다.

```
/sdd-context specs
```

**출력:**
```
📋 컨텍스트 스펙 (8개):

auth/
  - user-login
  - user-registration
  - token-management

payment/
  - checkout
  - refund
```

## 컨텍스트 효과

컨텍스트가 설정되면:

1. **스펙 생성**: `/sdd-spec`에서 도메인 자동 감지
2. **검증**: `/sdd-validate`에서 해당 도메인만 검증
3. **목록**: `/sdd-list`에서 컨텍스트 스펙만 표시
4. **구현**: `/sdd-implement`에서 관련 스펙 참조

## 예시

```
User: /sdd-context set auth payment

Claude: 🎯 컨텍스트 설정 완료!

현재 컨텍스트: auth, payment

포함된 스펙:
  auth/
    - user-login
    - user-registration
  payment/
    - checkout
    - payment-methods

이제 이 도메인들을 중심으로 작업합니다.

---

User: /sdd-context specs

Claude: 📋 컨텍스트 스펙 목록:

auth/ (3 specs)
  ✅ user-login [완료]
  🔄 user-registration [진행중]
  ⏳ password-reset [대기]

payment/ (2 specs)
  ✅ checkout [완료]
  ⏳ refund [대기]

```

## 관련 명령어

- [`sdd context`](/cli/context) - CLI 버전
- [`/sdd-domain`](/commands/sdd-domain) - 도메인 관리
- [컨텍스트 가이드](/guide/context)
