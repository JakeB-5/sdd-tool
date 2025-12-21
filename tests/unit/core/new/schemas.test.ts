/**
 * 신규 기능 워크플로우 스키마 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  FeatureStatusSchema,
  TaskStatusSchema,
  TaskPrioritySchema,
  FeatureMetadataSchema,
  TaskItemSchema,
  PlanSchema,
  generateFeatureId,
  generateTaskId,
  generateBranchName,
} from '../../../../src/core/new/schemas.js';

describe('FeatureStatusSchema', () => {
  it('유효한 상태를 통과시킨다', () => {
    expect(FeatureStatusSchema.safeParse('draft').success).toBe(true);
    expect(FeatureStatusSchema.safeParse('specified').success).toBe(true);
    expect(FeatureStatusSchema.safeParse('planned').success).toBe(true);
    expect(FeatureStatusSchema.safeParse('tasked').success).toBe(true);
    expect(FeatureStatusSchema.safeParse('implementing').success).toBe(true);
    expect(FeatureStatusSchema.safeParse('completed').success).toBe(true);
  });

  it('잘못된 상태를 거부한다', () => {
    expect(FeatureStatusSchema.safeParse('invalid').success).toBe(false);
  });
});

describe('TaskStatusSchema', () => {
  it('유효한 상태를 통과시킨다', () => {
    expect(TaskStatusSchema.safeParse('pending').success).toBe(true);
    expect(TaskStatusSchema.safeParse('in_progress').success).toBe(true);
    expect(TaskStatusSchema.safeParse('completed').success).toBe(true);
    expect(TaskStatusSchema.safeParse('blocked').success).toBe(true);
  });
});

describe('TaskPrioritySchema', () => {
  it('유효한 우선순위를 통과시킨다', () => {
    expect(TaskPrioritySchema.safeParse('high').success).toBe(true);
    expect(TaskPrioritySchema.safeParse('medium').success).toBe(true);
    expect(TaskPrioritySchema.safeParse('low').success).toBe(true);
  });
});

describe('FeatureMetadataSchema', () => {
  it('유효한 메타데이터를 통과시킨다', () => {
    const result = FeatureMetadataSchema.safeParse({
      id: 'auth-login',
      title: '로그인 기능',
      status: 'draft',
      created: '2025-12-21',
      depends: null,
    });
    expect(result.success).toBe(true);
  });

  it('depends 배열을 허용한다', () => {
    const result = FeatureMetadataSchema.safeParse({
      id: 'auth-login',
      title: '로그인 기능',
      status: 'draft',
      created: '2025-12-21',
      depends: ['database', 'session'],
    });
    expect(result.success).toBe(true);
  });
});

describe('TaskItemSchema', () => {
  it('유효한 작업 항목을 통과시킨다', () => {
    const result = TaskItemSchema.safeParse({
      id: 'auth-task-001',
      title: '로그인 폼 구현',
      status: 'pending',
      priority: 'high',
    });
    expect(result.success).toBe(true);
  });

  it('옵션 필드를 포함할 수 있다', () => {
    const result = TaskItemSchema.safeParse({
      id: 'auth-task-001',
      title: '로그인 폼 구현',
      description: '사용자 로그인 폼을 구현합니다',
      status: 'in_progress',
      priority: 'high',
      assignee: 'dev1',
      files: ['src/components/LoginForm.tsx'],
      dependencies: ['auth-task-000'],
    });
    expect(result.success).toBe(true);
  });
});

describe('PlanSchema', () => {
  it('유효한 계획을 통과시킨다', () => {
    const result = PlanSchema.safeParse({
      overview: '로그인 기능 구현',
      techDecisions: [
        { decision: 'JWT 사용', rationale: '세션 관리 간소화' },
      ],
      phases: [
        { name: '기반', description: '기반 구조 설정', deliverables: ['스키마'] },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe('generateFeatureId', () => {
  it('영어 이름을 소문자로 변환한다', () => {
    expect(generateFeatureId('UserAuth')).toBe('userauth');
  });

  it('공백을 하이픈으로 변환한다', () => {
    expect(generateFeatureId('user login')).toBe('user-login');
  });

  it('특수문자를 제거한다', () => {
    expect(generateFeatureId('user@login!')).toBe('user-login');
  });

  it('한글을 유지한다', () => {
    expect(generateFeatureId('로그인 기능')).toBe('로그인-기능');
  });

  it('50자로 제한한다', () => {
    const longName = 'a'.repeat(100);
    expect(generateFeatureId(longName).length).toBe(50);
  });
});

describe('generateTaskId', () => {
  it('기능 ID와 인덱스로 작업 ID를 생성한다', () => {
    expect(generateTaskId('auth', 1)).toBe('auth-task-001');
    expect(generateTaskId('auth', 10)).toBe('auth-task-010');
    expect(generateTaskId('auth', 100)).toBe('auth-task-100');
  });
});

describe('generateBranchName', () => {
  it('feature/ 접두사가 붙은 브랜치명을 생성한다', () => {
    expect(generateBranchName('auth-login')).toBe('feature/auth-login');
    expect(generateBranchName('user-profile')).toBe('feature/user-profile');
  });
});
