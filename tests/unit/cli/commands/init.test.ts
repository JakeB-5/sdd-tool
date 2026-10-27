/**
 * init 명령어 핵심 로직 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  getInitDirectories,
  generateConstitutionContent,
  generateSpecTemplate,
  generateTasksTemplate,
  generateGitHubValidateWorkflow,
  generateGitHubLabelerWorkflow,
  executeInit,
  buildClaudeMdContent,
} from '../../../../src/cli/commands/init.js';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import { parse as parseToml } from 'smol-toml';
import { generateClaudeSkills } from '../../../../src/generators/claude-skills.js';
import { generateAgents } from '../../../../src/generators/agents/index.js';

describe('getInitDirectories', () => {
  it('필수 디렉토리 목록을 반환한다', () => {
    const dirs = getInitDirectories();

    expect(dirs).toContain('.sdd');
    expect(dirs).toContain('.sdd/specs');
    expect(dirs).toContain('.sdd/changes');
    expect(dirs).toContain('.sdd/archive');
    expect(dirs).toContain('.sdd/templates');
    expect(dirs).toContain('.claude');
    expect(dirs).toContain('.claude/skills');
    expect(dirs).toContain('.claude/agents');
    expect(dirs).toContain('.agents/skills');
    expect(dirs).toContain('.codex/agents');
    expect(dirs).not.toContain('.claude/commands');
  });

  it('기본으로 12개의 디렉토리를 반환한다', () => {
    const dirs = getInitDirectories();
    expect(dirs.length).toBe(12);
  });

  it('legacyCommands가 true면 .claude/commands를 포함한다', () => {
    const dirs = getInitDirectories(false, true);
    expect(dirs).toContain('.claude/commands');
  });
});

describe('buildClaudeMdContent', () => {
  it('파일이 없으면 헤더와 import 라인을 만든다', () => {
    const content = buildClaudeMdContent(null);
    expect(content).toContain('# CLAUDE.md');
    expect(content).toMatch(/^@AGENTS\.md$/m);
    expect(content).not.toContain('.sdd/AGENTS.md');
  });

  it('import가 없으면 기존 내용 뒤에 덧붙인다', () => {
    expect(buildClaudeMdContent('# Mine\n')).toBe('# Mine\n\n@AGENTS.md\n');
    expect(buildClaudeMdContent('# Mine')).toBe('# Mine\n\n@AGENTS.md\n');
  });

  it('import가 이미 있으면 null을 반환한다', () => {
    expect(buildClaudeMdContent('x\n@AGENTS.md\n')).toBeNull();
    expect(buildClaudeMdContent('x\n  @./AGENTS.md  \n')).toBeNull();
  });

  it('인라인 언급은 import로 간주하지 않는다', () => {
    expect(buildClaudeMdContent('See `@AGENTS.md` later.\n')).not.toBeNull();
  });

  it('코드 블록 안의 import 라인은 무시한다', () => {
    expect(buildClaudeMdContent('```md\n@AGENTS.md\n```\n')).not.toBeNull();
    expect(buildClaudeMdContent('~~~\n@AGENTS.md\n~~~\n')).not.toBeNull();
  });

  it('CRLF 파일에는 CRLF로 덧붙인다', () => {
    expect(buildClaudeMdContent('# Mine\r\nrule\r\n')).toBe('# Mine\r\nrule\r\n\r\n@AGENTS.md\r\n');
  });

  it('이전 @.sdd/AGENTS.md 라인은 그 자리에서 @AGENTS.md로 교체한다', () => {
    expect(buildClaudeMdContent('# Mine\n@.sdd/AGENTS.md\nmore\n')).toBe('# Mine\n@AGENTS.md\nmore\n');
    expect(buildClaudeMdContent('# Mine\r\n  @./.sdd/AGENTS.md\r\nmore\r\n')).toBe('# Mine\r\n@AGENTS.md\r\nmore\r\n');
    expect(buildClaudeMdContent('@.sdd/AGENTS.md')).toBe('@AGENTS.md');
  });

  it('첫 줄이 이전 import여도 선행 BOM을 보존한다', () => {
    const bom = String.fromCharCode(0xfeff);
    expect(buildClaudeMdContent(`${bom}@.sdd/AGENTS.md\nmore\n`)).toBe(`${bom}@AGENTS.md\nmore\n`);
    expect(buildClaudeMdContent(`${bom}# Mine\n`)).toBe(`${bom}# Mine\n\n@AGENTS.md\n`);
  });

  it('새 import가 이미 있으면 이전 라인을 제거해 중복을 만들지 않는다', () => {
    expect(buildClaudeMdContent('@.sdd/AGENTS.md\n@AGENTS.md\n')).toBe('@AGENTS.md\n');
    expect(buildClaudeMdContent('@AGENTS.md\n@.sdd/AGENTS.md\n@.sdd/AGENTS.md\n')).toBe('@AGENTS.md\n');
  });

  it('코드 블록 안이나 인라인의 이전 경로 언급은 교체하지 않는다', () => {
    const fenced = '```md\n@.sdd/AGENTS.md\n```\n';
    expect(buildClaudeMdContent(fenced)).toBe(`${fenced}\n@AGENTS.md\n`);
    const inline = 'See `@.sdd/AGENTS.md`.\n';
    expect(buildClaudeMdContent(inline)).toBe(`${inline}\n@AGENTS.md\n`);
  });

  it('.claude/CLAUDE.md용 상대 경로 import도 교체한다', () => {
    expect(buildClaudeMdContent('# Team\n@../.sdd/AGENTS.md\n', ['@../AGENTS.md'], ['@../.sdd/AGENTS.md'])).toBe(
      '# Team\n@../AGENTS.md\n'
    );
  });
});

describe('generateConstitutionContent', () => {
  it('프로젝트 이름을 포함한다', () => {
    const content = generateConstitutionContent('my-project');

    expect(content).toContain('Constitution: my-project');
  });

  it('오늘 날짜를 포함한다', () => {
    const content = generateConstitutionContent('test');
    const today = new Date().toISOString().split('T')[0];

    expect(content).toContain(`created: ${today}`);
  });

  it('RFC 키워드를 포함한다', () => {
    const content = generateConstitutionContent('test');

    expect(content).toContain('SHALL');
    expect(content).toContain('SHALL NOT');
    expect(content).toContain('SHOULD');
  });

  it('핵심 원칙을 포함한다', () => {
    const content = generateConstitutionContent('test');

    expect(content).toContain('품질 우선');
    expect(content).toContain('명세 우선');
  });
});

describe('generateSpecTemplate', () => {
  it('frontmatter를 포함한다', () => {
    const template = generateSpecTemplate();

    expect(template).toContain('status: draft');
    expect(template).toContain('depends: null');
  });

  it('플레이스홀더를 포함한다', () => {
    const template = generateSpecTemplate();

    expect(template).toContain('{{FEATURE_NAME}}');
    expect(template).toContain('{{REQUIREMENT_TITLE}}');
    expect(template).toContain('{{DESCRIPTION}}');
  });

  it('sdd new가 쓰는 id, title, constitution_version 메타데이터를 포함한다', () => {
    const { data } = matter(generateSpecTemplate());

    expect(data.id).toBe('{{FEATURE_ID}}');
    expect(data.title).toBe('{{FEATURE_NAME}}');
    expect(data.constitution_version).toBe('{{CONSTITUTION_VERSION}}');
  });

  it('sdd new가 생성하는 스펙과 같은 REQ-01 + 시나리오 구조를 사용한다', () => {
    const template = generateSpecTemplate();

    expect(template).toContain('## 요구사항');
    expect(template).toContain('### REQ-01: {{REQUIREMENT_TITLE}}');
    expect(template).toContain('## 시나리오');
    expect(template).not.toContain('## Requirement:');
  });

  it('GIVEN-WHEN-THEN 시나리오 템플릿을 포함한다', () => {
    const template = generateSpecTemplate();

    expect(template).toContain('**GIVEN**');
    expect(template).toContain('**WHEN**');
    expect(template).toContain('**THEN**');
  });

  it('시나리오 이름에 다루는 요구사항을 적는다', () => {
    expect(generateSpecTemplate()).toContain('### Scenario 1: {{SCENARIO_NAME}} (REQ-01)');
  });
});

describe('generateTasksTemplate', () => {
  it('sdd new tasks와 같은 작업 구조를 사용한다', () => {
    const template = generateTasksTemplate();

    expect(template).toContain('### {{FEATURE_ID}}-task-001: {{TASK_TITLE}}');
    expect(template).toContain('- **상태:** 대기');
    expect(template).toContain('- **우선순위:** 🔴 HIGH');
    expect(template).toContain('- **의존성:** 없음');
    expect(template).toContain('- **의존성:** {{FEATURE_ID}}-task-001');
    expect(template).toContain('## 진행 상황');
  });

  it('테스트 우선이며 사후 테스트 작업과 마커 범례가 없다', () => {
    const template = generateTasksTemplate();

    expect(template).toContain('**설명:** 테스트 우선');
    expect(template).not.toContain('테스트 작성\n');
    expect(template).not.toMatch(/\[P\d\]|\[→T\]|\[US\]|마커 범례/);
  });
});

describe('init이 생성하는 GitHub 워크플로우', () => {
  it('sdd-tool 버전을 고정하고 최소 권한을 선언한다', () => {
    const version = (JSON.parse(readFileSync('package.json', 'utf-8')) as { version: string }).version;
    const validate = generateGitHubValidateWorkflow();
    const labeler = generateGitHubLabelerWorkflow();

    expect(validate).toContain(`npm install -g sdd-tool@${version}`);
    expect(validate).toMatch(/permissions:\n\s+contents: read\n/);
    expect(labeler).toMatch(/permissions:\n\s+contents: read\n\s+pull-requests: write\n\s+issues: write/);
  });

  it('라벨러가 pipefail에서 실패하거나 오탐하는 grep 파이프라인을 쓰지 않는다', () => {
    const labeler = generateGitHubLabelerWorkflow();

    expect(labeler).not.toMatch(/\| grep -q/);
    expect(labeler).toContain('{ grep "^\\.sdd/specs/" || true; }');
    expect(labeler).toContain('case "$CHANGED_FILES" in');
  });
});

describe('executeInit', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-init-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('새 프로젝트를 초기화한다', async () => {
    const result = await executeInit(tempDir, {});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.directories.length).toBeGreaterThan(0);
      expect(result.data.files.length).toBeGreaterThan(0);
    }
  });

  it('필수 디렉토리를 생성한다', async () => {
    const result = await executeInit(tempDir, {});

    expect(result.success).toBe(true);

    // .sdd 디렉토리 확인
    const sddExists = await fs.stat(path.join(tempDir, '.sdd'))
      .then(s => s.isDirectory())
      .catch(() => false);
    expect(sddExists).toBe(true);

    // specs 디렉토리 확인
    const specsExists = await fs.stat(path.join(tempDir, '.sdd', 'specs'))
      .then(s => s.isDirectory())
      .catch(() => false);
    expect(specsExists).toBe(true);
  });

  it('constitution.md를 생성한다', async () => {
    await executeInit(tempDir, {});

    const constitutionPath = path.join(tempDir, '.sdd', 'constitution.md');
    const content = await fs.readFile(constitutionPath, 'utf-8');

    expect(content).toContain('Constitution');
    expect(content).toContain('SHALL');
  });

  it('루트 AGENTS.md에 SDD 블록을 만들고 .sdd/AGENTS.md는 만들지 않는다', async () => {
    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(true);

    const content = await fs.readFile(path.join(tempDir, 'AGENTS.md'), 'utf-8');
    expect(content.startsWith('<!-- sdd:begin -->\n')).toBe(true);
    expect(content.endsWith('<!-- sdd:end -->\n')).toBe(true);
    expect(content).toContain('# SDD Workflow Guide');
    const legacyExists = await fs.stat(path.join(tempDir, '.sdd', 'AGENTS.md')).then(() => true).catch(() => false);
    expect(legacyExists).toBe(false);
    if (result.success) {
      expect(result.data.files).toContain('AGENTS.md');
      expect(result.data.staleFiles).toEqual([]);
    }
  });

  it('Codex 스킬 30개를 .agents/skills/ 에 생성하고 명시 호출 전용 스킬에 openai.yaml을 둔다', async () => {
    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(true);

    const codexDir = path.join(tempDir, '.agents', 'skills');
    const entries = (await fs.readdir(codexDir)).sort();
    expect(entries).toEqual(generateClaudeSkills().map((s) => s.name).sort());

    const spec = matter(await fs.readFile(path.join(codexDir, 'sdd-spec', 'SKILL.md'), 'utf-8'));
    expect(Object.keys(spec.data).sort()).toEqual(['description', 'name']);
    expect(spec.content).not.toMatch(/(?<![\w./$-])\/sdd-[a-z]/);

    for (const skill of generateClaudeSkills()) {
      const yamlPath = path.join(codexDir, skill.name, 'agents', 'openai.yaml');
      const exists = await fs.stat(yamlPath).then(() => true).catch(() => false);
      expect(exists, skill.name).toBe(skill.disableModelInvocation === true);
    }
    const watchYaml = parseYaml(await fs.readFile(path.join(codexDir, 'sdd-watch', 'agents', 'openai.yaml'), 'utf-8'));
    expect(watchYaml.policy).toEqual({ allow_implicit_invocation: false });
  });

  it('서브에이전트를 .claude/agents/ 와 .codex/agents/ 에 생성한다', async () => {
    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(true);

    const names = generateAgents().map((a) => a.name).sort();
    const claudeAgents = (await fs.readdir(path.join(tempDir, '.claude', 'agents'))).sort();
    const codexAgents = (await fs.readdir(path.join(tempDir, '.codex', 'agents'))).sort();
    expect(claudeAgents).toEqual(names.map((n) => `${n}.md`));
    expect(codexAgents).toEqual(names.map((n) => `${n}.toml`));

    const reviewer = matter(await fs.readFile(path.join(tempDir, '.claude', 'agents', 'sdd-spec-reviewer.md'), 'utf-8'));
    expect(reviewer.data.name).toBe('sdd-spec-reviewer');
    const codexReviewer = parseToml(
      await fs.readFile(path.join(tempDir, '.codex', 'agents', 'sdd-spec-reviewer.toml'), 'utf-8')
    );
    expect(codexReviewer.name).toBe('sdd-spec-reviewer');
    expect(typeof codexReviewer.developer_instructions).toBe('string');
  });

  it('이전 버전의 .sdd/AGENTS.md는 그대로 두고 경고 대상으로 보고한다', async () => {
    await fs.mkdir(path.join(tempDir, '.sdd'), { recursive: true });
    await fs.writeFile(path.join(tempDir, '.sdd', 'AGENTS.md'), '# old guide\n');

    const result = await executeInit(tempDir, { force: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.staleFiles).toContain('.sdd/AGENTS.md');
    }
    expect(await fs.readFile(path.join(tempDir, '.sdd', 'AGENTS.md'), 'utf-8')).toBe('# old guide\n');
  });

  it('기존 .sdd 디렉토리가 있으면 force 없이 실패한다', async () => {
    // 먼저 .sdd 디렉토리 생성
    await fs.mkdir(path.join(tempDir, '.sdd'), { recursive: true });

    const result = await executeInit(tempDir, {});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('이미 존재합니다');
    }
  });

  it('force 옵션으로 기존 디렉토리를 덮어쓴다', async () => {
    // 먼저 .sdd 디렉토리 생성
    await fs.mkdir(path.join(tempDir, '.sdd'), { recursive: true });

    const result = await executeInit(tempDir, { force: true });

    expect(result.success).toBe(true);
  });

  it('force로 덮어쓸 때 내용이 다른 constitution.md를 .bak으로 백업하고 보고한다', async () => {
    await executeInit(tempDir, {});
    const constitutionPath = path.join(tempDir, '.sdd', 'constitution.md');
    await fs.writeFile(constitutionPath, '# 사용자 원칙\n');

    const result = await executeInit(tempDir, { force: true });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.backups).toEqual(['.sdd/constitution.md.bak']);
    expect(await fs.readFile(`${constitutionPath}.bak`, 'utf-8')).toBe('# 사용자 원칙\n');
    expect(await fs.readFile(constitutionPath, 'utf-8')).toContain('# Constitution:');
  });

  it('두 번째 force에서도 기존 .bak을 덮어쓰지 않는다', async () => {
    await executeInit(tempDir, {});
    const constitutionPath = path.join(tempDir, '.sdd', 'constitution.md');
    await fs.writeFile(constitutionPath, '# 첫 번째 수정\n');
    await executeInit(tempDir, { force: true });
    await fs.writeFile(constitutionPath, '# 두 번째 수정\n');

    const result = await executeInit(tempDir, { force: true });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.backups).toEqual(['.sdd/constitution.md.1.bak']);
    expect(await fs.readFile(`${constitutionPath}.bak`, 'utf-8')).toBe('# 첫 번째 수정\n');
    expect(await fs.readFile(path.join(tempDir, '.sdd', 'constitution.md.1.bak'), 'utf-8')).toBe(
      '# 두 번째 수정\n'
    );
  });

  it('내용이 같은 파일은 백업하지 않는다', async () => {
    await executeInit(tempDir, {});
    const result = await executeInit(tempDir, { force: true });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.backups).toEqual([]);
    }
  });

  it('템플릿 파일을 생성한다', async () => {
    await executeInit(tempDir, {});

    const specTemplate = await fs.readFile(
      path.join(tempDir, '.sdd', 'templates', 'spec.md'),
      'utf-8'
    );

    expect(specTemplate).toContain('{{FEATURE_NAME}}');
  });

  it('기본으로 sdd-* Skills 2.0 파일을 생성한다', async () => {
    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(true);

    const sddStartSkill = path.join(
      tempDir, '.claude', 'skills', 'sdd-start', 'SKILL.md'
    );
    const exists = await fs.stat(sddStartSkill).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    const content = await fs.readFile(sddStartSkill, 'utf-8');
    expect(content).toContain('name: sdd-start');
    expect(content).toContain('allowed-tools');
  });

  it('기본으로 .claude/commands/ 를 생성하지 않는다 (스킬만)', async () => {
    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(true);

    const commandsExists = await fs.stat(path.join(tempDir, '.claude', 'commands'))
      .then(() => true)
      .catch(() => false);
    expect(commandsExists).toBe(false);
    if (result.success) {
      expect(result.data.files.some((f) => f.startsWith('.claude/commands/'))).toBe(false);
    }
  });

  it('legacyCommands: true 옵션은 레거시 커맨드를 생성한다', async () => {
    const result = await executeInit(tempDir, { legacyCommands: true });
    expect(result.success).toBe(true);

    const entries = await fs.readdir(path.join(tempDir, '.claude', 'commands'));
    expect(entries).toContain('sdd.start.md');
    expect(entries).toContain('sdd.spec.md');
    expect(entries).not.toContain('sdd.new.md');
    expect(entries).not.toContain('sdd.change.md');
  });

  it('commands: false (--no-commands 호환)는 효과 없이 성공한다', async () => {
    const result = await executeInit(tempDir, { commands: false });
    expect(result.success).toBe(true);

    const commandsExists = await fs.stat(path.join(tempDir, '.claude', 'commands'))
      .then(() => true)
      .catch(() => false);
    expect(commandsExists).toBe(false);
  });

  it('사용자 프로젝트에 dev-* 스킬과 폐기된 스킬을 생성하지 않는다', async () => {
    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(true);

    const entries = await fs.readdir(path.join(tempDir, '.claude', 'skills'));
    expect(entries.filter((e) => e.startsWith('dev-'))).toEqual([]);
    expect(entries).not.toContain('sdd-new');
    expect(entries).not.toContain('sdd-change');
    expect(entries.length).toBe(30);
  });

  it('생성된 SKILL.md에 context: inline / manual-invoke-only가 없다', async () => {
    await executeInit(tempDir, {});

    const skillsDir = path.join(tempDir, '.claude', 'skills');
    for (const name of await fs.readdir(skillsDir)) {
      const content = await fs.readFile(path.join(skillsDir, name, 'SKILL.md'), 'utf-8');
      expect(content, name).not.toMatch(/^context: (inline|manual-invoke-only)$/m);
    }
  });

  it('CLAUDE.md가 없으면 @AGENTS.md import와 함께 생성한다', async () => {
    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(true);

    const content = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
    expect(content).toMatch(/^@AGENTS\.md$/m);
    expect(content).not.toContain('.sdd/AGENTS.md');
    if (result.success) {
      expect(result.data.files).toContain('CLAUDE.md');
    }
  });

  it('기존 CLAUDE.md는 덮어쓰지 않고 import 라인만 덧붙인다', async () => {
    const userContent = '# My Project\n\nKeep this line.';
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), userContent);

    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(true);

    const content = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
    expect(content.startsWith(userContent)).toBe(true);
    expect(content).toBe(`${userContent}\n\n@AGENTS.md\n`);
  });

  it('재실행(--force) 시 CLAUDE.md import와 AGENTS.md 블록을 중복 추가하지 않는다', async () => {
    await executeInit(tempDir, {});
    const first = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
    const firstAgents = await fs.readFile(path.join(tempDir, 'AGENTS.md'), 'utf-8');

    const result = await executeInit(tempDir, { force: true });
    expect(result.success).toBe(true);

    const second = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
    expect(second).toBe(first);
    expect(second.match(/^@AGENTS\.md$/gm)).toHaveLength(1);
    expect(await fs.readFile(path.join(tempDir, 'AGENTS.md'), 'utf-8')).toBe(firstAgents);
    if (result.success) {
      expect(result.data.files).not.toContain('CLAUDE.md');
      expect(result.data.files).not.toContain('AGENTS.md');
    }
  });

  it('이전 버전 CLAUDE.md의 @.sdd/AGENTS.md 라인을 @AGENTS.md로 교체한다', async () => {
    // Content written by sdd init <= 1.6.0, followed by user rules
    const legacy = [
      '# CLAUDE.md',
      '',
      '> 이 프로젝트는 SDD(Spec-Driven Development)를 사용합니다.',
      '> AI 에이전트 워크플로우 지침은 아래에서 가져오는 `.sdd/AGENTS.md`에 있습니다.',
      '',
      '@.sdd/AGENTS.md',
      '',
      '## Team rules',
      'Keep me.',
      '',
    ].join('\n');
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), legacy);

    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(true);

    const content = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
    expect(content).toBe(
      legacy
        .replace('@.sdd/AGENTS.md', '@AGENTS.md')
        .replace('`.sdd/AGENTS.md`에 있습니다.', '루트 `AGENTS.md`의 SDD 블록에 있습니다 (Codex와 공용).')
    );
    if (result.success) {
      expect(result.data.files).toContain('CLAUDE.md');
    }
  });

  it('사용자 AGENTS.md는 보존하고 SDD 블록만 덧붙인다', async () => {
    await fs.writeFile(path.join(tempDir, 'AGENTS.md'), '# Agents\n\nMy rules.\n');

    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(true);

    const content = await fs.readFile(path.join(tempDir, 'AGENTS.md'), 'utf-8');
    expect(content.startsWith('# Agents\n\nMy rules.\n\n<!-- sdd:begin -->\n')).toBe(true);
    expect(content.trimEnd().endsWith('<!-- sdd:end -->')).toBe(true);
    const claudeMd = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
    expect(claudeMd.match(/^@AGENTS\.md$/gm)).toHaveLength(1);
  });

  it('AGENTS.md의 기존 SDD 블록만 교체하고 블록 밖 내용은 그대로 둔다', async () => {
    const userAgents = '# Agents\r\n\r\n<!-- sdd:begin -->\r\nold guide\r\n<!-- sdd:end -->\r\n\r\n## Mine\r\nkeep\r\n';
    await fs.writeFile(path.join(tempDir, 'AGENTS.md'), userAgents);

    await executeInit(tempDir, {});

    const content = await fs.readFile(path.join(tempDir, 'AGENTS.md'), 'utf-8');
    expect(content.startsWith('# Agents\r\n\r\n<!-- sdd:begin -->\r\n')).toBe(true);
    expect(content.endsWith('<!-- sdd:end -->\r\n\r\n## Mine\r\nkeep\r\n')).toBe(true);
    expect(content).not.toContain('old guide');
    expect(content).toContain('# SDD Workflow Guide');
    expect(content.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('AGENTS.md 마커가 깨져 있으면 아무것도 쓰지 않고 실패한다', async () => {
    const broken = '# Agents\n<!-- sdd:begin -->\nno end\n';
    await fs.writeFile(path.join(tempDir, 'AGENTS.md'), broken);

    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('마커');
    }
    expect(await fs.readFile(path.join(tempDir, 'AGENTS.md'), 'utf-8')).toBe(broken);
    expect((await fs.readdir(tempDir)).sort()).toEqual(['AGENTS.md']);
  });

  it('루트 AGENTS.override.md가 있으면 경고한다', async () => {
    await fs.writeFile(path.join(tempDir, 'AGENTS.override.md'), '# override\n');

    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.warnings).toHaveLength(1);
      expect(result.data.warnings[0]).toContain('AGENTS.override.md');
    }
  });

  it('AGENTS.override.md가 없으면 경고가 없다', async () => {
    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.warnings).toEqual([]);
    }
  });

  it('.claude/CLAUDE.md만 있으면 그 파일에 상대 경로 import를 덧붙이고 루트 파일은 만들지 않는다', async () => {
    await fs.mkdir(path.join(tempDir, '.claude'), { recursive: true });
    await fs.writeFile(path.join(tempDir, '.claude', 'CLAUDE.md'), '# Team\n');

    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(true);

    const content = await fs.readFile(path.join(tempDir, '.claude', 'CLAUDE.md'), 'utf-8');
    expect(content).toBe('# Team\n\n@../AGENTS.md\n');
    const rootExists = await fs.stat(path.join(tempDir, 'CLAUDE.md')).then(() => true).catch(() => false);
    expect(rootExists).toBe(false);
    if (result.success) {
      expect(result.data.files).toContain('.claude/CLAUDE.md');
    }
  });

  it('이전 버전이 만든 dev-*/폐기 스킬과 레거시 커맨드를 경고 대상으로 보고하고 삭제하지 않는다', async () => {
    const skillsDir = path.join(tempDir, '.claude', 'skills');
    const commandsDir = path.join(tempDir, '.claude', 'commands');
    await fs.mkdir(path.join(skillsDir, 'dev-test'), { recursive: true });
    await fs.mkdir(path.join(skillsDir, 'sdd-new'), { recursive: true });
    await fs.mkdir(path.join(skillsDir, 'my-own'), { recursive: true });
    await fs.mkdir(path.join(skillsDir, 'dev-mine'), { recursive: true });
    await fs.mkdir(commandsDir, { recursive: true });
    await fs.writeFile(path.join(commandsDir, 'sdd.start.md'), 'x');
    await fs.writeFile(path.join(commandsDir, 'mine.md'), 'x');

    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.staleFiles).toEqual([
        '.claude/skills/dev-test/',
        '.claude/skills/sdd-new/',
        '.claude/commands/sdd.start.md',
      ]);
    }
    expect(await fs.readdir(skillsDir)).toContain('dev-test');
    expect(await fs.readdir(commandsDir)).toContain('sdd.start.md');
  });

  it('--legacy-commands 사용 시 현재 레거시 커맨드는 경고하지 않는다', async () => {
    const result = await executeInit(tempDir, { legacyCommands: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.staleFiles).toEqual([]);
    }
  });

  it('이미 import가 있는 사용자 CLAUDE.md는 변경하지 않는다', async () => {
    const userContent = '# Team rules\n\n@AGENTS.md\n\nMore rules.\n';
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), userContent);

    await executeInit(tempDir, {});

    const content = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
    expect(content).toBe(userContent);
  });

  it('skills: false 옵션은 .claude/skills/ 와 .agents/skills/ 를 비워두고 서브에이전트는 생성한다', async () => {
    const result = await executeInit(tempDir, { skills: false });
    expect(result.success).toBe(true);

    for (const dir of [['.claude', 'skills'], ['.agents', 'skills']]) {
      const entries = await fs.readdir(path.join(tempDir, ...dir)).catch(() => [] as string[]);
      expect(entries, dir.join('/')).toEqual([]);
    }
    expect((await fs.readdir(path.join(tempDir, '.codex', 'agents'))).length).toBe(generateAgents().length);
  });
});
