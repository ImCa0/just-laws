# 法条援引链接维护

- 通用入口：`lawArticleReferences.js`，在 `config.js` 中注册，在法条锚点和罪名标识生成后执行。
- 统一样式：`../styles/law-article-references.scss`，由 `index.scss` 引入。所有法律使用 `.law-article-reference`，不要为单部法律复制样式。
- 自动扫描当前法律正文的实际条号；支持单文件和同一目录的分编正文。只生成存在且唯一的目标，不修改 Markdown 法律原文。
- 当前版本与 `versions/日期/` 中的版本各自独立。同目录另附的决定不能并入主法律的条号空间。修正案汇编不自动推断正文目标。
- 明确援引其他法律的条号暂不自动关联；不把它们误当成本法。`前款`、`本条`等相对引用也不自动推断。
- 链接使用包含页面路径的地址，经 VuePress 转为站内路由，复用 `client.js` 的法条滚动偏移处理。
- 条首条号使用 `.law-article-permalink` 直达链接；地址包含 `#article-条号`，可复制分享及前进返回。重复、不明确的条号仍不猜测目标。
- `articleNavigation.mjs` 统一维护目标高亮及滚动位置；主题的 `activeHeaderLinks` 自动改写章节 hash 功能已关闭，避免覆盖条号历史。普通滚动不会新增历史记录。
- 验证：`node --test tests/law-article-references.test.js`。包括真实全站目标存在性、正文不变、版本隔离及跨编测试；无需为样式修改运行生产构建。
