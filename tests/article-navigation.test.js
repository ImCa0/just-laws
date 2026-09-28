const test = require("node:test");
const assert = require("node:assert/strict");

function mockStyle() {
  const properties = new Map();
  return { setProperty: (key, value) => properties.set(key, value),
    removeProperty: (key) => properties.delete(key),
    getPropertyValue: (key) => properties.get(key) };
}

test("条文导航、前进返回保持唯一高亮和导航栏偏移，无锚点时清除", async () => {
  const { articleNavigationPosition } = await import("../docs/.vuepress/articleNavigation.mjs");
  const nodes = new Map([1, 2].map((id) => {
    const classes = new Set();
    return [`article-${id}`, { classList: { add: (s) => classes.add(s), remove: (s) => classes.delete(s) },
      classes, style: mockStyle(), getBoundingClientRect: () => ({ top: id * 200, bottom: id * 200 + 100 }) }];
  }));
  const doc = {
    querySelectorAll: () => [...nodes.values()].filter((n) => n.classes.has("law-article-target")),
    querySelector: () => ({ getBoundingClientRect: () => ({ height: 64 }) }),
    getElementById: (id) => nodes.get(id),
  };
  for (const id of [1, 2, 1, 2]) {
    const position = articleNavigationPosition(`#article-${id}`, doc, { scrollY: 300 });
    assert.equal(position.top, id * 200 + 220);
    assert.equal(doc.querySelectorAll().length, 1);
    assert.ok(nodes.get(`article-${id}`).classes.has("law-article-target"));
  }
  for (const hash of ["", "#章节", "#article-999", "#article-%invalid"]) {
    assert.equal(articleNavigationPosition(hash, doc, { scrollY: 0 }), null);
    assert.equal(doc.querySelectorAll().length, 0);
  }
});

test("整条高亮包含后续款项，止于下一条、标题、非正文或容器末尾", async () => {
  const { articleNavigationPosition } = await import("../docs/.vuepress/articleNavigation.mjs");
  for (const boundary of [{ tagName: "P", id: "article-2" }, { tagName: "P", id: "article-1-1" }, { tagName: "H2" },
    { tagName: "H3" }, { tagName: "DIV" }, null]) {
    const definitions = [{ tagName: "P", id: "article-1" }, { tagName: "P" },
      { tagName: "P" }, { tagName: "UL" }, { tagName: "OL" }, { tagName: "TABLE" },
      { tagName: "BLOCKQUOTE" }, ...(boundary ? [boundary, { tagName: "P" }] : [])];
    const blocks = definitions.map((definition) => {
      const classes = new Set();
      return { ...definition, classes, style: mockStyle(),
        classList: { add: (s) => classes.add(s), remove: (s) => classes.delete(s) },
        getBoundingClientRect: () => ({ top: 200, bottom: 300 }) };
    });
    blocks.forEach((block, index) => { block.nextElementSibling = blocks[index + 1]; });
    const doc = {
      querySelectorAll: () => blocks.filter((b) => b.classes.has("law-article-target")),
      querySelector: () => null,
      getElementById: (id) => blocks.find((b) => b.id === id),
    };
    articleNavigationPosition("#article-1", doc, { scrollY: 0 });
    assert.equal(doc.querySelectorAll().length, 7);
    assert.ok(blocks.slice(7).every((b) => !b.classes.size));
    articleNavigationPosition("", doc, { scrollY: 0 });
    assert.equal(doc.querySelectorAll().length, 0);
  }
});

test("连续背景填满段落间距，重新换行后重算，末段不越界", async () => {
  const { updateHighlightGaps, articleHighlightBlocks } = await import("../docs/.vuepress/articleNavigation.mjs");
  let secondTop = 150;
  const blocks = [
    { style: mockStyle(), getBoundingClientRect: () => ({ top: 20, bottom: 100 }) },
    { style: mockStyle(), getBoundingClientRect: () => ({ top: secondTop, bottom: 300 }) },
  ];
  updateHighlightGaps(blocks);
  assert.equal(blocks[0].style.getPropertyValue("--article-highlight-gap"), "50px");
  assert.equal(blocks[1].style.getPropertyValue("--article-highlight-gap"), "0px");
  secondTop = 180;
  updateHighlightGaps(blocks);
  assert.equal(blocks[0].style.getPropertyValue("--article-highlight-gap"), "80px");
  const next = { id: "article-1-2", tagName: "P" };
  const clause = { tagName: "P", nextElementSibling: next };
  const target = { id: "article-1-1", tagName: "P", nextElementSibling: clause };
  assert.deepEqual(articleHighlightBlocks(target), [target, clause]);
});
