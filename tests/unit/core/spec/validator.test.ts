/**
 * 스펙 검증기 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  validateSpecFile,
  validateSpecs,
  validateDependencies,
} from '../../../../src/core/spec/validator.js';

const VALID_SPEC = `---
status: draft
created: 2025-12-21
---

# 유효한 스펙

> 테스트용 스펙

## Requirement: 기능

시스템은 기능을 제공해야 한다(SHALL).

### Scenario: 동작 확인

- **GIVEN** 조건
- **WHEN** 행동
- **THEN** 결과
`;

const INVALID_SPEC_NO_RFC = `---
status: draft
---

# 잘못된 스펙

## Requirement: 기능

일반적인 설명입니다.

### Scenario: 동작 확인

- **GIVEN** 조건
- **WHEN** 행동
- **THEN** 결과
`;

const INVALID_SPEC_NO_GWT = `---
status: draft
---

# 잘못된 스펙

## Requirement: 기능

시스템은 기능을 제공해야 한다(SHALL).
`;

describe('validateSpecFile', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-validator-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('유효한 스펙 파일을 통과시킨다', async () => {
    const filePath = path.join(tempDir, 'valid.md');
    await fs.writeFile(filePath, VALID_SPEC);

    const result = await validateSpecFile(filePath);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('RFC 2119 키워드가 없으면 에러를 반환한다', async () => {
    const filePath = path.join(tempDir, 'no-rfc.md');
    await fs.writeFile(filePath, INVALID_SPEC_NO_RFC);

    const result = await validateSpecFile(filePath);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'E204')).toBe(true);
  });

  it('GIVEN-WHEN-THEN이 없으면 에러를 반환한다', async () => {
    const filePath = path.join(tempDir, 'no-gwt.md');
    await fs.writeFile(filePath, INVALID_SPEC_NO_GWT);

    const result = await validateSpecFile(filePath);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'E205')).toBe(true);
  });

  it('created가 없으면 경고를 반환한다', async () => {
    const specWithoutCreated = `---
status: draft
---

# 스펙

## Requirement: 기능

시스템은 기능을 제공해야 한다(SHALL).

### Scenario: 동작

- **GIVEN** 조건
- **WHEN** 행동
- **THEN** 결과
`;
    const filePath = path.join(tempDir, 'no-created.md');
    await fs.writeFile(filePath, specWithoutCreated);

    const result = await validateSpecFile(filePath);

    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.message.includes('created'))).toBe(true);
  });

  it('strict 모드에서 경고도 에러로 처리한다', async () => {
    const specWithoutCreated = `---
status: draft
---

# 스펙

## Requirement: 기능

시스템은 기능을 제공해야 한다(SHALL).

### Scenario: 동작

- **GIVEN** 조건
- **WHEN** 행동
- **THEN** 결과
`;
    const filePath = path.join(tempDir, 'no-created.md');
    await fs.writeFile(filePath, specWithoutCreated);

    const result = await validateSpecFile(filePath, { strict: true });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('[STRICT]'))).toBe(true);
  });

  it('존재하지 않는 파일에 대해 에러를 반환한다', async () => {
    const filePath = path.join(tempDir, 'nonexistent.md');

    const result = await validateSpecFile(filePath);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'E102')).toBe(true);
  });
});

describe('validateSpecs', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-validator-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function writeSpec(relDir: string, content: string): Promise<void> {
    await fs.mkdir(path.join(tempDir, relDir), { recursive: true });
    await fs.writeFile(path.join(tempDir, relDir, 'spec.md'), content);
  }

  it('디렉토리 내 모든 스펙을 검증한다', async () => {
    // 유효한 스펙 2개, 무효한 스펙 1개 생성 (평면 + 도메인 레이아웃 혼합)
    await writeSpec('valid1', VALID_SPEC);
    await writeSpec('auth/valid2', VALID_SPEC);
    await writeSpec('invalid', INVALID_SPEC_NO_RFC);

    const result = await validateSpecs(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.passed).toBe(2);
      expect(result.data.failed).toBe(1);
      expect(result.data.files).toHaveLength(3);
    }
  });

  it('하위 디렉토리도 검증한다', async () => {
    const subDir = path.join(tempDir, 'subdir');
    await fs.mkdir(subDir);
    await fs.writeFile(path.join(subDir, 'spec.md'), VALID_SPEC);

    const result = await validateSpecs(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.passed).toBe(1);
    }
  });

  it('index.md와 README.md는 제외한다', async () => {
    await writeSpec('valid', VALID_SPEC);
    await fs.writeFile(path.join(tempDir, 'index.md'), '# Index');
    await fs.writeFile(path.join(tempDir, 'README.md'), '# Readme');

    const result = await validateSpecs(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files).toHaveLength(1);
    }
  });

  it('단일 파일도 검증한다', async () => {
    const filePath = path.join(tempDir, 'single.md');
    await fs.writeFile(filePath, VALID_SPEC);

    const result = await validateSpecs(filePath);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.passed).toBe(1);
      expect(result.data.files).toHaveLength(1);
    }
  });

  it('plan.md, tasks.md, prepare.md 등 보조 문서는 제외한다', async () => {
    await writeSpec('valid', VALID_SPEC);
    for (const name of ['plan.md', 'tasks.md', 'checklist.md', 'prepare.md']) {
      await fs.writeFile(path.join(tempDir, 'valid', name), `# ${name}`);
    }

    const result = await validateSpecs(tempDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files).toHaveLength(1);
      expect(result.data.failed).toBe(0);
    }
  });

  it('프로젝트의 .sdd를 넘기면 specs 아래 spec.md만 검증한다', async () => {
    const sddDir = path.join(tempDir, '.sdd');
    await fs.mkdir(path.join(sddDir, 'templates'), { recursive: true });
    await fs.writeFile(path.join(sddDir, 'constitution.md'), '# Constitution');
    await fs.writeFile(path.join(sddDir, 'templates', 'spec.md'), '# template');
    await fs.mkdir(path.join(sddDir, 'specs', 'auth', 'login'), { recursive: true });
    await fs.writeFile(path.join(sddDir, 'specs', 'auth', 'login', 'spec.md'), VALID_SPEC);

    const result = await validateSpecs(sddDir);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.files).toHaveLength(1);
      expect(result.data.passed).toBe(1);
    }
  });
});

describe('validateDependencies', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-validate-deps-'));
    specsDir = path.join(tempDir, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  // 참고: SpecMetadataSchema에 dependencies 필드가 없어서
  // 현재 validateDependencies는 dependencies 배열을 감지하지 못함
  // 기본적인 동작만 테스트

  it('존재하지 않는 파일은 빈 배열을 반환한다', async () => {
    const brokenLinks = await validateDependencies('/nonexistent.md', specsDir);

    expect(brokenLinks).toHaveLength(0);
  });

  it('의존성이 없으면 빈 배열을 반환한다', async () => {
    const specPath = path.join(specsDir, 'no-deps.md');
    await fs.writeFile(
      specPath,
      `---
id: no-deps
title: "의존성 없음"
status: draft
depends: null
---

# 의존성 없음

시스템은 기능을 제공해야 한다(SHALL).

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const brokenLinks = await validateDependencies(specPath, specsDir);

    expect(brokenLinks).toHaveLength(0);
  });

  it('파싱 실패 시 빈 배열을 반환한다', async () => {
    const specPath = path.join(specsDir, 'invalid.md');
    await fs.writeFile(specPath, 'invalid content without frontmatter');

    const brokenLinks = await validateDependencies(specPath, specsDir);

    expect(brokenLinks).toHaveLength(0);
  });
});

describe('validateSpecFile 링크 검증', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-link-test-'));
    specsDir = path.join(tempDir, 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('깨진 내부 링크를 감지한다', async () => {
    const specPath = path.join(specsDir, 'broken-link.md');
    await fs.writeFile(
      specPath,
      `---
id: broken-link
title: "깨진 링크"
status: draft
created: 2025-01-01
depends: null
---

# 깨진 링크

시스템은 기능을 제공해야 한다(SHALL).

[관련 문서](./nonexistent.md)

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await validateSpecFile(specPath, {
      checkLinks: true,
      specsRoot: specsDir,
    });

    expect(result.brokenLinks).toBeDefined();
    expect(result.brokenLinks!.length).toBeGreaterThan(0);
    expect(result.brokenLinks![0].type).toBe('internal');
  });

  it('외부 링크는 무시한다', async () => {
    const specPath = path.join(specsDir, 'external-link.md');
    await fs.writeFile(
      specPath,
      `---
id: external-link
title: "외부 링크"
status: draft
created: 2025-01-01
depends: null
---

# 외부 링크

시스템은 기능을 제공해야 한다(SHALL).

[GitHub](https://github.com)
[Docs](http://example.com)
[Section](#section)

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await validateSpecFile(specPath, {
      checkLinks: true,
      specsRoot: specsDir,
    });

    expect(result.brokenLinks || []).toHaveLength(0);
  });

  it('유효한 내부 링크는 통과한다', async () => {
    // 참조할 파일 생성
    await fs.writeFile(path.join(specsDir, 'related.md'), '# Related');

    const specPath = path.join(specsDir, 'valid-link.md');
    await fs.writeFile(
      specPath,
      `---
id: valid-link
title: "유효한 링크"
status: draft
created: 2025-01-01
depends: null
---

# 유효한 링크

시스템은 기능을 제공해야 한다(SHALL).

[관련 문서](./related.md)

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await validateSpecFile(specPath, {
      checkLinks: true,
      specsRoot: specsDir,
    });

    expect(result.brokenLinks || []).toHaveLength(0);
  });

  it('스펙 참조 링크를 검증한다', async () => {
    // auth-service 스펙 생성
    const authDir = path.join(specsDir, 'auth-service');
    await fs.mkdir(authDir);
    await fs.writeFile(path.join(authDir, 'spec.md'), '# Auth');

    const specPath = path.join(specsDir, 'spec-ref.md');
    await fs.writeFile(
      specPath,
      `---
id: spec-ref
title: "스펙 참조"
status: draft
created: 2025-01-01
depends: null
---

# 스펙 참조

시스템은 기능을 제공해야 한다(SHALL).

참조: \`auth-service\`
참조: \`nonexistent-spec\`

## Scenario: 테스트

- **GIVEN** 조건
- **WHEN** 동작
- **THEN** 결과
`
    );

    const result = await validateSpecFile(specPath, {
      checkLinks: true,
      specsRoot: specsDir,
    });

    // nonexistent-spec은 깨진 링크로 감지되어야 함
    const specRefs = (result.brokenLinks || []).filter(
      (l) => l.type === 'spec-reference'
    );
    expect(specRefs.length).toBeGreaterThanOrEqual(1);
  });
});

describe('validateSpecFile - 상태/플레이스홀더/Constitution', () => {
  let tempDir: string;

  const specWith = (frontmatter: string, body = ''): string => `---
${frontmatter}
---

# 스펙

## 요구사항

- 시스템은 기능을 제공해야 한다(SHALL).
${body}
### Scenario: 확인

- **GIVEN** 조건
- **WHEN** 행동
- **THEN** 결과
`;

  const writeConstitution = async (content: string): Promise<void> => {
    await fs.mkdir(path.join(tempDir, '.sdd'), { recursive: true });
    await fs.writeFile(path.join(tempDir, '.sdd', 'constitution.md'), content);
  };

  const constitutionV = (version: string): string =>
    `---\nversion: ${version}\ncreated: 2025-01-01\n---\n\n# Constitution: 테스트\n`;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-validator-ext-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('implementing 등 모든 표준 상태가 검증을 통과한다', async () => {
    for (const status of ['review', 'planned', 'tasked', 'implementing', 'implemented', 'deprecated']) {
      const filePath = path.join(tempDir, `${status}.md`);
      await fs.writeFile(filePath, specWith(`status: ${status}\ncreated: 2025-12-21`));
      const result = await validateSpecFile(filePath, { strict: true });
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    }
  });

  it('레거시 상태 별칭은 에러가 아니라 W006 경고로 처리한다', async () => {
    const filePath = path.join(tempDir, 'legacy.md');
    await fs.writeFile(filePath, specWith('status: completed\ncreated: 2025-12-21'));
    const result = await validateSpecFile(filePath);
    expect(result.valid).toBe(true);
    expect(result.warnings.map((w) => w.code)).toEqual(['W006']);
    expect(result.warnings[0].message).toContain('implemented');
  });

  it('depends 목록, 숫자 constitution_version, title을 가진 스펙이 통과한다', async () => {
    const filePath = path.join(tempDir, 'meta.md');
    await fs.writeFile(
      filePath,
      specWith('id: meta\ntitle: "Auth: \\"Login\\""\nstatus: draft\ncreated: 2025-12-21\ndepends:\n  - auth\n  - db\nconstitution_version: 1.0')
    );
    const result = await validateSpecFile(filePath, { strict: true });
    expect(result.errors).toEqual([]);
  });

  it('템플릿 플레이스홀더가 남아 있으면 W005 경고를 낸다', async () => {
    const filePath = path.join(tempDir, 'placeholder.md');
    await fs.writeFile(
      filePath,
      specWith('status: draft\ncreated: 2025-12-21', '\n[요구사항 상세 설명]\n- **GIVEN** [전제 조건]\n')
    );
    const result = await validateSpecFile(filePath);
    const w005 = result.warnings.find((w) => w.code === 'W005');
    expect(w005?.message).toContain('[요구사항 상세 설명]');
    expect(w005?.message).toContain('[전제 조건]');
  });

  it('frontmatter에 채우지 않은 {{PLACEHOLDER}}가 있으면 W005를 내고 strict에서 실패한다', async () => {
    const filePath = path.join(tempDir, 'fm-placeholder.md');
    await fs.writeFile(
      filePath,
      specWith('id: "{{FEATURE_ID}}"\ntitle: "{{FEATURE_NAME}}"\nstatus: draft\ncreated: 2025-12-21')
    );

    const lenient = await validateSpecFile(filePath);
    const w005 = lenient.warnings.find((w) => w.code === 'W005');
    expect(w005?.message).toContain('{{FEATURE_ID}}');
    expect(w005?.message).toContain('{{FEATURE_NAME}}');

    const strict = await validateSpecFile(filePath, { strict: true });
    expect(strict.valid).toBe(false);
  });

  it('템플릿의 frontmatter를 채우면 strict를 통과한다', async () => {
    const filePath = path.join(tempDir, 'fm-filled.md');
    await fs.writeFile(
      filePath,
      specWith('id: login\ntitle: "로그인"\nstatus: draft\ncreated: 2025-12-21\ndepends: null\nconstitution_version: "1.0.0"')
    );

    const result = await validateSpecFile(filePath, { strict: true });

    expect(result.warnings).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('constitution_version이 없으면 스펙별 경고를 내지 않는다', async () => {
    await writeConstitution(constitutionV('1.2.0'));
    const filePath = path.join(tempDir, 'nover.md');
    await fs.writeFile(filePath, specWith('status: draft\ncreated: 2025-12-21'));
    const result = await validateSpecFile(filePath, { checkConstitution: true, sddRoot: tempDir, strict: true });
    expect(result.warnings).toEqual([]);
    expect(result.valid).toBe(true);
    expect(result.constitutionCheck?.specVersionMissing).toBe(true);
  });

  it('patch 버전 차이는 정보로만 남고 --strict에서도 실패하지 않는다', async () => {
    await writeConstitution(constitutionV('1.2.1'));
    const filePath = path.join(tempDir, 'patch.md');
    await fs.writeFile(filePath, specWith('status: draft\ncreated: 2025-12-21\nconstitution_version: 1.2.0'));
    const result = await validateSpecFile(filePath, { checkConstitution: true, sddRoot: tempDir, strict: true });
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual([]);
    expect(result.constitutionCheck?.versionMismatch?.severity).toBe('info');
  });

  it('숫자 constitution_version: 1.0은 Constitution 3.0.0 대비 Major 불일치로 실패한다', async () => {
    await writeConstitution(constitutionV('3.0.0'));
    const filePath = path.join(tempDir, 'short.md');
    await fs.writeFile(filePath, specWith('status: draft\ncreated: 2025-12-21\nconstitution_version: 1.0'));
    const result = await validateSpecFile(filePath, { checkConstitution: true, sddRoot: tempDir });
    expect(result.valid).toBe(false);
    expect(result.constitutionCheck?.passed).toBe(false);
    expect(result.constitutionCheck?.versionMismatch?.specVersion).toBe('1.0.0');
  });

  it('소문자 RFC 2119 키워드만 있으면 에러와 함께 대문자 안내(W008)를 낸다', async () => {
    const filePath = path.join(tempDir, 'lower.md');
    await fs.writeFile(
      filePath,
      '---\nstatus: draft\ncreated: 2025-12-21\n---\n\n# 스펙\n\n## 요구사항\n\n- The system must log in users.\n\n### Scenario: 확인\n\n- **GIVEN** 조건\n- **WHEN** 행동\n- **THEN** 결과\n'
    );
    const result = await validateSpecFile(filePath);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('RFC 2119'))).toBe(true);
    const w008 = result.warnings.find((w) => w.code === 'W008');
    expect(w008?.message).toContain('대문자로 작성하세요');
    expect(w008?.message).toContain('MUST');
  });

  it('minor 버전 차이는 W004 경고로 남는다', async () => {
    await writeConstitution(constitutionV('1.3.0'));
    const filePath = path.join(tempDir, 'minor.md');
    await fs.writeFile(filePath, specWith('status: draft\ncreated: 2025-12-21\nconstitution_version: 1.2.0'));
    const result = await validateSpecFile(filePath, { checkConstitution: true, sddRoot: tempDir });
    expect(result.warnings.map((w) => w.code)).toEqual(['W004']);
  });

  it('Constitution 파싱 실패를 W007 경고로 노출한다', async () => {
    await writeConstitution('---\nversion: 1.0.0\n---\n\n# 제목 형식이 잘못됨\n');
    const filePath = path.join(tempDir, 'broken.md');
    await fs.writeFile(filePath, specWith('status: draft\ncreated: 2025-12-21'));
    const result = await validateSpecFile(filePath, { checkConstitution: true, sddRoot: tempDir });
    const w007 = result.warnings.find((w) => w.code === 'W007');
    expect(w007?.message).toContain('Constitution 파싱 실패');
    expect(result.constitutionCheck).toBeUndefined();
  });
});
