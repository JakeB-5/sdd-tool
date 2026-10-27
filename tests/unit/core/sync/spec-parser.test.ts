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

    it('본문에서 언급만 된 REQ-xxx는 요구사항으로 집계하지 않는다', async () => {
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
      expect(await parser.parseSpec('feature')).toEqual([]);
    });

    it('다른 스펙의 REQ를 언급해도 phantom 요구사항이 생기지 않는다', async () => {
      const shippingDir = path.join(specsDir, 'pricing', 'shipping');
      await fs.mkdir(shippingDir, { recursive: true });
      await fs.writeFile(
        path.join(shippingDir, 'spec.md'),
        `# 배송비

### REQ-01: 무료배송 기준

빈 카트의 배송비 면제는 \`pricing/checkout\` REQ-05가 적용해야 한다(SHALL).
`
      );

      const parser = new SpecParser(tempDir);
      const requirements = await parser.parseSpec('pricing/shipping');

      expect(requirements.map(r => r.id)).toEqual(['REQ-01']);
    });

    it('정의 앞에서 언급된 REQ가 이후 정의를 가리지 않는다', async () => {
      const featureDir = path.join(specsDir, 'coupon');
      await fs.mkdir(featureDir);
      await fs.writeFile(
        path.join(featureDir, 'spec.md'),
        `### REQ-04: 정액 할인

정액 쿠폰의 amount를 할인액으로 한다(SHALL) (상한은 REQ-05).

### REQ-05: 할인액 상한

할인액은 소계를 넘지 않는다(MUST).
`
      );

      const parser = new SpecParser(tempDir);
      const requirements = await parser.parseSpec('coupon');

      expect(requirements.map(r => [r.id, r.title])).toEqual([
        ['REQ-04', '정액 할인'],
        ['REQ-05', '할인액 상한'],
      ]);
      expect(requirements[1].keyword).toBe('MUST');
    });

    it('콜론 없는 헤더와 다양한 헤더 깊이를 정의로 인정한다', async () => {
      const featureDir = path.join(specsDir, 'feature');
      await fs.mkdir(featureDir);
      await fs.writeFile(
        path.join(featureDir, 'spec.md'),
        `## REQ-01 로그인
내용(SHALL).

#### REQ-02: 로그아웃
내용(SHOULD).

### REQ-03 - 세션
내용(MAY).

### REQ-04
제목 없음.
`
      );

      const parser = new SpecParser(tempDir);
      const requirements = await parser.parseSpec('feature');

      expect(requirements.map(r => [r.id, r.title])).toEqual([
        ['REQ-01', '로그인'],
        ['REQ-02', '로그아웃'],
        ['REQ-03', '세션'],
        ['REQ-04', undefined],
      ]);
    });

    it('REQ 헤더가 아닌 제목(REQ-01x)과 5단계 이상 헤더는 정의가 아니다', async () => {
      const featureDir = path.join(specsDir, 'feature');
      await fs.mkdir(featureDir);
      await fs.writeFile(
        path.join(featureDir, 'spec.md'),
        `### REQ-01x: 이상한 ID
##### REQ-02: 너무 깊은 헤더
`
      );

      const parser = new SpecParser(tempDir);
      expect(await parser.parseSpec('feature')).toEqual([]);
    });

    it('스펙 제목은 frontmatter title을 우선하고 없으면 첫 H1을 쓴다', async () => {
      await fs.mkdir(path.join(specsDir, 'with-fm'));
      await fs.writeFile(
        path.join(specsDir, 'with-fm', 'spec.md'),
        `---
id: with-fm
title: "프론트매터 제목"
---

# 본문 제목

### REQ-01: 요구사항 제목
`
      );
      await fs.mkdir(path.join(specsDir, 'h1-only'));
      await fs.writeFile(
        path.join(specsDir, 'h1-only', 'spec.md'),
        `# H1 제목

### REQ-01: 요구사항 제목
`
      );

      const parser = new SpecParser(tempDir);
      const withFm = await parser.parseSpec('with-fm');
      const h1Only = await parser.parseSpec('h1-only');

      expect(withFm[0].specTitle).toBe('프론트매터 제목');
      expect(withFm[0].title).toBe('요구사항 제목');
      expect(h1Only[0].specTitle).toBe('H1 제목');
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
    it('spec.md가 있는 스펙 디렉토리 목록을 반환한다', async () => {
      for (const name of ['spec1', 'spec2', 'spec3']) {
        await fs.mkdir(path.join(specsDir, name));
        await fs.writeFile(path.join(specsDir, name, 'spec.md'), '# spec');
      }
      // spec.md가 없는 디렉토리는 스펙이 아님
      await fs.mkdir(path.join(specsDir, 'empty'));

      const parser = new SpecParser(tempDir);
      const specs = await parser.listSpecs();

      expect(specs).toEqual(['spec1', 'spec2', 'spec3']);
    });

    it('도메인 레이아웃은 canonical id(<domain>/<feature>)로 반환한다', async () => {
      await fs.mkdir(path.join(specsDir, 'auth', 'login'), { recursive: true });
      await fs.writeFile(path.join(specsDir, 'auth', 'login', 'spec.md'), '# login');
      await fs.mkdir(path.join(specsDir, 'legacy'));
      await fs.writeFile(path.join(specsDir, 'legacy', 'spec.md'), '# legacy');

      const parser = new SpecParser(tempDir);
      expect(await parser.listSpecs()).toEqual(['auth/login', 'legacy']);
    });
  });

  describe('도메인 레이아웃', () => {
    beforeEach(async () => {
      await fs.mkdir(path.join(specsDir, 'auth', 'login'), { recursive: true });
      await fs.writeFile(
        path.join(specsDir, 'auth', 'login', 'spec.md'),
        `### REQ-001: 로그인
시스템은 로그인을 지원해야 한다(SHALL).
`
      );
      // plan.md의 REQ는 요구사항으로 집계하지 않음
      await fs.writeFile(path.join(specsDir, 'auth', 'login', 'plan.md'), '### REQ-999: plan');
    });

    it('parseAllSpecs가 중첩 스펙의 요구사항을 canonical id로 추출한다', async () => {
      const parser = new SpecParser(tempDir);
      const requirements = await parser.parseAllSpecs();

      expect(requirements).toHaveLength(1);
      expect(requirements[0]).toMatchObject({ id: 'REQ-001', specId: 'auth/login' });
    });

    it('parseSpec이 bare feature와 canonical id를 모두 해석한다', async () => {
      const parser = new SpecParser(tempDir);

      expect((await parser.parseSpec('login'))[0]?.specId).toBe('auth/login');
      expect((await parser.parseSpec('auth/login'))[0]?.specId).toBe('auth/login');
    });
  });
});
