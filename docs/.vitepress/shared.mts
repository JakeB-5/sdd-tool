import { defineConfig } from 'vitepress';

export const sharedConfig = defineConfig({
  title: 'SDD Tool',
  base: '/sdd-tool/',

  head: [['link', { rel: 'icon', href: '/sdd-tool/favicon.ico' }]],

  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/JakeB-5/sdd-tool' },
    ],

    footer: {
      message: 'MIT License',
      copyright: 'Copyright © 2025 JakeB-5',
    },

    editLink: {
      pattern: 'https://github.com/JakeB-5/sdd-tool/edit/main/docs/:path',
    },
  },
});
