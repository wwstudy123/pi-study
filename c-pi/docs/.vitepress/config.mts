import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'Pi 学习笔记',
  description: '从零复刻 Pi（earendil-works/pi）的学习文档',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '功能地图', link: '/feature-map' }
    ],
    sidebar: [
      {
        text: '学习文档',
        items: [
          { text: '功能地图（复刻依据）', link: '/feature-map' }
        ]
      },
      {
        text: '调研底稿',
        items: [
          { text: '12 个库包详注', link: '/research/packages' },
          { text: '官方文档功能详注', link: '/research/features' },
          { text: 'apps 与仓库结构', link: '/research/apps-and-repo' }
        ]
      }
    ],
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新' },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单'
  }
})
