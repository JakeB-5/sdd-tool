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
  validate: VALIDATE_PROMPT,
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
