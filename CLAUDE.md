# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

Just Laws 是一个基于 VuePress 的中华人民共和国法律文档站点，致力于将全部中国法律数字化为可访问、简洁且可搜索的格式。站点部署于 [justlaws.cn](https://www.justlaws.cn)。

**技术栈**：VuePress v2 (beta) 静态站点生成，GitHub Actions CI/CD 部署到 nginx

## 目录结构

```
just-laws/
├── docs/                           # VuePress 文档根目录
│   ├── .vuepress/                  # VuePress 配置目录
│   │   ├── config.js               # 主配置（导航、侧边栏、搜索）
│   │   ├── client.js               # 客户端配置（统计脚本）
│   │   ├── public/images/          # 静态资源（logo.png）
│   │   └── styles/index.scss       # 全局样式（品牌色、布局）
│   │
│   ├── category/                   # 分类索引页（宪法相关法、民商法等）
│   │
│   ├── constitution/               # 宪法及修正案
│   ├── constitutional-relevance/   # 宪法相关法（54部）
│   ├── civil-and-commercial/       # 民商法（含民法典）
│   ├── administrative/             # 行政法（96部）
│   ├── economic/                   # 经济法（88部）
│   ├── social/                     # 社会法（30部）
│   ├── criminal-law/               # 刑法及修正案
│   └── procedural/                 # 程序法（刑诉、民诉、行诉）
│
├── .temp/laws_md/                  # 临时转换文件（不纳入版本控制）
├── .claude/skills/                 # 自定义技能（addlaws、markitdown）
├── LAWS_PROGRESS.md                # 308 部法律收录进度跟踪
├── CLAUDE.md                       # 本文件
└── package.json                    # 项目依赖配置
```

### 法律目录组织规则

法律按结构分为三种类型，处理方式不同：

**类型 A - 无章节**（如国旗法）：单文件，无需 frontmatter
```
constitutional-relevance/national-flag-law/
└── README.md
```

**类型 B - 有章节**（如种子法）：单文件，需要 `sidebar: auto`
```
economic/seed-law/
└── README.md              # 包含 frontmatter
```

**类型 C - 有编结构**（如民法典、刑法）：多文件拆分
```
civil-and-commercial/civil-code/
├── README.md              # 封面页（有 next frontmatter）
├── 01-general-principles.md   # 第一编（有 prev frontmatter）
├── 02-property-rights.md      # 第二编（无 frontmatter）
└── ...
```

## 配置文件说明

### [docs/.vuepress/config.js](docs/.vuepress/config.js)

VuePress 主配置文件，定义站点行为和外观。

**基础配置**：`lang`、`title`、`description`、`head`（百度统计脚本）

**主题配置**：
- `navbar`: 顶部导航菜单（分类下拉、法律链接）
- `sidebar`: 左侧侧边栏（按路径前缀匹配）
- `logo`: `/images/logo.png`
- `repo`: GitHub 仓库地址
- `editLinkText`、`lastUpdated`、`contributors`：编辑链接和元信息显示

**插件**：`docsearchPlugin`（Algolia 搜索）

### [docs/.vuepress/client.js](docs/.vuepress/client.js)

客户端增强配置，实现百度统计路由追踪（每次路由切换发送页面浏览事件）。

### [docs/.vuepress/styles/index.scss](docs/.vuepress/styles/index.scss)

全局样式覆盖，定义品牌色（`--c-brand: #DE2910` 中国红）和内容区宽度（`max-width: 740px`）。

### [LAWS_PROGRESS.md](LAWS_PROGRESS.md)

全量法律列表和收录进度跟踪，包含各分类的已收录/总数/百分比统计，以及 308 部法律的完整清单（名称、日期、收录状态）。用于追踪进度和确定法律分类归属。

## 内容来源

- **法律原文**: [国家法律法规数据库](https://flk.npc.gov.cn/)（时效性为有效、公布日期为最新）
- **全量法律列表**: [全国人大网现行有效法律目录](http://www.npc.gov.cn/npc/c2/c30834/202512/t20251231_450944.html)（308 部法律完整列表和分类）

## 可用技能

- **addlaws**: 自动化法律收录（[文档](.claude/skills/addlaws/SKILL.md)）
- **markitdown**: 文件格式转换（[文档](.claude/skills/markitdown/SKILL.md)）
