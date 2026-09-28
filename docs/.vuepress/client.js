// @ts-nocheck
import { defineClientConfig } from "@vuepress/client";
import { nextTick, onMounted } from "vue";
import { useRouter } from "vue-router";
import { articleNavigationPosition } from "./articleNavigation.mjs";
import LawSearchBox from "./components/LawSearchBox.vue";
import TwikooMessageBoard from "./components/TwikooMessageBoard.vue";
import "./styles/foundation.scss";
import "./styles/reading.scss";

// VuePress beta's initial route can omit the URL fragment during hydration.
const initialArticleLocation = typeof window !== "undefined" &&
  /^#article-\d+(?:-\d+)*$/.test(window.location.hash)
  ? { path: window.location.pathname, hash: window.location.hash } : null;

const waitForArticle = (hash) => {
  if (!/^#article-\d+(?:-\d+)*$/.test(hash || "") || document.getElementById(hash.slice(1))) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const finish = () => { observer.disconnect(); clearTimeout(timeout); resolve(); };
    const observer = new MutationObserver(() => {
      if (document.getElementById(hash.slice(1))) finish();
    });
    const timeout = setTimeout(finish, 3000);
    observer.observe(document.body, { childList: true, subtree: true });
  });
};

export default defineClientConfig({
  enhance({ app, router }) {
    app.component("SearchBox", LawSearchBox);
    app.component("TwikooMessageBoard", TwikooMessageBoard);

    // VuePress beta scrolls by coordinates, so headings need an explicit navbar offset.
    const scrollBehavior = router.options.scrollBehavior;
    router.options.scrollBehavior = async (to, from, savedPosition) => {
      const position = await scrollBehavior?.(to, from, savedPosition);
      await nextTick();
      if (typeof document !== "undefined") {
        await waitForArticle(to.hash);
        // Ignore an older navigation that finished after a newer one.
        if (router.currentRoute.value.fullPath !== to.fullPath) return false;
        const articlePosition = articleNavigationPosition(to.hash, document, window);
        // Article URLs always restore the exact article, including back/forward.
        if (articlePosition) return articlePosition;
      }
      if (
        !savedPosition && position && "el" in position &&
        typeof document !== "undefined" && document.querySelector(".law-reading")
      ) {
        const navbarHeight = document.querySelector(".navbar")?.getBoundingClientRect().height || 0;
        return { ...position, top: navbarHeight + 16 };
      }
      return position;
    };

    router.afterEach((to) => {
      if (typeof _hmt != "undefined") {
        if (to.path) {
          _hmt.push(["_trackPageview", to.fullPath]);
        }
      }
    });
  },
  setup() {
    const router = useRouter();
    onMounted(async () => {
      await router.isReady();
      const route = router.currentRoute.value;
      if (initialArticleLocation && route.path === initialArticleLocation.path &&
          (!route.hash || route.hash === initialArticleLocation.hash)) {
        await router.replace({ path: route.path, query: route.query,
          hash: initialArticleLocation.hash, force: true });
      }
    });
  },
});
