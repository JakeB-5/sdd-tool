/**
 * Sync 통합 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { executeSync } from '../../../../src/core/sync/index.js';

describe('executeSync', () => {
  let tempDir: string;
  let specsDir: string;
  let srcDir: string;
  let testsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-sync-test-'));
    specsDir = path.join(tempDir, '.sdd', 'specs');
    srcDir = path.join(tempDir, 'src');
    testsDir = path.join(tempDir, 'tests');

    await fs.mkdir(specsDir, { recursive: true });
    await fs.mkdir(srcDir, { recursive: true });
    await fs.mkdir(testsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('스펙과 코드를 동기화 검증한다', async () => {
    // 스펙 생성
    const featureDir = path.join(specsDir, 'auth');
    await fs.mkdir(featureDir);
    await fs.writeFile(
      path.join(featureDir, 'spec.md'),
      `---
id: auth
---

### REQ-001: 로그인

시스템은 로그인을 지원해야 한다(SHALL).

### REQ-002: 로그아웃

시스템은 로그아웃을 지원해야 한다(SHALL).
`
    );

    // 코드 생성 (REQ-001만 구현)
    await fs.writeFile(
      path.join(srcDir, 'auth.ts'),
      `/**
 * @spec REQ-001
 */
export function login() {}
`
    );

    const result = await executeSync(tempDir, { srcDir });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.result.totalRequirements).toBe(2);
    expect(result.data!.result.totalImplemented).toBe(1);
    expect(result.data!.result.implemented).toContain('REQ-001');
    expect(result.data!.result.missing).toContain('REQ-002');
    expect(result.data!.result.syncRate).toBe(50);
  });

  it('테스트 파일에서 REQ-xxx를 인식한다', async () => {
    // 스펙 생성
    const featureDir = path.join(specsDir, 'feature');
    await fs.mkdir(featureDir);
    await fs.writeFile(
      path.join(featureDir, 'spec.md'),
      `### REQ-001: 기능

내용(SHALL).
`
    );

    // 테스트 생성
    await fs.writeFile(
      path.join(testsDir, 'feature.test.ts'),
      `it('REQ-001: 기능이 동작한다', () => {});
`
    );

    const result = await executeSync(tempDir, { srcDir });

    expect(result.success).toBe(true);
    expect(result.data!.result.implemented).toContain('REQ-001');
    expect(result.data!.result.syncRate).toBe(100);
  });

  it('특정 스펙만 검증한다', async () => {
    // 스펙 1
    const auth = path.join(specsDir, 'auth');
    await fs.mkdir(auth);
    await fs.writeFile(path.join(auth, 'spec.md'), `### REQ-001: 인증\n(SHALL)`);

    // 스펙 2
    const profile = path.join(specsDir, 'profile');
    await fs.mkdir(profile);
    await fs.writeFile(path.join(profile, 'spec.md'), `### REQ-002: 프로필\n(SHALL)`);

    const result = await executeSync(tempDir, { specId: 'auth', srcDir });

    expect(result.success).toBe(true);
    expect(result.data!.result.totalRequirements).toBe(1);
    expect(result.data!.result.requirements[0].specId).toBe('auth');
  });

  it('JSON 출력을 생성한다', async () => {
    const featureDir = path.join(specsDir, 'feature');
    await fs.mkdir(featureDir);
    await fs.writeFile(path.join(featureDir, 'spec.md'), `### REQ-001: 기능\n(SHALL)`);

    const result = await executeSync(tempDir, { json: true, srcDir });

    expect(result.success).toBe(true);
    expect(result.data!.output).toContain('"syncRate"');

    const parsed = JSON.parse(result.data!.output);
    expect(parsed.totalRequirements).toBe(1);
  });

  it('마크다운 출력을 생성한다', async () => {
    const featureDir = path.join(specsDir, 'feature');
    await fs.mkdir(featureDir);
    await fs.writeFile(path.join(featureDir, 'spec.md'), `### REQ-001: 기능\n(SHALL)`);

    const result = await executeSync(tempDir, { markdown: true, srcDir });

    expect(result.success).toBe(true);
    expect(result.data!.output).toContain('# SDD Sync 리포트');
    expect(result.data!.output).toContain('## 요약');
  });

  it('CI 모드에서 임계값 미달 시 실패한다', async () => {
    // 스펙 생성 (2개 요구사항)
    const featureDir = path.join(specsDir, 'feature');
    await fs.mkdir(featureDir);
    await fs.writeFile(
      path.join(featureDir, 'spec.md'),
      `### REQ-001: 기능1\n(SHALL)\n### REQ-002: 기능2\n(SHALL)`
    );

    // 코드 생성 (1개만 구현 = 50%)
    await fs.writeFile(path.join(srcDir, 'impl.ts'), `// @spec REQ-001`);

    const result = await executeSync(tempDir, {
      ci: true,
      threshold: 80,
      srcDir,
    });

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('50%');
    expect(result.error?.message).toContain('80%');
  });

  it('요구사항이 없으면 성공한다', async () => {
    // 빈 스펙 디렉토리
    const result = await executeSync(tempDir, { srcDir });

    expect(result.success).toBe(true);
    expect(result.data!.result.syncRate).toBe(100);
    expect(result.data!.output).toContain('요구사항이 없습니다');
  });

  it('고아 코드를 감지한다', async () => {
    // 스펙 생성
    const featureDir = path.join(specsDir, 'feature');
    await fs.mkdir(featureDir);
    await fs.writeFile(path.join(featureDir, 'spec.md'), `### REQ-001: 기능\n(SHALL)`);

    // 코드 생성 (스펙에 없는 REQ-999 참조)
    await fs.writeFile(
      path.join(srcDir, 'impl.ts'),
      `// @spec REQ-001
// @spec REQ-999
`
    );

    const result = await executeSync(tempDir, { srcDir });

    expect(result.success).toBe(true);
    expect(result.data!.result.orphans.length).toBeGreaterThan(0);
  });
});
