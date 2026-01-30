/**
 * watch 명령어 테스트
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerWatchCommand } from '../../../../src/cli/commands/watch.js';
import { ExitCode } from '../../../../src/errors/index.js';

// Mock dependencies
vi.mock('../../../../src/core/watch/index.js', () => ({
  createWatcher: vi.fn(),
}));

vi.mock('../../../../src/core/spec/index.js', () => ({
  validateSpecs: vi.fn(),
}));

vi.mock('../../../../src/utils/fs.js', () => ({
  findSddRoot: vi.fn(),
}));

vi.mock('../../../../src/utils/logger.js', () => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  success: vi.fn(),
  newline: vi.fn(),
}));

describe('registerWatchCommand', () => {
  let program: Command;
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    program = new Command();
    mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  it('watch 명령어가 등록된다', () => {
    registerWatchCommand(program);

    const watchCommand = program.commands.find((cmd) => cmd.name() === 'watch');
    expect(watchCommand).toBeDefined();
    expect(watchCommand?.description()).toContain('스펙 파일 변경을 실시간 감시');
  });

  it('--no-validate 옵션이 등록된다', () => {
    registerWatchCommand(program);

    const watchCommand = program.commands.find((cmd) => cmd.name() === 'watch');
    const validateOption = watchCommand?.options.find((opt) => opt.long === '--no-validate');

    expect(validateOption).toBeDefined();
    expect(validateOption?.description).toContain('자동 검증 비활성화');
  });

  it('--impact 옵션이 등록된다', () => {
    registerWatchCommand(program);

    const watchCommand = program.commands.find((cmd) => cmd.name() === 'watch');
    const impactOption = watchCommand?.options.find((opt) => opt.long === '--impact');

    expect(impactOption).toBeDefined();
    expect(impactOption?.description).toContain('영향도 분석 포함');
  });

  it('-q, --quiet 옵션이 등록된다', () => {
    registerWatchCommand(program);

    const watchCommand = program.commands.find((cmd) => cmd.name() === 'watch');
    const quietOption = watchCommand?.options.find((opt) => opt.long === '--quiet');

    expect(quietOption).toBeDefined();
    expect(quietOption?.short).toBe('-q');
    expect(quietOption?.description).toContain('성공 시 출력 생략');
  });

  it('--debounce <ms> 옵션이 등록된다', () => {
    registerWatchCommand(program);

    const watchCommand = program.commands.find((cmd) => cmd.name() === 'watch');
    const debounceOption = watchCommand?.options.find((opt) => opt.long === '--debounce');

    expect(debounceOption).toBeDefined();
    expect(debounceOption?.description).toContain('디바운스 시간');
    expect(debounceOption?.defaultValue).toBe('500');
  });

  it('기본 옵션 값이 올바르다', () => {
    registerWatchCommand(program);

    const watchCommand = program.commands.find((cmd) => cmd.name() === 'watch');
    const debounceOption = watchCommand?.options.find((opt) => opt.long === '--debounce');

    // debounce 기본값 확인
    expect(debounceOption?.defaultValue).toBe('500');
  });
});

describe('watch 명령어 실행', () => {
  let program: Command;
  let mockExit: ReturnType<typeof vi.spyOn>;
  let findSddRoot: ReturnType<typeof vi.fn>;
  let createWatcher: ReturnType<typeof vi.fn>;
  let validateSpecs: ReturnType<typeof vi.fn>;
  let logger: Record<string, ReturnType<typeof vi.fn>>;
  let abortController: AbortController;

  beforeEach(async () => {
    program = new Command();
    abortController = new AbortController();
    mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {
      // Abort to prevent infinite await
      abortController.abort();
    }) as never);

    // Import mocked modules
    const watchModule = await import('../../../../src/core/watch/index.js');
    const specModule = await import('../../../../src/core/spec/index.js');
    const fsModule = await import('../../../../src/utils/fs.js');
    const loggerModule = await import('../../../../src/utils/logger.js');

    findSddRoot = fsModule.findSddRoot as ReturnType<typeof vi.fn>;
    createWatcher = watchModule.createWatcher as ReturnType<typeof vi.fn>;
    validateSpecs = specModule.validateSpecs as ReturnType<typeof vi.fn>;
    logger = {
      info: loggerModule.info as ReturnType<typeof vi.fn>,
      error: loggerModule.error as ReturnType<typeof vi.fn>,
      warn: loggerModule.warn as ReturnType<typeof vi.fn>,
      success: loggerModule.success as ReturnType<typeof vi.fn>,
      newline: loggerModule.newline as ReturnType<typeof vi.fn>,
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    mockExit.mockRestore();
    abortController.abort();
  });

  it('SDD 프로젝트가 없으면 에러와 함께 종료한다', async () => {
    findSddRoot.mockResolvedValue(null);

    registerWatchCommand(program);

    // Execute command - will throw when process.exit is called
    await program.parseAsync(['node', 'test', 'watch']).catch(() => {});

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('SDD 프로젝트를 찾을 수 없습니다')
    );
    expect(mockExit).toHaveBeenCalledWith(ExitCode.GENERAL_ERROR);
  });

  it('--no-validate 옵션 사용 시 검증을 비활성화한다', async () => {
    findSddRoot.mockResolvedValue('/test/project');

    // Mock watcher that immediately triggers exit
    const mockWatcher = {
      on: vi.fn().mockReturnThis(),
      start: vi.fn().mockImplementation(() => {
        // Simulate immediate exit to avoid infinite wait
        setTimeout(() => mockExit(0), 50);
      }),
      stop: vi.fn(),
    };
    createWatcher.mockReturnValue(mockWatcher);

    registerWatchCommand(program);

    // Execute command with --no-validate (will timeout and be caught)
    await Promise.race([
      program.parseAsync(['node', 'test', 'watch', '--no-validate']).catch(() => {}),
      new Promise(resolve => setTimeout(resolve, 100)),
    ]);

    // Verify watcher was created
    expect(createWatcher).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('검증: 비활성화'));
  });

  it('--quiet 옵션이 전달된다', async () => {
    findSddRoot.mockResolvedValue('/test/project');

    const mockWatcher = {
      on: vi.fn().mockReturnThis(),
      start: vi.fn().mockImplementation(() => {
        setTimeout(() => mockExit(0), 50);
      }),
      stop: vi.fn(),
    };
    createWatcher.mockReturnValue(mockWatcher);

    registerWatchCommand(program);

    await Promise.race([
      program.parseAsync(['node', 'test', 'watch', '--quiet']).catch(() => {}),
      new Promise(resolve => setTimeout(resolve, 100)),
    ]);

    // Verify watcher was created and command started
    expect(createWatcher).toHaveBeenCalled();
    expect(mockWatcher.start).toHaveBeenCalled();
  });

  it('--debounce 옵션으로 디바운스 시간을 설정한다', async () => {
    findSddRoot.mockResolvedValue('/test/project');

    const mockWatcher = {
      on: vi.fn().mockReturnThis(),
      start: vi.fn().mockImplementation(() => {
        setTimeout(() => mockExit(0), 50);
      }),
      stop: vi.fn(),
    };
    createWatcher.mockReturnValue(mockWatcher);

    registerWatchCommand(program);

    await Promise.race([
      program.parseAsync(['node', 'test', 'watch', '--debounce', '1000']).catch(() => {}),
      new Promise(resolve => setTimeout(resolve, 100)),
    ]);

    // Verify createWatcher was called with correct debounce
    expect(createWatcher).toHaveBeenCalledWith(
      expect.objectContaining({
        debounceMs: 1000,
      })
    );
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('디바운스: 1000ms'));
  });

  it('기본 디바운스 값은 500ms이다', async () => {
    findSddRoot.mockResolvedValue('/test/project');

    const mockWatcher = {
      on: vi.fn().mockReturnThis(),
      start: vi.fn().mockImplementation(() => {
        setTimeout(() => mockExit(0), 50);
      }),
      stop: vi.fn(),
    };
    createWatcher.mockReturnValue(mockWatcher);

    registerWatchCommand(program);

    await Promise.race([
      program.parseAsync(['node', 'test', 'watch']).catch(() => {}),
      new Promise(resolve => setTimeout(resolve, 100)),
    ]);

    // Verify createWatcher was called with default debounce
    expect(createWatcher).toHaveBeenCalledWith(
      expect.objectContaining({
        debounceMs: 500,
      })
    );
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('디바운스: 500ms'));
  });
});
