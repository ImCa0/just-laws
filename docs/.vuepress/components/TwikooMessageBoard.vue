<template>
  <section class="twikoo-message-board">
    <div v-if="status === 'loading'" class="twikoo-message-board__status">
      留言板加载中...
    </div>
    <div v-if="status === 'error'" class="twikoo-message-board__status">
      <p>留言板加载失败，请稍后重试。</p>
      <button type="button" @click="loadTwikoo">重新加载</button>
    </div>
    <div id="twikoo-message-board" ref="twikooContainer"></div>
  </section>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import "twikoo/dist/twikoo.css";

const TWIKOO_ENV_ID = "https://www.justlaws.cn/twikoo-comment";
const TWIKOO_PATH = "/MessageBoard/";
const TWIKOO_SELECTOR = "#twikoo-message-board";

const status = ref("loading");
const twikooContainer = ref(null);
let isDisposed = false;

const clearTwikooContainer = () => {
  if (twikooContainer.value) {
    twikooContainer.value.innerHTML = "";
  }
};

const loadTwikoo = async () => {
  if (typeof window === "undefined") {
    return;
  }

  status.value = "loading";
  clearTwikooContainer();

  try {
    await nextTick();
    const twikooModule = await import("twikoo/dist/twikoo.nocss.js");
    const twikoo = twikooModule.default || twikooModule;
    const initTwikoo = twikoo.init || twikoo;

    if (isDisposed || !twikooContainer.value) {
      return;
    }

    await initTwikoo({
      envId: TWIKOO_ENV_ID,
      el: TWIKOO_SELECTOR,
      path: TWIKOO_PATH,
      lang: "zh-CN",
    });

    if (!isDisposed) {
      status.value = "ready";
    }
  } catch (error) {
    console.error("Twikoo message board failed to initialize:", error);

    if (!isDisposed) {
      status.value = "error";
    }
  }
};

onMounted(loadTwikoo);

onBeforeUnmount(() => {
  isDisposed = true;
  clearTwikooContainer();
});
</script>
