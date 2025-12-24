/**
 * HTML 내보내기용 스타일
 */

export const lightTheme = `
:root {
  --bg-color: #ffffff;
  --text-color: #1a1a2e;
  --heading-color: #16213e;
  --border-color: #e0e0e0;
  --code-bg: #f5f5f5;
  --link-color: #0066cc;
  --toc-bg: #fafafa;
  --req-high: #dc3545;
  --req-medium: #ffc107;
  --req-low: #28a745;
  --keyword-shall: #dc3545;
  --keyword-should: #fd7e14;
  --keyword-may: #28a745;
  --scenario-bg: #f8f9fa;
  --gwt-given: #17a2b8;
  --gwt-when: #6f42c1;
  --gwt-then: #28a745;
}
`;

export const darkTheme = `
:root {
  --bg-color: #1a1a2e;
  --text-color: #e0e0e0;
  --heading-color: #ffffff;
  --border-color: #3a3a5e;
  --code-bg: #2a2a4e;
  --link-color: #66b3ff;
  --toc-bg: #16213e;
  --req-high: #ff6b6b;
  --req-medium: #ffd93d;
  --req-low: #6bcb77;
  --keyword-shall: #ff6b6b;
  --keyword-should: #ffa502;
  --keyword-may: #6bcb77;
  --scenario-bg: #16213e;
  --gwt-given: #4ecdc4;
  --gwt-when: #a66cff;
  --gwt-then: #6bcb77;
}
`;

export const baseStyles = `
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--bg-color);
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1, h2, h3, h4, h5, h6 {
  color: var(--heading-color);
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

h1 { font-size: 2.5rem; border-bottom: 3px solid var(--border-color); padding-bottom: 0.5rem; }
h2 { font-size: 1.8rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.3rem; }
h3 { font-size: 1.4rem; }
h4 { font-size: 1.2rem; }

p { margin: 1em 0; }

a {
  color: var(--link-color);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

code {
  background: var(--code-bg);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
}

pre {
  background: var(--code-bg);
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1em 0;
}

pre code {
  background: none;
  padding: 0;
}

/* 목차 */
.toc {
  background: var(--toc-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.toc h2 {
  font-size: 1.2rem;
  margin-top: 0;
  margin-bottom: 1rem;
  border: none;
}

.toc ul {
  list-style: none;
  padding-left: 0;
}

.toc li {
  margin: 0.5em 0;
}

.toc ul ul {
  padding-left: 1.5rem;
}

.toc a {
  display: inline-block;
  padding: 0.2em 0;
}

/* 메타데이터 */
.metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 1rem 0 2rem;
  padding: 1rem;
  background: var(--toc-bg);
  border-radius: 6px;
  font-size: 0.9rem;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.metadata-label {
  font-weight: 600;
  color: var(--heading-color);
}

.metadata-value {
  color: var(--text-color);
}

.status-badge {
  display: inline-block;
  padding: 0.2em 0.6em;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 500;
}

.status-draft { background: #ffc107; color: #000; }
.status-review { background: #17a2b8; color: #fff; }
.status-approved { background: #28a745; color: #fff; }

/* 요구사항 */
.requirement {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border-left: 4px solid var(--border-color);
}

.requirement.priority-high { border-left-color: var(--req-high); }
.requirement.priority-medium { border-left-color: var(--req-medium); }
.requirement.priority-low { border-left-color: var(--req-low); }

.requirement-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.requirement-id {
  font-family: monospace;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.2em 0.5em;
  background: var(--code-bg);
  border-radius: 4px;
}

.requirement-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.requirement-description {
  margin: 0;
}

/* RFC 2119 키워드 */
.rfc-keyword {
  font-weight: 700;
  padding: 0.1em 0.3em;
  border-radius: 3px;
}

.rfc-shall, .rfc-must, .rfc-required {
  color: var(--keyword-shall);
}

.rfc-should, .rfc-recommended {
  color: var(--keyword-should);
}

.rfc-may, .rfc-optional {
  color: var(--keyword-may);
}

/* 시나리오 */
.scenario {
  background: var(--scenario-bg);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.scenario-title {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.gwt-list {
  list-style: none;
  padding: 0;
}

.gwt-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin: 0.75rem 0;
  padding: 0.5rem;
  background: var(--bg-color);
  border-radius: 4px;
}

.gwt-keyword {
  font-weight: 700;
  min-width: 60px;
  padding: 0.2em 0.5em;
  border-radius: 4px;
  text-align: center;
  font-size: 0.85rem;
}

.gwt-given .gwt-keyword { background: var(--gwt-given); color: #fff; }
.gwt-when .gwt-keyword { background: var(--gwt-when); color: #fff; }
.gwt-then .gwt-keyword { background: var(--gwt-then); color: #fff; }
.gwt-and .gwt-keyword { background: var(--border-color); color: var(--text-color); }

.gwt-text {
  flex: 1;
}

/* 의존성 */
.dependencies {
  margin: 1rem 0;
}

.dependency-tag {
  display: inline-block;
  padding: 0.3em 0.8em;
  background: var(--code-bg);
  border-radius: 20px;
  font-size: 0.85rem;
  margin: 0.25rem;
}

/* 푸터 */
.footer {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-color);
  opacity: 0.7;
}

/* 인쇄 스타일 */
@media print {
  body {
    max-width: none;
    padding: 0;
  }

  .toc {
    page-break-after: always;
  }

  .requirement, .scenario {
    page-break-inside: avoid;
  }

  a {
    color: inherit;
  }

  a::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #666;
  }
}

/* 반응형 */
@media (max-width: 768px) {
  body {
    padding: 1rem;
  }

  h1 { font-size: 1.8rem; }
  h2 { font-size: 1.4rem; }
  h3 { font-size: 1.2rem; }

  .metadata {
    flex-direction: column;
    gap: 0.5rem;
  }

  .requirement-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
`;
