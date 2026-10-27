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
let jsonMode = false;

/**
 * 로그 레벨 설정
 */
export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

/**
 * JSON 모드 설정
 *
 * When enabled, every human-readable log goes to stderr so that stdout carries
 * only the command's JSON payload.
 */
export function setJsonMode(enabled: boolean): void {
  jsonMode = enabled;
}

/**
 * JSON 모드 여부
 */
export function isJsonMode(): boolean {
  return jsonMode;
}

/**
 * 로그 레벨 확인
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

/**
 * Human-readable output stream (stderr in JSON mode)
 */
function out(...args: unknown[]): void {
  if (jsonMode) {
    console.error(...args);
  } else {
    console.log(...args);
  }
}

// Messages that already start with a status symbol/emoji get no extra prefix
const LEADING_SYMBOL = /^\s*(?:\p{Extended_Pictographic}|[✓✔✗✘•○●◆◇★☆→▶])/u;

/**
 * 메시지가 이미 기호로 시작하면 접두사를 생략
 */
function withPrefix(prefix: string, message: string): string {
  return LEADING_SYMBOL.test(message) ? message : `${prefix} ${message}`;
}

/**
 * 디버그 로그
 */
export function debug(message: string, ...args: unknown[]): void {
  if (shouldLog('debug')) {
    out(chalk.gray(`[DEBUG] ${message}`), ...args);
  }
}

/**
 * 정보 로그
 */
export function info(message: string, ...args: unknown[]): void {
  if (shouldLog('info')) {
    out(chalk.blue(withPrefix('ℹ', message)), ...args);
  }
}

/**
 * 성공 로그
 */
export function success(message: string, ...args: unknown[]): void {
  if (shouldLog('info')) {
    out(chalk.green(withPrefix('✓', message)), ...args);
  }
}

/**
 * 경고 로그
 */
export function warn(message: string, ...args: unknown[]): void {
  if (shouldLog('warn')) {
    out(chalk.yellow(withPrefix('⚠', message)), ...args);
  }
}

/**
 * 에러 로그
 */
export function error(message: string, ...args: unknown[]): void {
  if (shouldLog('error')) {
    console.error(chalk.red(withPrefix('✗', message)), ...args);
  }
}

/**
 * 제목 출력
 */
export function title(message: string): void {
  out();
  out(chalk.bold.cyan(message));
  out(chalk.cyan('─'.repeat(message.length)));
}

/**
 * 목록 항목 출력
 */
export function listItem(item: string, indent = 0): void {
  const prefix = '  '.repeat(indent) + (LEADING_SYMBOL.test(item) ? '' : '• ');
  out(prefix + item);
}

/**
 * 빈 줄 출력
 */
export function newline(): void {
  out();
}
