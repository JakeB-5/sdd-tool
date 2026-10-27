/**
 * sdd diff 모듈
 */
export * from './schemas.js';
export { GitDiff } from './git-diff.js';
export { compareSpecs } from './structural-diff.js';
export { extractKeywords, getKeywordImpact, analyzeKeywordChanges } from './keyword-diff.js';
export { DiffFormatter } from './formatter.js';

import path from 'node:path';
import { GitDiff } from './git-diff.js';
import { resolveSpec } from '../spec/locator.js';
import { compareSpecs } from './structural-diff.js';
import { DiffFormatter } from './formatter.js';
import type { DiffResult, DiffOptions, SpecDiff } from './schemas.js';

export interface ExecuteDiffResult {
  success: boolean;
  data?: {
    result: DiffResult;
    output: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * sdd diff 실행
 */
export async function executeDiff(
  projectRoot: string,
  options: DiffOptions = {}
): Promise<ExecuteDiffResult> {
  const gitDiff = new GitDiff(projectRoot);

  // Git 저장소 확인
  const isGit = await gitDiff.isGitRepository();
  if (!isGit) {
    return {
      success: false,
      error: {
        code: 'NOT_GIT_REPOSITORY',
        message: 'Git 저장소가 아닙니다.',
      },
    };
  }

  // 스펙 참조 해석 (<domain>/<feature>, bare feature, 레거시 id)
  let specPath = options.specId;
  if (options.specId) {
    const resolved = await resolveSpec(path.join(projectRoot, '.sdd'), options.specId);
    if (resolved.success) {
      specPath = resolved.data.id;
    } else if (resolved.error.reason === 'ambiguous') {
      return {
        success: false,
        error: { code: 'AMBIGUOUS_SPEC', message: resolved.error.message },
      };
    }
    // not_found: keep the raw ref so deleted specs can still be diffed in git history
  }

  // 변경된 스펙 파일 조회
  const changedResult = await gitDiff.getChangedSpecFiles({
    staged: options.staged,
    commit1: options.commit1,
    commit2: options.commit2,
    specPath,
  });
  if (!changedResult.success) {
    return {
      success: false,
      error: {
        code: 'GIT_DIFF_FAILED',
        message: changedResult.error.message,
      },
    };
  }
  const changedFiles = changedResult.data;

  // 각 파일의 diff 계산
  const specDiffs: SpecDiff[] = [];

  for (const file of changedFiles) {
    const { before, after } = await gitDiff.getFileContents(file.path, {
      staged: options.staged,
      commit1: options.commit1,
      commit2: options.commit2,
    });

    const specDiff = compareSpecs(before, after, file.path);

    // 변경이 있는 경우만 포함
    if (
      specDiff.requirements.length > 0 ||
      specDiff.scenarios.length > 0 ||
      specDiff.metadata ||
      specDiff.keywordChanges.length > 0
    ) {
      specDiffs.push(specDiff);
    }
  }

  // 요약 계산
  const summary = {
    totalFiles: specDiffs.length,
    addedRequirements: 0,
    modifiedRequirements: 0,
    removedRequirements: 0,
    addedScenarios: 0,
    modifiedScenarios: 0,
    removedScenarios: 0,
    keywordChanges: 0,
  };

  for (const diff of specDiffs) {
    for (const req of diff.requirements) {
      if (req.type === 'added') summary.addedRequirements++;
      else if (req.type === 'modified') summary.modifiedRequirements++;
      else if (req.type === 'removed') summary.removedRequirements++;
    }
    for (const scen of diff.scenarios) {
      if (scen.type === 'added') summary.addedScenarios++;
      else if (scen.type === 'modified') summary.modifiedScenarios++;
      else if (scen.type === 'removed') summary.removedScenarios++;
    }
    summary.keywordChanges += diff.keywordChanges.length;
  }

  const result: DiffResult = {
    files: specDiffs,
    summary,
  };

  // 출력 포맷팅
  const formatter = new DiffFormatter({
    colors: !options.noColor,
    stat: options.stat,
    nameOnly: options.nameOnly,
  });

  let output: string;
  if (options.json) {
    output = formatter.formatJson(result);
  } else {
    output = formatter.formatTerminal(result);
  }

  return {
    success: true,
    data: {
      result,
      output,
    },
  };
}
