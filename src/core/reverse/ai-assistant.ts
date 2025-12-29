/**
 * AI 어시스턴트 모듈
 *
 * AI 기반 리뷰 지원 기능을 제공합니다.
 */

import { Result, success, failure } from '../../types/index.js';
import type { ExtractedSpec, ExtractedScenario, ExtractedContract } from './spec-generator.js';

/**
 * AI 제안 타입
 */
export type SuggestionType =
  | 'improvement'
  | 'clarification'
  | 'alternative'
  | 'warning'
  | 'question';

/**
 * AI 제안
 */
export interface AISuggestion {
  /** 제안 ID */
  id: string;
  /** 제안 타입 */
  type: SuggestionType;
  /** 대상 섹션 */
  section: 'name' | 'description' | 'scenario' | 'contract' | 'general';
  /** 대상 인덱스 (시나리오/계약의 경우) */
  targetIndex?: number;
  /** 제안 내용 */
  message: string;
  /** 제안된 변경 사항 */
  suggestedChange?: unknown;
  /** 신뢰도 */
  confidence: number;
  /** 적용 여부 */
  applied: boolean;
}

/**
 * 리뷰 질문
 */
export interface ReviewQuestion {
  /** 질문 ID */
  id: string;
  /** 질문 내용 */
  question: string;
  /** 대상 섹션 */
  section: string;
  /** 질문 이유 */
  reason: string;
  /** 제안 답변 */
  suggestedAnswers?: string[];
  /** 답변 */
  answer?: string;
  /** 답변 시간 */
  answeredAt?: Date;
}

/**
 * AI 분석 결과
 */
export interface AIAnalysisResult {
  /** 전체 품질 점수 */
  qualityScore: number;
  /** 완성도 점수 */
  completenessScore: number;
  /** 명확성 점수 */
  clarityScore: number;
  /** 제안 목록 */
  suggestions: AISuggestion[];
  /** 질문 목록 */
  questions: ReviewQuestion[];
  /** 요약 */
  summary: string;
}

/**
 * AI 어시스턴트 클래스
 */
export class AIAssistant {
  private suggestions: Map<string, AISuggestion[]> = new Map();
  private questions: Map<string, ReviewQuestion[]> = new Map();

  /**
   * 스펙 분석
   */
  async analyzeSpec(spec: ExtractedSpec): Promise<Result<AIAnalysisResult, Error>> {
    try {
      const suggestions: AISuggestion[] = [];
      const questions: ReviewQuestion[] = [];

      // 이름 분석
      this.analyzeSpecName(spec, suggestions);

      // 설명 분석
      this.analyzeDescription(spec, suggestions, questions);

      // 시나리오 분석
      this.analyzeScenarios(spec, suggestions, questions);

      // 계약 분석
      this.analyzeContracts(spec, suggestions, questions);

      // 관계 분석
      this.analyzeRelations(spec, suggestions);

      // 점수 계산
      const qualityScore = this.calculateQualityScore(spec, suggestions);
      const completenessScore = this.calculateCompletenessScore(spec);
      const clarityScore = this.calculateClarityScore(spec);

      // 저장
      this.suggestions.set(spec.id, suggestions);
      this.questions.set(spec.id, questions);

      // 요약 생성
      const summary = this.generateSummary(spec, suggestions, questions);

      return success({
        qualityScore,
        completenessScore,
        clarityScore,
        suggestions,
        questions,
        summary,
      });
    } catch (error) {
      return failure(new Error(`스펙 분석 실패: ${error}`));
    }
  }

  /**
   * 이름 분석
   */
  private analyzeSpecName(spec: ExtractedSpec, suggestions: AISuggestion[]): void {
    const name = spec.name;

    // 너무 짧은 이름
    if (name.length < 3) {
      suggestions.push({
        id: `name-too-short-${Date.now()}`,
        type: 'improvement',
        section: 'name',
        message: '스펙 이름이 너무 짧습니다. 더 구체적인 이름을 사용하세요.',
        confidence: 90,
        applied: false,
      });
    }

    // 너무 긴 이름
    if (name.length > 50) {
      suggestions.push({
        id: `name-too-long-${Date.now()}`,
        type: 'improvement',
        section: 'name',
        message: '스펙 이름이 너무 깁니다. 간결하게 줄이세요.',
        confidence: 80,
        applied: false,
      });
    }

    // 일반적인 이름 패턴
    const genericNames = ['handler', 'manager', 'helper', 'util', 'service'];
    if (genericNames.some(g => name.toLowerCase() === g)) {
      suggestions.push({
        id: `name-too-generic-${Date.now()}`,
        type: 'improvement',
        section: 'name',
        message: `"${name}"은(는) 너무 일반적인 이름입니다. 구체적인 기능을 나타내는 이름을 사용하세요.`,
        confidence: 85,
        applied: false,
      });
    }
  }

  /**
   * 설명 분석
   */
  private analyzeDescription(
    spec: ExtractedSpec,
    suggestions: AISuggestion[],
    questions: ReviewQuestion[]
  ): void {
    const desc = spec.description;

    // 설명이 없거나 짧음
    if (!desc || desc.length < 20) {
      suggestions.push({
        id: `desc-too-short-${Date.now()}`,
        type: 'improvement',
        section: 'description',
        message: '설명이 너무 짧습니다. 스펙의 목적과 동작을 자세히 설명하세요.',
        confidence: 95,
        applied: false,
      });

      questions.push({
        id: `q-desc-${Date.now()}`,
        question: '이 기능의 주요 목적과 예상 사용 시나리오는 무엇인가요?',
        section: 'description',
        reason: '설명이 불충분하여 추가 정보가 필요합니다.',
      });
    }

    // 비즈니스 목적 누락
    if (desc && !this.hasBusinessPurpose(desc)) {
      suggestions.push({
        id: `desc-no-purpose-${Date.now()}`,
        type: 'clarification',
        section: 'description',
        message: '설명에 비즈니스 목적이 명확하지 않습니다. "왜" 이 기능이 필요한지 설명을 추가하세요.',
        confidence: 75,
        applied: false,
      });
    }
  }

  /**
   * 비즈니스 목적 포함 여부
   */
  private hasBusinessPurpose(description: string): boolean {
    const purposeIndicators = [
      '목적',
      '위해',
      '필요',
      'purpose',
      'to enable',
      'allows',
      'provides',
      '기능',
      '서비스',
    ];
    const lowerDesc = description.toLowerCase();
    return purposeIndicators.some(ind => lowerDesc.includes(ind));
  }

  /**
   * 시나리오 분석
   */
  private analyzeScenarios(
    spec: ExtractedSpec,
    suggestions: AISuggestion[],
    questions: ReviewQuestion[]
  ): void {
    // 시나리오가 없음
    if (spec.scenarios.length === 0) {
      suggestions.push({
        id: `no-scenarios-${Date.now()}`,
        type: 'warning',
        section: 'scenario',
        message: '시나리오가 없습니다. 최소 하나의 시나리오를 추가하세요.',
        confidence: 100,
        applied: false,
      });
      return;
    }

    // 각 시나리오 분석
    spec.scenarios.forEach((scenario, index) => {
      // 추론된 시나리오에 대한 검토 요청
      if (scenario.inferred) {
        questions.push({
          id: `q-scenario-${index}-${Date.now()}`,
          question: `시나리오 "${scenario.name}"이(가) 올바른가요? 수정이 필요한가요?`,
          section: 'scenario',
          reason: 'AI가 추론한 시나리오입니다.',
          suggestedAnswers: ['맞습니다', '수정이 필요합니다', '삭제해야 합니다'],
        });
      }

      // 시나리오 구성 요소 검증
      this.validateScenarioComponent(scenario, index, 'given', suggestions);
      this.validateScenarioComponent(scenario, index, 'when', suggestions);
      this.validateScenarioComponent(scenario, index, 'then', suggestions);
    });

    // 에러 시나리오 누락
    if (!this.hasErrorScenario(spec.scenarios)) {
      suggestions.push({
        id: `no-error-scenario-${Date.now()}`,
        type: 'improvement',
        section: 'scenario',
        message: '에러 처리 시나리오가 없습니다. 실패 케이스를 추가하는 것이 좋습니다.',
        suggestedChange: {
          name: '입력 검증 실패',
          given: '유효하지 않은 입력이 주어졌을 때',
          when: '기능이 실행되면',
          then: '적절한 에러 메시지가 반환되어야 한다',
          inferred: true,
        },
        confidence: 70,
        applied: false,
      });
    }

    // 경계 조건 시나리오 누락
    if (spec.scenarios.length < 3) {
      suggestions.push({
        id: `few-scenarios-${Date.now()}`,
        type: 'improvement',
        section: 'scenario',
        message: '시나리오가 적습니다. 경계 조건과 예외 케이스를 추가하세요.',
        confidence: 60,
        applied: false,
      });
    }
  }

  /**
   * 시나리오 구성 요소 검증
   */
  private validateScenarioComponent(
    scenario: ExtractedScenario,
    index: number,
    component: 'given' | 'when' | 'then',
    suggestions: AISuggestion[]
  ): void {
    const value = scenario[component];

    if (!value || value.length < 5) {
      suggestions.push({
        id: `scenario-${component}-${index}-${Date.now()}`,
        type: 'improvement',
        section: 'scenario',
        targetIndex: index,
        message: `시나리오 "${scenario.name}"의 ${component.toUpperCase()} 절이 불충분합니다.`,
        confidence: 85,
        applied: false,
      });
    }
  }

  /**
   * 에러 시나리오 포함 여부
   */
  private hasErrorScenario(scenarios: ExtractedScenario[]): boolean {
    const errorIndicators = ['에러', '오류', '실패', 'error', 'fail', 'invalid', 'exception'];
    return scenarios.some(s => {
      const text = `${s.name} ${s.given} ${s.when} ${s.then}`.toLowerCase();
      return errorIndicators.some(ind => text.includes(ind));
    });
  }

  /**
   * 계약 분석
   */
  private analyzeContracts(
    spec: ExtractedSpec,
    suggestions: AISuggestion[],
    questions: ReviewQuestion[]
  ): void {
    const inputContracts = spec.contracts.filter(c => c.type === 'input');
    const outputContracts = spec.contracts.filter(c => c.type === 'output');

    // 입력 계약이 없음
    if (inputContracts.length === 0) {
      suggestions.push({
        id: `no-input-contract-${Date.now()}`,
        type: 'warning',
        section: 'contract',
        message: '입력 계약이 정의되지 않았습니다. 입력 파라미터를 명시하세요.',
        confidence: 80,
        applied: false,
      });
    }

    // 출력 계약이 없음
    if (outputContracts.length === 0) {
      suggestions.push({
        id: `no-output-contract-${Date.now()}`,
        type: 'warning',
        section: 'contract',
        message: '출력 계약이 정의되지 않았습니다. 반환 값을 명시하세요.',
        confidence: 80,
        applied: false,
      });
    }

    // 추론된 계약 검토 요청
    spec.contracts.forEach((contract, index) => {
      if (contract.inferred) {
        questions.push({
          id: `q-contract-${index}-${Date.now()}`,
          question: `계약 "${contract.description}"이(가) 정확한가요?`,
          section: 'contract',
          reason: 'AI가 추론한 계약입니다.',
          suggestedAnswers: ['맞습니다', '수정이 필요합니다', '삭제해야 합니다'],
        });
      }
    });
  }

  /**
   * 관계 분석
   */
  private analyzeRelations(spec: ExtractedSpec, suggestions: AISuggestion[]): void {
    // 관련 스펙이 없으면 제안
    if (spec.relatedSpecs.length === 0) {
      suggestions.push({
        id: `no-related-specs-${Date.now()}`,
        type: 'improvement',
        section: 'general',
        message: '관련 스펙이 없습니다. 의존하거나 연관된 스펙을 연결하세요.',
        confidence: 50,
        applied: false,
      });
    }
  }

  /**
   * 품질 점수 계산
   */
  private calculateQualityScore(spec: ExtractedSpec, suggestions: AISuggestion[]): number {
    let score = 100;

    // 제안당 감점
    const warningCount = suggestions.filter(s => s.type === 'warning').length;
    const improvementCount = suggestions.filter(s => s.type === 'improvement').length;

    score -= warningCount * 10;
    score -= improvementCount * 5;

    // 기본 점수 보너스
    if (spec.description && spec.description.length > 50) score += 5;
    if (spec.scenarios.length >= 3) score += 5;
    if (spec.contracts.length >= 2) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 완성도 점수 계산
   */
  private calculateCompletenessScore(spec: ExtractedSpec): number {
    let score = 0;
    const maxScore = 100;
    const items = 5;
    const perItem = maxScore / items;

    // 이름
    if (spec.name && spec.name.length >= 3) score += perItem;

    // 설명
    if (spec.description && spec.description.length >= 20) score += perItem;

    // 시나리오
    if (spec.scenarios.length >= 1) score += perItem;

    // 계약
    if (spec.contracts.length >= 1) score += perItem;

    // 도메인
    if (spec.domain) score += perItem;

    return Math.round(score);
  }

  /**
   * 명확성 점수 계산
   */
  private calculateClarityScore(spec: ExtractedSpec): number {
    let score = 100;

    // 추론된 항목 감점
    const inferredScenarios = spec.scenarios.filter(s => s.inferred).length;
    const inferredContracts = spec.contracts.filter(c => c.inferred).length;

    score -= inferredScenarios * 5;
    score -= inferredContracts * 5;

    // 불명확한 설명 감점
    if (spec.description && spec.description.includes('[INFERRED]')) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  /**
   * 요약 생성
   */
  private generateSummary(
    spec: ExtractedSpec,
    suggestions: AISuggestion[],
    questions: ReviewQuestion[]
  ): string {
    const warningCount = suggestions.filter(s => s.type === 'warning').length;
    const improvementCount = suggestions.filter(s => s.type === 'improvement').length;

    let summary = `스펙 "${spec.name}" 분석 완료.\n`;

    if (warningCount > 0) {
      summary += `⚠️ ${warningCount}개의 경고가 있습니다.\n`;
    }

    if (improvementCount > 0) {
      summary += `💡 ${improvementCount}개의 개선 제안이 있습니다.\n`;
    }

    if (questions.length > 0) {
      summary += `❓ ${questions.length}개의 질문이 있습니다.\n`;
    }

    if (warningCount === 0 && improvementCount === 0) {
      summary += '✅ 스펙 품질이 양호합니다.\n';
    }

    return summary;
  }

  /**
   * 제안 적용
   */
  applySuggestion(specId: string, suggestionId: string): Result<void, Error> {
    const suggestions = this.suggestions.get(specId);
    if (!suggestions) {
      return failure(new Error('스펙을 찾을 수 없습니다'));
    }

    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) {
      return failure(new Error('제안을 찾을 수 없습니다'));
    }

    suggestion.applied = true;
    return success(undefined);
  }

  /**
   * 질문 답변
   */
  answerQuestion(
    specId: string,
    questionId: string,
    answer: string
  ): Result<void, Error> {
    const questions = this.questions.get(specId);
    if (!questions) {
      return failure(new Error('스펙을 찾을 수 없습니다'));
    }

    const question = questions.find(q => q.id === questionId);
    if (!question) {
      return failure(new Error('질문을 찾을 수 없습니다'));
    }

    question.answer = answer;
    question.answeredAt = new Date();
    return success(undefined);
  }

  /**
   * 미답변 질문 가져오기
   */
  getUnansweredQuestions(specId: string): ReviewQuestion[] {
    const questions = this.questions.get(specId) || [];
    return questions.filter(q => !q.answer);
  }

  /**
   * 미적용 제안 가져오기
   */
  getUnappliedSuggestions(specId: string): AISuggestion[] {
    const suggestions = this.suggestions.get(specId) || [];
    return suggestions.filter(s => !s.applied);
  }
}

/**
 * 전역 AI 어시스턴트 인스턴스
 */
export const aiAssistant = new AIAssistant();

/**
 * AI 분석 결과 포맷팅
 */
export function formatAIAnalysis(result: AIAnalysisResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('🤖 AI 분석 결과');
  lines.push('═'.repeat(50));
  lines.push('');

  // 점수
  lines.push('📊 점수');
  lines.push(`  품질: ${result.qualityScore}%`);
  lines.push(`  완성도: ${result.completenessScore}%`);
  lines.push(`  명확성: ${result.clarityScore}%`);
  lines.push('');

  // 제안
  if (result.suggestions.length > 0) {
    lines.push('💡 제안');
    for (const suggestion of result.suggestions) {
      const icon = suggestion.type === 'warning' ? '⚠️' : '💡';
      lines.push(`  ${icon} ${suggestion.message}`);
    }
    lines.push('');
  }

  // 질문
  if (result.questions.length > 0) {
    lines.push('❓ 검토 질문');
    for (const question of result.questions) {
      lines.push(`  • ${question.question}`);
      lines.push(`    (${question.reason})`);
    }
    lines.push('');
  }

  // 요약
  lines.push('📝 요약');
  lines.push(result.summary);

  return lines.join('\n');
}
