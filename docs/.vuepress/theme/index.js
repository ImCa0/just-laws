const path = require("node:path");
const { defaultTheme } = require("@vuepress/theme-default");

function justLawsTheme(options) {
  return {
    name: "just-laws-theme",
    extends: defaultTheme(options),
    alias: {
      "@theme/Page.vue": path.resolve(__dirname, "components/Page.vue"),
      "@theme/Home.vue": path.resolve(__dirname, "components/Home.vue"),
      "@theme/Navbar.vue": path.resolve(__dirname, "components/Navbar.vue"),
    },
  };
}

module.exports = { justLawsTheme };
