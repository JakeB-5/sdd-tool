/**
 * 스펙 상태 (단일 라이프사이클 정의)
 *
 * Every module that reads, writes, filters or displays a spec status must use
 * this table so that validate, list, status, search and report agree.
 */
import { z } from 'zod';

/**
 * 표준 스펙 상태 (라이프사이클 순서)
 */
export const SPEC_STATUSES = [
  'draft',
  'review',
  'approved',
  'planned',
  'tasked',
  'implementing',
  'implemented',
  'deprecated',
] as const;
export type SpecStatus = (typeof SPEC_STATUSES)[number];

/**
 * 레거시 상태 별칭 (읽을 때 표준 상태로 정규화)
 */
export const LEGACY_STATUS_ALIASES = {
  specified: 'review',
  completed: 'implemented',
} as const satisfies Record<string, SpecStatus>;
export type LegacySpecStatus = keyof typeof LEGACY_STATUS_ALIASES;

/**
 * 상태별 표시 정보 (아이콘/라벨)
 */
export const SPEC_STATUS_INFO: Record<SpecStatus, { icon: string; label: string }> = {
  draft: { icon: '📝', label: '초안' },
  review: { icon: '👀', label: '검토 중' },
  approved: { icon: '👍', label: '승인됨' },
  planned: { icon: '📋', label: '계획 완료' },
  tasked: { icon: '✏️', label: '작업 분해 완료' },
  implementing: { icon: '🔨', label: '구현 중' },
  implemented: { icon: '✅', label: '구현 완료' },
  deprecated: { icon: '⚠️', label: '폐기됨' },
};

/**
 * 알 수 없는 상태 아이콘
 */
export const UNKNOWN_STATUS_ICON = '❓';

export function isSpecStatus(value: unknown): value is SpecStatus {
  return typeof value === 'string' && (SPEC_STATUSES as readonly string[]).includes(value);
}

export function isLegacySpecStatus(value: unknown): value is LegacySpecStatus {
  return typeof value === 'string' && Object.hasOwn(LEGACY_STATUS_ALIASES, value);
}

/**
 * 상태 값을 표준 상태로 정규화 (대소문자/공백 무시, 레거시 별칭 변환)
 * 알 수 없는 값이면 undefined
 */
export function normalizeSpecStatus(value: unknown): SpecStatus | undefined {
  if (typeof value !== 'string') return undefined;
  const key = value.trim().toLowerCase();
  if (isSpecStatus(key)) return key;
  if (isLegacySpecStatus(key)) return LEGACY_STATUS_ALIASES[key];
  return undefined;
}

/**
 * 상태 아이콘 (레거시 별칭 포함, 알 수 없으면 ❓)
 */
export function getSpecStatusIcon(status: unknown): string {
  const normalized = normalizeSpecStatus(status);
  return normalized ? SPEC_STATUS_INFO[normalized].icon : UNKNOWN_STATUS_ICON;
}

/**
 * 상태 라벨 (알 수 없으면 원래 값)
 */
export function getSpecStatusLabel(status: unknown): string {
  const normalized = normalizeSpecStatus(status);
  return normalized ? SPEC_STATUS_INFO[normalized].label : String(status ?? 'unknown');
}

/**
 * 스펙 상태 Zod 스키마 (레거시 별칭을 표준 상태로 정규화)
 */
export const SpecStatusSchema = z.preprocess(
  (val) => normalizeSpecStatus(val) ?? val,
  z.enum(SPEC_STATUSES, {
    errorMap: () => ({
      message: `유효하지 않은 상태입니다 (허용: ${SPEC_STATUSES.join(', ')})`,
    }),
  })
);
