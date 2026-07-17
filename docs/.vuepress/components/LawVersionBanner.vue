<script setup>
import { computed } from "vue";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

const selected = computed(() =>
  props.data.versions.find((version) => version.id === props.data.selectedVersionId)
);
</script>

<template>
  <section
    v-if="selected && selected.status !== 'current'"
    class="law-version-banner"
    :class="`is-${selected.status}`"
    role="note"
    :aria-label="selected.status === 'pending' ? '尚未生效版本' : '历史版本'"
  >
    <strong>{{ selected.status === "pending" ? "尚未生效" : "历史版本" }}</strong>
    <span v-if="selected.status === 'pending'">
      本版本于<time :datetime="selected.promulgatedOn">{{ selected.promulgatedOn }}</time
      >公布，将于<time :datetime="selected.effectiveFrom">{{ selected.effectiveFrom }}</time
      >起施行。
    </span>
    <span v-else>
      本版本有效期至<time :datetime="selected.effectiveUntil">{{ selected.effectiveUntil }}</time
      >。
    </span>
  </section>
</template>
