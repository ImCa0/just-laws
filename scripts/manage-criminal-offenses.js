const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = path.resolve(__dirname, "..", "data", "criminal-offenses");
const SOURCES_FILE = path.join(DATA_DIR, "sources.json");
const TIMELINE_FILE = path.join(DATA_DIR, "timeline.json");
const EXPECTED_CURRENT_OFFENSES = 483;
const EXPECTED_UNRESOLVED_CANCELLATIONS = new Map([
  ["supplement-01-row-20", new Set(["枉法裁判罪"])],
  [
    "supplement-01-row-21",
    new Set(["国家机关工作人员签订、履行合同失职罪"]),
  ],
]);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function loadCriminalOffenseData({ dataDir = DATA_DIR } = {}) {
  const sourcesData = readJson(path.join(dataDir, "sources.json"));
  const timeline = readJson(path.join(dataDir, "timeline.json"));

  if (sourcesData.schemaVersion !== 1 || timeline.schemaVersion !== 1) {
    throw new Error("不支持的刑法罪名数据版本");
  }

  return { sources: sourcesData.sources, timeline };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateProvision(value, context) {
  if (!value || typeof value !== "object") {
    throw new Error(`${context} 缺少条文定位`);
  }
  if (!["criminal-law", "foreign-exchange-decision"].includes(value.instrument)) {
    throw new Error(`${context} 使用了未知规范文件 ${value.instrument}`);
  }
  for (const field of ["article", "subArticle", "paragraph", "item"]) {
    if (value[field] !== undefined && !Number.isInteger(value[field])) {
      throw new Error(`${context} 的 ${field} 必须是整数`);
    }
  }
  if (!Number.isInteger(value.article) || value.article < 1) {
    throw new Error(`${context} 的条号无效`);
  }
}

function closeOffense(activeByName, name, effectiveTo) {
  const record = activeByName.get(name);
  if (!record) return null;
  record.effectiveTo = effectiveTo;
  activeByName.delete(name);
  return record;
}

function replayCriminalOffenseTimeline({ sources, timeline }, { asOf = null } = {}) {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const activeByName = new Map();
  const history = [];
  const unresolvedCancellations = [];

  if (!sourceById.has(timeline.baseline.sourceId)) {
    throw new Error(`罪名基线来源不存在：${timeline.baseline.sourceId}`);
  }

  for (const offense of timeline.baseline.offenses) {
    if (activeByName.has(offense.name)) {
      throw new Error(`罪名基线存在重名：${offense.name}`);
    }
    offense.provisions.forEach((value) =>
      validateProvision(value, `${offense.id} ${offense.name}`)
    );
    const record = {
      ...clone(offense),
      sourceId: timeline.baseline.sourceId,
      effectiveFrom: timeline.baseline.effectiveFrom,
      effectiveTo: null,
    };
    activeByName.set(record.name, record);
    history.push(record);
  }

  let previousDate = timeline.baseline.effectiveFrom;
  for (const changeSet of timeline.changeSets) {
    if (!sourceById.has(changeSet.sourceId)) {
      throw new Error(`罪名变更来源不存在：${changeSet.sourceId}`);
    }
    if (changeSet.effectiveFrom < previousDate) {
      throw new Error(`罪名变更未按生效日期排序：${changeSet.id}`);
    }
    previousDate = changeSet.effectiveFrom;
    if (asOf && changeSet.effectiveFrom > asOf) break;

    for (const change of changeSet.changes) {
      const addNames = change.add.map((item) => item.name);
      const automaticReplacements = addNames.filter((name) => activeByName.has(name));
      const removals = [
        ...new Set([
          ...change.cancels,
          ...change.implicitReplaces,
          ...automaticReplacements,
        ]),
      ];

      for (const name of removals) {
        const closed = closeOffense(activeByName, name, changeSet.effectiveFrom);
        if (!closed) {
          unresolvedCancellations.push({ changeId: change.id, name });
        }
      }

      change.add.forEach((addition, index) => {
        if (!addition.name || activeByName.has(addition.name)) {
          throw new Error(`${change.id} 产生无效或重复的现行罪名：${addition.name}`);
        }
        addition.provisions.forEach((value) =>
          validateProvision(value, `${change.id} ${addition.name}`)
        );
        const record = {
          id: `offense-${change.id}-${index + 1}`,
          ...clone(addition),
          sourceId: changeSet.sourceId,
          sourceChangeId: change.id,
          effectiveFrom: changeSet.effectiveFrom,
          effectiveTo: null,
        };
        activeByName.set(record.name, record);
        history.push(record);
      });
    }
  }

  return {
    active: [...activeByName.values()],
    history,
    unresolvedCancellations,
    sources,
    sourceById,
  };
}

function provisionArticleKey(value) {
  return [value.instrument, value.article, value.subArticle]
    .filter((part) => part !== undefined)
    .join(":");
}

function provisionIdentity(value) {
  return [
    provisionArticleKey(value),
    value.paragraph === undefined ? "" : `p${value.paragraph}`,
    value.item === undefined ? "" : `i${value.item}`,
  ].join(":");
}

function currentOffensesByArticle(result) {
  const articles = new Map();

  for (const offense of result.active) {
    const provisionsByArticle = new Map();
    for (const value of offense.provisions) {
      const key = provisionArticleKey(value);
      if (!provisionsByArticle.has(key)) provisionsByArticle.set(key, []);
      provisionsByArticle.get(key).push(value);
    }

    for (const [key, provisions] of provisionsByArticle) {
      if (!articles.has(key)) articles.set(key, []);
      articles.get(key).push({
        id: offense.id,
        name: offense.name,
        sourceId: offense.sourceId,
        effectiveFrom: offense.effectiveFrom,
        provisions,
      });
    }
  }

  for (const offenses of articles.values()) {
    offenses.sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
  }
  return articles;
}

function findCurrentOffenses(result, locator) {
  const map = currentOffensesByArticle(result);
  return map.get(provisionArticleKey(locator)) || [];
}

function validateUnresolvedCancellations(unresolved) {
  for (const item of unresolved) {
    if (!EXPECTED_UNRESOLVED_CANCELLATIONS.get(item.changeId)?.has(item.name)) {
      throw new Error(`无法应用罪名取消：${item.changeId} / ${item.name}`);
    }
  }

  const actual = new Set(unresolved.map((item) => `${item.changeId}\0${item.name}`));
  for (const [changeId, names] of EXPECTED_UNRESOLVED_CANCELLATIONS) {
    for (const name of names) {
      if (!actual.has(`${changeId}\0${name}`)) {
        throw new Error(`预期的两院1997年基线差异未出现：${changeId} / ${name}`);
      }
    }
  }
}

function currentNamesAt(result, locator) {
  return findCurrentOffenses(result, locator).map((offense) => offense.name);
}

function validateCriticalMappings(result) {
  const expect = (locator, expected) => {
    const actual = currentNamesAt(result, locator);
    for (const name of expected) {
      if (!actual.includes(name)) {
        throw new Error(
          `${provisionArticleKey(locator)} 缺少罪名 ${name}，实际为 ${actual.join("、")}`
        );
      }
    }
  };

  expect({ instrument: "criminal-law", article: 114 }, ["放火罪", "投放危险物质罪"]);
  expect({ instrument: "criminal-law", article: 115 }, ["失火罪", "过失投放危险物质罪"]);
  expect({ instrument: "criminal-law", article: 152 }, ["走私废物罪"]);
  expect({ instrument: "criminal-law", article: 284, subArticle: 1 }, [
    "组织考试作弊罪",
    "非法出售、提供试题、答案罪",
    "代替考试罪",
  ]);
  expect({ instrument: "criminal-law", article: 399 }, [
    "执行判决、裁定失职罪",
    "执行判决、裁定滥用职权罪",
  ]);
  expect({ instrument: "criminal-law", article: 169 }, [
    "徇私舞弊低价折股、出售公司、企业资产罪",
  ]);
  expect({ instrument: "foreign-exchange-decision", article: 1 }, ["骗购外汇罪"]);

  const activeNames = new Set(result.active.map((offense) => offense.name));
  for (const canceled of [
    "走私固体废物罪",
    "嫖宿幼女罪",
    "徇私舞弊低价折股、出售国有资产罪",
  ]) {
    if (activeNames.has(canceled)) {
      throw new Error(`已取消罪名仍处于现行状态：${canceled}`);
    }
  }
}

function validateCriminalOffenseData(data, { expectedCurrent = EXPECTED_CURRENT_OFFENSES } = {}) {
  const sourceIds = new Set();
  for (const source of data.sources) {
    if (sourceIds.has(source.id)) throw new Error(`罪名来源 ID 重复：${source.id}`);
    if (!/^[a-f0-9]{64}$/.test(source.sha256)) {
      throw new Error(`罪名来源缺少有效 SHA-256：${source.id}`);
    }
    sourceIds.add(source.id);
  }

  const result = replayCriminalOffenseTimeline(data);
  if (result.active.length !== expectedCurrent) {
    throw new Error(`现行罪名数量应为 ${expectedCurrent}，实际为 ${result.active.length}`);
  }
  validateUnresolvedCancellations(result.unresolvedCancellations);
  validateCriticalMappings(result);

  const identities = new Set();
  for (const offense of result.active) {
    for (const value of offense.provisions) {
      const identity = `${offense.name}\0${provisionIdentity(value)}`;
      if (identities.has(identity)) {
        throw new Error(`现行罪名映射重复：${offense.name} / ${provisionIdentity(value)}`);
      }
      identities.add(identity);
    }
  }

  return result;
}

function loadCurrentCriminalOffenses(options) {
  const data = loadCriminalOffenseData(options);
  return validateCriminalOffenseData(data);
}

if (require.main === module) {
  const result = loadCurrentCriminalOffenses();
  const articleCount = currentOffensesByArticle(result).size;
  console.log(
    `Validated ${result.active.length} current criminal offenses across ${articleCount} article locators from ${result.sources.length} source files.`
  );
}

module.exports = {
  DATA_DIR,
  EXPECTED_CURRENT_OFFENSES,
  currentNamesAt,
  currentOffensesByArticle,
  findCurrentOffenses,
  loadCriminalOffenseData,
  loadCurrentCriminalOffenses,
  provisionArticleKey,
  provisionIdentity,
  replayCriminalOffenseTimeline,
  validateCriminalOffenseData,
};
