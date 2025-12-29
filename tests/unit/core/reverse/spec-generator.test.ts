/**
 * spec-generator 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateSpecId,
  inferSpecName,
  inferDescription,
  inferScenarios,
  inferContracts,
  generateSpec,
  formatSpecAsMarkdown,
  formatSpecAsJson,
} from '../../../../src/core/reverse/spec-generator.js';
import { SymbolKind, type SymbolInfo } from '../../../../src/integrations/serena/types.js';
import type { ConfidenceResult } from '../../../../src/core/reverse/confidence.js';

describe('spec-generator', () => {
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

  const mockConfidence: ConfidenceResult = {
    score: 75,
    grade: 'C',
    factors: {
      documentation: 60,
      naming: 80,
      structure: 70,
      testCoverage: 50,
      typing: 90,
    },
    suggestions: ['문서화 개선 필요'],
  };

  describe('generateSpecId', () => {
    it('도메인과 이름으로 ID 생성', () => {
      const id = generateSpecId('auth', 'Login Service');
      expect(id).toBe('auth/login-service');
    });

    it('특수문자 제거', () => {
      const id = generateSpecId('User@Auth!', 'Get#User$Data');
      expect(id).toBe('user-auth-/get-user-data');
    });

    it('소문자 변환', () => {
      const id = generateSpecId('AUTH', 'LOGIN');
      expect(id).toBe('auth/login');
    });
  });

  describe('inferSpecName', () => {
    it('클래스가 있으면 클래스 이름 사용', () => {
      const symbols = [
        createMockSymbol({ name: 'method', kind: SymbolKind.Method }),
        createMockSymbol({ name: 'UserService', kind: SymbolKind.Class }),
      ];
      const name = inferSpecName(symbols);
      expect(name).toContain('User');
    });

    it('함수만 있으면 가장 긴 이름 사용', () => {
      const symbols = [
        createMockSymbol({ name: 'get', kind: SymbolKind.Function }),
        createMockSymbol({ name: 'getUserById', kind: SymbolKind.Function }),
      ];
      const name = inferSpecName(symbols);
      expect(name.toLowerCase()).toContain('user');
    });

    it('빈 배열은 unknown 반환', () => {
      const name = inferSpecName([]);
      expect(name).toBe('unknown');
    });

    it('camelCase를 공백으로 분리', () => {
      const symbols = [
        createMockSymbol({ name: 'getUserProfile', kind: SymbolKind.Function }),
      ];
      const name = inferSpecName(symbols);
      expect(name).toContain(' ');
    });
  });

  describe('inferDescription', () => {
    it('문서화가 있으면 첫 문장 추출', () => {
      const symbols = [
        createMockSymbol({
          documentation: 'Gets user data from database. This is additional info.',
        }),
      ];
      const desc = inferDescription(symbols);
      expect(desc).toContain('Gets user data');
      expect(desc).not.toContain('additional');
    });

    it('문서화가 없으면 심볼 정보 기반 설명 생성', () => {
      const symbols = [
        createMockSymbol({ kind: SymbolKind.Function }),
        createMockSymbol({ kind: SymbolKind.Function }),
      ];
      const desc = inferDescription(symbols);
      expect(desc).toContain('2개');
    });
  });

  describe('inferScenarios', () => {
    it('get으로 시작하는 함수에서 조회 시나리오 생성', () => {
      const symbols = [
        createMockSymbol({ name: 'getUser', kind: SymbolKind.Function }),
      ];
      const scenarios = inferScenarios(symbols);
      expect(scenarios.length).toBeGreaterThan(0);
      expect(scenarios[0].name).toContain('조회');
    });

    it('create로 시작하는 함수에서 생성 시나리오 생성', () => {
      const symbols = [
        createMockSymbol({ name: 'createUser', kind: SymbolKind.Function }),
      ];
      const scenarios = inferScenarios(symbols);
      expect(scenarios[0].name).toContain('생성');
    });

    it('update로 시작하는 함수에서 수정 시나리오 생성', () => {
      const symbols = [
        createMockSymbol({ name: 'updateProfile', kind: SymbolKind.Function }),
      ];
      const scenarios = inferScenarios(symbols);
      expect(scenarios[0].name).toContain('수정');
    });

    it('delete로 시작하는 함수에서 삭제 시나리오 생성', () => {
      const symbols = [
        createMockSymbol({ name: 'deleteAccount', kind: SymbolKind.Function }),
      ];
      const scenarios = inferScenarios(symbols);
      expect(scenarios[0].name).toContain('삭제');
    });

    it('is/has/can으로 시작하는 함수에서 확인 시나리오 생성', () => {
      const symbols = [
        createMockSymbol({ name: 'isAdmin', kind: SymbolKind.Function }),
      ];
      const scenarios = inferScenarios(symbols);
      expect(scenarios[0].name).toContain('확인');
    });

    it('심볼이 없으면 기본 시나리오 생성', () => {
      const scenarios = inferScenarios([]);
      expect(scenarios.length).toBe(1);
      expect(scenarios[0].inferred).toBe(true);
    });

    it('모든 시나리오는 Given-When-Then 형식', () => {
      const symbols = [
        createMockSymbol({ name: 'processData', kind: SymbolKind.Function }),
      ];
      const scenarios = inferScenarios(symbols);
      for (const s of scenarios) {
        expect(s.given).toBeDefined();
        expect(s.when).toBeDefined();
        expect(s.then).toBeDefined();
      }
    });
  });

  describe('inferContracts', () => {
    it('시그니처에서 입력 계약 추출', () => {
      const symbols = [
        createMockSymbol({
          signature: 'function getData(id: string, options: Options): Result',
        }),
      ];
      const contracts = inferContracts(symbols);
      const inputContract = contracts.find(c => c.type === 'input');
      expect(inputContract).toBeDefined();
      expect(inputContract?.signature).toContain('id: string');
    });

    it('시그니처에서 출력 계약 추출', () => {
      const symbols = [
        createMockSymbol({
          signature: 'function getData(id: string): Promise<User>',
        }),
      ];
      const contracts = inferContracts(symbols);
      const outputContract = contracts.find(c => c.type === 'output');
      expect(outputContract).toBeDefined();
      expect(outputContract?.signature).toContain('Promise');
    });

    it('시그니처가 없으면 계약 없음', () => {
      const symbols = [createMockSymbol({ signature: undefined })];
      const contracts = inferContracts(symbols);
      expect(contracts.length).toBe(0);
    });
  });

  describe('generateSpec', () => {
    it('완전한 스펙 객체 생성', () => {
      const symbols = [
        createMockSymbol({ name: 'login', kind: SymbolKind.Function }),
      ];
      const spec = generateSpec('auth', symbols, mockConfidence);

      expect(spec.id).toBeDefined();
      expect(spec.name).toBeDefined();
      expect(spec.domain).toBe('auth');
      expect(spec.description).toBeDefined();
      expect(spec.sourceSymbols).toEqual(symbols);
      expect(spec.confidence).toEqual(mockConfidence);
      expect(spec.scenarios.length).toBeGreaterThan(0);
      expect(spec.metadata.status).toBe('draft');
    });

    it('메타데이터 포함', () => {
      const symbols = [createMockSymbol()];
      const spec = generateSpec('test', symbols, mockConfidence);

      expect(spec.metadata.extractedAt).toBeInstanceOf(Date);
      expect(spec.metadata.sourceFiles.length).toBeGreaterThan(0);
      expect(spec.metadata.symbolCount).toBe(1);
    });
  });

  describe('formatSpecAsMarkdown', () => {
    it('마크다운 형식으로 포맷팅', () => {
      const symbols = [createMockSymbol({ name: 'testFunc', kind: SymbolKind.Function })];
      const spec = generateSpec('test', symbols, mockConfidence);
      const md = formatSpecAsMarkdown(spec);

      expect(md).toContain('# ');
      expect(md).toContain('## 설명');
      expect(md).toContain('## 시나리오');
      expect(md).toContain('**Given**');
      expect(md).toContain('**When**');
      expect(md).toContain('**Then**');
    });

    it('신뢰도 정보 포함', () => {
      const symbols = [createMockSymbol()];
      const spec = generateSpec('test', symbols, mockConfidence);
      const md = formatSpecAsMarkdown(spec);

      expect(md).toContain('신뢰도');
      expect(md).toContain('75%');
    });

    it('개선 제안 포함', () => {
      const symbols = [createMockSymbol()];
      const spec = generateSpec('test', symbols, mockConfidence);
      const md = formatSpecAsMarkdown(spec);

      expect(md).toContain('개선 제안');
    });
  });

  describe('formatSpecAsJson', () => {
    it('유효한 JSON 반환', () => {
      const symbols = [createMockSymbol()];
      const spec = generateSpec('test', symbols, mockConfidence);
      const json = formatSpecAsJson(spec);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('모든 필드 포함', () => {
      const symbols = [createMockSymbol()];
      const spec = generateSpec('test', symbols, mockConfidence);
      const json = formatSpecAsJson(spec);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBeDefined();
      expect(parsed.name).toBeDefined();
      expect(parsed.domain).toBe('test');
      expect(parsed.confidence).toBeDefined();
      expect(parsed.scenarios).toBeDefined();
    });

    it('날짜는 ISO 문자열로 변환', () => {
      const symbols = [createMockSymbol()];
      const spec = generateSpec('test', symbols, mockConfidence);
      const json = formatSpecAsJson(spec);
      const parsed = JSON.parse(json);

      expect(typeof parsed.metadata.extractedAt).toBe('string');
      expect(() => new Date(parsed.metadata.extractedAt)).not.toThrow();
    });
  });
});
