/**
 * 언어 감지 유틸리티
 *
 * 파일 확장자를 기반으로 프로그래밍 언어를 감지합니다.
 */

import path from 'node:path';

/**
 * File extension (lowercase, with dot) → language id
 */
export const FILE_EXTENSION_TO_LANGUAGE: Readonly<Record<string, string>> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.pyi': 'python',
  '.java': 'java',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.go': 'go',
  '.rs': 'rust',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cxx': 'cpp',
  '.cc': 'cpp',
  '.hpp': 'cpp',
  '.hxx': 'cpp',
  '.cs': 'csharp',
  '.rb': 'ruby',
  '.php': 'php',
  '.swift': 'swift',
  '.scala': 'scala',
  '.sc': 'scala',
  '.hs': 'haskell',
  '.lhs': 'haskell',
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.clj': 'clojure',
  '.cljs': 'clojure',
  '.cljc': 'clojure',
  '.dart': 'dart',
  '.lua': 'lua',
  '.pl': 'perl',
  '.pm': 'perl',
  '.r': 'r',
  '.jl': 'julia',
  '.ml': 'ocaml',
  '.mli': 'ocaml',
  '.fs': 'fsharp',
  '.fsi': 'fsharp',
  '.fsx': 'fsharp',
  '.erl': 'erlang',
  '.hrl': 'erlang',
  '.zig': 'zig',
  '.nim': 'nim',
  '.cr': 'crystal',
  '.vue': 'vue',
  '.svelte': 'svelte',
};

const KNOWN_LANGUAGES = new Set(Object.values(FILE_EXTENSION_TO_LANGUAGE));

/**
 * 파일 확장자로 언어 감지 (알 수 없으면 null)
 */
export function detectLanguage(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  return FILE_EXTENSION_TO_LANGUAGE[ext] ?? null;
}

/**
 * 사용자 입력(언어 ID 또는 확장자)을 언어 ID로 변환
 *
 * 예: "typescript" → "typescript", "ts" / ".ts" → "typescript"
 */
export function resolveLanguage(input: string): string | null {
  const value = input.trim().toLowerCase();
  if (!value) return null;
  if (KNOWN_LANGUAGES.has(value)) return value;
  const ext = value.startsWith('.') ? value : `.${value}`;
  return FILE_EXTENSION_TO_LANGUAGE[ext] ?? null;
}

/**
 * 파일 목록에서 언어 분포 분석 (언어 ID → 파일 수)
 */
export function analyzeLanguageDistribution(files: string[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const file of files) {
    const language = detectLanguage(file);
    if (language) {
      distribution[language] = (distribution[language] ?? 0) + 1;
    }
  }

  return distribution;
}
