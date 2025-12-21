/**
 * 신규 기능 워크플로우 모듈
 *
 * 새로운 기능 개발을 위한 명세, 계획, 작업 분해 기능을 제공합니다.
 */

// 스키마 및 타입
export {
  FeatureStatusSchema,
  TaskStatusSchema,
  TaskPrioritySchema,
  FeatureMetadataSchema,
  TaskItemSchema,
  PlanSchema,
  generateFeatureId,
  generateTaskId,
  generateBranchName,
  type FeatureStatus,
  type TaskStatus,
  type TaskPriority,
  type FeatureMetadata,
  type TaskItem,
  type Plan,
} from './schemas.js';

// 명세 생성
export {
  generateSpec,
  parseSpecMetadata,
  updateSpecStatus,
  type GenerateSpecOptions,
} from './spec-generator.js';

// 계획 생성
export {
  generatePlan,
  parsePlan,
  updatePlanStatus,
  type GeneratePlanOptions,
} from './plan-generator.js';

// 작업 분해
export {
  generateTasks,
  parseTasks,
  updateTaskStatus,
  getNextTask,
  type GenerateTasksOptions,
} from './task-generator.js';

// 브랜치 관리
export {
  BranchError,
  isGitInstalled,
  isGitRepository,
  getCurrentBranch,
  branchExists,
  createBranch,
  checkoutBranch,
  deleteBranch,
  listFeatureBranches,
  hasUncommittedChanges,
  extractFeatureId,
  getFeatureBranchInfo,
  type BranchInfo,
} from './branch.js';

// 체크리스트
export {
  DEFAULT_CHECKLISTS,
  createChecklist,
  checklistToMarkdown,
  parseChecklistFromMarkdown,
  isChecklistComplete,
  getChecklistProgress,
  toggleChecklistItem,
  createWorkflowChecklists,
  generateFullChecklistMarkdown,
  type ChecklistItem,
  type ChecklistCategory,
} from './checklist.js';
