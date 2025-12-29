/**
 * 역추출 모듈
 *
 * 레거시 코드베이스에서 스펙을 추출하는 기능을 제공합니다.
 */

// 스캔
export {
  scanProject,
  quickScan,
  scanPath,
  type ScanProgress,
  type ScanProgressCallback,
} from './scanner.js';

// 포매터
export {
  formatScanResult,
  formatScanResultJson,
  formatScanSummaryShort,
  formatDomainSuggestions,
  calculateComplexityGrade,
  calculateDomainConfidence,
  type ScanResult,
  type ScanSummary,
  type ScanOptions,
  type SuggestedDomain,
  type ComplexityMetrics,
} from './scan-formatter.js';

// 메타데이터
export {
  loadReverseMeta,
  saveReverseMeta,
  addScanToMeta,
  getLastScan,
  getScanHistory,
  updateExtractionStatus,
  getExtractionStatus,
  resetReverseMeta,
  hasReverseMeta,
  type ReverseMeta,
  type ScanMetaEntry,
  type ExtractionStatus,
} from './meta.js';

// 비교
export {
  compareScanResults,
  formatScanDiff,
  formatDiffSummaryShort,
  type ScanDiff,
  type SymbolChange,
  type SymbolChangeType,
  type FileChanges,
  type DomainChanges,
  type DiffSummary,
} from './diff.js';

// 추출
export {
  extractSpecs,
  saveExtractedSpecs,
  loadDraftSpecs,
  deleteDraftSpec,
  groupSymbolsByDomain,
  groupSymbolsByFunction,
  filterSymbols,
  type ExtractOptions,
  type ExtractionResult,
  type ExtractionProgress,
  type ExtractionProgressCallback,
} from './extractor.js';

// 신뢰도
export {
  calculateConfidence,
  calculateAverageConfidence,
  evaluateDocumentation,
  evaluateNaming,
  evaluateTyping,
  calculateGrade,
  type ConfidenceResult,
  type ConfidenceFactors,
} from './confidence.js';

// 스펙 생성
export {
  generateSpec,
  generateSpecId,
  inferSpecName,
  inferDescription,
  inferScenarios,
  inferContracts,
  formatSpecAsMarkdown,
  formatSpecAsJson,
  type ExtractedSpec,
  type ExtractedScenario,
  type ExtractedContract,
  type ExtractedSpecMeta,
} from './spec-generator.js';

// 리뷰
export {
  loadReviewList,
  approveSpec,
  rejectSpec,
  requestRevision,
  calculateReviewSummary,
  formatReviewList,
  formatSpecDetail,
  getApprovedSpecs,
  type ReviewStatus,
  type ReviewItem,
  type ReviewComment,
  type ReviewSummary,
} from './review.js';

// 확정
export {
  finalizeSpec,
  finalizeAllApproved,
  finalizeDomain,
  finalizeById,
  formatFinalizeResult,
  getFinalizedSpecs,
  type FinalizedSpec,
  type FinalizeResult,
} from './finalizer.js';

// 도메인 생성
export {
  generateDomainsFromSuggestions,
  generateDomainsFromSpecs,
  formatDomainGenerationResult,
  type DomainGenerationResult,
  type GeneratedDomain,
  type DomainGenerationOptions,
} from './domain-generator.js';

// 보고서
export {
  ReverseExtractionReporter,
  formatReport,
  formatReportJson,
  formatReportMarkdown,
  formatQuickSummary,
  saveReport,
  type ReverseExtractionReport,
  type ScanReportSection,
  type ExtractionReportSection,
  type ReviewReportSection,
  type FinalizationReportSection,
  type DomainReportSection,
  type ReportStatistics,
} from './reporter.js';

// 정리
export {
  cleanupReverseFiles,
  archiveReverseData,
  formatCleanupResult,
  generateCommitMessage,
  getCleanupStatus,
  deleteDraftSpec,
  resetReverseData,
  type CleanupResult,
  type CleanupOptions,
  type CleanupTarget,
} from './cleanup.js';

// 의도 추론
export {
  inferIntent,
  formatInferredIntent,
  type InferredIntent,
  type InferredScenario,
  type InferredContract,
  type IntentInferenceOptions,
} from './intent-inferrer.js';

// 편집
export {
  SpecEditor,
  EditSessionManager,
  editSessionManager,
  saveEditedSpec,
  loadSpecForEditing,
  type EditOperation,
  type EditHistoryEntry,
  type SpecDiff,
} from './editor.js';

// AI 어시스턴트
export {
  AIAssistant,
  aiAssistant,
  formatAIAnalysis,
  type AISuggestion,
  type SuggestionType,
  type ReviewQuestion,
  type AIAnalysisResult,
} from './ai-assistant.js';
