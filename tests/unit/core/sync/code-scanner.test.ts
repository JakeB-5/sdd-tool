/**
 * 코드 스캐너 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { CodeScanner, extractSpecRefs } from '../../../../src/core/sync/code-scanner.js';

describe('CodeScanner', () => {
  let tempDir: string;
  let srcDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sdd-code-scanner-'));
    srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('스펙 한정 참조', () => {
    it('@spec <spec>#REQ-xxx에서 스펙 한정자를 추출한다', async () => {
      await fs.writeFile(
        path.join(srcDir, 'mixed.ts'),
        '// @spec auth/login#REQ-01, REQ-02, pay#REQ-3\n'
      );

      const refs = await new CodeScanner(tempDir, { srcDir }).scan();

      expect(refs.map(r => ({ reqId: r.reqId, specRef: r.specRef }))).toEqual([
        { reqId: 'REQ-01', specRef: 'auth/login' },
        { reqId: 'REQ-02', specRef: undefined },
        { reqId: 'REQ-3', specRef: 'pay' },
      ]);
    });

    it('extractSpecRefs는 bare/한정 참조를 모두 처리한다', () => {
      expect(extractSpecRefs("auth/login#REQ-01: 로그인 (REQ-02)")).toEqual([
        { reqId: 'REQ-01', specRef: 'auth/login' },
        { reqId: 'REQ-02' },
      ]);
    });

    it('괄호류로 감싼 참조에서 괄호를 스펙 한정자에 포함하지 않는다', () => {
      expect(extractSpecRefs('[user/signup#REQ-01] {a#REQ-2} <b#REQ-3>')).toEqual([
        { reqId: 'REQ-01', specRef: 'user/signup' },
        { reqId: 'REQ-2', specRef: 'a' },
        { reqId: 'REQ-3', specRef: 'b' },
      ]);
    });
  });

  describe('scan', () => {
    it('@spec 주석에서 REQ-xxx를 추출한다', async () => {
      await fs.writeFile(
        path.join(srcDir, 'auth.ts'),
        `/**
 * 사용자 로그인
 * @spec REQ-001
 */
export async function login() {
  // 구현
}

/**
 * 토큰 검증
 * @spec REQ-002
 */
export function verifyToken() {
  // 구현
}
`
      );

      const scanner = new CodeScanner(tempDir, { srcDir });
      const refs = await scanner.scan();

      expect(refs).toHaveLength(2);
      expect(refs[0].reqId).toBe('REQ-001');
      expect(refs[0].type).toBe('code');
      expect(refs[1].reqId).toBe('REQ-002');
    });

    it('여러 REQ를 한 줄에서 추출한다', async () => {
      await fs.writeFile(
        path.join(srcDir, 'service.ts'),
        `/**
 * @spec REQ-001, REQ-002, REQ-003
 */
export class Service {}
`
      );

      const scanner = new CodeScanner(tempDir, { srcDir });
      const refs = await scanner.scan();

      expect(refs).toHaveLength(3);
      expect(refs.map(r => r.reqId)).toContain('REQ-001');
      expect(refs.map(r => r.reqId)).toContain('REQ-002');
      expect(refs.map(r => r.reqId)).toContain('REQ-003');
    });

    it('@spec: 형식도 인식한다', async () => {
      await fs.writeFile(
        path.join(srcDir, 'handler.ts'),
        `// @spec: REQ-010
export function handler() {}
`
      );

      const scanner = new CodeScanner(tempDir, { srcDir });
      const refs = await scanner.scan();

      expect(refs).toHaveLength(1);
      expect(refs[0].reqId).toBe('REQ-010');
    });

    it('소스 디렉토리가 없으면 빈 배열을 반환한다', async () => {
      const scanner = new CodeScanner(tempDir, { srcDir: path.join(tempDir, 'nonexistent') });
      const refs = await scanner.scan();

      expect(refs).toEqual([]);
    });

    it('하위 디렉토리도 스캔한다', async () => {
      const subDir = path.join(srcDir, 'sub', 'deep');
      await fs.mkdir(subDir, { recursive: true });
      await fs.writeFile(
        path.join(subDir, 'module.ts'),
        `// @spec REQ-100
export const x = 1;
`
      );

      const scanner = new CodeScanner(tempDir, { srcDir });
      const refs = await scanner.scan();

      expect(refs).toHaveLength(1);
      expect(refs[0].reqId).toBe('REQ-100');
    });
  });

  describe('scanFile', () => {
    it('단일 파일에서 REQ-xxx를 추출한다', async () => {
      const filePath = path.join(srcDir, 'single.ts');
      await fs.writeFile(
        filePath,
        `// @spec REQ-001
// @spec REQ-002
export const x = 1;
`
      );

      const scanner = new CodeScanner(tempDir, { srcDir });
      const refs = await scanner.scanFile(filePath);

      expect(refs).toHaveLength(2);
    });

    it('같은 @spec 줄의 한정 참조가 같은 번호의 bare 참조를 덮는다', async () => {
      const filePath = path.join(srcDir, 'covered.ts');
      await fs.writeFile(
        filePath,
        `// @spec REQ-01, auth/login#REQ-01, REQ-02
export const x = 1;
`
      );

      const refs = await new CodeScanner(tempDir, { srcDir }).scanFile(filePath);

      expect(refs.map((r) => `${r.specRef ?? ''}#${r.reqId}`)).toEqual([
        'auth/login#REQ-01',
        '#REQ-02',
      ]);
    });

    it('한정된 @spec이 감싸는 함수 본문의 bare @spec을 덮고 밖은 유지한다', async () => {
      const filePath = path.join(srcDir, 'scope.ts');
      await fs.writeFile(
        filePath,
        `/**
 * @spec auth/login#REQ-01
 */
export function login() {
  // @spec REQ-01
  return 1;
}

// @spec REQ-01
export const other = 2;
`
      );

      const refs = await new CodeScanner(tempDir, { srcDir }).scanFile(filePath);

      expect(refs.map((r) => `${r.line}:${r.specRef ?? ''}#${r.reqId}`)).toEqual([
        '2:auth/login#REQ-01',
        '9:#REQ-01',
      ]);
    });

    it('존재하지 않는 파일은 빈 배열을 반환한다', async () => {
      const scanner = new CodeScanner(tempDir, { srcDir });
      const refs = await scanner.scanFile('/nonexistent/file.ts');

      expect(refs).toEqual([]);
    });
  });
});
