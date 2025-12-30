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
    expect(dirs).toContain('.claude/commands');
    expect(dirs).toContain('.claude/skills');
  });

  it('8개의 디렉토리를 반환한다', () => {
    const dirs = getInitDirectories();
    expect(dirs.length).toBe(8);
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

  it('템플릿 파일을 생성한다', async () => {
    await executeInit(tempDir, {});

    const specTemplate = await fs.readFile(
      path.join(tempDir, '.sdd', 'templates', 'spec.md'),
      'utf-8'
    );

    expect(specTemplate).toContain('{{FEATURE_NAME}}');
  });
});
