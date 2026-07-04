// @ts-nocheck
import { defineClientConfig } from "@vuepress/client";
import LawSearchBox from "./components/LawSearchBox.vue";

let initialArticleHash =
  typeof window !== "undefined" && window.location.hash.startsWith("#article-")
    ? window.location.hash
    : "";

const getArticleHash = (route) => {
  if (route.hash?.startsWith("#article-")) {
    return route.hash;
  }

  const hash = initialArticleHash;
  initialArticleHash = "";

  return hash;
};

const scrollToArticle = (hash) => {
  if (typeof window === "undefined" || !hash) {
    return;
  }

  window.requestAnimationFrame(() => {
    const id = decodeURIComponent(hash.slice(1));
    const target = document.getElementById(id);

    if (!target) {
      return;
    }

    const navbarHeight =
      document.querySelector(".navbar")?.getBoundingClientRect().height || 0;
    const top =
      target.getBoundingClientRect().top +
      window.scrollY -
      navbarHeight -
      16;

    window.scrollTo({
      top: Math.max(top, 0),
      behavior: "auto",
    });
  });
};

export default defineClientConfig({
  enhance({ app, router }) {
    app.component("SearchBox", LawSearchBox);

    router.afterEach((to) => {
      if (typeof _hmt != "undefined") {
        if (to.path) {
          _hmt.push(["_trackPageview", to.fullPath]);
        }
      }
      scrollToArticle(getArticleHash(to));
    });
  },
});
