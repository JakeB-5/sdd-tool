/**
 * Claude Skills 2.0 definitions test — validates the 32 skill bundle.
 */
import { describe, it, expect } from 'vitest';
import { generateClaudeSkills } from '../../../../src/generators/claude-skills/index.js';

// Korean (Hangul) Unicode range, used for the "English only" enforcement.
const KOREAN_REGEX = /[\uAC00-\uD7AF]/;

describe('generateClaudeSkills', () => {
  const skills = generateClaudeSkills();

  it('returns all 32 skills', () => {
    expect(skills.length).toBe(32);
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

  it('sdd-watch uses context: manual-invoke-only', () => {
    const watch = skills.find((s) => s.name === 'sdd-watch');
    expect(watch).toBeDefined();
    expect(watch!.context).toBe('manual-invoke-only');
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
