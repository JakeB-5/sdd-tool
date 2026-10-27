/**
 * sdd init 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binPath = path.resolve(__dirname, '../../bin/sdd.js');

/**
 * CLI 실행 헬퍼
 */
function runCli(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn('node', [binPath, ...args], { cwd, shell: true });
    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 0 });
    });
  });
}

describe('sdd init', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-init-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('기본 디렉토리 구조를 생성한다', async () => {
    const result = await runCli(['init'], tempDir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('초기화되었습니다');

    // 디렉토리 확인
    const sddPath = path.join(tempDir, '.sdd');
    expect(await fs.stat(sddPath).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.stat(path.join(sddPath, 'specs')).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.stat(path.join(sddPath, 'changes')).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.stat(path.join(sddPath, 'archive')).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.stat(path.join(sddPath, 'templates')).then(() => true).catch(() => false)).toBe(true);
  });

  it('constitution.md를 생성한다', async () => {
    await runCli(['init'], tempDir);

    const constitutionPath = path.join(tempDir, '.sdd', 'constitution.md');
    const content = await fs.readFile(constitutionPath, 'utf-8');

    expect(content).toContain('# Constitution:');
    expect(content).toContain('version: 1.0.0');
    expect(content).toContain('SHALL');
  });

  it('루트 AGENTS.md에 SDD 블록을 생성한다', async () => {
    await runCli(['init'], tempDir);

    const content = await fs.readFile(path.join(tempDir, 'AGENTS.md'), 'utf-8');

    // 50줄 규칙: 상단에 RFC 2119와 GIVEN-WHEN-THEN 포함
    expect(content.startsWith('<!-- sdd:begin -->')).toBe(true);
    expect(content).toContain('<!-- sdd:end -->');
    expect(content).toContain('# SDD Workflow Guide');
    expect(content).toContain('워크플로우');
    expect(content).toContain('SHALL');
    expect(content).toContain('GIVEN');
    const legacyExists = await fs.stat(path.join(tempDir, '.sdd', 'AGENTS.md')).then(() => true).catch(() => false);
    expect(legacyExists).toBe(false);
  });

  it('AGENTS.md 마커가 깨져 있으면 0이 아닌 코드로 종료하고 아무것도 쓰지 않는다', async () => {
    const broken = '<!-- sdd:begin -->\nno end\n';
    await fs.writeFile(path.join(tempDir, 'AGENTS.md'), broken);

    const result = await runCli(['init', '--skip-git-setup'], tempDir);

    expect(result.code).not.toBe(0);
    expect(result.stdout + result.stderr).toContain('마커');
    expect(await fs.readdir(tempDir)).toEqual(['AGENTS.md']);
    expect(await fs.readFile(path.join(tempDir, 'AGENTS.md'), 'utf-8')).toBe(broken);
  });

  it('Claude Code와 Codex 파일을 함께 생성한다', async () => {
    const result = await runCli(['init'], tempDir);
    expect(result.code).toBe(0);

    const codexSkills = await fs.readdir(path.join(tempDir, '.agents', 'skills'));
    expect(codexSkills.filter((e) => e.startsWith('sdd-')).length).toBe(30);
    const codexSpec = await fs.readFile(path.join(tempDir, '.agents', 'skills', 'sdd-spec', 'SKILL.md'), 'utf-8');
    expect(codexSpec).toContain('name: sdd-spec');
    expect(codexSpec).not.toContain('allowed-tools');

    expect((await fs.readdir(path.join(tempDir, '.claude', 'agents'))).sort()).toEqual([
      'sdd-impact-analyst.md',
      'sdd-implementer.md',
      'sdd-spec-reviewer.md',
    ]);
    expect((await fs.readdir(path.join(tempDir, '.codex', 'agents'))).sort()).toEqual([
      'sdd-impact-analyst.toml',
      'sdd-implementer.toml',
      'sdd-spec-reviewer.toml',
    ]);

    expect(result.stdout).toContain('.agents/skills/');
    expect(result.stdout).toContain('.codex/agents/');
  });

  it('템플릿 파일을 생성한다', async () => {
    await runCli(['init'], tempDir);

    const templatesPath = path.join(tempDir, '.sdd', 'templates');

    expect(await fs.stat(path.join(templatesPath, 'spec.md')).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.stat(path.join(templatesPath, 'proposal.md')).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.stat(path.join(templatesPath, 'delta.md')).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.stat(path.join(templatesPath, 'tasks.md')).then(() => true).catch(() => false)).toBe(true);
  });

  it('이미 존재하면 에러를 반환한다', async () => {
    // 먼저 초기화
    await runCli(['init'], tempDir);

    // 다시 초기화 시도
    const result = await runCli(['init'], tempDir);

    expect(result.code).not.toBe(0);
    // 에러는 stdout 또는 stderr에 출력될 수 있음
    const output = result.stdout + result.stderr;
    expect(output).toContain('이미 존재');
  });

  it('--force 옵션으로 덮어쓸 수 있다', async () => {
    // 먼저 초기화
    await runCli(['init'], tempDir);

    // force로 다시 초기화
    const result = await runCli(['init', '--force'], tempDir);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('덮어씁니다');
  });

  it('.claude/skills/ 에 30개의 sdd-* 스킬만 생성하고 커맨드는 만들지 않는다', async () => {
    const result = await runCli(['init'], tempDir);
    expect(result.code).toBe(0);

    const skillsDir = path.join(tempDir, '.claude', 'skills');
    const entries = await fs.readdir(skillsDir);
    expect(entries.filter((e) => e.startsWith('sdd-')).length).toBe(30);
    expect(entries.filter((e) => e.startsWith('dev-'))).toEqual([]);

    // Spot-check one skill for YAML frontmatter
    const startSkillMd = path.join(skillsDir, 'sdd-start', 'SKILL.md');
    const content = await fs.readFile(startSkillMd, 'utf-8');
    expect(content).toContain('name: sdd-start');
    expect(content).not.toContain('context:');

    const commandsExists = await fs.stat(path.join(tempDir, '.claude', 'commands'))
      .then(() => true)
      .catch(() => false);
    expect(commandsExists).toBe(false);

    const claudeMd = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
    expect(claudeMd).toMatch(/^@AGENTS\.md$/m);
  });

  it('--legacy-commands 옵션으로 .claude/commands/ 를 함께 생성한다', async () => {
    const result = await runCli(['init', '--legacy-commands'], tempDir);
    expect(result.code).toBe(0);

    const entries = await fs.readdir(path.join(tempDir, '.claude', 'commands'));
    expect(entries).toContain('sdd.start.md');
    expect(entries.length).toBe(30);
  });

  it('--help 에 --legacy-commands 가 있고 --no-commands 는 숨겨진다', async () => {
    const result = await runCli(['init', '--help'], tempDir);
    expect(result.stdout).toContain('--legacy-commands');
    expect(result.stdout).not.toContain('--no-commands');
  });

  it('--no-skills 옵션으로 .claude/skills/ 와 .agents/skills/ 가 비어있다', async () => {
    const result = await runCli(['init', '--no-skills'], tempDir);
    expect(result.code).toBe(0);

    for (const skillsDir of [path.join(tempDir, '.claude', 'skills'), path.join(tempDir, '.agents', 'skills')]) {
      const entries = await fs.readdir(skillsDir).catch(() => [] as string[]);
      expect(entries).toEqual([]);
    }
  });

  it('--no-commands 옵션(호환용 no-op)도 성공하고 커맨드를 만들지 않는다', async () => {
    const result = await runCli(['init', '--no-commands'], tempDir);
    expect(result.code).toBe(0);

    const commandsDir = path.join(tempDir, '.claude', 'commands');
    const entries = await fs.readdir(commandsDir).catch(() => [] as string[]);
    expect(entries).toEqual([]);
  });
});
