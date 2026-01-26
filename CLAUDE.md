# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

Just Laws 是一个基于 VuePress 的中华人民共和国法律文档站点，致力于将全部 292 部中国法律数字化为可访问、简洁且可搜索的格式。站点部署于 [justlaws.cn](https://www.justlaws.cn)。

## 开发命令

```bash
# 启动开发服务器
npm run docs:dev

# 构建生产版本
npm run docs:build
```

未配置单元测试和代码检查工具。

## 架构

### 技术栈
- **框架**: VuePress v2 (beta) 用于静态站点生成
- **部署**: GitHub Actions CI/CD，通过 SSH 部署到 nginx

### 目录结构

```
docs/
├── .vuepress/
│   ├── config.js       # 导航栏和侧边栏主配置
│   ├── client.js       # 客户端配置
│   ├── public/         # 静态资源（图片等）
│   └── styles/         # 自定义样式
├── constitution/              # 宪法
├── constitutional-relevance/  # 宪法相关法
├── civil-and-commercial/      # 民商法
├── administrative/            # 行政法
├── economic/                  # 经济法
├── social/                    # 社会法
├── criminal-law/              # 刑法
└── procedural/                # 程序法
```

每个分类文件夹包含单部法律的子目录（如 `economic/seed-law/`）。

### 导航配置

导航在 [docs/.vuepress/config.js](docs/.vuepress/config.js) 中配置。`navbar` 部分定义顶部导航菜单，`sidebar` 部分定义多页面法律的左侧导航。

## 添加新法律

本仓库的主要工作流程是添加新法律，请按以下步骤操作：

### 1. 创建法律目录
在相应的分类文件夹（如 `docs/economic/`）下，使用法律名称的英文翻译（小写、用连字符分隔）创建新子目录：
```
docs/economic/new-law-name/
```

### 2. 创建 README.md
对于少于 200 条的法律，创建单个 `README.md` 文件，格式如下：

```markdown
---
sidebar: auto
---

# 中华人民共和国[法律名称]

[立法修法记录 - 每条记录单独一行]
YYYY年M月D日...

## 第一章　章节标题

**第一条**　条文内容...
```

**关键格式规范：**
- 每行之间必须有空行，才能正确渲染
- 章标题：`## `（如 `## 第一章　总则`）
- 条号：`**第X条**`（加粗，后跟中文空格 `　`）
- 删除中文字符与数字之间的空格（如 `2000年7月8日`，而非 `2000 年 7 月 8 日`）

对于 200 条以上的法律，需拆分为多个 markdown 文件（可参考[民法典](docs/civil-and-commercial/civil-code/)）。

### 3. 更新导航配置
在 [docs/.vuepress/config.js](docs/.vuepress/config.js) 的相应 `navbar` 部分添加法律：

```javascript
{
  text: "经济法",
  children: [
    { text: "[法律名称]", link: "/category/law-folder-name/" },
  ],
},
```

### 4. 更新 README.md
更新根目录的 [README.md](README.md)：
- 增加计数：`已收录法律（xx/292）`
- 在相应分类下添加法律名称

### 5. 提交
使用以下提交信息格式：`📘 收录《XXX法》`（emoji 可选：📗📘📙📕）

## 内容来源

- **法律原文**: [国家法律法规数据库](https://flk.npc.gov.cn/) - 使用时效性为有效、公布日期为最新的版本
- **全量法律列表**: [全国人大网现行有效法律目录](http://www.npc.gov.cn/npc/c2/c30834/202512/t20251231_450944.html) - 包含 292 部法律的完整列表和分类信息
