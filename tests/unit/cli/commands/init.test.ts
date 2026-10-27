/**
 * init 명령어 핵심 로직 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  getInitDirectories,
  generateConstitutionContent,
  generateSpecTemplate,
  executeInit,
  buildClaudeMdContent,
} from '../../../../src/cli/commands/init.js';

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
    expect(dirs).not.toContain('.claude/commands');
  });

  it('기본으로 7개의 디렉토리를 반환한다', () => {
    const dirs = getInitDirectories();
    expect(dirs.length).toBe(7);
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
    expect(content).toMatch(/^@\.sdd\/AGENTS\.md$/m);
  });

  it('import가 없으면 기존 내용 뒤에 덧붙인다', () => {
    expect(buildClaudeMdContent('# Mine\n')).toBe('# Mine\n\n@.sdd/AGENTS.md\n');
    expect(buildClaudeMdContent('# Mine')).toBe('# Mine\n\n@.sdd/AGENTS.md\n');
  });

  it('import가 이미 있으면 null을 반환한다', () => {
    expect(buildClaudeMdContent('x\n@.sdd/AGENTS.md\n')).toBeNull();
    expect(buildClaudeMdContent('x\n  @./.sdd/AGENTS.md  \n')).toBeNull();
  });

  it('인라인 언급은 import로 간주하지 않는다', () => {
    expect(buildClaudeMdContent('See `@.sdd/AGENTS.md` later.\n')).not.toBeNull();
  });

  it('코드 블록 안의 import 라인은 무시한다', () => {
    expect(buildClaudeMdContent('```md\n@.sdd/AGENTS.md\n```\n')).not.toBeNull();
    expect(buildClaudeMdContent('~~~\n@.sdd/AGENTS.md\n~~~\n')).not.toBeNull();
  });

  it('CRLF 파일에는 CRLF로 덧붙인다', () => {
    expect(buildClaudeMdContent('# Mine\r\nrule\r\n')).toBe('# Mine\r\nrule\r\n\r\n@.sdd/AGENTS.md\r\n');
  });

  it('여러 import 중 빠진 것만 덧붙인다', () => {
    const imports = ['@.sdd/AGENTS.md', '@AGENTS.md'];
    expect(buildClaudeMdContent('@.sdd/AGENTS.md\n', imports)).toBe('@.sdd/AGENTS.md\n\n@AGENTS.md\n');
    expect(buildClaudeMdContent('@AGENTS.md\n@.sdd/AGENTS.md\n', imports)).toBeNull();
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

  it('GIVEN-WHEN-THEN 시나리오 템플릿을 포함한다', () => {
    const template = generateSpecTemplate();

    expect(template).toContain('**GIVEN**');
    expect(template).toContain('**WHEN**');
    expect(template).toContain('**THEN**');
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

  it('AGENTS.md를 생성한다', async () => {
    await executeInit(tempDir, {});

    const agentsPath = path.join(tempDir, '.sdd', 'AGENTS.md');
    const content = await fs.readFile(agentsPath, 'utf-8');

    expect(content).toContain('AGENTS');
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

  it('CLAUDE.md가 없으면 @.sdd/AGENTS.md import와 함께 생성한다', async () => {
    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(true);

    const content = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
    expect(content).toMatch(/^@\.sdd\/AGENTS\.md$/m);
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
    expect(content).toBe(`${userContent}\n\n@.sdd/AGENTS.md\n`);
  });

  it('재실행(--force) 시 CLAUDE.md import를 중복 추가하지 않는다', async () => {
    await executeInit(tempDir, {});
    const first = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');

    const result = await executeInit(tempDir, { force: true });
    expect(result.success).toBe(true);

    const second = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
    expect(second).toBe(first);
    expect(second.match(/@\.sdd\/AGENTS\.md/g)).toHaveLength(1);
    if (result.success) {
      expect(result.data.files).not.toContain('CLAUDE.md');
    }
  });

  it('루트 AGENTS.md가 있으면 생성하는 CLAUDE.md에 @AGENTS.md도 import한다', async () => {
    await fs.writeFile(path.join(tempDir, 'AGENTS.md'), '# Agents\n');

    await executeInit(tempDir, {});

    const content = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
    expect(content).toMatch(/^@\.sdd\/AGENTS\.md$/m);
    expect(content).toMatch(/^@AGENTS\.md$/m);
  });

  it('루트 AGENTS.md가 있으면 기존 CLAUDE.md에도 @AGENTS.md를 덧붙인다', async () => {
    await fs.writeFile(path.join(tempDir, 'AGENTS.md'), '# Agents\n');
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), '# Mine\n');

    await executeInit(tempDir, {});

    const content = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
    expect(content).toBe('# Mine\n\n@.sdd/AGENTS.md\n@AGENTS.md\n');
  });

  it('.claude/CLAUDE.md만 있으면 그 파일에 상대 경로 import를 덧붙이고 루트 파일은 만들지 않는다', async () => {
    await fs.mkdir(path.join(tempDir, '.claude'), { recursive: true });
    await fs.writeFile(path.join(tempDir, '.claude', 'CLAUDE.md'), '# Team\n');

    const result = await executeInit(tempDir, {});
    expect(result.success).toBe(true);

    const content = await fs.readFile(path.join(tempDir, '.claude', 'CLAUDE.md'), 'utf-8');
    expect(content).toBe('# Team\n\n@../.sdd/AGENTS.md\n');
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
    const userContent = '# Team rules\n\n@.sdd/AGENTS.md\n\nMore rules.\n';
    await fs.writeFile(path.join(tempDir, 'CLAUDE.md'), userContent);

    await executeInit(tempDir, {});

    const content = await fs.readFile(path.join(tempDir, 'CLAUDE.md'), 'utf-8');
    expect(content).toBe(userContent);
  });

  it('skills: false 옵션은 .claude/skills/ 를 비워둔다', async () => {
    const result = await executeInit(tempDir, { skills: false });
    expect(result.success).toBe(true);

    const skillsDir = path.join(tempDir, '.claude', 'skills');
    const entries = await fs.readdir(skillsDir).catch(() => [] as string[]);
    expect(entries).toEqual([]);
  });
});
