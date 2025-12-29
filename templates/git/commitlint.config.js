/**
 * SDD 프로젝트용 commitlint 설정
 *
 * 사용법:
 * 1. 이 파일을 프로젝트 루트에 복사
 * 2. npm install --save-dev @commitlint/cli
 * 3. Git hooks에서 commitlint 실행
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],

  // 스펙 커밋 타입 추가
  rules: {
    'type-enum': [
      2,
      'always',
      [
        // SDD 스펙 타입
        'spec', // 스펙 신규 생성
        'spec-update', // 스펙 내용 수정
        'spec-status', // 스펙 상태 변경
        'plan', // 구현 계획
        'tasks', // 작업 분해
        'constitution', // Constitution 변경
        'sdd-config', // SDD 설정 변경

        // Conventional Commits 타입
        'feat', // 새 기능
        'fix', // 버그 수정
        'docs', // 문서 변경
        'style', // 코드 포맷팅
        'refactor', // 리팩토링
        'perf', // 성능 개선
        'test', // 테스트
        'build', // 빌드 시스템
        'ci', // CI 설정
        'chore', // 기타 작업
        'revert', // 되돌리기
      ],
    ],

    // 스코프 형식: 영문 소문자, 하이픈, 슬래시, 쉼표, 별표 허용
    'scope-case': [2, 'always', 'lower-case'],
    'scope-empty': [0], // 스코프는 선택사항

    // 제목 규칙
    'subject-case': [0], // 케이스 제한 없음 (한글 허용)
    'subject-empty': [2, 'never'],
    'subject-max-length': [2, 'always', 50],

    // 본문 규칙
    'body-max-line-length': [2, 'always', 72],

    // 헤더 규칙
    'header-max-length': [2, 'always', 72],
  },

  // 에러 메시지 한글화
  prompt: {
    messages: {
      skip: '(엔터로 건너뛰기)',
      max: '최대 %d자',
      min: '최소 %d자',
      emptyWarning: '비어있으면 안 됩니다',
      upperLimitWarning: '글자 수 초과',
      lowerLimitWarning: '글자 수 부족',
    },
    questions: {
      type: {
        description: '커밋 유형을 선택하세요',
        enum: {
          spec: { description: '스펙 신규 생성', title: 'Spec' },
          'spec-update': { description: '스펙 내용 수정', title: 'Spec Update' },
          'spec-status': { description: '스펙 상태 변경', title: 'Spec Status' },
          plan: { description: '구현 계획', title: 'Plan' },
          tasks: { description: '작업 분해', title: 'Tasks' },
          constitution: { description: 'Constitution 변경', title: 'Constitution' },
          'sdd-config': { description: 'SDD 설정 변경', title: 'SDD Config' },
          feat: { description: '새 기능', title: 'Feature' },
          fix: { description: '버그 수정', title: 'Fix' },
          docs: { description: '문서 변경', title: 'Docs' },
          style: { description: '코드 포맷팅', title: 'Style' },
          refactor: { description: '리팩토링', title: 'Refactor' },
          perf: { description: '성능 개선', title: 'Perf' },
          test: { description: '테스트', title: 'Test' },
          build: { description: '빌드 시스템', title: 'Build' },
          ci: { description: 'CI 설정', title: 'CI' },
          chore: { description: '기타 작업', title: 'Chore' },
          revert: { description: '되돌리기', title: 'Revert' },
        },
      },
      scope: {
        description: '스코프를 입력하세요 (예: auth, auth/user-login)',
      },
      subject: {
        description: '간결한 변경 설명을 입력하세요',
      },
      body: {
        description: '상세한 변경 설명을 입력하세요 (선택)',
      },
      isBreaking: {
        description: 'Breaking Change가 있나요?',
      },
      breakingBody: {
        description: 'Breaking Change 상세 내용을 입력하세요',
      },
      breaking: {
        description: 'Breaking Change 요약을 입력하세요',
      },
      isIssueAffected: {
        description: '관련 이슈가 있나요?',
      },
      issuesBody: {
        description: '이슈 참조 (예: Refs: #123)',
      },
      issues: {
        description: '이슈 번호를 입력하세요',
      },
    },
  },
};
