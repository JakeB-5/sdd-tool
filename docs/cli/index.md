# CLI 명령어

SDD Tool CLI 명령어 레퍼런스입니다.

## 명령어 목록

| 명령어 | 설명 |
|--------|------|
| [`sdd init`](/cli/init) | 프로젝트 초기화 |
| [`sdd new`](/cli/new) | 새 기능 생성 |
| [`sdd validate`](/cli/validate) | 스펙 검증 |
| [`sdd prepare`](/cli/prepare) | 도구 점검 |
| [`sdd status`](/cli/status) | 프로젝트 상태 |
| [`sdd list`](/cli/list) | 항목 목록 |
| [`sdd sync`](/cli/sync) | 스펙-코드 동기화 |
| [`sdd diff`](/cli/diff) | 스펙 변경사항 |
| [`sdd export`](/cli/export) | 스펙 내보내기 |

## 전역 옵션

모든 명령어에서 사용 가능한 옵션:

```bash
sdd <command> --help     # 도움말
sdd <command> --version  # 버전
```

## 사용 예시

```bash
# 프로젝트 초기화
sdd init

# 새 기능 생성 (spec + plan + tasks)
sdd new user-auth --all

# 스펙 검증
sdd validate

# 스펙-코드 동기화 확인
sdd sync

# HTML로 스펙 내보내기
sdd export --all --format html
```
