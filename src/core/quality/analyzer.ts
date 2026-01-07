/**
 * 스펙 품질 분석기
 *
 * 스펙 파일의 품질을 분석하고 점수를 산출합니다.
 */
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { success, failure, Result } from '../../types/index.js';
import { ChangeError } from '../../errors/index.js';
import { directoryExists, fileExists, readFile } from '../../utils/fs.js';
import { parseSpec, ParsedSpec } from '../spec/index.js';

/**
 * 품질 점수 항목
 */
export interface QualityScoreItem {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  details: string[];
  suggestions: string[];
}

/**
 * 품질 분석 결과
 */
export interface QualityResult {
  specId: string;
  specPath: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  items: QualityScoreItem[];
  summary: string;
  topSuggestions: string[];
}

/**
 * 전체 프로젝트 품질 결과
 */
export interface ProjectQualityResult {
  averageScore: number;
  averagePercentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  totalSpecs: number;
  specResults: QualityResult[];
  summary: string;
}

/**
 * 점수를 등급으로 변환
 */
function getGrade(percentage: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

/**
 * RFC 2119 키워드 점수 산출 (10점)
 */
function scoreRfc2119(content: string): QualityScoreItem {
  const maxScore = 10;
  const details: string[] = [];
  const suggestions: string[] = [];

  const keywords = ['SHALL', 'MUST', 'SHOULD', 'MAY', 'SHALL NOT', 'MUST NOT', 'SHOULD NOT'];
  const found: string[] = [];

  for (const kw of keywords) {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      found.push(`${kw}: ${matches.length}개`);
    }
  }

  let score = 0;
  if (found.length > 0) {
    score = Math.min(maxScore, found.length * 2);
    details.push(`발견된 키워드: ${found.join(', ')}`);
  } else {
    details.push('RFC 2119 키워드가 발견되지 않음');
    suggestions.push('요구사항에 SHALL, MUST, SHOULD, MAY 키워드를 사용하세요');
  }

  return {
    name: 'RFC 2119 키워드',
    score,
    maxScore,
    percentage: (score / maxScore) * 100,
    details,
    suggestions,
  };
}

/**
 * GIVEN-WHEN-THEN 시나리오 점수 (20점)
 */
function scoreScenarios(content: string): QualityScoreItem {
  const maxScore = 20;
  const details: string[] = [];
  const suggestions: string[] = [];

  const givenCount = (content.match(/\*\*GIVEN\*\*|\bGIVEN\b/gi) || []).length;
  const whenCount = (content.match(/\*\*WHEN\*\*|\bWHEN\b/gi) || []).length;
  const thenCount = (content.match(/\*\*THEN\*\*|\bTHEN\b/gi) || []).length;

  const scenarioCount = Math.min(givenCount, whenCount, thenCount);

  let score = 0;
  if (scenarioCount > 0) {
    score = Math.min(maxScore, scenarioCount * 5);
    details.push(`완전한 시나리오: ${scenarioCount}개`);
    details.push(`GIVEN: ${givenCount}, WHEN: ${whenCount}, THEN: ${thenCount}`);
  } else {
    details.push('GIVEN-WHEN-THEN 시나리오가 없음');
    suggestions.push('최소 2개 이상의 GIVEN-WHEN-THEN 시나리오를 작성하세요');
  }

  if (scenarioCount < 2 && scenarioCount > 0) {
    suggestions.push('추가 시나리오 작성을 권장합니다 (최소 2개)');
  }

  return {
    name: 'GIVEN-WHEN-THEN 시나리오',
    score,
    maxScore,
    percentage: (score / maxScore) * 100,
    details,
    suggestions,
  };
}

/**
 * 요구사항 명확성 점수 (15점)
 */
function scoreRequirements(content: string): QualityScoreItem {
  const maxScore = 15;
  const details: string[] = [];
  const suggestions: string[] = [];

  // REQ-XX 형식의 요구사항 ID
  const reqIdPattern = /REQ-\d+|REQ-[A-Z]+-\d+/gi;
  const reqIds = content.match(reqIdPattern) || [];

  // ## 요구사항 섹션 존재
  const hasRequirementsSection = /^##\s*(요구사항|Requirements)/im.test(content);

  let score = 0;

  if (hasRequirementsSection) {
    score += 5;
    details.push('요구사항 섹션이 존재함');
  } else {
    suggestions.push('## 요구사항 섹션을 추가하세요');
  }

  if (reqIds.length > 0) {
    score += Math.min(10, reqIds.length * 2);
    details.push(`요구사항 ID: ${reqIds.length}개 (${[...new Set(reqIds)].slice(0, 3).join(', ')}...)`);
  } else {
    suggestions.push('요구사항에 REQ-01 형식의 ID를 부여하세요');
  }

  return {
    name: '요구사항 명확성',
    score,
    maxScore,
    percentage: (score / maxScore) * 100,
    details,
    suggestions,
  };
}

/**
 * 의존성 명시 점수 (10점)
 */
function scoreDependencies(spec: ParsedSpec): QualityScoreItem {
  const maxScore = 10;
  const details: string[] = [];
  const suggestions: string[] = [];

  let score = 0;

  if (spec.metadata.depends) {
    const deps = Array.isArray(spec.metadata.depends)
      ? spec.metadata.depends
      : [spec.metadata.depends];

    if (deps.length > 0 && deps[0] !== null) {
      score = maxScore;
      details.push(`의존성: ${deps.join(', ')}`);
    } else {
      score = 5; // null로 명시적 선언
      details.push('의존성 없음 (명시적 선언)');
    }
  } else {
    score = 5; // depends 필드가 없으면 기본 점수
    details.push('의존성 필드 없음 (암시적 없음)');
  }

  return {
    name: '의존성 명시',
    score,
    maxScore,
    percentage: (score / maxScore) * 100,
    details,
    suggestions,
  };
}

/**
 * 문서 구조 점수 (15점)
 */
function scoreStructure(content: string): QualityScoreItem {
  const maxScore = 15;
  const details: string[] = [];
  const suggestions: string[] = [];

  const requiredSections = [
    { pattern: /^#\s+.+/m, name: '제목 (H1)' },
    { pattern: /^##\s*(요구사항|Requirements)/im, name: '요구사항 섹션' },
    { pattern: /^##\s*(시나리오|Scenario)/im, name: '시나리오 섹션' },
  ];

  const optionalSections = [
    { pattern: /^##\s*(개요|Overview|설명|Description)/im, name: '개요/설명 섹션' },
    { pattern: /^##\s*(제약|Constraints|제한)/im, name: '제약사항 섹션' },
    { pattern: /^##\s*(비고|Notes|참고)/im, name: '비고 섹션' },
  ];

  let score = 0;
  const foundRequired: string[] = [];
  const missingRequired: string[] = [];

  for (const section of requiredSections) {
    if (section.pattern.test(content)) {
      foundRequired.push(section.name);
      score += 4;
    } else {
      missingRequired.push(section.name);
    }
  }

  for (const section of optionalSections) {
    if (section.pattern.test(content)) {
      score += 1;
    }
  }

  score = Math.min(maxScore, score);

  if (foundRequired.length > 0) {
    details.push(`필수 섹션: ${foundRequired.join(', ')}`);
  }
  if (missingRequired.length > 0) {
    suggestions.push(`누락된 섹션: ${missingRequired.join(', ')}`);
  }

  return {
    name: '문서 구조',
    score,
    maxScore,
    percentage: (score / maxScore) * 100,
    details,
    suggestions,
  };
}

/**
 * Constitution 준수 점수 (10점)
 */
function scoreConstitution(spec: ParsedSpec, hasConstitution: boolean): QualityScoreItem {
  const maxScore = 10;
  const details: string[] = [];
  const suggestions: string[] = [];

  let score = 0;

  if (!hasConstitution) {
    score = maxScore; // Constitution이 없으면 만점
    details.push('Constitution 미설정 (검사 생략)');
  } else if (spec.metadata.constitution_version) {
    score = maxScore;
    details.push(`Constitution 버전: ${spec.metadata.constitution_version}`);
  } else {
    details.push('constitution_version 필드 없음');
    suggestions.push('frontmatter에 constitution_version을 추가하세요');
  }

  return {
    name: 'Constitution 준수',
    score,
    maxScore,
    percentage: (score / maxScore) * 100,
    details,
    suggestions,
  };
}

/**
 * 참조 링크 점수 (10점)
 */
function scoreLinks(content: string): QualityScoreItem {
  const maxScore = 10;
  const details: string[] = [];
  const suggestions: string[] = [];

  // 마크다운 링크 패턴
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [...content.matchAll(linkPattern)];

  let score = 5; // 기본 점수

  if (links.length > 0) {
    score = Math.min(maxScore, 5 + links.length);
    details.push(`링크: ${links.length}개`);
  } else {
    details.push('링크 없음');
    suggestions.push('관련 문서나 외부 참조 링크를 추가하면 좋습니다');
  }

  return {
    name: '참조 링크',
    score,
    maxScore,
    percentage: (score / maxScore) * 100,
    details,
    suggestions,
  };
}

/**
 * 메타데이터 완성도 점수 (10점)
 */
function scoreMetadata(spec: ParsedSpec): QualityScoreItem {
  const maxScore = 10;
  const details: string[] = [];
  const suggestions: string[] = [];

  const requiredFields = ['id', 'title', 'status'];
  const optionalFields = ['created', 'updated', 'author', 'version'];

  let score = 0;
  const missingRequired: string[] = [];

  for (const field of requiredFields) {
    if ((spec.metadata as Record<string, unknown>)[field]) {
      score += 2;
    } else {
      missingRequired.push(field);
    }
  }

  for (const field of optionalFields) {
    if ((spec.metadata as Record<string, unknown>)[field]) {
      score += 1;
    }
  }

  score = Math.min(maxScore, score);

  const presentFields = Object.keys(spec.metadata).filter(
    (k) => (spec.metadata as Record<string, unknown>)[k] !== null && (spec.metadata as Record<string, unknown>)[k] !== undefined
  );
  details.push(`메타데이터 필드: ${presentFields.length}개`);

  if (missingRequired.length > 0) {
    suggestions.push(`필수 필드 누락: ${missingRequired.join(', ')}`);
  }

  return {
    name: '메타데이터 완성도',
    score,
    maxScore,
    percentage: (score / maxScore) * 100,
    details,
    suggestions,
  };
}

/**
 * 단일 스펙 품질 분석
 */
export async function analyzeSpecQuality(
  specPath: string,
  sddPath: string
): Promise<Result<QualityResult, ChangeError>> {
  try {
    if (!(await fileExists(specPath))) {
      return failure(new ChangeError(`스펙 파일을 찾을 수 없습니다: ${specPath}`));
    }

    const contentResult = await readFile(specPath);
    if (!contentResult.success) {
      return failure(new ChangeError('스펙 파일을 읽을 수 없습니다.'));
    }

    const content = contentResult.data;
    const parseResult = parseSpec(content);
    if (!parseResult.success) {
      return failure(new ChangeError(`스펙 파싱 실패: ${parseResult.error.message}`));
    }

    const spec = parseResult.data;

    // Constitution 존재 여부 확인
    const constitutionPath = path.join(sddPath, 'constitution.md');
    const hasConstitution = await fileExists(constitutionPath);

    // 각 항목 점수 산출
    const items: QualityScoreItem[] = [
      scoreRfc2119(content),
      scoreScenarios(content),
      scoreRequirements(content),
      scoreDependencies(spec),
      scoreStructure(content),
      scoreConstitution(spec, hasConstitution),
      scoreLinks(content),
      scoreMetadata(spec),
    ];

    // 총점 계산
    const totalScore = items.reduce((sum, item) => sum + item.score, 0);
    const maxScore = items.reduce((sum, item) => sum + item.maxScore, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);
    const grade = getGrade(percentage);

    // 상위 제안 추출
    const topSuggestions = items
      .filter((item) => item.suggestions.length > 0)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3)
      .flatMap((item) => item.suggestions);

    const specId = spec.metadata.id || path.basename(path.dirname(specPath));

    const summary = `스펙 '${specId}'의 품질 점수: ${totalScore}/${maxScore} (${percentage}%, 등급: ${grade})`;

    return success({
      specId,
      specPath,
      totalScore,
      maxScore,
      percentage,
      grade,
      items,
      summary,
      topSuggestions,
    });
  } catch (error) {
    return failure(
      new ChangeError(
        `품질 분석 실패: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * 전체 프로젝트 품질 분석
 */
export async function analyzeProjectQuality(
  sddPath: string
): Promise<Result<ProjectQualityResult, ChangeError>> {
  try {
    const specsPath = path.join(sddPath, 'specs');

    if (!(await directoryExists(specsPath))) {
      return failure(new ChangeError('스펙 디렉토리를 찾을 수 없습니다.'));
    }

    // 모든 spec.md 파일 찾기
    const specFiles: string[] = [];
    await findSpecFiles(specsPath, specFiles);

    if (specFiles.length === 0) {
      return failure(new ChangeError('스펙 파일이 없습니다.'));
    }

    // 각 스펙 분석
    const specResults: QualityResult[] = [];
    for (const specFile of specFiles) {
      const result = await analyzeSpecQuality(specFile, sddPath);
      if (result.success) {
        specResults.push(result.data);
      }
    }

    if (specResults.length === 0) {
      return failure(new ChangeError('분석 가능한 스펙이 없습니다.'));
    }

    // 평균 점수 계산
    const totalPercentage = specResults.reduce((sum, r) => sum + r.percentage, 0);
    const averagePercentage = Math.round(totalPercentage / specResults.length);
    const averageScore = Math.round(
      specResults.reduce((sum, r) => sum + r.totalScore, 0) / specResults.length
    );
    const grade = getGrade(averagePercentage);

    const summary = `프로젝트 품질: 평균 ${averagePercentage}% (등급: ${grade}), ${specResults.length}개 스펙 분석`;

    return success({
      averageScore,
      averagePercentage,
      grade,
      totalSpecs: specResults.length,
      specResults,
      summary,
    });
  } catch (error) {
    return failure(
      new ChangeError(
        `프로젝트 품질 분석 실패: ${error instanceof Error ? error.message : String(error)}`
      )
    );
  }
}

/**
 * spec.md 파일 재귀 검색
 */
async function findSpecFiles(dir: string, files: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await findSpecFiles(fullPath, files);
    } else if (entry.name === 'spec.md') {
      files.push(fullPath);
    }
  }
}

/**
 * 품질 결과 포맷팅
 */
export function formatQualityResult(result: QualityResult): string {
  const lines: string[] = [];

  const gradeIcon = result.grade === 'A' ? '🏆' :
                    result.grade === 'B' ? '✅' :
                    result.grade === 'C' ? '🟡' :
                    result.grade === 'D' ? '🟠' : '🔴';

  lines.push(`📊 품질 분석: ${result.specId}`);
  lines.push(`   ${gradeIcon} 등급: ${result.grade} (${result.percentage}%)`);
  lines.push(`   📈 점수: ${result.totalScore}/${result.maxScore}`);
  lines.push('');

  lines.push('📋 항목별 점수:');
  for (const item of result.items) {
    const icon = item.percentage >= 80 ? '✅' :
                 item.percentage >= 60 ? '🟡' : '🔴';
    lines.push(`   ${icon} ${item.name}: ${item.score}/${item.maxScore} (${Math.round(item.percentage)}%)`);

    for (const detail of item.details) {
      lines.push(`      └─ ${detail}`);
    }
  }
  lines.push('');

  if (result.topSuggestions.length > 0) {
    lines.push('💡 개선 제안:');
    for (const suggestion of result.topSuggestions) {
      lines.push(`   - ${suggestion}`);
    }
  }

  return lines.join('\n');
}

/**
 * 프로젝트 품질 결과 포맷팅
 */
export function formatProjectQualityResult(result: ProjectQualityResult): string {
  const lines: string[] = [];

  const gradeIcon = result.grade === 'A' ? '🏆' :
                    result.grade === 'B' ? '✅' :
                    result.grade === 'C' ? '🟡' :
                    result.grade === 'D' ? '🟠' : '🔴';

  lines.push('📊 프로젝트 품질 분석');
  lines.push(`   ${gradeIcon} 평균 등급: ${result.grade} (${result.averagePercentage}%)`);
  lines.push(`   📈 분석된 스펙: ${result.totalSpecs}개`);
  lines.push('');

  // 등급별 분포
  const gradeCount = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const spec of result.specResults) {
    gradeCount[spec.grade]++;
  }

  lines.push('📈 등급 분포:');
  if (gradeCount.A > 0) lines.push(`   🏆 A: ${gradeCount.A}개`);
  if (gradeCount.B > 0) lines.push(`   ✅ B: ${gradeCount.B}개`);
  if (gradeCount.C > 0) lines.push(`   🟡 C: ${gradeCount.C}개`);
  if (gradeCount.D > 0) lines.push(`   🟠 D: ${gradeCount.D}개`);
  if (gradeCount.F > 0) lines.push(`   🔴 F: ${gradeCount.F}개`);
  lines.push('');

  // 스펙별 요약
  lines.push('📋 스펙별 점수:');
  const sortedSpecs = [...result.specResults].sort((a, b) => b.percentage - a.percentage);
  for (const spec of sortedSpecs) {
    const icon = spec.grade === 'A' ? '🏆' :
                 spec.grade === 'B' ? '✅' :
                 spec.grade === 'C' ? '🟡' :
                 spec.grade === 'D' ? '🟠' : '🔴';
    lines.push(`   ${icon} ${spec.specId}: ${spec.percentage}% (${spec.grade})`);
  }

  return lines.join('\n');
}
