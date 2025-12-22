/**
 * sdd change 명령어
 *
 * 변경 제안 워크플로우를 관리합니다.
 */
import { Command } from 'commander';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import {
  generateProposal,
  generateDelta,
  parseProposal,
  parseDelta,
  validateDelta,
  updateProposalStatus,
  listPendingChanges,
  archiveChange,
  generateChangeId,
} from '../../core/change/index.js';
import { findSddRoot, directoryExists, ensureDir, writeFile, readFile, fileExists } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';
import { Result, success, failure } from '../../types/index.js';

/**
 * 변경 옵션
 */
export interface ChangeOptions {
  list?: boolean;
  title?: string;
  spec?: string;
}

/**
 * 변경 생성 결과
 */
export interface CreateChangeResult {
  id: string;
  proposalPath: string;
  deltaPath: string;
}

/**
 * 변경 정보
 */
export interface ChangeInfo {
  id: string;
  title: string;
  status: string;
  created: string;
  affectedSpecs: string[];
}

/**
 * 변경 목록 항목
 */
export interface ChangeListItem {
  id: string;
  title: string | null;
  status: string;
}

/**
 * Delta 정보
 */
export interface DeltaInfo {
  added: Array<{ content: string }>;
  modified: Array<{ content: string; before?: string; after?: string }>;
  removed: Array<{ content: string }>;
}

/**
 * 검증 결과
 */
export interface ChangeValidationResult {
  proposalValid: boolean;
  proposalTitle?: string;
  proposalError?: string;
  deltaValid: boolean;
  deltaTypes?: string[];
  deltaWarnings?: string[];
  deltaErrors?: string[];
  hasDelta: boolean;
}

/**
 * 변경 목록 조회 (테스트 가능)
 */
export async function getChangeListItems(sddPath: string): Promise<Result<ChangeListItem[], Error>> {
  const result = await listPendingChanges(sddPath);
  if (!result.success) {
    return failure(result.error);
  }

  return success(result.data.map(change => ({
    id: change.id,
    title: change.title || null,
    status: change.status,
  })));
}

/**
 * 변경 정보 조회 (테스트 가능)
 */
export async function getChangeInfo(changePath: string): Promise<Result<ChangeInfo, Error>> {
  const proposalPath = path.join(changePath, 'proposal.md');

  if (!(await fileExists(proposalPath))) {
    return failure(new Error('proposal.md를 찾을 수 없습니다.'));
  }

  const contentResult = await readFile(proposalPath);
  if (!contentResult.success) {
    return failure(new Error('proposal.md를 읽을 수 없습니다.'));
  }

  const parseResult = parseProposal(contentResult.data);
  if (!parseResult.success) {
    return failure(new Error(`proposal.md 파싱 실패: ${parseResult.error.message}`));
  }

  return success({
    id: parseResult.data.metadata.id,
    title: parseResult.data.title,
    status: parseResult.data.metadata.status,
    created: parseResult.data.metadata.created,
    affectedSpecs: parseResult.data.affectedSpecs,
  });
}

/**
 * 변경 생성 (테스트 가능)
 */
export async function createChange(
  sddPath: string,
  options: { title?: string; spec?: string }
): Promise<Result<CreateChangeResult, Error>> {
  const changesPath = path.join(sddPath, 'changes');
  await ensureDir(changesPath);

  // 기존 ID 수집
  const existingIds: string[] = [];
  try {
    const dirs = await fs.readdir(changesPath);
    existingIds.push(...dirs.filter((d) => d.startsWith('CHG-')));
  } catch {
    // 디렉토리가 없을 수 있음
  }

  const newId = generateChangeId(existingIds);
  const title = options.title || '새 변경 제안';
  const affectedSpecs = options.spec ? [options.spec] : [];

  const changePath = path.join(changesPath, newId);
  await ensureDir(changePath);

  // proposal.md 생성
  const proposal = generateProposal({
    id: newId,
    title,
    affectedSpecs,
  });
  const proposalPath = path.join(changePath, 'proposal.md');
  await writeFile(proposalPath, proposal);

  // delta.md 생성
  const delta = generateDelta({
    proposalId: newId,
    title,
  });
  const deltaPath = path.join(changePath, 'delta.md');
  await writeFile(deltaPath, delta);

  return success({
    id: newId,
    proposalPath,
    deltaPath,
  });
}

/**
 * 변경 적용 (테스트 가능)
 */
export async function applyChange(changePath: string): Promise<Result<void, Error>> {
  const proposalPath = path.join(changePath, 'proposal.md');

  if (!(await fileExists(proposalPath))) {
    return failure(new Error('proposal.md를 찾을 수 없습니다.'));
  }

  const contentResult = await readFile(proposalPath);
  if (!contentResult.success) {
    return failure(new Error('proposal.md를 읽을 수 없습니다.'));
  }

  const updateResult = updateProposalStatus(contentResult.data, 'applied');
  if (!updateResult.success) {
    return failure(new Error('proposal.md를 업데이트할 수 없습니다.'));
  }

  await writeFile(proposalPath, updateResult.data);
  return success(undefined);
}

/**
 * Delta 정보 조회 (테스트 가능)
 */
export async function getDeltaInfo(changePath: string): Promise<Result<DeltaInfo, Error>> {
  const deltaPath = path.join(changePath, 'delta.md');

  if (!(await fileExists(deltaPath))) {
    return failure(new Error('delta.md를 찾을 수 없습니다.'));
  }

  const deltaResult = await readFile(deltaPath);
  if (!deltaResult.success) {
    return failure(new Error('delta.md를 읽을 수 없습니다.'));
  }

  const parseResult = parseDelta(deltaResult.data);
  if (!parseResult.success) {
    return failure(new Error(`Delta 파싱 실패: ${parseResult.error.message}`));
  }

  return success({
    added: parseResult.data.added,
    modified: parseResult.data.modified,
    removed: parseResult.data.removed,
  });
}

/**
 * 변경 제안 검증 (테스트 가능)
 */
export async function validateChange(changePath: string): Promise<Result<ChangeValidationResult, Error>> {
  const result: ChangeValidationResult = {
    proposalValid: false,
    deltaValid: false,
    hasDelta: false,
  };

  // Proposal 검증
  const proposalPath = path.join(changePath, 'proposal.md');
  if (await fileExists(proposalPath)) {
    const proposalResult = await readFile(proposalPath);
    if (proposalResult.success) {
      const parsed = parseProposal(proposalResult.data);
      if (parsed.success) {
        result.proposalValid = true;
        result.proposalTitle = parsed.data.title;
      } else {
        result.proposalError = parsed.error.message;
      }
    }
  } else {
    result.proposalError = 'proposal.md가 없습니다.';
  }

  // Delta 검증
  const deltaPath = path.join(changePath, 'delta.md');
  if (await fileExists(deltaPath)) {
    result.hasDelta = true;
    const deltaResult = await readFile(deltaPath);
    if (deltaResult.success) {
      const validation = validateDelta(deltaResult.data);
      if (validation.valid) {
        result.deltaValid = true;
        const types: string[] = [];
        if (validation.hasAdded) types.push('ADDED');
        if (validation.hasModified) types.push('MODIFIED');
        if (validation.hasRemoved) types.push('REMOVED');
        result.deltaTypes = types;
        result.deltaWarnings = validation.warnings;
      } else {
        result.deltaErrors = validation.errors;
      }
    }
  }

  return success(result);
}

/**
 * change 명령어 등록
 */
export function registerChangeCommand(program: Command): void {
  const change = program
    .command('change [id]')
    .description('변경 제안을 생성하거나 관리합니다')
    .option('-l, --list', '진행 중인 변경 목록')
    .option('-t, --title <title>', '변경 제안 제목')
    .option('-s, --spec <spec>', '대상 스펙 경로')
    .action(async (id: string | undefined, options: {
      list?: boolean;
      title?: string;
      spec?: string;
    }) => {
      try {
        await runChange(id, options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // apply 서브커맨드
  change
    .command('apply <id>')
    .description('변경 제안을 스펙에 적용합니다')
    .action(async (id: string) => {
      try {
        await runApply(id);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // archive 서브커맨드
  change
    .command('archive <id>')
    .description('완료된 변경을 아카이브합니다')
    .action(async (id: string) => {
      try {
        await runArchive(id);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // diff 서브커맨드
  change
    .command('diff <id>')
    .description('변경 제안의 diff를 표시합니다')
    .action(async (id: string) => {
      try {
        await runDiff(id);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // validate 서브커맨드
  change
    .command('validate <id>')
    .description('변경 제안의 유효성을 검증합니다')
    .action(async (id: string) => {
      try {
        await runValidateChange(id);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * 변경 제안 생성/조회
 */
async function runChange(
  id: string | undefined,
  options: { list?: boolean; title?: string; spec?: string }
): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');

  // 목록 출력
  if (options.list) {
    const result = await getChangeListItems(sddPath);
    if (!result.success) {
      logger.error(result.error.message);
      process.exit(ExitCode.GENERAL_ERROR);
    }

    if (result.data.length === 0) {
      logger.info('진행 중인 변경이 없습니다.');
      return;
    }

    logger.info('진행 중인 변경:');
    logger.newline();
    for (const change of result.data) {
      const statusIcon = change.status === 'approved' ? '✓' : '○';
      logger.listItem(`${statusIcon} ${change.id}: ${change.title || '(제목 없음)'} [${change.status}]`);
    }
    return;
  }

  // 기존 변경 조회
  if (id) {
    const changePath = path.join(sddPath, 'changes', id);
    if (!(await directoryExists(changePath))) {
      logger.error(`변경을 찾을 수 없습니다: ${id}`);
      process.exit(ExitCode.GENERAL_ERROR);
    }

    const infoResult = await getChangeInfo(changePath);
    if (infoResult.success) {
      logger.info(`변경 제안: ${infoResult.data.title}`);
      logger.info(`상태: ${infoResult.data.status}`);
      logger.info(`생성: ${infoResult.data.created}`);
      if (infoResult.data.affectedSpecs.length > 0) {
        logger.info('영향 스펙:');
        infoResult.data.affectedSpecs.forEach((spec) => logger.listItem(spec, 1));
      }
    } else {
      logger.error(infoResult.error.message);
    }
    return;
  }

  // 새 변경 생성
  const createResult = await createChange(sddPath, options);
  if (!createResult.success) {
    logger.error(createResult.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const newId = createResult.data.id;
  logger.success(`변경 제안이 생성되었습니다: ${newId}`);
  logger.newline();
  logger.info('생성된 파일:');
  logger.listItem(`.sdd/changes/${newId}/proposal.md`);
  logger.listItem(`.sdd/changes/${newId}/delta.md`);
  logger.newline();
  logger.info('다음 단계:');
  logger.listItem('proposal.md를 수정하여 변경 내용을 작성하세요');
  logger.listItem('delta.md에 ADDED/MODIFIED/REMOVED를 작성하세요');
  logger.listItem(`\`sdd change apply ${newId}\`로 적용하세요`);
}

/**
 * 변경 적용
 */
async function runApply(id: string): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');
  const changePath = path.join(sddPath, 'changes', id);

  if (!(await directoryExists(changePath))) {
    logger.error(`변경을 찾을 수 없습니다: ${id}`);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const result = await applyChange(changePath);
  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  logger.success(`변경이 적용 상태로 변경되었습니다: ${id}`);
  logger.newline();
  logger.info('다음 단계:');
  logger.listItem('delta.md를 참조하여 스펙을 수정하세요');
  logger.listItem('구현이 완료되면 `sdd change archive ${id}`를 실행하세요');
}

/**
 * 변경 아카이브
 */
async function runArchive(id: string): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');
  const result = await archiveChange(sddPath, id);

  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  logger.success(`변경이 아카이브되었습니다: ${id}`);
  logger.info(`위치: ${result.data.archiveDir}`);
}

/**
 * 변경 diff 표시
 */
async function runDiff(id: string): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');
  const changePath = path.join(sddPath, 'changes', id);

  if (!(await directoryExists(changePath))) {
    logger.error(`변경을 찾을 수 없습니다: ${id}`);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const deltaResult = await getDeltaInfo(changePath);
  if (!deltaResult.success) {
    logger.error(deltaResult.error.message);
    process.exit(ExitCode.FILE_SYSTEM_ERROR);
  }

  const delta = deltaResult.data;

  logger.info(`변경 Diff: ${id}`);
  logger.newline();

  // ADDED
  if (delta.added.length > 0 && delta.added[0].content !== '(추가되는 스펙 내용)') {
    logger.info('📗 ADDED:');
    for (const item of delta.added) {
      console.log(`  + ${item.content.split('\n')[0]}...`);
    }
    logger.newline();
  }

  // MODIFIED
  if (delta.modified.length > 0) {
    logger.info('📘 MODIFIED:');
    for (const item of delta.modified) {
      if (item.before && item.after) {
        logger.info('  Before:');
        for (const line of item.before.split('\n').slice(0, 3)) {
          console.log(`    - ${line}`);
        }
        logger.info('  After:');
        for (const line of item.after.split('\n').slice(0, 3)) {
          console.log(`    + ${line}`);
        }
      } else {
        console.log(`  ~ ${item.content.split('\n')[0]}...`);
      }
    }
    logger.newline();
  }

  // REMOVED
  if (delta.removed.length > 0 && delta.removed[0].content !== '(삭제되는 스펙 참조)') {
    logger.info('📕 REMOVED:');
    for (const item of delta.removed) {
      console.log(`  - ${item.content.split('\n')[0]}...`);
    }
    logger.newline();
  }
}

/**
 * 변경 제안 유효성 검증
 */
async function runValidateChange(id: string): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sddPath = path.join(projectRoot, '.sdd');
  const changePath = path.join(sddPath, 'changes', id);

  if (!(await directoryExists(changePath))) {
    logger.error(`변경을 찾을 수 없습니다: ${id}`);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const validationResult = await validateChange(changePath);
  if (!validationResult.success) {
    logger.error(validationResult.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const result = validationResult.data;
  let hasErrors = false;

  // Proposal 결과 출력
  if (result.proposalValid) {
    logger.success(`✓ proposal.md 유효 (${result.proposalTitle})`);
  } else {
    logger.error(`✗ proposal.md 오류: ${result.proposalError}`);
    hasErrors = true;
  }

  // Delta 결과 출력
  if (result.hasDelta) {
    if (result.deltaValid) {
      logger.success(`✓ delta.md 유효 (${result.deltaTypes?.join(', ')})`);
      if (result.deltaWarnings) {
        for (const warning of result.deltaWarnings) {
          logger.warn(`  ⚠ ${warning}`);
        }
      }
    } else {
      logger.error(`✗ delta.md 오류:`);
      if (result.deltaErrors) {
        for (const error of result.deltaErrors) {
          logger.error(`  - ${error}`);
        }
      }
      hasErrors = true;
    }
  } else {
    logger.warn('⚠ delta.md가 없습니다.');
  }

  logger.newline();
  if (hasErrors) {
    logger.error(`검증 실패: ${id}`);
    process.exit(ExitCode.VALIDATION_FAILED);
  } else {
    logger.success(`검증 통과: ${id}`);
  }
}
