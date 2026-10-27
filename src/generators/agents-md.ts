/**
 * AGENTS.md 생성기
 *
 * SDD 워크플로우 지침은 프로젝트 루트 AGENTS.md의 관리 블록
 * (`<!-- sdd:begin -->` … `<!-- sdd:end -->`)에 기록됩니다.
 * Codex는 루트 AGENTS.md를 직접 읽고, Claude Code는 CLAUDE.md의 `@AGENTS.md` import로 읽습니다.
 *
 * 상단 50줄 내에 모든 필수 형식 규칙을 배치합니다.
 */
import { ParsedConstitution } from '../core/constitution/schemas.js';

export interface AgentsGeneratorOptions {
  projectName: string;
  projectDescription?: string;
  constitution?: ParsedConstitution;
}

/** 관리 블록 시작 마커 */
export const SDD_BLOCK_BEGIN = '<!-- sdd:begin -->';
/** 관리 블록 끝 마커 */
export const SDD_BLOCK_END = '<!-- sdd:end -->';

// UTF-8 byte order mark (built from its code point to keep the source free of invisible characters)
const BOM = String.fromCharCode(0xfeff);

/**
 * SDD 워크플로우 지침 생성 (도구 중립: Claude Code / Codex)
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

> **${projectName}** - AI 에이전트 워크플로우 지침서 (Claude Code / Codex 공용)

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

모든 요구사항은 GIVEN-WHEN-THEN 시나리오로 다뤄야 합니다. \`sdd new\`가 생성하는 구조를 유지하세요:
요구사항은 \`### REQ-01: 제목\` 헤딩으로 정의하고(번호는 스펙 안에서 고유), 시나리오 이름에 다루는 요구사항을 적습니다.

\`\`\`markdown
## 요구사항

### REQ-01: [요구사항 제목]

시스템은 [기능]을 지원해야 한다(SHALL).

## 시나리오

### Scenario 1: [시나리오명] (REQ-01)

- **GIVEN** [전제 조건]
- **WHEN** [행동/트리거]
- **THEN** [예상 결과]
\`\`\`

### 추적성

코드와 테스트는 \`@spec <domain>/<feature>#REQ-xx\` 형식으로 요구사항을 참조합니다.
REQ 번호는 스펙마다 01부터 시작하므로, 한정하지 않은 \`REQ-xx\`는 같은 ID를 가진 스펙이 여럿이면 무시됩니다.
구현을 마치기 전에 \`sdd sync\`로 확인하세요.

---

## 프로젝트 개요

**프로젝트**: ${projectName}
**설명**: ${projectDescription}

---

## 스킬 호출 방법

\`sdd init\`은 같은 SDD 스킬을 Claude Code와 Codex 양쪽에 생성합니다.

| 도구 | 스킬 위치 | 호출 | 예시 |
|------|-----------|------|------|
| Claude Code | \`.claude/skills/\` | \`/<스킬명>\` | \`/sdd-spec auth/login\` |
| Codex | \`.agents/skills/\` | \`$<스킬명>\` 또는 \`/skills\` | \`$sdd-spec auth/login\` |

아래에서 \`sdd-spec\`처럼 표기한 것은 스킬 이름이며, 사용하는 도구의 규칙에 따라 호출합니다.
\`sdd …\`로 시작하는 것은 터미널에서 실행하는 CLI 명령어입니다.

---

## 디렉토리 구조

\`\`\`
AGENTS.md              # 이 지침 (sdd:begin/end 블록만 sdd init이 관리)
CLAUDE.md              # Claude Code용, @AGENTS.md import
.claude/
├── skills/sdd-*/      # Claude Code 스킬
└── agents/sdd-*.md    # Claude Code 서브에이전트
.agents/skills/sdd-*/  # Codex 스킬
.codex/agents/sdd-*.toml  # Codex 서브에이전트
.sdd/
├── constitution.md    # 프로젝트 헌법 (원칙, 제약)
├── domains.yml        # 도메인 정의 (선택, sdd init --with-domains)
├── specs/             # 스펙 문서
│   └── <domain>/<feature>/
│       ├── spec.md
│       ├── plan.md
│       ├── tasks.md
│       └── checklist.md
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

1. \`sdd-spec\` 스킬 - 스펙 초안 작성 (CLI: \`sdd new <domain>/<feature> --all\`)
   - spec.md, plan.md, tasks.md, checklist.md 생성. 없는 도메인은 자동 생성, 도메인 생략 시 \`common\`
   - 기본으로 \`feature/<feature>\` 브랜치를 만들고 전환합니다. 이미 작업 브랜치 위라면 \`--no-branch\`
   - 기존 파일은 덮어쓰지 않습니다(\`--force\`는 처음부터 다시 생성할 때만)
2. \`sdd-plan\` 스킬 - 구현 계획 수립 (이미 생성된 plan.md를 편집)
3. \`sdd-tasks\` 스킬 - 작업 분해 (이미 생성된 tasks.md를 편집, 작업 ID는 \`<feature>-task-NNN\`)
4. \`sdd-implement\` 스킬 - 작업별 테스트 우선 구현 (\`sdd-implementer\` 서브에이전트에 위임 가능)
5. \`sdd-validate\` 스킬 - 검증 (\`sdd-spec-reviewer\` 서브에이전트로 리뷰 가능), \`sdd sync\` 후 \`sdd new status <feature> implemented\`, 리뷰 및 머지

### 역추출 워크플로우 (브라운필드)

\`sdd-reverse\` 스킬이 전체 흐름을 안내합니다.

1. 프로젝트 스캔 및 도메인 생성
2. 코드를 분석해 스펙 초안 작성 (\`.sdd/.reverse-drafts/\`)
3. 초안 검증 및 리뷰/승인
4. 승인된 스펙 확정 (\`.sdd/specs/\`)

### 변경 워크플로우

1. \`sdd-spec\` 스킬 또는 \`sdd change -t "<제목>" -s <spec>\` - \`.sdd/changes/<id>/proposal.md\`, \`delta.md\` 생성
2. \`sdd-impact\` 스킬 또는 \`sdd-impact-analyst\` 서브에이전트로 영향도 확인
3. delta.md 작성 (ADDED/MODIFIED/REMOVED), 필요하면 같은 디렉토리에 tasks.md 작성
4. delta.md를 참고해 스펙 수정 및 구현
5. \`sdd change apply <id>\` - 변경 제안을 적용됨으로 표시
6. \`sdd change archive <id>\` - 완료된 변경 아카이브

---

## 검증

스펙 변경 후 항상 검증을 실행하세요:

\`\`\`bash
sdd validate [path]      # 형식 검증
sdd validate --strict    # 경고도 에러로 처리
\`\`\`

---

## 스킬 / CLI 요약

| 스킬 / 명령어 | 설명 |
|---------------|------|
| \`sdd init\` | 프로젝트 초기화 (CLI) |
| \`sdd-start\` | SDD 시작 가이드 |
| \`sdd-constitution\` | Constitution 생성/수정 |
| \`sdd-spec\` | 스펙 생성/수정 (큰 변경은 변경 제안) |
| \`sdd-plan\` | 구현 계획 수립 |
| \`sdd-tasks\` | 작업 분해 |
| \`sdd-prepare\` | 구현 전 도구 점검 |
| \`sdd-implement\` | 순차 구현 |
| \`sdd-impact\` | 영향도 분석 |
| \`sdd change apply <id>\` | 변경 적용 표시 (CLI) |
| \`sdd change archive <id>\` | 변경 아카이브 (CLI) |
| \`sdd-validate\` | 형식 검증 |
| \`sdd-status\` | 현황 조회 |
| \`sdd-reverse\` | 레거시 코드에서 스펙 역추출 |
| \`sdd-domain\` | 도메인 관리 |
| \`sdd-guide\` | SDD 가이드 (명시 호출 전용) |

---

## 서브에이전트

\`sdd init\`은 아래 서브에이전트를 Claude Code(\`.claude/agents/\`)와 Codex(\`.codex/agents/\`)에 생성합니다.
"sdd-spec-reviewer 에이전트로 auth/login 스펙을 리뷰해줘"처럼 이름을 지정해 위임합니다.

| 서브에이전트 | 역할 |
|--------------|------|
| \`sdd-spec-reviewer\` | 스펙 리뷰 (읽기 전용, \`sdd validate\` / \`sdd quality\`) |
| \`sdd-implementer\` | tasks.md 작업을 테스트 우선으로 구현, 스펙 범위 유지 |
| \`sdd-impact-analyst\` | 변경 전 영향도 분석 (읽기 전용, \`sdd impact\`) |

---

## 상태 변경

tasks.md의 작업 상태와 spec.md의 \`status\`는 직접 고치지 말고 CLI로 바꿉니다 (진행 상황 집계도 함께 갱신됨).

\`\`\`bash
sdd new task <feature> <task-id> in-progress   # pending | in-progress | completed | blocked (대기 | 진행 중 | 완료 | 차단됨)
sdd new task <feature> <task-id> completed
sdd new status <feature> implemented            # draft | review | approved | planned | tasked | implementing | implemented | deprecated
\`\`\`

커밋 메시지는 commit-msg 훅 형식 \`<type>(<scope>): <message>\`를 따릅니다.
type은 스펙 타입 \`spec|spec-update|spec-status|plan|tasks|constitution|sdd-config\` 또는
Conventional Commits 타입 \`feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert\`입니다.

---

## 참조

- [Constitution](./.sdd/constitution.md)
- [Specs](./.sdd/specs/)
- [Changes](./.sdd/changes/)
`;
}

/**
 * 루트 AGENTS.md에 넣을 관리 블록 (마커 포함, LF)
 */
export function generateAgentsMdBlock(options: AgentsGeneratorOptions): string {
  return [
    SDD_BLOCK_BEGIN,
    '<!-- sdd init이 관리하는 블록입니다. 블록 안의 내용은 sdd init 재실행 시 덮어써집니다. 블록 밖은 자유롭게 편집하세요. -->',
    '',
    generateAgentsMd(options).trimEnd(),
    '',
    SDD_BLOCK_END,
  ].join('\n');
}

/**
 * 펜스 코드 블록 밖에 있는 마커 줄의 인덱스 목록
 */
function findMarkerLines(lines: string[], marker: string): number[] {
  const found: number[] = [];
  let fence: string | null = null;

  lines.forEach((line, index) => {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      const mark = fenceMatch[1];
      if (fence === null) {
        fence = mark;
      } else if (mark[0] === fence[0] && mark.length >= fence.length) {
        fence = null;
      }
      return;
    }
    if (fence === null && line.trim() === marker) {
      found.push(index);
    }
  });

  return found;
}

type BlockLocation =
  | { state: 'none' }
  | { state: 'found'; begin: number; end: number }
  | { state: 'invalid' };

/**
 * 관리 블록 위치 (펜스 코드 블록 안의 마커는 무시)
 */
function locateBlock(lines: string[]): BlockLocation {
  const begins = findMarkerLines(lines, SDD_BLOCK_BEGIN);
  const ends = findMarkerLines(lines, SDD_BLOCK_END);
  if (begins.length === 0 && ends.length === 0) {
    return { state: 'none' };
  }
  if (begins.length === 1 && ends.length === 1 && begins[0] < ends[0]) {
    return { state: 'found', begin: begins[0], end: ends[0] };
  }
  return { state: 'invalid' };
}

/**
 * AGENTS.md 내용에 올바른 SDD 관리 블록이 있는지 확인 (작성기와 같은 판정)
 */
export function hasSddBlock(content: string): boolean {
  const body = content.startsWith(BOM) ? content.slice(BOM.length) : content;
  const lines = body.split(/\r?\n/);
  return locateBlock(lines).state === 'found';
}

/**
 * 루트 AGENTS.md 내용 계산 (테스트 가능)
 *
 * - 파일이 없으면 관리 블록만으로 새 내용을 만든다
 * - 관리 블록이 있으면 그 블록만 교체하고, 없으면 끝에 덧붙인다
 * - 블록 밖 사용자 내용(BOM 포함)은 그대로 두며, 기존 줄바꿈 형식(CRLF)을 유지한다
 * - 결과가 기존 내용과 같으면 null (변경 없음)
 *
 * @throws 시작/끝 마커 짝이 맞지 않으면 (사용자 내용 손상을 막기 위해 수정하지 않음)
 */
export function buildAgentsMdContent(existing: string | null, block: string): string | null {
  if (existing === null) {
    return `${block}\n`;
  }

  // A leading BOM is kept as-is and not treated as part of the first line
  const bom = existing.startsWith(BOM) ? BOM : '';
  const body = existing.slice(bom.length);
  const eol = body.includes('\r\n') ? '\r\n' : '\n';
  const blockText = block.split('\n').join(eol);
  // Raw lines keep their own terminators so text outside the block is untouched byte for byte
  const rawLines = body.split(/(?<=\n)/);
  const location = locateBlock(rawLines.map((line) => line.replace(/\r?\n$/, '')));

  let next: string;
  if (location.state === 'none') {
    const separator = body.length === 0 || body.endsWith('\n') ? '' : eol;
    const gap = body.length === 0 ? '' : eol;
    next = `${body}${separator}${gap}${blockText}${eol}`;
  } else if (location.state === 'found') {
    const before = rawLines.slice(0, location.begin).join('');
    const endTerminator = /\r?\n$/.exec(rawLines[location.end])?.[0] ?? '';
    const after = rawLines.slice(location.end + 1).join('');
    next = `${before}${blockText}${endTerminator}${after}`;
  } else {
    throw new Error(
      `AGENTS.md의 ${SDD_BLOCK_BEGIN} / ${SDD_BLOCK_END} 마커가 올바르지 않습니다 (각각 한 번, 시작이 끝보다 먼저). 마커를 정리한 뒤 다시 실행하세요.`
    );
  }

  next = `${bom}${next}`;
  return next === existing ? null : next;
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
