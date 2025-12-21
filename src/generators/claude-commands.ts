/**
 * Claude Code 슬래시 커맨드 생성기
 */

export interface ClaudeCommand {
  name: string;
  content: string;
}

/**
 * SDD 워크플로우용 Claude 슬래시 커맨드 생성
 */
export function generateClaudeCommands(): ClaudeCommand[] {
  return [
    {
      name: 'sdd.start',
      content: `SDD 워크플로우를 시작합니다 (통합 진입점).

## 개요

이 커맨드는 SDD 프로젝트의 통합 진입점입니다.
현재 상태를 확인하고 적절한 워크플로우를 안내합니다.

## 지시사항

1. \`sdd start\` 명령어를 실행하여 프로젝트 상태를 확인하세요
2. 제시되는 워크플로우 메뉴에서 적절한 작업을 선택하세요
3. 각 워크플로우의 안내에 따라 진행하세요

## 사용 가능한 워크플로우

- **new-feature**: 새 기능 명세 작성
- **change-spec**: 기존 스펙 변경
- **validate**: 명세 검증
- **status**: 상태 확인
- **constitution**: Constitution 관리

## 명령어

\`\`\`bash
# 프로젝트 상태 및 워크플로우 메뉴
sdd start

# 상태만 확인
sdd start --status

# 특정 워크플로우 바로 시작
sdd start --workflow new-feature
sdd start --workflow change-spec
sdd start --workflow validate
\`\`\`

## 프로젝트 미초기화 시

프로젝트가 초기화되지 않은 경우:
1. \`sdd init\`으로 프로젝트를 초기화하세요
2. \`/sdd.constitution\`으로 프로젝트 원칙을 정의하세요
3. \`/sdd.new\`로 첫 기능 명세를 작성하세요
`,
    },
    {
      name: 'sdd.new',
      content: `새로운 기능 명세를 작성합니다.

## 지시사항

1. 사용자에게 기능명과 간단한 설명을 요청하세요
2. \`sdd new <feature-id> --all\` 명령어를 실행하여 기본 구조를 생성하세요
3. 생성된 \`.sdd/specs/<feature-id>/spec.md\` 파일을 열어 내용을 작성하세요

## 명세 작성 규칙

- RFC 2119 키워드 사용: SHALL, MUST, SHOULD, MAY, SHALL NOT
- GIVEN-WHEN-THEN 형식의 시나리오 포함 필수
- 각 요구사항에 고유 ID 부여 (REQ-001, REQ-002, ...)

## 예시

\`\`\`markdown
### REQ-01: 사용자 인증

시스템은 이메일과 비밀번호로 사용자를 인증해야 한다(SHALL).

### Scenario: 올바른 자격 증명으로 로그인

- **GIVEN** 등록된 사용자가 존재할 때
- **WHEN** 올바른 이메일과 비밀번호로 로그인을 시도하면
- **THEN** 액세스 토큰이 발급되어야 한다
\`\`\`

완료 후 \`sdd validate\`로 명세를 검증하세요.
`,
    },
    {
      name: 'sdd.plan',
      content: `기능 명세에 대한 구현 계획을 작성합니다.

## 지시사항

1. \`.sdd/specs/\` 디렉토리에서 계획을 작성할 기능을 확인하세요
2. 해당 기능의 \`spec.md\`를 읽고 요구사항을 분석하세요
3. \`sdd new plan <feature-id>\` 명령어로 계획 템플릿을 생성하거나 기존 \`plan.md\`를 수정하세요

## 계획 작성 규칙

- 기술 결정사항과 그 근거를 명시
- 구현 단계(Phase)를 나누어 정의
- 각 단계별 산출물 목록 작성
- 리스크 분석 및 완화 전략 포함
- 테스트 전략 수립

## 계획 구조

\`\`\`markdown
## 기술 결정
### 결정 1: [제목]
**근거:** [왜 이 기술/방식을 선택했는지]

## 구현 단계
### Phase 1: 기반 구조
[설명]
**산출물:**
- [ ] 산출물 1
- [ ] 산출물 2

## 리스크 분석
| 리스크 | 영향도 | 완화 전략 |
\`\`\`

완료 후 \`/sdd.tasks\`로 작업을 분해하세요.
`,
    },
    {
      name: 'sdd.tasks',
      content: `구현 계획을 실행 가능한 작업으로 분해합니다.

## 지시사항

1. 해당 기능의 \`plan.md\`를 읽고 구현 단계를 확인하세요
2. \`sdd new tasks <feature-id>\` 명령어로 작업 목록을 생성하세요
3. 각 작업에 우선순위와 상태를 지정하세요

## 작업 분해 규칙

- 각 작업은 2-4시간 내 완료 가능한 크기로 분해
- 작업 간 의존성을 명확히 표시
- 우선순위: HIGH(🔴), MEDIUM(🟡), LOW(🟢)
- 상태: 대기, 진행 중, 완료, 차단됨

## 작업 구조

\`\`\`markdown
### <feature>-task-001: [작업 제목]

- **상태:** 대기
- **우선순위:** 🔴 HIGH
- **의존성:** 없음

#### 설명
[작업 상세 설명]

#### 완료 조건
- [ ] 조건 1
- [ ] 조건 2
\`\`\`

완료 후 \`/sdd.implement\`로 구현을 시작하세요.
`,
    },
    {
      name: 'sdd.implement',
      content: `작업 목록을 기반으로 순차적으로 구현합니다.

## 지시사항

1. \`sdd status\`로 현재 진행 상황을 확인하세요
2. 해당 기능의 \`tasks.md\`를 읽고 다음 작업을 확인하세요
3. 작업을 구현하고 완료 시 상태를 업데이트하세요

## 구현 규칙

- 한 번에 하나의 작업만 진행
- 각 작업 완료 후 테스트 작성 필수
- 커밋 메시지에 작업 ID 포함
- \`.sdd/constitution.md\`의 원칙 준수

## 작업 흐름

1. 작업 상태를 "진행 중"으로 변경
2. 코드 구현
3. 테스트 작성 및 실행
4. 작업 상태를 "완료"로 변경
5. 커밋: \`feat(<feature>): <task-id> - <설명>\`

## 완료 조건

모든 작업이 완료되면:
1. \`sdd validate\`로 최종 검증
2. PR 생성 또는 머지
3. 필요시 \`/sdd.archive\`로 아카이브
`,
    },
    {
      name: 'sdd.validate',
      content: `스펙 파일의 형식과 규칙을 검증합니다.

## 지시사항

\`sdd validate\` 명령어를 실행하여 모든 스펙을 검증하세요.

## 검증 항목

1. **RFC 2119 키워드**: SHALL, MUST, SHOULD, MAY 등 포함 여부
2. **GIVEN-WHEN-THEN**: 시나리오 형식 준수 여부
3. **메타데이터**: YAML frontmatter 필수 필드 확인
4. **구조**: 필수 섹션 존재 여부

## 사용법

\`\`\`bash
# 전체 스펙 검증
sdd validate

# 특정 파일 검증
sdd validate .sdd/specs/user-auth/spec.md

# 엄격 모드 (경고도 에러로 처리)
sdd validate --strict
\`\`\`

## 오류 해결

검증 실패 시 해당 파일을 열어 오류를 수정하세요.
각 오류 메시지에는 해결 방법이 포함되어 있습니다.
`,
    },
    {
      name: 'sdd.status',
      content: `현재 SDD 프로젝트 상태를 확인합니다.

## 지시사항

\`sdd status\` 명령어를 실행하여 프로젝트 상태를 확인하세요.

## 확인 항목

- 프로젝트 구조 (constitution.md, AGENTS.md 존재 여부)
- 기능 목록 및 상태
- 현재 Git 브랜치
- 다음 단계 제안

## 추가 명령어

\`\`\`bash
# 프로젝트 요약
sdd list

# 기능 목록
sdd list features

# 스펙 파일 목록
sdd list specs

# JSON 형식 출력
sdd status --json
\`\`\`
`,
    },
    {
      name: 'sdd.change',
      content: `기존 스펙에 대한 변경을 제안합니다.

## 지시사항

1. 변경이 필요한 스펙을 확인하세요
2. \`.sdd/changes/\` 디렉토리에 변경 제안서를 작성하세요
3. 변경 유형(ADDED, MODIFIED, REMOVED)을 명시하세요

## 변경 제안서 구조

\`\`\`markdown
---
id: CHG-001
status: draft
created: YYYY-MM-DD
---

# 변경 제안: [제목]

## 배경
왜 이 변경이 필요한가?

## 영향 범위
### 영향받는 스펙
- \`specs/user-auth/spec.md\`

### 변경 유형
- [x] 수정 (MODIFIED)

## 변경 내용

### MODIFIED

#### Before
\`\`\`markdown
기존 내용
\`\`\`

#### After
\`\`\`markdown
변경된 내용
\`\`\`
\`\`\`

검토 후 승인되면 스펙에 반영하세요.
`,
    },
    {
      name: 'sdd.constitution',
      content: `프로젝트 Constitution(헌법)을 관리합니다.

## 개요

Constitution은 프로젝트의 핵심 원칙을 정의하는 문서입니다.
모든 스펙과 구현은 Constitution의 원칙을 준수해야 합니다.

## 지시사항

### 새 프로젝트 설정

1. 사용자에게 프로젝트의 핵심 가치와 원칙을 질문하세요
2. \`.sdd/constitution.md\` 파일을 열어 내용을 작성하세요
3. \`sdd constitution validate\`로 형식을 검증하세요

### 기존 Constitution 수정

1. \`sdd constitution show\`로 현재 내용을 확인하세요
2. Constitution 수정 후 버전을 업데이트하세요:
   - \`sdd constitution bump --patch -m "문구 수정"\`
   - \`sdd constitution bump --minor -m "새 원칙 추가"\`
   - \`sdd constitution bump --major -m "핵심 원칙 변경"\`

## Constitution 구조

\`\`\`markdown
---
version: 1.0.0
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Constitution: 프로젝트명

> 프로젝트 설명

## 핵심 원칙

### 1. 원칙명
- 규칙 (SHALL/MUST/SHOULD/MAY)

## 금지 사항
- 금지 규칙 (SHALL NOT/MUST NOT)

## 기술 스택
- 기술 선택

## 품질 기준
- 품질 요구사항
\`\`\`

## 버전 관리

- **MAJOR**: 핵심 원칙 변경 (기존 스펙에 영향)
- **MINOR**: 새 원칙 추가
- **PATCH**: 문구 수정, 오타 수정

## 명령어

\`\`\`bash
sdd constitution show      # 현재 Constitution 표시
sdd constitution version   # 버전만 표시
sdd constitution validate  # 형식 검증
sdd constitution history   # 변경 이력 조회
sdd constitution bump      # 버전 업데이트
\`\`\`
`,
    },
    {
      name: 'sdd.research',
      content: `기술 리서치 문서를 작성합니다.

## 개요

기술적 결정이나 아키텍처 선택 전에 필요한 리서치를 문서화합니다.
리서치 결과는 plan.md나 스펙의 근거로 활용됩니다.

## 지시사항

1. 리서치 주제와 목적을 명확히 정의하세요
2. 비교할 옵션들을 나열하세요
3. 각 옵션의 장단점을 분석하세요
4. 권장사항을 도출하세요

## 리서치 템플릿

\`\`\`markdown
# 리서치: [주제]

> 작성일: YYYY-MM-DD
> 상태: 진행중/완료

## 배경

왜 이 리서치가 필요한가?

## 비교 대상

### 옵션 A: [이름]

**장점:**
- ...

**단점:**
- ...

**적용 사례:**
- ...

### 옵션 B: [이름]

...

## 비교표

| 기준 | 옵션 A | 옵션 B |
|------|--------|--------|
| 성능 | ... | ... |
| 학습 곡선 | ... | ... |
| 커뮤니티 | ... | ... |

## 결론

**권장사항:** 옵션 X

**근거:**
1. ...
2. ...

## 참고 자료

- [링크1]
- [링크2]
\`\`\`

## 저장 위치

리서치 문서는 \`.sdd/research/\` 또는 해당 기능 디렉토리에 저장하세요.
`,
    },
    {
      name: 'sdd.data-model',
      content: `데이터 모델 문서를 작성합니다.

## 개요

시스템의 데이터 구조와 관계를 정의합니다.
이 문서는 구현의 기반이 되며, 변경 시 영향도 분석에 활용됩니다.

## 지시사항

1. 핵심 엔티티를 정의하세요
2. 각 엔티티의 속성을 나열하세요
3. 엔티티 간 관계를 정의하세요
4. ERD를 Mermaid로 작성하세요

## 데이터 모델 템플릿

\`\`\`markdown
# 데이터 모델: [시스템명]

> 작성일: YYYY-MM-DD
> 버전: 1.0.0

## 엔티티 정의

### User (사용자)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | UUID | O | 고유 식별자 |
| email | string | O | 이메일 (unique) |
| name | string | O | 사용자명 |
| created_at | datetime | O | 생성일시 |

### Post (게시글)

...

## 관계도 (ERD)

\`\`\`mermaid
erDiagram
    User ||--o{ Post : writes
    User {
        uuid id PK
        string email
        string name
    }
    Post {
        uuid id PK
        uuid user_id FK
        string title
        text content
    }
\`\`\`

## 인덱스

| 테이블 | 인덱스 | 컬럼 | 유형 |
|--------|--------|------|------|
| User | idx_user_email | email | UNIQUE |

## 제약조건

- User.email은 유일해야 한다(SHALL)
- Post.user_id는 User.id를 참조해야 한다(SHALL)
\`\`\`

## 저장 위치

데이터 모델은 \`.sdd/data-model.md\` 또는 해당 기능 디렉토리에 저장하세요.
`,
    },
    {
      name: 'sdd.prepare',
      content: `기능 구현에 필요한 환경을 준비합니다.

## 개요

새로운 기능을 구현하기 전에 필요한 도구, 의존성, 설정을 분석하고 준비합니다.

## 지시사항

1. 스펙을 분석하여 필요한 기술을 파악하세요
2. 필요한 의존성을 나열하세요
3. 필요한 MCP 서버가 있다면 확인하세요
4. AGENTS.md에 필요한 지침을 추가하세요

## 준비 체크리스트

### 1. 의존성 확인

\`\`\`bash
# 필요한 npm 패키지 확인
npm list [package-name]

# 설치 필요시
npm install [package-name]
\`\`\`

### 2. 환경 설정

- [ ] 환경 변수 확인 (.env)
- [ ] API 키 설정
- [ ] 데이터베이스 연결

### 3. MCP 서버 (필요시)

필요한 MCP 서버 목록:
- filesystem: 파일 시스템 접근
- github: GitHub API 연동
- database: 데이터베이스 접근

### 4. AGENTS.md 업데이트

기능 구현에 필요한 지침을 AGENTS.md에 추가:

\`\`\`markdown
## [기능명] 구현 지침

### 사용 기술
- ...

### 구현 규칙
- ...

### 참고 자료
- ...
\`\`\`

## 명령어

\`\`\`bash
# 프로젝트 상태 확인
sdd status

# 스펙 검증
sdd validate
\`\`\`
`,
    },
    {
      name: 'sdd.analyze',
      content: `사용자 요청을 분석하여 적절한 워크플로우를 추천합니다.

## 개요

자연어 요청을 분석하여 작업 규모를 판단하고, 적절한 SDD 워크플로우를 추천합니다.

## 분석 기준

### 작업 규모 판단

**소규모 (Small)**
- 키워드: 수정, 변경, 버그, 오타, 추가(단순)
- 워크플로우: change 또는 직접 수정

**중규모 (Medium)**
- 키워드: 기능 추가, 개선, 확장, 리팩터링
- 워크플로우: new → plan → tasks

**대규모 (Large)**
- 키워드: 시스템, 아키텍처, 마이그레이션, 전면 개편
- 워크플로우: research → new → plan → tasks → prepare

### 워크플로우 선택

| 규모 | 추천 워크플로우 | 필수 산출물 |
|------|----------------|-------------|
| Small | /sdd.change | proposal.md |
| Medium | /sdd.new → /sdd.plan | spec.md, plan.md |
| Large | /sdd.research → /sdd.new | research.md, spec.md, plan.md |

## 사용 방법

1. 사용자의 요청을 입력받습니다
2. 키워드와 컨텍스트를 분석합니다
3. 작업 규모를 판단합니다
4. 적절한 워크플로우를 추천합니다

## 예시

**입력:** "로그인 기능 추가해줘"
**분석:**
- 키워드: "기능 추가" → 중규모
- 추천: /sdd.new → /sdd.plan → /sdd.tasks → /sdd.implement

**입력:** "로그인 버튼 색상 변경"
**분석:**
- 키워드: "변경" → 소규모
- 추천: 직접 수정 또는 /sdd.change

**입력:** "마이크로서비스 아키텍처로 전환"
**분석:**
- 키워드: "아키텍처", "전환" → 대규모
- 추천: /sdd.research → /sdd.new → /sdd.plan
`,
    },
    {
      name: 'sdd.chat',
      content: `대화형 SDD 어시스턴트를 시작합니다.

## 개요

자연어로 SDD 작업을 수행할 수 있는 대화형 인터페이스입니다.
질문, 명세 작성, 검토, 구현 등 모든 SDD 워크플로우를 대화로 진행합니다.

## 대화 모드

### 1. 질문 모드 (Ask)

SDD나 현재 프로젝트에 대해 질문합니다:
- "이 스펙의 의존성은 뭐야?"
- "RFC 2119 키워드는 어떻게 사용해?"
- "다음에 뭘 해야 해?"

### 2. 작성 모드 (Write)

명세나 문서를 대화형으로 작성합니다:
- "새 기능 명세 작성해줘"
- "이 요구사항을 시나리오로 바꿔줘"
- "plan.md 작성 도와줘"

### 3. 검토 모드 (Review)

기존 명세를 검토하고 피드백합니다:
- "spec.md 검토해줘"
- "이 시나리오 괜찮아?"
- "RFC 2119 키워드 사용이 맞아?"

### 4. 실행 모드 (Execute)

SDD 명령어를 대신 실행합니다:
- "스펙 검증해줘"
- "영향도 분석해줘"
- "변경 제안 목록 보여줘"

## 컨텍스트 유지

대화 중 다음 정보를 자동으로 추적합니다:
- 현재 작업 중인 스펙
- 최근 실행한 명령어
- 발견된 문제점
- 다음 단계 제안

## 사용 예시

**대화 시작:**
> 새로운 인증 기능을 만들고 싶어

**응답:**
1. 기능 이름과 설명을 알려주세요
2. 주요 요구사항은 무엇인가요?
3. 어떤 인증 방식을 사용하나요?

**대화 진행:**
> 이메일/비밀번호 인증이야. 소셜 로그인은 나중에

**응답:**
기본 인증 스펙을 작성합니다...
[spec.md 작성 시작]

## 종료

대화를 종료하려면:
- "끝" 또는 "종료"
- 다른 슬래시 커맨드 사용
`,
    },
    {
      name: 'sdd.guide',
      content: `SDD 워크플로우 가이드를 표시합니다.

## 개요

SDD(Spec-Driven Development) 방법론의 전체 워크플로우를 안내합니다.
처음 사용자나 워크플로우를 잊었을 때 참고하세요.

## SDD 핵심 원칙

1. **명세 우선**: 코드보다 명세를 먼저 작성
2. **추적 가능성**: 모든 구현은 명세에서 추적 가능
3. **점진적 구체화**: 개요 → 상세 → 구현
4. **변경 관리**: 모든 변경은 제안 → 검토 → 적용

## 전체 워크플로우

\`\`\`
┌─────────────────────────────────────────────────┐
│                   SDD 워크플로우                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. 시작 ─────> /sdd.start 또는 sdd start      │
│     │                                           │
│     ▼                                           │
│  2. Constitution ─> /sdd.constitution          │
│     │              (프로젝트 원칙 정의)           │
│     ▼                                           │
│  3. 새 기능 ────> /sdd.new                      │
│     │            (spec.md 작성)                 │
│     ▼                                           │
│  4. 계획 ─────> /sdd.plan                       │
│     │          (plan.md 작성)                   │
│     ▼                                           │
│  5. 작업분해 ──> /sdd.tasks                     │
│     │          (tasks.md 작성)                  │
│     ▼                                           │
│  6. 구현 ─────> /sdd.implement                  │
│     │          (순차적 구현)                     │
│     ▼                                           │
│  7. 검증 ─────> /sdd.validate                   │
│     │                                           │
│     ▼                                           │
│  8. 완료 ─────> 머지 또는 배포                   │
│                                                 │
└─────────────────────────────────────────────────┘
\`\`\`

## 변경 워크플로우

기존 스펙을 수정할 때:

\`\`\`
1. /sdd.change ──> proposal.md 작성
       │
       ▼
2. sdd change validate <id> ──> 검증
       │
       ▼
3. sdd change apply <id> ──> 적용
       │
       ▼
4. sdd change archive <id> ──> 아카이브
\`\`\`

## 슬래시 커맨드 요약

| 커맨드 | 설명 | 사용 시점 |
|--------|------|----------|
| /sdd.start | 통합 진입점 | 처음 시작 시 |
| /sdd.new | 새 기능 명세 | 새 기능 개발 시 |
| /sdd.plan | 구현 계획 | 명세 완료 후 |
| /sdd.tasks | 작업 분해 | 계획 완료 후 |
| /sdd.implement | 구현 | 작업 분해 후 |
| /sdd.validate | 검증 | 구현 완료 후 |
| /sdd.change | 변경 제안 | 기존 스펙 수정 시 |
| /sdd.constitution | 헌법 관리 | 프로젝트 설정 시 |
| /sdd.chat | 대화형 모드 | 언제든지 |
| /sdd.analyze | 요청 분석 | 규모 판단 시 |

## CLI 명령어 요약

\`\`\`bash
sdd init                    # 프로젝트 초기화
sdd start                   # 워크플로우 시작
sdd new <name>              # 새 기능 생성
sdd new <name> --numbered   # 번호 자동 부여
sdd validate                # 스펙 검증
sdd validate --check-links  # 링크 검증 포함
sdd status                  # 상태 확인
sdd list                    # 스펙 목록
sdd change -l               # 변경 목록
sdd impact <spec>           # 영향도 분석
sdd transition guide        # 전환 가이드
\`\`\`

## 도움말

더 자세한 정보:
- \`sdd --help\` - CLI 도움말
- \`sdd <command> --help\` - 명령어별 도움말
`,
    },
    {
      name: 'sdd.transition',
      content: `워크플로우 간 전환을 수행합니다.

## 개요

작업 중 워크플로우를 변경해야 할 때 사용합니다:
- **new → change**: 새 기능이 기존 스펙 수정으로 변경
- **change → new**: 변경 범위가 커서 새 기능으로 분리

## new → change 전환

### 사용 시점
- 새 기능 작성 중 기존 스펙과 중복 발견
- 기존 기능 확장이 더 적절한 경우
- 의존성 분석 결과 기존 스펙 수정 필요

### 명령어

\`\`\`bash
sdd transition new-to-change <spec-id>
  -t, --title <title>    # 변경 제안 제목
  -r, --reason <reason>  # 전환 사유
\`\`\`

### 결과
- 새 변경 제안 생성 (.sdd/changes/<id>/)
- proposal.md, delta.md, tasks.md 생성
- 기존 스펙 참조 자동 설정

## change → new 전환

### 사용 시점
- 변경 범위가 너무 커서 별도 기능으로 분리 필요
- 기존 스펙과 독립적인 새 기능으로 발전
- 영향도 분석 결과 분리가 안전

### 명령어

\`\`\`bash
sdd transition change-to-new <change-id>
  -n, --name <name>      # 새 기능 이름
  -r, --reason <reason>  # 전환 사유
\`\`\`

### 결과
- 새 스펙 생성 (.sdd/specs/<name>/)
- spec.md, plan.md, tasks.md 생성
- 원본 변경 제안은 'transitioned' 상태로 변경

## 전환 판단 기준

### new → change 권장
- 영향받는 스펙 수 ≤ 3개
- 변경이 기존 기능의 자연스러운 확장
- 새 시나리오 추가보다 기존 시나리오 수정 중심

### change → new 권장
- 영향받는 스펙 수 > 3개
- 새로운 개념/도메인 도입
- 기존 스펙과 독립적으로 테스트 가능

## 가이드 보기

\`\`\`bash
sdd transition guide
\`\`\`
`,
    },
  ];
}
