/**
 * 역추출 모듈
 *
 * CLI는 결정적인 부분(구조 스캔, 초안 검증/리뷰, 확정)만 담당하고,
 * 코드를 읽고 스펙 초안을 작성하는 일은 AI(sdd-reverse 스킬)가 담당합니다.
 */

export {
  scanProject,
  formatScanResult,
  toDomainId,
  type ScanOptions,
  type ScanResult,
  type ScannedDomain,
} from './scanner.js';

export {
  DRAFTS_DIR,
  REVIEW_FILE,
  getDraftsDir,
  loadReviewState,
  saveReviewState,
  listDrafts,
  resolveDraft,
  approveDraft,
  rejectDraft,
  formatDraftList,
  formatDraftDetail,
  type DraftInfo,
  type DraftStatus,
  type ReviewEntry,
  type ReviewState,
} from './drafts.js';

export {
  finalizeDrafts,
  formatFinalizeResult,
  type FinalizeOptions,
  type FinalizeResult,
  type FinalizedDraft,
} from './finalize.js';
