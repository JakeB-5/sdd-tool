/**
 * 문서 분석기
 * spec.md, plan.md, tasks.md 파일을 분석하여 키워드를 추출
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DetectionSource } from './schemas.js';

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
    const featureDir = path.join(this.sddDir, 'specs', featureName);

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

    // 테스트 관련
    if (/test|테스트|vitest|jest|단위\s*테스트|unit\s*test/i.test(lowerLine)) {
      keywords.push('test');
    }

    // API 관련
    if (/\bapi\b|rest|endpoint|엔드포인트|graphql/i.test(lowerLine)) {
      keywords.push('api');
    }

    // 컴포넌트 관련
    if (/component|컴포넌트|\breact\b|\bvue\b|\bui\b/i.test(lowerLine)) {
      keywords.push('component');
    }

    // 데이터베이스 관련
    if (/\bdb\b|database|prisma|migration|마이그레이션|데이터베이스/i.test(lowerLine)) {
      keywords.push('database');
    }

    // 문서 관련
    if (/\bdoc\b|문서|readme|jsdoc|주석|documentation/i.test(lowerLine)) {
      keywords.push('doc');
    }

    // 타입 관련
    if (/\btype\b|타입|schema|스키마|\bzod\b|typescript/i.test(lowerLine)) {
      keywords.push('type');
    }

    // 린트 관련
    if (/lint|eslint|prettier|포맷|format/i.test(lowerLine)) {
      keywords.push('lint');
    }

    // 리뷰 관련
    if (/review|리뷰|검증|code\s*review|코드\s*리뷰/i.test(lowerLine)) {
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
