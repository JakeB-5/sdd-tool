/**
 * 테스트 스캐너 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { TestScanner } from '../../../../src/core/sync/test-scanner.js';

describe('TestScanner', () => {
  let tempDir: string;
  let testsDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-test-scanner-'));
    testsDir = path.join(tempDir, 'tests');
    await fs.mkdir(testsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('scan', () => {
    it('테스트 설명에서 REQ-xxx를 추출한다', async () => {
      await fs.writeFile(
        path.join(testsDir, 'auth.test.ts'),
        `describe('Auth', () => {
  it('REQ-001: 올바른 자격 증명으로 로그인한다', () => {
    // 테스트
  });

  it('REQ-002: 잘못된 비밀번호는 실패한다', () => {
    // 테스트
  });
});
`
      );

      const scanner = new TestScanner(tempDir);
      const refs = await scanner.scan();

      expect(refs).toHaveLength(2);
      expect(refs[0].reqId).toBe('REQ-001');
      expect(refs[0].type).toBe('test');
      expect(refs[1].reqId).toBe('REQ-002');
    });

    it('test() 함수도 인식한다', async () => {
      await fs.writeFile(
        path.join(testsDir, 'feature.test.ts'),
        `test('REQ-003: 기능이 동작한다', () => {
  // 테스트
});
`
      );

      const scanner = new TestScanner(tempDir);
      const refs = await scanner.scan();

      expect(refs).toHaveLength(1);
      expect(refs[0].reqId).toBe('REQ-003');
    });

    it('describe에서 REQ-xxx도 추출한다', async () => {
      await fs.writeFile(
        path.join(testsDir, 'suite.test.ts'),
        `describe('REQ-010: 기능 그룹', () => {
  it('should work', () => {});
});
`
      );

      const scanner = new TestScanner(tempDir);
      const refs = await scanner.scan();

      expect(refs).toHaveLength(1);
      expect(refs[0].reqId).toBe('REQ-010');
    });

    it('괄호 안에 REQ-xxx도 추출한다', async () => {
      await fs.writeFile(
        path.join(testsDir, 'impl.test.ts'),
        `it('should handle login (REQ-001)', () => {});
`
      );

      const scanner = new TestScanner(tempDir);
      const refs = await scanner.scan();

      expect(refs).toHaveLength(1);
      expect(refs[0].reqId).toBe('REQ-001');
    });

    it('.spec.ts 파일도 스캔한다', async () => {
      await fs.writeFile(
        path.join(testsDir, 'auth.spec.ts'),
        `it('REQ-005: 스펙 파일 테스트', () => {});
`
      );

      const scanner = new TestScanner(tempDir, { testDirs: [testsDir] });
      const refs = await scanner.scan();

      expect(refs).toHaveLength(1);
      expect(refs[0].reqId).toBe('REQ-005');
    });

    it('@spec 주석도 인식한다', async () => {
      await fs.writeFile(
        path.join(testsDir, 'annotated.test.ts'),
        `// @spec REQ-020
it('should work', () => {});
`
      );

      const scanner = new TestScanner(tempDir, { testDirs: [testsDir] });
      const refs = await scanner.scan();

      expect(refs).toHaveLength(1);
      expect(refs[0].reqId).toBe('REQ-020');
    });
  });

  describe('scanFile', () => {
    it('단일 테스트 파일을 스캔한다', async () => {
      const filePath = path.join(testsDir, 'single.test.ts');
      await fs.writeFile(
        filePath,
        `it('REQ-001: test1', () => {});
it('REQ-002: test2', () => {});
`
      );

      const scanner = new TestScanner(tempDir);
      const refs = await scanner.scanFile(filePath);

      expect(refs).toHaveLength(2);
    });
  });
});
