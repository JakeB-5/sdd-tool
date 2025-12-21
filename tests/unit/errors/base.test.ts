/**
 * 에러 클래스 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  SddError,
  FileSystemError,
  ValidationError,
  ConstitutionError,
  UserCancelledError,
  ErrorCode,
  ExitCode,
} from '../../../src/errors/index.js';

describe('SddError', () => {
  it('기본 에러를 생성한다', () => {
    const error = new SddError(ErrorCode.UNKNOWN);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(SddError);
    expect(error.code).toBe(ErrorCode.UNKNOWN);
    expect(error.exitCode).toBe(ExitCode.GENERAL_ERROR);
    expect(error.name).toBe('SddError');
  });

  it('커스텀 메시지를 설정할 수 있다', () => {
    const error = new SddError(ErrorCode.UNKNOWN, '커스텀 메시지');

    expect(error.message).toBe('커스텀 메시지');
  });

  it('사용자 친화적 메시지를 반환한다', () => {
    const error = new SddError(ErrorCode.UNKNOWN, '테스트 메시지');

    expect(error.toUserMessage()).toBe('[E001] 테스트 메시지');
  });
});

describe('FileSystemError', () => {
  it('파일 경로를 포함한다', () => {
    const error = new FileSystemError(ErrorCode.FILE_NOT_FOUND, '/path/to/file');

    expect(error).toBeInstanceOf(FileSystemError);
    expect(error.path).toBe('/path/to/file');
    expect(error.exitCode).toBe(ExitCode.FILE_SYSTEM_ERROR);
    expect(error.message).toContain('/path/to/file');
  });
});

describe('ValidationError', () => {
  it('검증 실패 세부사항을 포함한다', () => {
    const error = new ValidationError(ErrorCode.SPEC_INVALID_FORMAT, '필드 누락');

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.details).toBe('필드 누락');
    expect(error.exitCode).toBe(ExitCode.VALIDATION_FAILED);
  });
});

describe('ConstitutionError', () => {
  it('위반된 원칙을 포함한다', () => {
    const error = new ConstitutionError('명세 우선 원칙');

    expect(error).toBeInstanceOf(ConstitutionError);
    expect(error.principle).toBe('명세 우선 원칙');
    expect(error.exitCode).toBe(ExitCode.CONSTITUTION_VIOLATION);
  });
});

describe('UserCancelledError', () => {
  it('사용자 취소 에러를 생성한다', () => {
    const error = new UserCancelledError();

    expect(error).toBeInstanceOf(UserCancelledError);
    expect(error.exitCode).toBe(ExitCode.USER_CANCELLED);
  });

  it('커스텀 메시지를 설정할 수 있다', () => {
    const error = new UserCancelledError('취소됨');

    expect(error.message).toBe('취소됨');
  });
});
