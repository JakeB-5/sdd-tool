/**
 * 로깅 유틸리티
 */
import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = 'info';

/**
 * 로그 레벨 설정
 */
export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

/**
 * 로그 레벨 확인
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

/**
 * 디버그 로그
 */
export function debug(message: string, ...args: unknown[]): void {
  if (shouldLog('debug')) {
    console.log(chalk.gray(`[DEBUG] ${message}`), ...args);
  }
}

/**
 * 정보 로그
 */
export function info(message: string, ...args: unknown[]): void {
  if (shouldLog('info')) {
    console.log(chalk.blue(`ℹ ${message}`), ...args);
  }
}

/**
 * 성공 로그
 */
export function success(message: string, ...args: unknown[]): void {
  if (shouldLog('info')) {
    console.log(chalk.green(`✓ ${message}`), ...args);
  }
}

/**
 * 경고 로그
 */
export function warn(message: string, ...args: unknown[]): void {
  if (shouldLog('warn')) {
    console.log(chalk.yellow(`⚠ ${message}`), ...args);
  }
}

/**
 * 에러 로그
 */
export function error(message: string, ...args: unknown[]): void {
  if (shouldLog('error')) {
    console.error(chalk.red(`✗ ${message}`), ...args);
  }
}

/**
 * 제목 출력
 */
export function title(message: string): void {
  console.log();
  console.log(chalk.bold.cyan(message));
  console.log(chalk.cyan('─'.repeat(message.length)));
}

/**
 * 목록 항목 출력
 */
export function listItem(item: string, indent = 0): void {
  const prefix = '  '.repeat(indent) + '• ';
  console.log(prefix + item);
}

/**
 * 빈 줄 출력
 */
export function newline(): void {
  console.log();
}
