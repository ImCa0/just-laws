# AGENTS.md

本文件为 Codex (Codex.ai/code) 在此仓库中工作时提供指导。

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
├── .temp/                          # 法律原件、Markdown 输入及预览输出（不纳入版本控制）
│   ├── laws/                       # 308 部法律 Word 原件
│   └── laws_md/                    # 流水线默认输入（308 部法律 Markdown）
├── .agents/skills/                 # Codex 自定义技能
│   ├── law-pipeline/               # 默认法律收录流水线及规范化脚本
│   ├── addlaws/                    # 旧流程兼容说明（已弃用）
│   └── markitdown/                 # 文件格式转换
├── LAWS_PROGRESS.md                # 308 部法律收录进度跟踪
├── AGENTS.md                       # 本文件
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

## Agent 工作约定

### 法律收录默认流程

凡涉及新增、批量规范化或更新法律正文，Codex **默认优先使用
[`law-pipeline`](.agents/skills/law-pipeline/SKILL.md)**，不要按旧
`addlaws` 文档逐部手工整理。

执行顺序：

1. 从 `.temp/laws_md/*.md` 选择明确的输入文件，并显式传入脚本。
2. 先输出到 `.temp/law-pipeline/`，检查生成的 JSON 元数据和
   `warnings`。
3. 对附件、图片、表格、C 类拆分、标题截断及中文 fallback slug
   进行人工复核；必要时先维护
   `.agents/skills/law-pipeline/references/known_slugs.json`。
4. 确认无阻塞问题后使用 `--apply-site` 写入 `docs/`，由脚本同步
   category、C 类 sidebar 和 `LAWS_PROGRESS.md`。
5. 运行 `npm run docs:build`，再检查 `git diff`。

流水线不会替代内容审校，也不会比较新旧版本日期、备份旧文件或自动
创建 Git 提交。覆盖已有法律前，必须先确认输入确为应采用的最新有效
版本，并检查现有目录中是否有脚本不会清理的旧分编文件。

只有在流水线无法处理、需要诊断历史格式，或用户明确要求旧流程时，
才参考 [`addlaws`](.agents/skills/addlaws/SKILL.md)；即使如此，也应
优先修复或扩展流水线，而不是长期恢复手工整理路径。

### 可用技能

- **law-pipeline**：默认法律收录流水线（[文档](.agents/skills/law-pipeline/SKILL.md)）
- **markitdown**：文件格式转换（[文档](.agents/skills/markitdown/SKILL.md)）
- **addlaws**：已弃用的旧手工流程，仅作兼容参考（[文档](.agents/skills/addlaws/SKILL.md)）
