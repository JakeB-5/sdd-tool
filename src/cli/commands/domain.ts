/**
 * sdd domain 명령어
 *
 * 도메인 관리 CLI 명령어
 */
import { Command } from 'commander';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { DomainService, DOMAINS_FILE, DOMAINS_DIR } from '../../core/domain/service.js';
import { DomainGraph, formatCycleWarning } from '../../core/domain/graph.js';
import { validateDomains, formatValidationResult } from '../../core/validators/domain-validator.js';
import { toDomainInfoList, DomainInfo, DomainsConfig, DependencyType } from '../../schemas/domains.schema.js';
import { findSddRoot, fileExists, readFile, writeFile, directoryExists } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';
import { Result, success, failure } from '../../types/index.js';

/**
 * 도메인 생성 옵션
 */
export interface DomainCreateOptions {
  description?: string;
  path?: string;
  dependsOn?: string[];
  extends?: string[];
  implements?: string[];
}

/**
 * 도메인 목록 옵션
 */
export interface DomainListOptions {
  json?: boolean;
  tree?: boolean;
  hasSpecs?: boolean;
  orphan?: boolean;
}

/**
 * 도메인 그래프 옵션
 */
export interface DomainGraphOptions {
  format?: 'mermaid' | 'dot' | 'json';
  output?: string;
  direction?: 'LR' | 'TD' | 'BT' | 'RL';
}

/**
 * 도메인 삭제 옵션
 */
export interface DomainDeleteOptions {
  force?: boolean;
  unlinkSpecs?: boolean;
}

/**
 * 도메인 의존성 옵션
 */
export interface DomainDependsOptions {
  on?: string;
  type?: DependencyType;
  remove?: boolean;
}

/**
 * 도메인 정보 (CLI 출력용)
 */
export interface DomainListItem {
  id: string;
  description: string;
  specCount: number;
  dependencies: string[];
  path?: string;
}

/**
 * 도메인 생성 실행
 */
export async function executeDomainCreate(
  name: string,
  options: DomainCreateOptions = {},
  projectPath?: string
): Promise<Result<{ id: string; domainPath: string }, Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다. 먼저 sdd init을 실행하세요.'));
  }

  const service = new DomainService(root);

  // 기본값 설정
  const description = options.description || `${name} 도메인`;

  // 도메인 생성
  const createResult = await service.create(name, {
    description,
    path: options.path,
    uses: options.dependsOn,
    extends: options.extends,
    implements: options.implements,
  });

  if (!createResult.success) {
    return failure(createResult.error);
  }

  const domainPath = path.join(root, DOMAINS_DIR, name);

  return success({
    id: name,
    domainPath,
  });
}

/**
 * 도메인 목록 조회 실행
 */
export async function executeDomainList(
  options: DomainListOptions = {},
  projectPath?: string
): Promise<Result<DomainListItem[], Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다.'));
  }

  const service = new DomainService(root);
  const listResult = await service.list();

  if (!listResult.success) {
    return failure(listResult.error);
  }

  let domains = listResult.data;

  // 필터링 적용
  if (options.hasSpecs) {
    domains = domains.filter((d) => d.specs.length > 0);
  }

  if (options.orphan) {
    domains = domains.filter((d) => d.specs.length === 0);
  }

  return success(
    domains.map((d) => ({
      id: d.id,
      description: d.description,
      specCount: d.specs.length,
      dependencies: d.dependsOn,
      path: d.path,
    }))
  );
}

/**
 * 도메인 상세 정보 조회 실행
 */
export async function executeDomainShow(
  domainId: string,
  projectPath?: string
): Promise<Result<DomainInfo & { graph?: string }, Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다.'));
  }

  const service = new DomainService(root);
  const domainResult = await service.get(domainId);

  if (!domainResult.success) {
    return failure(domainResult.error);
  }

  if (!domainResult.data) {
    return failure(new Error(`도메인 '${domainId}'을(를) 찾을 수 없습니다.`));
  }

  // 그래프 정보 가져오기
  const configResult = await service.load();
  let graphInfo: string | undefined;

  if (configResult.success) {
    const graph = new DomainGraph(configResult.data);
    const dependents = graph.getDependents(domainId);
    const dependencies = graph.getDependencies(domainId);

    if (dependents.length > 0 || dependencies.length > 0) {
      const parts: string[] = [];
      if (dependencies.length > 0) {
        parts.push(dependencies.map((e) => e.to).join(', '));
        parts.push('←');
      }
      parts.push(domainId);
      if (dependents.length > 0) {
        parts.push('←');
        parts.push(dependents.map((e) => e.from).join(', '));
      }
      graphInfo = parts.join(' ');
    }
  }

  return success({
    ...domainResult.data,
    graph: graphInfo,
  });
}

/**
 * 도메인 삭제 실행
 */
export async function executeDomainDelete(
  domainId: string,
  options: DomainDeleteOptions = {},
  projectPath?: string
): Promise<Result<void, Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다.'));
  }

  const service = new DomainService(root);

  // 도메인 존재 확인
  const domainResult = await service.get(domainId);
  if (!domainResult.success) {
    return failure(domainResult.error);
  }

  if (!domainResult.data) {
    return failure(new Error(`도메인 '${domainId}'을(를) 찾을 수 없습니다.`));
  }

  const domain = domainResult.data;

  // 스펙이 있고 force가 아니면 에러
  if (domain.specs.length > 0 && !options.force) {
    return failure(
      new Error(
        `도메인 '${domainId}'에 ${domain.specs.length}개의 스펙이 연결되어 있습니다. ` +
          `삭제하려면 --force 옵션을 사용하세요.`
      )
    );
  }

  // 스펙 연결 해제
  if (options.unlinkSpecs && domain.specs.length > 0) {
    for (const specId of domain.specs) {
      await service.unlinkSpec(domainId, specId);
    }
  }

  // 도메인 삭제
  return service.delete(domainId);
}

/**
 * 도메인 이름 변경 실행
 */
export async function executeDomainRename(
  oldId: string,
  newId: string,
  projectPath?: string
): Promise<Result<void, Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다.'));
  }

  const service = new DomainService(root);
  return service.rename(oldId, newId);
}

/**
 * 도메인 그래프 생성 실행
 */
export async function executeDomainGraph(
  options: DomainGraphOptions = {},
  projectPath?: string
): Promise<Result<string, Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다.'));
  }

  const service = new DomainService(root);
  const configResult = await service.load();

  if (!configResult.success) {
    return failure(configResult.error);
  }

  const graph = new DomainGraph(configResult.data);
  const format = options.format || 'mermaid';

  let output: string;

  switch (format) {
    case 'mermaid':
      output = graph.toMermaid({ direction: options.direction || 'LR' });
      break;
    case 'dot':
      output = graph.toDot();
      break;
    case 'json':
      output = JSON.stringify(graph.toJson(), null, 2);
      break;
    default:
      return failure(new Error(`지원하지 않는 형식: ${format}`));
  }

  // 출력 파일 지정
  if (options.output) {
    const outputPath = path.isAbsolute(options.output) ? options.output : path.join(root, options.output);

    const writeResult = await writeFile(outputPath, output);
    if (!writeResult.success) {
      return failure(new Error(`파일 저장 실패: ${writeResult.error.message}`));
    }
  }

  return success(output);
}

/**
 * 도메인 검증 실행
 */
export async function executeDomainValidate(
  projectPath?: string
): Promise<Result<{ valid: boolean; message: string }, Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다.'));
  }

  const service = new DomainService(root);
  const configResult = await service.load();

  if (!configResult.success) {
    return failure(configResult.error);
  }

  const validationResult = validateDomains(configResult.data, {
    cyclesAsErrors: true,
    warnEmptyDomains: true,
    validateSpecs: false,
  });

  const message = formatValidationResult(validationResult);

  return success({
    valid: validationResult.valid,
    message,
  });
}

/**
 * 스펙을 도메인에 연결 실행
 */
export async function executeDomainLink(
  domainId: string,
  specIds: string[],
  projectPath?: string
): Promise<Result<void, Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다.'));
  }

  const service = new DomainService(root);

  // 도메인 존재 확인
  const domainResult = await service.get(domainId);
  if (!domainResult.success) {
    return failure(domainResult.error);
  }

  if (!domainResult.data) {
    return failure(new Error(`도메인 '${domainId}'을(를) 찾을 수 없습니다.`));
  }

  // 각 스펙 연결
  for (const specId of specIds) {
    const linkResult = await service.linkSpec(domainId, specId);
    if (!linkResult.success) {
      return failure(new Error(`스펙 '${specId}' 연결 실패: ${linkResult.error.message}`));
    }
  }

  return success(undefined);
}

/**
 * 스펙에서 도메인 연결 해제 실행
 */
export async function executeDomainUnlink(
  domainId: string,
  specIds: string[],
  projectPath?: string
): Promise<Result<void, Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다.'));
  }

  const service = new DomainService(root);

  // 각 스펙 연결 해제
  for (const specId of specIds) {
    const unlinkResult = await service.unlinkSpec(domainId, specId);
    if (!unlinkResult.success) {
      return failure(new Error(`스펙 '${specId}' 연결 해제 실패: ${unlinkResult.error.message}`));
    }
  }

  return success(undefined);
}

/**
 * 도메인 의존성 설정 실행
 */
export async function executeDomainDepends(
  domainId: string,
  options: DomainDependsOptions,
  projectPath?: string
): Promise<Result<void, Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다.'));
  }

  if (!options.on) {
    return failure(new Error('--on 옵션으로 대상 도메인을 지정해야 합니다.'));
  }

  const service = new DomainService(root);
  const type = options.type || 'uses';

  if (options.remove) {
    return service.removeDependency(domainId, options.on, type);
  } else {
    return service.addDependency(domainId, options.on, type);
  }
}

/**
 * 도메인 업데이트 실행
 */
export async function executeDomainUpdate(
  domainId: string,
  updates: {
    description?: string;
    path?: string;
  },
  projectPath?: string
): Promise<Result<void, Error>> {
  const root = projectPath || (await findSddRoot(process.cwd()));
  if (!root) {
    return failure(new Error('SDD 프로젝트를 찾을 수 없습니다.'));
  }

  const service = new DomainService(root);
  return service.update(domainId, updates);
}

/**
 * 의존성 트리 형태로 포맷팅
 */
function formatDomainTree(domains: DomainListItem[]): string {
  if (domains.length === 0) {
    return '등록된 도메인이 없습니다.';
  }

  const lines: string[] = [`📁 도메인 목록 (${domains.length}개)`];

  domains.forEach((domain, index) => {
    const isLast = index === domains.length - 1;
    const prefix = isLast ? '└── ' : '├── ';
    const depsStr = domain.dependencies.length > 0 ? ` → [${domain.dependencies.join(', ')}]` : '';
    lines.push(`${prefix}${domain.id}     ${domain.description} (${domain.specCount} specs)${depsStr}`);
  });

  return lines.join('\n');
}

/**
 * 도메인 명령어 등록
 */
export function registerDomainCommand(program: Command): void {
  const domainCmd = program
    .command('domain')
    .description('도메인 관리')
    .addHelpText('after', '\n예제:\n  sdd domain create auth --description "인증 도메인"\n  sdd domain list --tree');

  // create 서브커맨드
  domainCmd
    .command('create <name>')
    .description('새 도메인 생성')
    .option('-d, --description <description>', '도메인 설명')
    .option('-p, --path <path>', '소스 경로')
    .option('--depends-on <domains...>', '의존하는 도메인 (uses)')
    .option('--extends <domains...>', '확장하는 도메인')
    .option('--implements <domains...>', '구현하는 도메인')
    .action(async (name: string, options: DomainCreateOptions) => {
      const result = await executeDomainCreate(name, options);

      if (!result.success) {
        logger.error('도메인 생성 실패', result.error.message);
        process.exit(ExitCode.GENERAL_ERROR);
      }

      logger.success('도메인 생성 완료', `${result.data.id} 도메인이 생성되었습니다.`);
      logger.info('경로', result.data.domainPath);
    });

  // list 서브커맨드
  domainCmd
    .command('list')
    .alias('ls')
    .description('도메인 목록 조회')
    .option('--json', 'JSON 형식으로 출력')
    .option('--tree', '의존성 트리 형태로 출력')
    .option('--has-specs', '스펙이 있는 도메인만')
    .option('--orphan', '스펙이 없는 도메인만')
    .action(async (options: DomainListOptions) => {
      const result = await executeDomainList(options);

      if (!result.success) {
        logger.error('도메인 목록 조회 실패', result.error.message);
        process.exit(ExitCode.GENERAL_ERROR);
      }

      if (options.json) {
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        console.log(formatDomainTree(result.data));
      }
    });

  // show 서브커맨드
  domainCmd
    .command('show <domain>')
    .description('도메인 상세 정보 조회')
    .action(async (domainId: string) => {
      const result = await executeDomainShow(domainId);

      if (!result.success) {
        logger.error('도메인 조회 실패', result.error.message);
        process.exit(ExitCode.GENERAL_ERROR);
      }

      const d = result.data;
      console.log(`\n# ${d.id} 도메인`);
      console.log(`설명: ${d.description}`);
      if (d.path) console.log(`경로: ${d.path}`);
      if (d.dependsOn.length > 0) console.log(`의존성: ${d.dependsOn.join(', ')}`);

      console.log(`\n스펙 목록 (${d.specs.length}):`);
      if (d.specs.length > 0) {
        d.specs.forEach((spec) => console.log(`  - ${spec}`));
      } else {
        console.log('  (없음)');
      }

      if (d.graph) {
        console.log(`\n의존 그래프:`);
        console.log(`  ${d.graph}`);
      }
    });

  // delete 서브커맨드
  domainCmd
    .command('delete <domain>')
    .alias('rm')
    .description('도메인 삭제')
    .option('-f, --force', '강제 삭제 (연결된 스펙 있어도)')
    .option('--unlink-specs', '연결된 스펙의 domain 필드 제거')
    .action(async (domainId: string, options: DomainDeleteOptions) => {
      const result = await executeDomainDelete(domainId, options);

      if (!result.success) {
        logger.error('도메인 삭제 실패', result.error.message);
        process.exit(ExitCode.GENERAL_ERROR);
      }

      logger.success('도메인 삭제 완료', `'${domainId}' 도메인이 삭제되었습니다.`);
    });

  // rename 서브커맨드
  domainCmd
    .command('rename <oldName> <newName>')
    .description('도메인 이름 변경')
    .action(async (oldId: string, newId: string) => {
      const result = await executeDomainRename(oldId, newId);

      if (!result.success) {
        logger.error('도메인 이름 변경 실패', result.error.message);
        process.exit(ExitCode.GENERAL_ERROR);
      }

      logger.success('도메인 이름 변경 완료', `'${oldId}' → '${newId}'`);
    });

  // graph 서브커맨드
  domainCmd
    .command('graph')
    .description('도메인 의존성 그래프 출력')
    .option('--format <format>', '출력 형식 (mermaid, dot, json)', 'mermaid')
    .option('-o, --output <file>', '출력 파일')
    .option('--direction <dir>', '방향 (LR, TD, BT, RL)', 'LR')
    .action(async (options: DomainGraphOptions) => {
      const result = await executeDomainGraph(options);

      if (!result.success) {
        logger.error('그래프 생성 실패', result.error.message);
        process.exit(ExitCode.GENERAL_ERROR);
      }

      console.log(result.data);

      if (options.output) {
        logger.success('파일 저장 완료', options.output);
      }
    });

  // validate 서브커맨드
  domainCmd
    .command('validate')
    .description('도메인 구조 검증')
    .action(async () => {
      const result = await executeDomainValidate();

      if (!result.success) {
        logger.error('검증 실패', result.error.message);
        process.exit(ExitCode.GENERAL_ERROR);
      }

      console.log(result.data.message);

      if (!result.data.valid) {
        process.exit(ExitCode.VALIDATION_ERROR);
      }
    });

  // link 서브커맨드
  domainCmd
    .command('link <domain> <specs...>')
    .description('스펙을 도메인에 연결')
    .action(async (domainId: string, specIds: string[]) => {
      const result = await executeDomainLink(domainId, specIds);

      if (!result.success) {
        logger.error('스펙 연결 실패', result.error.message);
        process.exit(ExitCode.GENERAL_ERROR);
      }

      logger.success('스펙 연결 완료', `${specIds.length}개의 스펙이 '${domainId}' 도메인에 연결되었습니다.`);
    });

  // unlink 서브커맨드
  domainCmd
    .command('unlink <domain> <specs...>')
    .description('스펙에서 도메인 연결 해제')
    .action(async (domainId: string, specIds: string[]) => {
      const result = await executeDomainUnlink(domainId, specIds);

      if (!result.success) {
        logger.error('스펙 연결 해제 실패', result.error.message);
        process.exit(ExitCode.GENERAL_ERROR);
      }

      logger.success('스펙 연결 해제 완료', `${specIds.length}개의 스펙이 '${domainId}' 도메인에서 연결 해제되었습니다.`);
    });

  // depends 서브커맨드
  domainCmd
    .command('depends <domain>')
    .description('도메인 간 의존성 설정')
    .option('--on <target>', '의존 대상 도메인')
    .option('--type <type>', '의존성 타입 (uses, extends, implements)', 'uses')
    .option('--remove', '의존성 제거')
    .action(async (domainId: string, options: DomainDependsOptions) => {
      const result = await executeDomainDepends(domainId, options);

      if (!result.success) {
        logger.error('의존성 설정 실패', result.error.message);
        process.exit(ExitCode.GENERAL_ERROR);
      }

      const action = options.remove ? '제거' : '추가';
      logger.success(`의존성 ${action} 완료`, `'${domainId}' → '${options.on}' (${options.type || 'uses'})`);
    });

  // update 서브커맨드
  domainCmd
    .command('update <domain>')
    .description('도메인 정보 업데이트')
    .option('-d, --description <description>', '새 설명')
    .option('-p, --path <path>', '새 경로')
    .action(async (domainId: string, options: { description?: string; path?: string }) => {
      const result = await executeDomainUpdate(domainId, options);

      if (!result.success) {
        logger.error('도메인 업데이트 실패', result.error.message);
        process.exit(ExitCode.GENERAL_ERROR);
      }

      logger.success('도메인 업데이트 완료', `'${domainId}' 도메인이 업데이트되었습니다.`);
    });
}
