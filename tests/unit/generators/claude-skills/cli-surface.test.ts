/**
 * Guard test — every `sdd ...` invocation written into a generated skill
 * (or legacy slash command) must exist on the real commander program, and
 * every skill must allow the `sdd` commands it tells the model to run.
 */
import { describe, it, expect } from 'vitest';
import type { Command } from 'commander';
import { createProgram } from '../../../../src/cli/index.js';
import { generateClaudeSkills } from '../../../../src/generators/claude-skills/index.js';
import { generateClaudeCommands } from '../../../../src/generators/claude-commands.js';

interface Invocation {
  raw: string;
  tokens: string[];
  // Found in running prose: only the leading command path and flags count.
  prose: boolean;
}

/**
 * Commands a skill mentions for reference only (it never runs them), so they
 * are exempt from the allowed-tools coverage check. Surface checks still apply.
 */
const REFERENCE_ONLY: Record<string, RegExp[]> = {
  // The guide lists the full CLI as a cheat sheet; its tools stay read-only.
  'sdd-guide': [/^sdd (init|start|new|change|transition|impact)\b/],
};

/** Split a shell-ish string into tokens, keeping quoted segments together. */
function tokenize(input: string): string[] {
  return input.match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
}

interface Fragment {
  text: string;
  prose: boolean;
}

/** Collect the text fragments that may contain CLI invocations. */
function codeFragments(markdown: string): Fragment[] {
  const fragments: Fragment[] = [];
  let fence: string | null = null;
  let pending = '';

  for (const line of markdown.split('\n')) {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (fence === null) {
        fence = marker;
      } else if (marker[0] === fence[0] && marker.length >= fence.length) {
        fence = null;
      }
      continue;
    }

    if (fence !== null) {
      // Join backslash-continued shell lines.
      if (/\\\s*$/.test(line)) {
        pending += line.replace(/\\\s*$/, ' ');
        continue;
      }
      fragments.push({ text: pending + line, prose: false });
      pending = '';
      continue;
    }

    for (const span of line.matchAll(/`([^`\n]+)`/g)) {
      fragments.push({ text: span[1], prose: false });
    }
    fragments.push({ text: line.replace(/`[^`\n]*`/g, ' '), prose: true });
  }

  return fragments;
}

/** Extract every `sdd <args>` invocation from a markdown body. */
function extractInvocations(markdown: string, topLevel: Set<string>): Invocation[] {
  const invocations: Invocation[] = [];
  for (const { text, prose } of codeFragments(markdown)) {
    for (const m of text.matchAll(/(?:^|[\s(:])sdd(?=\s|$)([^|;&\n]*)/g)) {
      // Stop at shell comments/redirects and at non-ASCII (diagram art, prose).
      const args = m[1].split(/\s[#>]|[^\x20-\x7E]/)[0];
      const tokens = tokenize(args.trim().replace(/[.,:;)]+$/, ''));
      // In prose, require a real top-level command to avoid matching plain words.
      if (prose && !topLevel.has(tokens[0] ?? '')) continue;
      invocations.push({ raw: `sdd ${tokens.join(' ')}`.trim(), tokens, prose });
    }
  }
  return invocations;
}

function isPlaceholder(token: string): boolean {
  return /^[<[$]/.test(token) || token === '...';
}

function findSubcommand(cmd: Command, token: string): Command | undefined {
  return cmd.commands.find((c) => c.name() === token || c.aliases().includes(token));
}

function knownFlags(cmd: Command): Set<string> {
  const flags = new Set<string>(['-h', '--help']);
  for (const opt of cmd.options) {
    if (opt.long) flags.add(opt.long);
    if (opt.short) flags.add(opt.short);
  }
  return flags;
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

/** A positional that is one or two edits away from a subcommand is a typo. */
function nearMissSubcommand(cmd: Command, token: string): string | undefined {
  if (!/^[a-z][a-z-]{2,}$/.test(token)) return undefined;
  return cmd.commands
    .map((c) => c.name())
    .find((name) => name !== 'help' && editDistance(token, name) <= 2);
}

function commandPath(cmd: Command): string {
  const parts: string[] = [];
  let current: Command | null = cmd;
  while (current) {
    parts.unshift(current.name());
    current = current.parent;
  }
  return parts.join(' ');
}

/** Return a list of problems with one invocation against the real CLI. */
function checkInvocation(root: Command, inv: Invocation): string[] {
  const problems: string[] = [];
  let cmd = root;
  let descending = true;

  for (const token of inv.tokens) {
    if (token === '--') break;

    if (token.startsWith('-') && token.length > 1) {
      descending = false;
      const flag = token.split('=')[0];
      const flags = knownFlags(cmd);
      const candidates = /^-[A-Za-z]{2,}$/.test(flag)
        ? [...flag.slice(1)].map((ch) => `-${ch}`)
        : [flag];
      for (const candidate of candidates) {
        if (!flags.has(candidate)) {
          problems.push(`unknown option ${candidate} for "${commandPath(cmd)}" in: ${inv.raw}`);
        }
      }
      continue;
    }

    if (!descending) {
      // Prose continues with ordinary words after the command; stop there.
      if (inv.prose) break;
      continue;
    }

    const sub = findSubcommand(cmd, token);
    if (sub) {
      cmd = sub;
      continue;
    }

    // A placeholder in subcommand position cannot be resolved statically.
    if (isPlaceholder(token)) {
      if (cmd.commands.length > 0 && cmd.registeredArguments.length === 0) {
        return problems;
      }
      descending = false;
      continue;
    }

    const nearMiss = nearMissSubcommand(cmd, token);
    if (nearMiss) {
      problems.push(`"${token}" looks like a typo of "${commandPath(cmd)} ${nearMiss}" in: ${inv.raw}`);
      return problems;
    }

    if (cmd.registeredArguments.length === 0) {
      if (inv.prose && cmd.commands.length === 0) break;
      problems.push(`unknown command "${token}" under "${commandPath(cmd)}" in: ${inv.raw}`);
      return problems;
    }
    descending = false;
    if (inv.prose) break;
  }

  return problems;
}

/** Convert an allowed-tools glob (e.g. `sdd validate*`) to an anchored regex. */
function ruleToRegex(rule: string): RegExp {
  const escaped = rule
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${escaped}$`);
}

function bashRules(allowedTools: string[] | undefined): RegExp[] {
  return (allowedTools ?? [])
    .map((tool) => /^Bash\((.+)\)$/.exec(tool)?.[1])
    .filter((rule): rule is string => typeof rule === 'string')
    .map(ruleToRegex);
}

const program = createProgram();
const topLevel = new Set(program.commands.flatMap((c) => [c.name(), ...c.aliases()]));

describe('guard self-test', () => {
  const problemsFor = (md: string): string[] =>
    extractInvocations(md, topLevel).flatMap((inv) => checkInvocation(program, inv));

  it('finds invocations in code blocks, ~~~ fences, inline spans, and prose', () => {
    const found = extractInvocations(
      [
        'Run `sdd validate --strict` now.',
        '```bash',
        'sdd new auth/login --all  # comment',
        '```',
        '~~~',
        'sdd list features',
        '~~~',
        'Then run sdd status to check progress.',
        'The sdd tool is great.',
      ].join('\n'),
      topLevel
    ).map((i) => i.raw);
    expect(found).toEqual([
      'sdd validate --strict',
      'sdd new auth/login --all',
      'sdd list features',
      'sdd status to check progress',
    ]);
  });

  it('joins backslash-continued lines', () => {
    expect(problemsFor('```bash\nsdd export --all \\\n  --bogus\n```')).toHaveLength(1);
  });

  it('rejects unknown subcommands, flags, and near-miss subcommand typos', () => {
    expect(problemsFor('`sdd context export --format markdown`')).toHaveLength(1);
    expect(problemsFor('`sdd watch --path src`')).toHaveLength(1);
    expect(problemsFor('`sdd change aply CHG-001`')).toHaveLength(1);
    expect(problemsFor('Run sdd change aply now.')).toHaveLength(1);
    expect(problemsFor('Run sdd watch --path src in prose.')).toHaveLength(1);
  });

  it('accepts real positionals on commands that also have subcommands', () => {
    expect(problemsFor('`sdd change CHG-001`')).toEqual([]);
    expect(problemsFor('`sdd new auth/login --all`')).toEqual([]);
    expect(problemsFor('`sdd impact user-auth --graph`')).toEqual([]);
  });
});

describe('generated skill bodies match the real CLI surface', () => {
  for (const skill of generateClaudeSkills()) {
    const invocations = extractInvocations(skill.content, topLevel);

    it(`${skill.name}: every sdd invocation exists`, () => {
      expect(invocations.flatMap((inv) => checkInvocation(program, inv))).toEqual([]);
    });

    it(`${skill.name}: every sdd invocation is covered by allowed-tools`, () => {
      const rules = bashRules(skill.allowedTools);
      const exempt = REFERENCE_ONLY[skill.name] ?? [];
      const uncovered = invocations
        .filter((inv) => inv.tokens.length > 0 && !isPlaceholder(inv.tokens[0]))
        .filter((inv) => !exempt.some((re) => re.test(inv.raw)))
        .filter((inv) => !rules.some((re) => re.test(inv.raw)))
        .map((inv) => inv.raw);
      expect(uncovered).toEqual([]);
    });
  }
});

describe('legacy slash command bodies match the real CLI surface', () => {
  for (const cmd of generateClaudeCommands()) {
    it(`${cmd.name}: every sdd invocation exists`, () => {
      const problems = extractInvocations(cmd.content, topLevel).flatMap((inv) =>
        checkInvocation(program, inv)
      );
      expect(problems).toEqual([]);
    });
  }
});
