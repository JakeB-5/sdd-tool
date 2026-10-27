/**
 * Shared subagent definitions and per-target serializer tests.
 */
import { describe, it, expect } from 'vitest';
import matter from 'gray-matter';
import { parse as parseToml } from 'smol-toml';
import {
  generateAgents,
  serializeClaudeAgent,
  serializeCodexAgent,
  tomlString,
} from '../../../../src/generators/agents/index.js';

// Korean (Hangul) Unicode range, used for the "English only" enforcement.
const KOREAN_REGEX = /[\uAC00-\uD7AF]/;
// Built-in Codex agent names that a project agent would silently override.
const CODEX_BUILT_INS = ['default', 'worker', 'explorer'];

describe('generateAgents', () => {
  const agents = generateAgents();

  it('returns the spec reviewer, implementer, and impact analyst', () => {
    expect(agents.map((a) => a.name)).toEqual([
      'sdd-spec-reviewer',
      'sdd-implementer',
      'sdd-impact-analyst',
    ]);
  });

  it('uses sdd- prefixed kebab-case names that do not shadow built-ins', () => {
    for (const agent of agents) {
      expect(agent.name).toMatch(/^sdd-[a-z][a-z0-9-]*$/);
      expect(CODEX_BUILT_INS).not.toContain(agent.name);
    }
  });

  it('has English descriptions and instructions', () => {
    for (const agent of agents) {
      expect(agent.description.length, agent.name).toBeGreaterThan(0);
      expect(agent.description.length, agent.name).toBeLessThanOrEqual(300);
      expect(agent.description, agent.name).not.toMatch(KOREAN_REGEX);
      expect(agent.instructions, agent.name).not.toMatch(KOREAN_REGEX);
    }
  });

  it('read-only agents state that they never edit files', () => {
    for (const agent of agents.filter((a) => a.access === 'read-only')) {
      expect(agent.instructions, agent.name).toMatch(/read-only: never create, edit/);
    }
  });
});

describe('serializeClaudeAgent', () => {
  it('writes valid YAML frontmatter with name, description, tools, and model', () => {
    for (const agent of generateAgents()) {
      const parsed = matter(serializeClaudeAgent(agent));
      expect(parsed.data.name).toBe(agent.name);
      expect(parsed.data.description).toBe(agent.description);
      expect(parsed.data.model).toBe('inherit');
      expect(typeof parsed.data.tools).toBe('string');
      expect(parsed.content.trim()).toBe(agent.instructions.trim());
    }
  });

  it('gives read-only agents no edit tools and the implementer Edit/Write', () => {
    const tools = Object.fromEntries(
      generateAgents().map((agent) => [
        agent.name,
        String(matter(serializeClaudeAgent(agent)).data.tools).split(', '),
      ])
    );
    expect(tools['sdd-spec-reviewer']).toEqual(['Read', 'Grep', 'Glob', 'Bash']);
    expect(tools['sdd-impact-analyst']).toEqual(['Read', 'Grep', 'Glob', 'Bash']);
    expect(tools['sdd-implementer']).toEqual(['Read', 'Grep', 'Glob', 'Bash', 'Edit', 'Write']);
  });
});

describe('serializeCodexAgent', () => {
  it('produces TOML with exactly the required string keys', () => {
    for (const agent of generateAgents()) {
      const parsed = parseToml(serializeCodexAgent(agent));
      expect(Object.keys(parsed).sort()).toEqual(['description', 'developer_instructions', 'name']);
      expect(parsed.name).toBe(agent.name);
      expect(parsed.description).toBe(agent.description);
      expect(parsed.developer_instructions).toBe(agent.instructions.trim() + '\n');
    }
  });

  it('never sets keys Codex does not allow per agent', () => {
    for (const agent of generateAgents()) {
      const out = serializeCodexAgent(agent);
      expect(out).not.toMatch(/^(sandbox_mode|approval_policy|mcp_servers)\b/m);
    }
  });

  it('rewrites skill references to Codex notation', () => {
    const out = serializeCodexAgent({
      name: 'sdd-x',
      description: 'Use after /sdd-plan.',
      access: 'read-only',
      instructions: 'Then run /sdd-validate on `.claude/skills/sdd-validate`.',
    });
    const parsed = parseToml(out);
    expect(parsed.description).toBe('Use after $sdd-plan.');
    expect(parsed.developer_instructions).toBe('Then run $sdd-validate on `.claude/skills/sdd-validate`.');
  });
});

describe('tomlString', () => {
  const roundTrip = (value: string): unknown => parseToml(`v = ${tomlString(value)}\n`).v;

  it('round-trips single-line strings with quotes, backslashes, and control characters', () => {
    for (const value of ['plain', 'say "hi"', 'C:\\path\\x', 'tab\there', 'bell\u0007', "it's"]) {
      expect(roundTrip(value)).toBe(value);
    }
  });

  it('uses a literal multi-line string when safe', () => {
    const value = 'line 1 with "quotes" and \\backslash\nline 2\n';
    expect(tomlString(value).startsWith("'''\n")).toBe(true);
    expect(roundTrip(value)).toBe(value);
  });

  it('falls back to an escaped multi-line basic string', () => {
    for (const value of ["has ''' inside\nnext\n", 'carriage\r\nreturn\n', 'bell\u0007 "quoted" \\ \nend\n']) {
      expect(tomlString(value).startsWith('"""\n')).toBe(true);
      expect(roundTrip(value)).toBe(value);
    }
  });

  it('appends a trailing newline to multi-line values without one', () => {
    expect(roundTrip('a\nb')).toBe('a\nb\n');
  });
});
