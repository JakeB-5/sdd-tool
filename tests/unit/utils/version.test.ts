/**
 * 도구 버전 조회 테스트
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { getToolPackage, getToolVersion } from '../../../src/utils/version.js';

describe('getToolVersion', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8')) as { version: string; description: string };

  it('실행 중인 sdd-tool의 package.json 버전을 반환한다', () => {
    expect(getToolVersion()).toBe(pkg.version);
  });

  it('description도 함께 제공한다', () => {
    expect(getToolPackage()).toEqual({ version: pkg.version, description: pkg.description });
  });
});
