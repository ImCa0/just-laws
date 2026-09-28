const fs = require("node:fs");
const path = require("node:path");
const MarkdownIt = require("markdown-it");
const { createArticleAnchor, lawArticleAnchorsPlugin } = require("./lawArticleAnchors");

const DOCS_DIR = path.resolve(__dirname, "../..");
const LEGAL_SECTIONS = new Set([
  "constitution", "constitutional-relevance", "civil-and-commercial",
  "administrative", "economic", "social", "criminal-law", "procedural",
  "ecological-environment",
]);
const ARTICLE = /第[一二三四五六七八九十百千万零〇两]+条(?:之[一二三四五六七八九十百千万零〇两]+)?/g;
const DECLARATION = /^第[一二三四五六七八九十百千万零〇两]+条(?:之[一二三四五六七八九十百千万零〇两]+)?(?=\s|$)/;
const SPLIT_HEADING = /^(第[一二三四五六七八九十百千万零〇两]+[编章节]|附\s*则|序\s*言|前\s*言)/;
const stripFrontmatter = source => source.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
const headingOf = source => /^#\s+(.+)$/m.exec(stripFrontmatter(source))?.[1].trim() || "";
const shortTitle = title => title.replace(/^中华人民共和国/, "").replace(/\s/g, "");
const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function createLawArticleResolver({ docsDir = DOCS_DIR } = {}) {
  const parser = new MarkdownIt().use(lawArticleAnchorsPlugin);
  const cache = new Map();
  const knownTitles = new Set(["刑法", "民法典", "宪法", "民事诉讼法", "刑事诉讼法", "行政诉讼法"]);

  // Law names are used only to avoid mistaking another law's references for local ones.
  function collectTitles(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) collectTitles(file);
      else if (entry.name === "README.md") {
        const title = shortTitle(headingOf(fs.readFileSync(file, "utf8")));
        if (title) knownTitles.add(title);
      }
    }
  }
  for (const section of LEGAL_SECTIONS) collectTitles(path.join(docsDir, section));
  const scopeEvents = new RegExp(
    `《[^》]+》|本(?:法|条例|规定|办法|决定|解释|编|章|节)|${[...knownTitles].sort((a, b) => b.length - a.length).map(escapeRegex).join("|")}`,
    "g"
  );

  function readPage(file, sourceOverride) {
    const stat = fs.statSync(file);
    const key = `${stat.mtimeMs}:${stat.size}`;
    const previous = cache.get(file);
    const source = sourceOverride ?? (previous?.key === key ? previous.source : fs.readFileSync(file, "utf8"));
    if (previous?.source === source) return previous;
    const tokens = parser.parse(stripFrontmatter(source), {});
    const anchors = [];
    for (let i = 0; i < tokens.length - 1; i++) {
      if (tokens[i].type !== "paragraph_open" || tokens[i + 1].type !== "inline") continue;
      const text = tokens[i + 1].content.replace(/\*\*/g, "").trimStart();
      if (!DECLARATION.test(text)) continue;
      const anchor = createArticleAnchor(text);
      if (anchor) anchors.push({ key: anchor, id: tokens[i].attrGet("id") });
    }
    const page = { key, source, title: headingOf(source), anchors };
    cache.set(file, page);
    return page;
  }

  function resolve(env, source) {
    const file = env.filePath ? path.resolve(env.filePath) : path.resolve(docsDir, env.filePathRelative || "");
    const relative = path.relative(docsDir, file).replace(/\\/g, "/");
    if (!LEGAL_SECTIONS.has(relative.split("/")[0]) || !relative.endsWith(".md") || !fs.existsSync(file)) return null;
    const dir = path.dirname(file);
    const page = readPage(file, source);
    // Collections of amending instruments do not share one stable article namespace.
    if (/amendment/i.test(path.basename(file)) || /修正案|关于修改/.test(page.title)) return null;
    const isSplit = SPLIT_HEADING.test(page.title);
    const readme = path.join(dir, "README.md");
    const rootTitle = fs.existsSync(readme) ? readPage(readme, file === readme ? source : undefined).title : page.title;
    const title = isSplit ? rootTitle : page.title;
    const candidates = fs.readdirSync(dir).filter(name => name.endsWith(".md") && !/amendment/i.test(name));
    const targets = new Map();
    for (const name of candidates) {
      const candidate = path.join(dir, name);
      const other = readPage(candidate, candidate === file ? source : undefined);
      // Only the cover and actual chapters of the SAME law/version share targets.
      // Other laws/decisions in that directory remain independent.
      const sameLaw = candidate === file || ((isSplit || file === readme) &&
        (candidate === readme || SPLIT_HEADING.test(other.title)));
      if (!sameLaw) continue;
      for (const anchor of other.anchors) {
        if (targets.has(anchor.key)) targets.set(anchor.key, null); // ambiguous: do not guess
        else targets.set(anchor.key, `./${name}#${anchor.id}`);
      }
    }
    return { targets, title, scopeEvents };
  }
  return { resolve };
}

function isLocalReference(prefix, title, scopeEvents) {
  // Keep an explicit foreign-law scope across parallel/range references. A fresh
  // sentence or an explicit 本法/本章 etc. starts a new local scope.
  const clause = prefix.split(/[。！？；;\n]/).at(-1);
  let local = true;
  for (const event of clause.matchAll(scopeEvents)) {
    const name = event[0];
    local = /^本/.test(name) || shortTitle(name.replace(/^《|》$/g, "")) === shortTitle(title);
  }
  return local;
}

function lawArticleReferencesPlugin(md, options) {
  const resolver = createLawArticleResolver(options);
  md.core.ruler.push("law_article_references", state => {
    const context = resolver.resolve(state.env, state.src);
    if (!context) return;
    for (let i = 0; i < state.tokens.length - 1; i++) {
      const paragraph = state.tokens[i];
      const inline = state.tokens[i + 1];
      if (paragraph.type !== "paragraph_open" || inline?.type !== "inline") continue;
      let prefix = "";
      let linkDepth = 0;
      let rawLink = false;
      const children = [];
      for (const child of inline.children || []) {
        if (child.type === "link_open") linkDepth++;
        if (child.type === "link_close") linkDepth--;
        if (child.type === "html_inline") {
          if (/<a\b/i.test(child.content)) rawLink = true;
          if (/<\/a\s*>/i.test(child.content)) rawLink = false;
        }
        if (child.type !== "text" || linkDepth || rawLink) {
          children.push(child);
          if (["text", "code_inline"].includes(child.type)) prefix += child.content;
          if (["softbreak", "hardbreak"].includes(child.type)) prefix += "\n";
          continue;
        }
        let cursor = 0;
        for (const match of child.content.matchAll(ARTICLE)) {
          const before = prefix + child.content.slice(0, match.index);
          const isArticleLabel = !before.trim() && paragraph.attrGet("id");
          const href = context.targets.get(createArticleAnchor(match[0]));
          if (!href || (!isArticleLabel && !isLocalReference(before, context.title, context.scopeEvents))) continue;
          const text = new state.Token("text", "", 0);
          text.content = child.content.slice(cursor, match.index);
          if (text.content) children.push(text);
          const open = new state.Token("link_open", "a", 1);
          open.attrSet("href", href);
          open.attrSet("class", isArticleLabel ? "law-article-permalink" : "law-article-reference");
          open.attrSet("title", isArticleLabel ? `${match[0]}的直达链接` : `跳转至${match[0]}`);
          const label = new state.Token("text", "", 0);
          label.content = match[0];
          children.push(open, label, new state.Token("link_close", "a", -1));
          cursor = match.index + match[0].length;
        }
        if (!cursor) children.push(child);
        else if (cursor < child.content.length) {
          const tail = new state.Token("text", "", 0);
          tail.content = child.content.slice(cursor);
          children.push(tail);
        }
        prefix += child.content;
      }
      inline.children = children;
    }
  });
}

module.exports = { lawArticleReferencesPlugin, createLawArticleResolver, isLocalReference };
