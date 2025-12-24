/**
 * 스펙 파서 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parseSpecFile, parseAllSpecs, parseSpecById } from '../../../../src/core/export/spec-parser.js';

describe('spec-parser', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-export-parser-'));
    specsDir = path.join(tempDir, '.sdd', 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('parseSpecFile', () => {
    it('메타데이터를 파싱한다', async () => {
      const specDir = path.join(specsDir, 'auth');
      await fs.mkdir(specDir);
      await fs.writeFile(
        path.join(specDir, 'spec.md'),
        `---
id: auth
title: "사용자 인증"
status: draft
version: 1.0.0
created: 2025-12-24
author: developer
---

# 사용자 인증

> JWT 기반 인증 시스템
`
      );

      const spec = await parseSpecFile(path.join(specDir, 'spec.md'), 'auth');

      expect(spec.id).toBe('auth');
      expect(spec.title).toBe('사용자 인증');
      expect(spec.status).toBe('draft');
      expect(spec.version).toBe('1.0.0');
      expect(spec.author).toBe('developer');
      expect(spec.description).toBe('JWT 기반 인증 시스템');
    });

    it('요구사항을 파싱한다', async () => {
      const specDir = path.join(specsDir, 'auth');
      await fs.mkdir(specDir);
      await fs.writeFile(
        path.join(specDir, 'spec.md'),
        `---
id: auth
---

### REQ-001: 로그인

시스템은 이메일/비밀번호 로그인을 지원해야 한다(SHALL).

### REQ-002: 로그아웃

시스템은 로그아웃을 지원해야 한다(SHOULD).
`
      );

      const spec = await parseSpecFile(path.join(specDir, 'spec.md'), 'auth');

      expect(spec.requirements).toHaveLength(2);
      expect(spec.requirements[0].id).toBe('REQ-001');
      expect(spec.requirements[0].title).toBe('로그인');
      expect(spec.requirements[0].keyword).toBe('SHALL');
      expect(spec.requirements[0].priority).toBe('high');
      expect(spec.requirements[1].id).toBe('REQ-002');
      expect(spec.requirements[1].keyword).toBe('SHOULD');
      expect(spec.requirements[1].priority).toBe('medium');
    });

    it('시나리오를 파싱한다', async () => {
      const specDir = path.join(specsDir, 'auth');
      await fs.mkdir(specDir);
      await fs.writeFile(
        path.join(specDir, 'spec.md'),
        `---
id: auth
---

### Scenario 1: 성공적인 로그인

- **GIVEN** 유효한 사용자 계정이 있을 때
- **WHEN** 올바른 이메일과 비밀번호로 로그인하면
- **THEN** JWT 토큰이 반환된다
- **AND** 토큰 만료 시간이 설정된다
`
      );

      const spec = await parseSpecFile(path.join(specDir, 'spec.md'), 'auth');

      expect(spec.scenarios).toHaveLength(1);
      expect(spec.scenarios[0].id).toBe('scenario-1');
      expect(spec.scenarios[0].title).toBe('성공적인 로그인');
      expect(spec.scenarios[0].given).toContain('유효한 사용자 계정이 있을 때');
      expect(spec.scenarios[0].when).toContain('올바른 이메일과 비밀번호로 로그인하면');
      expect(spec.scenarios[0].then).toContain('JWT 토큰이 반환된다');
      expect(spec.scenarios[0].and).toContain('토큰 만료 시간이 설정된다');
    });

    it('의존성을 파싱한다', async () => {
      const specDir = path.join(specsDir, 'profile');
      await fs.mkdir(specDir);
      await fs.writeFile(
        path.join(specDir, 'spec.md'),
        `---
id: profile
dependencies: auth, database
---

# 프로필
`
      );

      const spec = await parseSpecFile(path.join(specDir, 'spec.md'), 'profile');

      expect(spec.dependencies).toContain('auth');
      expect(spec.dependencies).toContain('database');
    });
  });

  describe('parseAllSpecs', () => {
    it('모든 스펙을 파싱한다', async () => {
      // 스펙 1
      const authDir = path.join(specsDir, 'auth');
      await fs.mkdir(authDir);
      await fs.writeFile(
        path.join(authDir, 'spec.md'),
        `---
id: auth
title: "인증"
---
# 인증
`
      );

      // 스펙 2
      const profileDir = path.join(specsDir, 'profile');
      await fs.mkdir(profileDir);
      await fs.writeFile(
        path.join(profileDir, 'spec.md'),
        `---
id: profile
title: "프로필"
---
# 프로필
`
      );

      const specs = await parseAllSpecs(tempDir);

      expect(specs).toHaveLength(2);
      expect(specs.map(s => s.id)).toContain('auth');
      expect(specs.map(s => s.id)).toContain('profile');
    });
  });

  describe('parseSpecById', () => {
    it('ID로 스펙을 찾는다', async () => {
      const authDir = path.join(specsDir, 'auth');
      await fs.mkdir(authDir);
      await fs.writeFile(
        path.join(authDir, 'spec.md'),
        `---
id: auth
title: "인증"
---
# 인증
`
      );

      const spec = await parseSpecById(tempDir, 'auth');

      expect(spec).not.toBeNull();
      expect(spec?.id).toBe('auth');
    });

    it('없는 스펙은 null을 반환한다', async () => {
      const spec = await parseSpecById(tempDir, 'nonexistent');

      expect(spec).toBeNull();
    });
  });
});
