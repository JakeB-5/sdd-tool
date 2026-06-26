/**
 * Claude Code Skills 2.0 generator.
 *
 * Mirrors the Korean slash command generators under ../claude-commands as
 * English Skill definitions. See MIGRATION-PLAN-SLASH-COMMANDS-TO-SKILLS.md
 * for the overall migration strategy.
 *
 * - Skill definitions live under `./core`, `./management`, `./analysis`,
 *   `./domain`, and `./utils` (added in Phase 2).
 * - Each definition is a `SkillDefinition` with an English body.
 * - `generateClaudeSkills()` returns all 28 skills for `sdd init` to write.
 */

export type {
  SkillDefinition,
  SkillContextMode,
  SkillHooks,
} from './types.js';
export { serializeSkill } from './writer.js';

import type { SkillDefinition } from './types.js';
import * as core from './core/index.js';
import * as management from './management/index.js';
import * as analysis from './analysis/index.js';
import * as domain from './domain/index.js';
import * as utils from './utils/index.js';

/**
 * Generate the full set of Claude Code Skills for the SDD workflow.
 *
 * Returns 32 skill definitions spanning five categories:
 * - core (7): start, spec, new, plan, tasks, implement, validate
 * - management (3): constitution, change, status
 * - analysis (9): analyze, impact, quality, sync, diff, search, list, export, report
 * - domain (3): reverse, domain, context
 * - utils (10): guide, chat, transition, research, data-model, prepare, cicd, watch, migrate, prompt
 */
export function generateClaudeSkills(): SkillDefinition[] {
  return [
    // Core workflow
    core.sddStartSkill,
    core.sddSpecSkill,
    core.sddNewSkill,
    core.sddPlanSkill,
    core.sddTasksSkill,
    core.sddImplementSkill,
    core.sddValidateSkill,
    // Management
    management.sddConstitutionSkill,
    management.sddChangeSkill,
    management.sddStatusSkill,
    // Analysis
    analysis.sddAnalyzeSkill,
    analysis.sddImpactSkill,
    analysis.sddQualitySkill,
    analysis.sddSyncSkill,
    analysis.sddDiffSkill,
    analysis.sddSearchSkill,
    analysis.sddListSkill,
    analysis.sddExportSkill,
    analysis.sddReportSkill,
    // Domain
    domain.sddReverseSkill,
    domain.sddDomainSkill,
    domain.sddContextSkill,
    // Utils
    utils.sddGuideSkill,
    utils.sddChatSkill,
    utils.sddTransitionSkill,
    utils.sddResearchSkill,
    utils.sddDataModelSkill,
    utils.sddPrepareSkill,
    utils.sddCicdSkill,
    utils.sddWatchSkill,
    utils.sddMigrateSkill,
    utils.sddPromptSkill,
  ];
}
