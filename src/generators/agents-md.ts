/**
 * AGENTS.md 생성기
 *
 * 상단 50줄 내에 모든 필수 형식 규칙을 배치합니다.
 */
import { ParsedConstitution } from '../core/constitution/schemas.js';

export interface AgentsGeneratorOptions {
  projectName: string;
  projectDescription?: string;
  constitution?: ParsedConstitution;
}

/**
 * AGENTS.md 생성
 *
 * 스펙 06-agents-generation 요구사항:
 * - 상단 50줄 내에 모든 필수 형식 규칙 포함
 * - RFC 2119 키워드 설명
 * - GIVEN-WHEN-THEN 형식 설명
 * - 워크플로우 지침
 */
export function generateAgentsMd(options: AgentsGeneratorOptions): string {
  const { projectName, projectDescription = '(프로젝트 설명을 추가하세요)' } = options;

  // 상단 50줄 내에 필수 규칙을 배치
  return `# SDD Workflow Guide

> **${projectName}** - AI 에이전트 워크플로우 지침서

---

## 필수 형식 규칙 (이 섹션은 상단 50줄 내에 있어야 함)

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

---

## 프로젝트 개요

**프로젝트**: ${projectName}
**설명**: ${projectDescription}

---

## 디렉토리 구조

\`\`\`
.sdd/
├── constitution.md    # 프로젝트 헌법 (원칙, 제약)
├── AGENTS.md          # 이 파일 (AI 워크플로우 지침)
├── specs/             # 스펙 문서
│   └── <feature>/
│       └── spec.md
├── changes/           # 변경 제안
│   └── <id>/
│       ├── proposal.md
│       ├── delta.md
│       └── tasks.md
├── archive/           # 완료된 변경
└── templates/         # 템플릿 파일
\`\`\`

---

## 워크플로우

### 신규 기능 워크플로우

1. \`/sdd:new <feature>\` - 스펙 초안 작성
2. \`/sdd:plan\` - 구현 계획 수립
3. \`/sdd:tasks\` - 작업 분해 (마커: [P1-3], [→T], [US])
4. 순차적 구현 및 테스트
5. 리뷰 및 머지

### 변경 워크플로우

1. \`/sdd:change <id>\` - 제안서(proposal.md) 작성
2. delta.md 작성 (ADDED/MODIFIED/REMOVED)
3. tasks.md 작업 목록 생성
4. 구현
5. \`/sdd:apply\` - 델타를 스펙에 병합
6. \`/sdd:archive\` - 완료된 변경 아카이브

---

## 검증

스펙 변경 후 항상 검증을 실행하세요:

\`\`\`bash
sdd validate [path]      # 형식 검증
sdd validate --strict    # 경고도 에러로 처리
\`\`\`

---

## 슬래시 커맨드 요약

| 명령어 | 설명 |
|--------|------|
| \`/sdd:init\` | 프로젝트 초기화 |
| \`/sdd:constitution\` | Constitution 생성/수정 |
| \`/sdd:new\` | 신규 스펙 생성 |
| \`/sdd:plan\` | 구현 계획 수립 |
| \`/sdd:tasks\` | 작업 분해 |
| \`/sdd:change\` | 변경 제안 |
| \`/sdd:impact\` | 영향도 분석 |
| \`/sdd:apply\` | 델타 적용 |
| \`/sdd:archive\` | 아카이브 |
| \`/sdd:validate\` | 형식 검증 |
| \`/sdd:status\` | 현황 조회 |

---

## 작업 마커

| 마커 | 의미 |
|------|------|
| [P] | 우선순위 없음 |
| [P1-3] | 우선순위 (1=높음) |
| [→T] | 테스트 필요 |
| [US] | 불확실/검토 필요 |

---

## 참조

- [Constitution](./constitution.md)
- [Specs](./specs/)
- [Changes](./changes/)
`;
}

/**
 * 상단 50줄 내에 필수 규칙이 포함되어 있는지 검증
 */
export function validateAgentsMdFormat(content: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const lines = content.split('\n').slice(0, 50).join('\n');

  // RFC 2119 키워드 포함 확인
  if (!lines.includes('SHALL') || !lines.includes('MUST')) {
    errors.push('상단 50줄 내에 RFC 2119 키워드(SHALL, MUST)가 포함되어야 합니다');
  }

  // GIVEN-WHEN-THEN 형식 포함 확인
  if (!lines.includes('GIVEN') || !lines.includes('WHEN') || !lines.includes('THEN')) {
    errors.push('상단 50줄 내에 GIVEN-WHEN-THEN 형식이 포함되어야 합니다');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
