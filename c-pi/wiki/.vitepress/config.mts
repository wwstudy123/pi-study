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
          text: 'pi-test.sh 陪读教程',
          items: [
            { text: '课程首页 · 这个文件是干什么的', link: '/shell/' },
            { text: '第 1 讲 · 开头两行', link: '/shell/01-opening-lines' },
            { text: '第 2 讲 · 找到自己的家', link: '/shell/02-find-home' },
            { text: '第 3 讲 · 收参数与分拣', link: '/shell/03-collect-args' },
            { text: '第 4 讲 · --no-env 与环境变量', link: '/shell/04-noenv-env' },
            { text: '第 5 讲 · 把地址翻译成网址', link: '/shell/05-path-to-url' },
            { text: '第 6 讲 · 点火发射', link: '/shell/06-launch' },
            { text: '第 7 讲 · 毕业总结', link: '/shell/07-graduation' }
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
