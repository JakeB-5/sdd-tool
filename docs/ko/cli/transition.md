# sdd transition

new ↔ change 워크플로우 간 전환을 관리합니다.

## 사용법

```bash
sdd transition [command] [options]
```

## 서브커맨드

| 커맨드 | 설명 |
|--------|------|
| `to-change <spec-id>` | new → change 워크플로우로 전환 |
| `to-new <change-id>` | change → new 워크플로우로 전환 |
| `status` | 현재 워크플로우 상태 확인 |

## 옵션

| 옵션 | 설명 |
|------|------|
| `--dry-run` | 실제 변경 없이 미리보기 |
| `--force` | 경고 무시하고 강제 전환 |

## 워크플로우 전환이 필요한 경우

### new → change 전환

- 이미 구현된 기능에 변경이 필요할 때
- 기존 스펙을 기반으로 개선이 필요할 때
- 버그 수정이나 리팩토링이 필요할 때

### change → new 전환

- 변경 범위가 너무 커서 새 기능으로 분리해야 할 때
- 기존 스펙과 완전히 다른 접근이 필요할 때

## 예시

### new에서 change로 전환

```bash
sdd transition to-change user-auth
```

출력:
```
🔄 워크플로우 전환: new → change

📄 원본 스펙: user-auth
   상태: approved
   도메인: auth

생성될 변경 제안:
  • ID: CHG-005
  • 경로: .sdd/changes/CHG-005/

전환하시겠습니까? (y/n): y

✅ 전환 완료!
   변경 제안: CHG-005
   다음 단계: sdd change show CHG-005
```

### change에서 new로 전환

```bash
sdd transition to-new CHG-003
```

출력:
```
🔄 워크플로우 전환: change → new

📋 원본 변경: CHG-003
   제목: API 응답 형식 전면 개편
   영향 스펙: 5개

⚠️  경고: 이 변경은 5개 스펙에 영향을 미칩니다.
   새 기능으로 분리하면 기존 변경 제안은 취소됩니다.

계속하시겠습니까? (y/n): y

생성될 스펙:
  • ID: api-v2-response
  • 경로: .sdd/specs/api/api-v2-response/

✅ 전환 완료!
   새 스펙: api-v2-response
   원본 변경(CHG-003)은 취소됨으로 표시됩니다.
```

### 현재 상태 확인

```bash
sdd transition status
```

출력:
```
=== 워크플로우 상태 ===

📋 New 워크플로우:
  • 진행 중: 2개 스펙
    - user-profile (draft)
    - payment-gateway (plan)

📋 Change 워크플로우:
  • 진행 중: 1개 변경
    - CHG-004: 로그인 UX 개선 (review)

💡 전환 가능:
  • user-profile → change로 전환 가능 (이미 approved 상태)
  • CHG-004 → new로 전환 가능 (변경 범위 대형)
```

### 미리보기 (dry-run)

```bash
sdd transition to-change user-auth --dry-run
```

출력:
```
🔍 [DRY-RUN] 워크플로우 전환 미리보기

📄 원본 스펙: user-auth

생성될 파일:
  • .sdd/changes/CHG-005/proposal.md
  • .sdd/changes/CHG-005/delta.md

변경되는 파일:
  • 없음

(실제 파일은 변경되지 않았습니다)
```

## 전환 시 주의사항

1. **new → change**: 원본 스펙은 유지됩니다
2. **change → new**: 원본 변경 제안은 취소됨으로 표시됩니다
3. **진행 중인 작업**: 진행 중인 작업이 있으면 경고가 표시됩니다

## 관련 문서

- [sdd new](/cli/new) - 새 기능 생성
- [sdd change](/cli/change) - 변경 관리
- [워크플로우 가이드](/guide/workflow)
