/**
 * sdd git 명령어
 * Git 워크플로우 설정 (hooks, templates)
 */
import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ensureDir, writeFile, fileExists } from '../../utils/fs.js';
import { ExitCode } from '../../errors/index.js';
import * as logger from '../../utils/logger.js';
import { Result, success, failure } from '../../types/index.js';

const execFileAsync = promisify(execFile);

/**
 * Git Hooks 설치 결과
 */
export interface HooksInstallResult {
  installed: string[];
  skipped: string[];
  backedUp: string[];
}

/**
 * Git Template 설치 결과
 */
export interface TemplateInstallResult {
  installed: string[];
  configured: boolean;
}

/**
 * pre-commit 훅 스크립트 생성
 */
export function generatePreCommitHook(): string {
  return `#!/bin/sh
# SDD pre-commit hook
# 변경된 스펙 파일을 검증합니다

# 색상 정의
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# 변경된 스펙 파일 확인
CHANGED_SPECS=$(git diff --cached --name-only | grep "^\\.sdd/specs/")

if [ -n "$CHANGED_SPECS" ]; then
  printf "\${YELLOW}🔍 스펙 검증 중...\${NC}\\n"

  # sdd validate 실행
  if command -v sdd >/dev/null 2>&1; then
    sdd validate
    if [ $? -ne 0 ]; then
      printf "\${RED}❌ 스펙 검증 실패. 커밋이 취소됩니다.\${NC}\\n"
      echo "오류를 수정하고 다시 시도하세요."
      exit 1
    fi
    printf "\${GREEN}✅ 스펙 검증 통과\${NC}\\n"
  else
    printf "\${YELLOW}⚠️  sdd 명령어를 찾을 수 없습니다. 검증을 건너뜁니다.\${NC}\\n"
  fi
fi

exit 0
`;
}

/**
 * commit-msg 훅 스크립트 생성
 */
export function generateCommitMsgHook(): string {
  return `#!/bin/sh
# SDD commit-msg hook
# 커밋 메시지 형식을 검증합니다

# 색상 정의
RED='\\033[0;31m'
GREEN='\\033[0;32m'
NC='\\033[0m'

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# 빈 줄과 주석 제거
COMMIT_MSG_CLEAN=$(printf '%s\\n' "$COMMIT_MSG" | grep -v "^#" | grep -v "^$" | head -1)

# 스펙 커밋 패턴
SPEC_PATTERN="^(spec|spec-update|spec-status|plan|tasks|constitution|sdd-config)(\\(.+\\))?: .+"

# 일반 커밋 패턴 (Conventional Commits)
GENERAL_PATTERN="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\\(.+\\))?: .+"

# 머지 커밋 패턴
MERGE_PATTERN="^Merge "

# 리버트 커밋 패턴
REVERT_PATTERN="^Revert "

# 패턴 검사
if printf '%s\\n' "$COMMIT_MSG_CLEAN" | grep -qE "$SPEC_PATTERN"; then
  printf "\${GREEN}✅ 스펙 커밋 형식 확인됨\${NC}\\n"
  exit 0
elif printf '%s\\n' "$COMMIT_MSG_CLEAN" | grep -qE "$GENERAL_PATTERN"; then
  printf "\${GREEN}✅ Conventional Commit 형식 확인됨\${NC}\\n"
  exit 0
elif printf '%s\\n' "$COMMIT_MSG_CLEAN" | grep -qE "$MERGE_PATTERN"; then
  exit 0
elif printf '%s\\n' "$COMMIT_MSG_CLEAN" | grep -qE "$REVERT_PATTERN"; then
  exit 0
else
  printf "\${RED}❌ 커밋 메시지 형식 오류\${NC}\\n"
  echo ""
  echo "올바른 형식:"
  echo "  스펙 커밋: spec(<scope>): <message>"
  echo "  일반 커밋: feat(<scope>): <message>"
  echo ""
  echo "스펙 타입: spec, spec-update, spec-status, plan, tasks, constitution, sdd-config"
  echo "일반 타입: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert"
  echo ""
  echo "자세한 내용: https://jakeb-5.github.io/sdd-tool/ko/guide/commit-convention"
  exit 1
fi
`;
}

/**
 * pre-push 훅 스크립트 생성
 */
export function generatePrePushHook(): string {
  return `#!/bin/sh
# SDD pre-push hook
# 푸시 전 전체 검증을 수행합니다

# 색상 정의
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m'

printf "\${YELLOW}🔍 푸시 전 검증 중...\${NC}\\n"

# sdd 명령어 확인
if ! command -v sdd >/dev/null 2>&1; then
  printf "\${YELLOW}⚠️  sdd 명령어를 찾을 수 없습니다. 검증을 건너뜁니다.\${NC}\\n"
  exit 0
fi

# 전체 스펙 검증
echo "스펙 검증 중..."
sdd validate
if [ $? -ne 0 ]; then
  printf "\${RED}❌ 스펙 검증 실패. 푸시가 취소됩니다.\${NC}\\n"
  exit 1
fi

# Constitution 정합성 확인
echo "Constitution 정합성 확인 중..."
sdd validate --constitution 2>/dev/null
if [ $? -ne 0 ]; then
  printf "\${YELLOW}⚠️  Constitution 검증 경고 (계속 진행)\${NC}\\n"
fi

printf "\${GREEN}✅ 검증 완료\${NC}\\n"
exit 0
`;
}

/**
 * .gitmessage 템플릿 내용 생성
 */
export function generateGitMessageTemplate(): string {
  return `# <type>(<scope>): <subject>
# |<----  50자 이내로 작성하세요  ---->|
#
# 스펙 타입: spec, spec-update, spec-status, plan, tasks, constitution, sdd-config
# 일반 타입: feat, fix, docs, style, refactor, test, chore
#
# 스코프 예시:
#   spec(auth): ...              - 도메인 전체
#   spec(auth/user-login): ...   - 특정 스펙
#   spec(auth,billing): ...      - 다중 도메인
#   constitution: ...            - 스코프 없음

# 본문 (선택사항, 72자 줄바꿈)
# |<----  72자 이내로 작성하세요  ---->|

# Footer (선택사항)
# Refs: #이슈번호
# Breaking-Spec: 영향받는-스펙
# Depends-On: 의존-스펙
# Reviewed-By: @리뷰어
`;
}

/**
 * Git hooks 제거 결과
 */
export interface HooksUninstallResult {
  removed: string[];
  skipped: string[];
}

/**
 * realpath that tolerates missing paths (e.g. a hooks dir not yet created).
 */
async function realpathOrResolve(target: string): Promise<string> {
  try {
    return await fs.realpath(target);
  } catch {
    try {
      return path.join(await fs.realpath(path.dirname(target)), path.basename(target));
    } catch {
      return path.resolve(target);
    }
  }
}

function isPathInside(child: string, parent: string): boolean {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * Resolve the hooks directory via git so worktrees work.
 * Refuses hooks dirs outside the repository (e.g. a global core.hooksPath),
 * since writing there would affect other repositories.
 */
async function resolveHooksDir(projectPath: string): Promise<Result<string, Error>> {
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync(
      'git',
      ['rev-parse', '--show-toplevel', '--git-common-dir', '--git-path', 'hooks'],
      { cwd: projectPath }
    ));
  } catch {
    return failure(new Error('Git 저장소가 아닙니다. 먼저 git init을 실행하세요.'));
  }

  const [toplevel, commonDir, hooksDir] = stdout.trim().split('\n').map((line) => line.trim());
  if (!toplevel || !commonDir || !hooksDir) {
    return failure(new Error('Git 저장소가 아닙니다. 먼저 git init을 실행하세요.'));
  }

  const base = await realpathOrResolve(projectPath);
  const realToplevel = await realpathOrResolve(path.resolve(base, toplevel));
  const realCommonDir = await realpathOrResolve(path.resolve(base, commonDir));
  const realHooksDir = await realpathOrResolve(path.resolve(base, hooksDir));

  if (!isPathInside(realHooksDir, realToplevel) && !isPathInside(realHooksDir, realCommonDir)) {
    return failure(
      new Error(
        `hooks 디렉토리가 저장소 밖에 있습니다: ${realHooksDir}\n` +
          'core.hooksPath 설정(전역 설정 포함)이 저장소 외부를 가리키고 있어, 설치 시 다른 저장소에도 영향을 줄 수 있습니다. ' +
          '`git config --show-origin core.hooksPath`로 설정을 확인한 뒤 해제하거나 저장소 내부 경로로 변경하세요.'
      )
    );
  }

  return success(realHooksDir);
}

/**
 * Git hooks 설치
 */
export async function installHooks(
  projectPath: string,
  options: { force?: boolean } = {}
): Promise<Result<HooksInstallResult, Error>> {
  const hooksResult = await resolveHooksDir(projectPath);
  if (!hooksResult.success) {
    return failure(hooksResult.error);
  }
  const hooksPath = hooksResult.data;

  // hooks 디렉토리 생성
  await ensureDir(hooksPath);

  const hooks = [
    { name: 'pre-commit', content: generatePreCommitHook() },
    { name: 'commit-msg', content: generateCommitMsgHook() },
    { name: 'pre-push', content: generatePrePushHook() },
  ];

  const result: HooksInstallResult = {
    installed: [],
    skipped: [],
    backedUp: [],
  };

  for (const hook of hooks) {
    const hookPath = path.join(hooksPath, hook.name);
    const backupPath = path.join(hooksPath, `${hook.name}.backup`);

    // 기존 훅 확인
    if (await fileExists(hookPath)) {
      if (!options.force) {
        result.skipped.push(hook.name);
        continue;
      }

      // 백업 (이미 SDD 훅이면 사용자 원본 백업을 덮어쓰지 않도록 건너뜀)
      try {
        const existingContent = await fs.readFile(hookPath, 'utf-8');
        if (!existingContent.includes(`# SDD ${hook.name} hook`)) {
          await fs.writeFile(backupPath, existingContent);
          result.backedUp.push(hook.name);
        }
      } catch {
        // 백업 실패해도 계속 진행
      }
    }

    // 훅 설치
    await fs.writeFile(hookPath, hook.content, { mode: 0o755 });
    result.installed.push(hook.name);
  }

  return success(result);
}

/**
 * Git hooks 제거
 */
export async function uninstallHooks(
  projectPath: string
): Promise<Result<HooksUninstallResult, Error>> {
  const hooksResult = await resolveHooksDir(projectPath);
  if (!hooksResult.success) {
    return failure(hooksResult.error);
  }
  const hooksPath = hooksResult.data;

  const hookNames = ['pre-commit', 'commit-msg', 'pre-push'];
  const removed: string[] = [];
  const skipped: string[] = [];

  for (const name of hookNames) {
    const hookPath = path.join(hooksPath, name);
    const backupPath = path.join(hooksPath, `${name}.backup`);

    try {
      // 훅 삭제 (SDD가 설치한 훅만)
      if (await fileExists(hookPath)) {
        const content = await fs.readFile(hookPath, 'utf-8');
        if (!content.includes(`# SDD ${name} hook`)) {
          skipped.push(name);
          continue;
        }
        await fs.unlink(hookPath);
        removed.push(name);
      }

      // 백업 복원
      if (await fileExists(backupPath)) {
        await fs.rename(backupPath, hookPath);
      }
    } catch {
      // 삭제 실패해도 계속 진행
    }
  }

  return success({ removed, skipped });
}

/**
 * Git 템플릿 설치
 */
export async function installTemplate(
  projectPath: string
): Promise<Result<TemplateInstallResult, Error>> {
  const templatePath = path.join(projectPath, '.gitmessage');

  // 템플릿 파일 생성
  await writeFile(templatePath, generateGitMessageTemplate());

  // git config 설정
  let configured = false;
  try {
    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);

    await execAsync(`git config commit.template .gitmessage`, { cwd: projectPath });
    configured = true;
  } catch {
    // config 설정 실패
  }

  return success({
    installed: ['.gitmessage'],
    configured,
  });
}

/**
 * Git 전체 설정 (hooks + template)
 */
export async function setupGit(
  projectPath: string,
  options: { force?: boolean } = {}
): Promise<Result<{ hooks: HooksInstallResult; template: TemplateInstallResult }, Error>> {
  const hooksResult = await installHooks(projectPath, options);
  if (!hooksResult.success) {
    return failure(hooksResult.error);
  }

  const templateResult = await installTemplate(projectPath);
  if (!templateResult.success) {
    return failure(templateResult.error);
  }

  return success({
    hooks: hooksResult.data,
    template: templateResult.data,
  });
}

/**
 * git 명령어 등록
 */
export function registerGitCommand(program: Command): void {
  const git = program
    .command('git')
    .description('Git 워크플로우 설정 (hooks, templates)');

  // sdd git hooks install
  git
    .command('hooks')
    .description('Git hooks 관리')
    .argument('<action>', 'install 또는 uninstall')
    .option('-f, --force', '기존 훅 덮어쓰기')
    .action(async (action: string, options: { force?: boolean }) => {
      try {
        const cwd = process.cwd();

        if (action === 'install') {
          logger.info('Git hooks를 설치합니다...');

          const result = await installHooks(cwd, options);
          if (!result.success) {
            logger.error(result.error.message);
            process.exit(ExitCode.GENERAL_ERROR);
          }

          const { installed, skipped, backedUp } = result.data;

          if (installed.length > 0) {
            logger.success(`설치됨: ${installed.join(', ')}`);
          }
          if (backedUp.length > 0) {
            logger.info(`백업됨: ${backedUp.join(', ')}`);
          }
          if (skipped.length > 0) {
            logger.warn(`건너뜀 (이미 존재): ${skipped.join(', ')}`);
            logger.info('덮어쓰려면 --force 옵션을 사용하세요.');
          }

          logger.newline();
          logger.info('설치된 훅:');
          logger.listItem('pre-commit: 스펙 검증');
          logger.listItem('commit-msg: 커밋 메시지 형식 검증');
          logger.listItem('pre-push: 푸시 전 전체 검증');
        } else if (action === 'uninstall') {
          logger.info('Git hooks를 제거합니다...');

          const result = await uninstallHooks(cwd);
          if (!result.success) {
            logger.error(result.error.message);
            process.exit(ExitCode.GENERAL_ERROR);
          }

          const { removed, skipped } = result.data;

          if (removed.length > 0) {
            logger.success(`제거됨: ${removed.join(', ')}`);
          } else if (skipped.length === 0) {
            logger.info('제거할 훅이 없습니다.');
          }
          if (skipped.length > 0) {
            logger.warn(`건너뜀 (SDD가 설치한 훅이 아님): ${skipped.join(', ')}`);
          }
        } else {
          logger.error(`알 수 없는 액션: ${action}`);
          logger.info('사용법: sdd git hooks install|uninstall');
          process.exit(ExitCode.GENERAL_ERROR);
        }
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // sdd git template install
  git
    .command('template')
    .description('커밋 메시지 템플릿 설치')
    .argument('<action>', 'install')
    .action(async (action: string) => {
      try {
        if (action !== 'install') {
          logger.error(`알 수 없는 액션: ${action}`);
          logger.info('사용법: sdd git template install');
          process.exit(ExitCode.GENERAL_ERROR);
        }

        const cwd = process.cwd();
        logger.info('커밋 메시지 템플릿을 설치합니다...');

        const result = await installTemplate(cwd);
        if (!result.success) {
          logger.error(result.error.message);
          process.exit(ExitCode.GENERAL_ERROR);
        }

        logger.success('.gitmessage 파일이 생성되었습니다.');
        if (result.data.configured) {
          logger.success('git config commit.template이 설정되었습니다.');
        } else {
          logger.warn('git config 설정에 실패했습니다.');
          logger.info('수동 설정: git config commit.template .gitmessage');
        }
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });

  // sdd git setup (전체 설정)
  git
    .command('setup')
    .description('Git 워크플로우 전체 설정 (hooks + template)')
    .option('-f, --force', '기존 설정 덮어쓰기')
    .action(async (options: { force?: boolean }) => {
      try {
        const cwd = process.cwd();
        logger.info('Git 워크플로우를 설정합니다...');

        const result = await setupGit(cwd, options);
        if (!result.success) {
          logger.error(result.error.message);
          process.exit(ExitCode.GENERAL_ERROR);
        }

        logger.newline();
        logger.success('Git 워크플로우 설정 완료!');
        logger.newline();
        logger.info('설치된 구성:');
        logger.listItem('Git Hooks: pre-commit, commit-msg, pre-push');
        logger.listItem('.gitmessage: 커밋 메시지 템플릿');
        logger.newline();
        logger.info('다음 단계:');
        logger.listItem('spec/domain/feature 형식으로 브랜치 생성');
        logger.listItem('커밋 시 자동으로 형식 검증');
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}
