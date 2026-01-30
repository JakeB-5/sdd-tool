import { DefaultTheme, LocaleSpecificConfig } from 'vitepress';

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  description: 'Spec-Driven Development CLI - AI-Powered Specification Workflow',

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'CLI', link: '/cli/' },
      { text: 'Slash Commands', link: '/commands/' },
      { text: 'Spec Writing', link: '/spec-writing/' },
      { text: 'Tutorial', link: '/tutorial/greenfield' },
      { text: 'Roadmap', link: '/roadmap/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'First Project', link: '/guide/first-project' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Workflow', link: '/guide/workflow' },
            { text: 'Best Practices', link: '/guide/best-practices' },
          ],
        },
        {
          text: 'Git Workflow',
          items: [
            { text: 'Commit Convention', link: '/guide/commit-convention' },
            { text: 'Branch Strategy', link: '/guide/branch-strategy' },
            { text: 'Single Spec Change', link: '/guide/workflow-single-spec' },
            { text: 'Bundle Spec Change', link: '/guide/workflow-bundle-spec' },
            { text: 'Constitution Change', link: '/guide/workflow-constitution' },
            { text: 'CI/CD Setup', link: '/guide/cicd-setup' },
          ],
        },
        {
          text: 'Large Projects',
          items: [
            { text: 'Domain System', link: '/guide/domains' },
            { text: 'Context Guide', link: '/guide/context' },
            { text: 'Reverse Extraction', link: '/guide/reverse-extraction' },
            { text: 'Large Projects', link: '/guide/large-projects' },
          ],
        },
        {
          text: 'Serena Integration',
          items: [
            { text: 'Serena Setup', link: '/guide/serena-setup' },
          ],
        },
      ],
      '/tutorial/': [
        {
          text: 'Tutorials',
          items: [
            { text: 'Greenfield Project', link: '/tutorial/greenfield' },
            { text: 'Brownfield Project', link: '/tutorial/brownfield' },
          ],
        },
      ],
      '/roadmap/': [
        {
          text: 'Roadmap',
          items: [
            { text: 'Overview', link: '/roadmap/' },
            { text: 'Current Limitations', link: '/roadmap/current-limits' },
          ],
        },
        {
          text: 'Main Roadmap',
          items: [
            { text: 'Roadmap v2 (Full)', link: '/roadmap/overview' },
          ],
        },
        {
          text: 'Phase Details',
          items: [
            { text: 'Phase 0: Git Workflow', link: '/roadmap/scaling' },
            { text: 'Phase 1-R: Reverse Extraction', link: '/roadmap/reverse-extraction' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Enterprise Roadmap', link: '/roadmap/enterprise' },
          ],
        },
      ],
      '/cli/': [
        {
          text: 'CLI Commands',
          items: [
            { text: 'Overview', link: '/cli/' },
            { text: 'sdd init', link: '/cli/init' },
            { text: 'sdd new', link: '/cli/new' },
            { text: 'sdd validate', link: '/cli/validate' },
            { text: 'sdd prepare', link: '/cli/prepare' },
            { text: 'sdd status', link: '/cli/status' },
            { text: 'sdd list', link: '/cli/list' },
            { text: 'sdd sync', link: '/cli/sync' },
            { text: 'sdd diff', link: '/cli/diff' },
            { text: 'sdd export', link: '/cli/export' },
            { text: 'sdd git', link: '/cli/git' },
            { text: 'sdd cicd', link: '/cli/cicd' },
          ],
        },
        {
          text: 'Domain & Context',
          items: [
            { text: 'sdd domain', link: '/cli/domain' },
            { text: 'sdd context', link: '/cli/context' },
          ],
        },
        {
          text: 'Reverse Extraction',
          items: [
            { text: 'sdd reverse', link: '/cli/reverse' },
          ],
        },
      ],
      '/commands/': [
        {
          text: 'Core Workflow',
          items: [
            { text: 'Overview', link: '/commands/' },
            { text: '/sdd.start', link: '/commands/sdd-start' },
            { text: '/sdd.constitution', link: '/commands/sdd-constitution' },
            { text: '/sdd.spec', link: '/commands/sdd-spec' },
            { text: '/sdd.plan', link: '/commands/sdd-plan' },
            { text: '/sdd.tasks', link: '/commands/sdd-tasks' },
            { text: '/sdd.prepare', link: '/commands/sdd-prepare' },
            { text: '/sdd.implement', link: '/commands/sdd-implement' },
            { text: '/sdd.validate', link: '/commands/sdd-validate' },
          ],
        },
        {
          text: 'Deprecated',
          collapsed: true,
          items: [
            { text: '/sdd.new (→ /sdd.spec)', link: '/commands/sdd-new' },
            { text: '/sdd.change (→ /sdd.spec)', link: '/commands/sdd-change' },
          ],
        },
        {
          text: 'Domain & Reverse',
          items: [
            { text: '/sdd.reverse', link: '/commands/sdd-reverse' },
            { text: '/sdd.domain', link: '/commands/sdd-domain' },
            { text: '/sdd.context', link: '/commands/sdd-context' },
          ],
        },
        {
          text: 'Dev Skills (Auto)',
          items: [
            { text: 'dev-implement', link: '/commands/dev-implement' },
            { text: 'dev-next', link: '/commands/dev-next' },
            { text: 'dev-review', link: '/commands/dev-review' },
            { text: 'dev-scaffold', link: '/commands/dev-scaffold' },
            { text: 'dev-status', link: '/commands/dev-status' },
            { text: 'dev-test', link: '/commands/dev-test' },
          ],
        },
      ],
      '/spec-writing/': [
        {
          text: 'Spec Writing Guide',
          items: [
            { text: 'Overview', link: '/spec-writing/' },
            { text: 'RFC 2119 Keywords', link: '/spec-writing/rfc2119' },
            { text: 'GIVEN-WHEN-THEN', link: '/spec-writing/given-when-then' },
            { text: 'Writing Requirements', link: '/spec-writing/requirements' },
            { text: 'Constitution', link: '/spec-writing/constitution' },
          ],
        },
      ],
    },

    editLink: {
      text: 'Edit this page',
    },

    lastUpdated: {
      text: 'Last updated',
    },

    outline: {
      label: 'On this page',
    },

    docFooter: {
      prev: 'Previous',
      next: 'Next',
    },
  },
};

export const enSearch: DefaultTheme.LocalSearchOptions['locales'] = {
  translations: {
    button: { buttonText: 'Search', buttonAriaLabel: 'Search' },
    modal: {
      searchBox: {
        resetButtonTitle: 'Clear search',
        resetButtonAriaLabel: 'Clear search',
        cancelButtonText: 'Cancel',
        cancelButtonAriaLabel: 'Cancel',
      },
      startScreen: {
        recentSearchesTitle: 'Recent searches',
        noRecentSearchesText: 'No recent searches',
        saveRecentSearchButtonTitle: 'Save to recent searches',
        removeRecentSearchButtonTitle: 'Remove from recent searches',
      },
      errorScreen: {
        titleText: 'Unable to fetch results',
        helpText: 'Please check your network connection',
      },
      footer: {
        selectText: 'Select',
        navigateText: 'Navigate',
        closeText: 'Close',
      },
      noResultsScreen: {
        noResultsText: 'No results found',
        suggestedQueryText: 'Try a different search term',
      },
    },
  },
};
