/**
 * sdd transition 명령어 - 워크플로우 간 전환
 *
 * new ↔ change 워크플로우 간 전환을 지원합니다.
 */
import { Command } from 'commander';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';
import { findSddRoot, fileExists, readFile, ensureDir, writeFile, directoryExists, findSpecPath } from '../../utils/fs.js';
import { generateChangeId } from '../../core/change/index.js';
import { Result, success, failure } from '../../types/index.js';

/**
 * 전환 방향
 */
export type TransitionDirection = 'new-to-change' | 'change-to-new';

/**
 * new → change 전환 옵션
 */
export interface NewToChangeOptions {
  title?: string;
  reason?: string;
}

/**
 * change → new 전환 옵션
 */
export interface ChangeToNewOptions {
  name?: string;
  reason?: string;
}

/**
 * new → change 전환 결과
 */
export interface NewToChangeResult {
  changeId: string;
  changePath: string;
  filesCreated: string[];
}

/**
 * change → new 전환 결과
 */
export interface ChangeToNewResult {
  featureName: string;
  featurePath: string;
  filesCreated: string[];
  originalChangeId: string;
}

/**
 * 기존 변경 ID 목록 가져오기 (테스트 가능)
 */
export async function getExistingChangeIds(sddPath: string): Promise<string[]> {
  const changesPath = path.join(sddPath, 'changes');
  try {
    const dirs = await fs.readdir(changesPath);
    return dirs.filter((d) => d.startsWith('CHG-'));
  } catch {
    return [];
  }
}

/**
 * proposal.md에서 제목 추출 (테스트 가능)
 */
export async function extractProposalTitle(proposalPath: string): Promise<string> {
  if (!(await fileExists(proposalPath))) {
    return '';
  }
  const content = await readFile(proposalPath);
  if (!content.success) {
    return '';
  }
  const titleMatch = content.data.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1] : '';
}

/**
 * new → change 전환 실행 (테스트 가능)
 */
export async function transitionNewToChange(
  sddPath: string,
  specId: string,
  options: NewToChangeOptions
): Promise<Result<NewToChangeResult, Error>> {
  // 도메인 기반 경로 탐색
  const specDir = await findSpecPath(sddPath, specId);
  if (!specDir) {
    return failure(new Error(`스펙을 찾을 수 없습니다: ${specId}`));
  }

  const specPath = path.join(specDir, 'spec.md');
  if (!(await fileExists(specPath))) {
    return failure(new Error(`스펙을 찾을 수 없습니다: ${specId}`));
  }

  // 기존 변경 ID 목록 가져오기
  const existingIds = await getExistingChangeIds(sddPath);

  // 변경 ID 생성
  const changeId = generateChangeId(existingIds);
  const changesPath = path.join(sddPath, 'changes');
  const changePath = path.join(changesPath, changeId);
  await ensureDir(changePath);

  // proposal.md 생성
  const title = options.title || `${specId} 기능 확장`;
  const reason = options.reason || 'new 워크플로우에서 전환됨';
  const proposalContent = generateTransitionProposal(specId, title, reason, 'new-to-change');
  await writeFile(path.join(changePath, 'proposal.md'), proposalContent);

  // delta.md 생성
  const deltaContent = generateDeltaTemplate(specId);
  await writeFile(path.join(changePath, 'delta.md'), deltaContent);

  // tasks.md 생성
  const tasksContent = generateTasksTemplate();
  await writeFile(path.join(changePath, 'tasks.md'), tasksContent);

  return success({
    changeId,
    changePath,
    filesCreated: ['proposal.md', 'delta.md', 'tasks.md'],
  });
}

/**
 * change → new 전환 실행 (테스트 가능)
 */
export async function transitionChangeToNew(
  sddPath: string,
  changeId: string,
  options: ChangeToNewOptions
): Promise<Result<ChangeToNewResult, Error>> {
  const changePath = path.join(sddPath, 'changes', changeId);

  if (!(await directoryExists(changePath))) {
    return failure(new Error(`변경 제안을 찾을 수 없습니다: ${changeId}`));
  }

  // proposal.md에서 제목 추출
  const proposalPath = path.join(changePath, 'proposal.md');
  const extractedTitle = await extractProposalTitle(proposalPath);

  // 새 기능 이름 결정
  const featureName = options.name ||
    extractedTitle.toLowerCase().replace(/\s+/g, '-') ||
    `feature-from-${changeId}`;
  // 도메인 미지정 시 common 폴더에 생성
  const specsPath = path.join(sddPath, 'specs', 'common');
  const newSpecPath = path.join(specsPath, featureName);

  if (await directoryExists(newSpecPath)) {
    return failure(new Error(`스펙이 이미 존재합니다: ${featureName}`));
  }

  await ensureDir(newSpecPath);

  // spec.md 생성
  const reason = options.reason || 'change 워크플로우에서 전환됨';
  const specContent = generateTransitionSpec(featureName, extractedTitle || featureName, reason, changeId);
  await writeFile(path.join(newSpecPath, 'spec.md'), specContent);

  // plan.md 생성
  const planContent = generatePlanTemplate(featureName);
  await writeFile(path.join(newSpecPath, 'plan.md'), planContent);

  // tasks.md 생성
  const tasksContent = generateTasksTemplate();
  await writeFile(path.join(newSpecPath, 'tasks.md'), tasksContent);

  // 원본 변경 제안 상태 업데이트
  const statusPath = path.join(changePath, '.status');
  await writeFile(statusPath, JSON.stringify({
    status: 'transitioned',
    transitionedTo: featureName,
    transitionedAt: new Date().toISOString(),
    reason,
  }, null, 2));

  return success({
    featureName,
    featurePath: newSpecPath,
    filesCreated: ['spec.md', 'plan.md', 'tasks.md'],
    originalChangeId: changeId,
  });
}

/**
 * 전환 가이드 텍스트 (테스트 가능)
 */
export function getTransitionGuide(): string {
  return `=== 워크플로우 전환 가이드 ===

## new → change 전환

사용 시점:
- 새 기능 작성 중 기존 스펙과 중복 발견
- 기존 기능 확장이 더 적절한 경우
- 의존성 분석 결과 기존 스펙 수정 필요

명령어:
sdd transition new-to-change <spec-id>
  -t, --title <title>  : 변경 제안 제목
  -r, --reason <reason>: 전환 사유

## change → new 전환

사용 시점:
- 변경 범위가 너무 커서 별도 기능으로 분리 필요
- 기존 스펙과 독립적인 새 기능으로 발전
- 영향도 분석 결과 분리가 안전

명령어:
sdd transition change-to-new <change-id>
  -n, --name <name>    : 새 기능 이름
  -r, --reason <reason>: 전환 사유

## 전환 판단 기준

new → change:
- 영향받는 스펙 수 ≤ 3개
- 변경이 기존 기능의 자연스러운 확장
- 새 시나리오 추가보다 기존 시나리오 수정 중심

change → new:
- 영향받는 스펙 수 > 3개
- 새로운 개념/도메인 도입
- 기존 스펙과 독립적으로 테스트 가능`;
}

/**
 * transition 명령어 등록
 */
export function registerTransitionCommand(program: Command): void {
  const transition = program
    .command('transition')
    .description('워크플로우 간 전환을 수행합니다');

  // new → change 전환
  transition
    .command('new-to-change <spec-id>')
    .description('새 기능 작업을 기존 스펙 변경으로 전환합니다')
    .option('-t, --title <title>', '변경 제안 제목')
    .option('-r, --reason <reason>', '전환 사유')
    .action(async (specId: string, options: { title?: string; reason?: string }) => {
      try {
        await runNewToChange(specId, options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // change → new 전환
  transition
    .command('change-to-new <change-id>')
    .description('기존 스펙 변경 작업을 새 기능으로 전환합니다')
    .option('-n, --name <name>', '새 기능 이름')
    .option('-r, --reason <reason>', '전환 사유')
    .action(async (changeId: string, options: { name?: string; reason?: string }) => {
      try {
        await runChangeToNew(changeId, options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // 전환 가이드
  transition
    .command('guide')
    .description('워크플로우 전환 가이드를 표시합니다')
    .action(() => {
      displayTransitionGuide();
    });
}

/**
 * new → change 전환 실행 (CLI 핸들러)
 */
async function runNewToChange(
  specId: string,
  options: { title?: string; reason?: string }
): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');

  logger.info('=== 워크플로우 전환: new → change ===');
  logger.newline();
  logger.info(`대상 스펙: ${specId}`);

  const result = await transitionNewToChange(sddPath, specId, options);
  if (!result.success) {
    logger.error(result.error.message);
    logger.info('사용 가능한 스펙 목록은 `sdd list`로 확인하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const { changeId } = result.data;

  logger.newline();
  logger.success(`전환 완료! 변경 제안이 생성되었습니다.`);
  logger.newline();
  logger.info(`변경 ID: ${changeId}`);
  logger.info(`위치: .sdd/changes/${changeId}/`);
  logger.newline();
  logger.info('다음 단계:');
  logger.listItem(`1. .sdd/changes/${changeId}/proposal.md 편집`);
  logger.listItem(`2. .sdd/changes/${changeId}/delta.md 작성`);
  logger.listItem(`3. sdd change validate ${changeId}`);
  logger.listItem(`4. sdd change apply ${changeId}`);
  logger.newline();
  logger.info('또는 슬래시 커맨드 사용:');
  logger.listItem('/sdd.change - 변경 내용 작성 도움');
}

/**
 * change → new 전환 실행 (CLI 핸들러)
 */
async function runChangeToNew(
  changeId: string,
  options: { name?: string; reason?: string }
): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');

  logger.info('=== 워크플로우 전환: change → new ===');
  logger.newline();
  logger.info(`원본 변경: ${changeId}`);

  const result = await transitionChangeToNew(sddPath, changeId, options);
  if (!result.success) {
    logger.error(result.error.message);
    if (result.error.message.includes('찾을 수 없습니다')) {
      logger.info('진행 중인 변경 목록은 `sdd change -l`로 확인하세요.');
    } else if (result.error.message.includes('이미 존재')) {
      logger.info('다른 이름을 지정하세요: --name <name>');
    }
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const { featureName, originalChangeId } = result.data;

  logger.newline();
  logger.success(`전환 완료! 새 기능 스펙이 생성되었습니다.`);
  logger.newline();
  logger.info(`기능 이름: ${featureName}`);
  logger.info(`위치: .sdd/specs/common/${featureName}/`);
  logger.info(`원본 변경 ${originalChangeId}은 'transitioned' 상태로 변경되었습니다.`);
  logger.newline();
  logger.info('다음 단계:');
  logger.listItem(`1. .sdd/specs/common/${featureName}/spec.md 편집`);
  logger.listItem(`2. sdd new plan common/${featureName}`);
  logger.listItem(`3. sdd new tasks common/${featureName}`);
  logger.listItem(`4. 구현 진행`);
  logger.newline();
  logger.info('또는 슬래시 커맨드 사용:');
  logger.listItem('/sdd.new - 명세 작성 도움');
}

/**
 * 전환 가이드 표시 (CLI 핸들러)
 */
function displayTransitionGuide(): void {
  console.log(getTransitionGuide());
}

/**
 * 전환용 proposal.md 생성
 */
function generateTransitionProposal(
  specId: string,
  title: string,
  reason: string,
  direction: TransitionDirection
): string {
  const now = new Date().toISOString().split('T')[0];
  return `---
id: ${specId}-change
title: "${title}"
target_spec: ${specId}
status: draft
created_at: ${now}
transition_from: ${direction === 'new-to-change' ? 'new' : 'change'}
transition_reason: "${reason}"
---

# ${title}

## 배경

> 이 변경 제안은 \`${direction}\` 워크플로우 전환으로 생성되었습니다.
> 전환 사유: ${reason}

<!-- 변경이 필요한 배경을 설명하세요 -->

## 변경 목적

<!-- 이 변경으로 달성하려는 목표를 설명하세요 -->

## 영향 범위

- 대상 스펙: \`${specId}\`

<!-- 관련된 다른 스펙이 있다면 나열하세요 -->

## 제약 사항

<!-- 이 변경의 제약 조건을 설명하세요 -->

## 참고 사항

<!-- 추가 참고 정보가 있다면 작성하세요 -->
`;
}

/**
 * delta.md 템플릿 생성
 */
function generateDeltaTemplate(specId: string): string {
  return `---
target: ${specId}
---

# Delta: ${specId}

## ADDED

<!-- 추가되는 요구사항/시나리오 -->

## MODIFIED

<!-- 변경되는 내용 (Before/After) -->

### 요구사항 변경

**Before:**
\`\`\`
<!-- 기존 내용 -->
\`\`\`

**After:**
\`\`\`
<!-- 변경된 내용 -->
\`\`\`

## REMOVED

<!-- 제거되는 내용 (있는 경우) -->
`;
}

/**
 * 전환용 spec.md 생성
 */
function generateTransitionSpec(
  featureName: string,
  title: string,
  reason: string,
  fromChangeId: string
): string {
  const now = new Date().toISOString().split('T')[0];
  return `---
id: ${featureName}
title: "${title}"
status: draft
created_at: ${now}
transition_from: change
transition_change_id: ${fromChangeId}
transition_reason: "${reason}"
---

# ${title}

> 이 명세는 변경 제안 \`${fromChangeId}\`에서 분리되어 생성되었습니다.
> 전환 사유: ${reason}

## 개요

<!-- 기능 개요를 작성하세요 -->

## 요구사항

### 기능 요구사항

<!-- RFC 2119 키워드(MUST, SHOULD, MAY)를 사용하세요 -->

### 비기능 요구사항

<!-- 성능, 보안 등 비기능 요구사항 -->

## 시나리오

### 기본 시나리오

\`\`\`gherkin
GIVEN 초기 상태
WHEN 사용자가 동작을 수행하면
THEN 기대 결과가 발생한다
\`\`\`

## 의존성

<!-- 관련 스펙 참조 -->

## 비고

<!-- 추가 참고 사항 -->
`;
}

/**
 * plan.md 템플릿 생성
 */
function generatePlanTemplate(featureName: string): string {
  return `---
spec: ${featureName}
status: draft
---

# 구현 계획: ${featureName}

## 기술 결정

<!-- 구현에 필요한 기술 결정 사항 -->

## 구현 전략

<!-- 단계별 구현 전략 -->

## 영향 분석

<!-- 이 구현이 다른 부분에 미치는 영향 -->

## 테스트 전략

<!-- 테스트 방법 및 범위 -->

## 위험 요소

<!-- 구현 시 고려할 위험 요소 -->
`;
}

/**
 * tasks.md 템플릿 생성
 */
function generateTasksTemplate(): string {
  return `---
status: pending
---

# Tasks

## 작업 목록

- [ ] 작업 1
- [ ] 작업 2
- [ ] 작업 3

## 완료 조건

- [ ] 모든 시나리오 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 문서 업데이트
`;
}
