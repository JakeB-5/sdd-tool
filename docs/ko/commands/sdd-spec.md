# /sdd-spec

기능 명세를 작성하거나 수정합니다. (통합 진입점)

## 개요

`/sdd-spec`은 요청이 새 기능인지 기존 기능의 수정인지 판단해 알맞은 워크플로우를 따릅니다. 큰 수정은 `.sdd/changes/CHG-xxx/` 아래의 변경 제안을 거칩니다.

## 사용법

```
/sdd-spec <domain>/<feature>
```

Codex에서는 `$sdd-spec <domain>/<feature>`로 호출합니다.

## 인수

| 인수 | 설명 |
|------|------|
| domain/feature | 도메인과 기능 이름 (예: `auth/login`). 생략하면 스킬이 물어봅니다 |

## 동작

1. 도메인과 기능 이름 확인 (인수 또는 질문)
2. `.sdd/specs/<domain>/<feature>/spec.md` 존재 여부 확인
3. 스펙이 없으면 새 기능 워크플로우, 있으면 변경 규모에 따라 분기

### 새 기능 (스펙 없음)

```bash
sdd new <domain>/<feature> --all
```

- `.sdd/specs/<domain>/<feature>/`에 `spec.md`, `plan.md`, `tasks.md`, `checklist.md` 생성
- 없는 도메인은 자동으로 생성됩니다(안내 메시지 출력). 도메인을 생략하면 `common`, 현재 컨텍스트(`/sdd-context`)에 활성 도메인이 하나 있으면 그 도메인에 만들어집니다
- 현재 브랜치에서 `feature/<feature>` git 브랜치를 만들고 전환합니다. 이미 작업 브랜치 위라면(예: 한 브랜치에서 여러 기능) `--no-branch`를 붙이세요. 그렇지 않으면 새 기능마다 이전 기능의 브랜치에서 갈라집니다
- 기존 파일은 덮어쓰지 않습니다(종료 코드 1). `--force`는 처음부터 다시 생성할 때만 사용합니다
- 스펙은 `status: draft`로 시작합니다. frontmatter를 직접 고치지 말고 `sdd new status <feature> <status>`(`draft`, `review`, `approved`, `planned`, `tasked`, `implementing`, `implemented`, `deprecated`)로 바꿉니다
- `--all` 이후에는 생성된 `plan.md`와 `tasks.md`를 편집하세요(`/sdd-plan`, `/sdd-tasks`). `sdd new plan` / `sdd new tasks`를 다시 실행하지 않습니다

### 기존 스펙 수정 (스펙 있음)

**작은 수정** (오타, 문구 수정, 요구사항 1-2개 추가):
- `spec.md` 직접 편집
- `sdd validate`로 검증

**큰 변경** (여러 요구사항 변경, 구조 변경, 삭제):
- 변경 제안 생성: `sdd change -t "<제목>" -s <feature>`
- `.sdd/changes/CHG-xxx/proposal.md`와 `delta.md`가 생성되며, 작업 목록이 필요하면 같은 디렉토리에 `tasks.md`를 추가합니다
- delta(ADDED / MODIFIED / REMOVED)를 작성한 뒤 `sdd change validate <id>`, `sdd change apply <id>`, `sdd change archive <id>` 순서로 진행합니다

## 변경 규모 기준

| 규모 | 예시 | 권장 방식 |
|------|------|-----------|
| 소 | 오타 수정, 문구 개선 | 직접 편집 |
| 중 | 요구사항 1-2개 추가 | 직접 편집 |
| 대 | 요구사항 3개 이상 변경 | 변경 제안 |
| 대 | 기존 요구사항 삭제 | 변경 제안 |
| 대 | 시나리오 구조 변경 | 변경 제안 |

## 스펙 작성 규칙

- RFC 2119 키워드 사용: SHALL, MUST, SHOULD, MAY, SHALL NOT
- 요구사항은 `### REQ-01: 제목` 헤딩으로 정의합니다. `sdd sync`는 정의 헤딩만 요구사항으로 세며, 본문·표·목록에 적은 REQ ID는 참조로 취급합니다
- REQ ID는 스펙마다 처음부터 시작합니다. 다른 스펙의 요구사항을 언급할 때는 `<domain>/<feature>#REQ-xx`로 한정해 적습니다
- 모든 요구사항은 GIVEN-WHEN-THEN 시나리오로 하나 이상 다뤄야 합니다. `sdd new`가 생성하는 구조(요구사항 섹션, 그리고 다루는 요구사항을 이름에 적은 시나리오 섹션)를 유지하세요. 요구사항 바로 아래의 `#### Scenario:`도 허용됩니다
- 의존성은 frontmatter `depends`에 `<domain>/<feature>` id의 YAML 목록으로 선언합니다. 예: `depends: [pricing/cart, auth/session]`, 없으면 `depends: []`. `/sdd-impact`는 `depends`만 의존성으로 보며, 본문에서 다른 스펙을 언급하는 것은 참조일 뿐입니다

```markdown
## 요구사항

### REQ-01: 사용자 인증

시스템은 이메일과 비밀번호로 사용자를 인증해야 한다(SHALL).

## 시나리오

### Scenario 1: 올바른 자격 증명으로 로그인 (REQ-01)

- **GIVEN** 등록된 사용자가 존재한다
- **WHEN** 사용자가 올바른 이메일과 비밀번호를 제출한다
- **THEN** 액세스 토큰이 발급되어야 한다(SHALL)
```

## 추적성

코드와 테스트는 `@spec <domain>/<feature>#REQ-xx` 형식(주석 또는 테스트 제목)으로 요구사항을 참조합니다. 한정하지 않은 `REQ-xx`는 그 ID를 가진 스펙이 하나일 때만 인정됩니다. `/sdd-implement`가 이 참조를 추가하고, `sdd sync`가 어떤 요구사항이 다뤄지는지 보고합니다.

## 예시

### 새 기능 생성

```
/sdd-spec auth/login

AI: .sdd/specs/ 확인 중...
    -> auth/login 없음. 새 기능으로 생성합니다.
    -> 실행: sdd new auth/login --all
    -> spec.md 작성을 안내합니다
```

### 기존 스펙 수정

```
/sdd-spec auth/login   (소셜 로그인 추가)

AI: .sdd/specs/ 확인 중...
    -> auth/login/spec.md가 있습니다.
    -> 요구사항 1개 추가: 작은 변경이므로 spec.md를 직접 수정합니다.
    -> spec.md에 REQ-03: 소셜 로그인 추가 후 sdd validate 실행
```

## 생성 파일

```
.sdd/specs/<domain>/<feature>/
├── spec.md        # 기능 명세
├── plan.md        # 구현 계획
├── tasks.md       # 작업 분해
└── checklist.md   # 체크리스트
```

## 다음 단계

- 새 스펙 작성 후: `/sdd-plan` -> `/sdd-tasks` -> `/sdd-implement`
- 스펙 수정 후: `sdd validate` -> 커밋

## 관련 명령어

| 명령어 | 설명 |
|--------|------|
| `/sdd-plan` | 구현 계획 작성 |
| `/sdd-tasks` | 작업 분해 |
| `/sdd-validate` | 스펙 검증 |
| `/sdd-impact` | 변경 영향도 분석 |
