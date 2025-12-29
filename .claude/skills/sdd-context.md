# /sdd-context

작업 컨텍스트를 설정하고 관리합니다. 대규모 프로젝트에서 특정 도메인에 집중할 때 유용합니다.

## 사용법

```
/sdd-context set <domain>     # 컨텍스트 설정
/sdd-context show             # 현재 컨텍스트 표시
/sdd-context clear            # 컨텍스트 해제
/sdd-context add <domain>     # 도메인 추가
/sdd-context remove <domain>  # 도메인 제거
/sdd-context specs            # 컨텍스트 내 스펙 목록
```

## 컨텍스트란?

컨텍스트는 현재 작업 중인 도메인 범위를 정의합니다. 컨텍스트가 설정되면:

- 해당 도메인의 스펙만 표시됩니다
- 의존 도메인은 읽기 전용으로 포함됩니다
- AI 어시스턴트가 도메인 경계를 인식합니다

## 주요 기능

### 컨텍스트 설정

```
/sdd-context set auth
/sdd-context set auth order       # 여러 도메인
/sdd-context set auth --include-deps  # 의존 도메인 포함
```

### 현재 컨텍스트 확인

```
/sdd-context show
```

출력 예시:
```
현재 컨텍스트:
  활성: auth
  읽기전용: core
  스펙 수: 5
```

### 도메인 추가/제거

```
/sdd-context add payment     # 도메인 추가
/sdd-context remove order    # 도메인 제거
```

### 컨텍스트 내 스펙 조회

```
/sdd-context specs
/sdd-context specs --status draft
```

### 컨텍스트 해제

```
/sdd-context clear
```

## 사용 사례

### 1. 단일 도메인 작업

```
/sdd-context set auth
# auth 도메인의 스펙만 보이고 수정 가능
# core 도메인은 읽기 전용
```

### 2. 관련 도메인 함께 작업

```
/sdd-context set auth payment --include-deps
# auth, payment, 그리고 공통 의존 도메인 포함
```

### 3. 대규모 프로젝트 탐색

```
/sdd-context set core
/sdd-context specs              # core 스펙만 조회
/sdd-context add utils
/sdd-context specs              # core + utils 스펙 조회
```

## 컨텍스트 파일

컨텍스트 상태는 `.sdd/.context.json`에 저장됩니다:

```json
{
  "active_domains": ["auth"],
  "read_only_domains": ["core"],
  "updated_at": "2025-12-29T10:00:00Z"
}
```

## 참고사항

- 컨텍스트는 세션에 유지됩니다
- CLAUDE.md 생성 시 컨텍스트가 반영됩니다
- 컨텍스트 밖의 도메인 수정 시 경고가 표시됩니다
- `sdd new` 명령이 컨텍스트 도메인을 자동 감지합니다
