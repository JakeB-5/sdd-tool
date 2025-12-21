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
} from '../../core/new/index.js';
import { logger } from '../../utils/index.js';
import { ensureDir, fileExists } from '../../utils/fs.js';

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

  const featureId = generateFeatureId(name);
  const title = options.title || name;
  const description = options.description || `${title} 기능 명세`;

  const cwd = process.cwd();
  const sddPath = path.join(cwd, '.sdd');
  const featurePath = path.join(sddPath, 'specs', featureId);

  try {
    // .sdd 디렉토리 확인
    if (!(await fileExists(sddPath))) {
      logger.error('.sdd 디렉토리가 없습니다. 먼저 sdd init을 실행해주세요.');
      process.exit(1);
    }

    // 기능 디렉토리 생성
    await ensureDir(featurePath);

    // spec.md 생성
    const specContent = generateSpec({
      id: featureId,
      title,
      description,
    });
    await fs.writeFile(path.join(featurePath, 'spec.md'), specContent, 'utf-8');
    logger.info(`✅ 명세 생성: ${featurePath}/spec.md`);

    // 브랜치 생성
    if (options.branch !== false) {
      if (await isGitRepository(cwd)) {
        const result = await createBranch(featureId, { checkout: true, cwd });
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
