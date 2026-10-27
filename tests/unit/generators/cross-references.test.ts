/**
 * Cross-reference guard — every `/sdd-x` (Claude) or `$sdd-x` (Codex) skill
 * name, and `/sdd.x` legacy command name, mentioned to users must be
 * something `sdd init` generates.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateClaudeSkills, serializeCodexSkill } from '../../../src/generators/claude-skills/index.js';
import { generateClaudeCommands } from '../../../src/generators/claude-commands.js';
import { generateAgentsMd } from '../../../src/generators/agents-md.js';
import { generateAgents, serializeCodexAgent } from '../../../src/generators/agents/index.js';
import { PROMPTS } from '../../../src/prompts/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const skillNames = new Set(generateClaudeSkills().map((s) => s.name));
const commandNames = new Set(generateClaudeCommands().map((c) => c.name));

// `/sdd-x` / `/sdd.x` not preceded by a path segment (e.g. `.claude/skills/sdd-x`).
const SKILL_REF = /(?<![\w./~:-])\/(sdd-[a-z][a-z0-9-]*[a-z0-9])/g;
const COMMAND_REF = /(?<![\w./-])\/(sdd\.[a-z][a-z0-9-]*[a-z0-9])/g;
// Codex skill invocation `$sdd-x`.
const CODEX_SKILL_REF = /(?<![\w./$-])\$(sdd-[a-z][a-z0-9-]*[a-z0-9])/g;

function refs(text: string, pattern: RegExp): string[] {
  return [...text.matchAll(pattern)].map((m) => m[1]);
}

interface Source {
  label: string;
  text: string;
  // Legacy command bodies may mention dot-notation commands.
  legacy: boolean;
}

function sources(): Source[] {
  const list: Source[] = [];

  for (const skill of generateClaudeSkills()) {
    list.push({
      label: `skill ${skill.name}`,
      text: [skill.description, skill.argumentHint ?? '', skill.content].join('\n'),
      legacy: false,
    });
  }

  for (const cmd of generateClaudeCommands()) {
    list.push({ label: `command ${cmd.name}`, text: cmd.content, legacy: true });
  }

  list.push({ label: 'AGENTS.md', text: generateAgentsMd({ projectName: 'demo' }), legacy: false });

  for (const agent of generateAgents()) {
    list.push({
      label: `agent ${agent.name}`,
      text: [agent.description, agent.instructions].join('\n'),
      legacy: false,
    });
  }

  for (const [name, prompt] of Object.entries(PROMPTS)) {
    list.push({ label: `prompt ${name}`, text: prompt, legacy: false });
  }

  // CLI output strings that point users at skills.
  for (const file of ['init', 'start', 'transition', 'prompt']) {
    const rel = `src/cli/commands/${file}.ts`;
    list.push({ label: rel, text: readFileSync(path.join(repoRoot, rel), 'utf-8'), legacy: false });
  }

  return list;
}

describe('skill and command cross-references', () => {
  for (const source of sources()) {
    it(`${source.label}: every /sdd-* reference is a generated skill`, () => {
      const unknown = refs(source.text, SKILL_REF).filter((name) => !skillNames.has(name));
      expect(unknown).toEqual([]);
    });

    it(`${source.label}: every $sdd-* reference is a generated skill`, () => {
      const unknown = refs(source.text, CODEX_SKILL_REF).filter((name) => !skillNames.has(name));
      expect(unknown).toEqual([]);
    });

    it(`${source.label}: every /sdd.* reference is a generated legacy command`, () => {
      const found = refs(source.text, COMMAND_REF);
      if (source.legacy) {
        expect(found.filter((name) => !commandNames.has(name))).toEqual([]);
      } else {
        // Outside legacy command bodies, only skill names are user-facing.
        expect(found).toEqual([]);
      }
    });
  }

  it('the matcher ignores file paths and catches stale names', () => {
    expect(refs('see `.claude/skills/sdd-start/SKILL.md`', SKILL_REF)).toEqual([]);
    expect(refs('run `/sdd-new` then /sdd-plan.', SKILL_REF)).toEqual(['sdd-new', 'sdd-plan']);
    expect(refs('.claude/commands/sdd.start.md or /sdd.change', COMMAND_REF)).toEqual(['sdd.change']);
    expect(refs('run `$sdd-new` then $sdd-plan, not a$sdd-x', CODEX_SKILL_REF)).toEqual([
      'sdd-new',
      'sdd-plan',
    ]);
  });
});

describe('Codex output cross-references', () => {
  const codexSources: { label: string; text: string }[] = [
    ...generateClaudeSkills().map((skill) => ({
      label: `codex skill ${skill.name}`,
      text: serializeCodexSkill(skill),
    })),
    ...generateAgents().map((agent) => ({
      label: `codex agent ${agent.name}`,
      text: serializeCodexAgent(agent),
    })),
  ];

  for (const source of codexSources) {
    it(`${source.label}: every $sdd-* reference is a generated skill`, () => {
      const unknown = refs(source.text, CODEX_SKILL_REF).filter((name) => !skillNames.has(name));
      expect(unknown).toEqual([]);
    });

    it(`${source.label}: no Claude /sdd-* notation outside paths`, () => {
      expect(refs(source.text, SKILL_REF)).toEqual([]);
      expect(refs(source.text, COMMAND_REF)).toEqual([]);
    });

    it(`${source.label}: no Claude $ARGUMENTS substitution`, () => {
      expect(source.text).not.toContain('$ARGUMENTS');
    });
  }

  it('skills that reference other skills keep those references in Codex notation', () => {
    const start = generateClaudeSkills().find((s) => s.name === 'sdd-start')!;
    expect(refs(serializeCodexSkill(start), CODEX_SKILL_REF).length).toBeGreaterThan(0);
  });
});
