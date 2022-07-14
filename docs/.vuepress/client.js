// @ts-nocheck
import { defineClientConfig } from "@vuepress/client";

export default defineClientConfig({
  enhance({ router }) {
    router.afterEach((to) => {
      if (typeof _hmt != "undefined") {
        if (to.path) {
          _hmt.push(["_trackPageview", to.fullPath]);
        }
      }
    });
  },
});
