/**
 * sdd context 명령어
 * 작업 컨텍스트(활성 도메인) 관리
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { Result, success, failure } from '../../types/index.js';
import { findSddRoot } from '../../utils/fs.js';
import { ContextManager, ContextInfo, createContextManager } from '../../core/context/manager.js';

/**
 * sdd context set 실행
 */
export async function executeContextSet(
  domainIds: string[],
  options: { includeDeps?: boolean },
  projectPath?: string
): Promise<Result<ContextInfo, Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다. sdd init을 먼저 실행하세요.'));
  }

  if (domainIds.length === 0) {
    return failure(new Error('하나 이상의 도메인을 지정해야 합니다.'));
  }

  const manager = createContextManager(root);
  return manager.set(domainIds, { includeDependencies: options.includeDeps !== false });
}

/**
 * sdd context show 실행
 */
export async function executeContextShow(projectPath?: string): Promise<Result<ContextInfo, Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다. sdd init을 먼저 실행하세요.'));
  }

  const manager = createContextManager(root);
  return manager.get();
}

/**
 * sdd context clear 실행
 */
export async function executeContextClear(projectPath?: string): Promise<Result<void, Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다. sdd init을 먼저 실행하세요.'));
  }

  const manager = createContextManager(root);
  return manager.clear();
}

/**
 * sdd context add 실행
 */
export async function executeContextAdd(
  domainId: string,
  options: { includeDeps?: boolean },
  projectPath?: string
): Promise<Result<ContextInfo, Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다. sdd init을 먼저 실행하세요.'));
  }

  const manager = createContextManager(root);
  return manager.addDomain(domainId, { includeDependencies: options.includeDeps !== false });
}

/**
 * sdd context remove 실행
 */
export async function executeContextRemove(domainId: string, projectPath?: string): Promise<Result<ContextInfo, Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다. sdd init을 먼저 실행하세요.'));
  }

  const manager = createContextManager(root);
  return manager.removeDomain(domainId);
}

/**
 * sdd context specs 실행 - 컨텍스트에 포함된 스펙 목록
 */
export async function executeContextSpecs(
  options: { json?: boolean },
  projectPath?: string
): Promise<Result<{ active: string[]; readOnly: string[] }, Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다. sdd init을 먼저 실행하세요.'));
  }

  const manager = createContextManager(root);
  return manager.getContextSpecs();
}

/**
 * 컨텍스트 정보 출력 포맷팅
 */
function formatContextInfo(info: ContextInfo): string {
  const lines: string[] = [];

  if (info.activeDomains.length === 0 && info.readOnlyDomains.length === 0) {
    lines.push(chalk.yellow('컨텍스트가 설정되지 않았습니다.'));
    lines.push(chalk.gray('sdd context set <domain>으로 컨텍스트를 설정하세요.'));
    return lines.join('\n');
  }

  lines.push(chalk.bold('현재 컨텍스트:'));
  lines.push('');

  // 활성 도메인
  if (info.activeDomains.length > 0) {
    lines.push(chalk.green('  활성 도메인 (편집 가능):'));
    for (const domain of info.activeDomainInfos) {
      const specCount = domain.specs.length;
      lines.push(
        `    ${chalk.cyan(domain.id)} - ${domain.description || '설명 없음'} (${specCount} specs)`
      );
    }
    lines.push('');
  }

  // 읽기 전용 도메인
  if (info.readOnlyDomains.length > 0) {
    lines.push(chalk.blue('  읽기 전용 도메인 (의존성):'));
    for (const domain of info.readOnlyDomainInfos) {
      const specCount = domain.specs.length;
      lines.push(
        `    ${chalk.gray(domain.id)} - ${domain.description || '설명 없음'} (${specCount} specs)`
      );
    }
    lines.push('');
  }

  // 요약
  lines.push(chalk.bold('요약:'));
  lines.push(`  총 도메인: ${info.activeDomains.length + info.readOnlyDomains.length}`);
  lines.push(`  총 스펙: ${info.totalSpecs}`);
  if (info.updatedAt) {
    lines.push(`  마지막 업데이트: ${new Date(info.updatedAt).toLocaleString('ko-KR')}`);
  }

  return lines.join('\n');
}

/**
 * context 명령어 등록
 */
export function registerContextCommand(program: Command): void {
  const context = program
    .command('context')
    .description('작업 컨텍스트(활성 도메인) 관리');

  // sdd context set <domain...>
  context
    .command('set')
    .description('작업 컨텍스트 설정')
    .argument('<domains...>', '활성화할 도메인 ID 목록')
    .option('--no-include-deps', '의존성 도메인 자동 포함 비활성화')
    .action(async (domains: string[], opts) => {
      const result = await executeContextSet(domains, { includeDeps: opts.includeDeps });

      if (!result.success) {
        console.error(chalk.red(`오류: ${result.error.message}`));
        process.exit(1);
      }

      console.log(chalk.green('컨텍스트가 설정되었습니다.'));
      console.log('');
      console.log(formatContextInfo(result.data));
    });

  // sdd context show
  context
    .command('show')
    .description('현재 컨텍스트 표시')
    .option('--json', 'JSON 형식으로 출력')
    .action(async (opts) => {
      const result = await executeContextShow();

      if (!result.success) {
        console.error(chalk.red(`오류: ${result.error.message}`));
        process.exit(1);
      }

      if (opts.json) {
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        console.log(formatContextInfo(result.data));
      }
    });

  // sdd context clear
  context
    .command('clear')
    .description('컨텍스트 해제')
    .action(async () => {
      const result = await executeContextClear();

      if (!result.success) {
        console.error(chalk.red(`오류: ${result.error.message}`));
        process.exit(1);
      }

      console.log(chalk.green('컨텍스트가 해제되었습니다.'));
    });

  // sdd context add <domain>
  context
    .command('add')
    .description('컨텍스트에 도메인 추가')
    .argument('<domain>', '추가할 도메인 ID')
    .option('--no-include-deps', '의존성 도메인 자동 포함 비활성화')
    .action(async (domain: string, opts) => {
      const result = await executeContextAdd(domain, { includeDeps: opts.includeDeps });

      if (!result.success) {
        console.error(chalk.red(`오류: ${result.error.message}`));
        process.exit(1);
      }

      console.log(chalk.green(`도메인 "${domain}"이(가) 컨텍스트에 추가되었습니다.`));
      console.log('');
      console.log(formatContextInfo(result.data));
    });

  // sdd context remove <domain>
  context
    .command('remove')
    .alias('rm')
    .description('컨텍스트에서 도메인 제거')
    .argument('<domain>', '제거할 도메인 ID')
    .action(async (domain: string) => {
      const result = await executeContextRemove(domain);

      if (!result.success) {
        console.error(chalk.red(`오류: ${result.error.message}`));
        process.exit(1);
      }

      console.log(chalk.green(`도메인 "${domain}"이(가) 컨텍스트에서 제거되었습니다.`));
      console.log('');
      console.log(formatContextInfo(result.data));
    });

  // sdd context specs
  context
    .command('specs')
    .description('컨텍스트에 포함된 스펙 목록')
    .option('--json', 'JSON 형식으로 출력')
    .action(async (opts) => {
      const result = await executeContextSpecs(opts);

      if (!result.success) {
        console.error(chalk.red(`오류: ${result.error.message}`));
        process.exit(1);
      }

      if (opts.json) {
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        const { active, readOnly } = result.data;

        if (active.length === 0 && readOnly.length === 0) {
          console.log(chalk.yellow('컨텍스트에 스펙이 없습니다.'));
          return;
        }

        console.log(chalk.bold('컨텍스트 스펙 목록:'));
        console.log('');

        if (active.length > 0) {
          console.log(chalk.green('  활성 스펙 (편집 가능):'));
          for (const spec of active) {
            console.log(`    - ${spec}`);
          }
          console.log('');
        }

        if (readOnly.length > 0) {
          console.log(chalk.blue('  읽기 전용 스펙:'));
          for (const spec of readOnly) {
            console.log(`    - ${chalk.gray(spec)}`);
          }
        }
      }
    });

  // 기본 동작: show
  context.action(async () => {
    const result = await executeContextShow();

    if (!result.success) {
      console.error(chalk.red(`오류: ${result.error.message}`));
      process.exit(1);
    }

    console.log(formatContextInfo(result.data));
  });
}
