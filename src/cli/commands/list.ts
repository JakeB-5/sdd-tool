/**
 * sdd list 명령어 - 항목 목록 조회
 */
import { Command } from 'commander';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { logger } from '../../utils/index.js';
import { fileExists, readDir } from '../../utils/fs.js';
import { parseSpecMetadata } from '../../core/new/spec-generator.js';
import { listPendingChanges, listArchives } from '../../core/change/archive.js';

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
    .option('--status <status>', '상태별 필터 (draft, specified, planned, etc.)')
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
 * 기능 목록 조회
 */
async function listFeatures(options: { status?: string }): Promise<void> {
  const cwd = process.cwd();
  const specsPath = path.join(cwd, '.sdd', 'specs');

  if (!(await fileExists(specsPath))) {
    logger.warn('스펙 디렉토리가 없습니다. sdd init을 먼저 실행하세요.');
    return;
  }

  const result = await readDir(specsPath);
  if (!result.success) {
    logger.error('스펙 디렉토리를 읽을 수 없습니다.');
    return;
  }

  const features: Array<{ id: string; title: string; status: string }> = [];

  for (const entry of result.data) {
    const featurePath = path.join(specsPath, entry);
    const stat = await fs.stat(featurePath);

    if (stat.isDirectory()) {
      const specPath = path.join(featurePath, 'spec.md');
      if (await fileExists(specPath)) {
        const content = await fs.readFile(specPath, 'utf-8');
        const metadata = parseSpecMetadata(content);
        if (metadata) {
          if (!options.status || metadata.status === options.status) {
            features.push({
              id: entry,
              title: metadata.title,
              status: metadata.status,
            });
          }
        }
      }
    }
  }

  if (features.length === 0) {
    logger.info('기능이 없습니다.');
    return;
  }

  console.log('');
  console.log('📋 기능 목록');
  console.log('─'.repeat(50));
  for (const f of features) {
    const statusIcon = getStatusIcon(f.status);
    console.log(`${statusIcon} ${f.title} (${f.id}) - ${f.status}`);
  }
  console.log('');
}

/**
 * 변경 목록 조회
 */
async function listChanges(options: { pending?: boolean; archived?: boolean }): Promise<void> {
  const cwd = process.cwd();
  const sddPath = path.join(cwd, '.sdd');

  if (!(await fileExists(sddPath))) {
    logger.warn('.sdd 디렉토리가 없습니다. sdd init을 먼저 실행하세요.');
    return;
  }

  console.log('');

  if (!options.archived) {
    const pendingResult = await listPendingChanges(sddPath);
    if (pendingResult.success && pendingResult.data.length > 0) {
      console.log('📝 대기 중인 변경');
      console.log('─'.repeat(30));
      for (const change of pendingResult.data) {
        console.log(`  - ${change}`);
      }
      console.log('');
    } else if (!options.pending) {
      console.log('대기 중인 변경이 없습니다.');
    }
  }

  if (!options.pending) {
    const archiveResult = await listArchives(sddPath);
    if (archiveResult.success && archiveResult.data.length > 0) {
      console.log('📦 아카이브된 변경');
      console.log('─'.repeat(30));
      for (const archive of archiveResult.data) {
        console.log(`  - ${archive}`);
      }
      console.log('');
    } else if (!options.archived) {
      console.log('아카이브된 변경이 없습니다.');
    }
  }
}

/**
 * 스펙 파일 목록
 */
async function listSpecs(): Promise<void> {
  const cwd = process.cwd();
  const specsPath = path.join(cwd, '.sdd', 'specs');

  if (!(await fileExists(specsPath))) {
    logger.warn('스펙 디렉토리가 없습니다.');
    return;
  }

  console.log('');
  console.log('📄 스펙 파일 목록');
  console.log('─'.repeat(50));

  await walkSpecs(specsPath, '');
  console.log('');
}

/**
 * 스펙 디렉토리 순회
 */
async function walkSpecs(basePath: string, prefix: string): Promise<void> {
  const result = await readDir(basePath);
  if (!result.success) return;

  for (const entry of result.data) {
    const fullPath = path.join(basePath, entry);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      console.log(`${prefix}📁 ${entry}/`);
      await walkSpecs(fullPath, prefix + '   ');
    } else if (entry.endsWith('.md')) {
      console.log(`${prefix}📄 ${entry}`);
    }
  }
}

/**
 * 템플릿 목록
 */
async function listTemplates(): Promise<void> {
  const cwd = process.cwd();
  const templatesPath = path.join(cwd, '.sdd', 'templates');

  if (!(await fileExists(templatesPath))) {
    logger.warn('템플릿 디렉토리가 없습니다.');
    return;
  }

  const result = await readDir(templatesPath);
  if (!result.success) {
    logger.error('템플릿 디렉토리를 읽을 수 없습니다.');
    return;
  }

  console.log('');
  console.log('📑 템플릿 목록');
  console.log('─'.repeat(30));
  for (const template of result.data.filter(f => f.endsWith('.md'))) {
    console.log(`  - ${template}`);
  }
  console.log('');
}

/**
 * 전체 요약
 */
async function listSummary(): Promise<void> {
  const cwd = process.cwd();
  const sddPath = path.join(cwd, '.sdd');

  if (!(await fileExists(sddPath))) {
    logger.warn('.sdd 디렉토리가 없습니다. sdd init을 먼저 실행하세요.');
    return;
  }

  console.log('');
  console.log('📊 SDD 프로젝트 요약');
  console.log('═'.repeat(40));

  // 기능 수
  const specsPath = path.join(sddPath, 'specs');
  let featureCount = 0;
  if (await fileExists(specsPath)) {
    const result = await readDir(specsPath);
    if (result.success) {
      for (const entry of result.data) {
        const stat = await fs.stat(path.join(specsPath, entry));
        if (stat.isDirectory()) featureCount++;
      }
    }
  }
  console.log(`📋 기능: ${featureCount}개`);

  // 변경 수
  const pendingResult = await listPendingChanges(sddPath);
  const pendingCount = pendingResult.success ? pendingResult.data.length : 0;
  console.log(`📝 대기 중인 변경: ${pendingCount}개`);

  const archiveResult = await listArchives(sddPath);
  const archiveCount = archiveResult.success ? archiveResult.data.length : 0;
  console.log(`📦 아카이브된 변경: ${archiveCount}개`);

  console.log('');
  console.log('상세 정보:');
  console.log('  sdd list features - 기능 목록');
  console.log('  sdd list changes  - 변경 목록');
  console.log('  sdd list specs    - 스펙 파일 목록');
  console.log('  sdd status        - 프로젝트 상태');
  console.log('');
}

/**
 * 상태 아이콘
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'draft':
      return '📝';
    case 'specified':
      return '📄';
    case 'planned':
      return '📋';
    case 'tasked':
      return '✏️';
    case 'implementing':
      return '🔨';
    case 'completed':
      return '✅';
    default:
      return '❓';
  }
}
