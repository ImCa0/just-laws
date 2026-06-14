const fs = require("node:fs");
const path = require("node:path");

const LINK_LINE_RE = /^\[([^\]]+)\]\(([^)]+)\)$/;
const PINYIN_COLLATOR = new Intl.Collator("zh-CN-u-co-pinyin", {
  sensitivity: "base",
  numeric: true,
});

function parseCategoryLinks(source) {
  return source
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(LINK_LINE_RE);
      return match ? { text: match[1], target: match[2] } : null;
    })
    .filter(Boolean);
}

function sortCategorySource(source) {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const lines = source.split(/\r?\n/);
  const linkIndexes = [];
  const links = [];

  lines.forEach((line, index) => {
    const match = line.match(LINK_LINE_RE);
    if (match) {
      linkIndexes.push(index);
      links.push({ line, text: match[1] });
    }
  });

  links.sort((left, right) => {
    return PINYIN_COLLATOR.compare(left.text, right.text);
  });
  linkIndexes.forEach((lineIndex, index) => {
    lines[lineIndex] = links[index].line;
  });

  return lines.join(eol);
}

function categoryFiles(inputs) {
  return inputs.flatMap((input) => {
    const resolved = path.resolve(input);
    const stat = fs.statSync(resolved);
    if (!stat.isDirectory()) {
      return [resolved];
    }

    return fs
      .readdirSync(resolved)
      .filter((name) => name.endsWith(".md") && name !== "README.md")
      .map((name) => path.join(resolved, name));
  });
}

function sortCategoryFile(filename) {
  const source = fs.readFileSync(filename, "utf8");
  const sorted = sortCategorySource(source);
  if (sorted === source) {
    return false;
  }

  fs.writeFileSync(filename, sorted, "utf8");
  return true;
}

if (require.main === module) {
  const inputs = process.argv.slice(2);
  if (inputs.length === 0) {
    console.error("Usage: node scripts/sort-category-pages.js <file-or-directory> [...]");
    process.exitCode = 1;
  } else {
    const files = categoryFiles(inputs);
    const changed = files.filter(sortCategoryFile);
    console.log(`Sorted ${files.length} category pages; updated ${changed.length}.`);
  }
}

module.exports = {
  parseCategoryLinks,
  sortCategorySource,
};
