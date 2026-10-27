# 워크플로우

SDD Tool의 전체 워크플로우를 이해합니다.

아래 단계는 스킬입니다. Claude Code에서는 `/sdd-spec`, Codex에서는 `$sdd-spec`처럼 호출합니다(이름과 동작은 같음).
`sdd ...` 줄은 터미널에서도 실행할 수 있는 CLI 명령입니다.

## 워크플로우 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                    SDD 워크플로우                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. /sdd-start        → 워크플로우 시작                      │
│     │                                                       │
│     ▼                                                       │
│  2. /sdd-constitution → 프로젝트 원칙 정의                   │
│     │                                                       │
│     ▼                                                       │
│  3. /sdd-spec         → 기능 명세 작성/수정 (spec.md)        │
│     │                                                       │
│     ▼                                                       │
│  4. /sdd-plan         → 구현 계획 수립 (plan.md)             │
│     │                                                       │
│     ▼                                                       │
│  5. /sdd-tasks        → 작업 분해 (tasks.md)                 │
│     │                                                       │
│     ▼                                                       │
│  6. /sdd-prepare      → 서브에이전트/스킬 점검                │
│     │                                                       │
│     ▼                                                       │
│  7. /sdd-implement    → 순차적 구현                          │
│     │                                                       │
│     ▼                                                       │
│  8. /sdd-validate     → 명세 검증                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 각 단계 상세

### 1. /sdd-start

프로젝트 상태를 분석하고 다음 작업을 안내합니다.

- **신규 프로젝트**: Constitution 작성 권장
- **기존 프로젝트**: 워크플로우 선택 메뉴 제공

### 2. /sdd-constitution

프로젝트의 핵심 원칙을 정의합니다.

- 핵심 원칙 (Core Principles)
- 기술 원칙 (Technical Principles)
- 금지 사항 (Forbidden)

### 3. /sdd-spec

기능 명세를 AI와 함께 작성하거나 수정합니다.

- 새 기능 작성과 기존 스펙 수정을 자동 판단
- `sdd new <domain>/<feature> --all` 실행: 없는 도메인을 만들고(도메인이 없으면 `common`), (`--no-branch`가 아니면)
  `feature/<id>` 브랜치로 전환하고, spec.md · plan.md · tasks.md · checklist.md를 생성.
  기존 파일은 `--force` 없이는 덮어쓰지 않음
- 요구사항은 `### REQ-01: 제목` 헤딩으로 정의하며 스펙 안에서 고유
- RFC 2119 키워드 사용
- GIVEN-WHEN-THEN 시나리오
- 다른 스펙에 대한 의존성은 frontmatter `depends: [<domain>/<feature>]` (없으면 `[]`)

### 4. /sdd-plan

구현 계획을 수립합니다 (`--all`이 이미 만든 plan.md를 편집).

- 기술 결정사항과 근거
- 구현 단계(Phase) 정의
- 리스크 분석

### 5. /sdd-tasks

작업을 실행 가능한 단위로 분해합니다 (`--all`이 이미 만든 tasks.md를 편집).

- 각 작업은 `### <feature>-task-001: 제목` 헤딩 뒤에 `**상태:**`, `**우선순위:**`, `**설명:**`, `**의존성:**` 줄
  (영어 `**Status:**` / `**Priority:**` / `**Description:**` / `**Dependencies:**` 라벨도 읽음)
- 2-4시간 내 완료 가능한 크기
- 작업 간 의존성 표시 (없으면 `없음` / `none`)
- 우선순위 설정
- 테스트 우선: 구현 전에 실패하는 테스트를 먼저 작성

### 6. /sdd-prepare

구현에 필요한 도구를 점검합니다.

- 서브에이전트 확인
- 스킬 확인
- 누락된 도구 자동 생성

### 7. /sdd-implement

테스트 우선 방식으로 순차적 구현합니다.

1. 작업 상태를 "진행 중"으로 변경: `sdd new task <feature> <task-id> in-progress`
2. 실패하는 테스트 작성 (`@spec <domain>/<feature>#REQ-01`로 요구사항 참조)
3. 테스트가 통과하도록 코드 구현
4. 작업 상태를 "완료"로 변경: `sdd new task <feature> <task-id> completed`

`<feature>`는 `<domain>/<feature>` 또는 유일한 기능 이름입니다. 작업 상태 값은 `pending`, `in-progress`, `completed`,
`blocked`(또는 `대기`, `진행 중`, `완료`, `차단됨`)이며, 실행할 때마다 tasks.md의 진행 상황 블록과 `completed:` /
`total:` 필드를 다시 계산합니다. `sdd new status <feature> <status>`는 스펙 상태
(`draft`, `review`, `approved`, `planned`, `tasked`, `implementing`, `implemented`, `deprecated`)를 설정합니다.

### 8. /sdd-validate

명세 검증을 수행합니다.

- RFC 2119 키워드 사용 여부
- GIVEN-WHEN-THEN 형식 준수
- 메타데이터 필수 필드 확인

이후 터미널에서 마무리합니다:

```bash
sdd validate
sdd sync                              # 헤딩으로 정의된 모든 REQ-xx가 코드나 테스트에서 참조되어야 함
sdd new status <feature> implemented  # 모든 작업이 완료되면 `sdd status`가 이를 제안
```

## 변경 관리 워크플로우

기존 기능을 수정할 때:

```
/sdd-spec     → 스펙 수정 (기존 스펙 자동 감지, 큰 변경은 변경 제안:
                sdd change -t "<제목>" -s <spec>, 여러 스펙은 -s 반복)
    ↓
/sdd-impact   → 영향도 분석 (sdd impact <spec>)
    ↓
.sdd/changes/<id>/delta.md를 참고해 스펙 수정 및 구현
    ↓
sdd change apply <id>      → 제안을 적용됨으로 표시 (스펙은 자동으로 수정되지 않음)
    ↓
sdd change archive <id>
```

## 파일 구조

```
.sdd/
├── constitution.md     # 프로젝트 헌법
├── domains.yml         # 도메인 (필요 시 생성)
├── specs/              # 기능 명세
│   └── <domain>/<feature>/
│       ├── spec.md      # 명세
│       ├── plan.md      # 구현 계획
│       ├── tasks.md     # 작업 분해
│       └── checklist.md # 워크플로우 체크리스트
├── changes/            # 변경 제안 (proposal.md, delta.md)
└── archive/            # 완료된 변경
```
