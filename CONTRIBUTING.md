# JustLaws 法律文库贡献指南

## 选择法律

进入[全国人大网现行有效法律目录](http://www.npc.gov.cn/npc/c30834/202204/d221d65dc57f4c649886c15257cf8634.shtml)页面，挑选你想要收录的法律，记住法律的全名即可进入下一步，本文以《中华人民共和国种子法》为例。

## 获取原文

进入[国家法律法规数据库](https://flk.npc.gov.cn/)，搜索法律原文。此时需要注意，搜索结果中可能包含多个版本，需要选择**时效性为有效，公布日期为最新**的版本。

![搜索结果](https://npm.elemecdn.com/imcao-hexo/source/_posts/development/JustLaws/ContributionGuide/SearchResult.jpg)

点击进入阅读页面，选择 WPS 版本，点击下载。

![下载](https://npm.elemecdn.com/imcao-hexo/source/_posts/development/JustLaws/ContributionGuide/Download.jpg)

## 获取代码

进入 [JustLaws 仓库](https://github.com/ImCa0/just-laws)并 fork 到自己账号。`git clone` 自己的仓库到本地。

## 创建文件

推荐使用 VS Code 打开项目，后续操作快捷键以 VS Code 为例。在法律类型下创建法律名称的文件夹，例如种子法属于经济法，即在 economic 下创建 seed-law 文件夹，文件夹名称请百度该法律的英文对照，使用全小写字母，单词用 `-` 分隔，无需保留 `the People's Republic of China`。

![创建文件](https://npm.elemecdn.com/imcao-hexo/source/_posts/development/JustLaws/ContributionGuide/CreateFile.jpg)

![文件夹名称](https://npm.elemecdn.com/imcao-hexo/source/_posts/development/JustLaws/ContributionGuide/Translation.jpg)

在新创建的文件夹下创建名为 `README.md` 的文件。

> 注意：对于法律条文多余 200 条的法律需要创建多个 MarkDown 文件，其网页由多个页面组成，例如[民法典](https://www.justlaws.cn/civil-and-commercial/civil-code/)，每一编都是一个 MarkDown 文件。而大部分的法律都少于 200 条，因此本文只介绍这类法律的收录。

## 编辑文件

### Frontmatter

对于少于 200 条的法律，其侧边栏自动生成，在 README.md 文件添加 Frontmatter。

```markdown
---
sidebar: auto
---
```

### 标题

添加法律名称的一级标题

```markdown
# 中华人民共和国种子法
```

### 立法修法记录

格式要求：每条记录单独成一行

```markdown
2000年7月8日第九届全国人民代表大会常务委员会第十六次会议通过

根据2004年8月28日第十届全国人民代表大会常务委员会第十一次会议《关于修改〈中华人民共和国种子法〉的决定》第一次修正
```

### 正文

复制粘贴下载的法律正文。

`Ctrl + F` 打开搜索框，打开正则表达式模式，输入 `\n` 搜索换行符，光标回到文档，`Shift + Ctrl + L` 选中所有匹配项，连续按**两次** `回车`，`Shift + Alt + F` 格式化文档。此举操作是为了保证连续两行之间存在一个空行，这样才能在网页上真正分行。

![搜索换行符](https://npm.elemecdn.com/imcao-hexo/source/_posts/development/JustLaws/ContributionGuide/Search.jpg)

搜索框输入 `第[\u4e00-\u9fa5]*章　`，搜索所有二级标题，注意“章”字后的中文空格，防止搜索到正文中的“第X章”。`Shift + Ctrl + L` 选中所有匹配项后，按一次方向键 `←` 将所有光标移动到文字左侧，输入 `## ` 实现二级标题。

同理，如果法律有三级标题，比如“第一节”，也用这个方法进行操作。

搜索框输入 `第[\u4e00-\u9fa5]*条　`，搜索所有条目，`Shift + Ctrl + L` 选中所有匹配项后，按一次方向键 `→` 将所有光标移动到中文空格右侧，按一次方向键 `←` 将所有光标移动到“条”字右侧，`Shift + Ctrl + ←` 选中所有“第X条”，两次 `Shift + 8` 为文字包裹 `**`。

搜索框输入 `\d | \d`，搜索所有相邻为数字的空格，手动删除所有中文字符与数字之间的空格（与原文格式保持一致）。

```diff
- 2000 年 7 月 8 日第九届全国人民代表大会常务委员会第十六次会议通过
+ 2000年7月8日第九届全国人民代表大会常务委员会第十六次会议通过

- 根据 2004 年 8 月 28 日第十届全国人民代表大会常务委员会第十一次会议《关于修改〈中华人民共和国种子法〉的决定》第一次修正
+ 根据2004年8月28日第十届全国人民代表大会常务委员会第十一次会议《关于修改〈中华人民共和国种子法〉的决定》第一次修正
```

至此，Markdown 文件已编辑完成，完整示例可参考种子法文件，[GitHub 在线预览](https://github.dev/ImCa0/just-laws/tree/master/docs/economic/seed-law)。

## 修改配置文件

修改 `.vuepress/config.js` 中的导航栏配置，添加法律至相应栏目下。

```diff
themeConfig: {
    navbar: [
      {
        text: "经济法",
        children: [
          { text: "个人所得税法", link: "/economic/individual-income-tax-law/" },
+         { text: "种子法", link: "/economic/seed-law/" },
        ],
      },
    ]
}
```

## 修改项目 README

修改根目录下的 README.md 文件，将 `已收录法律` 后的数量加一，并在下方相应分类下添加法律名称。

```diff
- ## 已收录法律（xx/292）
+ ## 已收录法律（xx+1/292）

### 经济法

+ - [x] 中华人民共和国种子法
```

## 提交 Pull Request

提交代码，提交信息格式为 `书本emoji + 空格 + 收录《XXX法》`，emoji 颜色自选 📗📘📙📕。

```bash
git add .
git commit -m "📗 收录《种子法》"
git push https://github.com/{YOUR-USERNAME}/just-laws.git master
```

最后，在 GitHub 仓库页面提交 Pull Request。
