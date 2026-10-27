/**
 * 안전한 frontmatter 파서
 *
 * gray-matter supports `---js` / `---coffee` frontmatter, which is evaluated
 * with `eval`. Spec files are untrusted input, so executable engines are
 * replaced with stubs that throw before any code is evaluated.
 */
import matter from 'gray-matter';

function rejectExecutableEngine(language: string): () => never {
  return () => {
    throw new Error(
      `지원하지 않는 frontmatter 형식입니다: '${language}' (YAML 또는 JSON frontmatter만 허용됩니다)`
    );
  };
}

const SAFE_ENGINES = {
  js: rejectExecutableEngine('js'),
  javascript: rejectExecutableEngine('javascript'),
  coffee: rejectExecutableEngine('coffee'),
  coffeescript: rejectExecutableEngine('coffeescript'),
  cson: rejectExecutableEngine('cson'),
};

/**
 * Parse frontmatter without allowing executable (JS/CoffeeScript) engines.
 * Throws on non-YAML/JSON executable frontmatter; callers handle it as a parse error.
 */
export function parseFrontmatter(content: string): matter.GrayMatterFile<string> {
  return matter(content, { engines: SAFE_ENGINES });
}
