/**
 * Cross-reference guard — every `/sdd-x` skill name (and `/sdd.x` legacy
 * command name) mentioned to users must be something `sdd init` generates.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateClaudeSkills } from '../../../src/generators/claude-skills/index.js';
import { generateClaudeCommands } from '../../../src/generators/claude-commands.js';
import { generateAgentsMd } from '../../../src/generators/agents-md.js';
import { PROMPTS } from '../../../src/prompts/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

// Note: the reverse skill is reworked on feat/reverse-ai-driven; remove this
// exclusion when that branch is merged.
const EXCLUDED_SKILLS = new Set(['sdd-reverse']);
const EXCLUDED_COMMANDS = new Set(['sdd.reverse']);

const skillNames = new Set(generateClaudeSkills().map((s) => s.name));
const commandNames = new Set(generateClaudeCommands().map((c) => c.name));

// `/sdd-x` / `/sdd.x` not preceded by a path segment (e.g. `.claude/skills/sdd-x`).
const SKILL_REF = /(?<![\w./-])\/(sdd-[a-z][a-z0-9-]*[a-z0-9])/g;
const COMMAND_REF = /(?<![\w./-])\/(sdd\.[a-z][a-z0-9-]*[a-z0-9])/g;

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
    if (EXCLUDED_SKILLS.has(skill.name)) continue;
    list.push({
      label: `skill ${skill.name}`,
      text: [skill.description, skill.argumentHint ?? '', skill.content].join('\n'),
      legacy: false,
    });
  }

  for (const cmd of generateClaudeCommands()) {
    if (EXCLUDED_COMMANDS.has(cmd.name)) continue;
    list.push({ label: `command ${cmd.name}`, text: cmd.content, legacy: true });
  }

  list.push({ label: 'AGENTS.md', text: generateAgentsMd({ projectName: 'demo' }), legacy: false });

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
  });
});
