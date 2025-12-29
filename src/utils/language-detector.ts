/**
 * 언어 감지 유틸리티
 *
 * 파일 확장자를 기반으로 프로그래밍 언어를 감지합니다.
 * Serena MCP 지원 언어 목록과 연동됩니다.
 */

import path from 'node:path';
import {
  FILE_EXTENSION_TO_LANGUAGE,
  SERENA_SUPPORTED_LANGUAGES,
  type SerenaLanguage,
} from '../integrations/serena/types.js';

/**
 * 언어 감지 결과
 */
export interface LanguageDetectionResult {
  /** 감지된 언어 */
  language: string | null;
  /** Serena 지원 언어 여부 */
  isSupported: boolean;
  /** 파일 확장자 */
  extension: string;
}

/**
 * 언어별 정보
 */
export interface LanguageInfo {
  /** 언어 ID */
  id: SerenaLanguage;
  /** 표시 이름 */
  displayName: string;
  /** 지원 확장자 */
  extensions: string[];
  /** 언어 계열 */
  family: 'c-like' | 'ml-like' | 'lisp-like' | 'scripting' | 'other';
}

/**
 * 언어 정보 데이터베이스
 */
export const LANGUAGE_INFO: Record<SerenaLanguage, LanguageInfo> = {
  typescript: {
    id: 'typescript',
    displayName: 'TypeScript',
    extensions: ['.ts', '.tsx'],
    family: 'c-like',
  },
  javascript: {
    id: 'javascript',
    displayName: 'JavaScript',
    extensions: ['.js', '.jsx', '.mjs', '.cjs'],
    family: 'c-like',
  },
  python: {
    id: 'python',
    displayName: 'Python',
    extensions: ['.py', '.pyi'],
    family: 'scripting',
  },
  java: {
    id: 'java',
    displayName: 'Java',
    extensions: ['.java'],
    family: 'c-like',
  },
  kotlin: {
    id: 'kotlin',
    displayName: 'Kotlin',
    extensions: ['.kt', '.kts'],
    family: 'c-like',
  },
  go: {
    id: 'go',
    displayName: 'Go',
    extensions: ['.go'],
    family: 'c-like',
  },
  rust: {
    id: 'rust',
    displayName: 'Rust',
    extensions: ['.rs'],
    family: 'c-like',
  },
  c: {
    id: 'c',
    displayName: 'C',
    extensions: ['.c', '.h'],
    family: 'c-like',
  },
  cpp: {
    id: 'cpp',
    displayName: 'C++',
    extensions: ['.cpp', '.cxx', '.cc', '.hpp', '.hxx'],
    family: 'c-like',
  },
  csharp: {
    id: 'csharp',
    displayName: 'C#',
    extensions: ['.cs'],
    family: 'c-like',
  },
  ruby: {
    id: 'ruby',
    displayName: 'Ruby',
    extensions: ['.rb'],
    family: 'scripting',
  },
  php: {
    id: 'php',
    displayName: 'PHP',
    extensions: ['.php'],
    family: 'c-like',
  },
  swift: {
    id: 'swift',
    displayName: 'Swift',
    extensions: ['.swift'],
    family: 'c-like',
  },
  scala: {
    id: 'scala',
    displayName: 'Scala',
    extensions: ['.scala', '.sc'],
    family: 'c-like',
  },
  haskell: {
    id: 'haskell',
    displayName: 'Haskell',
    extensions: ['.hs', '.lhs'],
    family: 'ml-like',
  },
  elixir: {
    id: 'elixir',
    displayName: 'Elixir',
    extensions: ['.ex', '.exs'],
    family: 'scripting',
  },
  clojure: {
    id: 'clojure',
    displayName: 'Clojure',
    extensions: ['.clj', '.cljs', '.cljc'],
    family: 'lisp-like',
  },
  dart: {
    id: 'dart',
    displayName: 'Dart',
    extensions: ['.dart'],
    family: 'c-like',
  },
  lua: {
    id: 'lua',
    displayName: 'Lua',
    extensions: ['.lua'],
    family: 'scripting',
  },
  perl: {
    id: 'perl',
    displayName: 'Perl',
    extensions: ['.pl', '.pm'],
    family: 'scripting',
  },
  r: {
    id: 'r',
    displayName: 'R',
    extensions: ['.r', '.R'],
    family: 'scripting',
  },
  julia: {
    id: 'julia',
    displayName: 'Julia',
    extensions: ['.jl'],
    family: 'scripting',
  },
  ocaml: {
    id: 'ocaml',
    displayName: 'OCaml',
    extensions: ['.ml', '.mli'],
    family: 'ml-like',
  },
  fsharp: {
    id: 'fsharp',
    displayName: 'F#',
    extensions: ['.fs', '.fsi', '.fsx'],
    family: 'ml-like',
  },
  erlang: {
    id: 'erlang',
    displayName: 'Erlang',
    extensions: ['.erl', '.hrl'],
    family: 'other',
  },
  zig: {
    id: 'zig',
    displayName: 'Zig',
    extensions: ['.zig'],
    family: 'c-like',
  },
  nim: {
    id: 'nim',
    displayName: 'Nim',
    extensions: ['.nim'],
    family: 'scripting',
  },
  crystal: {
    id: 'crystal',
    displayName: 'Crystal',
    extensions: ['.cr'],
    family: 'scripting',
  },
  v: {
    id: 'v',
    displayName: 'V',
    extensions: ['.v'],
    family: 'c-like',
  },
  odin: {
    id: 'odin',
    displayName: 'Odin',
    extensions: ['.odin'],
    family: 'c-like',
  },
};

/**
 * 파일 확장자로 언어 감지
 */
export function detectLanguage(filePath: string): LanguageDetectionResult {
  const ext = path.extname(filePath).toLowerCase();
  const language = FILE_EXTENSION_TO_LANGUAGE[ext] || null;

  return {
    language,
    isSupported: language !== null,
    extension: ext,
  };
}

/**
 * 언어 ID가 Serena 지원 언어인지 확인
 */
export function isSerenaSupported(language: string): language is SerenaLanguage {
  return (SERENA_SUPPORTED_LANGUAGES as readonly string[]).includes(language);
}

/**
 * 파일 목록에서 언어 분포 분석
 */
export function analyzeLanguageDistribution(
  files: string[]
): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const file of files) {
    const result = detectLanguage(file);
    if (result.language) {
      distribution[result.language] = (distribution[result.language] || 0) + 1;
    }
  }

  return distribution;
}

/**
 * 지원되지 않는 파일 목록 추출
 */
export function findUnsupportedFiles(files: string[]): string[] {
  return files.filter((file) => {
    const result = detectLanguage(file);
    return !result.isSupported && result.extension !== '';
  });
}

/**
 * 프로젝트 주 언어 감지
 */
export function detectPrimaryLanguage(
  files: string[]
): SerenaLanguage | null {
  const distribution = analyzeLanguageDistribution(files);
  let maxCount = 0;
  let primaryLanguage: SerenaLanguage | null = null;

  for (const [lang, count] of Object.entries(distribution)) {
    if (count > maxCount && isSerenaSupported(lang)) {
      maxCount = count;
      primaryLanguage = lang;
    }
  }

  return primaryLanguage;
}

/**
 * 언어 표시 이름 가져오기
 */
export function getLanguageDisplayName(language: string): string {
  if (isSerenaSupported(language)) {
    return LANGUAGE_INFO[language].displayName;
  }
  return language.charAt(0).toUpperCase() + language.slice(1);
}

/**
 * 확장자로 언어 정보 가져오기
 */
export function getLanguageInfoByExtension(ext: string): LanguageInfo | null {
  const language = FILE_EXTENSION_TO_LANGUAGE[ext.toLowerCase()];
  if (language) {
    return LANGUAGE_INFO[language];
  }
  return null;
}

/**
 * 언어 분포 요약 문자열 생성
 */
export function formatLanguageDistribution(
  distribution: Record<string, number>
): string {
  const sorted = Object.entries(distribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // 상위 5개만

  return sorted
    .map(([lang, count]) => `${getLanguageDisplayName(lang)}: ${count}`)
    .join(', ');
}

/**
 * Serena 지원 언어 목록 문자열 생성
 */
export function formatSupportedLanguages(): string {
  const groups: Record<string, string[]> = {
    '주요 언어': ['typescript', 'javascript', 'python', 'java', 'go', 'rust'],
    '시스템 언어': ['c', 'cpp', 'csharp', 'zig', 'nim'],
    '함수형 언어': ['haskell', 'ocaml', 'fsharp', 'clojure', 'elixir', 'erlang'],
    '스크립팅': ['ruby', 'php', 'perl', 'lua', 'r', 'julia'],
    '기타': ['swift', 'kotlin', 'scala', 'dart', 'crystal', 'v', 'odin'],
  };

  const lines: string[] = [];
  for (const [group, languages] of Object.entries(groups)) {
    const names = languages.map((l) => LANGUAGE_INFO[l as SerenaLanguage]?.displayName || l);
    lines.push(`${group}: ${names.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * 확장자 목록으로 지원되지 않는 확장자 경고 메시지 생성
 */
export function createUnsupportedWarning(
  unsupportedExtensions: string[]
): string | null {
  if (unsupportedExtensions.length === 0) {
    return null;
  }

  const unique = [...new Set(unsupportedExtensions)];
  return `⚠️ 다음 확장자는 Serena에서 지원되지 않습니다: ${unique.join(', ')}`;
}
