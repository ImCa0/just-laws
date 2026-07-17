---
name: law-pipeline
description: "默认法律收录与更新流程：将 .temp/laws_md 中的法律 Markdown 规范化为 Just Laws VuePress 站点交付件，可配对读取 Word 原件，同步 category、sidebar 与 LAWS_PROGRESS.md；更新已有法律时识别当前、未来和历史版本，维护 versions.json、多版本页面及生效日轮换。"
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
- `docs/{category}/{slug}/versions.json` 与 `versions/{effectiveFrom}/README.md`：已有单文件法律出现新版本时的版本元数据和非现行正文。
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

## 更新已有法律与多版本展示

更新已收录法律时，先判断是同一版本的内容勘误，还是具有独立公布、生效记录的新版本。勘误直接修正对应正文，不创建版本；新修订、修正或重新公布的正文按下述流程处理。

当前版本能力只完整支持单文件 A/B 类法律。C 类法律的各编页面尚不能整体切换版本；遇到 C 类更新时停止应用，先扩展版本路由、sidebar 和轮换脚本，不要只给封面页添加 `versions.json`。

### 1. 预览规范化结果

显式传入已有法律的输入文件，移除 `--only-uncollected`，只输出到临时目录，不使用 `--apply-site`：

```powershell
$inputs = @(
  ".temp\laws_md\中华人民共和国商标法_20260626.md"
)
python .agents/skills/law-pipeline/scripts/normalize_law.py @inputs `
  --out .temp\law-pipeline\out `
  --json .temp\law-pipeline\updated-laws.json `
  --docs docs `
  --progress LAWS_PROGRESS.md `
  --known-slugs .agents\skills\law-pipeline\references\known_slugs.json
```

复核临时 `README.md`、warnings、公布日期和生效日期，并与站点根目录正文、现有 `versions.json` 和立法记录比较。日期状态统一按北京时间判断。

### 2. 按时效分流

- **未来版本**：根目录继续保存当前有效正文；把规范化后的新正文放到 `versions/{effectiveFrom}/README.md`，新增或更新 `versions.json`。禁止对未来版本运行 `--apply-site`，否则会提前覆盖现行正文。
- **已经生效的新版本**：也先把新正文放到 `versions/{effectiveFrom}/README.md` 并登记元数据，再运行轮换预览和 `--apply`；不要手工交换根目录与版本目录。
- **历史版本补录**：放到 `versions/{effectiveFrom}/README.md` 并登记实际 `effectiveTo`，不执行轮换。
- **同版本勘误**：修正该版本现有入口；若修正现行版则修改根目录，若修正历史或未来版则修改对应 `versions/` 入口，不新增版本记录。

根目录 `README.md` 始终是当前有效版本。`versions/` 只保存未来版或历史版，不复制当前有效正文。

### 3. 维护版本元数据

版本文件固定使用以下结构，不写入派生状态或来源链接：

```json
{
  "schemaVersion": 1,
  "lawId": "civil-and-commercial/trademark-law",
  "title": "中华人民共和国商标法",
  "versions": [
    {
      "id": "2019-amendment",
      "label": "2019年修正版",
      "promulgatedOn": "2019-04-23",
      "effectiveFrom": "2019-11-01",
      "effectiveTo": "2027-01-01",
      "entry": "README.md"
    },
    {
      "id": "2026-revision",
      "label": "2026年修订版",
      "promulgatedOn": "2026-06-26",
      "effectiveFrom": "2027-01-01",
      "effectiveTo": null,
      "entry": "versions/2027-01-01/README.md"
    }
  ]
}
```

约束：

- `effectiveTo` 是不包含该日的失效日期；相邻版本通常满足旧版 `effectiveTo ==` 新版 `effectiveFrom`。
- 各区间不得重叠，日期必须为 `YYYY-MM-DD`，`id` 和 `entry` 不得重复。
- 必须恰好一个版本使用根目录 `README.md`，且该版本必须是校验日期的当前有效版本。
- `status`、展示用截止日和页面路径由构建时派生，不持久化。
- `LAWS_PROGRESS.md` 的年份表示最新公布版本，不用生效状态覆盖，也不因版本轮换重复新增法律。

### 4. 校验与生效日轮换

登记未来版本或历史版本后先校验：

```powershell
npm run laws:versions:validate
```

如果登记时新版已经生效，旧版仍在根目录会触发“现行版本尚未提升”的预期校验错误；此时不要运行构建或绕过校验，直接使用下述 `promote` 命令预览，应用轮换后再执行完整校验。

新版本生效时，先预览：

```powershell
npm run laws:versions:promote -- civil-and-commercial/trademark-law --as-of 2027-01-01
```

确认预览会把旧根正文归档到 `versions/{旧版effectiveFrom}/README.md`、把新正文提升到根目录并移除原未来版目录后，再应用：

```powershell
npm run laws:versions:promote -- civil-and-commercial/trademark-law --as-of 2027-01-01 --apply
```

轮换后再次运行版本校验和 `npm run docs:build`。搜索只索引法律根目录直接 Markdown：生效前应只搜到当前版，轮换后自动改为搜索新版；不要把 `versions/` 加入搜索索引。

## 覆盖与更新边界

- 脚本从立法记录提取公布日期和最后修订日期写入 JSON，但不据此判断输入是否比站点版本更新。
- 更新已有法律前，人工确认输入的公布日期、生效日期和时效状态；最新公布版本可能尚未生效，不能因此直接覆盖根目录。
- 如果 C 类法律的分编数量或文件名发生变化，脚本不会清理目标目录中的旧文件；应用后必须检查目录和 sidebar，手工删除确认废弃的文件。
- `--apply-site` 对已存在的 category 链接和 sidebar 路由会跳过；新增 category 链接后会调用 Node.js 排序脚本按拼音重排该分类页。

## 维护映射

优先从既有 `docs` slug 补全 `references/known_slugs.json`。没有既有翻译时，提前人工翻译并写入映射；不要依赖脚本在运行时自动生成英文 slug。
