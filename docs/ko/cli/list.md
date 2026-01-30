# sdd list

항목 목록을 조회합니다.

## 사용법

```bash
sdd list [type]
```

## 인자

| 인자 | 설명 | 기본값 |
|------|------|--------|
| `type` | 목록 유형 (specs, changes, all) | `specs` |

## 옵션

| 옵션 | 설명 |
|------|------|
| `--phase <n>` | 특정 Phase만 표시 |
| `--status <status>` | 특정 상태만 표시 |
| `--json` | JSON 형식 출력 |

## 예시

```bash
# 모든 스펙 목록
sdd list

# 특정 Phase 스펙
sdd list --phase 1

# 변경 제안 목록
sdd list changes

# JSON 출력
sdd list --json
```

## 출력 예시

```
📋 스펙 목록 (12개)

Phase 1:
  ✅ user-auth (implemented)
  ✅ data-model (implemented)
  📝 api-design (review)
  📄 error-handling (draft)

Phase 2:
  ✅ search-feature (approved)
  ...
```

## 관련 명령어

- [`sdd status`](/cli/status) - 프로젝트 상태
- [`sdd validate`](/cli/validate) - 스펙 검증
