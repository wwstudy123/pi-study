import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'Pi 支线知识库',
  description: '一条支线一个主题，跟着 Pi 源码一点点啃基础',
  themeConfig: {
    nav: [
      { text: '支线首页', link: '/' },
      { text: 'Shell 支线', link: '/shell/' }
    ],
    sidebar: {
      // 每条支线独立侧栏，互不干扰
      '/shell/': [
        {
          text: 'Shell 脚本支线',
          items: [
            { text: '本支线首页', link: '/shell/' },
            { text: '01 · pi-test.sh 是干什么的', link: '/shell/01-what-is-pi-test-sh' },
            { text: '02 · 第一行与三根保险丝', link: '/shell/02-shebang-and-set' },
            { text: '03 · 脚本怎么知道自己在哪', link: '/shell/03-script-dir' },
            { text: '04 · 认参数：--no-env 是怎么被认出来的', link: '/shell/04-args-and-no-env' },
            { text: '05 · unset：把 API key 全部扔掉', link: '/shell/05-unset-api-keys' },
            { text: '06 · 路径变 URL：RESOLVER_URL', link: '/shell/06-resolver-url' },
            { text: '07 · 最后一行：真正启动 Pi', link: '/shell/07-last-line-node' },
            { text: '08 · 动手实验（改脚本）', link: '/shell/08-hands-on' },
            { text: '09 · 自检与常见问题', link: '/shell/09-faq' }
          ]
        }
      ]
    },
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新' },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单'
  }
})
