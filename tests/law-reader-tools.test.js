const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { lawReaderToolsPlugin } = require("../docs/.vuepress/plugins/lawReaderTools");
const plugin = lawReaderToolsPlugin();
function targets(file) {
  const page = { filePath: path.resolve("docs", file), filePathRelative: file,
    content: fs.readFileSync(path.resolve("docs", file), "utf8"), data: {} };
  plugin.extendsPage(page);
  return page.data.articleTargets;
}
test("工具栏支持同法跨编条号及之一，缺失目标不生成", () => {
  const result = targets("criminal-law/criminal-law/02-specific-provisions.md");
  assert.equal(result["article-1"], "/criminal-law/criminal-law/01-general-provisions.html#article-1");
  assert.equal(result["article-133-1"], "/criminal-law/criminal-law/02-specific-provisions.html#article-133-1");
  assert.equal(result["article-99999"], undefined);
});
test("工具栏单文件路由正确且历史未来版本不混用", () => {
  for (const dir of ["civil-and-commercial/trademark-law", "civil-and-commercial/trademark-law/versions/2027-01-01"]) {
    assert.equal(targets(`${dir}/README.md`)["article-1"], `/${dir}/#article-1`);
  }
});
test("分类及修正案汇编不猜测统一条号空间", () => {
  assert.equal(targets("category/README.md"), undefined);
  assert.equal(targets("criminal-law/criminal-law/04-amendment.md"), undefined);
});
