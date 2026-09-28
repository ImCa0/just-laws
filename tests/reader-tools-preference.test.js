const test = require("node:test");
const assert = require("node:assert/strict");

test("工具栏首次折叠、全局保存展开和折叠、无存储时保留会话偏好", async () => {
  const { readReaderToolsExpanded: read, saveReaderToolsExpanded: save, READER_TOOLS_EXPANDED_KEY: key } =
    await import("../docs/.vuepress/readerToolsPreference.mjs");
  const data = new Map();
  const viewport = { localStorage: { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) } };
  assert.equal(read(viewport), false);
  save(true, viewport);
  assert.equal(data.get(key), "true");
  assert.equal(read(viewport), true);
  save(false, viewport);
  assert.equal(data.get(key), "false");
  assert.equal(read(viewport), false);
  data.set(key, "invalid");
  assert.equal(read(viewport), false);
  const blocked = { get localStorage() { throw new Error("Storage blocked"); } };
  save(true, blocked);
  assert.equal(read(blocked), true);
  assert.equal(read(undefined), false); // SSR never inherits browser state.
  save(false, blocked);
  assert.equal(read(blocked), false);
});
