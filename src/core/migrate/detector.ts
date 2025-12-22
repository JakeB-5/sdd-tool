/**
 * 외부 SDD 도구 감지 모듈
 *
 * OpenSpec, Spec Kit 등 외부 SDD 도구를 감지합니다.
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import { Result, success, failure } from '../../types/index.js';
import { ChangeError } from '../../errors/index.js';
import { directoryExists, fileExists } from '../../utils/fs.js';

/**
 * 도구 종류
 */
export type ToolType = 'openspec' | 'speckit' | 'sdd' | 'unknown';

/**
 * 감지 결과
 */
export interface DetectionResult {
  tool: ToolType;
  path: string;
  version?: string;
  specCount: number;
  specs: SpecInfo[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * 스펙 정보
 */
export interface SpecInfo {
  id: string;
  title?: string;
  path: string;
  status?: string;
}

/**
 * 마이그레이션 옵션
 */
export interface MigrationOptions {
  dryRun?: boolean;
  overwrite?: boolean;
  preserveStatus?: boolean;
}

/**
 * 마이그레이션 결과
 */
export interface MigrationResult {
  source: ToolType;
  targetPath: string;
  specsCreated: number;
  specsSkipped: number;
  errors: string[];
}

/**
 * 외부 도구 감지
 */
export async function detectExternalTools(
  projectRoot: string
): Promise<Result<DetectionResult[], ChangeError>> {
  try {
    const results: DetectionResult[] = [];

    // OpenSpec 감지
    const openspecResult = await detectOpenSpec(projectRoot);
    if (openspecResult) {
      results.push(openspecResult);
    }

    // Spec Kit 감지
    const speckitResult = await detectSpecKit(projectRoot);
    if (speckitResult) {
      results.push(speckitResult);
    }

    // 기존 SDD 감지
    const sddResult = await detectSdd(projectRoot);
    if (sddResult) {
      results.push(sddResult);
    }

    return success(results);
  } catch (error) {
    return failure(new ChangeError(error instanceof Error ? error.message : String(error)));
  }
}

/**
 * OpenSpec 감지
 */
async function detectOpenSpec(projectRoot: string): Promise<DetectionResult | null> {
  // openspec/ 디렉토리 확인
  const openspecPath = path.join(projectRoot, 'openspec');
  if (!(await directoryExists(openspecPath))) {
    return null;
  }

  const specsPath = path.join(openspecPath, 'specs');
  const changesPath = path.join(openspecPath, 'changes');
  const agentsPath = path.join(openspecPath, 'AGENTS.md');

  // AGENTS.md가 있거나 specs/changes 구조 확인
  const hasAgents = await fileExists(agentsPath);
  const hasSpecs = await directoryExists(specsPath);
  const hasChanges = await directoryExists(changesPath);

  if (!hasSpecs && !hasChanges && !hasAgents) {
    return null;
  }

  // 스펙 수집
  const specs: SpecInfo[] = [];

  if (hasSpecs) {
    const specDirs = await fs.readdir(specsPath, { withFileTypes: true });
    for (const entry of specDirs) {
      if (entry.isDirectory()) {
        const specPath = path.join(specsPath, entry.name);
        const specFile = path.join(specPath, 'spec.md');

        if (await fileExists(specFile)) {
          const content = await fs.readFile(specFile, 'utf-8');
          const title = extractTitle(content);
          const status = extractFrontmatterField(content, 'status');

          specs.push({
            id: entry.name,
            title,
            path: specPath,
            status,
          });
        }
      }
    }
  }

  return {
    tool: 'openspec',
    path: openspecPath,
    specCount: specs.length,
    specs,
    confidence: hasAgents ? 'high' : hasSpecs && hasChanges ? 'medium' : 'low',
  };
}

/**
 * Spec Kit 감지
 */
async function detectSpecKit(projectRoot: string): Promise<DetectionResult | null> {
  // .specify/ 디렉토리 확인
  const specifyPath = path.join(projectRoot, '.specify');
  if (!(await directoryExists(specifyPath))) {
    return null;
  }

  const specsPath = path.join(specifyPath, 'specs');
  const memoryPath = path.join(projectRoot, 'memory');
  const constitutionPath = path.join(memoryPath, 'constitution.md');

  const hasSpecs = await directoryExists(specsPath);
  const hasConstitution = await fileExists(constitutionPath);

  if (!hasSpecs) {
    return null;
  }

  // 스펙 수집
  const specs: SpecInfo[] = [];

  const specDirs = await fs.readdir(specsPath, { withFileTypes: true });
  for (const entry of specDirs) {
    if (entry.isDirectory()) {
      const specPath = path.join(specsPath, entry.name);

      // spec.md, plan.md, tasks.md 확인 (Spec Kit 구조)
      const specFile = path.join(specPath, 'spec.md');
      const planFile = path.join(specPath, 'plan.md');
      const tasksFile = path.join(specPath, 'tasks.md');

      const hasSpec = await fileExists(specFile);
      const hasPlan = await fileExists(planFile);
      const hasTasks = await fileExists(tasksFile);

      if (hasSpec || hasPlan) {
        let title: string | undefined;
        let status: string | undefined;

        if (hasSpec) {
          const content = await fs.readFile(specFile, 'utf-8');
          title = extractTitle(content);
          status = extractFrontmatterField(content, 'status');
        }

        specs.push({
          id: entry.name,
          title,
          path: specPath,
          status: hasTasks ? 'in-progress' : status,
        });
      }
    }
  }

  return {
    tool: 'speckit',
    path: specifyPath,
    specCount: specs.length,
    specs,
    confidence: hasConstitution ? 'high' : 'medium',
  };
}

/**
 * 기존 SDD 감지
 */
async function detectSdd(projectRoot: string): Promise<DetectionResult | null> {
  const sddPath = path.join(projectRoot, '.sdd');
  if (!(await directoryExists(sddPath))) {
    return null;
  }

  const specsPath = path.join(sddPath, 'specs');
  const configPath = path.join(sddPath, 'config.yaml');

  if (!(await directoryExists(specsPath))) {
    return null;
  }

  // 스펙 수집
  const specs: SpecInfo[] = [];

  const specDirs = await fs.readdir(specsPath, { withFileTypes: true });
  for (const entry of specDirs) {
    if (entry.isDirectory()) {
      const specPath = path.join(specsPath, entry.name);
      const specFile = path.join(specPath, 'spec.md');

      if (await fileExists(specFile)) {
        const content = await fs.readFile(specFile, 'utf-8');
        const title = extractTitle(content);
        const status = extractFrontmatterField(content, 'status');

        specs.push({
          id: entry.name,
          title,
          path: specPath,
          status,
        });
      }
    }
  }

  return {
    tool: 'sdd',
    path: sddPath,
    specCount: specs.length,
    specs,
    confidence: (await fileExists(configPath)) ? 'high' : 'medium',
  };
}

/**
 * OpenSpec에서 마이그레이션
 */
export async function migrateFromOpenSpec(
  sourcePath: string,
  targetPath: string,
  options: MigrationOptions = {}
): Promise<Result<MigrationResult, ChangeError>> {
  try {
    const specsPath = path.join(sourcePath, 'specs');
    const targetSpecsPath = path.join(targetPath, 'specs');

    let specsCreated = 0;
    let specsSkipped = 0;
    const errors: string[] = [];

    if (!(await directoryExists(specsPath))) {
      return failure(new ChangeError('OpenSpec specs 디렉토리를 찾을 수 없습니다.'));
    }

    const specDirs = await fs.readdir(specsPath, { withFileTypes: true });

    for (const entry of specDirs) {
      if (!entry.isDirectory()) continue;

      const sourceSpecPath = path.join(specsPath, entry.name);
      const targetSpecPath = path.join(targetSpecsPath, entry.name);

      // 대상이 이미 존재하면 스킵
      if (await directoryExists(targetSpecPath)) {
        if (!options.overwrite) {
          specsSkipped++;
          continue;
        }
      }

      try {
        if (!options.dryRun) {
          // 디렉토리 복사
          await fs.mkdir(targetSpecPath, { recursive: true });

          const files = await fs.readdir(sourceSpecPath);
          for (const file of files) {
            const sourceFile = path.join(sourceSpecPath, file);
            const targetFile = path.join(targetSpecPath, file);

            const stat = await fs.stat(sourceFile);
            if (stat.isFile()) {
              let content = await fs.readFile(sourceFile, 'utf-8');

              // SDD 형식에 맞게 변환 (phase 추가 등)
              if (file === 'spec.md') {
                content = convertOpenSpecToSdd(content, entry.name);
              }

              await fs.writeFile(targetFile, content);
            }
          }
        }

        specsCreated++;
      } catch (error) {
        errors.push(`${entry.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return success({
      source: 'openspec',
      targetPath,
      specsCreated,
      specsSkipped,
      errors,
    });
  } catch (error) {
    return failure(new ChangeError(error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Spec Kit에서 마이그레이션
 */
export async function migrateFromSpecKit(
  sourcePath: string,
  targetPath: string,
  options: MigrationOptions = {}
): Promise<Result<MigrationResult, ChangeError>> {
  try {
    const specsPath = path.join(sourcePath, 'specs');
    const targetSpecsPath = path.join(targetPath, 'specs');

    let specsCreated = 0;
    let specsSkipped = 0;
    const errors: string[] = [];

    if (!(await directoryExists(specsPath))) {
      return failure(new ChangeError('Spec Kit specs 디렉토리를 찾을 수 없습니다.'));
    }

    const specDirs = await fs.readdir(specsPath, { withFileTypes: true });

    for (const entry of specDirs) {
      if (!entry.isDirectory()) continue;

      const sourceSpecPath = path.join(specsPath, entry.name);
      const targetSpecPath = path.join(targetSpecsPath, entry.name);

      // 대상이 이미 존재하면 스킵
      if (await directoryExists(targetSpecPath)) {
        if (!options.overwrite) {
          specsSkipped++;
          continue;
        }
      }

      try {
        if (!options.dryRun) {
          // 디렉토리 복사
          await fs.mkdir(targetSpecPath, { recursive: true });

          const files = await fs.readdir(sourceSpecPath);
          for (const file of files) {
            const sourceFile = path.join(sourceSpecPath, file);
            const targetFile = path.join(targetSpecPath, file);

            const stat = await fs.stat(sourceFile);
            if (stat.isFile()) {
              let content = await fs.readFile(sourceFile, 'utf-8');

              // SDD 형식에 맞게 변환
              if (file === 'spec.md') {
                content = convertSpecKitToSdd(content, entry.name);
              }

              await fs.writeFile(targetFile, content);
            }
          }
        }

        specsCreated++;
      } catch (error) {
        errors.push(`${entry.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return success({
      source: 'speckit',
      targetPath,
      specsCreated,
      specsSkipped,
      errors,
    });
  } catch (error) {
    return failure(new ChangeError(error instanceof Error ? error.message : String(error)));
  }
}

/**
 * OpenSpec 형식을 SDD 형식으로 변환
 */
function convertOpenSpecToSdd(content: string, specId: string): string {
  // frontmatter 추출
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    // frontmatter 없으면 추가
    const title = extractTitle(content) || specId;
    return `---
id: ${specId}
title: ${title}
phase: migrated
status: draft
source: openspec
migrated_at: ${new Date().toISOString()}
---

${content}`;
  }

  // 기존 frontmatter에 필드 추가
  let newFrontmatter = frontmatterMatch[1];

  if (!newFrontmatter.includes('phase:')) {
    newFrontmatter += '\nphase: migrated';
  }
  if (!newFrontmatter.includes('source:')) {
    newFrontmatter += '\nsource: openspec';
  }
  if (!newFrontmatter.includes('migrated_at:')) {
    newFrontmatter += `\nmigrated_at: ${new Date().toISOString()}`;
  }

  return content.replace(/^---\n[\s\S]*?\n---/, `---\n${newFrontmatter}\n---`);
}

/**
 * Spec Kit 형식을 SDD 형식으로 변환
 */
function convertSpecKitToSdd(content: string, specId: string): string {
  // frontmatter 추출
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    // frontmatter 없으면 추가
    const title = extractTitle(content) || specId;
    return `---
id: ${specId}
title: ${title}
phase: migrated
status: draft
source: speckit
migrated_at: ${new Date().toISOString()}
---

${content}`;
  }

  // 기존 frontmatter에 필드 추가
  let newFrontmatter = frontmatterMatch[1];

  if (!newFrontmatter.includes('phase:')) {
    newFrontmatter += '\nphase: migrated';
  }
  if (!newFrontmatter.includes('source:')) {
    newFrontmatter += '\nsource: speckit';
  }
  if (!newFrontmatter.includes('migrated_at:')) {
    newFrontmatter += `\nmigrated_at: ${new Date().toISOString()}`;
  }

  return content.replace(/^---\n[\s\S]*?\n---/, `---\n${newFrontmatter}\n---`);
}

/**
 * 제목 추출
 */
function extractTitle(content: string): string | undefined {
  // frontmatter에서 title 추출
  const fmMatch = content.match(/^---\n[\s\S]*?title:\s*['"]?([^'"\n]+)['"]?\n[\s\S]*?\n---/);
  if (fmMatch) {
    return fmMatch[1].trim();
  }

  // 첫 번째 h1 헤딩 추출
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  return undefined;
}

/**
 * frontmatter 필드 추출
 */
function extractFrontmatterField(content: string, field: string): string | undefined {
  const regex = new RegExp(`^---\\n[\\s\\S]*?${field}:\\s*['"]?([^'"\\n]+)['"]?\\n[\\s\\S]*?\\n---`);
  const match = content.match(regex);
  return match ? match[1].trim() : undefined;
}
