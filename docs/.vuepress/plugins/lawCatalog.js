const fs = require("node:fs");
const path = require("node:path");
const { parseCategoryLinks } = require("../../../scripts/sort-category-pages");

// Presentation only: law names, destinations and counts come from category Markdown.
const CATEGORY_PRESENTATION = {
  constitution: {
    label: "宪法", icon: "constitution",
    description: "国家的根本法。阅读序言、正文与历次宪法修正案。",
  },
  "constitutional-relevance": {
    label: "宪法相关法", icon: "institution",
    description: "国家机构、立法制度与公民基本权利。",
  },
  "civil-and-commercial": {
    label: "民商法", icon: "book",
    description: "民事权利、婚姻家庭与市场交易。",
  },
  administrative: {
    label: "行政法", icon: "administration",
    description: "行政管理、公共服务与社会秩序。",
  },
  economic: {
    label: "经济法", icon: "economy",
    description: "经济管理、财税金融与市场规范。",
  },
  social: {
    label: "社会法", icon: "people",
    description: "劳动就业、社会保障与权益保护。",
  },
  "ecological-environment": {
    label: "生态环境法", icon: "leaf",
    description: "生态保护、资源利用与绿色发展。",
  },
  "criminal-law": {
    label: "刑法", icon: "scales",
    description: "犯罪、刑事责任与刑罚。",
  },
  procedural: {
    label: "程序法", icon: "procedure",
    description: "诉讼、仲裁与纠纷解决程序。",
  },
};

function readCatalog(docsDir) {
  const categoryDir = path.join(docsDir, "category");
  const overview = fs.readFileSync(path.join(categoryDir, "README.md"), "utf8");
  const slugs = ["constitution", ...parseCategoryLinks(overview).map(({ target }) =>
    path.posix.basename(target, ".html")
  )];

  return [...new Set(slugs)].map((slug) => {
    const source = fs.readFileSync(path.join(categoryDir, `${slug}.md`), "utf8");
    const title = source.match(/^#\s+(.+)$/m)?.[1].trim() || slug;
    const presentation = CATEGORY_PRESENTATION[slug] || {
      label: title, icon: "book", description: `浏览${title}相关法律。`,
    };
    const laws = parseCategoryLinks(source).map(({ text, target }) => ({
      title: text,
      link: path.posix.normalize(path.posix.join("/category/", target)),
      category: presentation.label,
      categorySlug: slug,
    }));

    return {
      slug, title, ...presentation,
      link: `/category/${slug}.html`,
      count: laws.length,
      laws,
    };
  });
}

function lawCatalogPlugin({ docsDir }) {
  return {
    name: "just-laws-law-catalog",
    extendsPage(page) {
      const relative = page.filePathRelative?.replace(/\\/g, "/");
      const isHome = relative === "README.md";
      const isCategory = /^category\/[^/]+\.md$/.test(relative || "");
      const readingGroup = relative?.split("/")[0];
      const isReading = Object.hasOwn(CATEGORY_PRESENTATION, readingGroup || "");
      if (!isHome && !isCategory && !isReading) return;

      const catalog = readCatalog(docsDir);
      const slug = path.posix.basename(relative, ".md");
      const current = catalog.find((category) => category.slug === slug);
      if (isCategory && slug !== "README" && !current) return;

      // Refresh derived counts and links when any source directory changes in dev.
      page.deps.push(...["README", ...catalog.map((category) => category.slug)]
        .map((name) => path.join(docsDir, "category", `${name}.md`))
        .filter((filename) => filename !== page.filePath));

      const allLaws = [...new Map(catalog.flatMap((category) => category.laws)
        .map((law) => [law.link, law])).values()];
      const categories = catalog.map(({ laws, ...category }) => category);

      if (isHome) {
        page.data.lawHome = {
          categories: categories.filter((category) => category.slug !== "constitution"),
          total: allLaws.length,
        };
        return;
      }

      if (isReading) {
        const law = allLaws.find((item) => page.path.startsWith(item.link));
        const category = categories.find((item) => item.slug === (law?.categorySlug || readingGroup));
        page.data.lawReading = {
          category: category.label,
          categoryLink: category.link,
          parentLaw: law && page.path !== law.link ? { title: law.title, link: law.link } : null,
        };
        page.frontmatter.pageClass = [page.frontmatter.pageClass, "law-reading-page"].filter(Boolean).join(" ");
        return;
      }

      page.data.lawCatalog = {
        currentSlug: current?.slug || null,
        categories,
        laws: current ? current.laws : allLaws,
        total: allLaws.length,
      };
      page.frontmatter.sidebar = false;
      page.frontmatter.pageClass = [page.frontmatter.pageClass, "law-catalog-page"]
        .filter(Boolean).join(" ");
      page.frontmatter.description = current?.description || "按法律类别浏览 Just Laws 法律文库，筛选法律名称，快速进入正文阅读。";
      page.data.title = current?.title || "法律分类";
      page.title = page.data.title;
    },
  };
}

module.exports = { lawCatalogPlugin };
