const path = require("node:path");
const {
  chinaDate,
  decorateManifest,
  loadLawManifests,
} = require("../../../scripts/manage-law-versions");

function toPosix(value) {
  return value.replace(/\\/g, "/");
}

function lawVersionsPlugin({ docsDir, asOf = chinaDate() }) {
  const records = loadLawManifests(docsDir, { asOf });

  return {
    name: "just-laws-law-versions",
    extendsPage(page) {
      if (!page.filePathRelative) return;
      const relative = toPosix(page.filePathRelative);

      for (const record of records) {
        const lawId = record.manifest.lawId;
        if (!relative.startsWith(`${lawId}/`)) continue;
        const entry = relative.slice(lawId.length + 1);
        const selected = record.manifest.versions.find((version) => version.entry === entry);
        if (!selected) return;

        const data = decorateManifest(record, asOf);
        page.data.lawVersions = {
          ...data,
          selectedVersionId: selected.id,
        };

        if (entry !== "README.md") {
          page.routeMeta.title = `${record.manifest.title}（${selected.label}）`;
        }
        return;
      }
    },
  };
}

module.exports = { lawVersionsPlugin };
