/**
 * export 명령어 유닛 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerExportCommand } from '../../../../src/cli/commands/export.js';
import { Command } from 'commander';

describe('registerExportCommand', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    vi.clearAllMocks();
  });

  it('export 명령어를 등록한다', () => {
    registerExportCommand(program);

    const exportCommand = program.commands.find(cmd => cmd.name() === 'export');
    expect(exportCommand).toBeDefined();
  });

  it('export 명령어에 필요한 옵션이 있다', () => {
    registerExportCommand(program);

    const exportCommand = program.commands.find(cmd => cmd.name() === 'export');
    expect(exportCommand).toBeDefined();

    const options = exportCommand?.options.map(opt => opt.long);
    expect(options).toContain('--format');
    expect(options).toContain('--output');
    expect(options).toContain('--theme');
    expect(options).toContain('--all');
  });

  it('export 명령어에 --toc 옵션이 있다', () => {
    registerExportCommand(program);

    const exportCommand = program.commands.find(cmd => cmd.name() === 'export');
    expect(exportCommand).toBeDefined();

    const options = exportCommand?.options.map(opt => opt.long);
    expect(options).toContain('--toc');
  });

  it('export 명령어에 --include-constitution 옵션이 있다', () => {
    registerExportCommand(program);

    const exportCommand = program.commands.find(cmd => cmd.name() === 'export');
    expect(exportCommand).toBeDefined();

    const options = exportCommand?.options.map(opt => opt.long);
    expect(options).toContain('--include-constitution');
  });
});
