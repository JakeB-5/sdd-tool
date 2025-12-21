/**
 * Constitution 스키마 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  SemanticVersionSchema,
  parseVersion,
  bumpVersion,
  compareVersions,
} from '../../../../src/core/constitution/schemas.js';

describe('SemanticVersionSchema', () => {
  it('유효한 버전을 파싱한다', () => {
    expect(SemanticVersionSchema.safeParse('1.0.0').success).toBe(true);
    expect(SemanticVersionSchema.safeParse('10.20.30').success).toBe(true);
  });

  it('잘못된 버전을 거부한다', () => {
    expect(SemanticVersionSchema.safeParse('1.0').success).toBe(false);
    expect(SemanticVersionSchema.safeParse('v1.0.0').success).toBe(false);
    expect(SemanticVersionSchema.safeParse('1.0.0-beta').success).toBe(false);
  });
});

describe('parseVersion', () => {
  it('버전을 파싱한다', () => {
    const result = parseVersion('1.2.3');
    expect(result).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('잘못된 형식에 null을 반환한다', () => {
    expect(parseVersion('invalid')).toBeNull();
    expect(parseVersion('1.0')).toBeNull();
  });
});

describe('bumpVersion', () => {
  it('MAJOR 버전을 증가시킨다', () => {
    expect(bumpVersion('1.2.3', 'major')).toBe('2.0.0');
  });

  it('MINOR 버전을 증가시킨다', () => {
    expect(bumpVersion('1.2.3', 'minor')).toBe('1.3.0');
  });

  it('PATCH 버전을 증가시킨다', () => {
    expect(bumpVersion('1.2.3', 'patch')).toBe('1.2.4');
  });

  it('잘못된 버전에 기본값을 반환한다', () => {
    expect(bumpVersion('invalid', 'major')).toBe('1.0.0');
  });
});

describe('compareVersions', () => {
  it('같은 버전에 0을 반환한다', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
  });

  it('첫 번째가 크면 1을 반환한다', () => {
    expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
  });

  it('첫 번째가 작으면 -1을 반환한다', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
    expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
  });
});
