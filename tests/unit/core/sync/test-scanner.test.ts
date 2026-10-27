/**
 * 테스트 스캐너 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { TestScanner } from '../../../../src/core/sync/test-scanner.js';
import { SyncMatcher } from '../../../../src/core/sync/matcher.js';

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

  describe('한정된 @spec이 덮는 bare REQ 참조', () => {
    const scanTitles = async (source: string) => {
      const filePath = path.join(testsDir, 'covered.test.ts');
      await fs.writeFile(filePath, source);
      const refs = await new TestScanner(tempDir).scanFile(filePath);
      return refs.map((r) => `${r.line}:${r.specRef ?? ''}#${r.reqId}`);
    };

    it('바로 위 @spec 주석이 다음 describe 제목의 bare REQ를 덮는다', async () => {
      const refs = await scanTitles(`// @spec pricing/shipping#REQ-01
describe('REQ-01: 무료배송 기준', () => {
  it('정확히 50,000원', () => {});
});
`);
      expect(refs).toEqual(['1:pricing/shipping#REQ-01']);
    });

    it('주석/빈 줄이 사이에 있어도 덮고, 감싼 describe의 중첩 it도 덮는다', async () => {
      const refs = await scanTitles(`/**
 * @spec pricing/cart#REQ-02
 */

describe('cart', () => {
  it('REQ-02: 상품 추가', () => {});
  it('REQ-02 again', () => {});
});
`);
      expect(refs).toEqual(['2:pricing/cart#REQ-02']);
    });

    it('같은 줄의 한정 참조가 bare 참조를 덮는다', async () => {
      const refs = await scanTitles(`it('pricing/cart#REQ-03: REQ-03 검증', () => {});
`);
      expect(refs).toEqual(['1:pricing/cart#REQ-03']);
    });

    it('덮이는 범위 밖의 bare 참조는 유지한다', async () => {
      const refs = await scanTitles(`// @spec pricing/cart#REQ-01
describe('REQ-01: 카트', () => {
  it('내부', () => {});
});

describe('REQ-01: 다른 블록', () => {});
`);
      expect(refs).toEqual(['1:pricing/cart#REQ-01', '6:#REQ-01']);
    });

    it('다른 REQ 번호는 덮지 않는다', async () => {
      const refs = await scanTitles(`// @spec pricing/cart#REQ-01
describe('REQ-02: 다른 요구사항', () => {});
`);
      expect(refs).toEqual(['1:pricing/cart#REQ-01', '2:#REQ-02']);
    });

    it('덮이지 않은 bare 참조는 여전히 모호성 경고를 낸다', async () => {
      const filePath = path.join(testsDir, 'mixed.test.ts');
      await fs.writeFile(
        filePath,
        `// @spec a/one#REQ-01
describe('REQ-01: 덮임', () => {});

it('REQ-01: 덮이지 않음', () => {});
`
      );
      const testRefs = await new TestScanner(tempDir).scanFile(filePath);
      const result = new SyncMatcher().match(
        [
          { id: 'REQ-01', specId: 'a/one', line: 1 },
          { id: 'REQ-01', specId: 'a/two', line: 1 },
        ],
        [],
        testRefs
      );

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings?.[0]).toContain('mixed.test.ts:4');
      expect(result.implemented).toEqual(['REQ-01']);
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
