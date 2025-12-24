/**
 * sdd diff CLI 명령어
 */
import { Command } from 'commander';
import { executeDiff } from '../../core/diff/index.js';

export function registerDiffCommand(program: Command): void {
  program
    .command('diff [commit1] [commit2]')
    .description('스펙 변경사항 시각화')
    .option('--staged', '스테이징된 변경사항만 표시')
    .option('--stat', '변경 통계 요약 표시')
    .option('--name-only', '변경된 파일명만 표시')
    .option('--json', 'JSON 형식으로 출력')
    .option('--no-color', '컬러 출력 비활성화')
    .option('-s, --spec <id>', '특정 스펙만 비교')
    .action(async (commit1: string | undefined, commit2: string | undefined, options) => {
      const projectRoot = process.cwd();

      const result = await executeDiff(projectRoot, {
        staged: options.staged,
        stat: options.stat,
        nameOnly: options.nameOnly,
        json: options.json,
        noColor: !options.color,
        specId: options.spec,
        commit1,
        commit2,
      });

      if (!result.success) {
        console.error(`오류: ${result.error?.message}`);
        process.exit(1);
      }

      console.log(result.data?.output);
    });
}
