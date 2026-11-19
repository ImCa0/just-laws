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

const DOCS_DIR = path.resolve(__dirname, "..", "docs");
const JULY_FIXTURE = path.join(__dirname, "fixtures", "law-versions", "2026-07-17");

test("商标法版本状态按有效期派生", () => {
  const current = { effectiveFrom: "2019-11-01", effectiveTo: "2027-01-01" };
  const pending = { effectiveFrom: "2027-01-01", effectiveTo: null };
  assert.equal(statusForDate(current, "2026-07-17"), "current");
  assert.equal(statusForDate(pending, "2026-07-17"), "pending");
  assert.equal(statusForDate(current, "2027-01-01"), "expired");
  assert.equal(statusForDate(pending, "2027-01-01"), "current");
});

test("当前仓库的版本配置有效", () => {
  const records = loadLawManifests(DOCS_DIR);
  const lawIds = records.map((record) => record.manifest.lawId);
  assert.ok(lawIds.includes("civil-and-commercial/trademark-law"));
  assert.ok(lawIds.includes("ecological-environment/ecological-environment-code"));
  assert.ok(lawIds.includes("administrative/prisons-law"));
  assert.ok(lawIds.includes("economic/certified-public-accountants-law"));
  for (const { manifest } of records) {
    for (const version of manifest.versions) {
      if (version.entry !== "README.md") {
        assert.equal(version.entry, `versions/${version.effectiveFrom}/README.md`, manifest.lawId);
      }
    }
  }
});

test("2026年8月公布的四部法律在施行日切换效力", () => {
  const records = loadLawManifests(DOCS_DIR);
  const asOf = "2026-09-23";
  for (const [lawId, effectiveFrom, hasPredecessor] of [
    ["social/medical-security-law", "2027-01-01", false],
    ["ecological-environment/cultivated-land-protection-and-quality-improvement-law", "2027-01-01", false],
    ["administrative/national-defense-mobilization-law", "2026-10-01", true],
    ["economic/agriculture-law", "2027-01-01", true],
  ]) {
    const { versions } = records.find(({ manifest }) => manifest.lawId === lawId).manifest;
    const augustVersion = versions.find((version) => version.promulgatedOn === "2026-08-28");
    assert.ok(augustVersion, lawId);
    assert.equal(augustVersion.effectiveFrom, effectiveFrom);
    assert.equal(statusForDate(augustVersion, asOf), "pending");
    assert.equal(statusForDate(augustVersion, effectiveFrom), "current");
    const previous = versions.find((version) => statusForDate(version, asOf) === "current");
    assert.equal(Boolean(previous), hasPredecessor, lawId);
    if (previous) {
      assert.equal(previous.effectiveTo, effectiveFrom);
      assert.equal(statusForDate(previous, effectiveFrom), "expired");
    }
  }
});

test("生态环境法典废止的十部法律由根路由展示最后有效正文", () => {
  const records = loadLawManifests(DOCS_DIR);
  const repealedRecords = records.filter(
    (record) =>
      record.manifest.repealedBy?.path ===
      "/ecological-environment/ecological-environment-code/"
  );

  assert.equal(repealedRecords.length, 10);
  for (const record of repealedRecords) {
    assert.equal(record.manifest.versions.length, 1);
    assert.equal(record.manifest.versions[0].entry, "README.md");
    assert.equal(statusForDate(record.manifest.versions[0], "2026-08-14"), "current");
    assert.equal(statusForDate(record.manifest.versions[0], "2026-08-15"), "expired");
    assert.ok(fs.statSync(path.join(record.lawDir, "README.md")).size > 1000);
    assert.equal(
      record.manifest.versions.some((version) => version.id === "2026-repeal"),
      false
    );
  }
});

test("版本插件为商标法两个版本和生态环境法典分编注入页面数据", () => {
  const plugin = lawVersionsPlugin({
    docsDir: JULY_FIXTURE,
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
  const codeChildPage = {
    filePathRelative: "ecological-environment/ecological-environment-code/01-general-principles.md",
    data: {},
    routeMeta: {},
  };

  plugin.extendsPage(currentPage);
  plugin.extendsPage(futurePage);
  plugin.extendsPage(unrelatedPage);
  plugin.extendsPage(codeChildPage);

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
  assert.equal(codeChildPage.data.lawVersions.selectedVersionId, "2026-code");
  assert.equal(codeChildPage.data.lawVersions.versions[0].status, "pending");
  assert.equal(codeChildPage.routeMeta.title, undefined);
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
  fs.cpSync(path.join(JULY_FIXTURE, "civil-and-commercial", "trademark-law"), lawDir, {
    recursive: true,
  });

  const messages = [];
  const dryRun = promoteVersion({
    docsDir,
    lawId: "civil-and-commercial/trademark-law",
    asOf: "2027-01-01",
    output: (message) => messages.push(message),
  });
  assert.equal(dryRun.dryRun, true);
  assert.equal(fs.readFileSync(path.join(lawDir, "README.md"), "utf8").trim(), "2019年修正版");

  promoteVersion({
    docsDir,
    lawId: "civil-and-commercial/trademark-law",
    asOf: "2027-01-01",
    apply: true,
    output: () => {},
  });
  assert.equal(fs.readFileSync(path.join(lawDir, "README.md"), "utf8").trim(), "2026年修订版");
  assert.equal(
    fs.readFileSync(path.join(lawDir, "versions", "2019-11-01", "README.md"), "utf8").trim(),
    "2019年修正版"
  );
  assert.equal(fs.existsSync(futureDir), false);
  loadLawManifests(docsDir, { asOf: "2027-01-01" });
});
