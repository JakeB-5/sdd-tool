/**
 * sdd migrate 명령어
 *
 * 기존 문서나 코드를 SDD 형식으로 마이그레이션합니다.
 */
import { Command } from 'commander';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';
import { findSddRoot, fileExists, ensureDir, writeFile, directoryExists } from '../../utils/fs.js';
import { generateSpec } from '../../core/new/index.js';
import { generateFeatureId } from '../../core/new/schemas.js';

/**
 * 마이그레이션 결과
 */
interface MigrationResult {
  source: string;
  target: string;
  success: boolean;
  error?: string;
}

/**
 * 마이그레이션 요약
 */
interface MigrationSummary {
  total: number;
  succeeded: number;
  failed: number;
  results: MigrationResult[];
}

/**
 * 문서 분석 결과
 */
interface DocumentAnalysis {
  title: string;
  description: string;
  requirements: string[];
  scenarios: Array<{
    name: string;
    given: string;
    when: string;
    then: string;
  }>;
  hasRfc2119: boolean;
  hasScenarios: boolean;
}

/**
 * migrate 명령어 등록
 */
export function registerMigrateCommand(program: Command): void {
  const migrate = program
    .command('migrate')
    .description('기존 문서를 SDD 형식으로 마이그레이션합니다');

  // docs 서브커맨드 - 문서 마이그레이션
  migrate
    .command('docs <source>')
    .description('마크다운 문서를 spec.md 형식으로 변환합니다')
    .option('-o, --output <dir>', '출력 디렉토리')
    .option('--dry-run', '실제 파일 생성 없이 미리보기')
    .action(async (source: string, options: { output?: string; dryRun?: boolean }) => {
      try {
        await runMigrateDocs(source, options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // analyze 서브커맨드 - 문서 분석
  migrate
    .command('analyze <file>')
    .description('문서를 분석하여 SDD 호환성을 확인합니다')
    .action(async (file: string) => {
      try {
        await runAnalyze(file);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // scan 서브커맨드 - 디렉토리 스캔
  migrate
    .command('scan [dir]')
    .description('디렉토리에서 마이그레이션 가능한 문서를 스캔합니다')
    .option('--ext <extensions>', '파일 확장자 (기본: .md)')
    .action(async (dir: string | undefined, options: { ext?: string }) => {
      try {
        await runScan(dir || '.', options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * 문서 마이그레이션 실행
 */
async function runMigrateDocs(
  source: string,
  options: { output?: string; dryRun?: boolean }
): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot && !options.output) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. --output 옵션을 사용하거나 sdd init을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const sourcePath = path.resolve(source);

  // 파일 또는 디렉토리 확인
  let files: string[] = [];
  try {
    const stat = await fs.stat(sourcePath);
    if (stat.isDirectory()) {
      files = await collectMarkdownFiles(sourcePath);
    } else if (stat.isFile()) {
      files = [sourcePath];
    }
  } catch {
    logger.error(`소스를 찾을 수 없습니다: ${source}`);
    process.exit(ExitCode.FILE_SYSTEM_ERROR);
  }

  if (files.length === 0) {
    logger.info('마이그레이션할 마크다운 파일이 없습니다.');
    return;
  }

  logger.info(`${files.length}개 파일 발견`);
  logger.newline();

  const outputDir = options.output
    ? path.resolve(options.output)
    : path.join(projectRoot!, '.sdd', 'specs');

  const summary: MigrationSummary = {
    total: files.length,
    succeeded: 0,
    failed: 0,
    results: [],
  };

  for (const file of files) {
    const result = await migrateDocument(file, outputDir, options.dryRun || false);
    summary.results.push(result);
    if (result.success) {
      summary.succeeded++;
      logger.info(`✅ ${path.basename(file)} → ${result.target}`);
    } else {
      summary.failed++;
      logger.error(`❌ ${path.basename(file)}: ${result.error}`);
    }
  }

  logger.newline();
  logger.info('=== 마이그레이션 완료 ===');
  logger.info(`총: ${summary.total}개, 성공: ${summary.succeeded}개, 실패: ${summary.failed}개`);

  if (options.dryRun) {
    logger.warn('(dry-run 모드: 실제 파일이 생성되지 않았습니다)');
  }
}

/**
 * 단일 문서 마이그레이션
 */
async function migrateDocument(
  filePath: string,
  outputDir: string,
  dryRun: boolean
): Promise<MigrationResult> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const analysis = analyzeDocument(content);

    // spec.md 생성
    const featureId = generateFeatureId(analysis.title || path.basename(filePath, '.md'));
    const specContent = generateSpec({
      id: featureId,
      title: analysis.title || path.basename(filePath, '.md'),
      description: analysis.description || '',
      requirements: analysis.requirements,
      scenarios: analysis.scenarios,
    });

    const targetDir = path.join(outputDir, featureId);
    const targetPath = path.join(targetDir, 'spec.md');

    if (!dryRun) {
      await ensureDir(targetDir);
      await writeFile(targetPath, specContent);
    }

    return {
      source: filePath,
      target: path.relative(process.cwd(), targetPath),
      success: true,
    };
  } catch (error) {
    return {
      source: filePath,
      target: '',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 문서 분석
 */
function analyzeDocument(content: string): DocumentAnalysis {
  // 제목 추출
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // 설명 추출 (첫 번째 단락)
  const descMatch = content.match(/^#[^\n]+\n\n([^#]+)/m);
  const description = descMatch ? descMatch[1].trim().split('\n')[0] : '';

  // 요구사항 추출
  const requirements: string[] = [];
  const reqMatches = content.matchAll(/(?:SHALL|MUST|SHOULD|MAY|SHALL NOT|MUST NOT)[^.]+\./gi);
  for (const match of reqMatches) {
    requirements.push(match[0].trim());
  }

  // 시나리오 추출
  const scenarios: DocumentAnalysis['scenarios'] = [];
  const givenWhenThen = content.matchAll(
    /(?:GIVEN|Given|given)[:\s]+([^\n]+)\n.*?(?:WHEN|When|when)[:\s]+([^\n]+)\n.*?(?:THEN|Then|then)[:\s]+([^\n]+)/gi
  );
  for (const match of givenWhenThen) {
    scenarios.push({
      name: `Scenario ${scenarios.length + 1}`,
      given: match[1].trim(),
      when: match[2].trim(),
      then: match[3].trim(),
    });
  }

  // RFC 2119 키워드 확인
  const hasRfc2119 = /\b(SHALL|MUST|SHOULD|MAY|SHALL NOT|MUST NOT)\b/.test(content);

  return {
    title,
    description,
    requirements,
    scenarios,
    hasRfc2119,
    hasScenarios: scenarios.length > 0,
  };
}

/**
 * 문서 분석 실행
 */
async function runAnalyze(file: string): Promise<void> {
  const filePath = path.resolve(file);

  if (!(await fileExists(filePath))) {
    logger.error(`파일을 찾을 수 없습니다: ${file}`);
    process.exit(ExitCode.FILE_SYSTEM_ERROR);
  }

  const content = await fs.readFile(filePath, 'utf-8');
  const analysis = analyzeDocument(content);

  logger.info(`📊 문서 분석: ${path.basename(file)}`);
  logger.newline();

  logger.info(`제목: ${analysis.title || '(없음)'}`);
  logger.info(`설명: ${analysis.description || '(없음)'}`);
  logger.newline();

  logger.info('SDD 호환성:');
  const rfc2119Icon = analysis.hasRfc2119 ? '✅' : '❌';
  logger.listItem(`${rfc2119Icon} RFC 2119 키워드: ${analysis.requirements.length}개`);

  const scenarioIcon = analysis.hasScenarios ? '✅' : '❌';
  logger.listItem(`${scenarioIcon} GIVEN-WHEN-THEN 시나리오: ${analysis.scenarios.length}개`);
  logger.newline();

  if (analysis.requirements.length > 0) {
    logger.info('발견된 요구사항:');
    for (const req of analysis.requirements.slice(0, 5)) {
      logger.listItem(req.substring(0, 80) + (req.length > 80 ? '...' : ''), 1);
    }
    if (analysis.requirements.length > 5) {
      logger.info(`  ... 외 ${analysis.requirements.length - 5}개`);
    }
    logger.newline();
  }

  if (analysis.scenarios.length > 0) {
    logger.info('발견된 시나리오:');
    for (const scenario of analysis.scenarios) {
      logger.listItem(`GIVEN ${scenario.given}`, 1);
      logger.listItem(`WHEN ${scenario.when}`, 1);
      logger.listItem(`THEN ${scenario.then}`, 1);
    }
    logger.newline();
  }

  // 마이그레이션 권장사항
  logger.info('💡 권장사항:');
  if (!analysis.hasRfc2119) {
    logger.listItem('RFC 2119 키워드(SHALL, MUST, SHOULD 등)를 추가하세요.', 1);
  }
  if (!analysis.hasScenarios) {
    logger.listItem('GIVEN-WHEN-THEN 형식의 시나리오를 추가하세요.', 1);
  }
  if (analysis.hasRfc2119 && analysis.hasScenarios) {
    logger.listItem('이 문서는 SDD 형식으로 마이그레이션하기에 적합합니다!', 1);
    logger.listItem('`sdd migrate docs ' + file + '`로 마이그레이션하세요.', 1);
  }
}

/**
 * 디렉토리 스캔 실행
 */
async function runScan(dir: string, options: { ext?: string }): Promise<void> {
  const dirPath = path.resolve(dir);

  if (!(await directoryExists(dirPath))) {
    logger.error(`디렉토리를 찾을 수 없습니다: ${dir}`);
    process.exit(ExitCode.FILE_SYSTEM_ERROR);
  }

  const extensions = (options.ext || '.md').split(',').map((e) => e.trim());
  const files = await collectFilesWithExtensions(dirPath, extensions);

  if (files.length === 0) {
    logger.info(`마이그레이션 가능한 파일이 없습니다 (확장자: ${extensions.join(', ')})`);
    return;
  }

  logger.info(`📂 스캔 결과: ${dir}`);
  logger.newline();

  const results: Array<{ file: string; analysis: DocumentAnalysis }> = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const analysis = analyzeDocument(content);
      results.push({ file, analysis });
    } catch {
      // 읽기 실패 무시
    }
  }

  // 적합도 순으로 정렬
  results.sort((a, b) => {
    const scoreA = (a.analysis.hasRfc2119 ? 2 : 0) + (a.analysis.hasScenarios ? 2 : 0) + a.analysis.requirements.length;
    const scoreB = (b.analysis.hasRfc2119 ? 2 : 0) + (b.analysis.hasScenarios ? 2 : 0) + b.analysis.requirements.length;
    return scoreB - scoreA;
  });

  // 결과 표시
  const ready: string[] = [];
  const partial: string[] = [];
  const notReady: string[] = [];

  for (const { file, analysis } of results) {
    const relativePath = path.relative(process.cwd(), file);
    if (analysis.hasRfc2119 && analysis.hasScenarios) {
      ready.push(relativePath);
    } else if (analysis.hasRfc2119 || analysis.hasScenarios || analysis.requirements.length > 0) {
      partial.push(relativePath);
    } else {
      notReady.push(relativePath);
    }
  }

  if (ready.length > 0) {
    logger.info('🟢 마이그레이션 준비됨:');
    for (const file of ready) {
      logger.listItem(file, 1);
    }
    logger.newline();
  }

  if (partial.length > 0) {
    logger.info('🟡 일부 수정 필요:');
    for (const file of partial) {
      logger.listItem(file, 1);
    }
    logger.newline();
  }

  if (notReady.length > 0) {
    logger.info('🔴 추가 작업 필요:');
    for (const file of notReady.slice(0, 10)) {
      logger.listItem(file, 1);
    }
    if (notReady.length > 10) {
      logger.info(`    ... 외 ${notReady.length - 10}개`);
    }
    logger.newline();
  }

  logger.info('=== 요약 ===');
  logger.info(`총: ${results.length}개, 준비됨: ${ready.length}개, 일부: ${partial.length}개, 미준비: ${notReady.length}개`);
  logger.newline();

  if (ready.length > 0) {
    logger.info('다음 명령어로 마이그레이션을 시작하세요:');
    logger.listItem(`sdd migrate docs ${ready[0]}`);
  }
}

/**
 * 마크다운 파일 수집
 */
async function collectMarkdownFiles(dirPath: string): Promise<string[]> {
  return collectFilesWithExtensions(dirPath, ['.md']);
}

/**
 * 특정 확장자 파일 수집
 */
async function collectFilesWithExtensions(dirPath: string, extensions: string[]): Promise<string[]> {
  const files: string[] = [];

  async function scan(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // 무시할 디렉토리
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', '.sdd', 'dist', 'build'].includes(entry.name)) {
          await scan(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.some((e) => e.toLowerCase() === ext)) {
          // AGENTS.md, README.md 등은 제외
          if (!['agents.md', 'readme.md', 'changelog.md', 'license.md'].includes(entry.name.toLowerCase())) {
            files.push(fullPath);
          }
        }
      }
    }
  }

  await scan(dirPath);
  return files;
}
