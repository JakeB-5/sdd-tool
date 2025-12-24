/**
 * 스펙 파서 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SpecParser } from '../../../../src/core/sync/spec-parser.js';

describe('SpecParser', () => {
  let tempDir: string;
  let specsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-spec-parser-'));
    specsDir = path.join(tempDir, '.sdd', 'specs');
    await fs.mkdir(specsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('parseSpec', () => {
    it('스펙 파일에서 요구사항 ID를 추출한다', async () => {
      const featureDir = path.join(specsDir, 'user-auth');
      await fs.mkdir(featureDir);
      await fs.writeFile(
        path.join(featureDir, 'spec.md'),
        `---
id: user-auth
title: "사용자 인증"
---

# 사용자 인증

## 요구사항

### REQ-001: 로그인

시스템은 이메일/비밀번호 로그인을 지원해야 한다(SHALL).

### REQ-002: 토큰 발급

시스템은 JWT 토큰을 발급해야 한다(MUST).
`
      );

      const parser = new SpecParser(tempDir);
      const requirements = await parser.parseSpec('user-auth');

      expect(requirements).toHaveLength(2);
      expect(requirements[0].id).toBe('REQ-001');
      expect(requirements[0].specId).toBe('user-auth');
      expect(requirements[0].title).toBe('로그인');
      expect(requirements[0].keyword).toBe('SHALL');

      expect(requirements[1].id).toBe('REQ-002');
      expect(requirements[1].keyword).toBe('MUST');
    });

    it('존재하지 않는 스펙은 빈 배열을 반환한다', async () => {
      const parser = new SpecParser(tempDir);
      const requirements = await parser.parseSpec('non-existent');

      expect(requirements).toEqual([]);
    });

    it('본문에서 REQ-xxx 패턴을 찾는다', async () => {
      const featureDir = path.join(specsDir, 'feature');
      await fs.mkdir(featureDir);
      await fs.writeFile(
        path.join(featureDir, 'spec.md'),
        `# 기능

REQ-001에 따라 시스템은 데이터를 저장한다(SHOULD).
REQ-002는 선택적이다(MAY).
`
      );

      const parser = new SpecParser(tempDir);
      const requirements = await parser.parseSpec('feature');

      expect(requirements).toHaveLength(2);
      expect(requirements.map(r => r.id)).toContain('REQ-001');
      expect(requirements.map(r => r.id)).toContain('REQ-002');
    });

    it('중복 REQ-xxx는 한 번만 추출한다', async () => {
      const featureDir = path.join(specsDir, 'feature');
      await fs.mkdir(featureDir);
      await fs.writeFile(
        path.join(featureDir, 'spec.md'),
        `# 기능

### REQ-001: 기능

REQ-001은 중요하다.
다시 언급하면 REQ-001이다.
`
      );

      const parser = new SpecParser(tempDir);
      const requirements = await parser.parseSpec('feature');

      expect(requirements).toHaveLength(1);
      expect(requirements[0].id).toBe('REQ-001');
    });
  });

  describe('parseAllSpecs', () => {
    it('모든 스펙에서 요구사항을 추출한다', async () => {
      // 스펙 1
      const feature1Dir = path.join(specsDir, 'feature1');
      await fs.mkdir(feature1Dir);
      await fs.writeFile(
        path.join(feature1Dir, 'spec.md'),
        `### REQ-001: 기능1
내용(SHALL).
`
      );

      // 스펙 2
      const feature2Dir = path.join(specsDir, 'feature2');
      await fs.mkdir(feature2Dir);
      await fs.writeFile(
        path.join(feature2Dir, 'spec.md'),
        `### REQ-002: 기능2
내용(MUST).
`
      );

      const parser = new SpecParser(tempDir);
      const requirements = await parser.parseAllSpecs();

      expect(requirements).toHaveLength(2);
      expect(requirements.map(r => r.specId)).toContain('feature1');
      expect(requirements.map(r => r.specId)).toContain('feature2');
    });

    it('빈 스펙 디렉토리는 빈 배열을 반환한다', async () => {
      const parser = new SpecParser(tempDir);
      const requirements = await parser.parseAllSpecs();

      expect(requirements).toEqual([]);
    });
  });

  describe('listSpecs', () => {
    it('스펙 디렉토리 목록을 반환한다', async () => {
      await fs.mkdir(path.join(specsDir, 'spec1'));
      await fs.mkdir(path.join(specsDir, 'spec2'));
      await fs.mkdir(path.join(specsDir, 'spec3'));

      const parser = new SpecParser(tempDir);
      const specs = await parser.listSpecs();

      expect(specs).toHaveLength(3);
      expect(specs).toContain('spec1');
      expect(specs).toContain('spec2');
      expect(specs).toContain('spec3');
    });
  });
});
