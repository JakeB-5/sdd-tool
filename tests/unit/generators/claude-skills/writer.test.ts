/**
 * SkillDefinition serializer tests.
 */
import { describe, it, expect } from 'vitest';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import {
  serializeSkill,
  serializeCodexSkill,
  serializeCodexSkillMetadata,
  toCodexInvocations,
} from '../../../../src/generators/claude-skills/writer.js';
import { generateClaudeSkills } from '../../../../src/generators/claude-skills/index.js';
import type { SkillDefinition } from '../../../../src/generators/claude-skills/types.js';

function minimal(): SkillDefinition {
  return {
    name: 'sdd-sample',
    description: 'A sample skill for testing',
    content: '# Sample\n\nBody text.',
  };
}

describe('serializeSkill', () => {
  it('emits name and description in frontmatter', () => {
    const out = serializeSkill(minimal());
    const { data } = matter(out);
    expect(data.name).toBe('sdd-sample');
    expect(data.description).toBe('A sample skill for testing');
  });

  it('omits unset optional fields from frontmatter', () => {
    const out = serializeSkill(minimal());
    const { data } = matter(out);
    expect(data).not.toHaveProperty('allowed-tools');
    expect(data).not.toHaveProperty('context');
    expect(data).not.toHaveProperty('hooks');
    expect(data).not.toHaveProperty('agent');
    expect(data).not.toHaveProperty('user-invocable');
    expect(data).not.toHaveProperty('disable-model-invocation');
  });

  it('emits allowed-tools as an array', () => {
    const out = serializeSkill({
      ...minimal(),
      allowedTools: ['Read', 'Write', 'Bash(sdd *)'],
    });
    const { data } = matter(out);
    expect(data['allowed-tools']).toEqual(['Read', 'Write', 'Bash(sdd *)']);
  });

  it('emits argument-hint when set', () => {
    const out = serializeSkill({ ...minimal(), argumentHint: '[scan|review] [args]' });
    const { data } = matter(out);
    expect(data['argument-hint']).toBe('[scan|review] [args]');
    expect(matter(serializeSkill(minimal())).data).not.toHaveProperty('argument-hint');
  });

  it('omits allowed-tools when the array is empty', () => {
    const out = serializeSkill({ ...minimal(), allowedTools: [] });
    const { data } = matter(out);
    expect(data).not.toHaveProperty('allowed-tools');
  });

  it('emits argument-hint when set', () => {
    const out = serializeSkill({ ...minimal(), argumentHint: '<feature-id>' });
    const { data } = matter(out);
    expect(data['argument-hint']).toBe('<feature-id>');
  });

  it('emits context when set', () => {
    const out = serializeSkill({ ...minimal(), context: 'fork' });
    const { data } = matter(out);
    expect(data.context).toBe('fork');
  });

  it('emits disable-model-invocation only when true', () => {
    const withFlag = matter(
      serializeSkill({ ...minimal(), disableModelInvocation: true })
    );
    expect(withFlag.data['disable-model-invocation']).toBe(true);

    const withoutFlag = matter(
      serializeSkill({ ...minimal(), disableModelInvocation: false })
    );
    expect(withoutFlag.data).not.toHaveProperty('disable-model-invocation');
  });

  it('emits user-invocable only when false', () => {
    const withFalse = matter(
      serializeSkill({ ...minimal(), userInvocable: false })
    );
    expect(withFalse.data['user-invocable']).toBe(false);

    const withTrue = matter(
      serializeSkill({ ...minimal(), userInvocable: true })
    );
    expect(withTrue.data).not.toHaveProperty('user-invocable');
  });

  it('emits hooks when before or after is set', () => {
    const out = serializeSkill({
      ...minimal(),
      hooks: { before: './pre.sh', after: './post.sh' },
    });
    const { data } = matter(out);
    expect(data.hooks).toEqual({ before: './pre.sh', after: './post.sh' });
  });

  it('omits hooks when both before and after are empty', () => {
    const out = serializeSkill({ ...minimal(), hooks: {} });
    const { data } = matter(out);
    expect(data).not.toHaveProperty('hooks');
  });

  it('includes only the set hook fields', () => {
    const out = serializeSkill({
      ...minimal(),
      hooks: { before: './pre.sh' },
    });
    const { data } = matter(out);
    expect(data.hooks).toEqual({ before: './pre.sh' });
  });

  it('preserves body content', () => {
    const out = serializeSkill({
      ...minimal(),
      content: '# Heading\n\n- list item 1\n- list item 2\n',
    });
    const { content } = matter(out);
    expect(content).toContain('# Heading');
    expect(content).toContain('list item 1');
  });

  it('handles bodies with special YAML characters', () => {
    const body = [
      '# Title',
      '',
      'Some text with `code`, "quotes", and: colons.',
      '',
      '```bash',
      'sdd validate --strict',
      '```',
      '',
    ].join('\n');
    const out = serializeSkill({ ...minimal(), content: body });
    const parsed = matter(out);
    expect(parsed.content).toContain('`code`');
    expect(parsed.content).toContain('"quotes"');
    expect(parsed.content).toContain('sdd validate --strict');
    expect(parsed.data.name).toBe('sdd-sample');
  });

  it('trims leading whitespace from body before serialization', () => {
    const out = serializeSkill({
      ...minimal(),
      content: '\n\n# Heading\n\nContent.\n\n\n',
    });
    const { content } = matter(out);
    expect(content.trim().startsWith('# Heading')).toBe(true);
  });
});

describe('toCodexInvocations', () => {
  it('rewrites skill references and leaves paths and URLs alone', () => {
    expect(toCodexInvocations('Run `/sdd-spec auth/login`, then /sdd-plan.')).toBe(
      'Run `$sdd-spec auth/login`, then $sdd-plan.'
    );
    expect(toCodexInvocations('/sdd-start or sdd start')).toBe('$sdd-start or sdd start');
    expect(toCodexInvocations('(/sdd-tasks)')).toBe('($sdd-tasks)');
    const untouched = [
      '.claude/skills/sdd-start/SKILL.md',
      'https://example.com/sdd-start',
      'src/sdd-spec.ts',
      '$sdd-spec',
      '/sdd.start',
      '~/sdd-foo',
      'C:/sdd-foo',
    ].join('\n');
    expect(toCodexInvocations(untouched)).toBe(untouched);
  });

  it('keeps line lengths so ASCII diagrams stay aligned', () => {
    const line = '│  1. Start ──────> /sdd-start or sdd start       │';
    expect(toCodexInvocations(line)).toHaveLength(line.length);
  });
});

describe('serializeCodexSkill', () => {
  it('emits only name and description in frontmatter', () => {
    const out = serializeCodexSkill({
      ...minimal(),
      argumentHint: '<feature-id>',
      allowedTools: ['Read', 'Bash(sdd validate*)'],
      context: 'fork',
      hooks: { before: './pre.sh' },
      agent: 'x',
      userInvocable: false,
      disableModelInvocation: true,
    });
    const { data } = matter(out);
    expect(Object.keys(data).sort()).toEqual(['description', 'name']);
    expect(data.name).toBe('sdd-sample');
  });

  it('rewrites skill references in the body and description', () => {
    const out = serializeCodexSkill({
      ...minimal(),
      description: 'Use after /sdd-plan.',
      content: '# T\n\nNext: `/sdd-tasks`. See `.claude/skills/sdd-tasks/SKILL.md`.',
    });
    const parsed = matter(out);
    expect(parsed.data.description).toBe('Use after $sdd-plan.');
    expect(parsed.content).toContain('`$sdd-tasks`');
    expect(parsed.content).toContain('.claude/skills/sdd-tasks/SKILL.md');
    expect(parsed.content).not.toMatch(/(?<![\w./$-])\/sdd-/);
  });

  it('replaces $ARGUMENTS with placeholder wording', () => {
    const out = serializeCodexSkill({
      ...minimal(),
      content: 'Use `$ARGUMENTS` if given.\n\n```bash\nsdd watch $ARGUMENTS\n```',
    });
    expect(out).not.toContain('$ARGUMENTS');
    expect(out).toContain('Use the arguments the user gave if given.');
    expect(out).toContain('sdd watch <user-arguments>');
    // Claude output keeps the substitution Claude Code expands
    expect(serializeSkill({ ...minimal(), content: 'sdd watch $ARGUMENTS' })).toContain('$ARGUMENTS');
  });

  it('no generated Codex skill contains $ARGUMENTS', () => {
    const users = generateClaudeSkills().filter((skill) => skill.content.includes('$ARGUMENTS'));
    expect(users.length).toBeGreaterThan(0);
    for (const skill of generateClaudeSkills()) {
      expect(serializeCodexSkill(skill), skill.name).not.toContain('$ARGUMENTS');
    }
  });

  it('Codex sdd-prepare states that sdd prepare targets the Claude layout and names the Codex equivalents', () => {
    const prepare = generateClaudeSkills().find((skill) => skill.name === 'sdd-prepare')!;
    const out = serializeCodexSkill(prepare);
    expect(out).toContain('currently targets only the Claude Code layout');
    expect(out).toContain('.codex/agents/<name>.toml');
    expect(out).toContain('.agents/skills/<name>/SKILL.md');
  });

  it('every generated Codex skill has no Claude skill notation outside paths', () => {
    for (const skill of generateClaudeSkills()) {
      const out = serializeCodexSkill(skill);
      expect(out, skill.name).not.toMatch(/(?<![\w./$-])\/sdd-[a-z]/);
      expect(out, skill.name).not.toMatch(/Claude Code sub-agents|AskUserQuestion|Read \/ Glob/);
    }
  });
});

describe('serializeCodexSkillMetadata', () => {
  it('returns null for skills that allow implicit invocation', () => {
    expect(serializeCodexSkillMetadata(minimal())).toBeNull();
    expect(serializeCodexSkillMetadata({ ...minimal(), disableModelInvocation: false })).toBeNull();
  });

  it('disables implicit invocation for manual-only skills', () => {
    const out = serializeCodexSkillMetadata({ ...minimal(), name: 'sdd-data-model', disableModelInvocation: true });
    expect(out).not.toBeNull();
    expect(parseYaml(out!)).toEqual({
      interface: { display_name: 'SDD Data Model' },
      policy: { allow_implicit_invocation: false },
    });
  });

  it('is emitted exactly for the manual-only generated skills', () => {
    const withMetadata = generateClaudeSkills()
      .filter((skill) => serializeCodexSkillMetadata(skill) !== null)
      .map((skill) => skill.name)
      .sort();
    expect(withMetadata).toEqual(
      generateClaudeSkills()
        .filter((skill) => skill.disableModelInvocation === true)
        .map((skill) => skill.name)
        .sort()
    );
  });
});
