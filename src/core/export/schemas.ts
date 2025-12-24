/**
 * sdd export 스키마 정의
 */
import { z } from 'zod';

/**
 * 내보내기 형식
 */
export const ExportFormatSchema = z.enum(['html', 'pdf', 'json', 'markdown']);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

/**
 * 테마
 */
export const ThemeSchema = z.enum(['light', 'dark']);
export type Theme = z.infer<typeof ThemeSchema>;

/**
 * 내보내기 옵션
 */
export const ExportOptionsSchema = z.object({
  format: ExportFormatSchema.default('html'),
  output: z.string().optional(),
  theme: ThemeSchema.default('light'),
  template: z.string().optional(),
  includeToc: z.boolean().default(true),
  includeConstitution: z.boolean().default(false),
  includeChanges: z.boolean().default(false),
  all: z.boolean().default(false),
  specIds: z.array(z.string()).optional(),
});
export type ExportOptions = z.infer<typeof ExportOptionsSchema>;
export type ExportOptionsInput = z.input<typeof ExportOptionsSchema>;

/**
 * 파싱된 요구사항
 */
export const ParsedRequirementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  keyword: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
});
export type ParsedRequirement = z.infer<typeof ParsedRequirementSchema>;

/**
 * 파싱된 시나리오
 */
export const ParsedScenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  given: z.array(z.string()),
  when: z.array(z.string()),
  then: z.array(z.string()),
  and: z.array(z.string()).optional(),
});
export type ParsedScenario = z.infer<typeof ParsedScenarioSchema>;

/**
 * 파싱된 스펙
 */
export const ParsedSpecSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string().optional(),
  version: z.string().optional(),
  created: z.string().optional(),
  author: z.string().optional(),
  description: z.string().optional(),
  requirements: z.array(ParsedRequirementSchema),
  scenarios: z.array(ParsedScenarioSchema),
  dependencies: z.array(z.string()),
  metadata: z.record(z.unknown()),
  rawContent: z.string(),
});
export type ParsedSpec = z.infer<typeof ParsedSpecSchema>;

/**
 * 내보내기 결과
 */
export const ExportResultSchema = z.object({
  success: z.boolean(),
  outputPath: z.string().optional(),
  format: ExportFormatSchema,
  specsExported: z.number(),
  size: z.number().optional(),
  error: z.string().optional(),
});
export type ExportResult = z.infer<typeof ExportResultSchema>;
