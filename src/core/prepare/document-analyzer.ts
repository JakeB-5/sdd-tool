/**
 * 문서 분석기
 * spec.md, plan.md, tasks.md 파일을 분석하여 키워드를 추출
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DetectionSource } from './schemas.js';
import { resolveSpec } from '../spec/locator.js';

/**
 * 분석 대상 문서 타입
 */
export type DocumentType = 'spec' | 'plan' | 'tasks';

/**
 * 문서 분석 결과
 */
export interface DocumentAnalysis {
  file: string;
  type: DocumentType;
  lines: AnalyzedLine[];
  taskCount: number;
}

/**
 * 분석된 라인
 */
export interface AnalyzedLine {
  lineNumber: number;
  content: string;
  keywords: string[];
}

/**
 * 문서 분석기 클래스
 */
export class DocumentAnalyzer {
  private sddDir: string;

  constructor(projectRoot: string) {
    this.sddDir = path.join(projectRoot, '.sdd');
  }

  /**
   * 기능 디렉토리의 모든 문서 분석
   */
  async analyzeFeature(featureName: string): Promise<DocumentAnalysis[]> {
    // Resolve <domain>/<feature>, bare feature or legacy id; fall back to the
    // literal directory for features that have no spec.md yet
    const resolved = await resolveSpec(this.sddDir, featureName);
    if (!resolved.success && resolved.error.reason === 'ambiguous') {
      throw resolved.error;
    }
    const featureDir = resolved.success
      ? resolved.data.dir
      : path.join(this.sddDir, 'specs', featureName);

    if (!fs.existsSync(featureDir)) {
      throw new Error(`기능 디렉토리를 찾을 수 없습니다: ${featureDir}`);
    }

    const results: DocumentAnalysis[] = [];

    // 분석 순서: tasks.md → plan.md → spec.md
    const documents: { file: string; type: DocumentType }[] = [
      { file: 'tasks.md', type: 'tasks' },
      { file: 'plan.md', type: 'plan' },
      { file: 'spec.md', type: 'spec' },
    ];

    for (const doc of documents) {
      const filePath = path.join(featureDir, doc.file);
      if (fs.existsSync(filePath)) {
        const analysis = await this.analyzeDocument(filePath, doc.type);
        results.push(analysis);
      }
    }

    return results;
  }

  /**
   * 단일 문서 분석
   */
  async analyzeDocument(filePath: string, type: DocumentType): Promise<DocumentAnalysis> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const analyzedLines: AnalyzedLine[] = [];
    let taskCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const keywords = this.extractKeywords(line);

      // 태스크 카운트 (체크박스 항목)
      if (/^[\s]*-\s*\[[\sx]\]/.test(line)) {
        taskCount++;
      }

      if (keywords.length > 0) {
        analyzedLines.push({
          lineNumber: i + 1,
          content: line.trim(),
          keywords,
        });
      }
    }

    return {
      file: filePath,
      type,
      lines: analyzedLines,
      taskCount,
    };
  }

  /**
   * 라인에서 키워드 추출
   */
  private extractKeywords(line: string): string[] {
    const keywords: string[] = [];
    const lowerLine = line.toLowerCase();

    // English terms use word boundaries ("rest" must not match "request", "test" not "latest");
    // Korean terms are matched as substrings since \b does not apply to Hangul.

    // 테스트 관련
    if (/\b(?:tests?|testing|vitest|jest)\b|unit\s*tests?\b|테스트/i.test(lowerLine)) {
      keywords.push('test');
    }

    // API 관련
    if (/\b(?:apis?|rest|restful|endpoints?|graphql)\b|엔드포인트/i.test(lowerLine)) {
      keywords.push('api');
    }

    // 컴포넌트 관련
    if (/\b(?:components?|react|vue|ui)\b|컴포넌트/i.test(lowerLine)) {
      keywords.push('component');
    }

    // 데이터베이스 관련
    if (/\b(?:db|databases?|prisma|migrations?)\b|마이그레이션|데이터베이스/i.test(lowerLine)) {
      keywords.push('database');
    }

    // 문서 관련
    if (/\b(?:docs?|readme|jsdoc|documentation)\b|문서|주석/i.test(lowerLine)) {
      keywords.push('doc');
    }

    // 타입 관련
    if (/\b(?:types?|schemas?|zod|typescript)\b|타입|스키마/i.test(lowerLine)) {
      keywords.push('type');
    }

    // 린트 관련
    if (/\b(?:lint|linting|linter|eslint|prettier|format|formatting|formatter)\b|포맷/i.test(lowerLine)) {
      keywords.push('lint');
    }

    // 리뷰 관련
    if (/\b(?:reviews?|reviewing)\b|리뷰|검증/i.test(lowerLine)) {
      keywords.push('review');
    }

    return [...new Set(keywords)];
  }

  /**
   * 분석 결과에서 DetectionSource 배열 생성
   */
  static toDetectionSources(analyses: DocumentAnalysis[]): DetectionSource[] {
    const sources: DetectionSource[] = [];

    for (const analysis of analyses) {
      for (const line of analysis.lines) {
        for (const keyword of line.keywords) {
          sources.push({
            file: path.basename(analysis.file),
            line: line.lineNumber,
            text: line.content,
            keyword,
          });
        }
      }
    }

    return sources;
  }

  /**
   * 전체 태스크 수 계산
   */
  static getTotalTaskCount(analyses: DocumentAnalysis[]): number {
    return analyses.reduce((sum, a) => sum + a.taskCount, 0);
  }
}
