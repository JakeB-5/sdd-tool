/**
 * Claude Code skill definitions test — validates the 30 skill bundle.
 */
import { describe, it, expect } from 'vitest';
import { generateClaudeSkills } from '../../../../src/generators/claude-skills/index.js';

// Korean (Hangul) Unicode range, used for the "English only" enforcement.
const KOREAN_REGEX = /[\uAC00-\uD7AF]/;

// sdd-reverse is owned by the separate reverse rework; its description and
// body are checked there.
const REVERSE_SKILL = 'sdd-reverse';

describe('generateClaudeSkills', () => {
  const skills = generateClaudeSkills();

  it('returns all 30 skills', () => {
    expect(skills.length).toBe(30);
  });

  it('does not include the removed deprecated skills', () => {
    const names = skills.map((s) => s.name);
    expect(names).not.toContain('sdd-new');
    expect(names).not.toContain('sdd-change');
  });

  it('no skill routes users to the removed deprecated skills', () => {
    for (const skill of skills.filter((s) => s.name !== REVERSE_SKILL)) {
      expect(skill.content).not.toMatch(/\/sdd[-.](new|change)\b/);
    }
  });

  it('every description states what it does and when to use it, within 300 chars', () => {
    for (const skill of skills.filter((s) => s.name !== REVERSE_SKILL)) {
      expect(skill.description, skill.name).toMatch(/\bUse (when|after|before)\b/);
      expect(skill.description.length, skill.name).toBeLessThanOrEqual(300);
    }
  });

  it('context is either unset or fork (no inline / manual-invoke-only)', () => {
    for (const skill of skills) {
      expect([undefined, 'fork']).toContain(skill.context);
    }
  });

  it('each allowed-tools entry is a single rule (no comma-combined Bash rules)', () => {
    for (const skill of skills) {
      for (const tool of skill.allowedTools ?? []) {
        expect(tool, skill.name).not.toMatch(/^Bash\([^)]*,[^)]*\)$/);
      }
    }
  });

  it('no skill pre-approves every sdd command with a blanket Bash rule', () => {
    for (const skill of skills) {
      for (const tool of skill.allowedTools ?? []) {
        expect(tool, skill.name).not.toMatch(/^Bash\(sdd ?\*\)$/);
      }
    }
  });

  it('skills that read $ARGUMENTS declare an argument-hint', () => {
    for (const skill of skills.filter((s) => s.content.includes('$ARGUMENTS'))) {
      expect(skill.argumentHint, skill.name).toBeTruthy();
    }
  });

  it('sdd-spec points to the real change proposal layout', () => {
    const spec = skills.find((s) => s.name === 'sdd-spec')!;
    expect(spec.content).toContain('.sdd/changes/CHG-xxx/proposal.md');
    expect(spec.content).not.toContain('CHG-xxx.md');
  });

  it('every skill has a kebab-case name starting with sdd-', () => {
    for (const skill of skills) {
      expect(skill.name).toMatch(/^sdd-[a-z][a-z0-9-]*$/);
    }
  });

  it('every skill has a non-empty English description', () => {
    for (const skill of skills) {
      expect(skill.description.length).toBeGreaterThan(0);
      expect(skill.description).not.toMatch(KOREAN_REGEX);
    }
  });

  it('every skill has a non-empty content body', () => {
    for (const skill of skills) {
      expect(skill.content.length).toBeGreaterThan(0);
    }
  });

  it('every skill content is English only (no Korean characters)', () => {
    for (const skill of skills) {
      expect(skill.content).not.toMatch(KOREAN_REGEX);
    }
  });

  it('every skill declares allowed-tools', () => {
    for (const skill of skills) {
      expect(Array.isArray(skill.allowedTools)).toBe(true);
      expect(skill.allowedTools!.length).toBeGreaterThan(0);
    }
  });

  it('exactly 7 skills use context: fork', () => {
    const forkSkills = skills.filter((s) => s.context === 'fork').map((s) => s.name);
    expect(forkSkills.sort()).toEqual(
      [
        'sdd-analyze',
        'sdd-impact',
        'sdd-report',
        'sdd-research',
        'sdd-reverse',
        'sdd-search',
        'sdd-sync',
      ].sort()
    );
  });

  it('sdd-watch is manual-only via disable-model-invocation (no context field)', () => {
    const watch = skills.find((s) => s.name === 'sdd-watch');
    expect(watch).toBeDefined();
    expect(watch!.context).toBeUndefined();
    expect(watch!.disableModelInvocation).toBe(true);
  });

  it('5 utils skills have disableModelInvocation: true', () => {
    const disabled = skills
      .filter((s) => s.disableModelInvocation === true)
      .map((s) => s.name)
      .sort();
    expect(disabled).toEqual(
      ['sdd-chat', 'sdd-cicd', 'sdd-guide', 'sdd-migrate', 'sdd-watch'].sort()
    );
  });

  it('skill names are unique', () => {
    const names = skills.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('glossary: no "reverse engineering" terminology', () => {
    for (const skill of skills) {
      expect(skill.content.toLowerCase()).not.toContain('reverse engineering');
      expect(skill.description.toLowerCase()).not.toContain('reverse engineering');
    }
  });

  it('glossary: description uses "spec" over "specification"', () => {
    for (const skill of skills) {
      expect(skill.description.toLowerCase()).not.toContain('specification');
    }
  });
});
