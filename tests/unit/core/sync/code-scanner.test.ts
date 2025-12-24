/**
 * 코드 스캐너 테스트
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { CodeScanner } from '../../../../src/core/sync/code-scanner.js';

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

    it('존재하지 않는 파일은 빈 배열을 반환한다', async () => {
      const scanner = new CodeScanner(tempDir, { srcDir });
      const refs = await scanner.scanFile('/nonexistent/file.ts');

      expect(refs).toEqual([]);
    });
  });
});
