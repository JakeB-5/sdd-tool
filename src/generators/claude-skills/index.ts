/**
 * Claude Code skills generator.
 *
 * Skills are the default Claude Code integration written by `sdd init`.
 * The Korean slash commands under ../claude-commands are a legacy mirror
 * generated only with `--legacy-commands`.
 *
 * - Skill definitions live under `./core`, `./management`, `./analysis`,
 *   `./domain`, and `./utils`.
 * - Each definition is a `SkillDefinition` with an English body.
 * - `generateClaudeSkills()` returns all 30 skills for `sdd init` to write.
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
 * Returns 30 skill definitions spanning five categories:
 * - core (6): start, spec, plan, tasks, implement, validate
 * - management (2): constitution, status
 * - analysis (9): analyze, impact, quality, sync, diff, search, list, export, report
 * - domain (3): reverse, domain, context
 * - utils (10): guide, chat, transition, research, data-model, prepare, cicd, watch, migrate, prompt
 */
export function generateClaudeSkills(): SkillDefinition[] {
  return [
    // Core workflow
    core.sddStartSkill,
    core.sddSpecSkill,
    core.sddPlanSkill,
    core.sddTasksSkill,
    core.sddImplementSkill,
    core.sddValidateSkill,
    // Management
    management.sddConstitutionSkill,
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
