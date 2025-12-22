/**
 * 리포트 생성 모듈
 *
 * 스펙 상태와 품질을 HTML/Markdown 형식으로 내보냅니다.
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import { Result, success, failure } from '../../types/index.js';
import { ChangeError } from '../../errors/index.js';
import { analyzeProjectQuality, ProjectQualityResult } from '../quality/index.js';
import { validateSpecs, ValidateResult } from '../spec/index.js';
import { readDir, fileExists } from '../../utils/fs.js';

/**
 * 스펙 목록 아이템
 */
export interface SpecListItem {
  id: string;
  title?: string;
  phase?: string;
  status?: string;
  description?: string;
}

/**
 * 리포트 형식
 */
export type ReportFormat = 'html' | 'markdown' | 'json';

/**
 * 리포트 옵션
 */
export interface ReportOptions {
  format: ReportFormat;
  outputPath?: string;
  includeQuality?: boolean;
  includeValidation?: boolean;
  title?: string;
}

/**
 * 리포트 데이터
 */
export interface ReportData {
  title: string;
  generatedAt: string;
  projectPath: string;
  specs: SpecListItem[];
  quality?: ProjectQualityResult;
  validation?: ValidateResult;
  summary: {
    totalSpecs: number;
    byPhase: Record<string, number>;
    byStatus: Record<string, number>;
    averageQuality?: number;
    validationErrors?: number;
    validationWarnings?: number;
  };
}

/**
 * 리포트 결과
 */
export interface ReportResult {
  format: ReportFormat;
  content: string;
  outputPath?: string;
}

/**
 * 스펙 목록 로드
 */
async function loadSpecList(specsPath: string): Promise<Result<SpecListItem[], ChangeError>> {
  try {
    if (!(await fileExists(specsPath))) {
      return failure(new ChangeError('스펙 디렉토리를 찾을 수 없습니다.'));
    }

    const result = await readDir(specsPath);
    if (!result.success) {
      return failure(new ChangeError('스펙 디렉토리를 읽을 수 없습니다.'));
    }

    const specs: SpecListItem[] = [];

    for (const entry of result.data) {
      const featurePath = path.join(specsPath, entry);
      const stat = await fs.stat(featurePath);

      if (stat.isDirectory()) {
        const specFile = path.join(featurePath, 'spec.md');
        if (await fileExists(specFile)) {
          const content = await fs.readFile(specFile, 'utf-8');
          const metadata = parseSpecMetadata(content);

          specs.push({
            id: entry,
            title: metadata?.title,
            phase: metadata?.phase,
            status: metadata?.status,
            description: metadata?.description,
          });
        }
      }
    }

    return success(specs);
  } catch (error) {
    return failure(new ChangeError(error instanceof Error ? error.message : String(error)));
  }
}

/**
 * 스펙 메타데이터 파싱
 */
function parseSpecMetadata(content: string): {
  title?: string;
  phase?: string;
  status?: string;
  description?: string;
} | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1];
  const result: Record<string, string> = {};

  const lines = frontmatter.split('\n');
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*['"]?([^'"]+)['"]?$/);
    if (match) {
      result[match[1]] = match[2].trim();
    }
  }

  return {
    title: result.title,
    phase: result.phase,
    status: result.status,
    description: result.description,
  };
}

/**
 * 리포트 생성
 */
export async function generateReport(
  sddPath: string,
  options: ReportOptions
): Promise<Result<ReportResult, ChangeError>> {
  try {
    // 스펙 목록 로드
    const specsPath = path.join(sddPath, 'specs');
    const specsResult = await loadSpecList(specsPath);

    if (!specsResult.success) {
      return failure(specsResult.error);
    }

    const specs = specsResult.data;

    // 리포트 데이터 구성
    const reportData: ReportData = {
      title: options.title || 'SDD 프로젝트 리포트',
      generatedAt: new Date().toISOString(),
      projectPath: sddPath,
      specs,
      summary: {
        totalSpecs: specs.length,
        byPhase: {},
        byStatus: {},
      },
    };

    // Phase별 집계
    for (const spec of specs) {
      const phase = spec.phase || 'unknown';
      reportData.summary.byPhase[phase] = (reportData.summary.byPhase[phase] || 0) + 1;

      const status = spec.status || 'unknown';
      reportData.summary.byStatus[status] = (reportData.summary.byStatus[status] || 0) + 1;
    }

    // 품질 분석 포함
    if (options.includeQuality !== false) {
      const qualityResult = await analyzeProjectQuality(sddPath);
      if (qualityResult.success) {
        reportData.quality = qualityResult.data;
        reportData.summary.averageQuality = qualityResult.data.averagePercentage;
      }
    }

    // 검증 결과 포함
    if (options.includeValidation !== false) {
      const validationResult = await validateSpecs(sddPath, { strict: false });
      if (validationResult.success) {
        reportData.validation = validationResult.data;
        reportData.summary.validationErrors = validationResult.data.errorCount;
        reportData.summary.validationWarnings = validationResult.data.warningCount;
      }
    }

    // 형식별 렌더링
    let content: string;
    switch (options.format) {
      case 'html':
        content = renderHtmlReport(reportData);
        break;
      case 'markdown':
        content = renderMarkdownReport(reportData);
        break;
      case 'json':
        content = JSON.stringify(reportData, null, 2);
        break;
      default:
        return failure(new ChangeError(`지원하지 않는 형식입니다: ${options.format}`));
    }

    // 파일로 저장
    if (options.outputPath) {
      await fs.mkdir(path.dirname(options.outputPath), { recursive: true });
      await fs.writeFile(options.outputPath, content, 'utf-8');
    }

    return success({
      format: options.format,
      content,
      outputPath: options.outputPath,
    });
  } catch (error) {
    return failure(new ChangeError(error instanceof Error ? error.message : String(error)));
  }
}

/**
 * HTML 리포트 렌더링
 */
function renderHtmlReport(data: ReportData): string {
  const gradeColor = (grade?: string): string => {
    switch (grade) {
      case 'A': return '#22c55e';
      case 'B': return '#84cc16';
      case 'C': return '#eab308';
      case 'D': return '#f97316';
      case 'F': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const statusBadge = (status: string): string => {
    const colors: Record<string, string> = {
      draft: '#6b7280',
      review: '#3b82f6',
      approved: '#22c55e',
      implemented: '#8b5cf6',
      deprecated: '#ef4444',
    };
    const color = colors[status] || '#6b7280';
    return `<span style="background:${color};color:white;padding:2px 8px;border-radius:4px;font-size:12px;">${status}</span>`;
  };

  const specRows = data.specs.map(spec => `
    <tr>
      <td><strong>${spec.id}</strong></td>
      <td>${spec.title || '-'}</td>
      <td>${spec.phase || '-'}</td>
      <td>${statusBadge(spec.status || 'unknown')}</td>
      <td>${spec.description || '-'}</td>
    </tr>
  `).join('');

  const qualityRows = data.quality?.results.map(q => `
    <tr>
      <td>${q.specId}</td>
      <td>${q.percentage}%</td>
      <td style="color:${gradeColor(q.grade)};font-weight:bold;">${q.grade}</td>
      <td>${q.totalScore}/${q.maxScore}</td>
    </tr>
  `).join('') || '';

  const validationRows = data.validation?.results.map(v => `
    <tr>
      <td>${v.file}</td>
      <td style="color:${v.errors.length > 0 ? '#ef4444' : '#22c55e'};">${v.errors.length > 0 ? '❌ 실패' : '✅ 통과'}</td>
      <td>${v.errors.length}</td>
      <td>${v.warnings.length}</td>
    </tr>
  `).join('') || '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; background: #f9fafb; padding: 2rem; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; color: #111827; }
    h2 { font-size: 1.5rem; margin: 2rem 0 1rem; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
    .meta { color: #6b7280; margin-bottom: 2rem; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card-title { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem; }
    .card-value { font-size: 2rem; font-weight: bold; color: #111827; }
    .card-value.success { color: #22c55e; }
    .card-value.warning { color: #eab308; }
    .card-value.error { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: 600; color: #374151; }
    tr:hover { background: #f9fafb; }
    .phase-chart { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .phase-item { background: #e0e7ff; color: #3730a3; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${data.title}</h1>
    <p class="meta">생성: ${new Date(data.generatedAt).toLocaleString('ko-KR')} | 경로: ${data.projectPath}</p>

    <div class="summary">
      <div class="card">
        <div class="card-title">총 스펙 수</div>
        <div class="card-value">${data.summary.totalSpecs}</div>
      </div>
      ${data.summary.averageQuality !== undefined ? `
      <div class="card">
        <div class="card-title">평균 품질</div>
        <div class="card-value ${data.summary.averageQuality >= 80 ? 'success' : data.summary.averageQuality >= 60 ? 'warning' : 'error'}">${data.summary.averageQuality.toFixed(1)}%</div>
      </div>` : ''}
      ${data.summary.validationErrors !== undefined ? `
      <div class="card">
        <div class="card-title">검증 에러</div>
        <div class="card-value ${data.summary.validationErrors === 0 ? 'success' : 'error'}">${data.summary.validationErrors}</div>
      </div>` : ''}
      ${data.summary.validationWarnings !== undefined ? `
      <div class="card">
        <div class="card-title">검증 경고</div>
        <div class="card-value ${data.summary.validationWarnings === 0 ? 'success' : 'warning'}">${data.summary.validationWarnings}</div>
      </div>` : ''}
    </div>

    <h2>Phase별 분포</h2>
    <div class="phase-chart">
      ${Object.entries(data.summary.byPhase).map(([phase, count]) => `
        <span class="phase-item">${phase}: ${count}</span>
      `).join('')}
    </div>

    <h2>스펙 목록</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>제목</th>
          <th>Phase</th>
          <th>상태</th>
          <th>설명</th>
        </tr>
      </thead>
      <tbody>
        ${specRows}
      </tbody>
    </table>

    ${data.quality ? `
    <h2>품질 분석</h2>
    <table>
      <thead>
        <tr>
          <th>스펙 ID</th>
          <th>점수</th>
          <th>등급</th>
          <th>상세</th>
        </tr>
      </thead>
      <tbody>
        ${qualityRows}
      </tbody>
    </table>` : ''}

    ${data.validation ? `
    <h2>검증 결과</h2>
    <table>
      <thead>
        <tr>
          <th>파일</th>
          <th>상태</th>
          <th>에러</th>
          <th>경고</th>
        </tr>
      </thead>
      <tbody>
        ${validationRows}
      </tbody>
    </table>` : ''}

    <footer style="margin-top:3rem;padding-top:1rem;border-top:1px solid #e5e7eb;color:#6b7280;font-size:0.875rem;">
      Generated by SDD CLI v0.5.0
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Markdown 리포트 렌더링
 */
function renderMarkdownReport(data: ReportData): string {
  const lines: string[] = [];

  lines.push(`# ${data.title}`);
  lines.push('');
  lines.push(`> 생성: ${new Date(data.generatedAt).toLocaleString('ko-KR')}`);
  lines.push(`> 경로: ${data.projectPath}`);
  lines.push('');

  // 요약
  lines.push('## 요약');
  lines.push('');
  lines.push(`| 항목 | 값 |`);
  lines.push(`|------|-----|`);
  lines.push(`| 총 스펙 수 | ${data.summary.totalSpecs} |`);
  if (data.summary.averageQuality !== undefined) {
    lines.push(`| 평균 품질 | ${data.summary.averageQuality.toFixed(1)}% |`);
  }
  if (data.summary.validationErrors !== undefined) {
    lines.push(`| 검증 에러 | ${data.summary.validationErrors} |`);
  }
  if (data.summary.validationWarnings !== undefined) {
    lines.push(`| 검증 경고 | ${data.summary.validationWarnings} |`);
  }
  lines.push('');

  // Phase별 분포
  lines.push('## Phase별 분포');
  lines.push('');
  for (const [phase, count] of Object.entries(data.summary.byPhase)) {
    lines.push(`- **${phase}**: ${count}개`);
  }
  lines.push('');

  // 상태별 분포
  lines.push('## 상태별 분포');
  lines.push('');
  for (const [status, count] of Object.entries(data.summary.byStatus)) {
    lines.push(`- **${status}**: ${count}개`);
  }
  lines.push('');

  // 스펙 목록
  lines.push('## 스펙 목록');
  lines.push('');
  lines.push('| ID | 제목 | Phase | 상태 |');
  lines.push('|----|------|-------|------|');
  for (const spec of data.specs) {
    lines.push(`| ${spec.id} | ${spec.title || '-'} | ${spec.phase || '-'} | ${spec.status || '-'} |`);
  }
  lines.push('');

  // 품질 분석
  if (data.quality) {
    lines.push('## 품질 분석');
    lines.push('');
    lines.push(`평균 점수: **${data.quality.averagePercentage.toFixed(1)}%** (${data.quality.averageGrade})`);
    lines.push('');
    lines.push('| 스펙 ID | 점수 | 등급 |');
    lines.push('|---------|------|------|');
    for (const q of data.quality.results) {
      lines.push(`| ${q.specId} | ${q.percentage}% | ${q.grade} |`);
    }
    lines.push('');
  }

  // 검증 결과
  if (data.validation) {
    lines.push('## 검증 결과');
    lines.push('');
    lines.push(`- 검증된 스펙: ${data.validation.validCount}개`);
    lines.push(`- 에러: ${data.validation.errorCount}개`);
    lines.push(`- 경고: ${data.validation.warningCount}개`);
    lines.push('');

    if (data.validation.errorCount > 0 || data.validation.warningCount > 0) {
      lines.push('### 상세 결과');
      lines.push('');
      for (const v of data.validation.results) {
        if (v.errors.length > 0 || v.warnings.length > 0) {
          lines.push(`#### ${v.file}`);
          for (const e of v.errors) {
            lines.push(`- ${e}`);
          }
          for (const w of v.warnings) {
            lines.push(`- ${w}`);
          }
          lines.push('');
        }
      }
    }
  }

  lines.push('---');
  lines.push('*Generated by SDD CLI v0.5.0*');

  return lines.join('\n');
}
