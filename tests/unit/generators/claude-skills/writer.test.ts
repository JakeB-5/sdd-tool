/**
 * SkillDefinition serializer tests.
 */
import { describe, it, expect } from 'vitest';
import matter from 'gray-matter';
import { serializeSkill } from '../../../../src/generators/claude-skills/writer.js';
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

  it('omits allowed-tools when the array is empty', () => {
    const out = serializeSkill({ ...minimal(), allowedTools: [] });
    const { data } = matter(out);
    expect(data).not.toHaveProperty('allowed-tools');
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
