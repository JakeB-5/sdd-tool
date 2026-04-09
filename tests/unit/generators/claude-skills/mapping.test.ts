/**
 * Drift test — the set of Korean slash commands and English skills must
 * stay in lockstep. A slash command named `sdd.foo` must have a matching
 * skill `sdd-foo` and vice versa.
 */
import { describe, it, expect } from 'vitest';
import { generateClaudeCommands } from '../../../../src/generators/claude-commands.js';
import { generateClaudeSkills } from '../../../../src/generators/claude-skills/index.js';

/** Convert slash command name (sdd.start) to skill name (sdd-start). */
function commandNameToSkillName(cmdName: string): string {
  return cmdName.replace(/\./g, '-');
}

describe('slash command ↔ skill mapping', () => {
  const commands = generateClaudeCommands();
  const skills = generateClaudeSkills();
  const commandSkillNames = new Set(
    commands.map((c) => commandNameToSkillName(c.name))
  );
  const skillNames = new Set(skills.map((s) => s.name));

  it('has the same number of commands and skills', () => {
    expect(commands.length).toBe(skills.length);
  });

  it('every slash command has a matching skill', () => {
    const missing: string[] = [];
    for (const cmdName of commandSkillNames) {
      if (!skillNames.has(cmdName)) {
        missing.push(cmdName);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every skill has a matching slash command', () => {
    const missing: string[] = [];
    for (const skillName of skillNames) {
      if (!commandSkillNames.has(skillName)) {
        missing.push(skillName);
      }
    }
    expect(missing).toEqual([]);
  });

  it('commands and skills form an identical name set (no drift)', () => {
    const cmdArr = Array.from(commandSkillNames).sort();
    const skillArr = Array.from(skillNames).sort();
    expect(cmdArr).toEqual(skillArr);
  });
});
