const fs = require("node:fs");
const path = require("node:path");

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const REQUIRED_VERSION_FIELDS = [
  "id",
  "label",
  "promulgatedOn",
  "effectiveFrom",
  "entry",
];

function toPosix(value) {
  return value.replace(/\\/g, "/");
}

function chinaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function validateDate(value, label) {
  const match = typeof value === "string" ? value.match(DATE_RE) : null;
  if (!match) {
    throw new Error(`${label} 必须是 YYYY-MM-DD：${value}`);
  }

  const [, year, month, day] = match;
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() !== Number(month) - 1 ||
    parsed.getUTCDate() !== Number(day)
  ) {
    throw new Error(`${label} 不是有效日期：${value}`);
  }
  return value;
}

function effectiveUntil(effectiveTo) {
  if (!effectiveTo) return null;
  const date = new Date(`${effectiveTo}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function statusForDate(version, asOf) {
  if (asOf < version.effectiveFrom) return "pending";
  if (version.effectiveTo && asOf >= version.effectiveTo) return "expired";
  return "current";
}

function routeForEntry(lawId, entry) {
  const relative = toPosix(entry);
  if (relative === "README.md") return `/${lawId}/`;
  if (relative.endsWith("/README.md")) {
    return `/${lawId}/${relative.slice(0, -"README.md".length)}`;
  }
  return `/${lawId}/${relative.replace(/\.md$/, ".html")}`;
}

function discoverManifestPaths(docsDir) {
  const results = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === ".vuepress") continue;
      const child = path.join(directory, entry.name);
      const manifest = path.join(child, "versions.json");
      if (fs.existsSync(manifest)) {
        results.push(manifest);
        continue;
      }
      walk(child);
    }
  };
  walk(docsDir);
  return results.sort();
}

function readManifest(manifestPath) {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    throw new Error(`${manifestPath} 不是有效 JSON：${error.message}`);
  }
  return {
    manifestPath,
    lawDir: path.dirname(manifestPath),
    manifest,
  };
}

function validateManifest(record, docsDir, asOf, { enforceRootCurrent = true } = {}) {
  const { manifestPath, lawDir, manifest } = record;
  const prefix = toPosix(path.relative(docsDir, manifestPath));

  if (manifest.schemaVersion !== 1) {
    throw new Error(`${prefix}: schemaVersion 必须为 1`);
  }
  const expectedLawId = toPosix(path.relative(docsDir, lawDir));
  if (manifest.lawId !== expectedLawId) {
    throw new Error(`${prefix}: lawId 应为 ${expectedLawId}`);
  }
  if (typeof manifest.title !== "string" || !manifest.title.trim()) {
    throw new Error(`${prefix}: title 不能为空`);
  }
  if (!Array.isArray(manifest.versions) || manifest.versions.length < 2) {
    throw new Error(`${prefix}: versions 至少需要两个版本`);
  }

  const ids = new Set();
  const entries = new Set();
  for (const version of manifest.versions) {
    for (const field of REQUIRED_VERSION_FIELDS) {
      if (typeof version[field] !== "string" || !version[field].trim()) {
        throw new Error(`${prefix}: 版本 ${version.id || "<unknown>"} 缺少 ${field}`);
      }
    }
    if (ids.has(version.id)) throw new Error(`${prefix}: 版本 id 重复：${version.id}`);
    if (entries.has(version.entry)) throw new Error(`${prefix}: 版本入口重复：${version.entry}`);
    ids.add(version.id);
    entries.add(version.entry);

    validateDate(version.promulgatedOn, `${version.id}.promulgatedOn`);
    validateDate(version.effectiveFrom, `${version.id}.effectiveFrom`);
    if (version.effectiveTo !== null) {
      validateDate(version.effectiveTo, `${version.id}.effectiveTo`);
      if (version.effectiveFrom >= version.effectiveTo) {
        throw new Error(`${prefix}: ${version.id} 的生效日期必须早于失效日期`);
      }
    }
    if (version.promulgatedOn > version.effectiveFrom) {
      throw new Error(`${prefix}: ${version.id} 的公布日期不能晚于生效日期`);
    }

    const entryPath = path.resolve(lawDir, version.entry);
    const lawRoot = `${path.resolve(lawDir)}${path.sep}`;
    if (!entryPath.startsWith(lawRoot) || !fs.existsSync(entryPath)) {
      throw new Error(`${prefix}: 版本入口不存在或越界：${version.entry}`);
    }
  }

  const sorted = [...manifest.versions].sort((left, right) =>
    left.effectiveFrom.localeCompare(right.effectiveFrom)
  );
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (!previous.effectiveTo || previous.effectiveTo > current.effectiveFrom) {
      throw new Error(`${prefix}: ${previous.id} 与 ${current.id} 的有效期重叠`);
    }
  }

  const rootVersions = manifest.versions.filter((version) => version.entry === "README.md");
  if (rootVersions.length !== 1) {
    throw new Error(`${prefix}: 必须恰好有一个版本使用根目录 README.md`);
  }
  const currentVersions = manifest.versions.filter(
    (version) => statusForDate(version, asOf) === "current"
  );
  if (currentVersions.length > 1) {
    throw new Error(`${prefix}: ${asOf} 存在多个现行有效版本`);
  }
  if (
    enforceRootCurrent &&
    currentVersions.length === 1 &&
    currentVersions[0].id !== rootVersions[0].id
  ) {
    throw new Error(
      `${prefix}: ${asOf} 的现行版本 ${currentVersions[0].id} 尚未提升到根目录`
    );
  }

  return record;
}

function loadLawManifests(docsDir, options = {}) {
  const asOf = validateDate(options.asOf || chinaDate(), "asOf");
  return discoverManifestPaths(docsDir).map((manifestPath) =>
    validateManifest(readManifest(manifestPath), docsDir, asOf, options)
  );
}

function decorateManifest(record, asOf) {
  const versions = [...record.manifest.versions]
    .sort((left, right) => left.effectiveFrom.localeCompare(right.effectiveFrom))
    .map((version) => ({
      ...version,
      status: statusForDate(version, asOf),
      effectiveUntil: effectiveUntil(version.effectiveTo),
      path: routeForEntry(record.manifest.lawId, version.entry),
    }));
  return {
    schemaVersion: record.manifest.schemaVersion,
    lawId: record.manifest.lawId,
    title: record.manifest.title,
    asOf,
    versions,
  };
}

function promoteVersion({ docsDir, lawId, asOf, apply = false, output = console.log }) {
  validateDate(asOf, "asOf");
  const manifestPath = path.join(docsDir, ...lawId.split("/"), "versions.json");
  if (!fs.existsSync(manifestPath)) throw new Error(`未找到版本配置：${lawId}`);

  const record = validateManifest(readManifest(manifestPath), docsDir, asOf, {
    enforceRootCurrent: false,
  });
  const rootVersion = record.manifest.versions.find((version) => version.entry === "README.md");
  const targetVersions = record.manifest.versions.filter(
    (version) => statusForDate(version, asOf) === "current"
  );
  if (targetVersions.length !== 1) {
    throw new Error(`${lawId}: ${asOf} 必须恰好有一个现行有效版本`);
  }
  const targetVersion = targetVersions[0];
  if (targetVersion.id === rootVersion.id) {
    output(`${lawId}: ${rootVersion.label} 已是 ${asOf} 的根目录版本，无需轮换`);
    return { changed: false };
  }

  const rootPath = path.join(record.lawDir, "README.md");
  const targetPath = path.resolve(record.lawDir, targetVersion.entry);
  const archivedEntry = `versions/${rootVersion.effectiveFrom}/README.md`;
  const archivedPath = path.resolve(record.lawDir, archivedEntry);
  if (fs.existsSync(archivedPath)) throw new Error(`归档目标已存在：${archivedEntry}`);

  output(`${lawId}: ${rootVersion.label} -> ${archivedEntry}`);
  output(`${lawId}: ${targetVersion.label} -> README.md`);
  if (!apply) {
    output("预览完成；添加 --apply 才会写入文件");
    return { changed: true, dryRun: true };
  }

  const originalManifest = fs.readFileSync(manifestPath, "utf8");
  fs.mkdirSync(path.dirname(archivedPath), { recursive: true });
  fs.renameSync(rootPath, archivedPath);
  try {
    fs.renameSync(targetPath, rootPath);
    rootVersion.entry = archivedEntry;
    targetVersion.entry = "README.md";
    fs.writeFileSync(manifestPath, `${JSON.stringify(record.manifest, null, 2)}\n`, "utf8");
  } catch (error) {
    if (fs.existsSync(rootPath) && !fs.existsSync(targetPath)) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.renameSync(rootPath, targetPath);
    }
    if (fs.existsSync(archivedPath) && !fs.existsSync(rootPath)) {
      fs.renameSync(archivedPath, rootPath);
    }
    fs.writeFileSync(manifestPath, originalManifest, "utf8");
    throw error;
  }

  const oldTargetDirectory = path.dirname(targetPath);
  if (fs.existsSync(oldTargetDirectory) && fs.readdirSync(oldTargetDirectory).length === 0) {
    fs.rmdirSync(oldTargetDirectory);
  }
  validateManifest(readManifest(manifestPath), docsDir, asOf);
  output(`${lawId}: 已完成版本轮换`);
  return { changed: true, dryRun: false };
}

function optionValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  const docsDir = path.resolve(process.cwd(), "docs");
  if (command === "validate") {
    const asOf = optionValue(args, "--as-of") || chinaDate();
    const records = loadLawManifests(docsDir, { asOf });
    console.log(`Validated ${records.length} versioned law(s) as of ${asOf}.`);
    return;
  }
  if (command === "promote") {
    const lawId = args.find((value) => !value.startsWith("--"));
    const asOf = optionValue(args, "--as-of");
    if (!lawId || !asOf) {
      throw new Error("用法：promote <lawId> --as-of YYYY-MM-DD [--apply]");
    }
    promoteVersion({ docsDir, lawId, asOf, apply: args.includes("--apply") });
    return;
  }
  throw new Error("用法：manage-law-versions.js <validate|promote>");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  chinaDate,
  decorateManifest,
  discoverManifestPaths,
  effectiveUntil,
  loadLawManifests,
  promoteVersion,
  routeForEntry,
  statusForDate,
  validateManifest,
};
