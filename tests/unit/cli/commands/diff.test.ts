/**
 * diff 명령어 유닛 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerDiffCommand } from '../../../../src/cli/commands/diff.js';
import { Command } from 'commander';

describe('registerDiffCommand', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    vi.clearAllMocks();
  });

  it('diff 명령어를 등록한다', () => {
    registerDiffCommand(program);

    const diffCommand = program.commands.find(cmd => cmd.name() === 'diff');
    expect(diffCommand).toBeDefined();
  });

  it('diff 명령어에 필요한 옵션이 있다', () => {
    registerDiffCommand(program);

    const diffCommand = program.commands.find(cmd => cmd.name() === 'diff');
    expect(diffCommand).toBeDefined();

    const options = diffCommand?.options.map(opt => opt.long);
    expect(options).toContain('--staged');
    expect(options).toContain('--stat');
    expect(options).toContain('--name-only');
    expect(options).toContain('--json');
  });

  it('diff 명령어에 --spec 옵션이 있다', () => {
    registerDiffCommand(program);

    const diffCommand = program.commands.find(cmd => cmd.name() === 'diff');
    expect(diffCommand).toBeDefined();

    const options = diffCommand?.options.map(opt => opt.long);
    expect(options).toContain('--spec');
  });
});
