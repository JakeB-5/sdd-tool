/**
 * 스킬 스캐너 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SkillScanner } from '../../../../src/core/prepare/skill-scanner.js';

describe('SkillScanner', () => {
  let tempDir: string;
  let skillsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-skill-scanner-'));
    skillsDir = path.join(tempDir, '.claude', 'skills');
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('exists', () => {
    it('스킬 디렉토리가 없으면 false를 반환한다', () => {
      const scanner = new SkillScanner(tempDir);
      expect(scanner.exists()).toBe(false);
    });

    it('스킬 디렉토리가 있으면 true를 반환한다', async () => {
      await fs.mkdir(skillsDir, { recursive: true });
      const scanner = new SkillScanner(tempDir);
      expect(scanner.exists()).toBe(true);
    });
  });

  describe('scanAll', () => {
    it('디렉토리가 없으면 빈 배열을 반환한다', async () => {
      const scanner = new SkillScanner(tempDir);
      const skills = await scanner.scanAll();
      expect(skills).toEqual([]);
    });

    it('스킬 파일을 스캔한다', async () => {
      const testSkillDir = path.join(skillsDir, 'test');
      await fs.mkdir(testSkillDir, { recursive: true });
      await fs.writeFile(
        path.join(testSkillDir, 'SKILL.md'),
        `---
name: test
description: 테스트 스킬
allowed-tools: Read, Bash
---

# Test Skill

테스트를 수행합니다.
`
      );

      const scanner = new SkillScanner(tempDir);
      const skills = await scanner.scanAll();

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('test');
      expect(skills[0].metadata.description).toBe('테스트 스킬');
      expect(skills[0].metadata['allowed-tools']).toEqual(['Read', 'Bash']);
    });

    it('여러 스킬을 스캔한다', async () => {
      const skill1Dir = path.join(skillsDir, 'skill1');
      const skill2Dir = path.join(skillsDir, 'skill2');
      await fs.mkdir(skill1Dir, { recursive: true });
      await fs.mkdir(skill2Dir, { recursive: true });

      await fs.writeFile(
        path.join(skill1Dir, 'SKILL.md'),
        `---
name: skill1
description: 스킬 1
---

# Skill 1
`
      );

      await fs.writeFile(
        path.join(skill2Dir, 'SKILL.md'),
        `---
name: skill2
description: 스킬 2
---

# Skill 2
`
      );

      const scanner = new SkillScanner(tempDir);
      const skills = await scanner.scanAll();

      expect(skills).toHaveLength(2);
    });

    it('SKILL.md가 없는 디렉토리는 무시한다', async () => {
      const emptyDir = path.join(skillsDir, 'empty');
      const validDir = path.join(skillsDir, 'valid');
      await fs.mkdir(emptyDir, { recursive: true });
      await fs.mkdir(validDir, { recursive: true });

      await fs.writeFile(
        path.join(validDir, 'SKILL.md'),
        `---
name: valid
description: 유효한 스킬
---

# Valid
`
      );

      const scanner = new SkillScanner(tempDir);
      const skills = await scanner.scanAll();

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('valid');
    });

    it('파일은 무시하고 디렉토리만 스캔한다', async () => {
      await fs.mkdir(skillsDir, { recursive: true });
      await fs.writeFile(path.join(skillsDir, 'readme.md'), 'readme');

      const validDir = path.join(skillsDir, 'valid');
      await fs.mkdir(validDir);
      await fs.writeFile(
        path.join(validDir, 'SKILL.md'),
        `---
name: valid
description: 유효한 스킬
---

# Valid
`
      );

      const scanner = new SkillScanner(tempDir);
      const skills = await scanner.scanAll();

      expect(skills).toHaveLength(1);
    });
  });

  describe('hasSkill', () => {
    it('스킬이 존재하면 true를 반환한다', async () => {
      const skillDir = path.join(skillsDir, 'my-skill');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(
        path.join(skillDir, 'SKILL.md'),
        `---
name: my-skill
description: 스킬
---

# My Skill
`
      );

      const scanner = new SkillScanner(tempDir);
      expect(scanner.hasSkill('my-skill')).toBe(true);
    });

    it('스킬이 없으면 false를 반환한다', async () => {
      await fs.mkdir(skillsDir, { recursive: true });
      const scanner = new SkillScanner(tempDir);
      expect(scanner.hasSkill('non-existent')).toBe(false);
    });

    it('디렉토리만 있고 SKILL.md가 없으면 false를 반환한다', async () => {
      const emptyDir = path.join(skillsDir, 'empty-skill');
      await fs.mkdir(emptyDir, { recursive: true });

      const scanner = new SkillScanner(tempDir);
      expect(scanner.hasSkill('empty-skill')).toBe(false);
    });
  });

  describe('getSkill', () => {
    it('특정 스킬을 가져온다', async () => {
      const skillDir = path.join(skillsDir, 'target');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(
        path.join(skillDir, 'SKILL.md'),
        `---
name: target
description: 타겟 스킬
---

# Target
`
      );

      const scanner = new SkillScanner(tempDir);
      const skill = await scanner.getSkill('target');

      expect(skill).not.toBeNull();
      expect(skill!.name).toBe('target');
    });

    it('존재하지 않는 스킬은 null을 반환한다', async () => {
      await fs.mkdir(skillsDir, { recursive: true });
      const scanner = new SkillScanner(tempDir);
      const skill = await scanner.getSkill('non-existent');

      expect(skill).toBeNull();
    });
  });

  describe('metadata parsing', () => {
    it('name이 없으면 디렉토리명에서 추출한다', async () => {
      const skillDir = path.join(skillsDir, 'inferred-name');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(
        path.join(skillDir, 'SKILL.md'),
        `---
description: 이름 없는 스킬
---

# Skill
`
      );

      const scanner = new SkillScanner(tempDir);
      const skills = await scanner.scanAll();

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('inferred-name');
    });

    it('allowed-tools가 문자열이면 배열로 변환한다', async () => {
      const skillDir = path.join(skillsDir, 'string-tools');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(
        path.join(skillDir, 'SKILL.md'),
        `---
name: string-tools
description: 문자열 도구
allowed-tools: Read, Write, Bash
---

# Skill
`
      );

      const scanner = new SkillScanner(tempDir);
      const skills = await scanner.scanAll();

      expect(skills[0].metadata['allowed-tools']).toEqual(['Read', 'Write', 'Bash']);
    });
  });

  describe('path helpers', () => {
    it('getSkillsDir가 올바른 경로를 반환한다', () => {
      const scanner = new SkillScanner(tempDir);
      expect(scanner.getSkillsDir()).toBe(path.join(tempDir, '.claude', 'skills'));
    });

    it('getSkillDirPath가 올바른 경로를 반환한다', () => {
      const scanner = new SkillScanner(tempDir);
      expect(scanner.getSkillDirPath('test')).toBe(
        path.join(tempDir, '.claude', 'skills', 'test')
      );
    });

    it('getSkillFilePath가 올바른 경로를 반환한다', () => {
      const scanner = new SkillScanner(tempDir);
      expect(scanner.getSkillFilePath('test')).toBe(
        path.join(tempDir, '.claude', 'skills', 'test', 'SKILL.md')
      );
    });
  });
});
