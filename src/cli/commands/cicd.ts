/**
 * sdd cicd 명령어
 *
 * CI/CD 파이프라인 통합을 설정합니다.
 */
import { Command } from 'commander';
import path from 'node:path';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';
import { findSddRoot, ensureDir, writeFile, fileExists, directoryExists } from '../../utils/fs.js';
import { validateSpecs } from '../../core/spec/validator.js';
import { getToolVersion } from '../../utils/version.js';

/**
 * 지원하는 CI 플랫폼
 */
export const CI_PLATFORMS = ['github', 'gitlab', 'all'] as const;
type CIPlatform = (typeof CI_PLATFORMS)[number];

/**
 * 지원하는 훅 유형
 */
export const HOOK_TYPES = ['pre-commit', 'pre-push', 'commit-msg'] as const;
type HookType = (typeof HOOK_TYPES)[number];

/**
 * CI 체크 결과
 */
export interface CiCheckResult {
  hasErrors: boolean;
  hasWarnings: boolean;
  specsPassed: number;
  specsFailed: number;
}

/**
 * cicd 명령어 등록
 */
export function registerCicdCommand(program: Command): void {
  const cicd = program
    .command('cicd')
    .description('CI/CD 파이프라인 통합 설정');

  // setup 서브커맨드 - CI 설정
  cicd
    .command('setup [platform]')
    .description(`CI 워크플로우 파일을 생성합니다 (${CI_PLATFORMS.join(', ')})`)
    .option('--strict', '엄격 모드 (경고도 에러로 처리)')
    .action(async (platform: string | undefined, options: { strict?: boolean }) => {
      try {
        const target = platform || 'github';
        if (!(CI_PLATFORMS as readonly string[]).includes(target)) {
          logger.error(`지원하지 않는 플랫폼입니다: ${target} (사용 가능: ${CI_PLATFORMS.join(', ')})`);
          process.exit(ExitCode.GENERAL_ERROR);
        }
        await runSetup(target as CIPlatform, options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // hooks 서브커맨드 - Git hooks 설정
  cicd
    .command('hooks [type]')
    .description('Git hooks를 설정합니다')
    .option('--install', 'husky 설치 포함')
    .action(async (type: string | undefined, options: { install?: boolean }) => {
      try {
        if (type && !(HOOK_TYPES as readonly string[]).includes(type)) {
          logger.error(`지원하지 않는 훅입니다: ${type} (사용 가능: ${HOOK_TYPES.join(', ')})`);
          process.exit(ExitCode.GENERAL_ERROR);
        }
        await runHooksSetup(type as HookType | undefined, options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // check 서브커맨드 - CI에서 사용할 검증
  cicd
    .command('check')
    .description('CI 환경에서 스펙 검증을 수행합니다')
    .option('--strict', '엄격 모드')
    .option('--fail-on-warning', '경고 시 실패')
    .action(async (options: { strict?: boolean; failOnWarning?: boolean }) => {
      try {
        const projectRoot = await findSddRoot();
        if (!projectRoot) {
          logger.error('SDD 프로젝트를 찾을 수 없습니다.');
          process.exit(ExitCode.GENERAL_ERROR);
        }
        const result = await executeCiCheck(projectRoot, options);
        if (result.hasErrors || (result.hasWarnings && options.failOnWarning)) {
          process.exit(ExitCode.VALIDATION_FAILED);
        }
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * CI 설정 실행
 */
async function runSetup(platform: CIPlatform, options: { strict?: boolean }): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  logger.info(`CI/CD 설정: ${platform}`);
  logger.newline();

  if (platform === 'github' || platform === 'all') {
    await setupGitHubActions(projectRoot, options.strict || false);
  }

  if (platform === 'gitlab' || platform === 'all') {
    await setupGitLabCI(projectRoot, options.strict || false);
  }

  logger.newline();
  logger.success('CI/CD 설정이 완료되었습니다!');
  logger.newline();
  logger.info('다음 단계:');
  logger.listItem('변경사항을 커밋하세요');
  logger.listItem('PR/MR 생성 시 자동으로 스펙 검증이 실행됩니다');
}

/**
 * GitHub Actions 설정
 */
async function setupGitHubActions(projectRoot: string, strict: boolean): Promise<void> {
  const workflowDir = path.join(projectRoot, '.github', 'workflows');
  await ensureDir(workflowDir);

  // 검증 워크플로우
  const validateContent = generateGitHubWorkflow(strict);
  const validatePath = path.join(workflowDir, 'sdd-validate.yml');
  await writeFile(validatePath, validateContent);
  logger.info(`✅ GitHub Actions 워크플로우 생성: .github/workflows/sdd-validate.yml`);

  // 라벨러 워크플로우
  const labelerContent = generateGitHubLabeler();
  const labelerPath = path.join(workflowDir, 'sdd-labeler.yml');
  await writeFile(labelerPath, labelerContent);
  logger.info(`✅ GitHub Actions 라벨러 생성: .github/workflows/sdd-labeler.yml`);
}

/**
 * GitLab CI 설정
 */
async function setupGitLabCI(projectRoot: string, strict: boolean): Promise<void> {
  const ciContent = generateGitLabCI(strict);
  const ciPath = path.join(projectRoot, '.gitlab-ci-sdd.yml');

  await writeFile(ciPath, ciContent);
  logger.info(`✅ GitLab CI 구성 생성: .gitlab-ci-sdd.yml`);
  logger.info('   (기존 .gitlab-ci.yml에 include하거나 병합하세요)');
}

/**
 * GitHub Actions 워크플로우 생성
 */
export function generateGitHubWorkflow(strict: boolean): string {
  const strictFlag = strict ? ' --strict' : '';
  // Pinned to the generating tool's version so CI results are reproducible
  const installSpec = `sdd-tool@${getToolVersion()}`;

  return `# SDD 스펙 검증 워크플로우
# 이 파일은 sdd cicd setup으로 생성되었습니다.

name: SDD Validation

on:
  push:
    branches: [main, master, develop]
    paths:
      - '.sdd/**'
  pull_request:
    branches: [main, master, develop]
    paths:
      - '.sdd/**'

jobs:
  validate:
    name: Validate Specs
    runs-on: ubuntu-latest
    permissions:
      contents: read

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # Only the global CLI is needed; project dependencies (and a lockfile) are not required
      - name: Install SDD Tool
        run: npm install -g ${installSpec}

      - name: Validate specifications
        run: sdd validate${strictFlag}

      - name: Check constitution
        run: sdd constitution validate

      - name: Generate impact report
        run: sdd impact report --json > impact-report.json

      - name: Upload impact report
        uses: actions/upload-artifact@v4
        with:
          name: impact-report
          path: impact-report.json
`;
}

/**
 * GitHub Actions 라벨러 생성
 */
export function generateGitHubLabeler(): string {
  return `# SDD PR 라벨러 워크플로우
# 변경된 도메인에 따라 자동으로 라벨을 추가합니다

name: SDD Labeler

on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - '.sdd/**'

jobs:
  label:
    name: Add Labels
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Detect Changes
        id: changes
        env:
          BASE_REF: \${{ github.base_ref }}
        run: |
          CHANGED_FILES=$(git diff --name-only "origin/$BASE_REF")

          # 변경된 도메인 감지 (일치하는 파일이 없어도 단계가 실패하지 않도록 grep 종료 코드를 무시)
          DOMAINS=$(printf '%s\\n' "$CHANGED_FILES" | \\
            { grep "^\\.sdd/specs/" || true; } | \\
            cut -d'/' -f3 | \\
            sort -u | \\
            tr '\\n' ' ')
          echo "domains=$DOMAINS" >> $GITHUB_OUTPUT

          # Constitution 변경 감지
          # (case 사용: grep -q가 일찍 종료하면 pipefail 아래에서 SIGPIPE로 오탐이 발생함)
          case "$CHANGED_FILES" in
            *constitution.md*) echo "constitution=true" >> $GITHUB_OUTPUT ;;
            *) echo "constitution=false" >> $GITHUB_OUTPUT ;;
          esac

      - name: Apply Labels
        uses: actions/github-script@v7
        env:
          DOMAINS: \${{ steps.changes.outputs.domains }}
          CONSTITUTION: \${{ steps.changes.outputs.constitution }}
        with:
          script: |
            const labels = [];
            const domains = (process.env.DOMAINS || '').trim().split(' ').filter(Boolean);
            labels.push(...domains.map(d => \`spec:\${d}\`));

            if (process.env.CONSTITUTION === 'true') {
              labels.push('constitution');
            }

            if (labels.length > 0) {
              await github.rest.issues.addLabels({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                labels: labels,
              });
            }
`;
}

/**
 * GitLab CI 구성 생성
 */
export function generateGitLabCI(strict: boolean): string {
  const strictFlag = strict ? ' --strict' : '';
  const installSpec = `sdd-tool@${getToolVersion()}`;

  return `# SDD 스펙 검증 파이프라인
# 이 파일은 sdd cicd setup으로 생성되었습니다.
# 기존 .gitlab-ci.yml에 include하거나 내용을 병합하세요.

sdd:validate:
  stage: test
  image: node:20
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - .sdd/**/*
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      changes:
        - .sdd/**/*
  before_script:
    - npm install -g ${installSpec}
  script:
    - sdd validate${strictFlag}
    - sdd constitution validate
    - sdd impact report --json > impact-report.json
  artifacts:
    paths:
      - impact-report.json
    expire_in: 1 week
`;
}

/**
 * Git hooks 설정 실행
 */
async function runHooksSetup(type: HookType | undefined, options: { install?: boolean }): Promise<void> {
  const projectRoot = await findSddRoot();
  if (!projectRoot) {
    logger.error('SDD 프로젝트를 찾을 수 없습니다. `sdd init`을 먼저 실행하세요.');
    process.exit(ExitCode.GENERAL_ERROR);
  }

  const hooksDir = path.join(projectRoot, '.husky');

  if (options.install) {
    logger.info('husky 설치 방법:');
    logger.newline();
    logger.listItem('npm install -D husky');
    logger.listItem('npx husky init');
    logger.newline();
  }

  // hooks 디렉토리가 없으면 생성
  if (!(await directoryExists(hooksDir))) {
    await ensureDir(hooksDir);
  }

  const hooks: HookType[] = type ? [type] : ['pre-commit', 'pre-push'];

  for (const hook of hooks) {
    const hookContent = generateHookScript(hook);
    const hookPath = path.join(hooksDir, hook);
    await writeFile(hookPath, hookContent);
    logger.info(`✅ ${hook} 훅 생성: .husky/${hook}`);
  }

  logger.newline();
  logger.info('훅이 설정되었습니다.');
  logger.newline();
  logger.info('husky가 설치되어 있다면 훅이 자동으로 실행됩니다.');
  logger.info('그렇지 않으면 다음 명령어로 설치하세요:');
  logger.listItem('npm install -D husky && npx husky init');
}

/**
 * Git hook 스크립트 생성
 */
export function generateHookScript(hook: HookType): string {
  switch (hook) {
    case 'pre-commit':
      return `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# SDD 스펙 검증
echo "🔍 Validating SDD specs..."
npx sdd validate

if [ $? -ne 0 ]; then
  echo "❌ SDD validation failed. Please fix the issues before committing."
  exit 1
fi

echo "✅ SDD validation passed."
`;

    case 'pre-push':
      return `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# SDD 스펙 검증 (strict mode)
echo "🔍 Validating SDD specs (strict mode)..."
npx sdd validate --strict

if [ $? -ne 0 ]; then
  echo "❌ SDD validation failed. Please fix all issues before pushing."
  exit 1
fi

# Constitution 검증
echo "📜 Validating constitution..."
npx sdd constitution validate

if [ $? -ne 0 ]; then
  echo "❌ Constitution validation failed."
  exit 1
fi

echo "✅ All validations passed."
`;

    case 'commit-msg':
      return `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 커밋 메시지에서 스펙 참조 확인 (선택적)
COMMIT_MSG=$(cat "$1")

# spec: 또는 feat(spec-id): 형식 확인
if echo "$COMMIT_MSG" | grep -qE "^(feat|fix|docs|chore)\\([a-z-]+\\):"; then
  echo "✅ Commit message format is valid."
else
  echo "⚠️  Commit message doesn't reference a spec."
  echo "   Consider using: feat(<spec-id>): <message>"
fi
`;

    default:
      return '#!/bin/sh\nexit 0\n';
  }
}

/**
 * CI 체크 실행 (테스트 가능, 종료 코드는 호출자가 결정)
 */
export async function executeCiCheck(
  projectRoot: string,
  options: { strict?: boolean; failOnWarning?: boolean }
): Promise<CiCheckResult> {
  logger.info('🔍 CI 검증 시작...');
  logger.newline();

  let hasErrors = false;
  let hasWarnings = false;

  // 1. Constitution 검증
  logger.info('1. Constitution 검증...');
  const constitutionPath = path.join(projectRoot, '.sdd', 'constitution.md');
  if (await fileExists(constitutionPath)) {
    logger.info('   ✅ constitution.md 존재');
  } else {
    logger.warn('   ⚠️  constitution.md 없음');
    hasWarnings = true;
  }

  // 2. 스펙 디렉토리 확인
  logger.info('2. 스펙 디렉토리 확인...');
  const specsPath = path.join(projectRoot, '.sdd', 'specs');
  if (await directoryExists(specsPath)) {
    logger.info('   ✅ specs/ 디렉토리 존재');
  } else {
    logger.warn('   ⚠️  specs/ 디렉토리 없음');
    hasWarnings = true;
  }

  // 3. 기본 구조 확인
  logger.info('3. 기본 구조 확인...');
  const requiredDirs = ['changes', 'archive', 'templates'];
  for (const dir of requiredDirs) {
    const dirPath = path.join(projectRoot, '.sdd', dir);
    if (await directoryExists(dirPath)) {
      logger.info(`   ✅ ${dir}/ 존재`);
    } else {
      if (options.strict) {
        logger.error(`   ❌ ${dir}/ 없음`);
        hasErrors = true;
      } else {
        logger.warn(`   ⚠️  ${dir}/ 없음`);
        hasWarnings = true;
      }
    }
  }

  // 4. 스펙 검증
  logger.info('4. 스펙 검증...');
  let specsPassed = 0;
  let specsFailed = 0;
  if (await directoryExists(specsPath)) {
    const validation = await validateSpecs(specsPath, {
      strict: options.strict,
      checkConstitution: await fileExists(constitutionPath),
      sddRoot: projectRoot,
    });
    if (validation.success) {
      specsPassed = validation.data.passed;
      specsFailed = validation.data.failed;
      for (const file of validation.data.files) {
        const relativePath = path.relative(specsPath, file.file);
        if (!file.valid) {
          logger.error(`   ❌ ${relativePath}`);
          for (const err of file.errors) {
            logger.error(`      - ${err.message}`);
          }
        }
      }
      if (specsFailed > 0) {
        hasErrors = true;
      }
      if (validation.data.warnings > 0) {
        hasWarnings = true;
      }
      logger.info(`   스펙 ${specsPassed}개 통과, ${specsFailed}개 실패, 경고 ${validation.data.warnings}개`);
    } else {
      logger.error(`   ❌ 스펙 검증 실패: ${validation.error.message}`);
      hasErrors = true;
    }
  } else {
    logger.info('   검증할 스펙이 없습니다');
  }

  logger.newline();

  // 결과 출력
  if (hasErrors) {
    logger.error('❌ CI 검증 실패');
  } else if (hasWarnings && options.failOnWarning) {
    logger.warn('⚠️  경고가 있습니다 (--fail-on-warning)');
  } else if (hasWarnings) {
    logger.warn('⚠️  경고가 있지만 검증은 통과했습니다');
  } else {
    logger.success('✅ CI 검증 통과');
  }

  return { hasErrors, hasWarnings, specsPassed, specsFailed };
}
