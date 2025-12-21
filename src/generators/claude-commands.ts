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
      name: 'sdd-new',
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
      name: 'sdd-plan',
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

완료 후 \`/sdd-tasks\`로 작업을 분해하세요.
`,
    },
    {
      name: 'sdd-tasks',
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

완료 후 \`/sdd-implement\`로 구현을 시작하세요.
`,
    },
    {
      name: 'sdd-implement',
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
3. 필요시 \`/sdd-archive\`로 아카이브
`,
    },
    {
      name: 'sdd-validate',
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
      name: 'sdd-status',
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
      name: 'sdd-change',
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
  ];
}
