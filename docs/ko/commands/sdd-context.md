# /sdd-context

작업 컨텍스트(활성 도메인)를 관리하는 스킬입니다.

## 개요

`/sdd-context`는 현재 작업 중인 도메인 범위를 설정합니다. 대규모 프로젝트에서 컨텍스트를 하나 이상의 도메인으로 좁히면 프로젝트의 다른 부분에 방해받지 않고 관련 스펙에 집중할 수 있습니다. 스킬은 해당하는 `sdd context` CLI 명령어를 실행합니다.

## 사용법

```
/sdd-context [set|show|add|remove|clear|specs] [domain...]   # Claude Code
$sdd-context [set|show|add|remove|clear|specs] [domain...]   # Codex
```

```
/sdd-context set <domain...>  # 컨텍스트 설정
/sdd-context show             # 현재 컨텍스트 표시
/sdd-context add <domain>     # 도메인 추가
/sdd-context remove <domain>  # 도메인 제거
/sdd-context clear            # 컨텍스트 해제
/sdd-context specs            # 컨텍스트 내 스펙 목록
```

## 하위 명령어

### set

활성 도메인 컨텍스트를 설정합니다. 의존하는 도메인은 기본으로 (읽기 전용 도메인으로) 포함됩니다.

```bash
sdd context set auth
sdd context set auth payment order
sdd context set auth --no-include-deps   # 의존 도메인 제외
```

### show

현재 활성 컨텍스트를 표시합니다.

```bash
sdd context show
sdd context show --json
```

### add / remove

활성 컨텍스트에 도메인을 추가하거나 제거합니다.

```bash
sdd context add order
sdd context add order --no-include-deps
sdd context remove payment
```

### clear

활성 컨텍스트를 모두 해제합니다.

```bash
sdd context clear
```

### specs

활성 컨텍스트에 포함된 모든 스펙을 나열합니다. `--json`으로 다른 도구에 넘길 수 있습니다.

```bash
sdd context specs
sdd context specs --json
```

## 컨텍스트 효과

컨텍스트가 활성화되면 범위 지정 작업이 자동으로 적용됩니다:

1. **스펙 생성**: `/sdd-spec`이 컨텍스트에서 도메인을 자동 감지
2. **검증**: `/sdd-validate`가 컨텍스트의 도메인만 검증
3. **목록**: `/sdd-list`가 컨텍스트 내 스펙만 표시
4. **구현**: 구현 중 관련 스펙이 자동으로 표시

## 예시

```
/sdd-context set payment

AI: $ sdd context set payment

    활성 도메인 (편집 가능):
      payment (스펙 3개)
    읽기 전용 도메인 (의존성):
      auth (스펙 5개)
```

## 다음 단계

- 컨텍스트 설정 후: `/sdd-spec`으로 범위 내 스펙 작성
- 작업 종료 후: `/sdd-context clear`로 범위 초기화

## 관련 명령어

- [`sdd context`](/ko/cli/context) - CLI 버전
- [`/sdd-domain`](/ko/commands/sdd-domain) - 도메인 관리
- [컨텍스트 가이드](/ko/guide/context)
