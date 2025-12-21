/**
 * 변경 스키마 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  ChangeStatusSchema,
  DeltaTypeSchema,
  ImpactLevelSchema,
  ProposalMetadataSchema,
  generateChangeId,
} from '../../../../src/core/change/schemas.js';

describe('ChangeStatusSchema', () => {
  it('유효한 상태를 통과시킨다', () => {
    expect(ChangeStatusSchema.safeParse('draft').success).toBe(true);
    expect(ChangeStatusSchema.safeParse('proposed').success).toBe(true);
    expect(ChangeStatusSchema.safeParse('approved').success).toBe(true);
    expect(ChangeStatusSchema.safeParse('applied').success).toBe(true);
    expect(ChangeStatusSchema.safeParse('archived').success).toBe(true);
    expect(ChangeStatusSchema.safeParse('rejected').success).toBe(true);
  });

  it('잘못된 상태를 거부한다', () => {
    expect(ChangeStatusSchema.safeParse('invalid').success).toBe(false);
  });
});

describe('DeltaTypeSchema', () => {
  it('유효한 타입을 통과시킨다', () => {
    expect(DeltaTypeSchema.safeParse('ADDED').success).toBe(true);
    expect(DeltaTypeSchema.safeParse('MODIFIED').success).toBe(true);
    expect(DeltaTypeSchema.safeParse('REMOVED').success).toBe(true);
  });

  it('잘못된 타입을 거부한다', () => {
    expect(DeltaTypeSchema.safeParse('UPDATED').success).toBe(false);
  });
});

describe('ImpactLevelSchema', () => {
  it('유효한 수준을 통과시킨다', () => {
    expect(ImpactLevelSchema.safeParse('low').success).toBe(true);
    expect(ImpactLevelSchema.safeParse('medium').success).toBe(true);
    expect(ImpactLevelSchema.safeParse('high').success).toBe(true);
  });

  it('잘못된 수준을 거부한다', () => {
    expect(ImpactLevelSchema.safeParse('very-high').success).toBe(false);
  });
});

describe('ProposalMetadataSchema', () => {
  it('유효한 메타데이터를 통과시킨다', () => {
    const result = ProposalMetadataSchema.safeParse({
      id: 'CHG-001',
      status: 'draft',
      created: '2025-12-21',
    });

    expect(result.success).toBe(true);
  });

  it('잘못된 ID 형식을 거부한다', () => {
    const result = ProposalMetadataSchema.safeParse({
      id: 'INVALID',
      status: 'draft',
      created: '2025-12-21',
    });

    expect(result.success).toBe(false);
  });

  it('잘못된 날짜 형식을 거부한다', () => {
    const result = ProposalMetadataSchema.safeParse({
      id: 'CHG-001',
      status: 'draft',
      created: '12/21/2025',
    });

    expect(result.success).toBe(false);
  });
});

describe('generateChangeId', () => {
  it('첫 번째 ID를 생성한다', () => {
    const result = generateChangeId([]);

    expect(result).toBe('CHG-001');
  });

  it('다음 순번 ID를 생성한다', () => {
    const result = generateChangeId(['CHG-001', 'CHG-002']);

    expect(result).toBe('CHG-003');
  });

  it('빈틈이 있어도 최대값 다음을 생성한다', () => {
    const result = generateChangeId(['CHG-001', 'CHG-005']);

    expect(result).toBe('CHG-006');
  });

  it('잘못된 ID는 무시한다', () => {
    const result = generateChangeId(['CHG-001', 'invalid', 'CHG-003']);

    expect(result).toBe('CHG-004');
  });
});
