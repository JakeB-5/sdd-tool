/**
 * migrate 명령어 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerMigrateCommand } from '../../../../src/cli/commands/migrate.js';

// Mock modules
vi.mock('../../../../src/utils/fs.js', () => ({
  findSddRoot: vi.fn(),
  fileExists: vi.fn(),
  directoryExists: vi.fn(),
  ensureDir: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('../../../../src/utils/logger.js', () => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  success: vi.fn(),
  newline: vi.fn(),
  listItem: vi.fn(),
}));

vi.mock('../../../../src/core/migrate/index.js', () => ({
  detectExternalTools: vi.fn(),
  migrateFromOpenSpec: vi.fn(),
  migrateFromSpecKit: vi.fn(),
}));

vi.mock('../../../../src/core/new/index.js', () => ({
  generateSpec: vi.fn(),
}));

vi.mock('../../../../src/core/new/schemas.js', () => ({
  generateFeatureId: vi.fn((title: string) => title.toLowerCase().replace(/\s+/g, '-')),
}));

import * as fs from '../../../../src/utils/fs.js';
import * as logger from '../../../../src/utils/logger.js';
import {
  detectExternalTools,
  migrateFromOpenSpec,
  migrateFromSpecKit,
} from '../../../../src/core/migrate/index.js';
import { generateSpec } from '../../../../src/core/new/index.js';

describe('registerMigrateCommand', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    vi.clearAllMocks();
  });

  it('migrate 명령어를 등록한다', () => {
    registerMigrateCommand(program);

    const migrateCommand = program.commands.find(cmd => cmd.name() === 'migrate');
    expect(migrateCommand).toBeDefined();
    expect(migrateCommand?.description()).toContain('마이그레이션');
  });

  it('6개의 서브커맨드를 등록한다', () => {
    registerMigrateCommand(program);

    const migrateCommand = program.commands.find(cmd => cmd.name() === 'migrate');
    expect(migrateCommand?.commands).toHaveLength(6);

    const subcommandNames = migrateCommand?.commands.map(cmd => cmd.name()) || [];
    expect(subcommandNames).toContain('docs');
    expect(subcommandNames).toContain('analyze');
    expect(subcommandNames).toContain('scan');
    expect(subcommandNames).toContain('detect');
    expect(subcommandNames).toContain('openspec');
    expect(subcommandNames).toContain('speckit');
  });

  it('docs 서브커맨드에 필수 옵션을 설정한다', () => {
    registerMigrateCommand(program);

    const migrateCommand = program.commands.find(cmd => cmd.name() === 'migrate');
    const docsCommand = migrateCommand?.commands.find(cmd => cmd.name() === 'docs');

    expect(docsCommand).toBeDefined();

    const options = docsCommand?.options || [];
    const optionFlags = options.map(opt => opt.flags);

    expect(optionFlags).toContain('-o, --output <dir>');
    expect(optionFlags).toContain('--dry-run');
  });
});

describe('detect 서브커맨드', () => {
  let program: Command;
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    program = new Command();
    program.exitOverride(); // 테스트 중 프로세스 종료 방지
    vi.clearAllMocks();
  });

  it('detectExternalTools 함수를 호출한다', async () => {
    vi.mocked(detectExternalTools).mockResolvedValue({
      success: true,
      data: [],
    });

    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'detect']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    expect(detectExternalTools).toHaveBeenCalledWith(expect.any(String));
  });

  it('도구를 감지하면 결과를 출력한다', async () => {
    vi.mocked(detectExternalTools).mockResolvedValue({
      success: true,
      data: [
        {
          tool: 'openspec',
          path: '/test/openspec',
          confidence: 'high',
          specCount: 5,
          specs: [
            { id: 'spec-1', title: 'Test Spec', status: 'draft' },
          ],
        },
      ],
    });

    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'detect']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('OpenSpec'));
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('스펙 수: 5개'));
  });

  it('감지 실패 시 에러를 출력한다', async () => {
    vi.mocked(detectExternalTools).mockResolvedValue({
      success: false,
      error: new Error('감지 실패'),
    });

    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'detect']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    expect(logger.error).toHaveBeenCalledWith('감지 실패');
  });
});

describe('openspec 서브커맨드', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    vi.clearAllMocks();
  });

  it('OpenSpec에서 마이그레이션을 실행한다', async () => {
    vi.mocked(fs.findSddRoot).mockResolvedValue('/test/project');
    vi.mocked(migrateFromOpenSpec).mockResolvedValue({
      success: true,
      data: {
        specsCreated: 3,
        specsSkipped: 1,
        errors: [],
      },
    });

    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'openspec', '/test/source']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    expect(migrateFromOpenSpec).toHaveBeenCalledWith(
      expect.stringContaining('source'),
      expect.stringContaining('.sdd'),
      expect.objectContaining({
        dryRun: undefined,
        overwrite: undefined,
      })
    );
  });

  it('dry-run 옵션을 전달한다', async () => {
    vi.mocked(fs.findSddRoot).mockResolvedValue('/test/project');
    vi.mocked(migrateFromOpenSpec).mockResolvedValue({
      success: true,
      data: {
        specsCreated: 0,
        specsSkipped: 0,
        errors: [],
      },
    });

    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'openspec', '/test/source', '--dry-run']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    expect(migrateFromOpenSpec).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        dryRun: true,
      })
    );
  });

  it('SDD 프로젝트가 없으면 에러를 출력한다', async () => {
    vi.mocked(fs.findSddRoot).mockResolvedValue(null);

    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'openspec']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('SDD 프로젝트'));
  });
});

describe('speckit 서브커맨드', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    vi.clearAllMocks();
  });

  it('Spec Kit에서 마이그레이션을 실행한다', async () => {
    vi.mocked(fs.findSddRoot).mockResolvedValue('/test/project');
    vi.mocked(migrateFromSpecKit).mockResolvedValue({
      success: true,
      data: {
        specsCreated: 2,
        specsSkipped: 0,
        errors: [],
      },
    });

    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'speckit', '/test/source']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    expect(migrateFromSpecKit).toHaveBeenCalledWith(
      expect.stringContaining('source'),
      expect.stringContaining('.sdd'),
      expect.objectContaining({
        dryRun: undefined,
        overwrite: undefined,
      })
    );
  });

  it('overwrite 옵션을 전달한다', async () => {
    vi.mocked(fs.findSddRoot).mockResolvedValue('/test/project');
    vi.mocked(migrateFromSpecKit).mockResolvedValue({
      success: true,
      data: {
        specsCreated: 0,
        specsSkipped: 0,
        errors: [],
      },
    });

    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'speckit', '/test/source', '--overwrite']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    expect(migrateFromSpecKit).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        overwrite: true,
      })
    );
  });
});

describe('docs 서브커맨드', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    vi.clearAllMocks();
  });

  it('단일 파일을 마이그레이션한다', async () => {
    vi.mocked(fs.findSddRoot).mockResolvedValue('/test/project');
    vi.mocked(generateSpec).mockReturnValue('# Spec Content');

    // Mock fs.stat to simulate a file
    const mockStat = vi.fn().mockResolvedValue({
      isDirectory: () => false,
      isFile: () => true,
    });
    vi.spyOn(require('node:fs').promises, 'stat').mockImplementation(mockStat);
    vi.spyOn(require('node:fs').promises, 'readFile').mockResolvedValue('# Test Document\n\nThis SHALL work.');

    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'docs', '/test/doc.md']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('1개 파일 발견'));
  });

  it('dry-run 모드에서는 파일을 생성하지 않는다', async () => {
    vi.mocked(fs.findSddRoot).mockResolvedValue('/test/project');
    vi.mocked(generateSpec).mockReturnValue('# Spec Content');

    const mockStat = vi.fn().mockResolvedValue({
      isDirectory: () => false,
      isFile: () => true,
    });
    vi.spyOn(require('node:fs').promises, 'stat').mockImplementation(mockStat);
    vi.spyOn(require('node:fs').promises, 'readFile').mockResolvedValue('# Test');

    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'docs', '/test/doc.md', '--dry-run']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    expect(fs.ensureDir).not.toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});

describe('analyze 서브커맨드', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    vi.clearAllMocks();
  });

  it('문서를 분석하고 결과를 출력한다', async () => {
    vi.mocked(fs.fileExists).mockResolvedValue(true);

    const mockReadFile = vi.spyOn(require('node:fs').promises, 'readFile').mockResolvedValue(
      '# Test Document\n\nThis SHALL work.\n\n**GIVEN** a condition\n**WHEN** an action\n**THEN** a result'
    );

    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'analyze', '/test/doc.md']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    expect(mockReadFile).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('문서 분석'));
  });

  it('파일이 없으면 에러를 출력한다', async () => {
    vi.mocked(fs.fileExists).mockResolvedValue(false);

    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'analyze', '/test/nonexistent.md']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('찾을 수 없습니다'));
  });
});

describe('analyzeDocument 함수 - RFC 2119 감지', () => {
  it('RFC 2119 키워드를 감지한다', async () => {
    vi.mocked(fs.fileExists).mockResolvedValue(true);

    const content = `# Test

The system SHALL validate input.
The API MUST return 200 status.
Users SHOULD provide feedback.
This feature MAY be optional.
The code SHALL NOT use deprecated APIs.
`;

    vi.spyOn(require('node:fs').promises, 'readFile').mockResolvedValue(content);

    const program = new Command();
    program.exitOverride();
    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'analyze', '/test/doc.md']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    // RFC 2119 키워드가 감지되었음을 확인 - 5개의 요구사항
    expect(logger.listItem).toHaveBeenCalledWith('✅ RFC 2119 키워드: 5개');
  });

  it('RFC 2119 키워드가 없으면 경고를 표시한다', async () => {
    vi.mocked(fs.fileExists).mockResolvedValue(true);

    const content = `# Test

Just a regular document without special keywords.
`;

    vi.spyOn(require('node:fs').promises, 'readFile').mockResolvedValue(content);

    const program = new Command();
    program.exitOverride();
    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'analyze', '/test/doc.md']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    // RFC 2119 키워드 추가 권장사항 확인
    expect(logger.listItem).toHaveBeenCalledWith(
      'RFC 2119 키워드(SHALL, MUST, SHOULD 등)를 추가하세요.',
      1
    );
  });
});

describe('analyzeDocument 함수 - GIVEN-WHEN-THEN 추출', () => {
  it('GIVEN-WHEN-THEN 시나리오를 추출한다', async () => {
    vi.mocked(fs.fileExists).mockResolvedValue(true);

    const content = `# Test Feature

## Scenario 1

GIVEN the user is logged in
WHEN they click the submit button
THEN the form is submitted

## Scenario 2

Given a valid API key
When making a request
Then the response is 200 OK
`;

    vi.spyOn(require('node:fs').promises, 'readFile').mockResolvedValue(content);

    const program = new Command();
    program.exitOverride();
    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'analyze', '/test/doc.md']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    // GIVEN-WHEN-THEN 시나리오가 감지되었음을 확인 - 2개의 시나리오
    expect(logger.listItem).toHaveBeenCalledWith('✅ GIVEN-WHEN-THEN 시나리오: 2개');
  });

  it('GIVEN-WHEN-THEN이 없으면 권장사항을 표시한다', async () => {
    vi.mocked(fs.fileExists).mockResolvedValue(true);

    const content = `# Test

No scenarios here.
`;

    vi.spyOn(require('node:fs').promises, 'readFile').mockResolvedValue(content);

    const program = new Command();
    program.exitOverride();
    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'analyze', '/test/doc.md']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    // GIVEN-WHEN-THEN 추가 권장사항 확인
    expect(logger.listItem).toHaveBeenCalledWith(
      'GIVEN-WHEN-THEN 형식의 시나리오를 추가하세요.',
      1
    );
  });

  it('완전한 문서에 대해 마이그레이션 권장을 표시한다', async () => {
    vi.mocked(fs.fileExists).mockResolvedValue(true);

    const content = `# Complete Feature

The system SHALL validate input.

GIVEN a valid input
WHEN validation is triggered
THEN the input is accepted
`;

    vi.spyOn(require('node:fs').promises, 'readFile').mockResolvedValue(content);

    const program = new Command();
    program.exitOverride();
    registerMigrateCommand(program);

    try {
      await program.parseAsync(['node', 'test', 'migrate', 'analyze', '/test/doc.md']);
    } catch {
      // exitOverride로 인한 에러 무시
    }

    // 마이그레이션 적합성 메시지 확인
    expect(logger.listItem).toHaveBeenCalledWith(
      '이 문서는 SDD 형식으로 마이그레이션하기에 적합합니다!',
      1
    );
  });
});
