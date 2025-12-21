/**
 * sdd init 명령어
 */
import { Command } from 'commander';
import path from 'node:path';
import { ensureDir, writeFile, directoryExists } from '../../utils/fs.js';
import { ExitCode } from '../../errors/index.js';
import * as logger from '../../utils/logger.js';
import { generateAgentsMd } from '../../generators/agents-md.js';
import { generateClaudeCommands } from '../../generators/claude-commands.js';

/**
 * init 명령어 등록
 */
export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('SDD 프로젝트를 초기화합니다')
    .option('-f, --force', '기존 .sdd/ 디렉토리 덮어쓰기')
    .action(async (options: { force?: boolean }) => {
      try {
        await runInit(options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * 초기화 실행
 */
async function runInit(options: { force?: boolean }): Promise<void> {
  const cwd = process.cwd();
  const sddPath = path.join(cwd, '.sdd');

  // 기존 디렉토리 확인
  if (await directoryExists(sddPath)) {
    if (!options.force) {
      logger.error('.sdd/ 디렉토리가 이미 존재합니다. --force 옵션으로 덮어쓸 수 있습니다.');
      process.exit(ExitCode.GENERAL_ERROR);
    }
    logger.warn('기존 .sdd/ 디렉토리를 덮어씁니다.');
  }

  logger.info('SDD 프로젝트를 초기화합니다...');

  // 디렉토리 구조 생성
  const directories = [
    '.sdd',
    '.sdd/specs',
    '.sdd/changes',
    '.sdd/archive',
    '.sdd/templates',
    '.claude',
    '.claude/commands',
  ];

  for (const dir of directories) {
    const result = await ensureDir(path.join(cwd, dir));
    if (!result.success) {
      logger.error(`디렉토리 생성 실패: ${dir}`);
      process.exit(ExitCode.FILE_SYSTEM_ERROR);
    }
  }

  // 기본 파일 생성
  await createDefaultFiles(cwd);

  // 템플릿 복사
  await copyTemplates(cwd);

  // Claude 슬래시 커맨드 생성
  await createClaudeCommands(cwd);

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
  logger.newline();
  logger.info('Claude 슬래시 커맨드:');
  logger.listItem('/sdd.new - 새 기능 명세 작성');
  logger.listItem('/sdd.plan - 구현 계획 작성');
  logger.listItem('/sdd.tasks - 작업 분해');
  logger.listItem('/sdd.implement - 구현 진행');
  logger.listItem('/sdd.validate - 스펙 검증');
  logger.listItem('/sdd.status - 상태 확인');
  logger.listItem('/sdd.change - 변경 제안');
  logger.newline();
  logger.info('다음 단계:');
  logger.listItem('constitution.md를 수정하여 프로젝트 원칙을 정의하세요');
  logger.listItem('/sdd.new 로 첫 번째 기능 명세를 작성하세요');
}

/**
 * 기본 파일 생성
 */
async function createDefaultFiles(cwd: string): Promise<void> {
  const projectName = path.basename(cwd);
  const today = new Date().toISOString().split('T')[0];

  // constitution.md
  const constitution = `---
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

  await writeFile(path.join(cwd, '.sdd', 'constitution.md'), constitution);

  // AGENTS.md - 50줄 규칙 준수를 위해 생성기 사용
  const agents = generateAgentsMd({ projectName });
  await writeFile(path.join(cwd, '.sdd', 'AGENTS.md'), agents);
}

/**
 * 템플릿 복사
 */
async function copyTemplates(cwd: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // spec.md 템플릿
  const specTemplate = `---
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

  // proposal.md 템플릿
  const proposalTemplate = `---
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

  // delta.md 템플릿
  const deltaTemplate = `---
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

  // tasks.md 템플릿
  const tasksTemplate = `---
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

  await writeFile(path.join(cwd, '.sdd', 'templates', 'spec.md'), specTemplate);
  await writeFile(path.join(cwd, '.sdd', 'templates', 'proposal.md'), proposalTemplate);
  await writeFile(path.join(cwd, '.sdd', 'templates', 'delta.md'), deltaTemplate);
  await writeFile(path.join(cwd, '.sdd', 'templates', 'tasks.md'), tasksTemplate);
}

/**
 * Claude 슬래시 커맨드 생성
 */
async function createClaudeCommands(cwd: string): Promise<void> {
  const commands = generateClaudeCommands();

  for (const cmd of commands) {
    await writeFile(
      path.join(cwd, '.claude', 'commands', `${cmd.name}.md`),
      cmd.content
    );
  }
}
