/**
 * sdd status 명령어 - 프로젝트 상태 조회
 */
import { Command } from 'commander';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { logger } from '../../utils/index.js';
import { fileExists, findSddRoot } from '../../utils/fs.js';
import { ExitCode } from '../../errors/index.js';
import { listSpecs, resolveDomainSpecRef } from '../../core/spec/locator.js';
import { parseSpecMetadata } from '../../core/new/spec-generator.js';
import { getSpecStatusIcon, getSpecStatusLabel, normalizeSpecStatus } from '../../core/spec/status.js';
import { parseTasks } from '../../core/new/task-generator.js';
import { listPendingChanges, listArchives, type PendingChange } from '../../core/change/archive.js';
import { getCurrentBranch, listFeatureBranches } from '../../core/new/branch.js';
import { createDomainService } from '../../core/domain/service.js';
import { hasSddBlock } from '../../generators/agents-md.js';

/**
 * 기능 워크플로우 단계 (파일 · 스펙 상태 · 작업 진행률로 판정)
 * - plan: plan.md 없음
 * - tasks: tasks.md 없음 또는 작업 0개
 * - implement: 미완료 작업 있음 (스펙이 implemented여도)
 * - finalize: 모든 작업 완료, 스펙 상태가 implemented 아님
 * - done: implemented이고 미완료 작업 없음 (plan/tasks 파일 유무 무관), 또는 deprecated
 */
export type FeatureStage = 'plan' | 'tasks' | 'implement' | 'finalize' | 'done';

/**
 * 기능 정보
 */
export interface FeatureInfo {
  id: string;
  title: string;
  status: string;
  hasSpec: boolean;
  hasPlan: boolean;
  hasTasks: boolean;
  taskProgress?: {
    completed: number;
    total: number;
    /** Tasks currently in progress (0 when omitted) */
    inProgress?: number;
    /** Blocked tasks (0 when omitted) */
    blocked?: number;
  };
  stage: FeatureStage;
}

/**
 * 프로젝트 상태
 */
export interface ProjectStatus {
  initialized: boolean;
  hasConstitution: boolean;
  hasAgents: boolean;
  features: FeatureInfo[];
  pendingChanges: PendingChange[];
  archivedChanges: number;
  currentBranch?: string;
  featureBranches: string[];
}

/**
 * 상태 조회 옵션
 */
export interface StatusOptions {
  json?: boolean;
  verbose?: boolean;
  domain?: string;
}

/**
 * 기능 단계 판정 (테스트 가능)
 */
export function getFeatureStage(info: Omit<FeatureInfo, 'stage'>): FeatureStage {
  const status = normalizeSpecStatus(info.status);
  if (status === 'deprecated') return 'done';
  const tasksIncomplete =
    info.taskProgress !== undefined && info.taskProgress.completed < info.taskProgress.total;
  // An implemented spec is done unless its tasks.md still has open tasks (plan/tasks files optional)
  if (status === 'implemented') return tasksIncomplete ? 'implement' : 'done';
  if (!info.hasPlan) return 'plan';
  if (!info.hasTasks || !info.taskProgress || info.taskProgress.total === 0) return 'tasks';
  if (tasksIncomplete) return 'implement';
  return 'finalize';
}

/**
 * 기능별 다음 단계 안내 (완료/폐기된 기능 제외)
 */
export function getFeatureNextStep(feature: FeatureInfo): string | undefined {
  const { id } = feature;
  switch (feature.stage) {
    case 'plan':
      return `${id}: 명세 완성 후 계획 작성 — sdd new plan ${id} (Claude Code /sdd-plan · Codex $sdd-plan)`;
    case 'tasks':
      if (feature.hasTasks) {
        // tasks.md exists but no task heading was recognized; `sdd new tasks` would refuse to overwrite it
        const featureName = id.split('/').pop();
        return `${id}: tasks.md에서 \`### ${featureName}-task-NNN: 제목\` 형식의 작업을 찾지 못했습니다 — 형식을 확인하거나 sdd new tasks ${id} --force로 재생성(기존 내용 덮어씀)`;
      }
      return `${id}: 작업 분해 — sdd new tasks ${id} (Claude Code /sdd-tasks · Codex $sdd-tasks)`;
    case 'implement': {
      const { completed, total, inProgress = 0, blocked = 0 } = feature.taskProgress ?? { completed: 0, total: 0 };
      // "In progress" only once a task has started or finished; spec status is never changed here
      const blockedNote = blocked > 0 ? `, 차단됨 ${blocked}개` : '';
      const step =
        completed > 0 || inProgress > 0
          ? `${id}: 구현 진행 중 (${completed}/${total}) — Claude Code /sdd-implement · Codex $sdd-implement, 작업 완료 시 sdd new task ${id} <task-id> completed`
          : `${id}: 구현 시작 전 (${completed}/${total}${blockedNote}) — Claude Code /sdd-implement · Codex $sdd-implement, 작업 시작 시 sdd new task ${id} <task-id> in-progress${blocked > 0 ? ' (차단된 작업은 차단 해소 후 진행)' : ''}`;
      if (normalizeSpecStatus(feature.status) === 'implemented') {
        return `${step} (스펙 상태(implemented)와 작업 진행률(${completed}/${total})이 맞지 않습니다)`;
      }
      return step;
    }
    case 'finalize':
      return `${id}: 모든 작업 완료 — sdd validate · sdd sync 확인 후 sdd new status ${id} implemented`;
    case 'done':
      return undefined;
  }
}

/**
 * 다음 단계 안내 목록 (항상 1줄 이상)
 */
export function buildStatusNextSteps(features: FeatureInfo[]): string[] {
  if (features.length === 0) {
    return ['sdd new <name> - 새 기능 생성'];
  }
  const steps = features
    .map(getFeatureNextStep)
    .filter((step): step is string => step !== undefined);
  if (steps.length > 0) {
    return steps;
  }
  return [
    `✅ 모든 기능(${features.length}개)이 구현 완료되었습니다. 새 기능은 sdd new <name>, 변경은 sdd change로 시작하세요`,
  ];
}

/**
 * 기능 정보 조회 (테스트 가능)
 */
export async function getFeatureInfo(id: string, featurePath: string): Promise<FeatureInfo> {
  const info: Omit<FeatureInfo, 'stage'> = {
    id,
    title: id,
    status: 'unknown',
    hasSpec: false,
    hasPlan: false,
    hasTasks: false,
  };

  // spec.md 확인
  const specPath = path.join(featurePath, 'spec.md');
  if (await fileExists(specPath)) {
    info.hasSpec = true;
    const content = await fs.readFile(specPath, 'utf-8');
    const metadata = parseSpecMetadata(content);
    if (metadata) {
      info.title = metadata.title || id;
      info.status = metadata.status;
    }
  }

  // plan.md 확인
  info.hasPlan = await fileExists(path.join(featurePath, 'plan.md'));

  // tasks.md 확인
  const tasksPath = path.join(featurePath, 'tasks.md');
  if (await fileExists(tasksPath)) {
    info.hasTasks = true;
    const content = await fs.readFile(tasksPath, 'utf-8');
    const tasks = parseTasks(content);
    const completed = tasks.filter(t => t.status === 'completed').length;
    info.taskProgress = {
      completed,
      total: tasks.length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
    };
  }

  return { ...info, stage: getFeatureStage(info) };
}

/**
 * 프로젝트 상태 조회 (테스트 가능)
 */
export async function getProjectStatus(projectPath: string): Promise<ProjectStatus> {
  const sddPath = path.join(projectPath, '.sdd');

  const status: ProjectStatus = {
    initialized: false,
    hasConstitution: false,
    hasAgents: false,
    features: [],
    pendingChanges: [],
    archivedChanges: 0,
    featureBranches: [],
  };

  // .sdd 디렉토리 확인
  status.initialized = await fileExists(sddPath);

  if (!status.initialized) {
    return status;
  }

  // 헌법 확인
  status.hasConstitution = await fileExists(path.join(sddPath, 'constitution.md'));

  // 루트 AGENTS.md의 SDD 관리 블록 확인
  const agentsMd = await fs.readFile(path.join(projectPath, 'AGENTS.md'), 'utf-8').catch(() => '');
  status.hasAgents = hasSddBlock(agentsMd);

  // 기능 스펙 조회 (도메인 기반 구조 지원)
  for (const location of await listSpecs(sddPath)) {
    status.features.push(await getFeatureInfo(location.id, location.dir));
  }

  // 대기 중인 변경 조회
  const pendingResult = await listPendingChanges(sddPath);
  if (pendingResult.success) {
    status.pendingChanges = pendingResult.data;
  }

  // 아카이브된 변경 수 조회
  const archiveResult = await listArchives(sddPath);
  if (archiveResult.success) {
    status.archivedChanges = archiveResult.data.length;
  }

  // Git 브랜치 정보
  const currentBranchResult = await getCurrentBranch(projectPath);
  if (currentBranchResult.success) {
    status.currentBranch = currentBranchResult.data;
  }

  const featureBranchesResult = await listFeatureBranches(projectPath);
  if (featureBranchesResult.success) {
    status.featureBranches = featureBranchesResult.data;
  }

  return status;
}

/**
 * 상태 아이콘
 */
export function getStatusIcon(status: string): string {
  return getSpecStatusIcon(status);
}

/**
 * status 명령어 등록
 */
export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('SDD 프로젝트 상태 조회')
    .option('--json', 'JSON 형식으로 출력')
    .option('--verbose', '상세 정보 출력')
    .option('-d, --domain <domain>', '특정 도메인 상태만 조회')
    .action(async (options: StatusOptions) => {
      await handleStatus(options);
    });
}

/**
 * status 명령어 핸들러 (CLI 래퍼)
 */
async function handleStatus(options: StatusOptions): Promise<void> {
  const projectRoot = await findSddRoot();
  let status = await getProjectStatus(projectRoot ?? process.cwd());

  if (!projectRoot || !status.initialized) {
    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
    } else {
      logger.warn('SDD 프로젝트가 초기화되지 않았습니다.');
      logger.info('sdd init 명령어로 초기화하세요.');
    }
    process.exit(ExitCode.GENERAL_ERROR);
  }

  // 도메인 필터
  if (options.domain) {
    const domainService = createDomainService(projectRoot);
    const domainResult = await domainService.get(options.domain);

    if (!domainResult.success || !domainResult.data) {
      logger.error(`도메인을 찾을 수 없습니다: ${options.domain}`);
      process.exit(ExitCode.GENERAL_ERROR);
    }

    // domains.yml 스펙 참조를 spec locator로 해석하여 canonical id로 비교
    const allSpecs = await listSpecs(path.join(projectRoot, '.sdd'));
    const domainId = options.domain;
    const domainSpecs = new Set(
      (domainResult.data.specs || [])
        .map((ref) => resolveDomainSpecRef(allSpecs, domainId, ref)?.id)
        .filter((id): id is string => id !== undefined)
    );

    // 도메인 스펙만 필터링
    status = {
      ...status,
      features: status.features.filter(f => domainSpecs.has(f.id)),
    };

    if (!options.json) {
      console.log(`\n📋 도메인 "${options.domain}" 상태`);
      console.log('─'.repeat(40));
      if (domainResult.data.description) {
        console.log(`   설명: ${domainResult.data.description}`);
      }
      if (domainResult.data.dependsOn && domainResult.data.dependsOn.length > 0) {
        console.log(`   의존: ${domainResult.data.dependsOn.join(', ')}`);
      }
      console.log('');
    }
  }

  // 출력
  if (options.json) {
    console.log(JSON.stringify(status, null, 2));
  } else {
    printStatus(status, options.verbose);
  }
}


/**
 * 상태 출력
 */
function printStatus(status: ProjectStatus, verbose?: boolean): void {
  console.log('');
  console.log('📊 SDD 프로젝트 상태');
  console.log('═'.repeat(40));
  console.log('');

  // 기본 정보
  console.log('📁 프로젝트 구조:');
  console.log(`   ${status.hasConstitution ? '✅' : '❌'} constitution.md`);
  console.log(`   ${status.hasAgents ? '✅' : '❌'} AGENTS.md`);
  console.log('');

  // 기능 목록
  if (status.features.length > 0) {
    console.log('📋 기능 목록:');
    for (const feature of status.features) {
      const statusIcon = getStatusIcon(feature.status);
      const files = [
        feature.hasSpec ? 'spec' : '',
        feature.hasPlan ? 'plan' : '',
        feature.hasTasks ? 'tasks' : '',
      ].filter(Boolean).join(', ');

      let progressStr = '';
      if (feature.taskProgress) {
        const { completed, total } = feature.taskProgress;
        progressStr = ` — 작업 ${completed}/${total}`;
      }

      console.log(`   ${statusIcon} ${feature.title} (${feature.id})${progressStr}`);
      if (verbose) {
        console.log(`      상태: ${feature.status} (${getSpecStatusLabel(feature.status)}), 파일: ${files}`);
      }
    }
    console.log('');
  } else {
    console.log('📋 기능: 없음');
    console.log('   sdd new <name> 명령어로 새 기능을 생성하세요.');
    console.log('');
  }

  // 변경 정보
  if (status.pendingChanges.length > 0) {
    console.log('📝 대기 중인 변경:');
    for (const change of status.pendingChanges) {
      console.log(`   - ${change}`);
    }
    console.log('');
  }

  if (status.archivedChanges > 0 && verbose) {
    console.log(`📦 아카이브된 변경: ${status.archivedChanges}개`);
    console.log('');
  }

  // Git 정보
  if (status.currentBranch) {
    console.log(`🔀 현재 브랜치: ${status.currentBranch}`);
    if (status.featureBranches.length > 0 && verbose) {
      console.log('   기능 브랜치:');
      for (const branch of status.featureBranches) {
        const isCurrent = branch === status.currentBranch;
        console.log(`   ${isCurrent ? '→' : ' '} ${branch}`);
      }
    }
    console.log('');
  }

  // 다음 단계 안내
  console.log('💡 다음 단계:');
  for (const step of buildStatusNextSteps(status.features)) {
    console.log(`   ${step}`);
  }
  console.log('');
}

