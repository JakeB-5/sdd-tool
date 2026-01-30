import { DefaultTheme, LocaleSpecificConfig } from 'vitepress';

export const koConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  description: 'Spec-Driven Development CLI - AI와 함께하는 명세 기반 개발 도구',

  themeConfig: {
    nav: [
      { text: '가이드', link: '/ko/guide/getting-started' },
      { text: 'CLI', link: '/ko/cli/' },
      { text: '슬래시 커맨드', link: '/ko/commands/' },
      { text: '스펙 작성', link: '/ko/spec-writing/' },
      { text: '튜토리얼', link: '/ko/tutorial/greenfield' },
      { text: '로드맵', link: '/ko/roadmap/' },
    ],

    sidebar: {
      '/ko/guide/': [
        {
          text: '시작하기',
          items: [
            { text: '소개', link: '/ko/guide/getting-started' },
            { text: '설치', link: '/ko/guide/installation' },
            { text: '첫 프로젝트', link: '/ko/guide/first-project' },
          ],
        },
        {
          text: '핵심 개념',
          items: [
            { text: '워크플로우', link: '/ko/guide/workflow' },
            { text: '모범 사례', link: '/ko/guide/best-practices' },
          ],
        },
        {
          text: 'Git 워크플로우',
          items: [
            { text: '커밋 컨벤션', link: '/ko/guide/commit-convention' },
            { text: '브랜치 전략', link: '/ko/guide/branch-strategy' },
            { text: '단일 스펙 변경', link: '/ko/guide/workflow-single-spec' },
            { text: '다중 스펙 변경', link: '/ko/guide/workflow-bundle-spec' },
            { text: 'Constitution 변경', link: '/ko/guide/workflow-constitution' },
            { text: 'CI/CD 설정', link: '/ko/guide/cicd-setup' },
          ],
        },
        {
          text: '대규모 프로젝트',
          items: [
            { text: '도메인 시스템', link: '/ko/guide/domains' },
            { text: '컨텍스트 가이드', link: '/ko/guide/context' },
            { text: '역추출 가이드', link: '/ko/guide/reverse-extraction' },
            { text: '대규모 프로젝트', link: '/ko/guide/large-projects' },
          ],
        },
        {
          text: 'Serena 통합',
          items: [
            { text: 'Serena 설정', link: '/ko/guide/serena-setup' },
          ],
        },
      ],
      '/ko/tutorial/': [
        {
          text: '튜토리얼',
          items: [
            { text: '그린필드 프로젝트', link: '/ko/tutorial/greenfield' },
            { text: '브라운필드 프로젝트', link: '/ko/tutorial/brownfield' },
          ],
        },
      ],
      '/ko/roadmap/': [
        {
          text: '로드맵',
          items: [
            { text: '개요', link: '/ko/roadmap/' },
            { text: '현재 한계점', link: '/ko/roadmap/current-limits' },
          ],
        },
        {
          text: '메인 로드맵',
          items: [
            { text: '로드맵 v2 (전체)', link: '/ko/roadmap/overview' },
          ],
        },
        {
          text: 'Phase별 상세',
          items: [
            { text: 'Phase 0: Git 워크플로우', link: '/ko/roadmap/scaling' },
            { text: 'Phase 1-R: 역방향 추출', link: '/ko/roadmap/reverse-extraction' },
          ],
        },
        {
          text: '참고',
          items: [
            { text: '엔터프라이즈 로드맵', link: '/ko/roadmap/enterprise' },
          ],
        },
      ],
      '/ko/cli/': [
        {
          text: 'CLI 명령어',
          items: [
            { text: '개요', link: '/ko/cli/' },
            { text: 'sdd init', link: '/ko/cli/init' },
            { text: 'sdd new', link: '/ko/cli/new' },
            { text: 'sdd validate', link: '/ko/cli/validate' },
            { text: 'sdd prepare', link: '/ko/cli/prepare' },
            { text: 'sdd status', link: '/ko/cli/status' },
            { text: 'sdd list', link: '/ko/cli/list' },
            { text: 'sdd sync', link: '/ko/cli/sync' },
            { text: 'sdd diff', link: '/ko/cli/diff' },
            { text: 'sdd export', link: '/ko/cli/export' },
            { text: 'sdd git', link: '/ko/cli/git' },
            { text: 'sdd cicd', link: '/ko/cli/cicd' },
          ],
        },
        {
          text: '도메인 & 컨텍스트',
          items: [
            { text: 'sdd domain', link: '/ko/cli/domain' },
            { text: 'sdd context', link: '/ko/cli/context' },
          ],
        },
        {
          text: '역추출',
          items: [
            { text: 'sdd reverse', link: '/ko/cli/reverse' },
          ],
        },
      ],
      '/ko/commands/': [
        {
          text: '핵심 워크플로우',
          items: [
            { text: '개요', link: '/ko/commands/' },
            { text: '/sdd.start', link: '/ko/commands/sdd-start' },
            { text: '/sdd.constitution', link: '/ko/commands/sdd-constitution' },
            { text: '/sdd.spec', link: '/ko/commands/sdd-spec' },
            { text: '/sdd.plan', link: '/ko/commands/sdd-plan' },
            { text: '/sdd.tasks', link: '/ko/commands/sdd-tasks' },
            { text: '/sdd.prepare', link: '/ko/commands/sdd-prepare' },
            { text: '/sdd.implement', link: '/ko/commands/sdd-implement' },
            { text: '/sdd.validate', link: '/ko/commands/sdd-validate' },
          ],
        },
        {
          text: 'Deprecated',
          collapsed: true,
          items: [
            { text: '/sdd.new (→ /sdd.spec)', link: '/ko/commands/sdd-new' },
            { text: '/sdd.change (→ /sdd.spec)', link: '/ko/commands/sdd-change' },
          ],
        },
        {
          text: '도메인 & 역추출',
          items: [
            { text: '/sdd.reverse', link: '/ko/commands/sdd-reverse' },
            { text: '/sdd.domain', link: '/ko/commands/sdd-domain' },
            { text: '/sdd.context', link: '/ko/commands/sdd-context' },
          ],
        },
        {
          text: '개발 스킬 (자동 사용)',
          items: [
            { text: 'dev-implement', link: '/ko/commands/dev-implement' },
            { text: 'dev-next', link: '/ko/commands/dev-next' },
            { text: 'dev-review', link: '/ko/commands/dev-review' },
            { text: 'dev-scaffold', link: '/ko/commands/dev-scaffold' },
            { text: 'dev-status', link: '/ko/commands/dev-status' },
            { text: 'dev-test', link: '/ko/commands/dev-test' },
          ],
        },
      ],
      '/ko/spec-writing/': [
        {
          text: '스펙 작성 가이드',
          items: [
            { text: '개요', link: '/ko/spec-writing/' },
            { text: 'RFC 2119 키워드', link: '/ko/spec-writing/rfc2119' },
            { text: 'GIVEN-WHEN-THEN', link: '/ko/spec-writing/given-when-then' },
            { text: '요구사항 작성', link: '/ko/spec-writing/requirements' },
            { text: 'Constitution', link: '/ko/spec-writing/constitution' },
          ],
        },
      ],
    },

    editLink: {
      text: '이 페이지 수정하기',
    },

    lastUpdated: {
      text: '마지막 수정',
    },

    outline: {
      label: '이 페이지에서',
    },

    docFooter: {
      prev: '이전',
      next: '다음',
    },
  },
};

export const koSearch: DefaultTheme.LocalSearchOptions['locales'] = {
  translations: {
    button: { buttonText: '검색', buttonAriaLabel: '검색' },
    modal: {
      searchBox: {
        resetButtonTitle: '검색어 지우기',
        resetButtonAriaLabel: '검색어 지우기',
        cancelButtonText: '취소',
        cancelButtonAriaLabel: '취소',
      },
      startScreen: {
        recentSearchesTitle: '최근 검색',
        noRecentSearchesText: '최근 검색 없음',
        saveRecentSearchButtonTitle: '최근 검색에 저장',
        removeRecentSearchButtonTitle: '최근 검색에서 삭제',
      },
      errorScreen: {
        titleText: '결과를 가져올 수 없습니다',
        helpText: '네트워크 연결을 확인하세요',
      },
      footer: {
        selectText: '선택',
        navigateText: '이동',
        closeText: '닫기',
      },
      noResultsScreen: {
        noResultsText: '검색 결과가 없습니다',
        suggestedQueryText: '다른 검색어를 시도해보세요',
      },
    },
  },
};
