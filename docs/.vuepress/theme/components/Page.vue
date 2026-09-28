<script setup>
import { usePageData } from "@vuepress/client";
import { computed, ref, watch } from "vue";
import LawReaderTools from "../../components/LawReaderTools.vue";
import PageNav from "@theme/PageNav.vue";
import LawVersionBanner from "../../components/LawVersionBanner.vue";
import LawVersionTimeline from "../../components/LawVersionTimeline.vue";
import LawCatalog from "../../components/LawCatalog.vue";

const page = usePageData();
const versionData = computed(() => page.value.lawVersions || null);
const catalogData = computed(() => page.value.lawCatalog || null);
const readingData = computed(() => page.value.lawReading || null);
const showOffenses = ref(true);
const isCriminalSpecific = computed(() => page.value.path === "/criminal-law/criminal-law/02-specific-provisions.html");
watch(() => page.value.path, () => { showOffenses.value = true; });
</script>

<template>
  <main class="page" :class="{ 'law-version-page': versionData, 'law-catalog': catalogData, 'law-reading': readingData, 'law-offenses-hidden': isCriminalSpecific && !showOffenses }">
    <slot name="top" />

    <nav v-if="readingData" class="reader-breadcrumb" aria-label="阅读路径">
      <RouterLink to="/">首页</RouterLink><span aria-hidden="true">/</span>
      <RouterLink to="/category/">法律分类</RouterLink><span aria-hidden="true">/</span>
      <RouterLink :to="readingData.categoryLink">{{ readingData.category }}</RouterLink>
      <template v-if="readingData.parentLaw"><span aria-hidden="true">/</span><RouterLink :to="readingData.parentLaw.link">{{ readingData.parentLaw.title }}</RouterLink></template>
    </nav>

    <template v-if="catalogData">
      <slot name="content-top" />
      <LawCatalog :data="catalogData" />
      <slot name="content-bottom" />
      <slot name="bottom" />
    </template>

    <template v-else-if="versionData || readingData">
      <div class="law-version-layout reader-side-layout">
        <div class="law-version-main">
          <div class="theme-default-content">
            <slot name="content-top" />
            <LawVersionBanner v-if="versionData" :data="versionData" />
            <Content />
            <slot name="content-bottom" />
          </div>

          <PageNav />
          <slot name="bottom" />
        </div>

        <aside class="law-version-aside reader-side-aside" aria-label="法律版本与阅读工具">
          <div v-if="versionData" class="reader-side-versions">
            <LawVersionTimeline :data="versionData" />
          </div>
          <div v-if="versionData" class="reader-side-versions-compact">
            <LawVersionTimeline :data="versionData" compact />
          </div>
          <LawReaderTools v-if="readingData" :key="page.path" v-model:showOffenses="showOffenses" :targets="page.articleTargets" :criminal="isCriminalSpecific" />
        </aside>
      </div>
    </template>

    <template v-else>
      <div class="theme-default-content">
        <slot name="content-top" />
        <Content />
        <slot name="content-bottom" />
      </div>

      <PageNav />
      <slot name="bottom" />
    </template>
  </main>
</template>
