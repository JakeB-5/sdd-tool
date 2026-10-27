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
import { resolveSpec } from '../spec/locator.js';
import { listPendingChanges } from '../change/index.js';
import { readFrontmatter } from '../../utils/frontmatter.js';
import { generateHtml } from './html-exporter.js';
import { generateJson } from './json-exporter.js';
import {
  EXPORT_FILE_EXTENSIONS,
  ExportFormatSchema,
  type ExportAppendix,
  type ExportFormat,
  type ExportOptionsInput,
  type ExportResult,
  type ParsedSpec,
} from './schemas.js';

/**
 * 기본 출력 파일명 생성
 */
function getDefaultOutputPath(
  projectRoot: string,
  format: ExportFormat,
  specIds?: string[]
): string {
  // Canonical ids may contain '/' (domain/feature); flatten for a single file name
  const baseName = specIds?.length === 1 ? specIds[0].replace(/[\\/]+/g, '-') : 'specs';
  return path.join(projectRoot, `${baseName}.${EXPORT_FILE_EXTENSIONS[format]}`);
}

/**
 * Constitution / 대기 중인 변경 제안을 부록으로 수집
 */
async function collectAppendices(
  projectRoot: string,
  includeConstitution: boolean,
  includeChanges: boolean
): Promise<ExportAppendix[]> {
  const sddPath = path.join(projectRoot, '.sdd');
  const appendices: ExportAppendix[] = [];

  if (includeConstitution) {
    const constitutionPath = path.join(sddPath, 'constitution.md');
    const content = await fs.readFile(constitutionPath, 'utf-8').catch(() => null);
    if (content === null) {
      throw new Error('constitution.md를 찾을 수 없습니다 (--include-constitution).');
    }
    appendices.push({
      kind: 'constitution',
      id: 'constitution',
      title: 'Constitution',
      content: readFrontmatter(content).body.trim(),
    });
  }

  if (includeChanges) {
    const pending = await listPendingChanges(sddPath);
    if (!pending.success) {
      throw new Error(pending.error.message);
    }
    for (const change of pending.data) {
      const proposal = await fs
        .readFile(path.join(change.path, 'proposal.md'), 'utf-8')
        .catch(() => '');
      appendices.push({
        kind: 'change',
        id: change.id,
        title: change.title ? `변경 제안 ${change.id}: ${change.title}` : `변경 제안 ${change.id}`,
        content: readFrontmatter(proposal).body.trim(),
      });
    }
  }

  return appendices;
}

/**
 * 스펙 본문을 마크다운으로 병합 (본문에 H1이 없을 때만 제목 추가)
 */
function generateMarkdown(specs: ParsedSpec[], appendices: ExportAppendix[]): string {
  const sections = specs.map((spec) => {
    const body = spec.rawContent.trim();
    return /^#\s+/.test(body) ? body : `# ${spec.title || spec.id}\n\n${body}`;
  });
  for (const appendix of appendices) {
    sections.push(`# ${appendix.title}\n\n${appendix.content}`);
  }
  return sections.join('\n\n---\n\n') + '\n';
}

/**
 * sdd export 실행
 */
export async function executeExport(
  projectRoot: string,
  options: ExportOptionsInput = {}
): Promise<ExportResult> {
  const {
    format = 'html',
    output,
    theme = 'light',
    includeToc = true,
    includeConstitution = false,
    includeChanges = false,
    all = false,
    specIds,
  } = options;

  if (!ExportFormatSchema.safeParse(format).success) {
    const pdfHint = (format as string) === 'pdf' ? ' PDF는 html로 내보낸 뒤 브라우저에서 PDF로 인쇄하세요.' : '';
    return {
      success: false,
      format,
      specsExported: 0,
      error: `지원하지 않는 형식: ${format} (${ExportFormatSchema.options.join(', ')} 중 선택).${pdfHint}`,
    };
  }

  try {
    // 스펙 로드
    let specs: ParsedSpec[] = [];

    if (all) {
      specs = await parseAllSpecs(projectRoot);
    } else if (specIds && specIds.length > 0) {
      for (const specId of specIds) {
        const resolved = await resolveSpec(path.join(projectRoot, '.sdd'), specId);
        if (!resolved.success) {
          return {
            success: false,
            format,
            specsExported: 0,
            error: resolved.error.message,
          };
        }
        const spec = await parseSpecById(projectRoot, resolved.data.id);
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
    const appendices = await collectAppendices(projectRoot, includeConstitution, includeChanges);

    // 형식별 변환
    let content: string;

    switch (format) {
      case 'html':
        content = generateHtml(specs, {
          theme,
          includeToc,
          appendices,
          title: specs.length === 1 ? specs[0].title : 'SDD 스펙 문서',
        });
        break;

      case 'json':
        content = generateJson(specs, { pretty: true, appendices });
        break;

      case 'markdown':
        content = generateMarkdown(specs, appendices);
        break;
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
  lines.push('=== SDD 내보내기 ===');
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

  return lines.join('\n');
}
