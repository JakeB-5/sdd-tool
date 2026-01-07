/**
 * prompt 명령어 유닛 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerPromptCommand } from '../../../../src/cli/commands/prompt.js';
import { Command } from 'commander';

// prompts 모킹
vi.mock('../../../../src/prompts/index.js', () => ({
  getPrompt: vi.fn(),
  getAvailableCommands: vi.fn(),
}));

import { getPrompt, getAvailableCommands } from '../../../../src/prompts/index.js';

describe('registerPromptCommand', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    vi.clearAllMocks();
  });

  it('prompt 명령어를 등록한다', () => {
    registerPromptCommand(program);

    const promptCommand = program.commands.find(cmd => cmd.name() === 'prompt');
    expect(promptCommand).toBeDefined();
  });

  it('--list 옵션이 있다', () => {
    registerPromptCommand(program);

    const promptCommand = program.commands.find(cmd => cmd.name() === 'prompt');
    expect(promptCommand).toBeDefined();

    const options = promptCommand?.options.map(opt => opt.long);
    expect(options).toContain('--list');
  });
});

describe('getPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('존재하는 명령어의 프롬프트를 반환한다', () => {
    vi.mocked(getPrompt).mockReturnValue('# Change 프롬프트\n내용...');

    const result = getPrompt('change');

    expect(result).toBeDefined();
    expect(result).toContain('Change');
  });

  it('존재하지 않는 명령어는 undefined를 반환한다', () => {
    vi.mocked(getPrompt).mockReturnValue(undefined);

    const result = getPrompt('nonexistent');

    expect(result).toBeUndefined();
  });
});

describe('getAvailableCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('사용 가능한 명령어 목록을 반환한다', () => {
    vi.mocked(getAvailableCommands).mockReturnValue([
      'change',
      'new',
      'plan',
      'tasks',
      'implement',
    ]);

    const commands = getAvailableCommands();

    expect(commands).toBeInstanceOf(Array);
    expect(commands.length).toBeGreaterThan(0);
    expect(commands).toContain('change');
  });
});
