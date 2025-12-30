/**
 * Claude Code 슬래시 커맨드 생성기
 *
 * 이 모듈은 SDD 워크플로우용 Claude 슬래시 커맨드를 생성합니다.
 * 커맨드는 카테고리별로 분류되어 있습니다:
 *
 * - core/: 핵심 워크플로우 (start, new, plan, tasks, implement, validate)
 * - management/: 관리 기능 (constitution, change, status)
 * - analysis/: 분석 기능 (analyze, impact, quality, sync, diff, search, list, export, report)
 * - domain/: 도메인 관리 (reverse, domain, context)
 * - utils/: 유틸리티 (guide, chat, transition, research, data-model, prepare, cicd, watch, migrate, prompt)
 */

// 타입 내보내기
export type { ClaudeCommand } from './types.js';

// 핵심 워크플로우 커맨드
import {
  startCommand,
  newCommand,
  planCommand,
  tasksCommand,
  implementCommand,
  validateCommand,
} from './core/index.js';

// 관리 커맨드
import {
  constitutionCommand,
  changeCommand,
  statusCommand,
} from './management/index.js';

// 분석 커맨드
import {
  analyzeCommand,
  impactCommand,
  qualityCommand,
  syncCommand,
  diffCommand,
  searchCommand,
  listCommand,
  exportCommand,
  reportCommand,
} from './analysis/index.js';

// 도메인/역추출 커맨드
import {
  reverseCommand,
  domainCommand,
  contextCommand,
} from './domain/index.js';

// 유틸리티 커맨드
import {
  guideCommand,
  chatCommand,
  transitionCommand,
  researchCommand,
  dataModelCommand,
  prepareCommand,
  cicdCommand,
  watchCommand,
  migrateCommand,
  promptCommand,
} from './utils/index.js';

import type { ClaudeCommand } from './types.js';

/**
 * SDD 워크플로우용 Claude 슬래시 커맨드 생성
 */
export function generateClaudeCommands(): ClaudeCommand[] {
  return [
    // 핵심 워크플로우
    startCommand,
    newCommand,
    planCommand,
    tasksCommand,
    implementCommand,
    validateCommand,
    // 관리
    constitutionCommand,
    changeCommand,
    statusCommand,
    // 분석
    analyzeCommand,
    impactCommand,
    qualityCommand,
    syncCommand,
    diffCommand,
    searchCommand,
    listCommand,
    exportCommand,
    reportCommand,
    // 도메인/역추출
    reverseCommand,
    domainCommand,
    contextCommand,
    // 유틸리티
    guideCommand,
    chatCommand,
    transitionCommand,
    researchCommand,
    dataModelCommand,
    prepareCommand,
    cicdCommand,
    watchCommand,
    migrateCommand,
    promptCommand,
  ];
}
