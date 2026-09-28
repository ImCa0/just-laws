<script setup>
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { readReaderToolsExpanded, saveReaderToolsExpanded } from "../readerToolsPreference.mjs";

const props = defineProps({ targets: { type: Object, default: () => ({}) }, criminal: Boolean, showOffenses: Boolean });
const emit = defineEmits(["update:showOffenses"]);
const router = useRouter();
const expanded = ref(false);
onMounted(() => { expanded.value = readReaderToolsExpanded(window); });
function setExpanded(value) {
  expanded.value = value;
  saveReaderToolsExpanded(value, window);
}
const number = ref("");
const error = ref("");
const toggle = ref(null);
watch(number, () => { error.value = ""; });
function close() { setExpanded(false); toggle.value?.focus(); }
async function jump() {
  const value = number.value.trim().replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
  const match = /^(\d+)(?:\s*[-之]\s*(\d+))?$/.exec(value);
  const id = match && `article-${Number(match[1])}${match[2] ? `-${Number(match[2])}` : ""}`;
  const href = id && props.targets[id];
  if (!href) { error.value = match ? "本法当前版本中未找到该条。" : "请输入条号，如 103 或 133-1。"; return; }
  error.value = "";
  const { path, query, hash } = router.resolve(href);
  await router.push({ path, query, hash, force: true });
}
</script>

<template>
  <aside class="law-reader-tools" aria-label="阅读工具" @keydown.esc="close">
    <button ref="toggle" type="button" class="reader-tools-toggle" :aria-expanded="expanded" aria-controls="reader-tools-panel" @click="setExpanded(!expanded)">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="9" cy="18" r="2" fill="currentColor"/></svg>
      阅读工具 <span class="reader-tools-chevron" aria-hidden="true">{{ expanded ? '−' : '+' }}</span>
    </button>
    <div v-show="expanded" id="reader-tools-panel" class="reader-tools-panel">
      <form @submit.prevent="jump">
        <label for="reader-article-number">跳转条文</label>
        <div class="reader-tools-input-row">
          <input id="reader-article-number" v-model="number" type="text" inputmode="text" placeholder="如 103、133-1" autocomplete="off" :aria-invalid="!!error" aria-describedby="reader-tools-help reader-tools-error" />
          <button type="submit">跳转</button>
        </div>
        <p id="reader-tools-help">输入条号；“之一”用 -1 表示。</p>
        <p v-show="error" id="reader-tools-error" role="alert">{{ error }}</p>
      </form>
      <label v-if="criminal" class="reader-tools-offenses">
        <span>显示罪名</span>
        <input type="checkbox" :checked="showOffenses" @change="emit('update:showOffenses', $event.target.checked)" />
      </label>
    </div>
  </aside>
</template>

<style lang="scss">
.law-reader-tools { box-sizing: border-box; width: 100%; color: var(--jl-ink); font-size: 14px; background: var(--jl-panel); border: 1px solid var(--jl-line); border-radius: 8px; }
.reader-tools-toggle { display: flex; align-items: center; gap: 8px; width: 100%; padding: 18px; color: var(--jl-ink); background: transparent; border: 0; border-radius: 8px; font: inherit; font-family: var(--jl-serif); font-size: 1.1rem; text-align: left; cursor: pointer; }
.reader-tools-chevron { margin-left: auto; color: var(--jl-muted); }
.reader-tools-toggle:focus-visible { outline-offset: -4px; }
.reader-tools-toggle:hover { color: var(--jl-red); border-color: var(--jl-red); }
.reader-tools-panel { box-sizing: border-box; width: 100%; padding: 6px 18px 18px; }
.reader-tools-panel label { font-weight: 600; }
.reader-tools-input-row { display: flex; gap: 8px; margin-top: 10px; }
.reader-tools-input-row input { width: 0; flex: 1; min-width: 0; padding: 8px; color: var(--jl-ink); background: var(--jl-bg); border: 1px solid var(--jl-line); border-radius: 5px; font: inherit; }
.reader-tools-input-row button { padding: 8px 12px; color: white; background: var(--jl-red); border: 0; border-radius: 5px; cursor: pointer; }
.reader-tools-panel p { margin: 8px 0 0; font-size: 12px; line-height: 1.6; color: var(--jl-muted); }
.reader-tools-panel #reader-tools-error { color: var(--jl-red); }
.reader-tools-offenses { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--jl-line); cursor: pointer; }
.reader-tools-offenses input { width: 18px; height: 18px; accent-color: var(--jl-red); }
.law-offenses-hidden .criminal-offense-note { display: none; }
@media print { .law-reader-tools { display: none; } }
</style>
