# /sdd-domain

도메인을 관리하는 스킬입니다.

## 개요

`/sdd-domain`은 SDD 프로젝트의 도메인을 생성·조회·연결·검증하고, 도메인 간 의존성과 의존성 그래프를 다룹니다. 대규모 프로젝트에서 스펙을 논리적으로 그룹화하고 서브시스템 간 의존성을 모델링할 때 사용합니다. 스킬은 해당하는 `sdd domain` CLI 명령어를 실행합니다.

## 사용법

```
/sdd-domain [create|list|show|link|depends|graph|validate] [args]   # Claude Code
$sdd-domain [create|list|show|link|depends|graph|validate] [args]   # Codex
```

```
/sdd-domain create <name>          # 도메인 생성
/sdd-domain list                   # 도메인 목록
/sdd-domain show <name>            # 상세 정보
/sdd-domain link <domain> <spec>   # 스펙 연결
/sdd-domain graph                  # 의존성 그래프
```

## 하위 명령어

### create

새 도메인을 생성합니다.

```bash
sdd domain create auth
sdd domain create payment --description "결제 처리"
```

### list

모든 도메인을 나열합니다.

```bash
sdd domain list
sdd domain list --tree      # 트리 형식
```

### show

특정 도메인의 상세 정보(설명, 연결된 스펙, 의존성)를 표시합니다.

```bash
sdd domain show auth
```

### link / unlink

스펙을 도메인에 연결하거나 연결을 해제합니다.

```bash
sdd domain link auth user-login
sdd domain unlink auth user-login
```

### depends

두 도메인 간 의존성을 설정합니다(`payment`가 `auth`에 의존).

```bash
sdd domain depends payment --on auth
sdd domain depends payment --on auth --type extends   # uses (기본) | extends | implements
sdd domain depends payment --on auth --remove         # 의존성 제거
```

### graph

도메인 의존성 그래프를 시각화합니다.

```bash
sdd domain graph                         # Mermaid 형식 (기본)
sdd domain graph --format dot            # DOT 형식
sdd domain graph --format json           # JSON (노드별 의존성 포함)
sdd domain graph --direction TD          # LR (기본) | TD | BT | RL
sdd domain graph -o docs/domains.mmd     # 파일로 저장
```

**출력 예시** (노드 레이블은 도메인 설명, 화살표 레이블은 의존성 타입):
```mermaid
graph LR
  auth["사용자 인증"]
  payment["결제 처리"]
  payment -->|uses| auth
```

### validate

도메인 구조를 검증합니다.

```bash
sdd domain validate
```

검증 항목:
- 순환 의존성 (에러)
- 잘못된 도메인 ID (`INVALID_DOMAIN_ID`)
- 존재하지 않는 도메인에 대한 의존성 (`MISSING_DEPENDENCY_DOMAIN`)
- 스펙이 없는 도메인 (`EMPTY_DOMAIN`, 정보)

고아 스펙(어떤 도메인에도 속하지 않은 스펙)은 감지하지 않습니다. 고아 스펙은 `sdd validate --orphan-specs`로 확인하세요.

::: tip CLI 전용 작업
`sdd domain delete`, `rename`, `update`는 CLI에는 있지만 스킬의 문서화된 하위 명령어에는 포함되지 않습니다. 터미널에서 실행하세요. [`sdd domain`](/ko/cli/domain)을 참고하세요.
:::

## 예시

예시 출력입니다(요약본):

```
/sdd-domain create auth --description "사용자 인증"

AI: $ sdd domain create auth --description "사용자 인증"
    도메인 생성: auth

/sdd-domain depends payment --on auth
/sdd-domain graph

AI: graph LR
      auth["사용자 인증"]
      payment["payment"]
      payment -->|uses| auth
```

## 다음 단계

- 도메인 생성 후: `/sdd-context set <domain>`으로 활성 작업 컨텍스트 설정
- 스펙 연결 후: `/sdd-domain graph`로 구조 확인

## 관련 명령어

- [`sdd domain`](/ko/cli/domain) - CLI 버전
- [`/sdd-context`](/ko/commands/sdd-context) - 컨텍스트 설정
- [도메인 시스템 가이드](/ko/guide/domains)
