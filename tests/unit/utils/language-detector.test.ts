/**
 * 언어 감지 유틸리티 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  detectLanguage,
  resolveLanguage,
  analyzeLanguageDistribution,
} from '../../../src/utils/language-detector.js';

describe('detectLanguage', () => {
  it('detects languages by extension (case-insensitive)', () => {
    expect(detectLanguage('src/index.ts')).toBe('typescript');
    expect(detectLanguage('src/App.TSX')).toBe('typescript');
    expect(detectLanguage('main.py')).toBe('python');
    expect(detectLanguage('lib/x.cpp')).toBe('cpp');
    expect(detectLanguage('analysis.R')).toBe('r');
  });

  it('returns null for unknown or missing extensions', () => {
    expect(detectLanguage('README.md')).toBeNull();
    expect(detectLanguage('Makefile')).toBeNull();
  });
});

describe('resolveLanguage', () => {
  it('accepts language ids', () => {
    expect(resolveLanguage('typescript')).toBe('typescript');
    expect(resolveLanguage('Python')).toBe('python');
  });

  it('accepts extensions with or without a dot', () => {
    expect(resolveLanguage('ts')).toBe('typescript');
    expect(resolveLanguage('.js')).toBe('javascript');
  });

  it('returns null for unknown input', () => {
    expect(resolveLanguage('klingon')).toBeNull();
    expect(resolveLanguage('')).toBeNull();
  });
});

describe('analyzeLanguageDistribution', () => {
  it('counts files per language and ignores unknown files', () => {
    expect(analyzeLanguageDistribution(['a.ts', 'b.tsx', 'c.py', 'README.md'])).toEqual({
      typescript: 2,
      python: 1,
    });
  });
});
