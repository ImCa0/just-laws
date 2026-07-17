const path = require("node:path");
const { defaultTheme } = require("@vuepress/theme-default");

function justLawsTheme(options) {
  return {
    name: "just-laws-theme",
    extends: defaultTheme(options),
    alias: {
      "@theme/Page.vue": path.resolve(__dirname, "components/Page.vue"),
    },
  };
}

module.exports = { justLawsTheme };
