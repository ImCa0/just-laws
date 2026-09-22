const path = require("node:path");

const { lawArticleAnchorsPlugin } = require("./markdown/lawArticleAnchors");
const { lawVersionsPlugin } = require("./plugins/lawVersions");
const { lawCatalogPlugin } = require("./plugins/lawCatalog");
const { justLawsTheme } = require("./theme");

module.exports = {
  lang: "zh-CN",
  title: "Just Laws",
  description: "清晰、可检索、适合长期阅读的中华人民共和国法律文库",
  head: [
    ["link", { rel: "icon", href: "/images/logo.svg" }],
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
  extendsMarkdown: (md) => {
    md.use(lawArticleAnchorsPlugin);
  },

  theme: justLawsTheme({
    logo: "/images/logo.svg",
    navbar: [
      { text: "首页", link: "/" },
      { text: "分类", link: "/category/" },
      { text: "留言板", link: "/MessageBoard/" },
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
    editLink: false,
    lastUpdated: false,
    contributors: false,
    notFound: ["页面未找到"],
    backToHome: "回到主页",
    toggleColorMode: "切换夜间模式",
    toggleSidebar: "切换侧边栏",
  }),

  plugins: [
    lawVersionsPlugin({ docsDir: path.resolve(__dirname, "..") }),
    lawCatalogPlugin({ docsDir: path.resolve(__dirname, "..") }),
  ],
};
