const { defaultTheme } = require("@vuepress/theme-default");
const { docsearchPlugin } = require("@vuepress/plugin-docsearch");
const { categoryNavbarItem } = require("./category-navigation");

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
        text: "全部类别",
        link: "/category/",
      },
      {
        text: "宪法",
        link: "/constitution/",
      },
      categoryNavbarItem({
        text: "宪法相关法",
        slug: "constitutional-relevance",
        featured: [
          "立法法",
          "全国人民代表大会组织法",
          "全国人民代表大会和地方各级人民代表大会选举法",
          "民族区域自治法",
          "香港特别行政区基本法",
        ],
      }),
      categoryNavbarItem({
        text: "民商法",
        slug: "civil-and-commercial",
        featured: [
          "民法典",
          "公司法",
          "证券法",
          "消费者权益保护法",
          "著作权法",
        ],
      }),
      categoryNavbarItem({
        text: "行政法",
        slug: "administrative",
        featured: [
          "行政处罚法",
          "行政许可法",
          "行政复议法",
          "治安管理处罚法",
          "道路交通安全法",
        ],
      }),
      categoryNavbarItem({
        text: "经济法",
        slug: "economic",
        featured: [
          "个人所得税法",
          "中国人民银行法",
          "个人信息保护法",
          "反垄断法",
          "税收征收管理法",
        ],
      }),
      categoryNavbarItem({
        text: "社会法",
        slug: "social",
        featured: [
          "劳动法",
          "劳动合同法",
          "社会保险法",
          "未成年人保护法",
          "安全生产法",
        ],
      }),
      categoryNavbarItem({
        text: "生态环境法",
        slug: "ecological-environment",
        featured: [
          "生态环境法典",
          "环境保护法",
          "水污染防治法",
          "大气污染防治法",
          "土壤污染防治法",
        ],
      }),
      categoryNavbarItem({
        text: "刑法",
        slug: "criminal-law",
        featured: [
          "刑法",
          "反恐怖主义法",
          "反间谍法",
          "反有组织犯罪法",
          "反电信网络诈骗法",
        ],
      }),
      categoryNavbarItem({
        text: "程序法",
        slug: "procedural",
        featured: [
          "刑事诉讼法",
          "民事诉讼法",
          "行政诉讼法",
          "仲裁法",
          "人民调解法",
        ],
      }),
    ],
    sidebar: {
      "/ecological-environment/ecological-environment-code/": [
        {
          text: "中华人民共和国生态环境法典",
          children: [
            "/ecological-environment/ecological-environment-code/01-general-principles.md",
            "/ecological-environment/ecological-environment-code/02-pollution-prevention-and-control.md",
            "/ecological-environment/ecological-environment-code/03-ecological-protection.md",
            "/ecological-environment/ecological-environment-code/04-green-and-low-carbon-development.md",
            "/ecological-environment/ecological-environment-code/05-legal-liability-and-supplementary.md",
          ],
        },
      ],
      "/category/": [
        {
          text: "类别",
          children: [
            "/category/constitutional-relevance",
            "/category/civil-and-commercial",
            "/category/administrative",
            "/category/economic",
            "/category/social",
            "/category/ecological-environment",
            "/category/criminal-law",
            "/category/procedural",
          ]
        }
      ],
      "/constitution/": [
        {
          text: "中华人民共和国宪法",
          children: [
            "/constitution/preamble.md",
            "/constitution/01-general-principles.md",
            "/constitution/02-civil-rights-and-duties.md",
            "/constitution/03-state-institutions.md",
            "/constitution/04-flag-anthem-emblem-capital.md",
            "/constitution/05-amendment.md",
          ],
        },
      ],
      "/criminal-law/criminal-law/": [
        {
          text: "中华人民共和国刑法",
          children: [
            "/criminal-law/criminal-law/01-general-provisions.md",
            "/criminal-law/criminal-law/02-specific-provisions.md",
            "/criminal-law/criminal-law/03-supplementary.md",
            "/criminal-law/criminal-law/04-amendment.md",
            "/criminal-law/criminal-law/05-foreign-exchange-crimes-decision.md",
          ],
        },
      ],
      "/procedural/criminal-procedure/": [
        {
          text: "中华人民共和国刑事诉讼法",
          children: [
            "/procedural/criminal-procedure/01-general-provisions.md",
            "/procedural/criminal-procedure/02-filing-investigation-prosecution.md",
            "/procedural/criminal-procedure/03-trial.md",
            "/procedural/criminal-procedure/04-enforcement.md",
            "/procedural/criminal-procedure/05-special-procedures.md",
            "/procedural/criminal-procedure/00-supplementary.md",
          ],
        },
      ],
      "/procedural/civil-procedure/": [
        {
          text: "中华人民共和国民事诉讼法",
          children: [
            "/procedural/civil-procedure/01-general-provisions.md",
            "/procedural/civil-procedure/02-trial-procedure.md",
            "/procedural/civil-procedure/03-execution-procedure.md",
            "/procedural/civil-procedure/04-special-provisions-for-foreign-related-civil-procedure.md",
          ],
        },
      ],
      "/civil-and-commercial/civil-code/": [
        {
          text: "中华人民共和国民法典",
          children: [
            "/civil-and-commercial/civil-code/01-general-principles.md",
            "/civil-and-commercial/civil-code/02-property-rights.md",
            "/civil-and-commercial/civil-code/03-contracts.md",
            "/civil-and-commercial/civil-code/04-personality-rights.md",
            "/civil-and-commercial/civil-code/05-marriage-and-family.md",
            "/civil-and-commercial/civil-code/06-inheritance.md",
            "/civil-and-commercial/civil-code/07-tort-liability.md",
            "/civil-and-commercial/civil-code/00-supplementary.md",
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
