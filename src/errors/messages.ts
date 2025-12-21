/**
 * 에러 메시지 정의
 */
import { ErrorCode } from './codes.js';

/**
 * 에러 코드별 메시지 템플릿
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // 일반 에러
  [ErrorCode.UNKNOWN]: '알 수 없는 오류가 발생했습니다',
  [ErrorCode.INVALID_ARGUMENT]: '잘못된 인자입니다: {0}',
  [ErrorCode.NOT_INITIALIZED]: 'SDD 프로젝트가 초기화되지 않았습니다. `sdd init`을 먼저 실행하세요',

  // 파일 시스템 에러
  [ErrorCode.FILE_NOT_FOUND]: '파일을 찾을 수 없습니다: {0}',
  [ErrorCode.FILE_READ_ERROR]: '파일 읽기 실패: {0}',
  [ErrorCode.FILE_WRITE_ERROR]: '파일 쓰기 실패: {0}',
  [ErrorCode.DIRECTORY_NOT_FOUND]: '디렉토리를 찾을 수 없습니다: {0}',
  [ErrorCode.DIRECTORY_EXISTS]: '디렉토리가 이미 존재합니다: {0}',

  // 스펙 검증 에러
  [ErrorCode.SPEC_PARSE_ERROR]: '스펙 파싱 실패: {0}',
  [ErrorCode.SPEC_INVALID_FORMAT]: '잘못된 스펙 형식: {0}',
  [ErrorCode.SPEC_MISSING_REQUIRED]: '필수 필드 누락: {0}',
  [ErrorCode.RFC2119_VIOLATION]: 'RFC 2119 형식 위반: {0}',
  [ErrorCode.GWT_INVALID_FORMAT]: 'GIVEN-WHEN-THEN 형식 위반: {0}',

  // Constitution 에러
  [ErrorCode.CONSTITUTION_NOT_FOUND]: 'constitution.md를 찾을 수 없습니다',
  [ErrorCode.CONSTITUTION_PARSE_ERROR]: 'Constitution 파싱 실패: {0}',
  [ErrorCode.CONSTITUTION_VIOLATION]: 'Constitution 원칙 위반: {0}',

  // 변경 워크플로우 에러
  [ErrorCode.PROPOSAL_NOT_FOUND]: '제안서를 찾을 수 없습니다: {0}',
  [ErrorCode.PROPOSAL_INVALID]: '잘못된 제안서 형식: {0}',
  [ErrorCode.DELTA_CONFLICT]: '델타 충돌: {0}',
  [ErrorCode.ARCHIVE_FAILED]: '아카이브 실패: {0}',

  // 분석 에러
  [ErrorCode.ANALYSIS_FAILED]: '분석 실패: {0}',
  [ErrorCode.INSUFFICIENT_DATA]: '분석에 필요한 데이터 부족: {0}',
};

/**
 * 메시지 템플릿에 인자를 적용
 */
export function formatMessage(code: ErrorCode, ...args: string[]): string {
  let message = ErrorMessages[code];
  args.forEach((arg, index) => {
    message = message.replace(`{${index}}`, arg);
  });
  return message;
}
