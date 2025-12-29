/**
 * Serena MCP 요구사항 체커 테스트
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  checkRequirements,
  createInstallGuide,
  createQuickStartGuide,
  createRequirementError,
  SERENA_INSTALL_URL,
  SERENA_DOCS_URL,
} from '../../../../src/integrations/serena/requirement-checker.js';
import { resetConnectionState } from '../../../../src/integrations/serena/connection.js';

describe('checkRequirements', () => {
  beforeEach(() => {
    resetConnectionState();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('skipSerenaCheck 옵션으로 체크를 건너뛴다', async () => {
    const result = await checkRequirements({ skipSerenaCheck: true });

    expect(result.passed).toBe(true);
    expect(result.serenaCheck.available).toBe(true);
    expect(result.warnings).toContain('Serena 체크가 건너뛰어졌습니다 (--skip-serena-check)');
  });

  it('Serena 미설치 시 실패한다', async () => {
    const result = await checkRequirements();

    expect(result.passed).toBe(false);
    expect(result.serenaCheck.available).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('환경 변수로 Serena 활성화', async () => {
    vi.stubEnv('SDD_SERENA_AVAILABLE', 'true');
    vi.stubEnv('SDD_SERENA_PROJECT', 'test-project');

    const result = await checkRequirements();

    expect(result.passed).toBe(true);
    expect(result.serenaCheck.available).toBe(true);
    expect(result.serenaCheck.projectName).toBe('test-project');
  });
});

describe('createInstallGuide', () => {
  it('설치 가이드를 생성한다', () => {
    const guide = createInstallGuide();

    expect(guide).toContain('Serena MCP 설치 가이드');
    expect(guide).toContain(SERENA_INSTALL_URL);
    expect(guide).toContain(SERENA_DOCS_URL);
  });

  it('설치 단계를 포함한다', () => {
    const guide = createInstallGuide();

    expect(guide).toContain('pip install');
    expect(guide).toContain('npm install');
    expect(guide).toContain('Claude Code');
  });
});

describe('createQuickStartGuide', () => {
  it('빠른 시작 가이드를 생성한다', () => {
    const guide = createQuickStartGuide();

    expect(guide).toContain('빠른 시작');
    expect(guide).toContain('sdd reverse scan');
    expect(guide).toContain('sdd reverse extract');
    expect(guide).toContain('sdd reverse review');
    expect(guide).toContain('sdd reverse finalize');
  });
});

describe('createRequirementError', () => {
  it('에러 메시지를 생성한다', () => {
    const result = {
      passed: false,
      serenaCheck: {
        available: false,
        status: 'disconnected' as const,
        needsInstall: true,
        needsConfig: false,
      },
      warnings: [],
      errors: ['Serena MCP가 설치되지 않았습니다.'],
    };

    const error = createRequirementError('reverse scan', result);

    expect(error).toContain('reverse scan');
    expect(error).toContain('실패');
    expect(error).toContain('Serena MCP가 설치되지 않았습니다');
  });

  it('설정 필요 메시지를 포함한다', () => {
    const result = {
      passed: false,
      serenaCheck: {
        available: false,
        status: 'disconnected' as const,
        needsInstall: false,
        needsConfig: true,
      },
      warnings: [],
      errors: ['설정이 필요합니다.'],
    };

    const error = createRequirementError('reverse scan', result);

    expect(error).toContain('설정');
  });
});
