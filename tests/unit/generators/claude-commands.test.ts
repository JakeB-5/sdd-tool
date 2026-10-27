/**
 * Claude 슬래시 커맨드 생성기 테스트
 */
import { describe, it, expect } from 'vitest';
import { generateClaudeCommands } from '../../../src/generators/claude-commands.js';

describe('generateClaudeCommands', () => {
  it('슬래시 커맨드 배열을 반환한다', () => {
    const commands = generateClaudeCommands();

    expect(Array.isArray(commands)).toBe(true);
    expect(commands.length).toBeGreaterThan(0);
  });

  it('각 커맨드는 name과 content를 가진다', () => {
    const commands = generateClaudeCommands();

    for (const cmd of commands) {
      expect(cmd).toHaveProperty('name');
      expect(cmd).toHaveProperty('content');
      expect(typeof cmd.name).toBe('string');
      expect(typeof cmd.content).toBe('string');
      expect(cmd.name.length).toBeGreaterThan(0);
      expect(cmd.content.length).toBeGreaterThan(0);
    }
  });

  it('sdd.start 커맨드가 포함된다', () => {
    const commands = generateClaudeCommands();
    const startCmd = commands.find((c) => c.name === 'sdd.start');

    expect(startCmd).toBeDefined();
    expect(startCmd?.content).toContain('SDD');
  });

  it('폐기된 sdd.new / sdd.change 커맨드는 생성하지 않는다', () => {
    const names = generateClaudeCommands().map((c) => c.name);

    expect(names).not.toContain('sdd.new');
    expect(names).not.toContain('sdd.change');
  });

  it('레거시 커맨드 본문이 폐기된 커맨드로 안내하지 않는다', () => {
    // sdd.reverse is owned by the separate reverse rework.
    for (const cmd of generateClaudeCommands().filter((c) => c.name !== 'sdd.reverse')) {
      expect(cmd.content).not.toMatch(/\/sdd\.(new|change)\b/);
    }
  });

  it('sdd.spec 커맨드는 실제 변경 제안 디렉토리 구조를 안내한다', () => {
    const specCmd = generateClaudeCommands().find((c) => c.name === 'sdd.spec');

    expect(specCmd?.content).toContain('.sdd/changes/CHG-xxx/proposal.md');
    expect(specCmd?.content).not.toContain('CHG-xxx.md');
  });

  it('sdd.validate 커맨드가 포함된다', () => {
    const commands = generateClaudeCommands();
    const validateCmd = commands.find((c) => c.name === 'sdd.validate');

    expect(validateCmd).toBeDefined();
    expect(validateCmd?.content).toContain('검증');
  });

  it('sdd.constitution 커맨드가 포함된다', () => {
    const commands = generateClaudeCommands();
    const constCmd = commands.find((c) => c.name === 'sdd.constitution');

    expect(constCmd).toBeDefined();
    expect(constCmd?.content).toContain('Constitution');
  });

  it('sdd.analyze 커맨드가 포함된다', () => {
    const commands = generateClaudeCommands();
    const analyzeCmd = commands.find((c) => c.name === 'sdd.analyze');

    expect(analyzeCmd).toBeDefined();
    expect(analyzeCmd?.content).toContain('분석');
  });

  it('sdd.status 커맨드가 포함된다', () => {
    const commands = generateClaudeCommands();
    const statusCmd = commands.find((c) => c.name === 'sdd.status');

    expect(statusCmd).toBeDefined();
    expect(statusCmd?.content).toContain('상태');
  });

  it('sdd.plan 커맨드가 포함된다', () => {
    const commands = generateClaudeCommands();
    const planCmd = commands.find((c) => c.name === 'sdd.plan');

    expect(planCmd).toBeDefined();
    expect(planCmd?.content).toContain('계획');
  });

  it('sdd.tasks 커맨드가 포함된다', () => {
    const commands = generateClaudeCommands();
    const tasksCmd = commands.find((c) => c.name === 'sdd.tasks');

    expect(tasksCmd).toBeDefined();
    expect(tasksCmd?.content).toContain('작업');
  });

  it('sdd.transition 커맨드가 포함된다', () => {
    const commands = generateClaudeCommands();
    const transitionCmd = commands.find((c) => c.name === 'sdd.transition');

    expect(transitionCmd).toBeDefined();
    expect(transitionCmd?.content).toContain('전환');
  });

  it('커맨드 이름은 sdd.로 시작한다', () => {
    const commands = generateClaudeCommands();

    for (const cmd of commands) {
      expect(cmd.name.startsWith('sdd.')).toBe(true);
    }
  });

  it('커맨드 내용에 ## 섹션이 포함된다', () => {
    const commands = generateClaudeCommands();

    for (const cmd of commands) {
      // 대부분의 커맨드는 마크다운 형식이어야 함
      expect(cmd.content).toMatch(/##|명령어|지시사항|사용법/);
    }
  });
});
