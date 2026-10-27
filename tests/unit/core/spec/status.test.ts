/**
 * 표준 스펙 상태 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  SPEC_STATUSES,
  SPEC_STATUS_INFO,
  LEGACY_STATUS_ALIASES,
  SpecStatusSchema,
  normalizeSpecStatus,
  getSpecStatusIcon,
  getSpecStatusLabel,
  isLegacySpecStatus,
} from '../../../../src/core/spec/status.js';
import { SpecMetadataSchema } from '../../../../src/core/spec/schemas.js';
import { FeatureStatusSchema } from '../../../../src/core/new/schemas.js';

describe('canonical spec status', () => {
  it('라이프사이클 순서대로 정의된다', () => {
    expect(SPEC_STATUSES).toEqual([
      'draft',
      'review',
      'approved',
      'planned',
      'tasked',
      'implementing',
      'implemented',
      'deprecated',
    ]);
  });

  it('모든 상태가 아이콘과 라벨을 가진다', () => {
    for (const status of SPEC_STATUSES) {
      expect(SPEC_STATUS_INFO[status].icon).not.toBe('❓');
      expect(SPEC_STATUS_INFO[status].label.length).toBeGreaterThan(0);
    }
  });

  it('레거시 별칭을 표준 상태로 정규화한다', () => {
    expect(LEGACY_STATUS_ALIASES).toEqual({ specified: 'review', completed: 'implemented' });
    expect(normalizeSpecStatus('specified')).toBe('review');
    expect(normalizeSpecStatus('completed')).toBe('implemented');
    expect(normalizeSpecStatus(' Implemented ')).toBe('implemented');
    expect(normalizeSpecStatus('bogus')).toBeUndefined();
    expect(normalizeSpecStatus(undefined)).toBeUndefined();
    expect(isLegacySpecStatus('completed')).toBe(true);
    expect(isLegacySpecStatus('toString')).toBe(false);
  });

  it('아이콘/라벨은 같은 테이블에서 파생된다', () => {
    expect(getSpecStatusIcon('implemented')).toBe(SPEC_STATUS_INFO.implemented.icon);
    expect(getSpecStatusIcon('completed')).toBe(SPEC_STATUS_INFO.implemented.icon);
    expect(getSpecStatusIcon('nope')).toBe('❓');
    expect(getSpecStatusLabel('implementing')).toBe('구현 중');
    expect(getSpecStatusLabel('nope')).toBe('nope');
  });

  it('SpecStatusSchema는 별칭을 받아 표준 값으로 변환한다', () => {
    expect(SpecStatusSchema.parse('completed')).toBe('implemented');
    expect(SpecStatusSchema.safeParse('bogus').success).toBe(false);
  });

  it('new 워크플로우 스키마도 같은 상태 집합을 사용한다', () => {
    for (const status of SPEC_STATUSES) {
      expect(FeatureStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it('메타데이터 스키마는 모든 표준 상태와 별칭을 허용한다', () => {
    for (const status of [...SPEC_STATUSES, 'specified', 'completed']) {
      const result = SpecMetadataSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
    const legacy = SpecMetadataSchema.parse({ status: 'specified' });
    expect(legacy.status).toBe('review');
  });
});
