/**
 * HTML 내보내기
 */
import type { ParsedSpec, ParsedRequirement, ParsedScenario, Theme } from './schemas.js';
import { lightTheme, darkTheme, baseStyles } from './styles.js';

interface HtmlExportOptions {
  theme?: Theme;
  includeToc?: boolean;
  includeConstitution?: boolean;
  title?: string;
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * RFC 2119 키워드 강조
 */
function highlightKeywords(text: string): string {
  return text.replace(
    /\b(SHALL NOT|SHALL|MUST NOT|MUST|SHOULD NOT|SHOULD|REQUIRED|RECOMMENDED|OPTIONAL|MAY)\b/gi,
    (match) => {
      const keyword = match.toUpperCase().replace(' ', '-').toLowerCase();
      return `<span class="rfc-keyword rfc-${keyword}">${match}</span>`;
    }
  );
}

/**
 * 마크다운 기본 변환 (간단한 형식만)
 */
function convertMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

/**
 * 목차 생성
 */
function generateToc(specs: ParsedSpec[]): string {
  const items: string[] = [];

  for (const spec of specs) {
    items.push(`<li><a href="#spec-${spec.id}">${escapeHtml(spec.title || spec.id)}</a>`);

    if (spec.requirements.length > 0 || spec.scenarios.length > 0) {
      items.push('<ul>');

      for (const req of spec.requirements) {
        items.push(`<li><a href="#${req.id}">${req.id}: ${escapeHtml(req.title)}</a></li>`);
      }

      for (const scenario of spec.scenarios) {
        items.push(`<li><a href="#${scenario.id}">${escapeHtml(scenario.title)}</a></li>`);
      }

      items.push('</ul>');
    }

    items.push('</li>');
  }

  return `
<nav class="toc">
  <h2>목차</h2>
  <ul>
    ${items.join('\n    ')}
  </ul>
</nav>`;
}

/**
 * 메타데이터 렌더링
 */
function renderMetadata(spec: ParsedSpec): string {
  const items: string[] = [];

  if (spec.status) {
    const statusClass = `status-${spec.status}`;
    items.push(`
      <div class="metadata-item">
        <span class="metadata-label">상태:</span>
        <span class="status-badge ${statusClass}">${escapeHtml(spec.status)}</span>
      </div>`);
  }

  if (spec.version) {
    items.push(`
      <div class="metadata-item">
        <span class="metadata-label">버전:</span>
        <span class="metadata-value">${escapeHtml(spec.version)}</span>
      </div>`);
  }

  if (spec.created) {
    items.push(`
      <div class="metadata-item">
        <span class="metadata-label">작성일:</span>
        <span class="metadata-value">${escapeHtml(spec.created)}</span>
      </div>`);
  }

  if (spec.author) {
    items.push(`
      <div class="metadata-item">
        <span class="metadata-label">작성자:</span>
        <span class="metadata-value">${escapeHtml(spec.author)}</span>
      </div>`);
  }

  if (items.length === 0) return '';

  return `<div class="metadata">${items.join('')}</div>`;
}

/**
 * 요구사항 렌더링
 */
function renderRequirement(req: ParsedRequirement): string {
  const priorityClass = req.priority ? `priority-${req.priority}` : '';
  const description = highlightKeywords(convertMarkdown(escapeHtml(req.description)));

  return `
<article id="${req.id}" class="requirement ${priorityClass}">
  <div class="requirement-header">
    <span class="requirement-id">${req.id}</span>
    <h4 class="requirement-title">${escapeHtml(req.title)}</h4>
  </div>
  <p class="requirement-description">${description}</p>
</article>`;
}

/**
 * 시나리오 렌더링
 */
function renderScenario(scenario: ParsedScenario): string {
  const gwtItems: string[] = [];

  for (const given of scenario.given) {
    gwtItems.push(`
      <li class="gwt-item gwt-given">
        <span class="gwt-keyword">GIVEN</span>
        <span class="gwt-text">${convertMarkdown(escapeHtml(given))}</span>
      </li>`);
  }

  for (const when of scenario.when) {
    gwtItems.push(`
      <li class="gwt-item gwt-when">
        <span class="gwt-keyword">WHEN</span>
        <span class="gwt-text">${convertMarkdown(escapeHtml(when))}</span>
      </li>`);
  }

  for (const then of scenario.then) {
    gwtItems.push(`
      <li class="gwt-item gwt-then">
        <span class="gwt-keyword">THEN</span>
        <span class="gwt-text">${convertMarkdown(escapeHtml(then))}</span>
      </li>`);
  }

  if (scenario.and) {
    for (const and of scenario.and) {
      gwtItems.push(`
        <li class="gwt-item gwt-and">
          <span class="gwt-keyword">AND</span>
          <span class="gwt-text">${convertMarkdown(escapeHtml(and))}</span>
        </li>`);
    }
  }

  return `
<article id="${scenario.id}" class="scenario">
  <h4 class="scenario-title">${escapeHtml(scenario.title)}</h4>
  <ul class="gwt-list">
    ${gwtItems.join('')}
  </ul>
</article>`;
}

/**
 * 의존성 렌더링
 */
function renderDependencies(dependencies: string[]): string {
  if (dependencies.length === 0) return '';

  const tags = dependencies
    .map(dep => `<span class="dependency-tag">${escapeHtml(dep)}</span>`)
    .join('');

  return `
<div class="dependencies">
  <h4>의존성</h4>
  ${tags}
</div>`;
}

/**
 * 단일 스펙 렌더링
 */
function renderSpec(spec: ParsedSpec): string {
  const sections: string[] = [];

  // 헤더
  sections.push(`
<section id="spec-${spec.id}" class="spec">
  <header>
    <h2>${escapeHtml(spec.title || spec.id)}</h2>
    ${spec.description ? `<p class="description">${convertMarkdown(escapeHtml(spec.description))}</p>` : ''}
    ${renderMetadata(spec)}
  </header>`);

  // 의존성
  if (spec.dependencies.length > 0) {
    sections.push(renderDependencies(spec.dependencies));
  }

  // 요구사항
  if (spec.requirements.length > 0) {
    sections.push(`
  <section class="requirements">
    <h3>요구사항</h3>
    ${spec.requirements.map(renderRequirement).join('')}
  </section>`);
  }

  // 시나리오
  if (spec.scenarios.length > 0) {
    sections.push(`
  <section class="scenarios">
    <h3>시나리오</h3>
    ${spec.scenarios.map(renderScenario).join('')}
  </section>`);
  }

  sections.push('</section>');

  return sections.join('\n');
}

/**
 * 전체 HTML 문서 생성
 */
export function generateHtml(specs: ParsedSpec[], options: HtmlExportOptions = {}): string {
  const { theme = 'light', includeToc = true, title = 'SDD 스펙 문서' } = options;
  const themeStyles = theme === 'dark' ? darkTheme : lightTheme;

  const specContents = specs.map(renderSpec).join('\n<hr>\n');
  const toc = includeToc ? generateToc(specs) : '';

  const timestamp = new Date().toISOString().split('T')[0];

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="SDD Tool">
  <title>${escapeHtml(title)}</title>
  <style>
${themeStyles}
${baseStyles}
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(title)}</h1>
  </header>

  ${toc}

  <main>
    ${specContents}
  </main>

  <footer class="footer">
    <p>Generated by SDD Tool on ${timestamp}</p>
  </footer>
</body>
</html>`;
}
