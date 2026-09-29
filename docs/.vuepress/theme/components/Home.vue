<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { usePageData, withBase } from "@vuepress/client";
import LawSearchBox from "../../components/LawSearchBox.vue";
import CatalogIcon from "../../components/CatalogIcon.vue";
import { readRecentSearches, RECENT_SEARCHES_EVENT } from "../../recentSearches.mjs";
import "../../styles/home.scss";

const page = usePageData();
const data = computed(() => page.value.lawHome || { categories: [], total: 0 });
const commonLaws = [
  { title: "民法典", category: "民商法", icon: "book", description: "从日常生活中的权利与义务开始。", link: "/civil-and-commercial/civil-code/" },
  { title: "刑法", category: "刑法", icon: "scales", description: "查阅犯罪、刑事责任与刑罚的基本规定。", link: "/criminal-law/criminal-law/" },
  { title: "劳动法", category: "社会法", icon: "people", description: "了解劳动者与用人单位的基本权利义务。", link: "/social/labor-law/" },
  { title: "劳动合同法", category: "社会法", icon: "people", description: "查阅劳动合同订立、履行与解除的规定。", link: "/social/labor-contracts-law/" },
  { title: "公司法", category: "民商法", icon: "institution", description: "了解公司设立、组织与经营的基本规则。", link: "/civil-and-commercial/company-law/" },
  { title: "消费者权益保护法", category: "民商法", icon: "book", description: "查阅消费交易中的权利、责任与救济方式。", link: "/civil-and-commercial/protection-of-the-rights-and-interests-of-consumers/" },
  { title: "个人信息保护法", category: "经济法", icon: "economy", description: "了解个人信息处理与权益保护的基本规则。", link: "/economic/personal-information-protection-law/" },
  { title: "未成年人保护法", category: "社会法", icon: "people", description: "查阅家庭、学校、社会和网络保护规定。", link: "/social/protection-of-minors/" },
  { title: "道路交通安全法", category: "行政法", icon: "administration", description: "了解道路通行、车辆驾驶和事故处理规则。", link: "/administrative/road-traffic-safety-law/" },
  { title: "民事诉讼法", category: "程序法", icon: "procedure", description: "查阅民事审判与执行程序。", link: "/procedural/civil-procedure/" },
  { title: "刑事诉讼法", category: "程序法", icon: "procedure", description: "查阅刑事案件立案、侦查、审判与执行程序。", link: "/procedural/criminal-procedure/" },
  { title: "行政诉讼法", category: "程序法", icon: "procedure", description: "了解公民、法人提起行政诉讼的程序。", link: "/procedural/administrative-procedure/" },
  { title: "食品安全法", category: "行政法", icon: "administration", description: "查阅食品生产经营、安全标准和监管责任。", link: "/administrative/food-safety-law/" },
  { title: "治安管理处罚法", category: "行政法", icon: "administration", description: "了解违反治安管理行为及其处罚程序。", link: "/administrative/penalties-for-administration-of-public-security/" },
  { title: "社会保险法", category: "社会法", icon: "people", description: "查阅养老、医疗、工伤等社会保险制度。", link: "/social/social-insurance-law/" },
  { title: "反电信网络诈骗法", category: "刑法", icon: "scales", description: "了解电信网络诈骗治理与风险防范规定。", link: "/criminal-law/combating-telecom-and-online-fraud/" },
  { title: "电子商务法", category: "经济法", icon: "economy", description: "查阅网络经营、平台责任与交易保障规则。", link: "/economic/e-commerce-law/" },
  { title: "著作权法", category: "民商法", icon: "book", description: "了解作品权利、许可使用与侵权责任。", link: "/civil-and-commercial/copyright-law/" },
  { title: "专利法", category: "民商法", icon: "book", description: "查阅发明创造的专利申请、保护与运用。", link: "/civil-and-commercial/patent-law/" },
  { title: "保险法", category: "民商法", icon: "economy", description: "了解保险合同、保险经营与理赔规则。", link: "/civil-and-commercial/insurance-law/" },
];
const featured = ref(commonLaws.slice(0, 4));
const recentSearches = ref([]);
const homeSearch = ref(null);

function shuffled(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function refreshFeatured() {
  const currentLinks = new Set(featured.value.map((law) => law.link));
  const unusedLaws = commonLaws.filter((law) => !currentLinks.has(law.link));
  featured.value = shuffled(unusedLaws.length >= 4 ? unusedLaws : commonLaws).slice(0, 4);
}

function syncRecentSearches() {
  recentSearches.value = readRecentSearches(typeof window !== "undefined" ? window : null);
}

function repeatSearch(item) {
  homeSearch.value?.search(item.query);
}

onMounted(() => {
  refreshFeatured();
  syncRecentSearches();
  window.addEventListener(RECENT_SEARCHES_EVENT, syncRecentSearches);
});

onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener(RECENT_SEARCHES_EVENT, syncRecentSearches);
  }
});
</script>

<template>
  <main class="jl-home">
    <div class="jl-home-inner">
      <section class="jl-home-hero" aria-labelledby="home-title">
        <div class="jl-home-intro">
          <p class="jl-home-kicker">中国法律文库</p>
          <h1 id="home-title"><span>法律原文，</span><em>清晰可读。</em></h1>
          <p class="jl-home-lead">从一部法律，到每一条法规。<br />在这里查找、阅读，了解与你有关的法律。</p>
          <div class="jl-home-search-wrap" role="search" aria-label="搜索法律与条文">
            <CatalogIcon name="search" />
            <LawSearchBox ref="homeSearch" class="jl-home-search" />
          </div>
          <div class="jl-home-shortcuts" aria-label="最近搜索"><span>最近搜索</span><button v-for="item in recentSearches" :key="`${item.query}-${item.path}`" type="button" @click.stop="repeatSearch(item)">{{ item.query }}</button><small v-if="!recentSearches.length">暂无搜索记录</small></div>
          <RouterLink to="/category/" class="jl-home-browse">浏览全部法律<CatalogIcon name="arrow" /></RouterLink>
        </div>
        <RouterLink to="/constitution/preamble.html" class="jl-home-feature" aria-label="从序言开始阅读中华人民共和国宪法">
          <div class="jl-book-scene" aria-hidden="true">
            <div class="jl-book-back"><span>法律文库</span></div>
            <div class="jl-book-cover"><span class="jl-book-imprint">JUST LAWS</span><span class="jl-book-country">中华人民共和国</span><strong>宪法</strong><span class="jl-book-rule" /><CatalogIcon name="constitution" /><span class="jl-book-edition">法律原文 · 数字阅读</span></div>
          </div>
          <div class="jl-home-feature-caption"><div><span>从国家根本法开始</span><strong>阅读《中华人民共和国宪法》</strong></div><CatalogIcon name="arrow" /></div>
        </RouterLink>
      </section>

      <div class="jl-home-overview" aria-label="文库概览">
        <div><strong>{{ data.total }}</strong><span>部法律已收录</span></div>
        <div><strong>{{ data.categories.length }}</strong><span>个法律类别</span></div>
      </div>

      <section class="jl-home-section" aria-labelledby="home-featured-title">
        <div class="jl-home-section-head"><div><h2 id="home-featured-title">从常用法律开始</h2></div><button class="jl-home-refresh" type="button" @click="refreshFeatured">换一换<CatalogIcon name="refresh" /></button></div>
        <div class="jl-home-featured-grid">
          <RouterLink v-for="law in featured" :key="law.link" :to="law.link" class="jl-home-law-card">
            <div class="jl-home-law-top"><CatalogIcon :name="law.icon" /><span>{{ law.category }}</span></div>
            <h3>{{ law.title }}</h3><p>{{ law.description }}</p><span class="jl-home-law-action">阅读正文<CatalogIcon name="arrow" /></span>
          </RouterLink>
        </div>
      </section>

      <section class="jl-home-section" aria-labelledby="home-categories-title">
        <div class="jl-home-section-head"><div><h2 id="home-categories-title">循类别，找到所需</h2></div><RouterLink to="/category/">查看完整目录<CatalogIcon name="arrow" /></RouterLink></div>
        <div class="jl-home-categories">
          <RouterLink v-for="category in data.categories" :key="category.slug" :to="category.link" class="jl-home-category"><CatalogIcon :name="category.icon" /><span><strong>{{ category.label }}</strong><small>{{ category.count }} 部法律</small></span><CatalogIcon name="arrow" /></RouterLink>
        </div>
      </section>

      <section class="jl-home-about" aria-labelledby="home-about-title">
        <div><h2 id="home-about-title">让查阅简单，<br />让阅读专注。</h2></div>
        <div><p>Just Laws 将法律原文整理成结构清晰的数字文本。按类别查找，沿章节阅读，也可以直接检索一条具体的法规。</p><p>有建议，或发现了需要修正的内容？<RouterLink to="/MessageBoard/">到留言板告诉我<CatalogIcon name="arrow" /></RouterLink></p></div>
      </section>

      <footer class="jl-home-footer"><div><img :src="withBase('/images/logo.svg')" alt="" width="24" height="24" /><strong>Just Laws</strong><span>清晰、可检索的法律文库</span></div><p>MIT Licensed · ©2022–2026 <a href="https://www.imcao.cn" target="_blank" rel="noopener noreferrer">ImCaO</a><br /><a href="https://beian.miit.gov.cn/#/Integrated/index" target="_blank" rel="noopener noreferrer">浙ICP备2020040461号-2</a></p></footer>
    </div>
  </main>
</template>
