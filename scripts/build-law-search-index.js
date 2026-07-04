const fs = require("node:fs");
const path = require("node:path");
const {
  createArticleAnchor,
} = require("../docs/.vuepress/markdown/lawArticleAnchors");
const { parseCategoryLinks } = require("./sort-category-pages");

const DOCS_DIR = path.resolve(__dirname, "..", "docs");
const CATEGORY_DIR = path.join(DOCS_DIR, "category");
const SEARCH_DIR = path.join(DOCS_DIR, ".vuepress", "public", "search");
const EXCLUDED_DIRS = new Set([".vuepress", "category"]);

const ARTICLE_LABEL_RE =
  /^(?:\*\*)?(\u7b2c[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u5343\u4e07\u96f6\u3007\u4e24]+\u6761(?:\u4e4b[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u5343\u4e07\u96f6\u3007\u4e24]+)?)(?:\*\*)?[\u3000\s]*(.*)$/;
const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;
const COMMON_PUNCTUATION_RE =
  /[\s,.;:!?()[\]{}<>"'`~@#$%^&*_+=|\\/，。、“”‘’；：？！【】（）《》〈〉〔〕［］｛｝—…·￥-]+/g;

function normalizeSearchText(text) {
  return text.normalize("NFKC").toLowerCase().replace(COMMON_PUNCTUATION_RE, "");
}

function stripFrontmatter(source) {
  return source.replace(FRONTMATTER_RE, "");
}

function stripMarkdown(text) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function firstHeading(source) {
  const match = stripFrontmatter(source).match(/^#\s+(.+)$/m);
  return match ? stripMarkdown(match[1]) : "";
}

function sitePathForMarkdown(filename) {
  const relative = path.relative(DOCS_DIR, filename).replace(/\\/g, "/");

  if (relative.endsWith("/README.md")) {
    return `/${relative.slice(0, -"README.md".length)}`;
  }

  return `/${relative.replace(/\.md$/, ".html")}`;
}

function sitePathForCategoryTarget(target) {
  const normalized = target.replace(/\\/g, "/").replace(/^\.\.\//, "");

  if (normalized.endsWith(".md")) {
    return `/${normalized.replace(/README\.md$/, "").replace(/\.md$/, ".html")}`;
  }

  return `/${normalized.replace(/^\/+|\/+$/g, "")}/`;
}

function lawIdForRoot(rootDir) {
  return path.relative(DOCS_DIR, rootDir).replace(/\\/g, "/");
}

function categoryMap() {
  const map = new Map();

  if (!fs.existsSync(CATEGORY_DIR)) {
    return map;
  }

  for (const filename of fs.readdirSync(CATEGORY_DIR)) {
    if (!filename.endsWith(".md") || filename === "README.md") {
      continue;
    }

    const categorySlug = filename.replace(/\.md$/, "");
    const categoryFile = path.join(CATEGORY_DIR, filename);
    const source = fs.readFileSync(categoryFile, "utf8");
    const categoryName = firstHeading(source) || categorySlug;

    for (const link of parseCategoryLinks(source)) {
      map.set(sitePathForCategoryTarget(link.target), {
        categorySlug,
        categoryName,
      });
    }
  }

  return map;
}

function collectLawRoots(dir = DOCS_DIR) {
  const roots = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || EXCLUDED_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const hasReadme = fs.existsSync(path.join(fullPath, "README.md"));

    if (hasReadme && fullPath !== DOCS_DIR) {
      roots.push(fullPath);
      continue;
    }

    roots.push(...collectLawRoots(fullPath));
  }

  return roots;
}

function markdownFilesForLaw(rootDir) {
  return fs
    .readdirSync(rootDir)
    .filter((name) => name.endsWith(".md"))
    .sort((left, right) => {
      if (left === "README.md") return -1;
      if (right === "README.md") return 1;
      return left.localeCompare(right);
    })
    .map((name) => path.join(rootDir, name));
}

function excerptFor(content) {
  return content.length > 120 ? `${content.slice(0, 120)}...` : content;
}

function parseArticles({ filename, lawId, lawTitle, category }) {
  const source = stripFrontmatter(fs.readFileSync(filename, "utf8"));
  const lines = source.split(/\r?\n/);
  const pathForPage = sitePathForMarkdown(filename);
  const pageAnchors = new Map();
  const articles = [];
  let partTitle = "";
  let current = null;

  const closeArticle = () => {
    if (!current) {
      return;
    }

    const content = current.lines
      .map(stripMarkdown)
      .filter(Boolean)
      .join("");

    if (content) {
      articles.push({
        id: `${lawId}:${path.relative(DOCS_DIR, filename).replace(/\\/g, "/")}:${
          current.anchor
        }`,
        lawId,
        lawTitle,
        categorySlug: category.categorySlug,
        categoryName: category.categoryName,
        articleLabel: current.articleLabel,
        partTitle: current.partTitle,
        path: pathForPage,
        anchor: current.anchor,
        content,
        excerpt: excerptFor(content),
        contentSearch: normalizeSearchText(content),
      });
    }

    current = null;
  };

  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+)$/);

    if (heading) {
      closeArticle();
      partTitle = stripMarkdown(heading[2]);
      continue;
    }

    const match = line.match(ARTICLE_LABEL_RE);

    if (match) {
      closeArticle();

      const normalizedLine = stripMarkdown(line);
      const baseAnchor = createArticleAnchor(normalizedLine);

      if (!baseAnchor) {
        continue;
      }

      const usedCount = pageAnchors.get(baseAnchor) || 0;
      pageAnchors.set(baseAnchor, usedCount + 1);
      const anchor =
        usedCount === 0 ? baseAnchor : `${baseAnchor}-${usedCount + 1}`;
      const articleBody = match[2] || "";

      current = {
        articleLabel: match[1],
        anchor,
        partTitle,
        lines: [articleBody],
      };
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  closeArticle();
  return articles;
}

function buildIndexes() {
  const categories = categoryMap();
  const titleIndex = [];
  const articleIndex = [];

  for (const lawRoot of collectLawRoots()) {
    const readme = path.join(lawRoot, "README.md");
    const lawTitle = firstHeading(fs.readFileSync(readme, "utf8"));

    if (!lawTitle) {
      continue;
    }

    const lawId = lawIdForRoot(lawRoot);
    const rootPath = sitePathForMarkdown(readme);
    const category =
      categories.get(rootPath) || {
        categorySlug: lawId.split("/")[0],
        categoryName: lawId.split("/")[0],
      };

    titleIndex.push({
      id: lawId,
      lawId,
      title: lawTitle,
      categorySlug: category.categorySlug,
      categoryName: category.categoryName,
      path: rootPath,
      titleSearch: normalizeSearchText(lawTitle),
    });

    for (const filename of markdownFilesForLaw(lawRoot)) {
      articleIndex.push(
        ...parseArticles({
          filename,
          lawId,
          lawTitle,
          category,
        })
      );
    }
  }

  titleIndex.sort((left, right) => left.title.localeCompare(right.title, "zh-CN"));

  return { titleIndex, articleIndex };
}

function writeJson(filename, value) {
  fs.mkdirSync(SEARCH_DIR, { recursive: true });
  fs.writeFileSync(path.join(SEARCH_DIR, filename), JSON.stringify(value), "utf8");
}

if (require.main === module) {
  const { titleIndex, articleIndex } = buildIndexes();
  writeJson("law-title-index.json", titleIndex);
  writeJson("law-article-index.json", articleIndex);
  console.log(
    `Generated ${titleIndex.length} law title records and ${articleIndex.length} article records.`
  );
}

module.exports = {
  buildIndexes,
  normalizeSearchText,
};
