/**
 * sdd start 명령어 - 통합 진입점
 *
 * 워크플로우 선택 메뉴를 제공하여 사용자가 쉽게 작업을 시작할 수 있도록 합니다.
 */
import { Command } from 'commander';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';
import { findSddRoot, fileExists, readFile, directoryExists } from '../../utils/fs.js';
import { parseConstitution } from '../../core/constitution/index.js';
import { listPendingChanges } from '../../core/change/index.js';

/**
 * 워크플로우 타입 정의
 */
export type WorkflowType =
  | 'new-feature'
  | 'change-spec'
  | 'validate'
  | 'status'
  | 'constitution';

/**
 * 워크플로우 정보
 */
export interface WorkflowInfo {
  type: WorkflowType;
  name: string;
  description: string;
  command: string;
  available: boolean;
  reason?: string;
}

/**
 * 프로젝트 상태 정보
 */
export interface ProjectStatus {
  initialized: boolean;
  hasConstitution: boolean;
  constitutionVersion?: string;
  specCount: number;
  pendingChanges: number;
  specs: string[];
}

/**
 * start 명령어 등록
 */
export function registerStartCommand(program: Command): void {
  program
    .command('start')
    .description('SDD 워크플로우를 시작합니다 (통합 진입점)')
    .option('-w, --workflow <type>', '워크플로우 유형 (new-feature, change-spec, validate, status, constitution)')
    .option('--status', '프로젝트 상태만 표시')
    .action(async (options: { workflow?: WorkflowType; status?: boolean }) => {
      try {
        await runStart(options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * start 명령어 실행
 */
async function runStart(options: { workflow?: WorkflowType; status?: boolean }): Promise<void> {
  // 프로젝트 상태 확인
  const projectStatus = await getProjectStatus();

  // 프로젝트가 초기화되지 않은 경우
  if (!projectStatus.initialized) {
    logger.info('SDD 프로젝트가 초기화되지 않았습니다.');
    logger.newline();
    logger.info('프로젝트를 시작하려면:');
    logger.listItem('sdd init');
    logger.newline();
    logger.info('또는 다음 슬래시 커맨드를 사용하세요:');
    logger.listItem('/sdd.new - 새 프로젝트와 함께 기능 생성');
    return;
  }

  // 상태만 표시
  if (options.status) {
    displayProjectStatus(projectStatus);
    return;
  }

  // 워크플로우가 지정된 경우 해당 워크플로우 안내
  if (options.workflow) {
    const workflow = getWorkflowInfo(options.workflow, projectStatus);
    displayWorkflowGuide(workflow);
    return;
  }

  // 기본: 전체 상태 + 워크플로우 메뉴
  displayProjectStatus(projectStatus);
  logger.newline();
  displayWorkflowMenu(projectStatus);
}

/**
 * 프로젝트 상태 조회
 */
async function getProjectStatus(): Promise<ProjectStatus> {
  const projectRoot = await findSddRoot();

  if (!projectRoot) {
    return {
      initialized: false,
      hasConstitution: false,
      specCount: 0,
      pendingChanges: 0,
      specs: [],
    };
  }

  const sddPath = path.join(projectRoot, '.sdd');
  const specsPath = path.join(sddPath, 'specs');

  // Constitution 확인
  let hasConstitution = false;
  let constitutionVersion: string | undefined;
  const constitutionPath = path.join(sddPath, 'constitution.md');

  if (await fileExists(constitutionPath)) {
    hasConstitution = true;
    const content = await readFile(constitutionPath);
    if (content.success) {
      const parsed = parseConstitution(content.data);
      if (parsed.success) {
        constitutionVersion = parsed.data.metadata.version;
      }
    }
  }

  // Spec 목록 조회
  const specs: string[] = [];
  if (await directoryExists(specsPath)) {
    try {
      const dirs = await fs.readdir(specsPath);
      for (const dir of dirs) {
        const specPath = path.join(specsPath, dir, 'spec.md');
        if (await fileExists(specPath)) {
          specs.push(dir);
        }
      }
    } catch {
      // ignore
    }
  }

  // 진행 중인 변경 조회
  let pendingChanges = 0;
  const changesResult = await listPendingChanges(sddPath);
  if (changesResult.success) {
    pendingChanges = changesResult.data.length;
  }

  return {
    initialized: true,
    hasConstitution,
    constitutionVersion,
    specCount: specs.length,
    pendingChanges,
    specs,
  };
}

/**
 * 프로젝트 상태 표시
 */
function displayProjectStatus(status: ProjectStatus): void {
  logger.info('=== SDD 프로젝트 상태 ===');
  logger.newline();

  if (status.hasConstitution) {
    logger.info(`Constitution: v${status.constitutionVersion || '?.?.?'}`);
  } else {
    logger.warn('Constitution: 없음 (권장: sdd constitution 생성)');
  }

  logger.info(`명세 수: ${status.specCount}개`);
  if (status.specs.length > 0 && status.specs.length <= 5) {
    for (const spec of status.specs) {
      logger.listItem(spec, 1);
    }
  } else if (status.specs.length > 5) {
    for (const spec of status.specs.slice(0, 5)) {
      logger.listItem(spec, 1);
    }
    logger.listItem(`... 외 ${status.specs.length - 5}개`, 1);
  }

  if (status.pendingChanges > 0) {
    logger.warn(`진행 중인 변경: ${status.pendingChanges}개`);
  } else {
    logger.info('진행 중인 변경: 없음');
  }
}

/**
 * 워크플로우 메뉴 표시
 */
function displayWorkflowMenu(status: ProjectStatus): void {
  logger.info('=== 사용 가능한 워크플로우 ===');
  logger.newline();

  const workflows: WorkflowInfo[] = [
    getWorkflowInfo('new-feature', status),
    getWorkflowInfo('change-spec', status),
    getWorkflowInfo('validate', status),
    getWorkflowInfo('status', status),
    getWorkflowInfo('constitution', status),
  ];

  for (const workflow of workflows) {
    if (workflow.available) {
      logger.info(`[${workflow.type}] ${workflow.name}`);
      logger.listItem(workflow.description, 1);
      logger.listItem(`명령어: ${workflow.command}`, 1);
    } else {
      logger.warn(`[${workflow.type}] ${workflow.name} (사용 불가)`);
      logger.listItem(workflow.reason || '조건 미충족', 1);
    }
    logger.newline();
  }

  logger.info('특정 워크플로우를 바로 시작하려면:');
  logger.listItem('sdd start --workflow <type>');
  logger.newline();
  logger.info('또는 Claude Code 슬래시 커맨드를 사용하세요:');
  logger.listItem('/sdd.new - 새 기능 명세');
  logger.listItem('/sdd.change - 기존 스펙 변경');
  logger.listItem('/sdd.validate - 명세 검증');
}

/**
 * 워크플로우 정보 조회
 */
function getWorkflowInfo(type: WorkflowType, status: ProjectStatus): WorkflowInfo {
  switch (type) {
    case 'new-feature':
      return {
        type,
        name: '새 기능 명세',
        description: '새로운 기능의 명세를 작성합니다 (spec.md, plan.md, tasks.md)',
        command: 'sdd new <name>',
        available: true,
      };

    case 'change-spec':
      return {
        type,
        name: '기존 스펙 변경',
        description: '기존 명세에 대한 변경을 제안하고 관리합니다',
        command: 'sdd change',
        available: status.specCount > 0,
        reason: status.specCount === 0 ? '변경할 스펙이 없습니다' : undefined,
      };

    case 'validate':
      return {
        type,
        name: '명세 검증',
        description: '모든 명세 파일의 형식과 무결성을 검증합니다',
        command: 'sdd validate',
        available: status.specCount > 0 || status.hasConstitution,
        reason: status.specCount === 0 && !status.hasConstitution
          ? '검증할 명세가 없습니다'
          : undefined,
      };

    case 'status':
      return {
        type,
        name: '상태 확인',
        description: '전체 프로젝트 및 개별 스펙의 상태를 확인합니다',
        command: 'sdd status',
        available: true,
      };

    case 'constitution':
      return {
        type,
        name: 'Constitution 관리',
        description: '프로젝트 원칙(헌법)을 조회하고 관리합니다',
        command: 'sdd constitution',
        available: true,
      };

    default:
      return {
        type,
        name: '알 수 없는 워크플로우',
        description: '',
        command: '',
        available: false,
        reason: '알 수 없는 워크플로우 유형입니다',
      };
  }
}

/**
 * 워크플로우 가이드 표시
 */
function displayWorkflowGuide(workflow: WorkflowInfo): void {
  logger.info(`=== ${workflow.name} ===`);
  logger.newline();

  if (!workflow.available) {
    logger.error(`이 워크플로우는 현재 사용할 수 없습니다: ${workflow.reason}`);
    return;
  }

  logger.info(workflow.description);
  logger.newline();

  switch (workflow.type) {
    case 'new-feature':
      displayNewFeatureGuide();
      break;
    case 'change-spec':
      displayChangeSpecGuide();
      break;
    case 'validate':
      displayValidateGuide();
      break;
    case 'status':
      displayStatusGuide();
      break;
    case 'constitution':
      displayConstitutionGuide();
      break;
  }
}

/**
 * 새 기능 워크플로우 가이드
 */
function displayNewFeatureGuide(): void {
  logger.info('단계:');
  logger.listItem('1. sdd new <name> - 명세 파일 생성');
  logger.listItem('2. spec.md 편집 - 요구사항 및 시나리오 작성');
  logger.listItem('3. sdd new plan <id> - 구현 계획 작성');
  logger.listItem('4. sdd new tasks <id> - 작업 분해');
  logger.listItem('5. 구현 진행');
  logger.newline();
  logger.info('Claude Code 슬래시 커맨드:');
  logger.listItem('/sdd.new - 대화형 명세 작성');
  logger.listItem('/sdd.plan - 구현 계획 수립');
  logger.listItem('/sdd.tasks - 작업 분해');
  logger.listItem('/sdd.implement - 구현 진행');
  logger.newline();
  logger.info('옵션:');
  logger.listItem('--all : spec, plan, tasks 모두 생성');
  logger.listItem('--no-branch : Git 브랜치 생성 안 함');
}

/**
 * 변경 워크플로우 가이드
 */
function displayChangeSpecGuide(): void {
  logger.info('단계:');
  logger.listItem('1. sdd change -t "변경 제목" - 변경 제안 생성');
  logger.listItem('2. proposal.md 편집 - 변경 배경 및 내용 작성');
  logger.listItem('3. delta.md 편집 - ADDED/MODIFIED/REMOVED 작성');
  logger.listItem('4. sdd change validate <id> - 제안 검증');
  logger.listItem('5. sdd change apply <id> - 변경 적용');
  logger.listItem('6. sdd change archive <id> - 완료 후 아카이브');
  logger.newline();
  logger.info('Claude Code 슬래시 커맨드:');
  logger.listItem('/sdd.change - 변경 제안 작성');
  logger.newline();
  logger.info('명령어:');
  logger.listItem('sdd change -l : 진행 중인 변경 목록');
  logger.listItem('sdd change <id> : 특정 변경 조회');
  logger.listItem('sdd change diff <id> : 변경 내용 diff');
}

/**
 * 검증 워크플로우 가이드
 */
function displayValidateGuide(): void {
  logger.info('사용법:');
  logger.listItem('sdd validate : 전체 검증');
  logger.listItem('sdd validate <id> : 특정 스펙 검증');
  logger.listItem('sdd validate --strict : 엄격 모드');
  logger.newline();
  logger.info('검증 항목:');
  logger.listItem('- frontmatter 형식');
  logger.listItem('- RFC 2119 키워드 사용');
  logger.listItem('- GIVEN-WHEN-THEN 시나리오');
  logger.listItem('- 의존성 참조');
  logger.newline();
  logger.info('Claude Code 슬래시 커맨드:');
  logger.listItem('/sdd.validate - 검증 및 피드백');
}

/**
 * 상태 확인 워크플로우 가이드
 */
function displayStatusGuide(): void {
  logger.info('사용법:');
  logger.listItem('sdd status : 프로젝트 전체 상태');
  logger.listItem('sdd status <id> : 특정 스펙 상태');
  logger.newline();
  logger.info('Claude Code 슬래시 커맨드:');
  logger.listItem('/sdd.status - 상태 리포트');
}

/**
 * Constitution 워크플로우 가이드
 */
function displayConstitutionGuide(): void {
  logger.info('사용법:');
  logger.listItem('sdd constitution : Constitution 표시');
  logger.listItem('sdd constitution version : 버전 확인');
  logger.listItem('sdd constitution bump : 버전 업데이트');
  logger.listItem('sdd constitution history : 변경 이력');
  logger.listItem('sdd constitution validate : 형식 검증');
  logger.newline();
  logger.info('버전 업데이트:');
  logger.listItem('--major : 주요 변경 (원칙 삭제 등)');
  logger.listItem('--minor : 기능 추가');
  logger.listItem('--patch : 오타/명확화');
  logger.newline();
  logger.info('Claude Code 슬래시 커맨드:');
  logger.listItem('/sdd.constitution - Constitution 관리');
}
