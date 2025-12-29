# /sdd-domain

도메인을 관리하고 의존성 그래프를 시각화합니다.

## 사용법

```
/sdd-domain list                 # 도메인 목록 조회
/sdd-domain show <name>          # 도메인 상세 정보
/sdd-domain create <name>        # 새 도메인 생성
/sdd-domain graph                # 의존성 그래프
/sdd-domain depends <from> <to>  # 의존성 추가
```

## 주요 기능

### 도메인 목록 조회

프로젝트의 모든 도메인을 조회합니다.

```
/sdd-domain list
/sdd-domain list --tree          # 의존성 트리 형태
/sdd-domain list --json          # JSON 출력
```

### 도메인 생성

새 도메인을 생성합니다.

```
/sdd-domain create auth
/sdd-domain create auth --description "인증/인가"
/sdd-domain create auth --path "src/auth"
/sdd-domain create auth --depends-on core
```

### 도메인 상세 정보

특정 도메인의 상세 정보를 조회합니다.

```
/sdd-domain show auth
```

출력 예시:
```
# auth 도메인
설명: 인증/인가
경로: src/auth
의존성: core (uses)

스펙 목록 (3):
  - user-login (approved)
  - oauth-google (draft)
  - session-management (review)
```

### 의존성 그래프

도메인 간 의존성을 시각화합니다.

```
/sdd-domain graph
/sdd-domain graph --format mermaid
/sdd-domain graph --format dot
/sdd-domain graph --output graph.md
```

### 스펙 연결

스펙을 도메인에 연결하거나 해제합니다.

```
/sdd-domain link auth user-login
/sdd-domain unlink auth user-login
```

### 의존성 관리

도메인 간 의존성을 추가하거나 제거합니다.

```
/sdd-domain depends order --on auth
/sdd-domain depends order --on auth --type uses
/sdd-domain depends order --on auth --remove
```

## 도메인 구조

도메인은 `.sdd/domains.yml` 파일로 관리됩니다:

```yaml
version: "1.0"
domains:
  core:
    description: "핵심 기능"
    path: "src/core"
    specs: [data-model, common-utils]
  auth:
    description: "인증/인가"
    path: "src/auth"
    dependencies:
      uses: [core]
```

## 참고사항

- 도메인은 스펙의 논리적 그룹입니다
- 순환 의존성은 자동으로 감지됩니다
- `sdd validate --domain` 으로 도메인 검증 가능
