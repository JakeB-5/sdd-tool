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
export function getInitDirectories(): string[] {
  return [
    '.sdd',
    '.sdd/specs',
    '.sdd/changes',
    '.sdd/archive',
    '.sdd/templates',
    '.claude',
    '.claude/commands',
  ];
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

  const directories = getInitDirectories();
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

  // 템플릿 파일 생성
  const templateFiles = await createTemplateFiles(projectPath);
  createdFiles.push(...templateFiles);

  // Claude 슬래시 커맨드 생성
  const commandFiles = await createCommandFiles(projectPath);
  createdFiles.push(...commandFiles);

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
        if (result.value.hooks.installed.length > 0) {
          logger.listItem(`Hooks: ${result.value.hooks.installed.join(', ')}`);
        }
        if (result.value.template.installed.length > 0) {
          logger.listItem(`템플릿: ${result.value.template.installed.join(', ')}`);
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

  // Git/CI-CD 설정 프롬프트
  if (!options.skipGitSetup) {
    await promptGitSetup(cwd, options.autoApprove || false);
  }

  logger.newline();
  logger.info('다음 단계:');
  logger.listItem('constitution.md를 수정하여 프로젝트 원칙을 정의하세요');
  logger.listItem('/sdd.new 로 첫 번째 기능 명세를 작성하세요');
}
