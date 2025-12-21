/**
 * 슬래시 커맨드 프롬프트 템플릿
 *
 * AI 코딩 도구용 명령어 프롬프트를 제공합니다.
 */

/**
 * 형식 규칙 가이드 (공통)
 */
export const FORMAT_GUIDE = `## 형식 규칙 (필수)

### RFC 2119 키워드

| 키워드 | 의미 | 사용 예시 |
|--------|------|-----------|
| **SHALL** / **MUST** | 절대 필수 | "시스템은 인증을 지원해야 한다(SHALL)" |
| **SHOULD** | 권장 (예외 가능) | "응답 시간은 1초 이내여야 한다(SHOULD)" |
| **MAY** | 선택적 | "다크 모드를 지원할 수 있다(MAY)" |
| **SHALL NOT** | 절대 금지 | "평문 비밀번호를 저장해서는 안 된다(SHALL NOT)" |

### GIVEN-WHEN-THEN 형식

모든 요구사항은 아래 형식의 시나리오를 포함해야 합니다:

\`\`\`markdown
### Scenario: [시나리오명]

- **GIVEN** [전제 조건]
- **WHEN** [행동/트리거]
- **THEN** [예상 결과]
\`\`\`
`;

/**
 * /sdd:change 프롬프트
 */
export const CHANGE_PROMPT = `# /sdd:change - 변경 제안

> 기존 스펙에 대한 변경을 제안합니다.

${FORMAT_GUIDE}

---

## 생성 전 체크리스트

- [ ] 변경 대상 스펙 확인됨
- [ ] 변경 사유가 명확함
- [ ] 영향 범위가 파악됨

---

## 생성할 파일

### 1. proposal.md

\`\`\`markdown
---
id: CHG-{ID}
status: draft
created: {TODAY}
---

# 변경 제안: {TITLE}

> 변경 목적 및 배경 설명

---

## 배경

왜 이 변경이 필요한가?

---

## 영향 범위

### 영향받는 스펙

- \`specs/{SPEC_PATH}\`

### 변경 유형

- [ ] 신규 추가 (ADDED)
- [ ] 수정 (MODIFIED)
- [ ] 삭제 (REMOVED)

---

## 변경 내용

(ADDED/MODIFIED/REMOVED 섹션별 상세 내용)

---

## 리스크 평가

- 영향도: 낮음/중간/높음
- 복잡도: 낮음/중간/높음
\`\`\`

---

## 생성 후 확인

- [ ] \`sdd validate .sdd/changes/{ID}/proposal.md\` 실행
- [ ] 델타 형식 확인 (ADDED/MODIFIED/REMOVED)
- [ ] 영향받는 스펙 목록 확인
`;

/**
 * /sdd:apply 프롬프트
 */
export const APPLY_PROMPT = `# /sdd:apply - 변경 적용

> 승인된 변경 제안을 스펙에 적용합니다.

---

## 적용 전 체크리스트

- [ ] proposal.md 상태가 approved인지 확인
- [ ] delta.md가 존재하는지 확인
- [ ] 영향받는 모든 스펙 파일 확인

---

## 적용 프로세스

1. delta.md에서 변경 내용 추출
2. 영향받는 스펙 파일 수정
   - ADDED: 새 섹션 추가
   - MODIFIED: 기존 섹션 수정
   - REMOVED: 해당 섹션 삭제
3. 스펙 파일 검증

---

## 적용 후 확인

- [ ] \`sdd validate\` 실행하여 모든 스펙 검증
- [ ] 변경된 스펙 파일 목록 확인
- [ ] 다음 단계: \`/sdd:archive\` 실행
`;

/**
 * /sdd:archive 프롬프트
 */
export const ARCHIVE_PROMPT = `# /sdd:archive - 변경 아카이브

> 완료된 변경 제안을 아카이브합니다.

---

## 아카이브 전 체크리스트

- [ ] 변경이 스펙에 적용되었는지 확인
- [ ] 모든 테스트가 통과하는지 확인
- [ ] 스펙 검증 통과 확인

---

## 아카이브 프로세스

1. .sdd/changes/{ID}/ 디렉토리를 .sdd/archive/로 이동
2. 아카이브 날짜를 파일명에 추가: {YYYY-MM-DD}-{ID}/
3. proposal.md 상태를 archived로 변경

---

## 아카이브 후 확인

- [ ] .sdd/changes/{ID}/ 디렉토리가 삭제됨
- [ ] .sdd/archive/{DATE}-{ID}/ 디렉토리가 생성됨
- [ ] 아카이브된 proposal.md 상태 확인
`;

/**
 * /sdd:impact 프롬프트
 */
export const IMPACT_PROMPT = `# /sdd:impact - 영향도 분석

> 스펙 변경 시 관련 스펙 및 코드에 미치는 영향을 분석합니다.

---

## 분석 전 체크리스트

- [ ] 변경할 스펙 식별됨
- [ ] 변경 범위 파악됨

---

## 분석 프로세스

1. 대상 스펙의 의존성 그래프 구축
2. 이 스펙에 의존하는 다른 스펙 식별
3. 영향도 수준 평가 (높음/중간/낮음)
4. 리스크 점수 산출 (1-10)

---

## CLI 사용법

\`\`\`bash
# 특정 기능 영향도 분석
sdd impact <feature-name>

# 의존성 그래프 출력 (Mermaid)
sdd impact --graph

# JSON 형식 출력
sdd impact <feature-name> --json
\`\`\`

---

## 영향 수준 기준

| 수준 | 기준 | 표시 |
|------|------|------|
| 높음 | 직접 의존, API 변경 | 🔴 HIGH |
| 중간 | 간접 의존, 데이터 공유 | 🟡 MEDIUM |
| 낮음 | UI 컴포넌트 공유 | 🟢 LOW |

---

## 리스크 점수 해석

- 1-3: 낮은 리스크 - 바로 진행 가능
- 4-6: 중간 리스크 - 검토 권장
- 7-10: 높은 리스크 - 신중한 검토 필요

---

## 분석 후 조치

- 높은 리스크: 관련 팀과 공유, 단계적 마이그레이션 검토
- 중간 리스크: 영향 스펙 테스트 확인
- 낮은 리스크: 표준 프로세스 진행
`;

/**
 * /sdd:new 프롬프트
 */
export const NEW_PROMPT = `# /sdd:new - 신규 기능 명세

> 새로운 기능의 명세를 작성합니다.

${FORMAT_GUIDE}

---

## 생성 전 체크리스트

- [ ] 기능 요구사항이 명확히 정의됨
- [ ] 사용자 스토리가 작성됨
- [ ] 관련 이해관계자와 논의 완료
- [ ] 기존 기능과의 충돌 여부 확인

---

## 생성할 파일

### 1. spec.md

\`\`\`markdown
---
id: {FEATURE_ID}
title: "{TITLE}"
status: draft
created: {TODAY}
depends: null
---

# {TITLE}

> {DESCRIPTION}

---

## 개요

{DESCRIPTION}

---

## 요구사항

### REQ-01: [요구사항 제목]

[요구사항 상세 설명]
- 시스템은 [기능]을 지원해야 한다(SHALL)

---

## 시나리오

### Scenario 1: [시나리오명]

- **GIVEN** [전제 조건]
- **WHEN** [행동/트리거]
- **THEN** [예상 결과]

---

## 비기능 요구사항

### 성능
- 응답 시간: [N]ms 이내 (SHOULD)

### 보안
- [보안 요구사항] (SHALL)
\`\`\`

---

## CLI 사용법

\`\`\`bash
# 기본 사용
sdd new <feature-name>

# 옵션 지정
sdd new <feature-name> --title "제목" --description "설명"

# 계획 및 작업도 함께 생성
sdd new <feature-name> --all

# 브랜치 생성 안 함
sdd new <feature-name> --no-branch
\`\`\`

---

## 생성 후 확인

- [ ] \`sdd validate .sdd/specs/{FEATURE_ID}/spec.md\` 실행
- [ ] RFC 2119 키워드 사용 확인
- [ ] GIVEN-WHEN-THEN 시나리오 포함 확인
- [ ] 다음 단계: \`/sdd:plan\` 실행
`;

/**
 * /sdd:plan 프롬프트
 */
export const PLAN_PROMPT = `# /sdd:plan - 구현 계획

> 기능 명세에 대한 구현 계획을 작성합니다.

---

## 생성 전 체크리스트

- [ ] 명세(spec.md)가 검토 완료됨
- [ ] 기술 스택 결정됨
- [ ] 아키텍처 검토 완료
- [ ] 의존성 확인

---

## 생성할 파일

### 1. plan.md

\`\`\`markdown
---
feature: {FEATURE_ID}
created: {TODAY}
status: draft
---

# 구현 계획: {TITLE}

> {OVERVIEW}

---

## 기술 결정

### 결정 1: [기술 결정 사항]

**근거:** [결정 근거]

**대안 검토:**
- [대안 1]
- [대안 2]

---

## 구현 단계

### Phase 1: 기반 구조

[기반 구조 설명]

**산출물:**
- [ ] [산출물 1]
- [ ] [산출물 2]

### Phase 2: 핵심 기능

[핵심 기능 설명]

**산출물:**
- [ ] [산출물 1]

---

## 리스크 분석

| 리스크 | 영향도 | 완화 전략 |
|--------|--------|----------|
| [리스크] | 🟡 MEDIUM | [전략] |

---

## 테스트 전략

- 단위 테스트: 커버리지 80% 이상
- 통합 테스트: API 엔드포인트
- E2E 테스트: 주요 시나리오
\`\`\`

---

## CLI 사용법

\`\`\`bash
# 계획 생성
sdd new plan <feature-id>

# 제목 지정
sdd new plan <feature-id> --title "구현 계획"
\`\`\`

---

## 생성 후 확인

- [ ] 기술 결정 근거 확인
- [ ] 구현 단계 정의
- [ ] 리스크 분석 완료
- [ ] 다음 단계: \`/sdd:tasks\` 실행
`;

/**
 * /sdd:tasks 프롬프트
 */
export const TASKS_PROMPT = `# /sdd:tasks - 작업 분해

> 구현 계획을 실행 가능한 작업으로 분해합니다.

---

## 생성 전 체크리스트

- [ ] 계획(plan.md)이 승인됨
- [ ] 작업 규모가 파악됨
- [ ] 의존성 관계 정의됨

---

## 생성할 파일

### 1. tasks.md

\`\`\`markdown
---
feature: {FEATURE_ID}
created: {TODAY}
total: {N}
completed: 0
---

# 작업 목록: {TITLE}

> 총 {N}개 작업

---

## 진행 상황

- 대기: {N}
- 진행 중: 0
- 완료: 0
- 차단됨: 0

---

## 작업 목록

### {FEATURE_ID}-task-001: [작업 제목]

- **상태:** 대기
- **우선순위:** 🔴 HIGH
- **설명:** [작업 설명]
- **관련 파일:**
  - \`src/path/to/file.ts\`
- **의존성:** 없음

### {FEATURE_ID}-task-002: [작업 제목]

- **상태:** 대기
- **우선순위:** 🟡 MEDIUM
- **의존성:** {FEATURE_ID}-task-001
\`\`\`

---

## CLI 사용법

\`\`\`bash
# 작업 분해 생성
sdd new tasks <feature-id>
\`\`\`

---

## 작업 완료 조건

각 작업 완료 시:
1. [ ] 코드 작성 완료
2. [ ] 테스트 작성 및 통과
3. [ ] 코드 리뷰 완료
4. [ ] 문서 업데이트

---

## 다음 단계

1. 첫 번째 작업부터 순차적으로 진행
2. 각 작업 완료 후 상태 업데이트
3. 모든 작업 완료 시 \`/sdd:archive\` 실행
`;

/**
 * /sdd:validate 프롬프트
 */
export const VALIDATE_PROMPT = `# /sdd:validate - 스펙 검증

> 스펙 파일의 형식과 내용을 검증합니다.

---

## 검증 대상

- .sdd/specs/ 디렉토리의 모든 스펙 파일
- .sdd/changes/ 디렉토리의 모든 변경 제안

---

## 검증 항목

### 필수 형식

1. YAML frontmatter 존재
   - status: draft | active | deprecated
   - created: YYYY-MM-DD
   - depends: null | [spec-id, ...]

2. RFC 2119 키워드 사용
   - SHALL, MUST, SHOULD, MAY, SHALL NOT

3. GIVEN-WHEN-THEN 시나리오
   - 모든 Requirement에 최소 1개 Scenario

---

## CLI 사용법

\`\`\`bash
# 전체 검증
sdd validate

# 특정 경로 검증
sdd validate .sdd/specs/feature/spec.md

# 엄격 모드 (경고도 에러로 처리)
sdd validate --strict

# 조용한 모드
sdd validate --quiet
\`\`\`

---

## 검증 결과

- ✅ PASS: 모든 검증 통과
- ⚠️ WARN: 경고 (--strict에서 실패)
- ❌ FAIL: 필수 항목 누락
`;

/**
 * 모든 프롬프트 맵
 */
export const PROMPTS: Record<string, string> = {
  change: CHANGE_PROMPT,
  apply: APPLY_PROMPT,
  archive: ARCHIVE_PROMPT,
  impact: IMPACT_PROMPT,
  validate: VALIDATE_PROMPT,
  new: NEW_PROMPT,
  plan: PLAN_PROMPT,
  tasks: TASKS_PROMPT,
};

/**
 * 프롬프트 가져오기
 */
export function getPrompt(command: string): string | undefined {
  return PROMPTS[command];
}

/**
 * 사용 가능한 명령어 목록
 */
export function getAvailableCommands(): string[] {
  return Object.keys(PROMPTS);
}
