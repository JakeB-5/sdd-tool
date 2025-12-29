/**
 * 언어 감지 유틸리티 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  detectLanguage,
  isSerenaSupported,
  analyzeLanguageDistribution,
  findUnsupportedFiles,
  detectPrimaryLanguage,
  getLanguageDisplayName,
  formatLanguageDistribution,
  createUnsupportedWarning,
} from '../../../src/utils/language-detector.js';

describe('detectLanguage', () => {
  it('TypeScript 파일을 감지한다', () => {
    const result = detectLanguage('src/index.ts');
    expect(result.language).toBe('typescript');
    expect(result.isSupported).toBe(true);
    expect(result.extension).toBe('.ts');
  });

  it('Python 파일을 감지한다', () => {
    const result = detectLanguage('app/main.py');
    expect(result.language).toBe('python');
    expect(result.isSupported).toBe(true);
  });

  it('지원하지 않는 확장자', () => {
    const result = detectLanguage('readme.txt');
    expect(result.language).toBeNull();
    expect(result.isSupported).toBe(false);
  });

  it('확장자 없는 파일', () => {
    const result = detectLanguage('Dockerfile');
    expect(result.language).toBeNull();
    expect(result.extension).toBe('');
  });
});

describe('isSerenaSupported', () => {
  it('지원 언어는 true를 반환한다', () => {
    expect(isSerenaSupported('typescript')).toBe(true);
    expect(isSerenaSupported('python')).toBe(true);
    expect(isSerenaSupported('rust')).toBe(true);
  });

  it('미지원 언어는 false를 반환한다', () => {
    expect(isSerenaSupported('unknown')).toBe(false);
    expect(isSerenaSupported('brainfuck')).toBe(false);
  });
});

describe('analyzeLanguageDistribution', () => {
  it('파일 목록에서 언어 분포를 분석한다', () => {
    const files = [
      'src/index.ts',
      'src/utils.ts',
      'src/app.tsx',
      'tests/test.py',
      'main.go',
    ];

    const distribution = analyzeLanguageDistribution(files);

    expect(distribution.typescript).toBe(3);
    expect(distribution.python).toBe(1);
    expect(distribution.go).toBe(1);
  });

  it('지원하지 않는 파일은 제외한다', () => {
    const files = ['readme.md', 'config.yaml', 'src/app.ts'];

    const distribution = analyzeLanguageDistribution(files);

    expect(distribution.typescript).toBe(1);
    expect(Object.keys(distribution).length).toBe(1);
  });
});

describe('findUnsupportedFiles', () => {
  it('지원하지 않는 파일을 찾는다', () => {
    const files = [
      'src/index.ts',
      'readme.md',
      'config.yaml',
      'data.json',
    ];

    const unsupported = findUnsupportedFiles(files);

    expect(unsupported).toContain('readme.md');
    expect(unsupported).toContain('config.yaml');
    expect(unsupported).not.toContain('src/index.ts');
  });
});

describe('detectPrimaryLanguage', () => {
  it('가장 많이 사용된 언어를 감지한다', () => {
    const files = [
      'src/a.ts',
      'src/b.ts',
      'src/c.ts',
      'test.py',
      'main.go',
    ];

    const primary = detectPrimaryLanguage(files);

    expect(primary).toBe('typescript');
  });

  it('지원 언어가 없으면 null을 반환한다', () => {
    const files = ['readme.md', 'config.yaml'];

    const primary = detectPrimaryLanguage(files);

    expect(primary).toBeNull();
  });
});

describe('getLanguageDisplayName', () => {
  it('지원 언어의 표시 이름을 반환한다', () => {
    expect(getLanguageDisplayName('typescript')).toBe('TypeScript');
    expect(getLanguageDisplayName('javascript')).toBe('JavaScript');
    expect(getLanguageDisplayName('csharp')).toBe('C#');
  });

  it('미지원 언어는 첫 글자를 대문자로', () => {
    expect(getLanguageDisplayName('unknown')).toBe('Unknown');
  });
});

describe('formatLanguageDistribution', () => {
  it('언어 분포를 문자열로 포맷한다', () => {
    const distribution = {
      typescript: 10,
      python: 5,
      go: 3,
    };

    const formatted = formatLanguageDistribution(distribution);

    expect(formatted).toContain('TypeScript: 10');
    expect(formatted).toContain('Python: 5');
    expect(formatted).toContain('Go: 3');
  });

  it('상위 5개만 표시한다', () => {
    const distribution = {
      typescript: 10,
      python: 9,
      go: 8,
      rust: 7,
      java: 6,
      kotlin: 5,
      swift: 4,
    };

    const formatted = formatLanguageDistribution(distribution);
    const lines = formatted.split(', ');

    expect(lines.length).toBe(5);
    expect(formatted).toContain('TypeScript');
    expect(formatted).not.toContain('Swift');
  });
});

describe('createUnsupportedWarning', () => {
  it('경고 메시지를 생성한다', () => {
    const extensions = ['.md', '.yaml', '.json'];

    const warning = createUnsupportedWarning(extensions);

    expect(warning).toContain('⚠️');
    expect(warning).toContain('.md');
    expect(warning).toContain('.yaml');
  });

  it('빈 목록이면 null을 반환한다', () => {
    const warning = createUnsupportedWarning([]);
    expect(warning).toBeNull();
  });

  it('중복을 제거한다', () => {
    const extensions = ['.md', '.md', '.yaml'];

    const warning = createUnsupportedWarning(extensions);

    // .md가 한 번만 나타나야 함
    const matches = warning?.match(/\.md/g) || [];
    expect(matches.length).toBe(1);
  });
});
