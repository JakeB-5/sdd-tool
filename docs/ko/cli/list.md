# sdd list

항목 목록을 조회합니다.

## 사용법

```bash
sdd list                       # 프로젝트 요약
sdd list <subcommand> [options]
```

별칭: `sdd ls`.

## 서브커맨드

| 커맨드 | 설명 |
|--------|------|
| `features` (`f`) | 기능 목록과 상태 |
| `changes` (`c`) | 변경 제안 목록 |
| `specs` (`s`) | 스펙 파일 트리 |
| `templates` (`t`) | `.sdd/templates/`의 템플릿 목록 |

## 옵션

| 서브커맨드 | 옵션 | 설명 |
|------------|------|------|
| `features` | `--status <status>` | 한 가지 상태만: `draft`, `review`, `approved`, `planned`, `tasked`, `implementing`, `implemented`, `deprecated` |
| `changes` | `--pending` | 대기 중인 변경만 |
| `changes` | `--archived` | 아카이브된 변경만 |

## 예시

```bash
# 요약 (기능 수, 대기 · 아카이브된 변경 수)
sdd list

# 전체 기능
sdd list features

# 구현 완료된 기능만
sdd list features --status implemented

# 대기 중인 변경 제안
sdd list changes --pending

# 스펙 파일 트리
sdd list specs
```

## 출력 예시

```
📋 기능 목록
──────────────────────────────────────────────────
📝 login (auth/login) - draft
✅ pay (billing/pay) - implemented
```

## 관련 명령어

- [`sdd status`](/ko/cli/status) - 프로젝트 상태
- [`sdd validate`](/ko/cli/validate) - 스펙 검증
