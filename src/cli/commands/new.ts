/**
 * sdd new 명령어 - 신규 기능 생성
 */
import { Command } from 'commander';
import path from 'node:path';
import { promises as fs } from 'node:fs';
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
} from '../../core/new/index.js';
import { logger } from '../../utils/index.js';
import { ensureDir, fileExists, readFile } from '../../utils/fs.js';
import { parseConstitution } from '../../core/constitution/index.js';

/**
 * new 명령어 등록
 */
export function registerNewCommand(program: Command): void {
  const newCmd = program
    .command('new')
    .description('새로운 기능 생성')
    .argument('[name]', '기능 이름')
    .option('--title <title>', '기능 제목')
    .option('--description <desc>', '기능 설명')
    .option('--no-branch', '브랜치 생성 안 함')
    .option('--numbered', '자동 번호 부여 (feature/001-name 형식)')
    .option('--plan', '계획 파일도 함께 생성')
    .option('--tasks', '작업 분해 파일도 함께 생성')
    .option('--all', '모든 파일 생성 (spec, plan, tasks)')
    .option('--checklist', '체크리스트 파일 생성')
    .action(async (name, options) => {
      await handleNew(name, options);
    });

  // plan 서브커맨드
  newCmd
    .command('plan')
    .description('기능 구현 계획 생성')
    .argument('<feature>', '기능 ID')
    .option('--title <title>', '계획 제목')
    .action(async (feature, opts) => {
      await handlePlan(feature, opts);
    });

  // tasks 서브커맨드
  newCmd
    .command('tasks')
    .description('작업 분해 생성')
    .argument('<feature>', '기능 ID')
    .action(async (feature) => {
      await handleTasks(feature);
    });

  // checklist 서브커맨드
  newCmd
    .command('checklist')
    .description('워크플로우 체크리스트 생성')
    .action(async () => {
      await handleChecklist();
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
 * new 명령어 핸들러
 */
async function handleNew(
  name: string | undefined,
  options: {
    title?: string;
    description?: string;
    branch?: boolean;
    numbered?: boolean;
    plan?: boolean;
    tasks?: boolean;
    all?: boolean;
    checklist?: boolean;
  }
): Promise<void> {
  if (!name) {
    logger.error('기능 이름을 입력해주세요: sdd new <name>');
    process.exit(1);
  }

  const cwd = process.cwd();
  const sddPath = path.join(cwd, '.sdd');

  // 기능 ID 생성 (번호 부여 옵션에 따라)
  let featureId: string;
  let branchName: string | undefined;

  if (options.numbered) {
    const numberResult = await getNextFeatureNumber(sddPath, name);
    if (!numberResult.success) {
      logger.error(`번호 생성 실패: ${numberResult.error.message}`);
      process.exit(1);
    }
    featureId = numberResult.data.fullId;
    branchName = numberResult.data.branchName;
    logger.info(`자동 번호 부여: #${numberResult.data.number.toString().padStart(3, '0')}`);
  } else {
    featureId = generateFeatureId(name);
  }

  const title = options.title || name;
  const description = options.description || `${title} 기능 명세`;
  const featurePath = path.join(sddPath, 'specs', featureId);

  try {
    // .sdd 디렉토리 확인
    if (!(await fileExists(sddPath))) {
      logger.error('.sdd 디렉토리가 없습니다. 먼저 sdd init을 실행해주세요.');
      process.exit(1);
    }

    // 기능 디렉토리 생성
    await ensureDir(featurePath);

    // Constitution 버전 읽기
    let constitutionVersion: string | undefined;
    const constitutionPath = path.join(sddPath, 'constitution.md');
    if (await fileExists(constitutionPath)) {
      const constResult = await readFile(constitutionPath);
      if (constResult.success) {
        const parseResult = parseConstitution(constResult.data);
        if (parseResult.success) {
          constitutionVersion = parseResult.data.metadata.version;
        }
      }
    }

    // spec.md 생성
    const specContent = generateSpec({
      id: featureId,
      title,
      description,
      constitutionVersion,
    });
    await fs.writeFile(path.join(featurePath, 'spec.md'), specContent, 'utf-8');
    logger.info(`✅ 명세 생성: ${featurePath}/spec.md`);

    // 브랜치 생성
    if (options.branch !== false) {
      if (await isGitRepository(cwd)) {
        // 번호 부여 모드에서는 전체 브랜치 이름 사용, 아니면 기존 방식
        const branchToCreate = branchName || featureId;
        const result = await createBranch(branchToCreate, { checkout: true, cwd });
        if (result.success) {
          logger.info(`✅ 브랜치 생성: ${result.data}`);
        } else {
          logger.warn(`⚠️ 브랜치 생성 실패: ${result.error.message}`);
        }
      } else {
        logger.warn('⚠️ Git 저장소가 아닙니다. 브랜치 생성을 건너뜁니다.');
      }
    }

    // plan.md 생성
    if (options.plan || options.all) {
      const planContent = generatePlan({
        featureId,
        featureTitle: title,
        overview: description,
      });
      await fs.writeFile(path.join(featurePath, 'plan.md'), planContent, 'utf-8');
      logger.info(`✅ 계획 생성: ${featurePath}/plan.md`);
    }

    // tasks.md 생성
    if (options.tasks || options.all) {
      const tasksContent = generateTasks({
        featureId,
        featureTitle: title,
        tasks: [
          { title: '기반 구조 설정', priority: 'high' },
          { title: '핵심 기능 구현', priority: 'high' },
          { title: '테스트 작성', priority: 'medium' },
          { title: '문서 업데이트', priority: 'low' },
        ],
      });
      await fs.writeFile(path.join(featurePath, 'tasks.md'), tasksContent, 'utf-8');
      logger.info(`✅ 작업 분해 생성: ${featurePath}/tasks.md`);
    }

    // 체크리스트 생성
    if (options.checklist || options.all) {
      const checklistContent = generateFullChecklistMarkdown();
      await fs.writeFile(path.join(featurePath, 'checklist.md'), checklistContent, 'utf-8');
      logger.info(`✅ 체크리스트 생성: ${featurePath}/checklist.md`);
    }

    logger.info('');
    logger.info(`🎉 기능 '${featureId}' 생성 완료!`);
    logger.info('');
    logger.info('다음 단계:');
    logger.info(`  1. ${featurePath}/spec.md 편집`);
    if (!(options.plan || options.all)) {
      logger.info('  2. sdd new plan ' + featureId + ' - 계획 작성');
    }
    if (!(options.tasks || options.all)) {
      logger.info('  3. sdd new tasks ' + featureId + ' - 작업 분해');
    }
    logger.info('  4. sdd validate - 명세 검증');
  } catch (error) {
    logger.error(`기능 생성 실패: ${error}`);
    process.exit(1);
  }
}

/**
 * plan 서브커맨드 핸들러
 */
async function handlePlan(
  feature: string,
  options: { title?: string }
): Promise<void> {
  const cwd = process.cwd();
  const featurePath = path.join(cwd, '.sdd', 'specs', feature);

  try {
    // 기능 디렉토리 확인
    if (!(await fileExists(featurePath))) {
      logger.error(`기능 '${feature}'을 찾을 수 없습니다.`);
      process.exit(1);
    }

    // spec.md에서 제목 추출 시도
    let title = options.title || feature;
    const specPath = path.join(featurePath, 'spec.md');
    if (await fileExists(specPath)) {
      const specContent = await fs.readFile(specPath, 'utf-8');
      const titleMatch = specContent.match(/title:\s*"?([^"\n]+)"?/);
      if (titleMatch) {
        title = titleMatch[1];
      }
    }

    // plan.md 생성
    const planContent = generatePlan({
      featureId: feature,
      featureTitle: title,
      overview: `${title} 구현 계획`,
    });

    await fs.writeFile(path.join(featurePath, 'plan.md'), planContent, 'utf-8');
    logger.info(`✅ 계획 생성: ${featurePath}/plan.md`);
    logger.info('');
    logger.info('다음 단계:');
    logger.info(`  1. ${featurePath}/plan.md 편집`);
    logger.info('  2. sdd new tasks ' + feature + ' - 작업 분해');
  } catch (error) {
    logger.error(`계획 생성 실패: ${error}`);
    process.exit(1);
  }
}

/**
 * tasks 서브커맨드 핸들러
 */
async function handleTasks(feature: string): Promise<void> {
  const cwd = process.cwd();
  const featurePath = path.join(cwd, '.sdd', 'specs', feature);

  try {
    // 기능 디렉토리 확인
    if (!(await fileExists(featurePath))) {
      logger.error(`기능 '${feature}'을 찾을 수 없습니다.`);
      process.exit(1);
    }

    // spec.md에서 제목 추출 시도
    let title = feature;
    const specPath = path.join(featurePath, 'spec.md');
    if (await fileExists(specPath)) {
      const specContent = await fs.readFile(specPath, 'utf-8');
      const titleMatch = specContent.match(/title:\s*"?([^"\n]+)"?/);
      if (titleMatch) {
        title = titleMatch[1];
      }
    }

    // tasks.md 생성
    const tasksContent = generateTasks({
      featureId: feature,
      featureTitle: title,
      tasks: [
        { title: '기반 구조 설정', priority: 'high' },
        { title: '핵심 기능 구현', priority: 'high' },
        { title: '테스트 작성', priority: 'medium' },
        { title: '문서 업데이트', priority: 'low' },
      ],
    });

    await fs.writeFile(path.join(featurePath, 'tasks.md'), tasksContent, 'utf-8');
    logger.info(`✅ 작업 분해 생성: ${featurePath}/tasks.md`);
    logger.info('');
    logger.info('다음 단계:');
    logger.info(`  1. ${featurePath}/tasks.md 편집`);
    logger.info('  2. 각 작업 순차적으로 구현');
  } catch (error) {
    logger.error(`작업 분해 생성 실패: ${error}`);
    process.exit(1);
  }
}

/**
 * checklist 서브커맨드 핸들러
 */
async function handleChecklist(): Promise<void> {
  const cwd = process.cwd();
  const sddPath = path.join(cwd, '.sdd');

  try {
    if (!(await fileExists(sddPath))) {
      logger.error('.sdd 디렉토리가 없습니다. 먼저 sdd init을 실행해주세요.');
      process.exit(1);
    }

    const checklistContent = generateFullChecklistMarkdown();
    const outputPath = path.join(sddPath, 'checklist.md');
    await fs.writeFile(outputPath, checklistContent, 'utf-8');
    logger.info(`✅ 체크리스트 생성: ${outputPath}`);
  } catch (error) {
    logger.error(`체크리스트 생성 실패: ${error}`);
    process.exit(1);
  }
}

/**
 * counter 서브커맨드 핸들러
 */
async function handleCounter(options: {
  peek?: boolean;
  history?: boolean;
  set?: string;
}): Promise<void> {
  const cwd = process.cwd();
  const sddPath = path.join(cwd, '.sdd');

  if (!(await fileExists(sddPath))) {
    logger.error('.sdd 디렉토리가 없습니다. 먼저 sdd init을 실행해주세요.');
    process.exit(1);
  }

  // 다음 번호 확인
  if (options.peek) {
    const result = await peekNextFeatureNumber(sddPath);
    if (result.success) {
      const paddedNumber = String(result.data).padStart(3, '0');
      logger.info(`다음 기능 번호: #${paddedNumber}`);
      logger.info(`브랜치 형식: feature/${paddedNumber}-<name>`);
    } else {
      logger.error(`카운터 조회 실패: ${result.error.message}`);
      process.exit(1);
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
      process.exit(1);
    }
    return;
  }

  // 번호 설정
  if (options.set) {
    const nextNumber = parseInt(options.set, 10);
    if (isNaN(nextNumber) || nextNumber < 1) {
      logger.error('유효한 번호를 입력해주세요 (1 이상의 정수)');
      process.exit(1);
    }

    const { setNextFeatureNumber } = await import('../../core/new/index.js');
    const result = await setNextFeatureNumber(sddPath, nextNumber);
    if (result.success) {
      logger.info(`다음 기능 번호가 #${String(nextNumber).padStart(3, '0')}로 설정되었습니다.`);
    } else {
      logger.error(`번호 설정 실패: ${result.error.message}`);
      process.exit(1);
    }
    return;
  }

  // 기본: 현재 상태 표시
  const peekResult = await peekNextFeatureNumber(sddPath);
  const historyResult = await getFeatureHistory(sddPath);

  if (peekResult.success && historyResult.success) {
    logger.info('=== 기능 번호 카운터 상태 ===');
    logger.info('');
    logger.info(`다음 번호: #${String(peekResult.data).padStart(3, '0')}`);
    logger.info(`생성된 기능 수: ${historyResult.data.length}개`);
    logger.info('');
    logger.info('옵션:');
    logger.info('  --peek     다음 번호 확인');
    logger.info('  --history  생성 이력 조회');
    logger.info('  --set <n>  다음 번호 설정');
  } else {
    logger.error('카운터 상태 조회 실패');
    process.exit(1);
  }
}
