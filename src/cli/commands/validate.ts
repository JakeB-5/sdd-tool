/**
 * sdd validate 명령어
 */
import { Command, Option } from 'commander';
import path from 'node:path';
import chalk from 'chalk';
import { validateSpecs, type FileValidationResult, type ValidateResult } from '../../core/spec/validator.js';
import { ExitCode } from '../../errors/index.js';
import { findSddRoot, fileExists } from '../../utils/fs.js';
import * as logger from '../../utils/logger.js';
import { Result, success, failure } from '../../types/index.js';
import { createDomainService } from '../../core/domain/service.js';
import {
  validateDomains,
  formatValidationResult,
  type DomainValidationResult,
} from '../../core/validators/domain-validator.js';
import { listSpecs, resolveDomainSpecRef } from '../../core/spec/locator.js';
import { setCacheOptions, getCacheOptions } from '../../core/cache/index.js';

/**
 * CLI 옵션
 */
export interface ValidateOptions {
  strict?: boolean;
  quiet?: boolean;
  checkLinks?: boolean;
  constitution?: boolean;
  domain?: string;
  orphanSpecs?: boolean;
  useCache?: boolean;
  noCache?: boolean;
}

/**
 * 검증 컨텍스트
 */
export interface ValidateContext {
  resolvedPath: string;
  specsRoot?: string;
  checkConstitution: boolean;
  hasConstitution: boolean;
  sddRoot?: string;
  domainFilter?: string;
  checkOrphanSpecs?: boolean;
}

/**
 * 검증 명령어 결과
 */
export interface ValidateCommandResult {
  context: ValidateContext;
  data: ValidateResult;
  domainValidation?: DomainValidationResult;
}

/**
 * 검증 컨텍스트 생성
 */
export async function createValidateContext(
  targetPath: string,
  options: ValidateOptions,
  sddRoot: string | null
): Promise<Result<ValidateContext, Error>> {
  let resolvedPath: string;
  let specsRoot: string | undefined;

  if (targetPath) {
    resolvedPath = path.resolve(targetPath);
  } else {
    if (!sddRoot) {
      return failure(new Error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.'));
    }
    resolvedPath = path.join(sddRoot, '.sdd', 'specs');
  }

  if (options.checkLinks && sddRoot) {
    specsRoot = path.join(sddRoot, '.sdd', 'specs');
  }

  const checkConstitution = options.constitution !== false;
  let hasConstitution = false;

  if (checkConstitution && sddRoot) {
    const constitutionPath = path.join(sddRoot, '.sdd', 'constitution.md');
    hasConstitution = await fileExists(constitutionPath);
  }

  // 도메인 필터 검증
  let domainFilter: string | undefined;
  if (options.domain && sddRoot) {
    const domainService = createDomainService(sddRoot);
    const domainResult = await domainService.get(options.domain);
    if (!domainResult.success || !domainResult.data) {
      return failure(new Error(`도메인을 찾을 수 없습니다: ${options.domain}`));
    }
    domainFilter = options.domain;
  }

  return success({
    resolvedPath,
    specsRoot,
    checkConstitution,
    hasConstitution,
    sddRoot: sddRoot || undefined,
    domainFilter,
    checkOrphanSpecs: options.orphanSpecs,
  });
}

/**
 * 검증 핵심 로직 (테스트 가능)
 */
export async function executeValidate(
  options: ValidateOptions,
  context: ValidateContext
): Promise<Result<ValidateResult, Error>> {
  const resolvedPath = context.resolvedPath;

  // 도메인 필터가 있으면 해당 도메인 스펙만 검증
  if (context.domainFilter && context.sddRoot) {
    const domainService = createDomainService(context.sddRoot);
    const domainResult = await domainService.get(context.domainFilter);

    if (domainResult.success && domainResult.data) {
      const specs = domainResult.data.specs || [];
      if (specs.length === 0) {
        // 도메인에 스펙이 없으면 빈 결과 반환
        return success({
          files: [],
          passed: 0,
          failed: 0,
          warnings: 0,
        });
      }

      // 도메인의 스펙들만 검증 (spec locator로 각 스펙 경로 해석)
      const allSpecs = await listSpecs(path.join(context.sddRoot, '.sdd'));
      const specPaths: string[] = [];

      for (const specId of specs) {
        const location = resolveDomainSpecRef(allSpecs, context.domainFilter, specId);
        if (location && !specPaths.includes(location.specPath)) {
          specPaths.push(location.specPath);
        }
      }

      if (specPaths.length === 0) {
        return success({
          files: [],
          passed: 0,
          failed: 0,
          warnings: 0,
        });
      }

      // 각 스펙 파일 개별 검증 후 결과 통합
      const allResults: ValidateResult = {
        files: [],
        passed: 0,
        failed: 0,
        warnings: 0,
      };

      for (const specPath of specPaths) {
        const result = await validateSpecs(specPath, {
          strict: options.strict,
          checkLinks: options.checkLinks,
          specsRoot: context.specsRoot,
          checkConstitution: context.checkConstitution && context.hasConstitution,
          sddRoot: context.sddRoot,
        });

        if (result.success) {
          allResults.files.push(...result.data.files);
          allResults.passed += result.data.passed;
          allResults.failed += result.data.failed;
          allResults.warnings += result.data.warnings;
        }
      }

      return success(allResults);
    }
  }

  const result = await validateSpecs(resolvedPath, {
    strict: options.strict,
    checkLinks: options.checkLinks,
    specsRoot: context.specsRoot,
    checkConstitution: context.checkConstitution && context.hasConstitution,
    sddRoot: context.sddRoot,
  });

  if (!result.success) {
    return failure(result.error);
  }

  return success(result.data);
}

/**
 * 도메인 검증 실행
 */
export async function executeDomainValidation(
  sddRoot: string,
  options: { orphanSpecs?: boolean; strict?: boolean }
): Promise<Result<DomainValidationResult, Error>> {
  const domainService = createDomainService(sddRoot);
  const configResult = await domainService.load();

  if (!configResult.success) {
    // 도메인 설정이 없으면 스킵
    return success({
      valid: true,
      issues: [],
      errors: [],
      warnings: [],
      infos: [],
    });
  }

  // 도메인이 없으면 스킵
  const domains = configResult.data.domains || {};
  if (Object.keys(domains).length === 0) {
    return success({
      valid: true,
      issues: [],
      errors: [],
      warnings: [],
      infos: [],
    });
  }

  // 스펙 ID 목록 수집 (canonical id) 및 domains.yml 스펙 참조를 canonical id로 정규화
  const allSpecs = await listSpecs(path.join(sddRoot, '.sdd'));
  const existingSpecs = allSpecs.map((s) => s.id);

  const normalizedDomains: typeof domains = {};
  for (const [domainId, def] of Object.entries(domains)) {
    normalizedDomains[domainId] = {
      ...def,
      specs: (def.specs ?? []).map(
        (ref) => resolveDomainSpecRef(allSpecs, domainId, ref)?.id ?? ref
      ),
    };
  }

  // `sdd new` without --domain writes to the implicit `common` bucket; unless `common`
  // is a declared domain, those specs are not orphans
  const orphanExemptSpecs = 'common' in domains
    ? []
    : allSpecs.filter((s) => s.domain === 'common').map((s) => s.id);

  const result = validateDomains({ ...configResult.data, domains: normalizedDomains }, {
    existingSpecs,
    orphanExemptSpecs,
    detectOrphanSpecs: options.orphanSpecs,
    cyclesAsErrors: options.strict,
  });

  return success(result);
}

/**
 * 결과 요약 문자열 생성
 */
export function formatValidateSummary(result: ValidateResult, useColors = true): string {
  const { passed, failed, warnings } = result;

  const passedText = useColors ? chalk.green(`${passed} passed`) : `${passed} passed`;
  const failedText = failed > 0
    ? (useColors ? chalk.red(`${failed} failed`) : `${failed} failed`)
    : `${failed} failed`;
  const warningsText = warnings > 0
    ? (useColors ? chalk.yellow(`${warnings} warnings`) : `${warnings} warnings`)
    : '';

  return [passedText, failedText, warningsText].filter(Boolean).join(', ');
}

/**
 * validate 명령어 등록
 */
export function registerValidateCommand(program: Command): void {
  program
    .command('validate')
    .description('스펙 파일 형식을 검증합니다')
    .argument('[path]', '검증할 파일 또는 디렉토리', '')
    .option('-s, --strict', '경고도 에러로 처리')
    .option('-q, --quiet', '요약만 출력')
    .option('-l, --check-links', '참조 링크 유효성 검사')
    .option('-c, --constitution', 'Constitution 버전 확인 (기본값)')
    .option('--no-constitution', 'Constitution 검사 건너뛰기')
    .option('-d, --domain <domain>', '특정 도메인 스펙만 검증')
    .option('--orphan-specs', '도메인에 속하지 않은 스펙 검사')
    .option('--use-cache', '캐시 사용 (기본값)')
    .option('--no-cache', '캐시 사용 안함')
    // No-op kept for git hooks generated by <=1.6.0, which call `sdd validate --ci`
    .addOption(new Option('--ci', '(deprecated) 무시됨').hideHelp())
    .action(async (targetPath: string, options: ValidateOptions) => {
      try {
        await runValidate(targetPath, options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * 검증 CLI 실행 (출력 및 종료 처리)
 */
async function runValidate(
  targetPath: string,
  options: ValidateOptions
): Promise<void> {
  // 캐시 옵션 처리
  if (options.noCache) {
    const currentOptions = getCacheOptions();
    setCacheOptions({ enabled: false });
    // 명령 완료 후 복원할 수 있도록 원래 설정 저장
    const restoreCache = () => setCacheOptions(currentOptions);
    process.on('exit', restoreCache);
  } else if (options.useCache !== undefined) {
    setCacheOptions({ enabled: options.useCache });
  }

  const sddRoot = await findSddRoot();

  const contextResult = await createValidateContext(targetPath, options, sddRoot);
  if (!contextResult.success) {
    logger.error(contextResult.error.message);
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const context = contextResult.data;

  if (!options.quiet) {
    if (context.domainFilter) {
      logger.info(`도메인 "${context.domainFilter}" 스펙 검증 중`);
    } else {
      logger.info(`검증 중: ${context.resolvedPath}`);
    }
    if (options.checkLinks) {
      logger.info('(참조 링크 검증 포함)');
    }
    if (context.checkConstitution && context.hasConstitution) {
      logger.info('(Constitution 버전 확인 포함)');
    }
    if (options.orphanSpecs) {
      logger.info('(고아 스펙 검사 포함)');
    }
    logger.newline();
  }

  const result = await executeValidate(options, context);

  if (!result.success) {
    logger.error(result.error.message);
    process.exit(ExitCode.FILE_SYSTEM_ERROR);
  }

  const { failed, files } = result.data;
  let hasErrors = failed > 0;

  // 결과 출력
  if (!options.quiet) {
    for (const file of files) {
      printFileResult(file, context.resolvedPath);
    }
    const versionNote = formatConstitutionVersionNote(files);
    if (versionNote) {
      logger.newline();
      console.log(chalk.cyan(versionNote));
    }
    logger.newline();
  }

  // 도메인 검증 (orphan-specs 옵션 또는 strict 모드에서)
  if (sddRoot && (options.orphanSpecs || options.strict)) {
    const domainResult = await executeDomainValidation(sddRoot, {
      orphanSpecs: options.orphanSpecs,
      strict: options.strict,
    });

    if (domainResult.success) {
      const domainValidation = domainResult.data;

      if (!options.quiet && domainValidation.issues.length > 0) {
        logger.newline();
        console.log(chalk.bold('도메인 검증 결과:'));
        console.log(formatValidationResult(domainValidation));
      }

      // 도메인 에러가 있으면 실패
      if (!domainValidation.valid && options.strict) {
        hasErrors = true;
      } else if (domainValidation.errors.length > 0) {
        hasErrors = true;
      }
    }
  }

  // 요약
  console.log(`Result: ${formatValidateSummary(result.data)}`);

  // 종료 코드
  if (hasErrors) {
    process.exit(ExitCode.VALIDATION_FAILED);
  }
}

/**
 * 파일 검증 결과 출력
 */
function printFileResult(result: FileValidationResult, basePath: string): void {
  const relativePath = path.relative(basePath, result.file);

  if (result.valid) {
    console.log(chalk.green('✓') + ' ' + relativePath);
  } else {
    console.log(chalk.red('✗') + ' ' + relativePath);

    for (const error of result.errors) {
      const line = error.location?.line ? `:${error.location.line}` : '';
      console.log(chalk.red(`  - ${error.message}${line}`));
    }
  }

  // 경고 출력
  for (const warning of result.warnings) {
    console.log(chalk.yellow(`  ⚠ ${warning.message}`));
  }

  // Constitution 버전 확인 결과 요약 (키워드 규칙 검사는 비활성화되어 버전만 확인)
  // Missing constitution_version is reported once for all files (formatConstitutionVersionNote)
  const cc = result.constitutionCheck;
  if (cc && !cc.specVersionMissing) {
    const vm = cc.versionMismatch;
    if (!cc.passed) {
      console.log(chalk.red(`  ✗ Constitution 버전 확인 실패 (v${cc.constitutionVersion})`));
    } else if (vm?.severity === 'info') {
      console.log(chalk.cyan(`  ℹ ${vm.message}`));
    } else if (!vm) {
      console.log(chalk.green(`  ✓ Constitution 버전 확인 통과 (v${cc.constitutionVersion})`));
    }
  }
}

/**
 * constitution_version이 없는 스펙에 대한 단일 안내 문구 (없으면 null)
 */
export function formatConstitutionVersionNote(files: FileValidationResult[]): string | null {
  const missing = files.filter((f) => f.constitutionCheck?.specVersionMissing);
  if (missing.length === 0) {
    return null;
  }
  const version = missing[0].constitutionCheck?.constitutionVersion;
  return `ℹ constitution_version이 없는 스펙 ${missing.length}개는 Constitution 버전 확인을 건너뛰었습니다 (현재 v${version})`;
}
