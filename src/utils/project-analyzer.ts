/**
 * 프로젝트 구조 분석 유틸리티
 *
 * 프로젝트 타입, Git 상태, CI/CD 설정 여부 등을 감지합니다.
 */
import path from 'node:path';
import { fileExists, directoryExists } from './fs.js';

/**
 * 프로젝트 분석 결과
 */
export interface ProjectAnalysis {
  /** Git 저장소 여부 */
  isGitRepo: boolean;
  /** Git hooks 설치 여부 */
  hasGitHooks: boolean;
  /** 커밋 메시지 템플릿 존재 여부 */
  hasGitMessageTemplate: boolean;
  /** GitHub Actions 설정 여부 */
  hasGitHubActions: boolean;
  /** GitLab CI 설정 여부 */
  hasGitLabCI: boolean;
  /** SDD 프로젝트 초기화 여부 */
  isSddProject: boolean;
  /** Node.js 프로젝트 여부 */
  isNodeProject: boolean;
  /** TypeScript 프로젝트 여부 */
  isTypeScriptProject: boolean;
  /** SDD 검증 워크플로우 존재 여부 */
  hasSddValidateWorkflow: boolean;
  /** SDD 라벨러 워크플로우 존재 여부 */
  hasSddLabelerWorkflow: boolean;
}

/**
 * 설정 제안
 */
export interface SetupSuggestions {
  /** Git Hooks 설치 제안 */
  suggestGitHooks: boolean;
  /** 커밋 템플릿 설치 제안 */
  suggestGitTemplate: boolean;
  /** GitHub Actions 설정 제안 */
  suggestGitHubActions: boolean;
  /** GitLab CI 설정 제안 */
  suggestGitLabCI: boolean;
  /** 제안 사유 */
  reasons: string[];
}

/**
 * 프로젝트 구조 분석
 */
export async function analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
  const [
    isGitRepo,
    hasPreCommitHook,
    hasCommitMsgHook,
    hasPrePushHook,
    hasGitMessageTemplate,
    hasGitHubWorkflows,
    hasGitLabCI,
    isSddProject,
    isNodeProject,
    isTypeScriptProject,
    hasSddValidateWorkflow,
    hasSddLabelerWorkflow,
  ] = await Promise.all([
    directoryExists(path.join(projectPath, '.git')),
    fileExists(path.join(projectPath, '.git', 'hooks', 'pre-commit')),
    fileExists(path.join(projectPath, '.git', 'hooks', 'commit-msg')),
    fileExists(path.join(projectPath, '.git', 'hooks', 'pre-push')),
    fileExists(path.join(projectPath, '.gitmessage')),
    directoryExists(path.join(projectPath, '.github', 'workflows')),
    fileExists(path.join(projectPath, '.gitlab-ci.yml')).then(exists =>
      exists || fileExists(path.join(projectPath, '.gitlab-ci-sdd.yml'))
    ),
    directoryExists(path.join(projectPath, '.sdd')),
    fileExists(path.join(projectPath, 'package.json')),
    fileExists(path.join(projectPath, 'tsconfig.json')),
    fileExists(path.join(projectPath, '.github', 'workflows', 'sdd-validate.yml')),
    fileExists(path.join(projectPath, '.github', 'workflows', 'sdd-labeler.yml')),
  ]);

  return {
    isGitRepo,
    hasGitHooks: hasPreCommitHook && hasCommitMsgHook && hasPrePushHook,
    hasGitMessageTemplate,
    hasGitHubActions: hasGitHubWorkflows,
    hasGitLabCI,
    isSddProject,
    isNodeProject,
    isTypeScriptProject,
    hasSddValidateWorkflow,
    hasSddLabelerWorkflow,
  };
}

/**
 * 설정 제안 생성
 */
export function generateSuggestions(analysis: ProjectAnalysis): SetupSuggestions {
  const suggestions: SetupSuggestions = {
    suggestGitHooks: false,
    suggestGitTemplate: false,
    suggestGitHubActions: false,
    suggestGitLabCI: false,
    reasons: [],
  };

  // Git 저장소가 아니면 제안하지 않음
  if (!analysis.isGitRepo) {
    suggestions.reasons.push('Git 저장소가 아닙니다. git init 후 다시 시도하세요.');
    return suggestions;
  }

  // Git Hooks 제안
  if (!analysis.hasGitHooks) {
    suggestions.suggestGitHooks = true;
    suggestions.reasons.push('Git Hooks가 설치되지 않았습니다. 커밋/푸시 시 자동 검증을 활성화할 수 있습니다.');
  }

  // 커밋 템플릿 제안
  if (!analysis.hasGitMessageTemplate) {
    suggestions.suggestGitTemplate = true;
    suggestions.reasons.push('커밋 메시지 템플릿이 없습니다. 일관된 커밋 형식을 사용할 수 있습니다.');
  }

  // GitHub Actions 제안
  if (analysis.hasGitHubActions && !analysis.hasSddValidateWorkflow) {
    suggestions.suggestGitHubActions = true;
    suggestions.reasons.push('.github/workflows가 존재하지만 SDD 검증 워크플로우가 없습니다.');
  } else if (!analysis.hasGitHubActions && !analysis.hasGitLabCI) {
    suggestions.suggestGitHubActions = true;
    suggestions.reasons.push('CI/CD 설정이 없습니다. PR 시 자동 스펙 검증을 활성화할 수 있습니다.');
  }

  // GitLab CI 제안 (GitHub Actions가 없고 GitLab CI도 없는 경우)
  if (!analysis.hasGitHubActions && !analysis.hasGitLabCI) {
    suggestions.suggestGitLabCI = true;
  }

  return suggestions;
}

/**
 * 분석 결과를 사람이 읽을 수 있는 형태로 변환
 */
export function formatAnalysis(analysis: ProjectAnalysis): string {
  const lines: string[] = [];

  lines.push('=== 프로젝트 분석 결과 ===');
  lines.push('');

  // 프로젝트 타입
  lines.push('📁 프로젝트 타입:');
  if (analysis.isNodeProject) {
    lines.push(`   ${analysis.isTypeScriptProject ? 'TypeScript' : 'JavaScript'} (Node.js)`);
  } else {
    lines.push('   (감지되지 않음)');
  }
  lines.push('');

  // Git 상태
  lines.push('🔧 Git 상태:');
  lines.push(`   저장소: ${analysis.isGitRepo ? '✅ 초기화됨' : '❌ 미초기화'}`);
  if (analysis.isGitRepo) {
    lines.push(`   Hooks: ${analysis.hasGitHooks ? '✅ 설치됨' : '❌ 미설치'}`);
    lines.push(`   커밋 템플릿: ${analysis.hasGitMessageTemplate ? '✅ 존재' : '❌ 없음'}`);
  }
  lines.push('');

  // CI/CD 상태
  lines.push('🚀 CI/CD 상태:');
  if (analysis.hasGitHubActions) {
    lines.push(`   GitHub Actions: ✅ 설정됨`);
    lines.push(`     - SDD Validate: ${analysis.hasSddValidateWorkflow ? '✅' : '❌'}`);
    lines.push(`     - SDD Labeler: ${analysis.hasSddLabelerWorkflow ? '✅' : '❌'}`);
  } else {
    lines.push('   GitHub Actions: ❌ 미설정');
  }
  lines.push(`   GitLab CI: ${analysis.hasGitLabCI ? '✅ 설정됨' : '❌ 미설정'}`);
  lines.push('');

  // SDD 상태
  lines.push('📋 SDD 상태:');
  lines.push(`   초기화: ${analysis.isSddProject ? '✅ 완료' : '❌ 미초기화'}`);

  return lines.join('\n');
}
