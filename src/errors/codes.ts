/**
 * 에러 코드 정의
 */

/**
 * CLI 종료 코드
 */
export const ExitCode = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  VALIDATION_FAILED: 2,
  CONSTITUTION_VIOLATION: 3,
  FILE_SYSTEM_ERROR: 4,
  USER_CANCELLED: 5,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];

/**
 * 에러 코드
 */
export const ErrorCode = {
  // 일반 에러 (E0xx)
  UNKNOWN: 'E001',
  INVALID_ARGUMENT: 'E002',
  NOT_INITIALIZED: 'E003',

  // 파일 시스템 에러 (E1xx)
  FILE_NOT_FOUND: 'E101',
  FILE_READ_ERROR: 'E102',
  FILE_WRITE_ERROR: 'E103',
  DIRECTORY_NOT_FOUND: 'E104',
  DIRECTORY_EXISTS: 'E105',

  // 스펙 검증 에러 (E2xx)
  SPEC_PARSE_ERROR: 'E201',
  SPEC_INVALID_FORMAT: 'E202',
  SPEC_MISSING_REQUIRED: 'E203',
  RFC2119_VIOLATION: 'E204',
  GWT_INVALID_FORMAT: 'E205',

  // Constitution 에러 (E3xx)
  CONSTITUTION_NOT_FOUND: 'E301',
  CONSTITUTION_PARSE_ERROR: 'E302',
  CONSTITUTION_VIOLATION: 'E303',

  // 변경 워크플로우 에러 (E4xx)
  PROPOSAL_NOT_FOUND: 'E401',
  PROPOSAL_INVALID: 'E402',
  DELTA_CONFLICT: 'E403',
  ARCHIVE_FAILED: 'E404',

  // 분석 에러 (E5xx)
  ANALYSIS_FAILED: 'E501',
  INSUFFICIENT_DATA: 'E502',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
