<script setup>
import { usePageData } from "@vuepress/client";
import { computed } from "vue";
import PageMeta from "@theme/PageMeta.vue";
import PageNav from "@theme/PageNav.vue";
import LawVersionBanner from "../../components/LawVersionBanner.vue";
import LawVersionTimeline from "../../components/LawVersionTimeline.vue";

const page = usePageData();
const versionData = computed(() => page.value.lawVersions || null);
</script>

<template>
  <main class="page" :class="{ 'law-version-page': versionData }">
    <slot name="top" />

    <template v-if="versionData">
      <div class="law-version-layout">
        <div class="law-version-main">
          <div class="law-version-mobile">
            <LawVersionTimeline :data="versionData" compact />
          </div>

          <div class="theme-default-content">
            <slot name="content-top" />
            <LawVersionBanner :data="versionData" />
            <Content />
            <slot name="content-bottom" />
          </div>

          <PageMeta />
          <PageNav />
          <slot name="bottom" />
        </div>

        <aside class="law-version-aside" aria-label="法律版本">
          <LawVersionTimeline :data="versionData" />
        </aside>
      </div>
    </template>

    <template v-else>
      <div class="theme-default-content">
        <slot name="content-top" />
        <Content />
        <slot name="content-bottom" />
      </div>

      <PageMeta />
      <PageNav />
      <slot name="bottom" />
    </template>
  </main>
</template>
