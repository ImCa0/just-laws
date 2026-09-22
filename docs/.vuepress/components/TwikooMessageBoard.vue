<template>
  <div class="message-board-shell">
    <nav class="message-board-breadcrumb" aria-label="面包屑">
      <RouterLink to="/">首页</RouterLink><span aria-hidden="true">/</span><span aria-current="page">留言板</span>
    </nav>

    <header class="message-board-hero">
      <div>
        <p class="message-board-kicker">一起完善法律文库</p>
        <h1>留言板</h1>
        <p class="message-board-description">反馈文本问题，分享使用建议，或只是路过打个招呼。<br />每一条留言，都是让这个文库变得更好的起点。</p>
      </div>
      <CatalogIcon name="message" class="message-board-hero-icon" />
    </header>

    <div class="message-board-layout">
      <section class="message-board-conversation" aria-labelledby="message-board-write-title">
        <div class="message-board-section-heading">
          <h2 id="message-board-write-title">写下你的留言</h2>
          <span>欢迎交流，感谢同行</span>
        </div>
        <div class="twikoo-message-board">
          <div v-if="status === 'loading'" class="twikoo-message-board__status" role="status">
            正在加载留言…
          </div>
          <div v-if="status === 'error'" class="twikoo-message-board__status" role="alert">
            <p>留言板暂时未能加载，请稍后重试。</p>
            <button type="button" @click="loadTwikoo">重新加载</button>
          </div>
          <div id="twikoo-message-board" ref="twikooContainer"></div>
        </div>
      </section>

      <aside class="message-board-aside" aria-label="留言提示与站点支持">
        <details class="message-board-donate">
          <summary><CatalogIcon name="coffee" /><span><strong>请我喝杯咖啡</strong><small>如果这个文库对你有所帮助</small></span><span class="message-board-donate-toggle" aria-hidden="true">+</span></summary>
          <div class="message-board-donate__content">
            <p>感谢你对 Just Laws 的支持。</p>
            <figure><img :src="withBase('/images/ali.jpg')" alt="支付宝收款码" loading="lazy" /><figcaption>支付宝</figcaption></figure>
            <figure><img :src="withBase('/images/wechat.jpg')" alt="微信收款码" loading="lazy" /><figcaption>微信</figcaption></figure>
          </div>
        </details>

        <section class="message-board-guide" aria-labelledby="message-board-guide-title">
          <div class="message-board-guide-heading"><CatalogIcon name="book" /><h2 id="message-board-guide-title">让反馈更清楚</h2></div>
          <div class="message-board-guide-item"><span>01</span><div><h3>发现文本问题</h3><p>请附上法律名称、条文编号或页面链接，方便定位和核对。</p></div></div>
          <div class="message-board-guide-item"><span>02</span><div><h3>有新的想法</h3><p>说说你的使用场景，以及希望改进的地方。具体的建议很有帮助。</p></div></div>
          <p class="message-board-privacy">留言会公开展示，请勿在正文中留下手机号、证件号码等个人隐私信息。</p>
        </section>

        <RouterLink to="/category/" class="message-board-back">继续浏览法律文库<CatalogIcon name="arrow" /></RouterLink>
      </aside>
    </div>

    <footer class="message-board-footer"><span>JUST LAWS · 法律文库</span><p>认真对待每一条建议，也尊重每一种声音。</p></footer>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { withBase } from "@vuepress/client";
import CatalogIcon from "./CatalogIcon.vue";
import "twikoo/dist/twikoo.css";
import "../styles/message-board.scss";

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
