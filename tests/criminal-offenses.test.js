const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const MarkdownIt = require("markdown-it");

const {
  currentNamesAt,
  currentOffensesByArticle,
  loadCriminalOffenseData,
  loadCurrentCriminalOffenses,
  replayCriminalOffenseTimeline,
} = require("../scripts/manage-criminal-offenses");
const {
  offenseNamesForArticle,
} = require("../scripts/build-law-search-index");
const {
  lawArticleAnchorsPlugin,
} = require("../docs/.vuepress/markdown/lawArticleAnchors");
const {
  criminalOffenseAnnotationsPlugin,
} = require("../docs/.vuepress/markdown/criminalOffenseAnnotations");

const ROOT = path.resolve(__dirname, "..");
const SPECIFIC_PROVISIONS = path.join(
  ROOT,
  "docs",
  "criminal-law",
  "criminal-law",
  "02-specific-provisions.md"
);
const FOREIGN_EXCHANGE_DECISION = path.join(
  ROOT,
  "docs",
  "criminal-law",
  "criminal-law",
  "05-foreign-exchange-crimes-decision.md"
);

function activeNames(result) {
  return new Set(result.active.map((offense) => offense.name));
}

function offense(result, name) {
  return result.active.find((item) => item.name === name);
}

function articleAnchors(filename) {
  const source = fs.readFileSync(filename, "utf8");
  const html = new MarkdownIt().use(lawArticleAnchorsPlugin).render(source, {
    filePath: filename,
  });
  return new Set(
    [...html.matchAll(/id="(article-[^"]+)"/g)].map((match) => match[1])
  );
}

test("罪名基线与八次补充规定累计得到483个现行罪名", () => {
  const data = loadCriminalOffenseData();
  const result = loadCurrentCriminalOffenses();

  assert.equal(data.timeline.baseline.offenses.length, 414);
  assert.deepEqual(
    data.timeline.changeSets.map((item) => item.changes.length),
    [21, 5, 22, 13, 10, 32, 25, 1]
  );
  assert.equal(result.active.length, 483);
  assert.equal(currentOffensesByArticle(result).size, 364);
  assert.deepEqual(result.unresolvedCancellations, [
    { changeId: "supplement-01-row-20", name: "枉法裁判罪" },
    {
      changeId: "supplement-01-row-21",
      name: "国家机关工作人员签订、履行合同失职罪",
    },
  ]);
});

test("来源以九份国家法律法规数据库下载件为主，维基副本只做交叉校验", () => {
  const { sources } = loadCriminalOffenseData();
  assert.equal(sources.length, 10);
  assert.equal(
    sources.filter((source) => source.sourceLevel === "official-database").length,
    9
  );
  const secondary = sources.find((source) => source.id === "spc-1997");
  assert.equal(secondary.role, "cross-check");
  assert.equal(secondary.sourceLevel, "secondary-copy");
  for (const source of sources) assert.match(source.sha256, /^[a-f0-9]{64}$/);
});

test("关键多对多、款级与取消映射正确", () => {
  const result = loadCurrentCriminalOffenses();
  const names = activeNames(result);

  assert.ok(currentNamesAt(result, { instrument: "criminal-law", article: 114 }).includes("放火罪"));
  assert.ok(currentNamesAt(result, { instrument: "criminal-law", article: 115 }).includes("放火罪"));
  assert.deepEqual(
    offense(result, "放火罪").provisions,
    [
      { instrument: "criminal-law", article: 114 },
      { instrument: "criminal-law", article: 115, paragraph: 1 },
    ]
  );

  assert.ok(currentNamesAt(result, { instrument: "criminal-law", article: 152 }).includes("走私废物罪"));
  assert.equal(names.has("走私固体废物罪"), false);
  assert.deepEqual(currentNamesAt(result, { instrument: "criminal-law", article: 199 }), []);

  const examNames = currentNamesAt(result, {
    instrument: "criminal-law",
    article: 284,
    subArticle: 1,
  });
  assert.deepEqual(new Set(examNames), new Set([
    "组织考试作弊罪",
    "非法出售、提供试题、答案罪",
    "代替考试罪",
  ]));
  assert.deepEqual(offense(result, "组织考试作弊罪").provisions[0].paragraph, 1);
  assert.deepEqual(offense(result, "组织考试作弊罪").provisions[1].paragraph, 2);
  assert.equal(offense(result, "非法出售、提供试题、答案罪").provisions[0].paragraph, 3);
  assert.equal(offense(result, "代替考试罪").provisions[0].paragraph, 4);

  assert.equal(names.has("嫖宿幼女罪"), false);
  assert.equal(offense(result, "传播性病罪").provisions[0].paragraph, 1);
  assert.deepEqual(
    new Set(currentNamesAt(result, { instrument: "criminal-law", article: 399 })),
    new Set([
      "徇私枉法罪",
      "民事、行政枉法裁判罪",
      "执行判决、裁定失职罪",
      "执行判决、裁定滥用职权罪",
    ])
  );
});

test("补充规定八完成第一百六十九条罪名替换，决定第一条单独定位", () => {
  const result = loadCurrentCriminalOffenses();
  const names = activeNames(result);
  assert.equal(names.has("徇私舞弊低价折股、出售国有资产罪"), false);
  assert.deepEqual(
    currentNamesAt(result, { instrument: "criminal-law", article: 169 }),
    ["徇私舞弊低价折股、出售公司、企业资产罪"]
  );
  assert.deepEqual(
    currentNamesAt(result, {
      instrument: "foreign-exchange-decision",
      article: 1,
    }),
    ["骗购外汇罪"]
  );
});

test("按日期回放不会提前应用后续补充规定", () => {
  const data = loadCriminalOffenseData();
  const beforeSeven = replayCriminalOffenseTimeline(data, { asOf: "2020-12-31" });
  const beforeEight = replayCriminalOffenseTimeline(data, { asOf: "2024-02-29" });

  assert.equal(activeNames(beforeSeven).has("妨害安全驾驶罪"), false);
  assert.equal(activeNames(beforeEight).has("徇私舞弊低价折股、出售国有资产罪"), true);
  assert.equal(activeNames(beforeEight).has("徇私舞弊低价折股、出售公司、企业资产罪"), false);
});

test("全部现行罪名定位都能落到当前刑法或骗购外汇决定页面", () => {
  const result = loadCurrentCriminalOffenses();
  const criminalAnchors = articleAnchors(SPECIFIC_PROVISIONS);
  const decisionAnchors = articleAnchors(FOREIGN_EXCHANGE_DECISION);

  for (const item of result.active) {
    for (const value of item.provisions) {
      const anchor = `article-${value.article}${
        value.subArticle ? `-${value.subArticle}` : ""
      }`;
      const anchors =
        value.instrument === "criminal-law" ? criminalAnchors : decisionAnchors;
      assert.ok(anchors.has(anchor), `${item.name} 无法定位到 ${value.instrument}#${anchor}`);
    }
  }
});

test("刑法条号独立成行，款级罪名放在对应款之前", () => {
  const md = new MarkdownIt()
    .use(lawArticleAnchorsPlugin)
    .use(criminalOffenseAnnotationsPlugin);
  const html = md.render(
    ["**第一百零三条**　第一款正文。", "", "第二款正文。"].join("\n"),
    { filePathRelative: "criminal-law/criminal-law/02-specific-provisions.md" }
  );

  assert.match(
    html,
    /<p id="article-103" class="criminal-law-article-number"><strong>第一百零三条<\/strong><\/p>/
  );
  assert.ok(html.indexOf("分裂国家罪") < html.indexOf("第一款正文"));
  assert.ok(html.indexOf("第一款正文") < html.indexOf("煽动分裂国家罪"));
  assert.ok(html.indexOf("煽动分裂国家罪") < html.indexOf("第二款正文"));
});

test("整条映射不擅自改成第一款映射", () => {
  const md = new MarkdownIt()
    .use(lawArticleAnchorsPlugin)
    .use(criminalOffenseAnnotationsPlugin);
  const html = md.render(
    ["**第一百零四条**　第一款正文。", "", "第二款正文。"].join("\n"),
    { filePathRelative: "criminal-law/criminal-law/02-specific-provisions.md" }
  );

  assert.equal((html.match(/武装叛乱、暴乱罪/g) || []).length, 1);
  assert.ok(html.indexOf("第一百零四条") < html.indexOf("武装叛乱、暴乱罪"));
  assert.ok(html.indexOf("武装叛乱、暴乱罪") < html.indexOf("第一款正文"));
  assert.ok(html.indexOf("第一款正文") < html.indexOf("第二款正文"));
  assert.doesNotMatch(html, /本条罪名|>罪名</);
});

test("总则保持条号与正文同一行的原有版式", () => {
  const md = new MarkdownIt()
    .use(lawArticleAnchorsPlugin)
    .use(criminalOffenseAnnotationsPlugin);
  const html = md.render("**第一条**　为了惩罚犯罪，保护人民。", {
    filePathRelative: "criminal-law/criminal-law/01-general-provisions.md",
  });

  assert.doesNotMatch(html, /class="criminal-law-article-number"/);
  assert.match(html, /<strong>第一条<\/strong>　为了惩罚犯罪，保护人民。<\/p>/);
  assert.doesNotMatch(html, /criminal-offense-note/);
});

test("补充条文的条号同样独立成行", () => {
  const md = new MarkdownIt()
    .use(lawArticleAnchorsPlugin)
    .use(criminalOffenseAnnotationsPlugin);
  const html = md.render("第一百二十条之一　第一款正文。", {
    filePathRelative: "criminal-law/criminal-law/02-specific-provisions.md",
  });

  assert.match(html, /<strong>第一百二十条之一<\/strong>/);
  assert.match(html, /class="criminal-law-paragraph">第一款正文。/);
});

test("搜索索引把罪名加入对应法条记录", () => {
  assert.deepEqual(
    offenseNamesForArticle(SPECIFIC_PROVISIONS, "article-169"),
    ["徇私舞弊低价折股、出售公司、企业资产罪"]
  );
  assert.deepEqual(
    offenseNamesForArticle(FOREIGN_EXCHANGE_DECISION, "article-1"),
    ["骗购外汇罪"]
  );
});
