/**
 * sdd list 명령어 - 항목 목록 조회
 */
import { Command } from 'commander';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { logger } from '../../utils/index.js';
import { fileExists, readDir, findSddRoot } from '../../utils/fs.js';
import { ExitCode } from '../../errors/index.js';
import { listSpecs as listSpecLocations } from '../../core/spec/locator.js';
import { parseSpecMetadata } from '../../core/new/spec-generator.js';
import { SPEC_STATUSES, getSpecStatusIcon, normalizeSpecStatus } from '../../core/spec/status.js';
import { listPendingChanges, listArchives } from '../../core/change/archive.js';

/**
 * 기능 정보
 */
export interface FeatureListItem {
  id: string;
  title: string;
  status: string;
}

/**
 * 기능 목록 옵션
 */
export interface FeatureListOptions {
  status?: string;
}

/**
 * 변경 목록 옵션
 */
export interface ChangeListOptions {
  pending?: boolean;
  archived?: boolean;
}

/**
 * 변경 목록 결과
 */
export interface ChangeListResult {
  pending: string[];
  archived: string[];
}

/**
 * 스펙 파일 항목
 */
export interface SpecFileItem {
  path: string;
  name: string;
  isDirectory: boolean;
  children?: SpecFileItem[];
}

/**
 * 프로젝트 요약
 */
export interface ProjectSummary {
  featureCount: number;
  pendingChangeCount: number;
  archivedChangeCount: number;
}

/**
 * 상태 아이콘 반환 (테스트 가능)
 */
export function getListStatusIcon(status: string): string {
  return getSpecStatusIcon(status);
}

/**
 * 기능 목록 조회 (테스트 가능)
 * 도메인 기반 구조 (.sdd/specs/<domain>/<feature>/spec.md) 지원
 */
export async function getFeatureList(
  projectPath: string,
  options: FeatureListOptions = {}
): Promise<FeatureListItem[]> {
  const features: FeatureListItem[] = [];

  for (const location of await listSpecLocations(path.join(projectPath, '.sdd'))) {
    const feature = await parseFeatureSpec(location.specPath, location.id, options.status);
    if (feature) features.push(feature);
  }

  return features;
}

/**
 * 스펙 파일에서 기능 정보 파싱
 */
async function parseFeatureSpec(
  specPath: string,
  featureId: string,
  statusFilter?: string
): Promise<FeatureListItem | null> {
  const content = await fs.readFile(specPath, 'utf-8');
  const metadata = parseSpecMetadata(content);
  if (metadata) {
    // Filter by canonical status (legacy aliases in the filter are accepted)
    const wanted = statusFilter ? (normalizeSpecStatus(statusFilter) ?? statusFilter) : undefined;
    if (!wanted || metadata.status === wanted) {
      return {
        id: featureId,
        title: metadata.title || featureId,
        status: metadata.status,
      };
    }
  }
  return null;
}

/**
 * 변경 목록 조회 (테스트 가능)
 */
export async function getChangeList(
  projectPath: string,
  options: ChangeListOptions = {}
): Promise<ChangeListResult> {
  const sddPath = path.join(projectPath, '.sdd');

  const result: ChangeListResult = {
    pending: [],
    archived: [],
  };

  if (!(await fileExists(sddPath))) {
    return result;
  }

  if (!options.archived) {
    const pendingResult = await listPendingChanges(sddPath);
    if (pendingResult.success) {
      result.pending = pendingResult.data.map(c =>
        c.title ? `${c.id}: ${c.title} [${c.status}]` : `${c.id} [${c.status}]`
      );
    }
  }

  if (!options.pending) {
    const archiveResult = await listArchives(sddPath);
    if (archiveResult.success) {
      result.archived = archiveResult.data.map(a => a.id);
    }
  }

  return result;
}

/**
 * 스펙 파일 트리 조회 (테스트 가능)
 */
export async function getSpecFileTree(specsPath: string): Promise<SpecFileItem[]> {
  if (!(await fileExists(specsPath))) {
    return [];
  }

  return walkSpecsTree(specsPath);
}

/**
 * 스펙 디렉토리 트리 순회
 */
async function walkSpecsTree(basePath: string): Promise<SpecFileItem[]> {
  const result = await readDir(basePath);
  if (!result.success) return [];

  const items: SpecFileItem[] = [];

  for (const entry of result.data) {
    const fullPath = path.join(basePath, entry);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      const children = await walkSpecsTree(fullPath);
      items.push({
        path: fullPath,
        name: entry,
        isDirectory: true,
        children,
      });
    } else if (entry.endsWith('.md')) {
      items.push({
        path: fullPath,
        name: entry,
        isDirectory: false,
      });
    }
  }

  return items;
}

/**
 * 템플릿 목록 조회 (테스트 가능)
 */
export async function getTemplateList(projectPath: string): Promise<string[]> {
  const templatesPath = path.join(projectPath, '.sdd', 'templates');

  if (!(await fileExists(templatesPath))) {
    return [];
  }

  const result = await readDir(templatesPath);
  if (!result.success) {
    return [];
  }

  return result.data.filter(f => f.endsWith('.md'));
}

/**
 * 프로젝트 요약 조회 (테스트 가능)
 * 도메인 기반 구조 지원
 */
export async function getProjectSummary(projectPath: string): Promise<ProjectSummary | null> {
  const sddPath = path.join(projectPath, '.sdd');

  if (!(await fileExists(sddPath))) {
    return null;
  }

  // 기능 수 (getFeatureList 활용하여 정확한 카운트)
  const features = await getFeatureList(projectPath);
  const featureCount = features.length;

  // 변경 수
  const pendingResult = await listPendingChanges(sddPath);
  const pendingChangeCount = pendingResult.success ? pendingResult.data.length : 0;

  const archiveResult = await listArchives(sddPath);
  const archivedChangeCount = archiveResult.success ? archiveResult.data.length : 0;

  return {
    featureCount,
    pendingChangeCount,
    archivedChangeCount,
  };
}

/**
 * list 명령어 등록
 */
export function registerListCommand(program: Command): void {
  const listCmd = program
    .command('list')
    .alias('ls')
    .description('항목 목록 조회');

  // features 서브커맨드
  listCmd
    .command('features')
    .alias('f')
    .description('기능 목록 조회')
    .option('--status <status>', `상태별 필터 (${SPEC_STATUSES.join(', ')})`)
    .action(async (options) => {
      await listFeatures(options);
    });

  // changes 서브커맨드
  listCmd
    .command('changes')
    .alias('c')
    .description('변경 제안 목록 조회')
    .option('--pending', '대기 중인 변경만 표시')
    .option('--archived', '아카이브된 변경만 표시')
    .action(async (options) => {
      await listChanges(options);
    });

  // specs 서브커맨드
  listCmd
    .command('specs')
    .alias('s')
    .description('스펙 파일 목록 조회')
    .action(async () => {
      await listSpecs();
    });

  // templates 서브커맨드
  listCmd
    .command('templates')
    .alias('t')
    .description('템플릿 목록 조회')
    .action(async () => {
      await listTemplates();
    });

  // 기본 동작 (전체 요약)
  listCmd.action(async () => {
    await listSummary();
  });
}

/**
 * SDD 프로젝트 루트 조회 (없으면 에러 종료)
 */
async function requireProjectRoot(): Promise<string> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.warn('.sdd 디렉토리가 없습니다. sdd init을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }
  return projectRoot;
}

/**
 * 기능 목록 조회 (CLI 래퍼)
 */
async function listFeatures(options: { status?: string }): Promise<void> {
  const features = await getFeatureList(await requireProjectRoot(), options);

  if (features.length === 0) {
    logger.info('기능이 없습니다.');
    return;
  }

  console.log('');
  console.log('📋 기능 목록');
  console.log('─'.repeat(50));
  for (const f of features) {
    const statusIcon = getListStatusIcon(f.status);
    console.log(`${statusIcon} ${f.title} (${f.id}) - ${f.status}`);
  }
  console.log('');
}

/**
 * 변경 목록 조회 (CLI 래퍼)
 */
async function listChanges(options: { pending?: boolean; archived?: boolean }): Promise<void> {
  const result = await getChangeList(await requireProjectRoot(), options);

  console.log('');

  if (!options.archived) {
    if (result.pending.length > 0) {
      console.log('📝 대기 중인 변경');
      console.log('─'.repeat(30));
      for (const change of result.pending) {
        console.log(`  - ${change}`);
      }
      console.log('');
    } else if (!options.pending) {
      console.log('대기 중인 변경이 없습니다.');
    }
  }

  if (!options.pending) {
    if (result.archived.length > 0) {
      console.log('📦 아카이브된 변경');
      console.log('─'.repeat(30));
      for (const archive of result.archived) {
        console.log(`  - ${archive}`);
      }
      console.log('');
    } else if (!options.archived) {
      console.log('아카이브된 변경이 없습니다.');
    }
  }
}

/**
 * 스펙 파일 목록 (CLI 래퍼)
 */
async function listSpecs(): Promise<void> {
  const specsPath = path.join(await requireProjectRoot(), '.sdd', 'specs');
  const tree = await getSpecFileTree(specsPath);

  if (tree.length === 0) {
    logger.warn('스펙 디렉토리가 없습니다.');
    return;
  }

  console.log('');
  console.log('📄 스펙 파일 목록');
  console.log('─'.repeat(50));

  printSpecTree(tree, '');
  console.log('');
}

/**
 * 스펙 트리 출력
 */
function printSpecTree(items: SpecFileItem[], prefix: string): void {
  for (const item of items) {
    if (item.isDirectory) {
      console.log(`${prefix}📁 ${item.name}/`);
      if (item.children) {
        printSpecTree(item.children, prefix + '   ');
      }
    } else {
      console.log(`${prefix}📄 ${item.name}`);
    }
  }
}

/**
 * 템플릿 목록 (CLI 래퍼)
 */
async function listTemplates(): Promise<void> {
  const templates = await getTemplateList(await requireProjectRoot());

  if (templates.length === 0) {
    logger.warn('템플릿 디렉토리가 없습니다.');
    return;
  }

  console.log('');
  console.log('📑 템플릿 목록');
  console.log('─'.repeat(30));
  for (const template of templates) {
    console.log(`  - ${template}`);
  }
  console.log('');
}

/**
 * 전체 요약 (CLI 래퍼)
 */
async function listSummary(): Promise<void> {
  const summary = await getProjectSummary(await requireProjectRoot());

  if (!summary) {
    logger.warn('.sdd 디렉토리가 없습니다. sdd init을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  console.log('');
  console.log('📊 SDD 프로젝트 요약');
  console.log('═'.repeat(40));
  console.log(`📋 기능: ${summary.featureCount}개`);
  console.log(`📝 대기 중인 변경: ${summary.pendingChangeCount}개`);
  console.log(`📦 아카이브된 변경: ${summary.archivedChangeCount}개`);
  console.log('');
  console.log('상세 정보:');
  console.log('  sdd list features - 기능 목록');
  console.log('  sdd list changes  - 변경 목록');
  console.log('  sdd list specs    - 스펙 파일 목록');
  console.log('  sdd status        - 프로젝트 상태');
  console.log('');
}
