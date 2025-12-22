/**
 * sdd constitution 명령어 테스트
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  determineBumpType,
  readConstitution,
  constitutionToJson,
  executeBump,
  executeValidateConstitution,
  getHistory,
  type BumpOptions,
} from '../../../../src/cli/commands/constitution.js';

describe('sdd constitution', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `sdd-constitution-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, '.sdd'), { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('parseConstitution', () => {
    it('Constitution 파싱이 정상적으로 동작한다', async () => {
      const { parseConstitution } = await import('../../../../src/core/constitution/parser.js');

      const content = `---
version: 1.0.0
created: 2025-01-01
---

# Constitution: TestProject

> 테스트 프로젝트입니다.

## 핵심 원칙

### 1. 품질 우선

- 모든 기능은 테스트와 함께 구현해야 한다(SHALL)

## 금지 사항

- 테스트 없이 배포해서는 안 된다(SHALL NOT)
`;

      const result = parseConstitution(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projectName).toBe('TestProject');
        expect(result.data.metadata.version).toBe('1.0.0');
        expect(result.data.principles.length).toBeGreaterThan(0);
        expect(result.data.forbidden.length).toBeGreaterThan(0);
      }
    });

    it('잘못된 형식의 Constitution은 파싱 실패한다', async () => {
      const { parseConstitution } = await import('../../../../src/core/constitution/parser.js');

      const content = `# Invalid Constitution
No frontmatter here.
`;

      const result = parseConstitution(content);
      expect(result.success).toBe(false);
    });
  });

  describe('bumpVersion', () => {
    it('MAJOR 버전을 올릴 수 있다', async () => {
      const { bumpVersion } = await import('../../../../src/core/constitution/schemas.js');
      expect(bumpVersion('1.2.3', 'major')).toBe('2.0.0');
    });

    it('MINOR 버전을 올릴 수 있다', async () => {
      const { bumpVersion } = await import('../../../../src/core/constitution/schemas.js');
      expect(bumpVersion('1.2.3', 'minor')).toBe('1.3.0');
    });

    it('PATCH 버전을 올릴 수 있다', async () => {
      const { bumpVersion } = await import('../../../../src/core/constitution/schemas.js');
      expect(bumpVersion('1.2.3', 'patch')).toBe('1.2.4');
    });
  });

  describe('CHANGELOG', () => {
    it('CHANGELOG 항목을 생성할 수 있다', async () => {
      const { createChangelogEntry } = await import('../../../../src/core/constitution/changelog.js');

      const entry = createChangelogEntry(
        '1.0.0',
        'minor',
        [{ type: 'added', description: '새 원칙 추가' }],
        '보안 강화를 위해'
      );

      expect(entry.version).toBe('1.1.0');
      expect(entry.changes.length).toBe(1);
      expect(entry.changes[0].type).toBe('added');
      expect(entry.reason).toBe('보안 강화를 위해');
    });

    it('CHANGELOG 문자열을 생성할 수 있다', async () => {
      const { generateChangelog, createChangelogEntry } = await import('../../../../src/core/constitution/changelog.js');

      const entry = createChangelogEntry(
        '1.0.0',
        'minor',
        [{ type: 'added', description: '새 원칙 추가' }]
      );

      const changelog = generateChangelog([entry]);

      expect(changelog).toContain('# Constitution Changelog');
      expect(changelog).toContain('[1.1.0]');
      expect(changelog).toContain('Added');
      expect(changelog).toContain('새 원칙 추가');
    });

    it('CHANGELOG를 파싱할 수 있다', async () => {
      const { parseChangelog } = await import('../../../../src/core/constitution/changelog.js');

      const content = `# Constitution Changelog

## [1.1.0] - 2025-01-15

### Added
- 새 원칙 추가

### Reason
- 보안 강화를 위해

---

## [1.0.0] - 2025-01-01

### Added
- 초기 버전

---
`;

      const result = parseChangelog(content);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(2);
        expect(result.data[0].version).toBe('1.1.0');
        expect(result.data[1].version).toBe('1.0.0');
      }
    });
  });

  describe('suggestBumpType', () => {
    it('removed가 있으면 MAJOR를 추천한다', async () => {
      const { suggestBumpType } = await import('../../../../src/core/constitution/changelog.js');

      const bumpType = suggestBumpType([
        { type: 'removed', description: '기존 원칙 삭제' }
      ]);

      expect(bumpType).toBe('major');
    });

    it('added가 있으면 MINOR를 추천한다', async () => {
      const { suggestBumpType } = await import('../../../../src/core/constitution/changelog.js');

      const bumpType = suggestBumpType([
        { type: 'added', description: '새 원칙 추가' }
      ]);

      expect(bumpType).toBe('minor');
    });

    it('fixed만 있으면 PATCH를 추천한다', async () => {
      const { suggestBumpType } = await import('../../../../src/core/constitution/changelog.js');

      const bumpType = suggestBumpType([
        { type: 'fixed', description: '오타 수정' }
      ]);

      expect(bumpType).toBe('patch');
    });
  });

  describe('spec generation with constitution version', () => {
    it('Constitution 버전이 spec에 포함된다', async () => {
      const { generateSpec } = await import('../../../../src/core/new/spec-generator.js');

      const spec = generateSpec({
        id: 'test-feature',
        title: '테스트 기능',
        description: '테스트 설명',
        constitutionVersion: '1.2.0',
      });

      expect(spec).toContain('constitution_version: 1.2.0');
    });

    it('Constitution 버전이 없으면 필드가 생략된다', async () => {
      const { generateSpec } = await import('../../../../src/core/new/spec-generator.js');

      const spec = generateSpec({
        id: 'test-feature',
        title: '테스트 기능',
        description: '테스트 설명',
      });

      expect(spec).not.toContain('constitution_version');
    });
  });
});

describe('CLI 핵심 로직', () => {
  describe('determineBumpType', () => {
    it('major 옵션이면 major를 반환한다', () => {
      const options: BumpOptions = { major: true };
      expect(determineBumpType(options)).toBe('major');
    });

    it('minor 옵션이면 minor를 반환한다', () => {
      const options: BumpOptions = { minor: true };
      expect(determineBumpType(options)).toBe('minor');
    });

    it('patch 옵션이면 patch를 반환한다', () => {
      const options: BumpOptions = { patch: true };
      expect(determineBumpType(options)).toBe('patch');
    });

    it('아무 옵션도 없으면 null을 반환한다', () => {
      const options: BumpOptions = {};
      expect(determineBumpType(options)).toBeNull();
    });

    it('major가 다른 옵션보다 우선한다', () => {
      const options: BumpOptions = { major: true, minor: true, patch: true };
      expect(determineBumpType(options)).toBe('major');
    });
  });

  describe('readConstitution', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-const-test-'));
      await fs.mkdir(path.join(tempDir, '.sdd'), { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('Constitution 파일이 없으면 실패한다', async () => {
      const result = await readConstitution(tempDir);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Constitution이 없습니다');
      }
    });

    it('유효한 Constitution을 읽는다', async () => {
      const constitutionContent = `---
version: 1.0.0
created: 2024-01-01
---

# Constitution: test-project

## 핵심 원칙

### 1. 품질 우선

- 테스트는 필수다(SHALL)
`;
      await fs.writeFile(
        path.join(tempDir, '.sdd', 'constitution.md'),
        constitutionContent
      );

      const result = await readConstitution(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe(constitutionContent);
        expect(result.data.parsed.projectName).toBe('test-project');
        expect(result.data.parsed.metadata.version).toBe('1.0.0');
      }
    });
  });

  describe('constitutionToJson', () => {
    it('Constitution 객체를 JSON으로 변환한다', () => {
      const constitution = {
        projectName: 'test-project',
        metadata: {
          version: '1.2.3',
          created: '2024-01-01',
          updated: '2024-06-01',
        },
        description: '테스트 설명',
        principles: [
          {
            id: '1',
            title: '품질 우선',
            description: '품질을 최우선으로',
            level: 'core' as const,
            rules: ['테스트 필수'],
          },
        ],
        forbidden: ['스펙 없이 구현'],
        techStack: ['TypeScript'],
        qualityStandards: ['커버리지 80%'],
        rawContent: '',
      };

      const json = constitutionToJson(constitution);

      expect(json).toEqual({
        projectName: 'test-project',
        version: '1.2.3',
        created: '2024-01-01',
        updated: '2024-06-01',
        principles: constitution.principles,
        forbidden: ['스펙 없이 구현'],
        techStack: ['TypeScript'],
        qualityStandards: ['커버리지 80%'],
      });
    });
  });

  describe('executeBump', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-bump-test-'));
      await fs.mkdir(path.join(tempDir, '.sdd'), { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('Constitution이 없으면 실패한다', async () => {
      const result = await executeBump(tempDir, 'patch');

      expect(result.success).toBe(false);
    });

    it('patch 버전을 올린다', async () => {
      const constitutionContent = `---
version: 1.0.0
created: 2024-01-01
---

# Constitution: test-project

## 핵심 원칙

### 1. 품질 우선

- 테스트는 필수다(SHALL)
`;
      await fs.writeFile(
        path.join(tempDir, '.sdd', 'constitution.md'),
        constitutionContent
      );

      const result = await executeBump(tempDir, 'patch');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.previousVersion).toBe('1.0.0');
        expect(result.data.newVersion).toBe('1.0.1');
      }
    });

    it('CHANGELOG 파일을 생성한다', async () => {
      const constitutionContent = `---
version: 1.0.0
created: 2024-01-01
---

# Constitution: test-project

## 핵심 원칙
`;
      await fs.writeFile(
        path.join(tempDir, '.sdd', 'constitution.md'),
        constitutionContent
      );

      const result = await executeBump(tempDir, 'patch', '버그 수정');

      expect(result.success).toBe(true);
      if (result.success) {
        const changelogExists = await fs
          .stat(result.data.changelogPath)
          .then(() => true)
          .catch(() => false);
        expect(changelogExists).toBe(true);

        const changelog = await fs.readFile(result.data.changelogPath, 'utf-8');
        expect(changelog).toContain('1.0.1');
        expect(changelog).toContain('버그 수정');
      }
    });
  });

  describe('executeValidateConstitution', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-validate-test-'));
      await fs.mkdir(path.join(tempDir, '.sdd'), { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('Constitution이 없으면 실패한다', async () => {
      const result = await executeValidateConstitution(tempDir);

      expect(result.success).toBe(false);
    });

    it('유효한 Constitution을 검증한다', async () => {
      const constitutionContent = `---
version: 1.0.0
created: 2024-01-01
---

# Constitution: test-project

## 핵심 원칙

### 1. 품질 우선

- 테스트는 필수다(SHALL)
`;
      await fs.writeFile(
        path.join(tempDir, '.sdd', 'constitution.md'),
        constitutionContent
      );

      const result = await executeValidateConstitution(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projectName).toBe('test-project');
      }
    });
  });

  describe('getHistory', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-history-test-'));
      await fs.mkdir(path.join(tempDir, '.sdd'), { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('CHANGELOG가 없으면 빈 배열을 반환한다', async () => {
      const result = await getHistory(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entries).toEqual([]);
        expect(result.data.totalCount).toBe(0);
      }
    });

    it('CHANGELOG 항목을 읽는다', async () => {
      const changelogContent = `# Constitution Changelog

## [1.0.1] - 2024-06-01

### Fixed
- 버그 수정

---

## [1.0.0] - 2024-01-01

### Added
- 초기 버전

---
`;
      await fs.writeFile(
        path.join(tempDir, '.sdd', 'CHANGELOG.md'),
        changelogContent
      );

      const result = await getHistory(tempDir);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entries.length).toBeGreaterThan(0);
      }
    });
  });
});
