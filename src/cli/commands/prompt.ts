/**
 * sdd prompt 명령어
 *
 * AI 코딩 도구용 워크플로우 단계별 프롬프트를 출력합니다.
 */
import { Command } from 'commander';
import { getPrompt, getAvailableCommands, PROMPT_TARGETS } from '../../prompts/index.js';
import * as logger from '../../utils/logger.js';
import { ExitCode } from '../../errors/index.js';

/**
 * prompt 명령어 등록
 */
export function registerPromptCommand(program: Command): void {
  program
    .command('prompt [name]')
    .description('SDD 워크플로우 단계별 프롬프트를 출력합니다 (목록: sdd prompt --list)')
    .option('-l, --list', '사용 가능한 프롬프트 목록')
    .action(async (command: string | undefined, options: { list?: boolean }) => {
      try {
        await runPrompt(command, options);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(ExitCode.GENERAL_ERROR);
      }
    });
}

/**
 * 프롬프트 실행
 */
async function runPrompt(
  command: string | undefined,
  options: { list?: boolean }
): Promise<void> {
  // 목록 출력
  if (options.list || !command) {
    const commands = getAvailableCommands();
    logger.info('사용 가능한 프롬프트 (관련 스킬/명령어):');
    logger.newline();
    for (const cmd of commands) {
      const target = PROMPT_TARGETS[cmd];
      logger.listItem(target ? `${cmd} (${target})` : cmd);
    }
    logger.newline();
    logger.info('사용법: sdd prompt <prompt>');
    logger.info('예시: sdd prompt change');
    return;
  }

  // 프롬프트 출력
  const prompt = getPrompt(command);
  if (!prompt) {
    logger.error(
      `알 수 없는 프롬프트: ${command} (사용 가능한 프롬프트: ${getAvailableCommands().join(', ')})`
    );
    process.exit(ExitCode.GENERAL_ERROR);
  }

  // 프롬프트 출력 (마크다운)
  console.log(prompt);
}
