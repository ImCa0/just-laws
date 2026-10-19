<p align="center">
  <a href="https://www.justlaws.cn/">
    <img src="docs/.vuepress/public/images/logo.svg" width="80" height="80" alt="Just Laws 标志">
  </a>
</p>

<h1 align="center">Just Laws</h1>

<p align="center"><strong>法律原文，清晰可读。</strong></p>

<p align="center">
  一个开源的中华人民共和国法律文库。<br>
  从查找一部法律，到定位一条规定，让每一次查阅更简单。
</p>

<p align="center">
  <a href="https://www.justlaws.cn/"><img src="https://img.shields.io/badge/在线阅读-justlaws.cn-B92419?style=flat" alt="在线阅读 justlaws.cn"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-2563EB?style=flat" alt="MIT License"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/Powered_by-VuePress_2-42B883?style=flat" alt="基于 VuePress 2"></a>
</p>

<p align="center">
  <a href="https://github.com/ImCa0/just-laws"><img src="https://shieldcn.dev/badge/dynamic/json.svg?url=https%3A%2F%2Fshieldcn.dev%2Fgithub%2FImCa0%2Fjust-laws%2Fstars.json&query=%24.value&prefix=%E2%98%85+&label=GitHub&logo=github&variant=outline&mode=light&color=505A75&labelTextColor=505A75&valueColor=343B4C&gradient=ffffff%2Cffffff&height=36&fontSize=12&iconSize=20&gap=8&labelGap=14&padX=17" alt="GitHub Stars" width="156" height="36"></a>
  <a href="https://atomgit.com/ImCaO/just-laws"><img src="https://shieldcn.dev/badge/dynamic/json.svg?url=https%3A%2F%2Fimg.shields.io%2Fbadge%2Fdynamic%2Fxml.json%3Furl%3Dhttps%253A%252F%252Fgitcode.com%252FImCaO%252Fjust-laws%252Fstar%252Fnew_badge.svg%26query%3Dsubstring-before%2528%252F%252F*%255Blocal-name%2528%2529%253D%2522text%2522%255D%252C%2522%2BStar%2522%2529%26label%3DAtomGit&query=%24.message&prefix=%E2%98%85+&label=AtomGit&logo=gitcode&variant=outline&mode=light&color=DA203E&labelTextColor=DA203E&valueColor=343B4C&gradient=ffffff%2Cffffff&height=36&fontSize=12&iconSize=20&gap=8&labelGap=14&padX=21" alt="AtomGit Stars" width="156" height="36"></a>
</p>

<p align="center">
  <a href="https://www.justlaws.cn/">访问网站</a> ·
  <a href="CONTRIBUTING.md">参与贡献</a> ·
  <a href="https://github.com/ImCa0/just-laws/issues">反馈问题</a>
</p>

<p align="center">
  <a href="https://www.justlaws.cn/">
    <img src=".github/assets/showcase.jpg" alt="Just Laws 三端产品展示：PC 首页、PAD 宪法正文、PHONE 个人所得税税率表一" width="100%">
  </a>
</p>

## 为查阅而设计

Just Laws 将法律原文整理为结构清晰的数字文本。你可以按类别浏览，也可以搜索法律名称、罪名或法条内容，直接进入相关正文。

| 功能 | 使用体验 |
| --- | --- |
| **搜索法律与条文** | 同时检索法律名称、罪名和法条内容，点击结果直达对应位置。 |
| **按类别浏览** | 提供宪法独立入口与八个法律类别，支持名称筛选、卡片和列表视图。 |
| **沿章节阅读** | 保留编、章、节与条文结构，长法典按编拆分，侧边目录帮助快速定位。 |
| **定位与分享法条** | 在阅读工具中输入条号跳转，通过固定条文链接分享与引用。 |
| **辨别法律版本** | 对已配置多版本的法律，展示现行、历史与尚未生效版本及施行日期。 |
| **随处继续阅读** | 适配桌面与移动端，支持夜间模式。 |

<details>
  <summary><strong>查看正文阅读界面</strong></summary>

<p>以《民法典》为例：左侧按编、章导航，正文突出条号，阅读工具支持直接跳转条文。</p>

<p align="center">
  <img src=".github/assets/reader.jpg" alt="民法典总则阅读界面：章节导航、阅读工具与法条正文" width="100%">
</p>

</details>

## 开始阅读

从 [中华人民共和国宪法](https://www.justlaws.cn/constitution/preamble.html) 开始，或进入与你关心的问题相关的类别：

[宪法相关法](https://www.justlaws.cn/category/constitutional-relevance.html) · [民商法](https://www.justlaws.cn/category/civil-and-commercial.html) · [行政法](https://www.justlaws.cn/category/administrative.html) · [经济法](https://www.justlaws.cn/category/economic.html)

[社会法](https://www.justlaws.cn/category/social.html) · [生态环境法](https://www.justlaws.cn/category/ecological-environment.html) · [刑法](https://www.justlaws.cn/category/criminal-law.html) · [诉讼与非诉讼程序法](https://www.justlaws.cn/category/procedural.html)

## 收录与来源

法律正文来源于 [国家法律法规数据库](https://flk.npc.gov.cn/)，收录范围以全国人大网发布的现行有效法律目录为参照。

完整清单、目录基准日期、收录进度与待更新事项见 [法律收录进度](LAWS_PROGRESS.md)。收录率按是否已有正文统计；具体版本与生效日期请结合正文页面和官方原文核对。

## 本地运行

项目基于 **VuePress 2** 构建，使用 **GitHub Actions** 构建并部署。安装 Node.js 与 npm 后运行：

```bash
git clone https://github.com/ImCa0/just-laws.git
cd just-laws
npm ci
npm run docs:dev
```

打开终端输出的本地地址即可预览。构建静态站点：

```bash
npm run docs:build
```

构建产物位于 `docs/.vuepress/dist/`。开发和构建命令会先校验法律版本、罪名数据，再生成搜索索引。

## 一起完善文库

欢迎通过 [Issue](https://github.com/ImCa0/just-laws/issues) 或 [Pull Request](https://github.com/ImCa0/just-laws/pulls) 参与：

- **纠正内容**：指出错字、缺漏或版本问题，附上法律名称、条号及官方来源。
- **收录与更新法律**：按 [贡献指南](CONTRIBUTING.md) 准备原文，使用法律流水线生成预览并审校。
- **改进阅读体验**：完善搜索、导航、样式与无障碍访问，也欢迎提出使用建议。

也可以到 [站点留言板](https://www.justlaws.cn/MessageBoard/) 留下反馈。感谢每一位帮助核对内容、提交修正与分享建议的贡献者。

## 开源许可

项目采用 [MIT License](LICENSE)。
