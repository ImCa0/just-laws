<template>
  <div
    ref="root"
    class="law-search-box"
    :class="{ 'law-search-box--home-route': isHomeRoute }"
  >
    <input
      v-model="query"
      class="law-search-box__input"
      type="search"
      autocomplete="off"
      :placeholder="placeholder"
      @focus="open"
      @input="open"
      @keydown.esc="close"
      @keydown.enter.prevent="openFirstResult"
    />

    <div v-if="isOpen" class="law-search-box__panel">
      <div v-if="isLoading" class="law-search-box__state">正在加载索引...</div>
      <div v-else-if="error" class="law-search-box__state">
        搜索索引加载失败
      </div>
      <div v-else-if="!normalizedQuery" class="law-search-box__state">
        输入关键词搜索法律名和法条内容
      </div>
      <div v-else-if="!hasResults" class="law-search-box__state">
        没有找到相关结果
      </div>
      <template v-else>
        <section v-if="titleResults.length" class="law-search-box__section">
          <h2 class="law-search-box__heading">法律</h2>
          <button
            v-for="result in titleResults"
            :key="result.id"
            class="law-search-box__result"
            type="button"
            @click="go(result.path)"
          >
            <span
              class="law-search-box__title"
              v-html="result.highlightedTitle"
            ></span>
            <span class="law-search-box__meta">{{ result.categoryName }}</span>
          </button>
        </section>

        <section v-if="articleResults.length" class="law-search-box__section">
          <h2 class="law-search-box__heading">法条内容</h2>
          <button
            v-for="result in articleResults"
            :key="result.id"
            class="law-search-box__result"
            type="button"
            @click="go(`${result.path}#${result.anchor}`)"
          >
            <span class="law-search-box__title">
              {{ result.lawTitle }} {{ result.articleLabel }}
            </span>
            <span
              class="law-search-box__excerpt"
              v-html="result.highlightedExcerpt"
            ></span>
          </button>
        </section>
      </template>
    </div>
  </div>
</template>

<script>
import { computed, onBeforeUnmount, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const COMMON_PUNCTUATION_RE =
  /[\s,.;:!?()[\]{}<>"'`~@#$%^&*_+=|\\/，。、“”‘’；：？！【】（）《》〈〉〔〕［］｛｝—…·￥-]+/g;

let cachedIndexes = null;
let loadingPromise = null;

function normalizeSearchText(text) {
  return text.normalize("NFKC").toLowerCase().replace(COMMON_PUNCTUATION_RE, "");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeSearchTextWithMap(text) {
  const chars = Array.from(text);
  const map = [];
  let normalized = "";

  chars.forEach((char, index) => {
    for (const normalizedChar of Array.from(char.normalize("NFKC").toLowerCase())) {
      if (!normalizeSearchText(normalizedChar)) {
        continue;
      }

      normalized += normalizedChar;
      map.push(index);
    }
  });

  return { chars, map, normalized };
}

function highlightedExcerptFor(content, normalizedQuery) {
  if (!content || !normalizedQuery) {
    return escapeHtml(content || "");
  }

  const { chars, map, normalized } = normalizeSearchTextWithMap(content);
  const matchIndex = normalized.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    const fallback = chars.slice(0, 120).join("");
    return `${escapeHtml(fallback)}${chars.length > 120 ? "..." : ""}`;
  }

  const matchStart = map[matchIndex];
  const matchEnd = map[matchIndex + normalizedQuery.length - 1] + 1;
  const snippetStart = Math.max(0, matchStart - 36);
  const snippetEnd = Math.min(chars.length, matchEnd + 84);
  const prefix = snippetStart > 0 ? "..." : "";
  const suffix = snippetEnd < chars.length ? "..." : "";
  const before = chars.slice(snippetStart, matchStart).join("");
  const hit = chars.slice(matchStart, matchEnd).join("");
  const after = chars.slice(matchEnd, snippetEnd).join("");

  return [
    escapeHtml(prefix + before),
    `<mark>${escapeHtml(hit)}</mark>`,
    escapeHtml(after + suffix),
  ].join("");
}

function highlightedTextFor(text, normalizedQuery) {
  if (!text || !normalizedQuery) {
    return escapeHtml(text || "");
  }

  const { chars, map, normalized } = normalizeSearchTextWithMap(text);
  const matchIndex = normalized.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return escapeHtml(text);
  }

  const matchStart = map[matchIndex];
  const matchEnd = map[matchIndex + normalizedQuery.length - 1] + 1;

  return [
    escapeHtml(chars.slice(0, matchStart).join("")),
    `<mark>${escapeHtml(chars.slice(matchStart, matchEnd).join(""))}</mark>`,
    escapeHtml(chars.slice(matchEnd).join("")),
  ].join("");
}

async function loadIndexes() {
  if (cachedIndexes) {
    return cachedIndexes;
  }

  if (!loadingPromise) {
    loadingPromise = Promise.all([
      fetch("/search/law-title-index.json").then((response) => {
        if (!response.ok) throw new Error("Failed to load title index");
        return response.json();
      }),
      fetch("/search/law-article-index.json").then((response) => {
        if (!response.ok) throw new Error("Failed to load article index");
        return response.json();
      }),
    ]).then(([titleIndex, articleIndex]) => {
      cachedIndexes = { titleIndex, articleIndex };
      return cachedIndexes;
    });
  }

  return loadingPromise;
}

export default {
  name: "LawSearchBox",
  setup() {
    const router = useRouter();
    const route = useRoute();
    const root = ref(null);
    const query = ref("");
    const isOpen = ref(false);
    const isLoading = ref(false);
    const error = ref(null);
    const titleIndex = ref([]);
    const articleIndex = ref([]);
    const placeholder = "搜索法律或法条";

    const normalizedQuery = computed(() => normalizeSearchText(query.value));
    const isHomeRoute = computed(
      () => route.path === "/" || route.path === "/index.html"
    );

    const titleResults = computed(() => {
      if (!normalizedQuery.value) return [];

      return titleIndex.value
        .filter((item) => item.titleSearch.includes(normalizedQuery.value))
        .slice(0, 8)
        .map((item) => ({
          ...item,
          highlightedTitle: highlightedTextFor(item.title, normalizedQuery.value),
        }));
    });

    const articleResults = computed(() => {
      if (!normalizedQuery.value) return [];

      return articleIndex.value
        .filter((item) => item.contentSearch.includes(normalizedQuery.value))
        .slice(0, 20)
        .map((item) => ({
          ...item,
          highlightedExcerpt: highlightedExcerptFor(
            item.content,
            normalizedQuery.value
          ),
        }));
    });

    const hasResults = computed(
      () => titleResults.value.length > 0 || articleResults.value.length > 0
    );

    const ensureIndexes = async () => {
      if (cachedIndexes) {
        titleIndex.value = cachedIndexes.titleIndex;
        articleIndex.value = cachedIndexes.articleIndex;
        return;
      }

      isLoading.value = true;
      error.value = null;

      try {
        const indexes = await loadIndexes();
        titleIndex.value = indexes.titleIndex;
        articleIndex.value = indexes.articleIndex;
      } catch (err) {
        error.value = err;
      } finally {
        isLoading.value = false;
      }
    };

    const open = () => {
      isOpen.value = true;
      ensureIndexes();
    };

    const close = () => {
      isOpen.value = false;
    };

    const go = async (path) => {
      close();
      query.value = "";
      await router.push(path);
    };

    const openFirstResult = () => {
      const firstTitle = titleResults.value[0];
      const firstArticle = articleResults.value[0];

      if (firstTitle) {
        go(firstTitle.path);
      } else if (firstArticle) {
        go(`${firstArticle.path}#${firstArticle.anchor}`);
      }
    };

    const handleDocumentClick = (event) => {
      if (!root.value || root.value.contains(event.target)) {
        return;
      }

      close();
    };

    if (typeof document !== "undefined") {
      document.addEventListener("click", handleDocumentClick);
    }

    onBeforeUnmount(() => {
      if (typeof document !== "undefined") {
        document.removeEventListener("click", handleDocumentClick);
      }
    });

    return {
      articleResults,
      close,
      error,
      go,
      hasResults,
      isLoading,
      isOpen,
      isHomeRoute,
      normalizedQuery,
      open,
      openFirstResult,
      placeholder,
      query,
      root,
      titleResults,
    };
  },
};
</script>

<style>
.law-search-box {
  position: relative;
  display: inline-block;
  vertical-align: top;
  --law-search-accent: var(--c-brand);
  --law-search-accent-soft: color-mix(in srgb, var(--law-search-accent) 10%, var(--c-bg));
  --law-search-ring: color-mix(in srgb, var(--law-search-accent) 28%, transparent);
}

.navbar .law-search-box:not(.jl-home-search) {
  position: relative;
  flex: 0 0 auto;
  margin-left: 0.8rem;
  z-index: 31;
}

.law-search-box--home-route:not(.jl-home-search) {
  display: none;
}

.navbar .navbar-items-wrapper {
  align-items: center;
  min-width: 0;
}

.navbar .navbar-items {
  flex: 1 1 auto;
  min-width: 0;
}

.navbar .navbar-items .navbar-item {
  margin-left: 0.85rem;
}

.navbar .law-search-box:not(.jl-home-search) .law-search-box__input {
  width: 7.5rem;
  height: 2rem;
  padding-left: 0.85rem;
  background: linear-gradient(180deg, color-mix(in srgb, var(--law-search-accent) 4%, var(--c-bg)) 0%, var(--c-bg) 100%);
  box-shadow: none;
}

.navbar .law-search-box:not(.jl-home-search) .law-search-box__input:focus {
  width: min(13rem, 22vw);
}

.navbar .law-search-box:not(.jl-home-search) .law-search-box__panel {
  position: fixed;
  top: calc(var(--navbar-height) - 0.15rem);
  right: 1rem;
}

.law-search-box__input {
  width: var(--search-input-width, 10rem);
  height: 2.15rem;
  box-sizing: border-box;
  padding: 0 0.85rem 0 2rem;
  border: 1px solid color-mix(in srgb, var(--law-search-accent) 26%, var(--c-border));
  border-radius: 999px;
  color: var(--c-text);
  background:
    radial-gradient(circle at 0.85rem 50%, var(--law-search-accent) 0 0.24rem, transparent 0.26rem),
    linear-gradient(180deg, color-mix(in srgb, var(--law-search-accent) 4%, var(--c-bg)) 0%, var(--c-bg) 100%);
  outline: none;
  box-shadow: 0 6px 18px rgb(0 0 0 / 6%);
  transition: width 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.law-search-box__input:focus {
  width: min(15rem, calc(100vw - 2rem));
  border-color: var(--law-search-accent);
  box-shadow: 0 0 0 3px var(--law-search-ring), 0 12px 28px rgb(0 0 0 / 10%);
}

.law-search-box__panel {
  position: absolute;
  top: calc(100% + 0.45rem);
  right: 0;
  z-index: 30;
  width: min(34rem, calc(100vw - 2rem));
  max-height: min(34rem, calc(100vh - var(--navbar-height) - 2rem));
  overflow: auto;
  box-sizing: border-box;
  padding: 0.65rem;
  border: 1px solid color-mix(in srgb, var(--law-search-accent) 18%, var(--c-border));
  border-radius: 14px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--law-search-accent) 5%, var(--c-bg)) 0%, var(--c-bg) 5.25rem),
    var(--c-bg);
  box-shadow: 0 18px 50px rgb(0 0 0 / 16%);
}

.law-search-box__state {
  padding: 1rem;
  color: var(--c-text-light);
  font-size: 0.9rem;
}

.law-search-box__section + .law-search-box__section {
  margin-top: 0.7rem;
  padding-top: 0.65rem;
  border-top: 1px solid color-mix(in srgb, var(--law-search-accent) 16%, var(--c-border));
}

.law-search-box__heading {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.45rem;
  padding: 0.1rem 0.35rem;
  color: var(--c-text);
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.3;
}

.law-search-box__heading::before {
  content: "";
  width: 0.24rem;
  height: 1.05rem;
  border-radius: 999px;
  background: var(--law-search-accent);
}

.law-search-box__result {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 0.68rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 10px;
  color: var(--c-text);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.16s ease, background-color 0.16s ease, transform 0.16s ease;
}

.law-search-box__result:hover,
.law-search-box__result:focus {
  border-color: color-mix(in srgb, var(--law-search-accent) 22%, transparent);
  background: var(--law-search-accent-soft);
  outline: none;
  transform: translateY(-1px);
}

.law-search-box__title,
.law-search-box__meta,
.law-search-box__excerpt {
  display: block;
}

.law-search-box__title {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.45;
}

.law-search-box__meta,
.law-search-box__excerpt {
  margin-top: 0.2rem;
  color: var(--c-text-light);
  font-size: 0.78rem;
  line-height: 1.45;
}

.law-search-box mark {
  padding: 0 0.12em;
  border-radius: 3px;
  color: var(--c-text);
  background: color-mix(in srgb, var(--law-search-accent) 22%, transparent);
  font-weight: 800;
}

.law-search-box.jl-home-search {
  display: block;
  width: min(38rem, 100%);
  margin-top: 2rem;
  z-index: 20;
}

.law-search-box.jl-home-search .law-search-box__input {
  width: 100%;
  height: 3.35rem;
  padding-right: 1.25rem;
  padding-left: 2.75rem;
  border-radius: 18px;
  font-size: 1rem;
  background:
    radial-gradient(circle at 1.25rem 50%, var(--law-search-accent) 0 0.3rem, transparent 0.32rem),
    linear-gradient(135deg, color-mix(in srgb, var(--law-search-accent) 9%, #fff) 0%, rgba(255, 255, 255, 0.94) 100%);
  box-shadow: 0 18px 42px rgb(27 30 37 / 13%);
}

.law-search-box.jl-home-search .law-search-box__input:focus {
  width: 100%;
  box-shadow: 0 0 0 4px var(--law-search-ring), 0 22px 58px rgb(27 30 37 / 18%);
}

.law-search-box.jl-home-search .law-search-box__panel {
  right: auto;
  left: 0;
  width: min(38rem, calc(100vw - 2rem));
  border-radius: 18px;
}

@media (max-width: 719px) {
  .law-search-box--home-route:not(.jl-home-search) {
    display: none;
  }

  .navbar .law-search-box:not(.jl-home-search) {
    position: relative;
    display: inline-block;
    margin-left: 0.55rem;
  }

  .navbar .law-search-box:not(.jl-home-search) .law-search-box__input {
    width: 10rem;
  }

  .navbar .law-search-box:not(.jl-home-search) .law-search-box__input:focus {
    width: 10rem;
  }

  .law-search-box__panel {
    position: fixed;
    top: var(--navbar-height);
    right: 0.75rem;
    left: 0.75rem;
    width: auto;
  }

  .law-search-box.jl-home-search .law-search-box__input {
    height: 3.1rem;
    border-radius: 16px;
  }

  .law-search-box.jl-home-search .law-search-box__panel {
    position: absolute;
    top: calc(100% + 0.55rem);
    right: 0;
    left: 0;
    width: 100%;
    max-height: min(28rem, calc(100vh - 2rem));
  }

  .navbar .law-search-box--home-route:not(.jl-home-search) {
    display: none;
  }
}

@media (min-width: 720px) and (max-width: 1180px) {
  .navbar .law-search-box:not(.jl-home-search) {
    display: none;
  }
}
</style>
