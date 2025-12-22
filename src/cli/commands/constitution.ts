/**
 * sdd constitution 명령어
 */
import { Command } from 'commander';
import path from 'node:path';
import { readFile, writeFile, fileExists } from '../../utils/fs.js';
import { ExitCode } from '../../errors/index.js';
import * as logger from '../../utils/logger.js';
import {
  parseConstitution,
  validateConstitution,
  bumpVersion,
  generateChangelog,
  parseChangelog,
  createChangelogEntry,
  type ParsedConstitution,
  type VersionBumpType,
  type ChangeType,
  type ChangelogEntry,
} from '../../core/constitution/index.js';
import { Result, success, failure } from '../../types/index.js';

/**
 * Constitution 표시 옵션
 */
export interface ShowOptions {
  json?: boolean;
}

/**
 * 버전 범프 옵션
 */
export interface BumpOptions {
  major?: boolean;
  minor?: boolean;
  patch?: boolean;
  message?: string;
}

/**
 * 히스토리 옵션
 */
export interface HistoryOptions {
  count: string;
}

/**
 * Constitution 읽기 결과
 */
export interface ConstitutionReadResult {
  content: string;
  parsed: ParsedConstitution;
}

/**
 * 버전 범프 결과
 */
export interface BumpResult {
  previousVersion: string;
  newVersion: string;
  changelogPath: string;
}

/**
 * 범프 유형 결정 (테스트 가능)
 */
export function determineBumpType(options: BumpOptions): VersionBumpType | null {
  if (options.major) return 'major';
  if (options.minor) return 'minor';
  if (options.patch) return 'patch';
  return null;
}

/**
 * Constitution 읽기 (테스트 가능)
 */
export async function readConstitution(projectPath: string): Promise<Result<ConstitutionReadResult, Error>> {
  const constitutionPath = path.join(projectPath, '.sdd', 'constitution.md');

  if (!(await fileExists(constitutionPath))) {
    return failure(new Error('Constitution이 없습니다. `sdd init`으로 프로젝트를 초기화하세요.'));
  }

  const contentResult = await readFile(constitutionPath);
  if (!contentResult.success) {
    return failure(new Error('Constitution 파일을 읽을 수 없습니다.'));
  }

  const parseResult = parseConstitution(contentResult.data);
  if (!parseResult.success) {
    return failure(new Error(`Constitution 파싱 실패: ${parseResult.error.message}`));
  }

  return success({
    content: contentResult.data,
    parsed: parseResult.data,
  });
}

/**
 * Constitution JSON 변환 (테스트 가능)
 */
export function constitutionToJson(constitution: ParsedConstitution): object {
  return {
    projectName: constitution.projectName,
    version: constitution.metadata.version,
    created: constitution.metadata.created,
    updated: constitution.metadata.updated,
    principles: constitution.principles,
    forbidden: constitution.forbidden,
    techStack: constitution.techStack,
    qualityStandards: constitution.qualityStandards,
  };
}

/**
 * 버전 범프 실행 (테스트 가능)
 */
export async function executeBump(
  projectPath: string,
  bumpType: VersionBumpType,
  message?: string
): Promise<Result<BumpResult, Error>> {
  const constitutionPath = path.join(projectPath, '.sdd', 'constitution.md');
  const changelogPath = path.join(projectPath, '.sdd', 'CHANGELOG.md');

  const readResult = await readConstitution(projectPath);
  if (!readResult.success) {
    return failure(readResult.error);
  }

  const { content, parsed } = readResult.data;
  const currentVersion = parsed.metadata.version;
  const newVersion = bumpVersion(currentVersion, bumpType);
  const today = new Date().toISOString().split('T')[0];

  // Constitution 업데이트
  let updatedContent = content;

  // version 업데이트
  updatedContent = updatedContent.replace(
    /^version:\s*.+$/m,
    `version: ${newVersion}`
  );

  // updated 필드 추가/업데이트
  if (/^updated:/m.test(updatedContent)) {
    updatedContent = updatedContent.replace(
      /^updated:\s*.+$/m,
      `updated: ${today}`
    );
  } else {
    updatedContent = updatedContent.replace(
      /^(version:\s*.+)$/m,
      `$1\nupdated: ${today}`
    );
  }

  await writeFile(constitutionPath, updatedContent);

  // CHANGELOG 업데이트
  const changeType: ChangeType = bumpType === 'major' ? 'changed' : bumpType === 'minor' ? 'added' : 'fixed';
  const changeDescription = message || `Constitution ${bumpType} 업데이트`;

  const newEntry = createChangelogEntry(
    currentVersion,
    bumpType,
    [{ type: changeType, description: changeDescription }],
    message
  );

  let existingEntries: ChangelogEntry[] = [];
  if (await fileExists(changelogPath)) {
    const changelogContent = await readFile(changelogPath);
    if (changelogContent.success) {
      const parsed = parseChangelog(changelogContent.data);
      if (parsed.success) {
        existingEntries = parsed.data;
      }
    }
  }

  const allEntries = [newEntry, ...existingEntries];
  const newChangelog = generateChangelog(allEntries);
  await writeFile(changelogPath, newChangelog);

  return success({
    previousVersion: currentVersion,
    newVersion,
    changelogPath,
  });
}

/**
 * Constitution 검증 실행 (테스트 가능)
 */
export async function executeValidateConstitution(
  projectPath: string
): Promise<Result<ParsedConstitution, Error>> {
  const readResult = await readConstitution(projectPath);
  if (!readResult.success) {
    return failure(readResult.error);
  }

  const validationResult = validateConstitution(readResult.data.parsed);
  if (!validationResult.success) {
    return failure(new Error(`Constitution 검증 실패: ${validationResult.error.message}`));
  }

  return success(readResult.data.parsed);
}

/**
 * Changelog 이력 결과
 */
export interface HistoryResult {
  entries: ChangelogEntry[];
  totalCount: number;
}

/**
 * Changelog 이력 조회 (테스트 가능)
 */
export async function getHistory(
  projectPath: string,
  count = 10
): Promise<Result<HistoryResult, Error>> {
  const changelogPath = path.join(projectPath, '.sdd', 'CHANGELOG.md');

  if (!(await fileExists(changelogPath))) {
    return success({ entries: [], totalCount: 0 });
  }

  const contentResult = await readFile(changelogPath);
  if (!contentResult.success) {
    return failure(new Error('CHANGELOG 파일을 읽을 수 없습니다.'));
  }

  const parseResult = parseChangelog(contentResult.data);
  if (!parseResult.success) {
    return failure(new Error(`CHANGELOG 파싱 실패: ${parseResult.error.message}`));
  }

  const entries = parseResult.data.slice(0, count);
  return success({
    entries,
    totalCount: parseResult.data.length,
  });
}

/**
 * constitution 명령어 등록
 */
export function registerConstitutionCommand(program: Command): void {
  const constitution = program
    .command('constitution')
    .description('Constitution(프로젝트 원칙) 관리');

  // show 서브커맨드
  constitution
    .command('show')
    .description('현재 Constitution 내용 표시')
    .option('--json', 'JSON 형식으로 출력')
    .action(async (options: { json?: boolean }) => {
      try {
        await runShow(options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // version 서브커맨드
  constitution
    .command('version')
    .description('현재 Constitution 버전 표시')
    .action(async () => {
      try {
        await runVersion();
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // bump 서브커맨드
  constitution
    .command('bump')
    .description('Constitution 버전 업데이트')
    .option('--major', 'MAJOR 버전 업데이트 (핵심 원칙 변경)')
    .option('--minor', 'MINOR 버전 업데이트 (새 원칙 추가)')
    .option('--patch', 'PATCH 버전 업데이트 (문구 수정)')
    .option('-m, --message <message>', '변경 사유')
    .action(async (options: { major?: boolean; minor?: boolean; patch?: boolean; message?: string }) => {
      try {
        await runBump(options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // history 서브커맨드
  constitution
    .command('history')
    .description('Constitution 변경 이력 조회')
    .option('-n, --count <count>', '표시할 항목 수', '10')
    .action(async (options: { count: string }) => {
      try {
        await runHistory(options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // validate 서브커맨드
  constitution
    .command('validate')
    .description('Constitution 형식 검증')
    .action(async () => {
      try {
        await runValidate();
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // 기본 동작 (서브커맨드 없이 실행 시)
  constitution.action(async () => {
    await runShow({});
  });
}

/**
 * Constitution 표시
 */
async function runShow(options: { json?: boolean }): Promise<void> {
  const cwd = process.cwd();

  const result = await readConstitution(cwd);
  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.FILE_SYSTEM_ERROR);
  }

  const constitution = result.data.parsed;

  if (options.json) {
    console.log(JSON.stringify(constitutionToJson(constitution), null, 2));
    return;
  }

  // 콘솔 출력
  logger.info(`Constitution: ${constitution.projectName}`);
  logger.info(`버전: ${constitution.metadata.version}`);
  if (constitution.description) {
    logger.info(`설명: ${constitution.description}`);
  }
  logger.newline();

  if (constitution.principles.length > 0) {
    logger.info('핵심 원칙:');
    for (const principle of constitution.principles) {
      logger.listItem(`${principle.id}. ${principle.title}`);
      for (const rule of principle.rules) {
        logger.listItem(rule, 1);
      }
    }
    logger.newline();
  }

  if (constitution.forbidden.length > 0) {
    logger.info('금지 사항:');
    for (const item of constitution.forbidden) {
      logger.listItem(item);
    }
    logger.newline();
  }

  if (constitution.techStack.length > 0) {
    logger.info('기술 스택:');
    for (const tech of constitution.techStack) {
      logger.listItem(tech);
    }
    logger.newline();
  }

  if (constitution.qualityStandards.length > 0) {
    logger.info('품질 기준:');
    for (const standard of constitution.qualityStandards) {
      logger.listItem(standard);
    }
  }
}

/**
 * 버전 표시
 */
async function runVersion(): Promise<void> {
  const cwd = process.cwd();

  const result = await readConstitution(cwd);
  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.FILE_SYSTEM_ERROR);
  }

  console.log(result.data.parsed.metadata.version);
}

/**
 * 버전 범프
 */
async function runBump(options: { major?: boolean; minor?: boolean; patch?: boolean; message?: string }): Promise<void> {
  const cwd = process.cwd();

  // 버전 범프 유형 결정
  const bumpType = determineBumpType(options);
  if (!bumpType) {
    logger.error('버전 유형을 지정하세요: --major, --minor, 또는 --patch');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const result = await executeBump(cwd, bumpType, options.message);
  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.FILE_SYSTEM_ERROR);
  }

  logger.success(`Constitution 버전 업데이트: ${result.data.previousVersion} → ${result.data.newVersion}`);
  logger.info(`CHANGELOG 업데이트: ${result.data.changelogPath}`);
}

/**
 * 변경 이력 조회
 */
async function runHistory(options: { count: string }): Promise<void> {
  const cwd = process.cwd();
  const count = parseInt(options.count, 10) || 10;

  const result = await getHistory(cwd, count);
  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.FILE_SYSTEM_ERROR);
  }

  const { entries } = result.data;

  if (entries.length === 0) {
    logger.info('변경 이력이 없습니다.');
    return;
  }

  logger.info('Constitution 변경 이력:');
  logger.newline();

  for (const entry of entries) {
    logger.info(`[${entry.version}] - ${entry.date}`);
    for (const change of entry.changes) {
      logger.listItem(`[${change.type.toUpperCase()}] ${change.description}`);
    }
    if (entry.reason) {
      logger.listItem(`사유: ${entry.reason}`, 1);
    }
    logger.newline();
  }
}

/**
 * Constitution 검증
 */
async function runValidate(): Promise<void> {
  const cwd = process.cwd();

  const result = await executeValidateConstitution(cwd);
  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.VALIDATION_FAILED);
  }

  const constitution = result.data;
  logger.success('Constitution 검증 통과');
  logger.info(`프로젝트: ${constitution.projectName}`);
  logger.info(`버전: ${constitution.metadata.version}`);
  logger.info(`원칙 수: ${constitution.principles.length}`);
  logger.info(`금지 사항 수: ${constitution.forbidden.length}`);
}
