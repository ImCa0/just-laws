const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  loadLawManifests,
  promoteVersion,
  statusForDate,
} = require("../scripts/manage-law-versions");
const { buildIndexes } = require("../scripts/build-law-search-index");
const { lawVersionsPlugin } = require("../docs/.vuepress/plugins/lawVersions");

test("商标法版本状态按有效期派生", () => {
  const current = { effectiveFrom: "2019-11-01", effectiveTo: "2027-01-01" };
  const pending = { effectiveFrom: "2027-01-01", effectiveTo: null };
  assert.equal(statusForDate(current, "2026-07-17"), "current");
  assert.equal(statusForDate(pending, "2026-07-17"), "pending");
  assert.equal(statusForDate(current, "2027-01-01"), "expired");
  assert.equal(statusForDate(pending, "2027-01-01"), "current");
});

test("当前仓库的商标法版本配置有效", () => {
  const records = loadLawManifests(path.resolve(__dirname, "..", "docs"), {
    asOf: "2026-07-17",
  });
  assert.equal(records.length, 1);
  assert.equal(records[0].manifest.lawId, "civil-and-commercial/trademark-law");
});

test("页面数据只注入商标法的两个已登记版本", () => {
  const plugin = lawVersionsPlugin({
    docsDir: path.resolve(__dirname, "..", "docs"),
    asOf: "2026-07-17",
  });
  const currentPage = {
    filePathRelative: "civil-and-commercial/trademark-law/README.md",
    data: {},
    routeMeta: {},
  };
  const futurePage = {
    filePathRelative:
      "civil-and-commercial/trademark-law/versions/2027-01-01/README.md",
    data: {},
    routeMeta: {},
  };
  const unrelatedPage = {
    filePathRelative: "economic/seed-law/README.md",
    data: {},
    routeMeta: {},
  };

  plugin.extendsPage(currentPage);
  plugin.extendsPage(futurePage);
  plugin.extendsPage(unrelatedPage);

  assert.equal(currentPage.data.lawVersions.selectedVersionId, "2019-amendment");
  assert.deepEqual(
    currentPage.data.lawVersions.versions.map(({ id, status, path: routePath }) => ({
      id,
      status,
      path: routePath,
    })),
    [
      {
        id: "2019-amendment",
        status: "current",
        path: "/civil-and-commercial/trademark-law/",
      },
      {
        id: "2026-revision",
        status: "pending",
        path: "/civil-and-commercial/trademark-law/versions/2027-01-01/",
      },
    ]
  );
  assert.equal(futurePage.data.lawVersions.selectedVersionId, "2026-revision");
  assert.equal(futurePage.routeMeta.title, "中华人民共和国商标法（2026年修订版）");
  assert.equal(unrelatedPage.data.lawVersions, undefined);
});

test("重叠区间、缺失入口和多个现行版本都会阻止校验", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "just-laws-invalid-"));
  const docsDir = path.join(tempRoot, "docs");
  const lawDir = path.join(docsDir, "sample", "law");
  const futureDir = path.join(lawDir, "versions", "2027-01-01");
  fs.mkdirSync(futureDir, { recursive: true });
  fs.writeFileSync(path.join(lawDir, "README.md"), "current\n", "utf8");
  fs.writeFileSync(path.join(futureDir, "README.md"), "future\n", "utf8");

  const writeManifest = (versions) =>
    fs.writeFileSync(
      path.join(lawDir, "versions.json"),
      `${JSON.stringify(
        {
          schemaVersion: 1,
          lawId: "sample/law",
          title: "示例法",
          versions,
        },
        null,
        2
      )}\n`,
      "utf8"
    );
  const current = {
    id: "current",
    label: "现行版",
    promulgatedOn: "2019-04-23",
    effectiveFrom: "2019-11-01",
    effectiveTo: "2027-01-01",
    entry: "README.md",
  };
  const future = {
    id: "future",
    label: "未来版",
    promulgatedOn: "2026-06-26",
    effectiveFrom: "2027-01-01",
    effectiveTo: null,
    entry: "versions/2027-01-01/README.md",
  };

  writeManifest([{ ...current, effectiveTo: "2027-06-01" }, future]);
  assert.throws(
    () => loadLawManifests(docsDir, { asOf: "2026-07-17" }),
    /有效期重叠/
  );

  writeManifest([current, { ...future, entry: "versions/missing/README.md" }]);
  assert.throws(
    () => loadLawManifests(docsDir, { asOf: "2026-07-17" }),
    /入口不存在或越界/
  );

  writeManifest([{ ...current, effectiveTo: null }, future]);
  assert.throws(
    () => loadLawManifests(docsDir, { asOf: "2027-01-01" }),
    /有效期重叠|多个现行有效版本/
  );
});

test("主搜索只索引根目录的2019版商标法", () => {
  const { articleIndex } = buildIndexes();
  const articles = articleIndex.filter(
    (article) => article.lawId === "civil-and-commercial/trademark-law"
  );
  assert.equal(articles.length, 73);
  assert.equal(articles.some((article) => article.articleLabel === "第八十七条"), false);
});

test("轮换命令可预览并在临时目录完成提升", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "just-laws-versions-"));
  const docsDir = path.join(tempRoot, "docs");
  const lawDir = path.join(docsDir, "civil-and-commercial", "trademark-law");
  const futureDir = path.join(lawDir, "versions", "2027-01-01");
  fs.mkdirSync(futureDir, { recursive: true });
  fs.writeFileSync(path.join(lawDir, "README.md"), "2019 current\n", "utf8");
  fs.writeFileSync(path.join(futureDir, "README.md"), "2026 future\n", "utf8");
  fs.writeFileSync(
    path.join(lawDir, "versions.json"),
    JSON.stringify({
      schemaVersion: 1,
      lawId: "civil-and-commercial/trademark-law",
      title: "中华人民共和国商标法",
      versions: [
        {
          id: "2019-amendment",
          label: "2019年修正版",
          promulgatedOn: "2019-04-23",
          effectiveFrom: "2019-11-01",
          effectiveTo: "2027-01-01",
          entry: "README.md"
        },
        {
          id: "2026-revision",
          label: "2026年修订版",
          promulgatedOn: "2026-06-26",
          effectiveFrom: "2027-01-01",
          effectiveTo: null,
          entry: "versions/2027-01-01/README.md"
        }
      ]
    }, null, 2) + "\n",
    "utf8"
  );

  const messages = [];
  const dryRun = promoteVersion({
    docsDir,
    lawId: "civil-and-commercial/trademark-law",
    asOf: "2027-01-01",
    output: (message) => messages.push(message),
  });
  assert.equal(dryRun.dryRun, true);
  assert.equal(fs.readFileSync(path.join(lawDir, "README.md"), "utf8"), "2019 current\n");

  promoteVersion({
    docsDir,
    lawId: "civil-and-commercial/trademark-law",
    asOf: "2027-01-01",
    apply: true,
    output: () => {},
  });
  assert.equal(fs.readFileSync(path.join(lawDir, "README.md"), "utf8"), "2026 future\n");
  assert.equal(
    fs.readFileSync(path.join(lawDir, "versions", "2019-11-01", "README.md"), "utf8"),
    "2019 current\n"
  );
  assert.equal(fs.existsSync(futureDir), false);
  loadLawManifests(docsDir, { asOf: "2027-01-01" });
});
