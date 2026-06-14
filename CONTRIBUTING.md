# JustLaws 法律文库贡献指南

感谢您贡献法律到 JustLaws 项目！仓库使用 `law-pipeline` 脚本统一完成法律格式化和站点配置同步。

## 前提条件

1. **已安装 Python 和 Node.js**：分别用于运行法律流水线和 VuePress 构建
2. **已 Fork 并 Clone 仓库**：`git clone https://github.com/{YOUR-USERNAME}/just-laws.git`

## 收录流程

### 步骤 1：创建临时目录

`.temp` 目录在 `.gitignore` 中，不会被提交到 Git。您需要手动创建：

```bash
mkdir -p .temp/laws
mkdir -p .temp/laws_md
```

或者手动创建这两个文件夹。

**目录结构**：
```
.just-laws/
├── .temp/              # 临时文件（不提交到 Git）
│   ├── laws/           # 原始法律文档（DOCX/PDF）
│   └── laws_md/        # 法律 Markdown 输入
├── docs/               # 站点文档
└── .agents/skills/     # Agent 技能和流水线脚本
```

### 步骤 2：下载法律原文

1. 进入[全国人大网现行有效法律目录](http://www.npc.gov.cn/npc/c2/c30834/202512/t20251231_450944.html)页面，选择要收录的法律
2. 进入[国家法律法规数据库](https://flk.npc.gov.cn/)搜索法律
3. **重要**：选择**时效性为有效，公布日期为最新**的版本
4. 下载 WPS 版本（DOCX 格式）到 `.temp/laws/` 目录

**文件命名**：默认命名为中文全名 + 日期，请勿修改，如 `中华人民共和国种子法_20211224.docx`

### 步骤 3：转换为 Markdown

可以使用 `.agents/skills/markitdown/` 中说明的 MarkItDown 工具转换法律原文：

```
markitdown .temp/laws/中华人民共和国种子法_20211224.docx -o .temp/laws_md/中华人民共和国种子法_20211224.md
```

**输出**：转换后的 Markdown 文件保存在 `.temp/laws_md/` 目录

### 步骤 4：自动收录法律

先生成预览并检查 warnings：

```powershell
$inputs = @(".temp\laws_md\中华人民共和国种子法_20211224.md")
python .agents/skills/law-pipeline/scripts/normalize_law.py @inputs `
  --out .temp\law-pipeline\out `
  --json .temp\law-pipeline\laws.json `
  --docs docs `
  --progress LAWS_PROGRESS.md `
  --known-slugs .agents\skills\law-pipeline\references\known_slugs.json
```

确认附件、表格、图片、拆分和 slug 均无阻塞问题后，写入站点：

```powershell
python .agents/skills/law-pipeline/scripts/normalize_law.py @inputs `
  --out docs `
  --docs docs `
  --progress LAWS_PROGRESS.md `
  --json .temp\law-pipeline\applied-laws.json `
  --known-slugs .agents\skills\law-pipeline\references\known_slugs.json `
  --apply-site

npm run docs:build
```

**自动化处理**：
- ✅ 自动识别法律分类
- ✅ 自动格式化内容（空行、标题、条号等）
- ✅ 自动创建文件和目录
- ✅ 自动更新分类页和 C 类法律 sidebar
- ✅ 自动更新进度跟踪
- ⚠️ 对 warnings 进行人工复核
- ⚠️ 更新已有法律前人工确认版本；脚本不会自动比较日期或备份旧文件

### 步骤 5：提交代码

检查 `git diff` 后自行创建提交并推送：

```bash
git add docs/ docs/category/ docs/.vuepress/config.js LAWS_PROGRESS.md
git commit -m "收录《中华人民共和国种子法》"
git push origin master
```

请按实际 diff 缩小暂存范围；A/B 类法律通常不需要改
`docs/.vuepress/config.js`。

然后在 GitHub 上提交 Pull Request。

---

## 批量收录模式

如果要收录多部法律，先收集明确的输入列表，再复用步骤 4 的预览和应用命令：

```powershell
$inputs = @(Get-ChildItem .temp/laws_md -Filter *.md -File).FullName
```

自动化工具会：
1. 处理传入的所有文件
2. 为每部法律生成元信息和 warnings
3. 在应用模式下更新站点文件和进度

脚本不会自动筛选“未收录”法律，也不会为每部法律创建提交。批量运行前应先缩小输入范围，避免无意覆盖已有内容。

---

## 常见问题

### Q：为什么要使用 `.temp` 目录？
**A**：`.temp` 目录在 `.gitignore` 中，临时文件不会被提交到 Git 仓库，保持仓库整洁。

### Q：如果法律条文过多怎么办？
**A**：自动化工具会自动检测法律结构，如果包含"第一编、第二编"等结构，会自动拆分为多个文件。无需手动处理。

### Q：如何知道法律的分类？
**A**：自动化工具会自动从 `LAWS_PROGRESS.md` 中查找法律所在的分类，无需手动指定。

### Q：如果法律已存在但版本更新怎么办？
**A**：流水线会提取日期到 JSON 元数据，但不会自动比较或备份。请先人工确认版本，再检查应用后的 diff；C 类法律还要确认没有遗留旧分编文件。

---

## 技术支持

如果遇到问题，请：
1. 查看 [law-pipeline 技能文档](.agents/skills/law-pipeline/SKILL.md)
2. 提交 [Issue](https://github.com/ImCa0/just-laws/issues)
