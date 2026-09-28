const path = require("node:path");
const { createLawArticleResolver } = require("../markdown/lawArticleReferences");

function lawReaderToolsPlugin() {
  const resolver = createLawArticleResolver();
  return {
    name: "just-laws-reader-tools",
    extendsPage(page) {
      if (!page.filePathRelative) return;
      const context = resolver.resolve({ filePath: page.filePath }, page.content);
      if (!context) return;
      page.data.articleTargets = Object.fromEntries([...context.targets]
        .filter(([, href]) => href)
        .map(([id, href]) => {
          const [file, hash] = href.split("#");
          const route = path.posix.join("/", path.posix.dirname(page.filePathRelative.replace(/\\/g, "/")), file)
            .replace(/README\.md$/, "").replace(/\.md$/, ".html");
          return [id, `${route}#${hash}`];
        }));
    },
  };
}
module.exports = { lawReaderToolsPlugin };
