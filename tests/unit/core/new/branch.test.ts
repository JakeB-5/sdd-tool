/**
 * 브랜치 관리 테스트
 *
 * 참고: Git 명령어를 사용하는 함수들은 실제 Git 저장소가 필요하므로
 * 순수 함수만 테스트합니다.
 */
import { describe, it, expect } from 'vitest';
import { extractFeatureId, BranchError } from '../../../../src/core/new/branch.js';

describe('extractFeatureId', () => {
  it('feature/name 형식에서 기능 ID를 추출한다', () => {
    expect(extractFeatureId('feature/auth')).toBe('auth');
    expect(extractFeatureId('feature/user-management')).toBe('user-management');
    expect(extractFeatureId('feature/001-oauth')).toBe('001-oauth');
  });

  it('feature/ prefix가 없으면 null을 반환한다', () => {
    expect(extractFeatureId('main')).toBeNull();
    expect(extractFeatureId('develop')).toBeNull();
    expect(extractFeatureId('auth')).toBeNull();
  });

  it('빈 기능 ID는 null을 반환한다', () => {
    // 정규식 ^feature\/(.+)$는 최소 한 글자 이상 필요
    expect(extractFeatureId('feature/')).toBeNull();
  });
});

describe('BranchError', () => {
  it('올바른 에러 타입을 생성한다', () => {
    const error = new BranchError('테스트 에러');

    expect(error.name).toBe('BranchError');
    expect(error.message).toBe('테스트 에러');
    expect(error instanceof Error).toBe(true);
  });
});
