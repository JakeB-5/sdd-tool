/**
 * 에러 기본 클래스
 */
import { ErrorCode, ExitCode } from './codes.js';
import { formatMessage } from './messages.js';

/**
 * SDD 도구의 기본 에러 클래스
 */
export class SddError extends Error {
  readonly code: ErrorCode;
  readonly exitCode: ExitCode;

  constructor(
    code: ErrorCode,
    message?: string,
    exitCode: ExitCode = ExitCode.GENERAL_ERROR
  ) {
    super(message ?? formatMessage(code));
    this.name = 'SddError';
    this.code = code;
    this.exitCode = exitCode;
    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * 사용자 친화적 메시지
   */
  toUserMessage(): string {
    return `[${this.code}] ${this.message}`;
  }
}

/**
 * 파일 시스템 에러
 */
export class FileSystemError extends SddError {
  readonly path: string;

  constructor(code: ErrorCode, path: string) {
    super(code, formatMessage(code, path), ExitCode.FILE_SYSTEM_ERROR);
    this.name = 'FileSystemError';
    this.path = path;
  }
}

/**
 * 스펙 검증 에러
 */
export class ValidationError extends SddError {
  readonly details: string;

  constructor(code: ErrorCode, details: string) {
    super(code, formatMessage(code, details), ExitCode.VALIDATION_FAILED);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * Constitution 위반 에러
 */
export class ConstitutionError extends SddError {
  readonly principle: string;

  constructor(principle: string) {
    super(
      ErrorCode.CONSTITUTION_VIOLATION,
      formatMessage(ErrorCode.CONSTITUTION_VIOLATION, principle),
      ExitCode.CONSTITUTION_VIOLATION
    );
    this.name = 'ConstitutionError';
    this.principle = principle;
  }
}

/**
 * 사용자 취소 에러
 */
export class UserCancelledError extends SddError {
  constructor(message = '사용자가 작업을 취소했습니다') {
    super(ErrorCode.UNKNOWN, message, ExitCode.USER_CANCELLED);
    this.name = 'UserCancelledError';
  }
}

/**
 * 변경 워크플로우 에러
 */
export class ChangeError extends SddError {
  constructor(message: string) {
    super(ErrorCode.UNKNOWN, message, ExitCode.GENERAL_ERROR);
    this.name = 'ChangeError';
  }
}
