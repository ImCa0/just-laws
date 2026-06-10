const fs = require("node:fs");
const path = require("node:path");
const { parseCategoryLinks } = require("../../scripts/sort-category-pages");

function toSiteLink(target) {
  const relativePath = target.replace(/^\.\.\//, "").replace(/^\/+|\/+$/g, "");
  return `/${relativePath}/`;
}

function categoryNavbarItem({ text, slug, featured }) {
  const categoryPath = path.resolve(__dirname, "..", "category", `${slug}.md`);
  const links = parseCategoryLinks(fs.readFileSync(categoryPath, "utf8"));
  const linksByText = new Map(links.map((link) => [link.text, link.target]));
  const children = featured.map((lawName) => {
    const target = linksByText.get(lawName);
    if (!target) {
      throw new Error(`Category ${slug} does not contain featured law: ${lawName}`);
    }

    return { text: lawName, link: toSiteLink(target) };
  });

  children.push({
    text: `查看全部 ${links.length} 部${text}`,
    link: `/category/${slug}`,
  });

  return { text, children };
}

module.exports = { categoryNavbarItem };
