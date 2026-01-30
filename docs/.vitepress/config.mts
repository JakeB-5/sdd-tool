import { defineConfig } from 'vitepress';
import { enConfig, enSearch } from './en.mts';
import { koConfig, koSearch } from './ko.mts';
import { sharedConfig } from './shared.mts';

export default defineConfig({
  ...sharedConfig,

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      ...enConfig,
    },
    ko: {
      label: '한국어',
      lang: 'ko-KR',
      link: '/ko/',
      ...koConfig,
    },
  },

  themeConfig: {
    ...sharedConfig.themeConfig,

    search: {
      provider: 'local',
      options: {
        locales: {
          root: enSearch,
          ko: koSearch,
        },
      },
    },
  },
});
