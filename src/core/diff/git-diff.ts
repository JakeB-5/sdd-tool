/**
 * Git Diff 실행기
 */
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execAsync = promisify(exec);

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
  async getChangedSpecFiles(options: GitDiffOptions = {}): Promise<GitDiffFile[]> {
    const specsDir = path.join(this.projectRoot, '.sdd', 'specs');
    const specPath = options.specPath
      ? path.join(specsDir, options.specPath)
      : specsDir;

    // Windows 경로를 forward slash로 변환 (git은 forward slash 사용)
    const normalizedPath = specPath.replace(/\\/g, '/');

    try {
      let diffCommand: string;

      if (options.commit1 && options.commit2) {
        // 두 커밋 간 비교
        diffCommand = `git diff --name-status ${options.commit1} ${options.commit2} -- "${normalizedPath}"`;
      } else if (options.commit1) {
        // 특정 커밋과 현재 비교
        diffCommand = `git diff --name-status ${options.commit1} -- "${normalizedPath}"`;
      } else if (options.staged) {
        // 스테이징된 변경
        diffCommand = `git diff --name-status --cached -- "${normalizedPath}"`;
      } else {
        // 작업 디렉토리 변경
        diffCommand = `git diff --name-status -- "${normalizedPath}"`;
      }

      const { stdout } = await execAsync(diffCommand, { cwd: this.projectRoot });

      if (!stdout.trim()) {
        return [];
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

      return files;
    } catch {
      return [];
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

    try {
      let before: string | undefined;
      let after: string | undefined;

      // 이전 내용 조회
      if (options.commit1) {
        try {
          const { stdout } = await execAsync(
            `git show ${options.commit1}:"${normalizedPath}"`,
            { cwd: this.projectRoot }
          );
          before = stdout;
        } catch {
          // 파일이 해당 커밋에 없으면 undefined
        }
      } else if (options.staged) {
        // 스테이징 전 내용 (HEAD)
        try {
          const { stdout } = await execAsync(`git show HEAD:"${normalizedPath}"`, {
            cwd: this.projectRoot,
          });
          before = stdout;
        } catch {
          // 새 파일
        }
      } else {
        // 마지막 커밋 내용
        try {
          const { stdout } = await execAsync(`git show HEAD:"${normalizedPath}"`, {
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
          const { stdout } = await execAsync(
            `git show ${options.commit2}:"${normalizedPath}"`,
            { cwd: this.projectRoot }
          );
          after = stdout;
        } catch {
          // 파일이 삭제됨
        }
      } else if (options.staged) {
        // 스테이징된 내용
        try {
          const { stdout } = await execAsync(`git show :0:"${normalizedPath}"`, {
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
      await execAsync('git rev-parse --git-dir', { cwd: this.projectRoot });
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
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.projectRoot,
      });
      return stdout.trim();
    } catch {
      return null;
    }
  }
}
