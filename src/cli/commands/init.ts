/**
 * sdd init 명령어
 */
import { Command } from 'commander';
import path from 'node:path';
import readline from 'node:readline';
import { ensureDir, writeFile, directoryExists } from '../../utils/fs.js';
import { ExitCode } from '../../errors/index.js';
import * as logger from '../../utils/logger.js';
import { generateAgentsMd } from '../../generators/agents-md.js';
import { generateClaudeCommands } from '../../generators/claude-commands.js';
import { Result, success, failure } from '../../types/index.js';
import { analyzeProject, generateSuggestions, formatAnalysis } from '../../utils/project-analyzer.js';
import { installHooks, installTemplate, setupGit } from './git.js';

/**
 * 초기화 옵션
 */
export interface InitOptions {
  force?: boolean;
  skipGitSetup?: boolean;
  autoApprove?: boolean;
  /** 도메인 설정 파일 생성 여부 */
  withDomains?: boolean;
}

/**
 * 초기화 결과
 */
export interface InitResult {
  sddPath: string;
  claudePath: string;
  directories: string[];
  files: string[];
}

/**
 * 생성할 디렉토리 목록 반환 (테스트 가능)
 */
export function getInitDirectories(withDomains = false): string[] {
  const dirs = [
    '.sdd',
    '.sdd/specs',
    '.sdd/changes',
    '.sdd/archive',
    '.sdd/templates',
    '.claude',
    '.claude/commands',
    '.claude/skills',
  ];

  if (withDomains) {
    dirs.push('.sdd/domains');
  }

  return dirs;
}

/**
 * Constitution 내용 생성 (테스트 가능)
 */
export function generateConstitutionContent(projectName: string): string {
  const today = new Date().toISOString().split('T')[0];

  return `---
version: 1.0.0
created: ${today}
---

# Constitution: ${projectName}

> 이 프로젝트의 모든 설계와 구현은 아래 원칙을 준수해야 한다(SHALL).

## 핵심 원칙

### 1. 품질 우선

- 모든 기능은 테스트와 함께 구현해야 한다(SHALL)
- 코드 리뷰 없이 머지해서는 안 된다(SHALL NOT)

### 2. 명세 우선

- 모든 기능은 스펙 문서가 먼저 작성되어야 한다(SHALL)
- 스펙은 RFC 2119 키워드를 사용해야 한다(SHALL)
- 모든 요구사항은 GIVEN-WHEN-THEN 시나리오를 포함해야 한다(SHALL)

## 금지 사항

- 스펙 없이 기능을 구현해서는 안 된다(SHALL NOT)
- 테스트 없이 배포해서는 안 된다(SHALL NOT)

## 기술 스택

- (프로젝트에 맞게 수정하세요)

## 품질 기준

- 테스트 커버리지: 80% 이상(SHOULD)
`;
}

/**
 * domains.yml 기본 템플릿 생성
 */
export function generateDomainsYaml(): string {
  return `# 도메인 설정 파일
# 프로젝트의 도메인 구조와 의존성을 정의합니다.

version: "1.0"

domains:
  core:
    description: "핵심 공통 기능"
    path: "src/core"
    specs: []
    dependencies:
      uses: []

# 도메인 추가 예시:
# auth:
#   description: "인증/인가"
#   path: "src/auth"
#   specs:
#     - user-login
#     - oauth-google
#   dependencies:
#     uses: [core]

# 도메인 간 규칙 (선택사항):
# rules:
#   - from: order
#     to: auth
#     type: uses
#     allowed: true
#     reason: "주문 시 인증 필요"
`;
}

/**
 * 스펙 템플릿 내용 생성 (테스트 가능)
 */
export function generateSpecTemplate(): string {
  const today = new Date().toISOString().split('T')[0];

  return `---
status: draft
created: ${today}
depends: null
---

# {{FEATURE_NAME}}

> 기능 설명

---

## Requirement: {{REQUIREMENT_TITLE}}

시스템은 {{DESCRIPTION}}해야 한다(SHALL).

### Scenario: {{SCENARIO_NAME}}

- **GIVEN** {{GIVEN_CONDITION}}
- **WHEN** {{WHEN_ACTION}}
- **THEN** {{THEN_RESULT}}

---

## 비고

추가 설명이나 제약 조건
`;
}

/**
 * 초기화 실행 (테스트 가능)
 */
export async function executeInit(
  projectPath: string,
  options: InitOptions
): Promise<Result<InitResult, Error>> {
  const sddPath = path.join(projectPath, '.sdd');
  const claudePath = path.join(projectPath, '.claude');

  // 기존 디렉토리 확인
  if (await directoryExists(sddPath)) {
    if (!options.force) {
      return failure(new Error('.sdd/ 디렉토리가 이미 존재합니다. --force 옵션으로 덮어쓸 수 있습니다.'));
    }
  }

  const directories = getInitDirectories(options.withDomains);
  const createdDirs: string[] = [];

  // 디렉토리 생성
  for (const dir of directories) {
    const result = await ensureDir(path.join(projectPath, dir));
    if (!result.success) {
      return failure(new Error(`디렉토리 생성 실패: ${dir}`));
    }
    createdDirs.push(dir);
  }

  const createdFiles: string[] = [];

  // 기본 파일 생성
  const projectName = path.basename(projectPath);

  // constitution.md
  const constitutionContent = generateConstitutionContent(projectName);
  await writeFile(path.join(sddPath, 'constitution.md'), constitutionContent);
  createdFiles.push('.sdd/constitution.md');

  // AGENTS.md
  const agentsContent = generateAgentsMd({ projectName });
  await writeFile(path.join(sddPath, 'AGENTS.md'), agentsContent);
  createdFiles.push('.sdd/AGENTS.md');

  // domains.yml (--with-domains 옵션 사용 시)
  if (options.withDomains) {
    const domainsContent = generateDomainsYaml();
    await writeFile(path.join(sddPath, 'domains.yml'), domainsContent);
    createdFiles.push('.sdd/domains.yml');
  }

  // 템플릿 파일 생성
  const templateFiles = await createTemplateFiles(projectPath);
  createdFiles.push(...templateFiles);

  // Claude 슬래시 커맨드 생성
  const commandFiles = await createCommandFiles(projectPath);
  createdFiles.push(...commandFiles);

  // Claude 개발 스킬 생성
  const skillFiles = await createSkillFiles(projectPath);
  createdFiles.push(...skillFiles);

  return success({
    sddPath,
    claudePath,
    directories: createdDirs,
    files: createdFiles,
  });
}

/**
 * 템플릿 파일 생성
 */
async function createTemplateFiles(projectPath: string): Promise<string[]> {
  const templatesPath = path.join(projectPath, '.sdd', 'templates');
  const files: string[] = [];

  // spec.md 템플릿
  await writeFile(path.join(templatesPath, 'spec.md'), generateSpecTemplate());
  files.push('.sdd/templates/spec.md');

  // 기타 템플릿 파일들도 생성
  await writeFile(path.join(templatesPath, 'proposal.md'), generateProposalTemplate());
  files.push('.sdd/templates/proposal.md');

  await writeFile(path.join(templatesPath, 'delta.md'), generateDeltaTemplate());
  files.push('.sdd/templates/delta.md');

  await writeFile(path.join(templatesPath, 'tasks.md'), generateTasksTemplate());
  files.push('.sdd/templates/tasks.md');

  return files;
}

/**
 * Claude 커맨드 파일 생성
 */
async function createCommandFiles(projectPath: string): Promise<string[]> {
  const commandsPath = path.join(projectPath, '.claude', 'commands');
  const files: string[] = [];

  const commands = generateClaudeCommands();
  for (const cmd of commands) {
    await writeFile(path.join(commandsPath, `${cmd.name}.md`), cmd.content);
    files.push(`.claude/commands/${cmd.name}.md`);
  }

  return files;
}

/**
 * Claude 개발 스킬 파일 생성
 */
async function createSkillFiles(projectPath: string): Promise<string[]> {
  const skillsPath = path.join(projectPath, '.claude', 'skills');
  const files: string[] = [];

  const skills = generateDevSkills();
  for (const skill of skills) {
    const skillDir = path.join(skillsPath, skill.name);
    await ensureDir(skillDir);
    await writeFile(path.join(skillDir, 'SKILL.md'), skill.content);
    files.push(`.claude/skills/${skill.name}/SKILL.md`);
  }

  return files;
}

/**
 * 개발 스킬 정의
 */
interface DevSkill {
  name: string;
  content: string;
}

/**
 * 개발 스킬 생성
 */
function generateDevSkills(): DevSkill[] {
  return [
    {
      name: 'dev-implement',
      content: `---
name: dev-implement
description: .sdd/specs/의 스펙 문서를 읽고 TDD 방식으로 TypeScript 코드를 구현합니다. GIVEN-WHEN-THEN 시나리오를 테스트로 변환하고 코드를 작성합니다. 사용자가 "구현해", "개발해", "코딩해", "implement" 등을 요청할 때 사용합니다.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# 스펙 기반 TDD 구현

## Instructions

### 1. 스펙 파일 분석

\`.sdd/specs/<spec-path>.md\` 파일에서 추출:
- **Requirement**: 구현해야 할 기능
- **Scenario**: GIVEN-WHEN-THEN 테스트 케이스
- **RFC 2119 키워드**: SHALL(필수), SHOULD(권장), MAY(선택)

### 2. 의존성 확인

frontmatter의 \`depends\` 필드를 확인하고, 의존 스펙이 미구현이면 경고합니다.

### 3. TDD: 테스트 먼저 작성

스펙의 Scenario를 테스트 케이스로 변환:

\`\`\`markdown
### Scenario: 유효한 스펙 검증 성공
- **GIVEN** 유효한 RFC 2119 키워드가 포함된 스펙
- **WHEN** validate 명령을 실행하면
- **THEN** 성공 메시지가 출력된다
\`\`\`

↓ 변환

\`\`\`typescript
it('유효한 스펙을 검증하면 성공한다', () => {
  // GIVEN
  const spec = '시스템은 X를 해야 한다(SHALL).';
  // WHEN
  const result = validateSpec(spec);
  // THEN
  expect(result.valid).toBe(true);
});
\`\`\`

### 4. 구현 및 테스트 실행

테스트를 통과하도록 구현하고 확인:

\`\`\`bash
pnpm vitest run src/<path>.test.ts
\`\`\`

## Examples

**사용자**: "user-auth 스펙 구현해줘"

**응답**: 스펙을 분석하고 테스트부터 작성한 뒤 구현을 진행합니다.

## RFC 2119 키워드 해석

| 키워드 | 의미 | 구현 수준 |
|--------|------|----------|
| SHALL / MUST | 필수 | 반드시 구현 |
| SHOULD | 권장 | 가능하면 구현 |
| MAY | 선택 | 필요시 구현 |
`,
    },
    {
      name: 'dev-next',
      content: `---
name: dev-next
description: 의존성 그래프를 분석하여 다음 구현할 스펙을 추천합니다. 사용자가 "다음 뭐 해", "다음 작업", "뭐 구현할까", "next" 등을 요청할 때 사용합니다.
allowed-tools: Read, Glob, Grep, Bash
---

# 다음 구현 스펙 추천

## Instructions

### 1. 스펙 목록 스캔

\`.sdd/specs/\` 디렉토리에서 모든 스펙 파일을 찾습니다.

### 2. 상태 분석

각 스펙의 frontmatter에서 상태 확인:
- \`status: draft\` - 미구현
- \`status: implemented\` - 구현 완료
- \`status: review\` - 리뷰 중

### 3. 의존성 그래프 분석

\`depends\` 필드를 확인하여:
- 의존성이 없는 스펙 우선
- 의존하는 스펙이 모두 구현된 스펙 추천
- 순환 의존성 감지 및 경고

### 4. 추천 결과 제시

우선순위에 따라 정렬:
1. 의존성 없음 + draft 상태
2. 의존성 해결됨 + draft 상태
3. 의존성 미해결 (블로킹 상태)

## Examples

**사용자**: "다음 뭐 구현하면 돼?"

**응답**:
\`\`\`
## 다음 구현 추천

### 1순위: core/validation (의존성 없음)
- 상태: draft
- 설명: 입력 검증 유틸리티

### 2순위: auth/login (의존: core/validation)
- 상태: draft
- 설명: 사용자 로그인
- 블로커: core/validation 구현 필요

/sdd.dev-implement core/validation 으로 시작하세요.
\`\`\`
`,
    },
    {
      name: 'dev-review',
      content: `---
name: dev-review
description: 구현된 코드가 스펙을 충족하는지 검증하고 코드 품질, 타입 안전성, 에러 처리를 검토합니다. 사용자가 "리뷰해줘", "코드 검토", "품질 확인", "review" 등을 요청할 때 사용합니다.
allowed-tools: Read, Glob, Grep, Bash
---

# 코드 리뷰

## Instructions

### 1. 스펙 대조 검증

구현된 코드가 스펙의 요구사항을 충족하는지 확인:
- 모든 Scenario가 테스트로 커버되는지
- RFC 2119 키워드(SHALL/MUST)가 모두 구현되었는지

### 2. 코드 품질 검사

- TypeScript 타입 안전성
- 에러 처리 완전성
- 코드 중복 여부
- 네이밍 컨벤션

### 3. 테스트 커버리지 확인

\`\`\`bash
pnpm vitest run --coverage
\`\`\`

### 4. 리뷰 결과 작성

- ✅ 통과 항목
- ⚠️ 개선 권장 항목
- ❌ 필수 수정 항목

## Examples

**사용자**: "auth/login 코드 리뷰해줘"

**응답**:
\`\`\`
## 코드 리뷰: auth/login

### 스펙 충족도: 4/5 (80%)
- ✅ REQ-01: 이메일 로그인
- ✅ REQ-02: 비밀번호 검증
- ⚠️ REQ-03: 로그인 실패 횟수 제한 (미구현)

### 코드 품질
- ✅ 타입 안전성
- ⚠️ 에러 메시지 i18n 미적용
- ✅ 테스트 커버리지 85%

### 권장 사항
1. 로그인 실패 횟수 제한 기능 추가
2. 에러 메시지 국제화 적용
\`\`\`
`,
    },
    {
      name: 'dev-scaffold',
      content: `---
name: dev-scaffold
description: SDD CLI의 새 명령어, 모듈, 파서, 검증기의 TypeScript 보일러플레이트 코드를 생성합니다. 사용자가 "새 명령어 만들어", "모듈 추가", "scaffold", "보일러플레이트" 등을 요청할 때 사용합니다.
allowed-tools: Read, Write, Edit, Glob
---

# 보일러플레이트 생성

## Instructions

### 1. 생성 대상 확인

사용자 요청에서 생성할 타입 파악:
- **command**: CLI 명령어
- **module**: 비즈니스 로직 모듈
- **parser**: 파서/변환기
- **validator**: 검증기

### 2. 기존 패턴 분석

프로젝트의 기존 코드를 분석하여 패턴 추출:
- 디렉토리 구조
- 파일 네이밍 규칙
- 임포트 스타일
- 타입 정의 방식

### 3. 보일러플레이트 생성

추출된 패턴을 따라 파일 생성:
- 메인 구현 파일 (.ts)
- 테스트 파일 (.test.ts)
- 타입 정의 (필요시)
- 인덱스 익스포트 업데이트

## Examples

**사용자**: "export 명령어 scaffold 생성해줘"

**응답**:
\`\`\`
## Scaffold: export 명령어

생성 파일:
- src/cli/commands/export.ts
- src/cli/commands/export.test.ts

기존 패턴 참조:
- src/cli/commands/validate.ts

[파일 생성 진행...]
\`\`\`
`,
    },
    {
      name: 'dev-status',
      content: `---
name: dev-status
description: SDD CLI 구현 진행 상황을 분석하고 Phase별 스펙 현황, 구현 완료율, 테스트 통과율을 보고합니다. 사용자가 "현황", "진행 상황", "얼마나 됐어", "status" 등을 요청할 때 사용합니다.
allowed-tools: Read, Glob, Grep, Bash
---

# 구현 진행 상황

## Instructions

### 1. 스펙 현황 수집

\`.sdd/specs/\` 디렉토리 스캔:
- 전체 스펙 수
- Phase별 분류
- 상태별 분류 (draft, implemented, review)

### 2. 구현 완료율 계산

\`\`\`
완료율 = (implemented 스펙 수) / (전체 스펙 수) × 100
\`\`\`

### 3. 테스트 상태 확인

\`\`\`bash
pnpm vitest run --reporter=json
\`\`\`

### 4. 리포트 생성

## Examples

**사용자**: "현재 진행 상황 알려줘"

**응답**:
\`\`\`
## SDD 구현 현황

### 전체 진행률: 65% (13/20 스펙)

### Phase별 현황

| Phase | 전체 | 완료 | 진행률 |
|-------|------|------|--------|
| Phase 1 | 8 | 8 | 100% |
| Phase 2 | 7 | 5 | 71% |
| Phase 3 | 5 | 0 | 0% |

### 테스트 현황
- 전체: 45개
- 통과: 42개 (93%)
- 실패: 3개

### 다음 작업 추천
→ Phase 2의 남은 2개 스펙 완료
\`\`\`
`,
    },
    {
      name: 'dev-test',
      content: `---
name: dev-test
description: Vitest를 사용하여 테스트를 작성하거나 실행합니다. 대상 파일을 분석하여 테스트 케이스를 생성하고 커버리지를 확인합니다. 사용자가 "테스트 작성", "테스트 실행", "커버리지", "vitest" 등을 요청할 때 사용합니다.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# 테스트 작성 및 실행

## Instructions

### 1. 테스트 대상 분석

대상 파일에서 테스트할 함수/클래스 식별:
- export된 함수/클래스
- 주요 로직 흐름
- 엣지 케이스

### 2. 테스트 케이스 생성

스펙의 Scenario를 참조하여 테스트 작성:
- describe: 테스트 그룹
- it: 개별 테스트 케이스
- GIVEN-WHEN-THEN 구조

### 3. 테스트 실행

\`\`\`bash
# 전체 테스트
pnpm vitest run

# 특정 파일
pnpm vitest run src/path/to/file.test.ts

# 감시 모드
pnpm vitest

# 커버리지
pnpm vitest run --coverage
\`\`\`

### 4. 결과 분석

- 통과/실패 현황
- 커버리지 부족 영역
- 개선 제안

## Examples

**사용자**: "validation.ts 테스트 작성해줘"

**응답**:
\`\`\`
## 테스트 분석: src/core/validation.ts

### 발견된 함수
- validateLength(value, min, max)
- validateRequired(obj, fields)

### 생성할 테스트

\`\`\`typescript
describe('validateLength', () => {
  it('범위 내 문자열은 유효하다', () => {
    expect(validateLength('hello', 1, 10).valid).toBe(true);
  });

  it('최소 길이 미달 시 실패한다', () => {
    expect(validateLength('hi', 5, 10).valid).toBe(false);
  });
});
\`\`\`

테스트 파일을 생성하시겠습니까?
\`\`\`
`,
    },
  ];
}

/**
 * Proposal 템플릿 생성
 */
function generateProposalTemplate(): string {
  const today = new Date().toISOString().split('T')[0];

  return `---
id: CHG-{{ID}}
status: draft
created: ${today}
---

# 변경 제안: {{TITLE}}

> 변경 목적 및 배경 설명

---

## 배경

왜 이 변경이 필요한가?

---

## 영향 범위

### 영향받는 스펙

- \`specs/{{SPEC_PATH}}\`

### 변경 유형

- [ ] 신규 추가 (ADDED)
- [ ] 수정 (MODIFIED)
- [ ] 삭제 (REMOVED)

---

## 변경 내용

### ADDED

(새로 추가되는 내용)

### MODIFIED

#### Before

\`\`\`markdown
기존 내용
\`\`\`

#### After

\`\`\`markdown
변경된 내용
\`\`\`

### REMOVED

(삭제되는 내용)

---

## 리스크 평가

- 영향도: 낮음/중간/높음
- 복잡도: 낮음/중간/높음
`;
}

/**
 * Delta 템플릿 생성
 */
function generateDeltaTemplate(): string {
  const today = new Date().toISOString().split('T')[0];

  return `---
proposal: CHG-{{ID}}
created: ${today}
---

# Delta: {{TITLE}}

## ADDED

(추가되는 스펙 내용)

## MODIFIED

### {{SPEC_PATH}}

#### Before

\`\`\`markdown
기존 내용
\`\`\`

#### After

\`\`\`markdown
변경된 내용
\`\`\`

## REMOVED

(삭제되는 스펙 참조)
`;
}

/**
 * Tasks 템플릿 생성
 */
function generateTasksTemplate(): string {
  const today = new Date().toISOString().split('T')[0];

  return `---
spec: {{SPEC_ID}}
created: ${today}
---

# Tasks: {{FEATURE_NAME}}

## 개요

- 총 작업 수: N개
- 예상 복잡도: 낮음/중간/높음

---

## 작업 목록

### Phase 1: 기반 구축

- [ ] [P1] 작업 1 설명
- [ ] [P1] 작업 2 설명

### Phase 2: 핵심 구현

- [ ] [P2] 작업 3 설명
- [ ] [P2] 작업 4 설명

### Phase 3: 마무리

- [ ] [P3] 테스트 작성
- [ ] [P3] 문서화

---

## 의존성 그래프

\`\`\`mermaid
graph LR
    A[작업 1] --> B[작업 2]
    B --> C[작업 3]
\`\`\`

---

## 마커 범례

| 마커 | 의미 |
|------|------|
| [P1-3] | 우선순위 |
| [→T] | 테스트 필요 |
| [US] | 불확실/검토 필요 |
`;
}

/**
 * 사용자 입력 프롬프트 (y/n)
 */
async function askYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes' || normalized === '예');
    });
  });
}

/**
 * Git/CI-CD 설정 대화형 프롬프트
 */
async function promptGitSetup(projectPath: string, autoApprove: boolean): Promise<void> {
  logger.newline();
  logger.info('🔍 프로젝트 구조를 분석합니다...');
  logger.newline();

  const analysis = await analyzeProject(projectPath);
  const suggestions = generateSuggestions(analysis);

  // 분석 결과 출력
  console.log(formatAnalysis(analysis));
  logger.newline();

  // Git 저장소가 아니면 안내만 제공
  if (!analysis.isGitRepo) {
    logger.warn('Git 저장소가 아닙니다.');
    logger.info('Git 설정을 활성화하려면:');
    logger.listItem('git init');
    logger.listItem('sdd git setup');
    return;
  }

  // 모든 설정이 완료된 경우
  if (!suggestions.suggestGitHooks && !suggestions.suggestGitTemplate && !suggestions.suggestGitHubActions) {
    logger.success('Git 워크플로우가 이미 설정되어 있습니다!');
    return;
  }

  // 설정 제안
  logger.info('📋 권장 설정:');
  if (suggestions.suggestGitHooks) {
    logger.listItem('Git Hooks: 커밋/푸시 시 자동 스펙 검증');
  }
  if (suggestions.suggestGitTemplate) {
    logger.listItem('커밋 템플릿: 일관된 커밋 메시지 형식');
  }
  if (suggestions.suggestGitHubActions) {
    logger.listItem('GitHub Actions: PR 시 자동 검증 및 라벨링');
  }
  logger.newline();

  // Git Hooks + Template 설치
  if (suggestions.suggestGitHooks || suggestions.suggestGitTemplate) {
    const setupGitWorkflow = autoApprove || await askYesNo('Git 워크플로우(Hooks + 템플릿)를 설치하시겠습니까?');

    if (setupGitWorkflow) {
      logger.info('Git 워크플로우를 설치합니다...');
      const result = await setupGit(projectPath, { force: false });

      if (result.success) {
        logger.success('Git 워크플로우 설치 완료!');
        if (result.data.hooks.installed.length > 0) {
          logger.listItem(`Hooks: ${result.data.hooks.installed.join(', ')}`);
        }
        if (result.data.template.installed.length > 0) {
          logger.listItem(`템플릿: ${result.data.template.installed.join(', ')}`);
        }
      } else {
        logger.warn('Git 워크플로우 설치 실패: ' + result.error.message);
      }
      logger.newline();
    }
  }

  // GitHub Actions 설치
  if (suggestions.suggestGitHubActions) {
    const setupCicd = autoApprove || await askYesNo('GitHub Actions CI/CD를 설정하시겠습니까?');

    if (setupCicd) {
      logger.info('GitHub Actions를 설정합니다...');

      // cicd 모듈 동적 import
      try {
        const workflowDir = path.join(projectPath, '.github', 'workflows');
        await ensureDir(workflowDir);

        // 검증 워크플로우 생성
        const validateContent = generateGitHubValidateWorkflow();
        await writeFile(path.join(workflowDir, 'sdd-validate.yml'), validateContent);
        logger.success('sdd-validate.yml 생성 완료');

        // 라벨러 워크플로우 생성
        const labelerContent = generateGitHubLabelerWorkflow();
        await writeFile(path.join(workflowDir, 'sdd-labeler.yml'), labelerContent);
        logger.success('sdd-labeler.yml 생성 완료');
      } catch (error) {
        logger.warn('GitHub Actions 설정 실패: ' + (error instanceof Error ? error.message : String(error)));
      }
      logger.newline();
    }
  }
}

/**
 * GitHub Actions 검증 워크플로우 생성
 */
function generateGitHubValidateWorkflow(): string {
  return `# SDD 스펙 검증 워크플로우
# 이 파일은 sdd init으로 생성되었습니다.

name: SDD Validation

on:
  push:
    branches: [main, master, develop]
    paths:
      - '.sdd/**'
  pull_request:
    branches: [main, master, develop]
    paths:
      - '.sdd/**'

jobs:
  validate:
    name: Validate Specs
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install SDD Tool
        run: npm install -g sdd-tool

      - name: Validate specifications
        run: sdd validate
`;
}

/**
 * GitHub Actions 라벨러 워크플로우 생성
 */
function generateGitHubLabelerWorkflow(): string {
  return `# SDD PR 라벨러 워크플로우
# 변경된 도메인에 따라 자동으로 라벨을 추가합니다

name: SDD Labeler

on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - '.sdd/**'

jobs:
  label:
    name: Add Labels
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Detect Changes
        id: changes
        run: |
          # 변경된 도메인 감지
          DOMAINS=$(git diff --name-only origin/\${{ github.base_ref }} | \\
            grep "^\\.sdd/specs/" | \\
            cut -d'/' -f3 | \\
            sort -u | \\
            tr '\\n' ' ')
          echo "domains=$DOMAINS" >> $GITHUB_OUTPUT

          # Constitution 변경 감지
          if git diff --name-only origin/\${{ github.base_ref }} | grep -q "constitution.md"; then
            echo "constitution=true" >> $GITHUB_OUTPUT
          else
            echo "constitution=false" >> $GITHUB_OUTPUT
          fi

      - name: Apply Labels
        uses: actions/github-script@v7
        with:
          script: |
            const labels = [];
            const domains = '\${{ steps.changes.outputs.domains }}'.trim().split(' ').filter(Boolean);
            labels.push(...domains.map(d => \`spec:\${d}\`));

            if ('\${{ steps.changes.outputs.constitution }}' === 'true') {
              labels.push('constitution');
            }

            if (labels.length > 0) {
              await github.rest.issues.addLabels({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                labels: labels,
              });
            }
`;
}

/**
 * init 명령어 등록
 */
export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('SDD 프로젝트를 초기화합니다')
    .option('-f, --force', '기존 .sdd/ 디렉토리 덮어쓰기')
    .option('--skip-git-setup', 'Git/CI-CD 설정 건너뛰기')
    .option('--auto-approve', '모든 설정을 자동 승인')
    .option('--with-domains', '도메인 설정 파일(domains.yml) 생성')
    .action(async (options: InitOptions) => {
      try {
        await runInit(options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * 초기화 실행 (CLI 래퍼)
 */
async function runInit(options: InitOptions): Promise<void> {
  const cwd = process.cwd();

  // 기존 디렉토리 확인 시 경고 출력
  if (await directoryExists(path.join(cwd, '.sdd'))) {
    if (options.force) {
      logger.warn('기존 .sdd/ 디렉토리를 덮어씁니다.');
    }
  }

  logger.info('SDD 프로젝트를 초기화합니다...');

  const result = await executeInit(cwd, options);

  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  logger.success('SDD 프로젝트가 초기화되었습니다.');
  logger.newline();
  logger.info('생성된 구조:');
  logger.listItem('.sdd/');
  logger.listItem('AGENTS.md', 1);
  logger.listItem('constitution.md', 1);
  logger.listItem('specs/', 1);
  logger.listItem('changes/', 1);
  logger.listItem('archive/', 1);
  logger.listItem('templates/', 1);
  logger.listItem('.claude/');
  logger.listItem('commands/', 1);
  logger.listItem('skills/', 1);
  logger.newline();
  logger.info('Claude 슬래시 커맨드:');
  logger.listItem('/sdd.start - 워크플로우 시작 (통합 진입점)');
  logger.listItem('/sdd.constitution - 프로젝트 원칙 관리');
  logger.listItem('/sdd.new - 새 기능 명세 작성');
  logger.listItem('/sdd.plan - 구현 계획 작성');
  logger.listItem('/sdd.tasks - 작업 분해');
  logger.listItem('/sdd.implement - 구현 진행');
  logger.listItem('/sdd.validate - 스펙 검증');
  logger.listItem('/sdd.status - 상태 확인');
  logger.listItem('/sdd.change - 변경 제안');
  logger.newline();
  logger.info('Claude 개발 스킬 (자동 사용):');
  logger.listItem('dev-implement - 스펙 기반 TDD 구현');
  logger.listItem('dev-next - 다음 구현 스펙 추천');
  logger.listItem('dev-review - 코드 리뷰');
  logger.listItem('dev-scaffold - 보일러플레이트 생성');
  logger.listItem('dev-status - 구현 진행 상황');
  logger.listItem('dev-test - 테스트 작성/실행');

  // Git/CI-CD 설정 프롬프트
  if (!options.skipGitSetup) {
    await promptGitSetup(cwd, options.autoApprove || false);
  }

  logger.newline();
  logger.info('다음 단계:');
  logger.listItem('constitution.md를 수정하여 프로젝트 원칙을 정의하세요');
  logger.listItem('/sdd.new 로 첫 번째 기능 명세를 작성하세요');
}
