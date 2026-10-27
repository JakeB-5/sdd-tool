/**
 * Git Diff 실행기
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { success, failure, Result } from '../../types/index.js';
import { SddError, ErrorCode, ExitCode } from '../../errors/index.js';

const execFileAsync = promisify(execFile);

/**
 * Git diff 에러
 */
export class GitDiffError extends SddError {
  constructor(message: string) {
    super(ErrorCode.UNKNOWN, message, ExitCode.GENERAL_ERROR);
    this.name = 'GitDiffError';
  }
}

/**
 * Reject refs that git would parse as options (e.g. `--output=<file>`).
 */
function isUnsafeRef(ref: string | undefined): boolean {
  return ref !== undefined && ref.startsWith('-');
}

export interface GitDiffFile {
  path: string;
  status: 'added' | 'modified' | 'deleted';
  oldContent?: string;
  newContent?: string;
}

export interface GitDiffOptions {
  staged?: boolean;
  commit1?: string;
  commit2?: string;
  specPath?: string;
}

export class GitDiff {
  constructor(private projectRoot: string) {}

  /**
   * Git diff 실행하여 변경된 스펙 파일 목록 조회
   */
  async getChangedSpecFiles(
    options: GitDiffOptions = {}
  ): Promise<Result<GitDiffFile[], GitDiffError>> {
    const specsDir = path.join(this.projectRoot, '.sdd', 'specs');
    const specPath = options.specPath
      ? path.join(specsDir, options.specPath)
      : specsDir;

    // Windows 경로를 forward slash로 변환 (git은 forward slash 사용)
    const normalizedPath = specPath.replace(/\\/g, '/');

    if (isUnsafeRef(options.commit1) || isUnsafeRef(options.commit2)) {
      return failure(new GitDiffError('잘못된 커밋 참조입니다 (\'-\'로 시작할 수 없음)'));
    }

    try {
      const args = ['-c', 'core.quotepath=false', 'diff', '--name-status'];

      if (options.commit1 && options.commit2) {
        // 두 커밋 간 비교
        args.push(options.commit1, options.commit2);
      } else if (options.commit1) {
        // 특정 커밋과 현재 비교
        args.push(options.commit1);
      } else if (options.staged) {
        // 스테이징된 변경
        args.push('--cached');
      }
      // 그 외: 작업 디렉토리 변경
      args.push('--', normalizedPath);

      const { stdout } = await execFileAsync('git', args, { cwd: this.projectRoot });

      if (!stdout.trim()) {
        return success([]);
      }

      const files: GitDiffFile[] = [];

      for (const line of stdout.trim().split('\n')) {
        const [status, filePath] = line.split('\t');

        if (!filePath || !filePath.endsWith('.md')) continue;

        files.push({
          path: filePath,
          status: this.parseStatus(status),
        });
      }

      return success(files);
    } catch (error) {
      const stderr = (error as { stderr?: string }).stderr?.trim();
      const message = stderr || (error instanceof Error ? error.message : String(error));
      return failure(new GitDiffError(`git diff 실행 실패: ${message}`));
    }
  }

  /**
   * 파일의 이전/이후 내용 조회
   */
  async getFileContents(
    filePath: string,
    options: GitDiffOptions = {}
  ): Promise<{ before?: string; after?: string }> {
    const normalizedPath = filePath.replace(/\\/g, '/');

    if (isUnsafeRef(options.commit1) || isUnsafeRef(options.commit2)) {
      return {};
    }

    try {
      let before: string | undefined;
      let after: string | undefined;

      // 이전 내용 조회
      if (options.commit1) {
        try {
          const { stdout } = await execFileAsync(
            'git',
            ['show', `${options.commit1}:${normalizedPath}`],
            { cwd: this.projectRoot }
          );
          before = stdout;
        } catch {
          // 파일이 해당 커밋에 없으면 undefined
        }
      } else if (options.staged) {
        // 스테이징 전 내용 (HEAD)
        try {
          const { stdout } = await execFileAsync('git', ['show', `HEAD:${normalizedPath}`], {
            cwd: this.projectRoot,
          });
          before = stdout;
        } catch {
          // 새 파일
        }
      } else {
        // 마지막 커밋 내용
        try {
          const { stdout } = await execFileAsync('git', ['show', `HEAD:${normalizedPath}`], {
            cwd: this.projectRoot,
          });
          before = stdout;
        } catch {
          // 새 파일
        }
      }

      // 이후 내용 조회
      if (options.commit2) {
        try {
          const { stdout } = await execFileAsync(
            'git',
            ['show', `${options.commit2}:${normalizedPath}`],
            { cwd: this.projectRoot }
          );
          after = stdout;
        } catch {
          // 파일이 삭제됨
        }
      } else if (options.staged) {
        // 스테이징된 내용
        try {
          const { stdout } = await execFileAsync('git', ['show', `:0:${normalizedPath}`], {
            cwd: this.projectRoot,
          });
          after = stdout;
        } catch {
          // 삭제됨
        }
      } else {
        // 현재 작업 디렉토리 내용
        try {
          const fs = await import('node:fs/promises');
          const absolutePath = path.join(this.projectRoot, filePath);
          after = await fs.readFile(absolutePath, 'utf-8');
        } catch {
          // 삭제됨
        }
      }

      return { before, after };
    } catch {
      return {};
    }
  }

  /**
   * Git 상태 문자를 ChangeType으로 변환
   */
  private parseStatus(status: string): 'added' | 'modified' | 'deleted' {
    switch (status.charAt(0).toUpperCase()) {
      case 'A':
        return 'added';
      case 'D':
        return 'deleted';
      case 'M':
      case 'R':
      case 'C':
      default:
        return 'modified';
    }
  }

  /**
   * Git 저장소 여부 확인
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await execFileAsync('git', ['rev-parse', '--git-dir'], { cwd: this.projectRoot });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 현재 브랜치 이름 조회
   */
  async getCurrentBranch(): Promise<string | null> {
    try {
      const { stdout } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
        cwd: this.projectRoot,
      });
      return stdout.trim();
    } catch {
      return null;
    }
  }
}
