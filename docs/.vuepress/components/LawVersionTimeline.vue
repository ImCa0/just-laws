<script setup>
import { computed } from "vue";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
});

const selected = computed(() =>
  props.data.versions.find((version) => version.id === props.data.selectedVersionId)
);

const statusLabel = (status) =>
  ({ current: "现行有效", pending: "尚未生效", expired: "历史版本" })[status];

const periodLabel = (version) => {
  if (version.status === "pending") return `${version.effectiveFrom} 起施行`;
  if (version.effectiveUntil) {
    return `${version.effectiveFrom} — ${version.effectiveUntil}`;
  }
  return `${version.effectiveFrom} 起施行`;
};
</script>

<template>
  <details v-if="compact" class="law-version-selector">
    <summary>
      <span>法律版本</span>
      <strong v-if="selected">{{ selected.label }} · {{ statusLabel(selected.status) }}</strong>
    </summary>
    <ol class="law-version-list">
      <li
        v-for="version in data.versions"
        :key="version.id"
        class="law-version-item"
        :class="[`is-${version.status}`, { 'is-selected': version.id === data.selectedVersionId }]"
      >
        <RouterLink
          :to="version.path"
          class="law-version-link"
          :aria-current="version.id === data.selectedVersionId ? 'page' : undefined"
        >
          <span class="law-version-dot" aria-hidden="true"></span>
          <span class="law-version-copy">
            <span class="law-version-status">{{ statusLabel(version.status) }}</span>
            <strong>{{ version.label }}</strong>
            <time>{{ periodLabel(version) }}</time>
          </span>
        </RouterLink>
      </li>
    </ol>
  </details>

  <section v-else class="law-version-timeline">
    <h2>法律版本</h2>
    <ol class="law-version-list">
      <li
        v-for="version in data.versions"
        :key="version.id"
        class="law-version-item"
        :class="[`is-${version.status}`, { 'is-selected': version.id === data.selectedVersionId }]"
      >
        <RouterLink
          :to="version.path"
          class="law-version-link"
          :aria-current="version.id === data.selectedVersionId ? 'page' : undefined"
        >
          <span class="law-version-dot" aria-hidden="true"></span>
          <span class="law-version-copy">
            <span class="law-version-status">{{ statusLabel(version.status) }}</span>
            <strong>{{ version.label }}</strong>
            <time>{{ periodLabel(version) }}</time>
          </span>
        </RouterLink>
      </li>
    </ol>
  </section>
</template>
