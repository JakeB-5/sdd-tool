# sdd transition

새 기능 워크플로우와 변경 워크플로우 사이의 전환을 관리합니다.

## 사용법

```bash
sdd transition <subcommand> [options]
```

## 서브커맨드

| 커맨드 | 설명 |
|--------|------|
| `new-to-change <spec-id>` | 새 기능 작업을 기존 스펙에 대한 변경 제안으로 전환 |
| `change-to-new <change-id>` | 변경 제안을 새 기능 스펙으로 전환 |
| `guide` | 전환 가이드 출력 |

## 옵션

| 서브커맨드 | 옵션 | 설명 |
|------------|------|------|
| `new-to-change` | `-t, --title <title>` | 변경 제안 제목 |
| `new-to-change` | `-r, --reason <reason>` | 전환 사유 |
| `change-to-new` | `-n, --name <name>` | 새 기능 이름 |
| `change-to-new` | `-r, --reason <reason>` | 전환 사유 |

## 워크플로우 전환이 필요한 경우

### new → change 전환

- 새 스펙을 쓰다가 기존 스펙과 중복을 발견했을 때
- 기존 기능을 확장하는 편이 더 적절할 때
- 의존성 분석 결과 기존 스펙을 수정해야 할 때

### change → new 전환

- 변경 범위가 너무 커서 별도 기능으로 분리해야 할 때
- 기존 스펙과 독립적인 기능으로 발전했을 때

## 예시

### new → change 전환

```bash
sdd transition new-to-change auth/login -r "기존 로그인 확장"
```

`auth/login`에 대한 다음 `CHG-XXX` 변경 제안(`proposal.md`, `delta.md`)을 만듭니다:

```
✓ 전환 완료! 변경 제안이 생성되었습니다.

ℹ 변경 ID: CHG-002
ℹ 위치: .sdd/changes/CHG-002/
```

이후 제안서와 delta를 편집하고 `sdd change validate CHG-002`, `sdd change apply CHG-002`를 실행하세요.

### change → new 전환

```bash
sdd transition change-to-new CHG-002 -n new-login
```

`.sdd/specs/common/new-login/spec.md` 스펙을 만들고 원본 변경을 `transitioned` 상태로 바꿉니다.
이어서 `sdd new plan common/new-login`, `sdd new tasks common/new-login`을 진행하세요.

### 가이드 출력

```bash
sdd transition guide
```

## 전환 시 참고

1. **new → change**: 원본 스펙은 보존됩니다. 생성되는 제안서는 다음 `CHG-XXX` ID를 받고(아카이브된 ID는 재사용되지 않음)
   제안서 스키마 필드(`id`, `target`)를 사용하므로 `sdd change validate` / `sdd impact change`가 읽을 수 있습니다.
2. **change → new**: 원본 변경 제안은 `transitioned` 상태로 표시됩니다.
3. 판단 기준: 영향받는 스펙이 3개 이하이고 기존 동작을 확장하는 작업이면 변경, 영향받는 스펙이 더 많거나
   새 개념 · 도메인이 생기거나 독립적으로 테스트할 수 있으면 새 기능이 낫습니다.

## 관련 문서

- [sdd new](/cli/new) - 새 기능 생성
- [sdd change](/cli/change) - 변경 관리
- [워크플로우 가이드](/guide/workflow)
