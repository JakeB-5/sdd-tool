/**
 * 타입 유틸리티 테스트
 */
import { describe, it, expect } from 'vitest';
import { success, failure } from '../../../src/types/index.js';

describe('Result 유틸리티', () => {
  describe('success', () => {
    it('성공 결과를 생성한다', () => {
      const result = success(42);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it('객체 데이터를 포함할 수 있다', () => {
      const data = { name: 'test', value: 123 };
      const result = success(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });
  });

  describe('failure', () => {
    it('실패 결과를 생성한다', () => {
      const error = new Error('테스트 에러');
      const result = failure(error);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });

    it('커스텀 에러 타입을 포함할 수 있다', () => {
      const customError = { code: 'E001', message: '커스텀 에러' };
      const result = failure(customError);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toEqual(customError);
      }
    });
  });
});
