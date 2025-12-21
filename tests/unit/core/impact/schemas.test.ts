/**
 * 영향도 스키마 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  DependencyTypeSchema,
  ImpactLevelSchema,
  RISK_WEIGHTS,
  getImpactLevel,
} from '../../../../src/core/impact/schemas.js';

describe('DependencyTypeSchema', () => {
  it('유효한 의존성 유형을 통과시킨다', () => {
    expect(DependencyTypeSchema.safeParse('explicit').success).toBe(true);
    expect(DependencyTypeSchema.safeParse('reference').success).toBe(true);
    expect(DependencyTypeSchema.safeParse('data').success).toBe(true);
    expect(DependencyTypeSchema.safeParse('api').success).toBe(true);
    expect(DependencyTypeSchema.safeParse('component').success).toBe(true);
  });

  it('잘못된 유형을 거부한다', () => {
    expect(DependencyTypeSchema.safeParse('invalid').success).toBe(false);
  });
});

describe('ImpactLevelSchema', () => {
  it('유효한 수준을 통과시킨다', () => {
    expect(ImpactLevelSchema.safeParse('low').success).toBe(true);
    expect(ImpactLevelSchema.safeParse('medium').success).toBe(true);
    expect(ImpactLevelSchema.safeParse('high').success).toBe(true);
  });
});

describe('RISK_WEIGHTS', () => {
  it('가중치가 정의되어 있다', () => {
    expect(RISK_WEIGHTS.directDependency).toBe(2);
    expect(RISK_WEIGHTS.indirectDependency).toBe(1);
    expect(RISK_WEIGHTS.apiChange).toBe(3);
    expect(RISK_WEIGHTS.dataModelChange).toBe(2);
    expect(RISK_WEIGHTS.corePrinciple).toBe(2);
  });
});

describe('getImpactLevel', () => {
  it('1-3은 low를 반환한다', () => {
    expect(getImpactLevel(1)).toBe('low');
    expect(getImpactLevel(2)).toBe('low');
    expect(getImpactLevel(3)).toBe('low');
  });

  it('4-6은 medium을 반환한다', () => {
    expect(getImpactLevel(4)).toBe('medium');
    expect(getImpactLevel(5)).toBe('medium');
    expect(getImpactLevel(6)).toBe('medium');
  });

  it('7-10은 high를 반환한다', () => {
    expect(getImpactLevel(7)).toBe('high');
    expect(getImpactLevel(8)).toBe('high');
    expect(getImpactLevel(9)).toBe('high');
    expect(getImpactLevel(10)).toBe('high');
  });
});
