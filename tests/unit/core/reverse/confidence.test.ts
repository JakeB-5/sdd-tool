/**
 * confidence 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateDocumentation,
  evaluateNaming,
  evaluateStructure,
  evaluateTyping,
  calculateGrade,
  generateSuggestions,
  calculateConfidence,
  calculateAverageConfidence,
} from '../../../../src/core/reverse/confidence.js';
import { SymbolKind, type SymbolInfo } from '../../../../src/integrations/serena/types.js';

describe('confidence', () => {
  const createMockSymbol = (overrides: Partial<SymbolInfo> = {}): SymbolInfo => ({
    name: 'testFunction',
    namePath: 'TestClass/testFunction',
    kind: SymbolKind.Method,
    location: {
      relativePath: 'src/test.ts',
      startLine: 1,
      endLine: 10,
    },
    ...overrides,
  });

  describe('evaluateDocumentation', () => {
    it('문서화가 없으면 0 반환', () => {
      const symbol = createMockSymbol({ documentation: undefined });
      expect(evaluateDocumentation(symbol)).toBe(0);
    });

    it('짧은 문서화는 낮은 점수', () => {
      const symbol = createMockSymbol({ documentation: 'Short doc' });
      const score = evaluateDocumentation(symbol);
      expect(score).toBeLessThan(50);
    });

    it('긴 문서화는 높은 점수', () => {
      const symbol = createMockSymbol({
        documentation: 'This is a comprehensive documentation that explains the function in detail and provides useful information about its behavior.',
      });
      const score = evaluateDocumentation(symbol);
      expect(score).toBeGreaterThan(50);
    });

    it('@param 태그가 있으면 추가 점수', () => {
      const withParam = createMockSymbol({
        documentation: 'Description. @param name The name parameter',
      });
      const withoutParam = createMockSymbol({
        documentation: 'Description only.',
      });
      expect(evaluateDocumentation(withParam)).toBeGreaterThan(evaluateDocumentation(withoutParam));
    });

    it('@returns 태그가 있으면 추가 점수', () => {
      const withReturns = createMockSymbol({
        documentation: 'Description. @returns The result',
      });
      const withoutReturns = createMockSymbol({
        documentation: 'Description only.',
      });
      expect(evaluateDocumentation(withReturns)).toBeGreaterThan(evaluateDocumentation(withoutReturns));
    });

    it('@example 태그가 있으면 추가 점수', () => {
      const withExample = createMockSymbol({
        documentation: 'Description. @example const x = fn()',
      });
      const withoutExample = createMockSymbol({
        documentation: 'Description only.',
      });
      expect(evaluateDocumentation(withExample)).toBeGreaterThan(evaluateDocumentation(withoutExample));
    });
  });

  describe('evaluateNaming', () => {
    it('적절한 길이의 camelCase 이름은 높은 점수', () => {
      const symbol = createMockSymbol({ name: 'getUserById' });
      const score = evaluateNaming(symbol);
      expect(score).toBeGreaterThan(70);
    });

    it('PascalCase 클래스 이름은 높은 점수', () => {
      const symbol = createMockSymbol({ name: 'UserService', kind: SymbolKind.Class });
      const score = evaluateNaming(symbol);
      expect(score).toBeGreaterThan(60);
    });

    it('단일 문자 이름은 낮은 점수', () => {
      const symbol = createMockSymbol({ name: 'x' });
      const score = evaluateNaming(symbol);
      expect(score).toBeLessThan(30);
    });

    it('동사로 시작하는 함수명은 추가 점수', () => {
      const withVerb = createMockSymbol({ name: 'getData' });
      const withoutVerb = createMockSymbol({ name: 'dataProcess' });
      expect(evaluateNaming(withVerb)).toBeGreaterThan(evaluateNaming(withoutVerb));
    });

    it('너무 긴 이름은 점수 감소', () => {
      const shortName = createMockSymbol({ name: 'getData' });
      const longName = createMockSymbol({
        name: 'getDataFromDatabaseWithComplexQueryAndMultipleFiltersAndSortingOptions',
      });
      expect(evaluateNaming(shortName)).toBeGreaterThan(evaluateNaming(longName));
    });
  });

  describe('evaluateStructure', () => {
    it('일관된 네이밍 패턴은 높은 점수', () => {
      const symbol = createMockSymbol({ name: 'getData' });
      const siblings = [
        createMockSymbol({ name: 'setData' }),
        createMockSymbol({ name: 'updateData' }),
        createMockSymbol({ name: 'deleteData' }),
      ];
      const score = evaluateStructure(symbol, siblings);
      expect(score).toBeGreaterThanOrEqual(50);
    });

    it('심볼이 없으면 기본 점수', () => {
      const symbol = createMockSymbol();
      const score = evaluateStructure(symbol, []);
      expect(score).toBe(50);
    });
  });

  describe('evaluateTyping', () => {
    it('시그니처가 없으면 기본 점수', () => {
      const symbol = createMockSymbol({ signature: undefined });
      expect(evaluateTyping(symbol)).toBe(40);
    });

    it('타입이 명시된 시그니처는 높은 점수', () => {
      const symbol = createMockSymbol({
        signature: 'function getData(id: string): Promise<User>',
      });
      const score = evaluateTyping(symbol);
      expect(score).toBeGreaterThan(60);
    });

    it('any 타입 사용은 점수 감소', () => {
      const withAny = createMockSymbol({
        signature: 'function getData(data: any): any',
      });
      const withoutAny = createMockSymbol({
        signature: 'function getData(data: User): User',
      });
      expect(evaluateTyping(withAny)).toBeLessThan(evaluateTyping(withoutAny));
    });

    it('제네릭 사용은 추가 점수', () => {
      const withGeneric = createMockSymbol({
        signature: 'function getData<T>(id: string): Promise<T>',
      });
      const withoutGeneric = createMockSymbol({
        signature: 'function getData(id: string): User',
      });
      expect(evaluateTyping(withGeneric)).toBeGreaterThanOrEqual(evaluateTyping(withoutGeneric));
    });
  });

  describe('calculateGrade', () => {
    it('90+ 점은 A 등급', () => {
      expect(calculateGrade(95)).toBe('A');
      expect(calculateGrade(90)).toBe('A');
    });

    it('80-89 점은 B 등급', () => {
      expect(calculateGrade(85)).toBe('B');
      expect(calculateGrade(80)).toBe('B');
    });

    it('70-79 점은 C 등급', () => {
      expect(calculateGrade(75)).toBe('C');
      expect(calculateGrade(70)).toBe('C');
    });

    it('60-69 점은 D 등급', () => {
      expect(calculateGrade(65)).toBe('D');
      expect(calculateGrade(60)).toBe('D');
    });

    it('60 미만은 F 등급', () => {
      expect(calculateGrade(50)).toBe('F');
      expect(calculateGrade(0)).toBe('F');
    });
  });

  describe('generateSuggestions', () => {
    it('낮은 문서화 점수에 제안 생성', () => {
      const suggestions = generateSuggestions({
        documentation: 30,
        naming: 70,
        structure: 70,
        testCoverage: 70,
        typing: 70,
      });
      expect(suggestions.some(s => s.includes('문서화'))).toBe(true);
    });

    it('낮은 테스트 커버리지에 제안 생성', () => {
      const suggestions = generateSuggestions({
        documentation: 70,
        naming: 70,
        structure: 70,
        testCoverage: 20,
        typing: 70,
      });
      expect(suggestions.some(s => s.includes('테스트'))).toBe(true);
    });

    it('모든 점수가 높으면 제안 없음', () => {
      const suggestions = generateSuggestions({
        documentation: 80,
        naming: 80,
        structure: 80,
        testCoverage: 80,
        typing: 80,
      });
      expect(suggestions.length).toBe(0);
    });
  });

  describe('calculateConfidence', () => {
    it('종합 신뢰도 계산', () => {
      const symbol = createMockSymbol({
        documentation: 'A comprehensive function',
        signature: 'function getData(): User',
      });
      const result = calculateConfidence(symbol, [symbol]);

      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
      expect(result.factors).toBeDefined();
    });

    it('모든 요인 점수가 0-100 범위', () => {
      const symbol = createMockSymbol();
      const result = calculateConfidence(symbol, []);

      expect(result.factors.documentation).toBeGreaterThanOrEqual(0);
      expect(result.factors.documentation).toBeLessThanOrEqual(100);
      expect(result.factors.naming).toBeGreaterThanOrEqual(0);
      expect(result.factors.naming).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateAverageConfidence', () => {
    it('여러 심볼의 평균 계산', () => {
      const symbols = [
        createMockSymbol({ name: 'functionA' }),
        createMockSymbol({ name: 'functionB' }),
        createMockSymbol({ name: 'functionC' }),
      ];
      const result = calculateAverageConfidence(symbols, symbols);

      expect(result.score).toBeGreaterThan(0);
      expect(result.grade).toBeDefined();
    });

    it('빈 배열은 F 등급', () => {
      const result = calculateAverageConfidence([], []);
      expect(result.grade).toBe('F');
      expect(result.score).toBe(0);
    });
  });
});
