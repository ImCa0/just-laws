const { defaultTheme } = require("@vuepress/theme-default");
const { docsearchPlugin } = require("@vuepress/plugin-docsearch");

module.exports = {
  lang: " ",
  title: "Just Laws",
  description: "法律和法律都是相互依存的",
  head: [
    ["link", { rel: "icon", href: "/images/logo.png" }],
    [
      "script",
      {},
      `var _hmt = _hmt || [];
      (function () {
        var hm = document.createElement('script')
        hm.src = 'https://hm.baidu.com/hm.js?f1b6f06a4a48c2db87fcba1a4b3c3ac4'
        var s = document.getElementsByTagName('script')[0]
        s.parentNode.insertBefore(hm, s)
      })()`,
    ],
  ],

  theme: defaultTheme({
    logo: "/images/logo.png",
    navbar: [
      {
        text: "宪法",
        children: [
          { text: "宪法", link: "/constitution/", activeMatch: "/constitution/[^(amendment)]" },
          { text: "宪法修正案", link: "/constitution/amendment/" },
        ],
      },
      {
        text: "宪法相关法",
        children: [
          { text: "国旗法", link: "/constitutional-relevance/national-flag-law/" },
          { text: "国徽法", link: "/constitutional-relevance/national-emblem-law/" },
          { text: "立法法", link: "/constitutional-relevance/legislation-law/" },
          { text: "国歌法", link: "/constitutional-relevance/national-anthem-law/" },
        ],
      },
      {
        text: "民商法",
        children: [
          { text: "民法典", link: "/civil-and-commercial/civil-code/" },
          { text: "著作权法", link: "/civil-and-commercial/copyright-law/" },
          { text: "消费者权益保护法", link: "/civil-and-commercial/protection-of-the-rights-and-interests-of-consumers/" },
          { text: "公司法", link: "/civil-and-commercial/company-law/" },
        ],
      },
      {
        text: "行政法",
        children: [
          { text: "野生动物保护法", link: "/administrative/protection-of-wildlife/" },
          { text: "传染病防治法", link: "/administrative/prevention-and-treatment-of-infections-diseases/" },
          { text: "环境保护法", link: "/administrative/environment-protection/" },
          { text: "行政处罚法", link: "/administrative/administrative-penalty/" },
          { text: "治安管理处罚法", link: "/administrative/penalties-for-administration-of-public-security/" },
          { text: "义务教育法", link: "/administrative/compulsory education-law/" },
        ],
      },
      {
        text: "经济法",
        children: [
          { text: "个人所得税法", link: "/economic/individual-income-tax-law/" },
          { text: "种子法", link: "/economic/seed-law/" },
          { text: "网络安全法", link: "/economic/cybersecurity-law/" },
          { text: "数据安全法", link: "/economic/data-security-law/" },
          { text: "个人信息保护法", link: "/economic/personal-information-protection-law/" },
          { text: "反垄断法", link: "/economic/anti monopoly law/" },
        ],
      },
      {
        text: "社会法",
        children: [
          { text: "未成年人保护法", link: "/social/protection-of-minors/" },
          { text: "劳动法", link: "/social/labor-law/" },
          { text: "预防未成年人犯罪法", link: "/social/prevention-of-juvenile-delinquency/" },
          { text: "安全生产法", link: "/social/work-safety-law/" },
        ],
      },
      {
        text: "刑法",
        children: [
          { text: "刑法", link: "/criminal-law/criminal-law/" },
          { text: "刑法修正案", link: "/criminal-law/amendment/" },
          { text: "反有组织犯罪法", link: "/criminal-law/anti-organized-crime-law/" },
          { text: "反电信网络诈骗法", link: "/criminal-law/combating-telecom-and-online-fraud/" },
        ],
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
      "/criminal-law/criminal-law/": [
        {
          text: "中华人民共和国刑法",
          children: [
            "/criminal-law/criminal-law/第一编 总则.md",
            "/criminal-law/criminal-law/第二编 分则.md",
            "/criminal-law/criminal-law/附则.md",
          ],
        },
      ],
      "/criminal-law/amendment/": [
        {
          text: "目录",
          children: [
            "/criminal-law/amendment/中华人民共和国刑法修正案.md",
            "/criminal-law/amendment/中华人民共和国刑法修正案（二）.md",
            "/criminal-law/amendment/中华人民共和国刑法修正案（三）.md",
            "/criminal-law/amendment/中华人民共和国刑法修正案（四）.md",
            "/criminal-law/amendment/中华人民共和国刑法修正案（五）.md",
            "/criminal-law/amendment/中华人民共和国刑法修正案（六）.md",
            "/criminal-law/amendment/中华人民共和国刑法修正案（七）.md",
            "/criminal-law/amendment/中华人民共和国刑法修正案（八）.md",
            "/criminal-law/amendment/中华人民共和国刑法修正案（九）.md",
            "/criminal-law/amendment/中华人民共和国刑法修正案（十）.md",
            "/criminal-law/amendment/中华人民共和国刑法修正案（十一）.md",
          ],
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
    repo: "https://github.com/ImCa0/just-laws",
    docsRepo: "https://github.com/ImCa0/just-laws",
    docsBranch: "master",
    docsDir: "docs",
    editLinkText: "在 GitHub 上编辑此页",
    lastUpdated: true,
    lastUpdatedText: "上次更新",
    contributors: true,
    contributorsText: "贡献者",
    notFound: ["页面未找到"],
    backToHome: "回到主页",
    toggleColorMode: "切换夜间模式",
    toggleSidebar: "切换侧边栏",
  }),

  plugins: [
    docsearchPlugin({
      apiKey: "c1b57ecf806bfe5c370d3de23b858065",
      appId: "M6984MENBN",
      indexName: "just_laws",
      searchParameters: {
        attributesToSnippet: ["lvl1:30", "content:25"],
      },
      locales: {
        "/": {
          placeholder: "搜索文档",
          translations: {
            button: {
              buttonText: "搜索文档",
              buttonAriaLabel: "搜索文档",
            },
            modal: {
              searchBox: {
                resetButtonTitle: "清除查询条件",
                resetButtonAriaLabel: "清除查询条件",
                cancelButtonText: "取消",
                cancelButtonAriaLabel: "取消",
              },
              startScreen: {
                recentSearchesTitle: "搜索历史",
                noRecentSearchesText: "没有搜索历史",
                saveRecentSearchButtonTitle: "保存至搜索历史",
                removeRecentSearchButtonTitle: "从搜索历史中移除",
                favoriteSearchesTitle: "收藏",
                removeFavoriteSearchButtonTitle: "从收藏中移除",
              },
              errorScreen: {
                titleText: "无法获取结果",
                helpText: "你可能需要检查你的网络连接",
              },
              footer: {
                selectText: "选择",
                navigateText: "切换",
                closeText: "关闭",
                searchByText: "搜索提供者",
              },
              noResultsScreen: {
                noResultsText: "无法找到相关结果",
                suggestedQueryText: "你可以尝试查询",
                reportMissingResultsText: "你认为该查询应该有结果？",
                reportMissingResultsLinkText: "点击反馈",
              },
            },
          },
        },
      },
    }),
  ],
};
