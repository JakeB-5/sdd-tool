/**
 * Serena MCP 필수 요구사항 체커
 *
 * sdd reverse 명령어 실행 전 Serena MCP 설치 및 연결 상태를 확인합니다.
 */

import { Result, success, failure } from '../../types/index.js';
import {
  checkSerenaConnection,
  type SerenaCheckResult,
} from './connection.js';
import { formatSupportedLanguages } from '../../utils/language-detector.js';

/**
 * 요구사항 체크 결과
 */
export interface RequirementCheckResult {
  /** 모든 요구사항 충족 여부 */
  passed: boolean;
  /** Serena 연결 상태 */
  serenaCheck: SerenaCheckResult;
  /** 경고 메시지 목록 */
  warnings: string[];
  /** 에러 메시지 목록 */
  errors: string[];
}

/**
 * 요구사항 체크 옵션
 */
export interface RequirementCheckOptions {
  /** Serena 체크 건너뛰기 (개발/테스트용) */
  skipSerenaCheck?: boolean;
  /** 조용한 모드 (경고 숨김) */
  quiet?: boolean;
}

/**
 * Serena MCP 설치 가이드 URL
 */
export const SERENA_INSTALL_URL = 'https://github.com/serena-ai/serena-mcp';

/**
 * Serena MCP 문서 URL
 */
export const SERENA_DOCS_URL = 'https://docs.serena.ai/mcp';

/**
 * 설치 가이드 메시지 생성
 */
export function createInstallGuide(): string {
  return `
╔═══════════════════════════════════════════════════════════════╗
║                    Serena MCP 설치 가이드                       ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  sdd reverse 명령어는 Serena MCP가 필요합니다.                  ║
║  Serena는 30개 이상의 언어를 지원하는 시맨틱 코드 분석 도구입니다. ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║  설치 단계:                                                    ║
║                                                               ║
║  1. Serena MCP 설치                                           ║
║     pip install serena-mcp                                    ║
║     또는 npm install -g @serena-ai/mcp                         ║
║                                                               ║
║  2. Claude Code MCP 설정                                       ║
║     claude-code settings → MCP Servers → Serena 추가           ║
║                                                               ║
║  3. 프로젝트 활성화                                             ║
║     Claude Code에서 mcp__serena__activate_project 사용         ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║  참고 링크:                                                    ║
║  - 설치: ${SERENA_INSTALL_URL}
║  - 문서: ${SERENA_DOCS_URL}
║  - 가이드: docs/guide/serena-setup.md                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`;
}

/**
 * 지원 언어 안내 메시지 생성
 */
export function createLanguageSupportMessage(): string {
  return `
Serena 지원 언어 (30+):

${formatSupportedLanguages()}

전체 목록: ${SERENA_DOCS_URL}/languages
`;
}

/**
 * 빠른 시작 가이드 생성
 */
export function createQuickStartGuide(): string {
  return `
빠른 시작:

1. Serena 설치 확인:
   $ claude-code --check-mcp serena

2. 프로젝트 스캔:
   $ sdd reverse scan

3. 스펙 추출:
   $ sdd reverse extract

4. 리뷰 및 확정:
   $ sdd reverse review
   $ sdd reverse finalize
`;
}

/**
 * 에러 메시지 생성
 */
export function createRequirementError(
  operation: string,
  result: RequirementCheckResult
): string {
  const lines: string[] = [
    `❌ '${operation}' 실행 실패`,
    '',
  ];

  if (result.errors.length > 0) {
    lines.push('에러:');
    result.errors.forEach((e) => lines.push(`  - ${e}`));
    lines.push('');
  }

  if (!result.serenaCheck.available) {
    if (result.serenaCheck.needsInstall) {
      lines.push('Serena MCP가 설치되지 않았습니다.');
    } else if (result.serenaCheck.needsConfig) {
      lines.push('Serena MCP 설정이 필요합니다.');
    }
    lines.push('');
    lines.push('해결 방법:');
    lines.push('  sdd reverse --help  또는');
    lines.push('  docs/guide/serena-setup.md 참조');
  }

  return lines.join('\n');
}

/**
 * Serena 요구사항 체크 수행
 */
export async function checkRequirements(
  options: RequirementCheckOptions = {}
): Promise<RequirementCheckResult> {
  const result: RequirementCheckResult = {
    passed: true,
    serenaCheck: {
      available: false,
      status: 'disconnected',
      needsInstall: true,
      needsConfig: false,
    },
    warnings: [],
    errors: [],
  };

  // Serena 체크 건너뛰기 (개발/테스트용)
  if (options.skipSerenaCheck) {
    result.warnings.push('Serena 체크가 건너뛰어졌습니다 (--skip-serena-check)');
    result.serenaCheck = {
      available: true,
      status: 'connected',
      needsInstall: false,
      needsConfig: false,
    };
    return result;
  }

  // Serena 연결 상태 확인
  result.serenaCheck = await checkSerenaConnection();

  if (!result.serenaCheck.available) {
    result.passed = false;

    if (result.serenaCheck.needsInstall) {
      result.errors.push('Serena MCP가 설치되지 않았습니다.');
    } else if (result.serenaCheck.needsConfig) {
      result.errors.push('Serena MCP가 Claude Code에 설정되지 않았습니다.');
    } else if (result.serenaCheck.errorMessage) {
      result.errors.push(`Serena 연결 오류: ${result.serenaCheck.errorMessage}`);
    } else {
      result.errors.push('Serena MCP에 연결할 수 없습니다.');
    }
  }

  return result;
}

/**
 * 요구사항 체크 및 실패 시 안내 출력
 */
export async function ensureSerenaAvailable(
  operation: string,
  options: RequirementCheckOptions = {}
): Promise<Result<void, Error>> {
  const result = await checkRequirements(options);

  if (result.passed) {
    // 경고만 있는 경우 출력
    if (result.warnings.length > 0 && !options.quiet) {
      console.warn('⚠️ 경고:');
      result.warnings.forEach((w) => console.warn(`  - ${w}`));
    }
    return success(undefined);
  }

  // 실패 시 상세 안내 출력
  console.error(createRequirementError(operation, result));

  if (result.serenaCheck.needsInstall) {
    console.error(createInstallGuide());
  }

  return failure(new Error(`Serena MCP가 필요합니다: ${operation}`));
}

/**
 * CLI용 간단한 체크 함수
 */
export async function requireSerena(
  skipCheck: boolean = false
): Promise<boolean> {
  if (skipCheck || process.env.SDD_SKIP_SERENA_CHECK === 'true') {
    return true;
  }

  const result = await checkRequirements();
  return result.passed;
}

/**
 * Serena 설정 힌트 메시지
 */
export function getSerenaHint(): string {
  return `
💡 힌트: Serena MCP 사용법

Claude Code에서 다음 도구를 사용할 수 있습니다:
- mcp__serena__activate_project: 프로젝트 활성화
- mcp__serena__list_dir: 디렉토리 조회
- mcp__serena__get_symbols_overview: 심볼 개요
- mcp__serena__find_symbol: 심볼 검색
- mcp__serena__find_referencing_symbols: 참조 검색

슬래시 커맨드: /sdd.reverse
`;
}
