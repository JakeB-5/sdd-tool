/**
 * Constitution 관련 Zod 스키마 정의
 */
import { z } from 'zod';

/**
 * 시맨틱 버전 스키마
 */
export const SemanticVersionSchema = z.string().regex(
  /^\d+\.\d+\.\d+$/,
  '버전 형식: MAJOR.MINOR.PATCH (예: 1.2.3)'
);
export type SemanticVersion = z.infer<typeof SemanticVersionSchema>;

/**
 * 버전 범프 유형
 */
export const VersionBumpType = ['major', 'minor', 'patch'] as const;
export type VersionBumpType = (typeof VersionBumpType)[number];

/**
 * Constitution 메타데이터
 */
export const ConstitutionMetadataSchema = z.object({
  version: SemanticVersionSchema,
  created: z.string(),
  updated: z.string().optional(),
});
export type ConstitutionMetadata = z.infer<typeof ConstitutionMetadataSchema>;

/**
 * 원칙 레벨
 */
export const PrincipleLevelSchema = z.enum(['core', 'technical', 'forbidden']);
export type PrincipleLevel = z.infer<typeof PrincipleLevelSchema>;

/**
 * 원칙
 */
export const PrincipleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  level: PrincipleLevelSchema,
  rules: z.array(z.string()),
});
export type Principle = z.infer<typeof PrincipleSchema>;

/**
 * 파싱된 Constitution
 */
export const ParsedConstitutionSchema = z.object({
  projectName: z.string(),
  metadata: ConstitutionMetadataSchema,
  description: z.string().optional(),
  principles: z.array(PrincipleSchema),
  forbidden: z.array(z.string()),
  techStack: z.array(z.string()),
  qualityStandards: z.array(z.string()),
  rawContent: z.string(),
});
export type ParsedConstitution = z.infer<typeof ParsedConstitutionSchema>;

/**
 * CHANGELOG 항목 유형
 */
export const ChangeTypeSchema = z.enum(['added', 'changed', 'deprecated', 'removed', 'fixed']);
export type ChangeType = z.infer<typeof ChangeTypeSchema>;

/**
 * CHANGELOG 항목
 */
export const ChangelogEntrySchema = z.object({
  version: SemanticVersionSchema,
  date: z.string(),
  changes: z.array(z.object({
    type: ChangeTypeSchema,
    description: z.string(),
  })),
  reason: z.string().optional(),
});
export type ChangelogEntry = z.infer<typeof ChangelogEntrySchema>;

/**
 * 버전 파싱
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * 버전 범프
 */
export function bumpVersion(version: string, type: VersionBumpType): string {
  const parsed = parseVersion(version);
  if (!parsed) return '1.0.0';

  switch (type) {
    case 'major':
      return `${parsed.major + 1}.0.0`;
    case 'minor':
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case 'patch':
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  }
}

/**
 * 버전 비교 (a > b: 1, a < b: -1, a === b: 0)
 */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);

  if (!pa || !pb) return 0;

  if (pa.major !== pb.major) return pa.major > pb.major ? 1 : -1;
  if (pa.minor !== pb.minor) return pa.minor > pb.minor ? 1 : -1;
  if (pa.patch !== pb.patch) return pa.patch > pb.patch ? 1 : -1;
  return 0;
}
