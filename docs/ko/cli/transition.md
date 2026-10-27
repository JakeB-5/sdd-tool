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

`auth/login`에 대한 다음 `CHG-XXX` 변경 제안(`proposal.md`, `delta.md`, `tasks.md`)을 만듭니다:

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

`.sdd/specs/common/new-login/spec.md` 스펙(과 plan.md, tasks.md)을 만들고 원본 변경을 `transitioned` 상태로 바꿉니다.
이어서 이 파일들을 편집하세요(파일이 이미 있으므로 `sdd new plan` / `sdd new tasks`는 거부하며, 다시 생성할 때만 `--force`).

`-n`을 생략하면 기능 이름은 제안서 제목을 소문자로 바꾸고 공백을 하이픈으로 바꾼 값입니다. 그 이름이 단일 경로
세그먼트가 아니거나(`Auth/Login v2` 같은 제목은 `/`를 포함) 이미 같은 스펙이 있으면(`스펙이 이미 존재합니다`) 종료 코드 1로
실패하므로 `-n <name>`을 지정하세요. 한글 등 영어가 아닌 제목이라면 유효한 기능 이름이 되도록 항상 kebab-case 이름을 `-n`으로 주는
편이 좋습니다.

### 가이드 출력

```bash
sdd transition guide
```

## 전환 시 참고

1. **new → change**: 원본 스펙은 보존됩니다. 생성되는 제안서는 다음 `CHG-XXX` ID를 받고(아카이브된 ID는 재사용되지 않음)
   제안서 스키마 필드(`id`, `target`)를 사용하므로 `sdd change validate` / `sdd impact change`가 읽을 수 있습니다.
2. **change → new**: `transitioned` 상태는 `.sdd/changes/<id>/.status`에만 기록됩니다(새 기능 이름과 시각 포함).
   `proposal.md`는 `status: draft` 그대로이므로 `sdd list changes`와 `sdd change -l`은 여전히 `[draft]`로 표시합니다.
3. 판단 기준: 영향받는 스펙이 3개 이하이고 기존 동작을 확장하는 작업이면 변경, 영향받는 스펙이 더 많거나
   새 개념 · 도메인이 생기거나 독립적으로 테스트할 수 있으면 새 기능이 낫습니다.

## 관련 문서

- [sdd new](/cli/new) - 새 기능 생성
- [sdd change](/cli/change) - 변경 관리
- [워크플로우 가이드](/guide/workflow)
