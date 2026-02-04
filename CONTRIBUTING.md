# JustLaws 法律文库贡献指南

感谢您贡献法律到 JustLaws 项目！我们使用自动化工具简化收录流程，只需 4 步即可完成贡献。

## 前提条件

1. **已安装 [Claude Code](https://claude.ai/code)**：用于运行自动化技能
2. **已 Fork 并 Clone 仓库**：`git clone https://github.com/{YOUR-USERNAME}/just-laws.git`

## 收录流程

### 步骤 1：创建临时目录

`.temp` 目录在 `.gitignore` 中，不会被提交到 Git。您需要手动创建：

```bash
mkdir -p .temp/laws_docs
mkdir -p .temp/laws_md
```

或者手动创建这两个文件夹。

**目录结构**：
```
.just-laws/
├── .temp/              # 临时文件（不提交到 Git）
│   ├── laws_docs/      # 原始法律文档（DOCX/PDF）
│   └── laws_md/        # 转换后的 Markdown 文件
├── docs/               # 站点文档
└── .claude/skills/     # 自动化技能
```

### 步骤 2：下载法律原文

1. 进入[全国人大网现行有效法律目录](http://www.npc.gov.cn/npc/c2/c30834/202512/t20251231_450944.html)页面，选择要收录的法律
2. 进入[国家法律法规数据库](https://flk.npc.gov.cn/)搜索法律
3. **重要**：选择**时效性为有效，公布日期为最新**的版本
4. 下载 WPS 版本（DOCX 格式）到 `.temp/laws_docs/` 目录

**文件命名**：默认命名为中文全名 + 日期，请勿修改，如 `中华人民共和国种子法_20211224.docx`

### 步骤 3：转换为 Markdown

在 Claude Code 交互界面中，使用 markitdown 技能转换法律原文：

```
/markitdown .temp/laws_docs/中华人民共和国种子法_20211224.docx
```

**注意**：`/markitdown` 是 Claude Code 的技能命令，需要在 Claude Code 的终端/交互界面中执行，而非系统终端（bash/cmd）。

**输出**：转换后的 Markdown 文件保存在 `.temp/laws_md/` 目录

### 步骤 4：自动收录法律

在 Claude Code 交互界面中，使用 addlaws 技能自动收录法律：

```
/addlaws .temp/laws_md/中华人民共和国种子法_20211224.md
```

**注意**：`/addlaws` 是 Claude Code 的技能命令，需要在 Claude Code 的终端/交互界面中执行，而非系统终端（bash/cmd）。

**自动化处理**：
- ✅ 自动识别法律分类
- ✅ 自动格式化内容（空行、标题、条号等）
- ✅ 自动创建文件和目录
- ✅ 自动更新导航配置
- ✅ 自动更新进度跟踪
- ✅ 自动生成提交信息

### 步骤 5：提交代码

自动化工具会自动完成 Git 提交，您只需推送到自己的仓库：

```bash
git push origin master
```

然后在 GitHub 上提交 Pull Request。

---

## 批量收录模式

如果您想收录多部法律，可以在 Claude Code 交互界面中使用批量模式：

```
/addlaws --batch
```

自动化工具会：
1. 自动识别所有未收录的法律
2. 按序处理每部法律
3. 为每部法律创建独立的提交
4. 更新进度跟踪

---

## 常见问题

### Q：为什么要使用 `.temp` 目录？
**A**：`.temp` 目录在 `.gitignore` 中，临时文件不会被提交到 Git 仓库，保持仓库整洁。

### Q：如果法律条文过多怎么办？
**A**：自动化工具会自动检测法律结构，如果包含"第一编、第二编"等结构，会自动拆分为多个文件。无需手动处理。

### Q：如何知道法律的分类？
**A**：自动化工具会自动从 `LAWS_PROGRESS.md` 中查找法律所在的分类，无需手动指定。

### Q：如果法律已存在但版本更新怎么办？
**A**：自动化工具会自动比较日期，如果新版本更新，会自动替换旧文件并备份。

---

## 技术支持

如果遇到问题，请：
1. 查看 [addlaws 技能文档](.claude/skills/addlaws/SKILL.md)
2. 提交 [Issue](https://github.com/ImCa0/just-laws/issues)
