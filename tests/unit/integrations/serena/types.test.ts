/**
 * Serena MCP 타입 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  SymbolKind,
  SymbolKindNames,
  SERENA_SUPPORTED_LANGUAGES,
  FILE_EXTENSION_TO_LANGUAGE,
} from '../../../../src/integrations/serena/types.js';

describe('SymbolKind', () => {
  it('LSP 심볼 종류를 정의한다', () => {
    expect(SymbolKind.Class).toBe(5);
    expect(SymbolKind.Method).toBe(6);
    expect(SymbolKind.Function).toBe(12);
    expect(SymbolKind.Interface).toBe(11);
  });

  it('모든 심볼 종류에 이름이 있다', () => {
    const kinds = Object.values(SymbolKind).filter(
      (v): v is SymbolKind => typeof v === 'number'
    );

    for (const kind of kinds) {
      expect(SymbolKindNames[kind]).toBeDefined();
      expect(typeof SymbolKindNames[kind]).toBe('string');
    }
  });
});

describe('SERENA_SUPPORTED_LANGUAGES', () => {
  it('30개 이상의 언어를 지원한다', () => {
    expect(SERENA_SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(30);
  });

  it('주요 언어를 포함한다', () => {
    expect(SERENA_SUPPORTED_LANGUAGES).toContain('typescript');
    expect(SERENA_SUPPORTED_LANGUAGES).toContain('javascript');
    expect(SERENA_SUPPORTED_LANGUAGES).toContain('python');
    expect(SERENA_SUPPORTED_LANGUAGES).toContain('java');
    expect(SERENA_SUPPORTED_LANGUAGES).toContain('go');
    expect(SERENA_SUPPORTED_LANGUAGES).toContain('rust');
  });
});

describe('FILE_EXTENSION_TO_LANGUAGE', () => {
  it('TypeScript 확장자를 매핑한다', () => {
    expect(FILE_EXTENSION_TO_LANGUAGE['.ts']).toBe('typescript');
    expect(FILE_EXTENSION_TO_LANGUAGE['.tsx']).toBe('typescript');
  });

  it('JavaScript 확장자를 매핑한다', () => {
    expect(FILE_EXTENSION_TO_LANGUAGE['.js']).toBe('javascript');
    expect(FILE_EXTENSION_TO_LANGUAGE['.jsx']).toBe('javascript');
    expect(FILE_EXTENSION_TO_LANGUAGE['.mjs']).toBe('javascript');
  });

  it('Python 확장자를 매핑한다', () => {
    expect(FILE_EXTENSION_TO_LANGUAGE['.py']).toBe('python');
    expect(FILE_EXTENSION_TO_LANGUAGE['.pyi']).toBe('python');
  });

  it('C/C++ 확장자를 매핑한다', () => {
    expect(FILE_EXTENSION_TO_LANGUAGE['.c']).toBe('c');
    expect(FILE_EXTENSION_TO_LANGUAGE['.h']).toBe('c');
    expect(FILE_EXTENSION_TO_LANGUAGE['.cpp']).toBe('cpp');
    expect(FILE_EXTENSION_TO_LANGUAGE['.hpp']).toBe('cpp');
  });

  it('함수형 언어 확장자를 매핑한다', () => {
    expect(FILE_EXTENSION_TO_LANGUAGE['.hs']).toBe('haskell');
    expect(FILE_EXTENSION_TO_LANGUAGE['.ml']).toBe('ocaml');
    expect(FILE_EXTENSION_TO_LANGUAGE['.fs']).toBe('fsharp');
    expect(FILE_EXTENSION_TO_LANGUAGE['.clj']).toBe('clojure');
  });
});
