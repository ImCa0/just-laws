---
name: law-pipeline
description: "默认法律收录流程：将 .temp/laws_md 中的法律 Markdown 批量规范化为 Just Laws VuePress 站点交付件，可配对读取 .temp/laws 中的 Word 原件，并同步 category、sidebar 与 LAWS_PROGRESS.md。"
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash]
license: MIT
source: https://github.com/justlaws/just-laws
---

# 法律收录流水线

这是仓库默认的法律收录技能。用于把 `.temp/laws_md` 中明确选定的文件作为输入，输出可部署的 Just Laws 站点文件。优先使用脚本完成机械格式整理和配置更新，遇到 warning 再人工复核；不要先按旧 `addlaws` 流程逐部手工整理。

## 输入与输出

输入：
- `.temp/laws_md/*.md`：法律原文 Markdown，也是默认输入目录；脚本不会自动扫描，必须显式传入文件。
- `.temp/laws/*.docx`：可选的同名 Word 原件；Markdown 含表格时，脚本优先读取其表格网格以保留合并单元格占位。
- `references/known_slugs.json`：预置的 `法律名 -> 分类/slug/type/编文件名` 映射。

输出：
- `docs/{category}/{slug}/`：法律正文交付件。
- `docs/category/{category}.md`：分类页链接。
- `docs/.vuepress/config.js`：仅 C 类法律新增 sidebar。
- `LAWS_PROGRESS.md`：收录状态、分类进度和总进度。
- 通过 `--json` 指定的 JSON：本次处理的法律元信息和 warnings。预览和正式执行均建议写入 `.temp/law-pipeline/`，不作为站点交付件提交。

## 核心命令

先在临时目录生成结果，查看 warnings：

```powershell
$inputs = @(Get-ChildItem .temp/laws_md -Filter *.md -File).FullName
python .agents/skills/law-pipeline/scripts/normalize_law.py @inputs `
  --out .temp\law-pipeline\out `
  --json .temp\law-pipeline\laws.json `
  --docs docs `
  --progress LAWS_PROGRESS.md `
  --known-slugs .agents\skills\law-pipeline\references\known_slugs.json `
  --only-uncollected
```

确认后写入站点交付件并同步配置：

```powershell
$inputs = @(Get-ChildItem .temp/laws_md -Filter *.md -File).FullName
python .agents/skills/law-pipeline/scripts/normalize_law.py @inputs `
  --out docs `
  --docs docs `
  --progress LAWS_PROGRESS.md `
  --json .temp\law-pipeline\applied-laws.json `
  --known-slugs .agents\skills\law-pipeline\references\known_slugs.json `
  --only-uncollected `
  --apply-site
```

`--apply-site` 要求 `--out` 与 `--docs` 指向同一个目录，避免只更新配置却没有把正文写进站点。

单部或小批量收录时，不要把整个目录传给脚本，应直接指定文件：

```powershell
$inputs = @(
  ".temp\laws_md\中华人民共和国种子法_20211224.md"
)
```

PowerShell 不应依赖把 `.temp\laws_md\*.md` 自动展开给 Python；先用 `Get-ChildItem` 收集文件，或显式列出输入。

## 脚本行为

- A 类法律：生成单个 `README.md`，不加 frontmatter。
- B 类法律：生成单个 `README.md`，添加 `sidebar: auto`。
- C 类法律：按民法典规则拆分为 `README.md` 和各编文件，并输出 C 类 warning。
- 保留原文标点；条号使用 `**第一条**　` 格式，支持 `第一百二十条之一`。
- `序言`、`附件一`、`附件二` 等整理为标题。
- 检测到图片、base64、附件、表格、疑似谱例或图示时输出 warning。
- 发现 MarkItDown 标题截断时，使用文件名中的完整标题并输出 warning。
- 未找到预置法律 slug 或编名 slug 时，使用中文原文作为目录/文件名并输出 warning，不自动生成英文 slug。
- `--only-uncollected` 只处理 `LAWS_PROGRESS.md` 中状态不是“已收录”的法律；表外输入会 warning 后跳过，避免批处理误收录。
- 对同一路径直接写入生成文件；不会比较版本日期、创建 `.old` 备份、删除旧分编文件或创建 Git 提交。

## 部署配置更新

启用 `--apply-site` 后脚本会同步：

- 在 `docs/category/{category}.md` 写入 `[{简称}](../{category}/{slug}/)`，已存在则跳过；新增后按法律简称拼音重排。
- 对 C 类法律，在 `docs/.vuepress/config.js` 的 `sidebar` 对象中插入该法律 children，children 不包含 `README.md`。
- 在 `LAWS_PROGRESS.md` 中把对应法律标记为 `✅ 已收录`，并重算顶部进度、分类进度、统计表和总计。

## 复核流程

1. 先运行临时输出命令，检查 `laws.json` 中的 `warnings`。
2. 对 warning 法律重点复核附件、表格、图片、C 类拆分、标题截断和中文 fallback 文件名。
3. 确认无阻塞问题后运行 `--apply-site`。
4. 运行构建验证：

```powershell
npm run docs:build
```

5. 检查 git diff，确认只包含本次应交付的正文、category、必要的 sidebar 和进度更新；JSON 预览文件应保留在 `.temp/`。

## 覆盖与更新边界

- 脚本从立法记录提取公布日期和最后修订日期写入 JSON，但不据此判断输入是否比站点版本更新。
- 更新已有法律前，人工确认输入来自有效且公布日期最新的版本。
- 如果 C 类法律的分编数量或文件名发生变化，脚本不会清理目标目录中的旧文件；应用后必须检查目录和 sidebar，手工删除确认废弃的文件。
- `--apply-site` 对已存在的 category 链接和 sidebar 路由会跳过；新增 category 链接后会调用 Node.js 排序脚本按拼音重排该分类页。

## 维护映射

优先从既有 `docs` slug 补全 `references/known_slugs.json`。没有既有翻译时，提前人工翻译并写入映射；不要依赖脚本在运行时自动生成英文 slug。
