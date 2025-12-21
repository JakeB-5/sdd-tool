/**
 * 브랜치 관리
 */
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { Result } from '../../types/index.js';
import { SddError, ErrorCode, ExitCode } from '../../errors/index.js';
import { generateBranchName } from './schemas.js';

const execAsync = promisify(exec);

/**
 * 브랜치 에러
 */
export class BranchError extends SddError {
  constructor(message: string) {
    super(ErrorCode.UNKNOWN, message, ExitCode.GENERAL_ERROR);
    this.name = 'BranchError';
  }
}

/**
 * Git 설치 확인
 */
export async function isGitInstalled(): Promise<boolean> {
  try {
    await execAsync('git --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Git 저장소인지 확인
 */
export async function isGitRepository(cwd?: string): Promise<boolean> {
  try {
    await execAsync('git rev-parse --git-dir', { cwd });
    return true;
  } catch {
    return false;
  }
}

/**
 * 현재 브랜치 가져오기
 */
export async function getCurrentBranch(cwd?: string): Promise<Result<string, BranchError>> {
  try {
    const { stdout } = await execAsync('git branch --show-current', { cwd });
    return { success: true, data: stdout.trim() };
  } catch (error) {
    return {
      success: false,
      error: new BranchError(`현재 브랜치를 가져올 수 없습니다: ${error}`),
    };
  }
}

/**
 * 브랜치 존재 확인
 */
export async function branchExists(
  branchName: string,
  cwd?: string
): Promise<boolean> {
  try {
    await execAsync(`git show-ref --verify --quiet refs/heads/${branchName}`, { cwd });
    return true;
  } catch {
    return false;
  }
}

/**
 * 브랜치 생성
 */
export async function createBranch(
  featureId: string,
  options?: { checkout?: boolean; baseBranch?: string; cwd?: string }
): Promise<Result<string, BranchError>> {
  const branchName = generateBranchName(featureId);
  const checkout = options?.checkout ?? true;
  const cwd = options?.cwd;

  try {
    // Git 저장소 확인
    if (!(await isGitRepository(cwd))) {
      return {
        success: false,
        error: new BranchError('Git 저장소가 아닙니다'),
      };
    }

    // 브랜치 존재 확인
    if (await branchExists(branchName, cwd)) {
      return {
        success: false,
        error: new BranchError(`브랜치 '${branchName}'가 이미 존재합니다`),
      };
    }

    // 베이스 브랜치가 지정된 경우 먼저 체크아웃
    if (options?.baseBranch) {
      await execAsync(`git checkout ${options.baseBranch}`, { cwd });
    }

    // 브랜치 생성
    if (checkout) {
      await execAsync(`git checkout -b ${branchName}`, { cwd });
    } else {
      await execAsync(`git branch ${branchName}`, { cwd });
    }

    return { success: true, data: branchName };
  } catch (error) {
    return {
      success: false,
      error: new BranchError(`브랜치 생성 실패: ${error}`),
    };
  }
}

/**
 * 브랜치 체크아웃
 */
export async function checkoutBranch(
  branchName: string,
  cwd?: string
): Promise<Result<void, BranchError>> {
  try {
    await execAsync(`git checkout ${branchName}`, { cwd });
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: new BranchError(`브랜치 체크아웃 실패: ${error}`),
    };
  }
}

/**
 * 브랜치 삭제
 */
export async function deleteBranch(
  branchName: string,
  options?: { force?: boolean; cwd?: string }
): Promise<Result<void, BranchError>> {
  const force = options?.force ?? false;
  const cwd = options?.cwd;

  try {
    const flag = force ? '-D' : '-d';
    await execAsync(`git branch ${flag} ${branchName}`, { cwd });
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: new BranchError(`브랜치 삭제 실패: ${error}`),
    };
  }
}

/**
 * 기능 브랜치 목록
 */
export async function listFeatureBranches(
  cwd?: string
): Promise<Result<string[], BranchError>> {
  try {
    const { stdout } = await execAsync('git branch --list "feature/*"', { cwd });
    const branches = stdout
      .split('\n')
      .map(b => b.trim().replace(/^\*\s*/, ''))
      .filter(Boolean);
    return { success: true, data: branches };
  } catch (error) {
    return {
      success: false,
      error: new BranchError(`브랜치 목록 조회 실패: ${error}`),
    };
  }
}

/**
 * 변경사항 있는지 확인
 */
export async function hasUncommittedChanges(cwd?: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync('git status --porcelain', { cwd });
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * 브랜치 정보
 */
export interface BranchInfo {
  name: string;
  featureId: string;
  isCurrentBranch: boolean;
}

/**
 * 브랜치에서 기능 ID 추출
 */
export function extractFeatureId(branchName: string): string | null {
  const match = branchName.match(/^feature\/(.+)$/);
  return match ? match[1] : null;
}

/**
 * 기능 브랜치 상세 정보
 */
export async function getFeatureBranchInfo(
  cwd?: string
): Promise<Result<BranchInfo[], BranchError>> {
  const branchesResult = await listFeatureBranches(cwd);
  if (!branchesResult.success) {
    return branchesResult;
  }

  const currentResult = await getCurrentBranch(cwd);
  const currentBranch = currentResult.success ? currentResult.data : '';

  const info: BranchInfo[] = branchesResult.data.map(name => ({
    name,
    featureId: extractFeatureId(name) || name,
    isCurrentBranch: name === currentBranch,
  }));

  return { success: true, data: info };
}
