/**
 * sdd export 모듈
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export * from './schemas.js';
export { parseSpecFile, parseAllSpecs, parseSpecById } from './spec-parser.js';
export { generateHtml } from './html-exporter.js';
export { generateJson, generateSummaryJson } from './json-exporter.js';

import { parseAllSpecs, parseSpecById } from './spec-parser.js';
import { generateHtml } from './html-exporter.js';
import { generateJson } from './json-exporter.js';
import type { ExportOptions, ExportResult, ParsedSpec } from './schemas.js';

/**
 * 기본 출력 파일명 생성
 */
function getDefaultOutputPath(
  projectRoot: string,
  format: string,
  specIds?: string[]
): string {
  const baseName = specIds?.length === 1 ? specIds[0] : 'specs';
  return path.join(projectRoot, `${baseName}.${format}`);
}

/**
 * sdd export 실행
 */
export async function executeExport(
  projectRoot: string,
  options: ExportOptions = {}
): Promise<ExportResult> {
  const {
    format = 'html',
    output,
    theme = 'light',
    includeToc = true,
    all = false,
    specIds,
  } = options;

  try {
    // 스펙 로드
    let specs: ParsedSpec[] = [];

    if (all) {
      specs = await parseAllSpecs(projectRoot);
    } else if (specIds && specIds.length > 0) {
      for (const specId of specIds) {
        const spec = await parseSpecById(projectRoot, specId);
        if (spec) {
          specs.push(spec);
        }
      }
    } else {
      // 기본: 전체 스펙
      specs = await parseAllSpecs(projectRoot);
    }

    if (specs.length === 0) {
      return {
        success: false,
        format,
        specsExported: 0,
        error: '내보낼 스펙이 없습니다.',
      };
    }

    // 출력 경로 결정
    const outputPath = output || getDefaultOutputPath(projectRoot, format, specIds);

    // 형식별 변환
    let content: string;

    switch (format) {
      case 'html':
        content = generateHtml(specs, {
          theme,
          includeToc,
          title: specs.length === 1 ? specs[0].title : 'SDD 스펙 문서',
        });
        break;

      case 'json':
        content = generateJson(specs, { pretty: true });
        break;

      case 'markdown':
        // 마크다운은 원본 그대로 병합
        content = specs
          .map(spec => {
            const header = `# ${spec.title || spec.id}\n\n`;
            return header + spec.rawContent;
          })
          .join('\n\n---\n\n');
        break;

      case 'pdf':
        // PDF는 HTML 생성 후 안내 메시지
        content = generateHtml(specs, {
          theme,
          includeToc,
          title: specs.length === 1 ? specs[0].title : 'SDD 스펙 문서',
        });
        const htmlPath = outputPath.replace(/\.pdf$/, '.html');
        await fs.writeFile(htmlPath, content, 'utf-8');

        return {
          success: true,
          outputPath: htmlPath,
          format: 'html',
          specsExported: specs.length,
          size: Buffer.byteLength(content, 'utf-8'),
          error: `PDF 직접 생성은 지원하지 않습니다. ${htmlPath} 파일을 브라우저에서 열어 PDF로 인쇄하세요.`,
        };

      default:
        return {
          success: false,
          format,
          specsExported: 0,
          error: `지원하지 않는 형식: ${format}`,
        };
    }

    // 출력 디렉토리 생성
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // 파일 저장
    await fs.writeFile(outputPath, content, 'utf-8');

    return {
      success: true,
      outputPath,
      format,
      specsExported: specs.length,
      size: Buffer.byteLength(content, 'utf-8'),
    };
  } catch (error) {
    return {
      success: false,
      format,
      specsExported: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 터미널 출력 포맷
 */
export function formatExportResult(result: ExportResult): string {
  if (!result.success) {
    return `오류: ${result.error}`;
  }

  const lines: string[] = [];
  lines.push('=== SDD Export ===');
  lines.push('');
  lines.push(`형식: ${result.format.toUpperCase()}`);
  lines.push(`스펙: ${result.specsExported}개`);
  if (result.outputPath) {
    lines.push(`출력: ${result.outputPath}`);
  }
  if (result.size) {
    const sizeKb = (result.size / 1024).toFixed(2);
    lines.push(`크기: ${sizeKb} KB`);
  }
  if (result.error) {
    lines.push('');
    lines.push(`참고: ${result.error}`);
  }

  return lines.join('\n');
}
