/**
 * sdd new 명령어 - 신규 기능 생성
 */
import { Command } from 'commander';
import path from 'node:path';
import {
  generateFeatureId,
  generateSpec,
  generatePlan,
  generateTasks,
  createBranch,
  isGitRepository,
  generateFullChecklistMarkdown,
  getNextFeatureNumber,
  peekNextFeatureNumber,
  getFeatureHistory,
  type GenerateTasksOptions,
} from '../../core/new/index.js';
import { logger } from '../../utils/index.js';
import { ensureDir, fileExists, readFile, writeFile, findSddRoot } from '../../utils/fs.js';
import { resolveSpec } from '../../core/spec/locator.js';
import { parseConstitution } from '../../core/constitution/index.js';
import { Result, success, failure } from '../../types/index.js';
import { ExitCode } from '../../errors/index.js';
import { createDomainService } from '../../core/domain/service.js';
import { isValidDomainId } from '../../schemas/domains.schema.js';
import { createContextManager } from '../../core/context/manager.js';

/**
 * 새 기능 옵션
 */
export interface NewFeatureOptions {
  title?: string;
  description?: string;
  branch?: boolean;
  numbered?: boolean;
  plan?: boolean;
  tasks?: boolean;
  all?: boolean;
  checklist?: boolean;
  domain?: string;
  force?: boolean;
}

/**
 * 기능 생성 결과
 */
export interface CreateFeatureResult {
  featureId: string;
  featurePath: string;
  branchName?: string;
  filesCreated: string[];
  domain?: string;
  /** True when the domain did not exist and was created for this feature. */
  domainCreated?: boolean;
}

/**
 * Default task breakdown for a new tasks.md. Implementation tasks are test-first,
 * so there is no separate after-the-fact "write tests" task.
 */
const TEST_FIRST_DESCRIPTION =
  '테스트 우선: 스펙 시나리오(GIVEN-WHEN-THEN)를 실패하는 테스트로 먼저 작성한 뒤, 테스트를 통과하도록 구현';

const DEFAULT_TASKS: GenerateTasksOptions['tasks'] = [
  { title: '기반 구조 설정', priority: 'high', description: TEST_FIRST_DESCRIPTION },
  { title: '핵심 기능 구현', priority: 'high', description: TEST_FIRST_DESCRIPTION },
  { title: '문서 업데이트', priority: 'low' },
];

/**
 * Refuse to overwrite existing files unless forced.
 */
async function refuseOverwrite(filePaths: string[], force?: boolean): Promise<Result<void, Error>> {
  if (force) {
    return success(undefined);
  }
  const existing: string[] = [];
  for (const filePath of filePaths) {
    if (await fileExists(filePath)) {
      existing.push(filePath);
    }
  }
  if (existing.length === 0) {
    return success(undefined);
  }
  return failure(
    new Error(`파일이 이미 존재합니다: ${existing.join(', ')} (덮어쓰려면 --force 옵션을 사용하세요)`)
  );
}

/**
 * 도메인/기능 이름 파싱
 */
export function parseDomainFeatureName(input: string): { domain?: string; name: string } {
  if (input.includes('/')) {
    const [domain, ...rest] = input.split('/');
    return { domain, name: rest.join('/') };
  }
  return { name: input };
}

/**
 * 카운터 상태
 */
export interface CounterStatus {
  nextNumber: number;
  totalFeatures: number;
}

/**
 * Constitution 버전 조회 (테스트 가능)
 */
export async function getConstitutionVersion(sddPath: string): Promise<string | undefined> {
  const constitutionPath = path.join(sddPath, 'constitution.md');
  if (!(await fileExists(constitutionPath))) {
    return undefined;
  }

  const constResult = await readFile(constitutionPath);
  if (!constResult.success) {
    return undefined;
  }

  const parseResult = parseConstitution(constResult.data);
  if (!parseResult.success) {
    return undefined;
  }

  return parseResult.data.metadata.version;
}

/**
 * 도메인 자동 감지
 * 1. 현재 컨텍스트에서 단일 활성 도메인이 있으면 사용
 * 2. 없으면 undefined 반환
 */
export async function detectDomain(projectPath: string): Promise<string | undefined> {
  const manager = createContextManager(projectPath);
  const contextResult = await manager.get();

  if (!contextResult.success) {
    return undefined;
  }

  const { activeDomains } = contextResult.data;

  // 단일 활성 도메인이 있으면 자동 선택
  if (activeDomains.length === 1) {
    return activeDomains[0];
  }

  return undefined;
}

/**
 * 도메인 존재 여부 검증
 */
export async function validateDomain(projectPath: string, domainId: string): Promise<Result<void, Error>> {
  const domainService = createDomainService(projectPath);
  const result = await domainService.get(domainId);

  if (!result.success) {
    return result;
  }

  if (!result.data) {
    return failure(new Error(`도메인을 찾을 수 없습니다: ${domainId}`));
  }

  return success(undefined);
}

/**
 * 기능 생성 (테스트 가능)
 */
export async function createFeature(
  sddPath: string,
  name: string,
  options: NewFeatureOptions
): Promise<Result<CreateFeatureResult, Error>> {
  const projectPath = path.dirname(sddPath);

  // 도메인 파싱 (입력에서 <domain>/<name> 형식 지원)
  const parsed = parseDomainFeatureName(name);
  const effectiveName = parsed.name;

  // Reject `<domain>/` (empty feature) and `/<feature>` (empty domain) before anything is written
  if (parsed.domain === '') {
    return failure(new Error(`도메인 이름이 비어 있습니다: '${name}' (형식: <domain>/<feature>)`));
  }
  if (!generateFeatureId(effectiveName)) {
    return failure(new Error(`기능 이름이 비어 있습니다: '${name}' (형식: <domain>/<feature> 또는 <feature>)`));
  }

  let domain = options.domain || parsed.domain;

  // 도메인이 없으면 자동 감지 시도
  if (!domain) {
    domain = await detectDomain(projectPath);
  }

  // 도메인이 지정되었으면 형식(경로 조작 방지) 검증 및 존재 여부 확인
  let domainMissing = false;
  if (domain) {
    if (!isValidDomainId(domain)) {
      return failure(
        new Error(
          `유효하지 않은 도메인 ID입니다: ${domain} (영문 소문자로 시작하고, 소문자/숫자/하이픈만 사용할 수 있습니다)`
        )
      );
    }
    const domainResult = await createDomainService(projectPath).get(domain);
    if (!domainResult.success) {
      return domainResult;
    }
    if (!domainResult.data && domain === 'common') {
      // Unregistered `common` is the default bucket: same as no domain (no auto-create, no link)
      domain = undefined;
    } else {
      domainMissing = !domainResult.data;
    }
  }

  // 실제 디렉토리에 사용할 도메인 (없으면 'common')
  const effectiveDomain = domain || 'common';

  // 기능 ID 생성
  let featureId: string;
  let branchName: string | undefined;

  if (options.numbered) {
    const numberResult = await getNextFeatureNumber(sddPath, effectiveName);
    if (!numberResult.success) {
      return failure(new Error(`번호 생성 실패: ${numberResult.error.message}`));
    }
    featureId = numberResult.data.fullId;
    branchName = numberResult.data.branchName;
  } else {
    featureId = generateFeatureId(effectiveName);
  }

  const title = options.title || effectiveName;
  const description = options.description || `${title} 기능 명세`;
  const featurePath = path.join(sddPath, 'specs', effectiveDomain, featureId);

  // Refuse before writing anything if any target file already exists
  const targetFiles = ['spec.md'];
  if (options.plan || options.all) targetFiles.push('plan.md');
  if (options.tasks || options.all) targetFiles.push('tasks.md');
  if (options.checklist || options.all) targetFiles.push('checklist.md');
  const overwriteCheck = await refuseOverwrite(
    targetFiles.map((file) => path.join(featurePath, file)),
    options.force
  );
  if (!overwriteCheck.success) {
    if (targetFiles.length > 1 && (await fileExists(path.join(featurePath, 'spec.md')))) {
      const ref = `${effectiveDomain}/${featureId}`;
      return failure(
        new Error(
          `${overwriteCheck.error.message}\n기존 기능에 파일을 추가하려면 sdd new plan ${ref}, sdd new tasks ${ref}, sdd new checklist를 사용하세요`
        )
      );
    }
    return overwriteCheck;
  }

  // Missing domain: create it, same as `sdd domain create <domain>` (default description)
  if (domain && domainMissing) {
    const createResult = await createDomainService(projectPath).create(domain, {
      description: `${domain} 도메인`,
    });
    if (!createResult.success) {
      return failure(new Error(`도메인 생성 실패: ${createResult.error.message}`));
    }
  }

  // 기능 디렉토리 생성
  const dirResult = await ensureDir(featurePath);
  if (!dirResult.success) {
    return failure(new Error(`디렉토리 생성 실패: ${featurePath}`));
  }

  // Constitution 버전 읽기
  const constitutionVersion = await getConstitutionVersion(sddPath);

  const filesCreated: string[] = [];

  // Write a generated file and record it; any write failure aborts feature creation.
  const writeGenerated = async (fileName: string, content: string): Promise<Result<void, Error>> => {
    const writeResult = await writeFile(path.join(featurePath, fileName), content);
    if (!writeResult.success) {
      return failure(new Error(`파일 생성 실패: ${writeResult.error.message}`));
    }
    filesCreated.push(fileName);
    return success(undefined);
  };

  // spec.md 생성
  const specContent = generateSpec({
    id: featureId,
    title,
    description,
    domain,
    constitutionVersion,
  });
  const specWrite = await writeGenerated('spec.md', specContent);
  if (!specWrite.success) return specWrite;

  // plan.md 생성
  if (options.plan || options.all) {
    const planContent = generatePlan({
      featureId,
      featureTitle: title,
      overview: description,
    });
    const planWrite = await writeGenerated('plan.md', planContent);
    if (!planWrite.success) return planWrite;
  }

  // tasks.md 생성
  if (options.tasks || options.all) {
    const tasksContent = generateTasks({
      featureId,
      featureTitle: title,
      tasks: DEFAULT_TASKS,
    });
    const tasksWrite = await writeGenerated('tasks.md', tasksContent);
    if (!tasksWrite.success) return tasksWrite;
  }

  // 체크리스트 생성
  if (options.checklist || options.all) {
    const checklistContent = generateFullChecklistMarkdown();
    const checklistWrite = await writeGenerated('checklist.md', checklistContent);
    if (!checklistWrite.success) return checklistWrite;
  }

  // 도메인에 스펙 연결
  if (domain) {
    const domainService = createDomainService(projectPath);
    const linkResult = await domainService.linkSpec(domain, featureId);
    if (!linkResult.success) {
      // 연결 실패는 경고만 (스펙 자체는 생성됨)
      logger.warn(`도메인 연결 실패: ${linkResult.error.message}`);
    }
  }

  return success({
    featureId,
    featurePath,
    branchName,
    filesCreated,
    domain: effectiveDomain,
    domainCreated: domainMissing,
  });
}

/**
 * 기능 계획 생성 (테스트 가능)
 */
export async function createPlan(
  featurePath: string,
  featureId: string,
  title?: string,
  force?: boolean
): Promise<Result<string, Error>> {
  if (!(await fileExists(featurePath))) {
    return failure(new Error(`기능 '${featureId}'을 찾을 수 없습니다.`));
  }

  const planPath = path.join(featurePath, 'plan.md');
  const overwriteCheck = await refuseOverwrite([planPath], force);
  if (!overwriteCheck.success) {
    return overwriteCheck;
  }

  // An explicit title wins; otherwise fall back to the spec.md title, then the feature id.
  let featureTitle = title || featureId;
  const specPath = path.join(featurePath, 'spec.md');
  if (!title && (await fileExists(specPath))) {
    const specResult = await readFile(specPath);
    if (specResult.success) {
      const titleMatch = specResult.data.match(/title:\s*"?([^"\n]+)"?/);
      if (titleMatch) {
        featureTitle = titleMatch[1];
      }
    }
  }

  // plan.md 생성
  const planContent = generatePlan({
    featureId,
    featureTitle,
    overview: `${featureTitle} 구현 계획`,
  });

  const writeResult = await writeFile(planPath, planContent);
  if (!writeResult.success) {
    return failure(new Error(`계획 파일 생성 실패: ${writeResult.error.message}`));
  }

  return success(planPath);
}

/**
 * 기능 작업 분해 생성 (테스트 가능)
 */
export async function createTasks(
  featurePath: string,
  featureId: string,
  force?: boolean
): Promise<Result<string, Error>> {
  if (!(await fileExists(featurePath))) {
    return failure(new Error(`기능 '${featureId}'을 찾을 수 없습니다.`));
  }

  const tasksPath = path.join(featurePath, 'tasks.md');
  const overwriteCheck = await refuseOverwrite([tasksPath], force);
  if (!overwriteCheck.success) {
    return overwriteCheck;
  }

  // spec.md에서 제목 추출 시도
  let featureTitle = featureId;
  const specPath = path.join(featurePath, 'spec.md');
  if (await fileExists(specPath)) {
    const specResult = await readFile(specPath);
    if (specResult.success) {
      const titleMatch = specResult.data.match(/title:\s*"?([^"\n]+)"?/);
      if (titleMatch) {
        featureTitle = titleMatch[1];
      }
    }
  }

  // tasks.md 생성
  const tasksContent = generateTasks({
    featureId,
    featureTitle,
    tasks: DEFAULT_TASKS,
  });

  const writeResult = await writeFile(tasksPath, tasksContent);
  if (!writeResult.success) {
    return failure(new Error(`작업 분해 파일 생성 실패: ${writeResult.error.message}`));
  }

  return success(tasksPath);
}

/**
 * 체크리스트 생성 (테스트 가능)
 */
export async function createChecklist(
  sddPath: string,
  force?: boolean
): Promise<Result<string, Error>> {
  if (!(await fileExists(sddPath))) {
    return failure(new Error('.sdd 디렉토리가 없습니다.'));
  }

  const outputPath = path.join(sddPath, 'checklist.md');
  const overwriteCheck = await refuseOverwrite([outputPath], force);
  if (!overwriteCheck.success) {
    return overwriteCheck;
  }

  const checklistContent = generateFullChecklistMarkdown();
  const writeResult = await writeFile(outputPath, checklistContent);
  if (!writeResult.success) {
    return failure(new Error(`체크리스트 파일 생성 실패: ${writeResult.error.message}`));
  }

  return success(outputPath);
}

/**
 * 카운터 상태 조회 (테스트 가능)
 */
export async function getCounterStatus(sddPath: string): Promise<Result<CounterStatus, Error>> {
  const peekResult = await peekNextFeatureNumber(sddPath);
  if (!peekResult.success) {
    return failure(new Error(`카운터 조회 실패: ${peekResult.error.message}`));
  }

  const historyResult = await getFeatureHistory(sddPath);
  if (!historyResult.success) {
    return failure(new Error(`이력 조회 실패: ${historyResult.error.message}`));
  }

  return success({
    nextNumber: peekResult.data,
    totalFeatures: historyResult.data.length,
  });
}

/**
 * new 명령어 등록
 */
export function registerNewCommand(program: Command): void {
  const newCmd = program
    .command('new')
    .description('새로운 기능 생성 (<domain>/<name> 형식 지원)')
    .argument('[name]', '기능 이름 (예: auth/login 또는 login)')
    .option('--title <title>', '기능 제목')
    .option('--description <desc>', '기능 설명')
    .option('-d, --domain <domain>', '도메인 지정 (auth/login 형식도 가능)')
    .option('--no-branch', '브랜치 생성 안 함')
    .option('--numbered', '자동 번호 부여 (feature/001-name 형식)')
    .option('--plan', '계획 파일도 함께 생성')
    .option('--tasks', '작업 분해 파일도 함께 생성')
    .option('--all', '모든 파일 생성 (spec, plan, tasks, checklist)')
    .option('--checklist', '체크리스트 파일 생성')
    .option('-f, --force', '기존 파일 덮어쓰기')
    .action(async (name, options) => {
      await handleNew(name, options);
    });

  // plan 서브커맨드
  newCmd
    .command('plan')
    .description('기능 구현 계획 생성')
    .argument('<feature>', '기능 ID')
    .option('--title <title>', '계획 제목')
    .option('-f, --force', '기존 plan.md 덮어쓰기')
    .action(async (feature: string, _opts: unknown, cmd: Command) => {
      // The parent `new` also declares --title/--force and commander hands it the flags,
      // so read the merged local + parent options.
      await handlePlan(feature, cmd.optsWithGlobals<{ title?: string; force?: boolean }>());
    });

  // tasks 서브커맨드
  newCmd
    .command('tasks')
    .description('작업 분해 생성')
    .argument('<feature>', '기능 ID')
    .option('-f, --force', '기존 tasks.md 덮어쓰기')
    .action(async (feature: string, _opts: unknown, cmd: Command) => {
      await handleTasks(feature, cmd.optsWithGlobals<{ force?: boolean }>());
    });

  // checklist 서브커맨드
  newCmd
    .command('checklist')
    .description('워크플로우 체크리스트 생성')
    .option('-f, --force', '기존 checklist.md 덮어쓰기')
    .action(async (_opts: unknown, cmd: Command) => {
      await handleChecklist(cmd.optsWithGlobals<{ force?: boolean }>());
    });

  // counter 서브커맨드
  newCmd
    .command('counter')
    .description('기능 번호 카운터 관리')
    .option('--peek', '다음 번호 확인 (증가하지 않음)')
    .option('--history', '생성 이력 조회')
    .option('--set <number>', '다음 번호 설정')
    .action(async (opts) => {
      await handleCounter(opts);
    });
}

/**
 * SDD 프로젝트 루트 조회 (없으면 에러 종료)
 */
async function requireProjectRoot(): Promise<string> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('.sdd 디렉토리가 없습니다. 먼저 sdd init을 실행해주세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }
  return projectRoot;
}

/**
 * new 명령어 핸들러
 */
async function handleNew(
  name: string | undefined,
  options: {
    title?: string;
    description?: string;
    domain?: string;
    branch?: boolean;
    numbered?: boolean;
    plan?: boolean;
    tasks?: boolean;
    all?: boolean;
    checklist?: boolean;
    force?: boolean;
  }
): Promise<void> {
  if (!name) {
    logger.error('기능 이름을 입력해주세요: sdd new <name>');
    logger.info('');
    logger.info('사용법:');
    logger.info('  sdd new <name>                  기본 기능 생성');
    logger.info('  sdd new <domain>/<name>         도메인과 함께 생성');
    logger.info('  sdd new <name> --domain <d>     도메인 옵션으로 생성');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const cwd = await requireProjectRoot();
  const sddPath = path.join(cwd, '.sdd');

  // 기능 생성
  const result = await createFeature(sddPath, name, options);
  if (!result.success) {
    logger.error(`기능 생성 실패: ${result.error.message}`);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const { featureId, featurePath, branchName, filesCreated, domain, domainCreated } = result.data;

  if (domainCreated && domain) {
    logger.info(`ℹ 도메인 '${domain}'이(가) 없어 새로 생성했습니다 (sdd domain create ${domain})`);
  }

  // 도메인 정보 로깅
  if (domain) {
    logger.info(`📁 도메인: ${domain}`);
  }

  // 번호 부여 시 로깅
  if (options.numbered && branchName) {
    const numberMatch = branchName.match(/feature\/(\d+)-/);
    if (numberMatch) {
      logger.info(`자동 번호 부여: #${numberMatch[1]}`);
    }
  }

  // 파일 생성 로그
  for (const file of filesCreated) {
    logger.info(`✅ ${file} 생성: ${featurePath}/${file}`);
  }

  // 브랜치 생성
  if (options.branch !== false) {
    if (await isGitRepository(cwd)) {
      // createBranch adds the `feature/` prefix itself, so pass the bare feature id
      // (for --numbered this is `001-name`, yielding `feature/001-name`).
      const branchResult = await createBranch(featureId, { checkout: true, cwd });
      if (branchResult.success) {
        logger.info(`✅ 브랜치 생성: ${branchResult.data}`);
      } else {
        logger.warn(`⚠️ 브랜치 생성 실패: ${branchResult.error.message}`);
      }
    } else {
      logger.warn('⚠️ Git 저장소가 아닙니다. 브랜치 생성을 건너뜁니다.');
    }
  }

  logger.info('');
  if (domain) {
    logger.info(`🎉 기능 '${domain}/${featureId}' 생성 완료!`);
  } else {
    logger.info(`🎉 기능 '${featureId}' 생성 완료!`);
  }
  logger.info('');
  logger.info('다음 단계:');
  for (const [index, step] of buildNextSteps(featurePath, featureId, options).entries()) {
    logger.info(`  ${index + 1}. ${step}`);
  }
}

/**
 * Next-step hints after `sdd new`, skipping files that were already generated.
 */
export function buildNextSteps(
  featurePath: string,
  featureId: string,
  options: Pick<NewFeatureOptions, 'plan' | 'tasks' | 'all'>
): string[] {
  const steps = [`${featurePath}/spec.md 편집`];
  if (!(options.plan || options.all)) {
    steps.push(`sdd new plan ${featureId} - 계획 작성`);
  }
  if (!(options.tasks || options.all)) {
    steps.push(`sdd new tasks ${featureId} - 작업 분해`);
  }
  steps.push('sdd validate - 명세 검증');
  return steps;
}

/**
 * plan 서브커맨드 핸들러
 */
async function handlePlan(
  feature: string,
  options: { title?: string; force?: boolean }
): Promise<void> {
  const sddPath = path.join(await requireProjectRoot(), '.sdd');
  const resolved = await resolveSpec(sddPath, feature);

  if (!resolved.success) {
    logger.error(
      resolved.error.reason === 'ambiguous'
        ? resolved.error.message
        : `기능 '${feature}'을 찾을 수 없습니다.`
    );
    logger.info('');
    logger.info('사용법:');
    logger.info('  sdd new plan <domain>/<feature>  도메인/기능 형식');
    logger.info('  sdd new plan <feature>           자동 탐색');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const featurePath = resolved.data.dir;
  const featureId = resolved.data.feature;
  const result = await createPlan(featurePath, featureId, options.title, options.force);
  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  logger.info(`✅ 계획 생성: ${result.data}`);
  logger.info('');
  logger.info('다음 단계:');
  logger.info(`  1. ${featurePath}/plan.md 편집`);
  logger.info('  2. sdd new tasks ' + feature + ' - 작업 분해');
}

/**
 * tasks 서브커맨드 핸들러
 */
async function handleTasks(feature: string, options: { force?: boolean }): Promise<void> {
  const sddPath = path.join(await requireProjectRoot(), '.sdd');
  const resolved = await resolveSpec(sddPath, feature);

  if (!resolved.success) {
    logger.error(
      resolved.error.reason === 'ambiguous'
        ? resolved.error.message
        : `기능 '${feature}'을 찾을 수 없습니다.`
    );
    logger.info('');
    logger.info('사용법:');
    logger.info('  sdd new tasks <domain>/<feature>  도메인/기능 형식');
    logger.info('  sdd new tasks <feature>           자동 탐색');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const featurePath = resolved.data.dir;
  const featureId = resolved.data.feature;
  const result = await createTasks(featurePath, featureId, options.force);
  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  logger.info(`✅ 작업 분해 생성: ${result.data}`);
  logger.info('');
  logger.info('다음 단계:');
  logger.info(`  1. ${featurePath}/tasks.md 편집`);
  logger.info('  2. 각 작업 순차적으로 구현');
}

/**
 * checklist 서브커맨드 핸들러
 */
async function handleChecklist(options: { force?: boolean }): Promise<void> {
  const sddPath = path.join(await requireProjectRoot(), '.sdd');

  const result = await createChecklist(sddPath, options.force);
  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  logger.info(`✅ 체크리스트 생성: ${result.data}`);
}

/**
 * counter 서브커맨드 핸들러
 */
async function handleCounter(options: {
  peek?: boolean;
  history?: boolean;
  set?: string;
}): Promise<void> {
  const sddPath = path.join(await requireProjectRoot(), '.sdd');

  // 다음 번호 확인
  if (options.peek) {
    const result = await peekNextFeatureNumber(sddPath);
    if (result.success) {
      const paddedNumber = String(result.data).padStart(3, '0');
      logger.info(`다음 기능 번호: #${paddedNumber}`);
      logger.info(`브랜치 형식: feature/${paddedNumber}-<name>`);
    } else {
      logger.error(`카운터 조회 실패: ${result.error.message}`);
      process.exit(ExitCode.GENERAL_ERROR);
    }
    return;
  }

  // 이력 조회
  if (options.history) {
    const result = await getFeatureHistory(sddPath);
    if (result.success) {
      if (result.data.length === 0) {
        logger.info('생성된 기능 이력이 없습니다.');
      } else {
        logger.info('=== 기능 생성 이력 ===');
        logger.info('');
        for (const entry of result.data) {
          const date = new Date(entry.createdAt).toLocaleDateString('ko-KR');
          logger.info(`#${String(entry.number).padStart(3, '0')} ${entry.name}`);
          logger.info(`  ID: ${entry.fullId}`);
          logger.info(`  생성일: ${date}`);
          logger.info('');
        }
      }
    } else {
      logger.error(`이력 조회 실패: ${result.error.message}`);
      process.exit(ExitCode.GENERAL_ERROR);
    }
    return;
  }

  // 번호 설정
  if (options.set) {
    const nextNumber = parseInt(options.set, 10);
    if (isNaN(nextNumber) || nextNumber < 1) {
      logger.error('유효한 번호를 입력해주세요 (1 이상의 정수)');
      process.exit(ExitCode.GENERAL_ERROR);
    }

    const { setNextFeatureNumber } = await import('../../core/new/index.js');
    const result = await setNextFeatureNumber(sddPath, nextNumber);
    if (result.success) {
      logger.info(`다음 기능 번호가 #${String(nextNumber).padStart(3, '0')}로 설정되었습니다.`);
    } else {
      logger.error(`번호 설정 실패: ${result.error.message}`);
      process.exit(ExitCode.GENERAL_ERROR);
    }
    return;
  }

  // 기본: 현재 상태 표시
  const statusResult = await getCounterStatus(sddPath);

  if (statusResult.success) {
    logger.info('=== 기능 번호 카운터 상태 ===');
    logger.info('');
    logger.info(`다음 번호: #${String(statusResult.data.nextNumber).padStart(3, '0')}`);
    logger.info(`생성된 기능 수: ${statusResult.data.totalFeatures}개`);
    logger.info('');
    logger.info('옵션:');
    logger.info('  --peek     다음 번호 확인');
    logger.info('  --history  생성 이력 조회');
    logger.info('  --set <n>  다음 번호 설정');
  } else {
    logger.error(statusResult.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }
}
