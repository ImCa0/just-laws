module.exports = {
  lang: "zh-CN",
  title: "Just Laws",
  description: "法律和法律都是相互依存的",
  head: [
    ["link", { rel: "icon", href: "/images/logo.png" }],
    ["script", { src: "https://hm.baidu.com/hm.js?f1b6f06a4a48c2db87fcba1a4b3c3ac4" }],
  ],

  themeConfig: {
    logo: "/images/logo.png",
    navbar: [
      {
        text: "宪法",
        link: "/constitution/",
      },
      {
        text: "民商法",
        children: [{ text: "民法典", link: "/civil-and-commercial/civil-code/" }],
      },
      {
        text: "行政法",
        children: [{ text: "治安管理处罚法", link: "/administrative/penalties-for-administration-of-public-security" }],
      },
      {
        text: "经济法",
        children: [{ text: "个人所得税法", link: "/economic/individual-income-tax-law/" }],
      },
      {
        text: "社会法",
        children: [
          { text: "劳动法", link: "/social/labor-law/" },
          { text: "未成年人保护法", link: "/social/protection-of-minors/" },
          { text: "预防未成年人犯罪法", link: "/social/prevention-of-juvenile-delinquency/" },
        ],
      },
      {
        text: "刑法",
        children: [{ text: "刑法", link: "/criminal-law/" }],
      },
      {
        text: "程序法",
        children: [
          { text: "刑事诉讼法", link: "/procedural/criminal-procedure/" },
          { text: "行政诉讼法", link: "/procedural/administrative-procedure/" },
          { text: "民事诉讼法", link: "/procedural/civil-procedure/" },
        ],
      },
    ],
    sidebar: {
      "/constitution/": [
        {
          text: "中华人民共和国宪法",
          children: [
            "/constitution/序言.md",
            "/constitution/第一章 总纲.md",
            "/constitution/第二章 公民的基本权利和义务.md",
            "/constitution/第三章 国家机构.md",
            "/constitution/第四章 国旗、国歌、国徽、首都.md",
          ],
        },
      ],
      "/criminal-law/": [
        {
          text: "中华人民共和国刑法",
          children: ["/criminal-law/第一编 总则.md", "/criminal-law/第二编 分则.md", "/criminal-law/附则.md"],
        },
      ],
      "/procedural/criminal-procedure/": [
        {
          text: "中华人民共和国刑事诉讼法",
          children: [
            "/procedural/criminal-procedure/第一编 总则.md",
            "/procedural/criminal-procedure/第二编 立案、侦查和提起公诉.md",
            "/procedural/criminal-procedure/第三编 审判.md",
            "/procedural/criminal-procedure/第四编 执行.md",
            "/procedural/criminal-procedure/第五编 特别程序.md",
            "/procedural/criminal-procedure/附则.md",
          ],
        },
      ],
      "/procedural/civil-procedure/": [
        {
          text: "中华人民共和国民事诉讼法",
          children: [
            "/procedural/civil-procedure/第一编 总则.md",
            "/procedural/civil-procedure/第二编 审判程序.md",
            "/procedural/civil-procedure/第三编 执行程序.md",
            "/procedural/civil-procedure/第四编 涉外民事诉讼程序的特别规定.md",
          ],
        },
      ],
      "/civil-and-commercial/civil-code/": [
        {
          text: "中华人民共和国民法典",
          children: [
            "/civil-and-commercial/civil-code/第一编 总则.md",
            "/civil-and-commercial/civil-code/第二编 物权.md",
            "/civil-and-commercial/civil-code/第三编 合同.md",
            "/civil-and-commercial/civil-code/第四编 人格权.md",
            "/civil-and-commercial/civil-code/第五编 婚姻家庭.md",
            "/civil-and-commercial/civil-code/第六编 继承.md",
            "/civil-and-commercial/civil-code/第七编 侵权责任.md",
            "/civil-and-commercial/civil-code/附则.md",
          ],
        },
      ],
    },
    docsRepo: "https://github.com/ImCa0/just-laws",
    docsBranch: "master",
    docsDir: "docs",
    editLinkText: "在 GitHub 上编辑此页",
    lastUpdated: false,
    contributors: false,
    notFound: ["页面未找到"],
    backToHome: "回到主页",
    toggleDarkMode: "切换夜间模式",
    toggleSidebar: "切换侧边栏",
  },

  plugins: [
    [
      "@vuepress/plugin-search",
      {
        locales: {
          "/": {
            placeholder: "搜索",
          },
        },
        maxSuggestions: 10,
      },
    ],
  ],
};
