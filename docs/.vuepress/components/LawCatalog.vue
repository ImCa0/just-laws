<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import CatalogIcon from "./CatalogIcon.vue";
import "../styles/catalog.scss";

const props = defineProps({ data: { type: Object, required: true } });
const router = useRouter();
const data = computed(() => props.data);
const current = computed(() => data.value.categories.find((item) => item.slug === data.value.currentSlug));
const categories = computed(() => data.value.categories.filter((item) => item.slug !== "constitution"));
const constitution = computed(() => data.value.categories.find((item) => item.slug === "constitution"));
const query = ref("");
const searchInput = ref(null);
const view = ref("grid");
const normalize = (value) => value.normalize("NFKC").toLocaleLowerCase("zh-CN").replace(/\s+/g, "");
const keyword = computed(() => normalize(query.value));
const filteredLaws = computed(() => data.value.laws.filter((law) =>
  normalize(`中华人民共和国${law.title}`).includes(keyword.value)
));
const showLaws = computed(() => current.value || keyword.value);
const title = computed(() => current.value?.title || "法律分类");

function clearSearch() {
  query.value = "";
  searchInput.value?.focus();
}

watch(() => data.value.currentSlug, () => { query.value = ""; });
</script>

<template>
  <div class="catalog-shell">
    <nav class="catalog-breadcrumb" aria-label="面包屑">
      <RouterLink to="/">首页</RouterLink><span aria-hidden="true">/</span>
      <RouterLink v-if="current" to="/category/">法律分类</RouterLink>
      <template v-if="current"><span aria-hidden="true">/</span></template>
      <span aria-current="page">{{ title }}</span>
    </nav>

    <header class="catalog-hero">
      <div>
        <p class="catalog-kicker">中国法律文库</p>
        <h1>{{ title }}</h1>
        <p class="catalog-description">{{ current?.description || "按类别探索法律文库，让每一次查阅都有清晰的起点。" }}</p>
      </div>
      <div class="catalog-stats" aria-label="目录概览">
        <div><strong>{{ current ? current.count : data.total }}</strong><span>{{ current ? "本类法律" : "收录法律" }}</span></div>
        <div v-if="!current"><strong>{{ categories.length }}</strong><span>法律类别</span></div>
        <CatalogIcon v-else :name="current.icon" class="catalog-hero-icon" />
      </div>
    </header>

    <div class="catalog-workspace" :class="{ 'has-navigation': current }">
      <aside v-if="current" class="catalog-sidebar">
        <nav aria-label="法律分类导航">
          <RouterLink class="catalog-all-link" to="/category/"><CatalogIcon name="grid" />全部类别<CatalogIcon name="arrow" /></RouterLink>
          <p class="catalog-nav-label">按类别浏览</p>
          <RouterLink v-for="category in data.categories" :key="category.slug" :to="category.link"
            class="catalog-nav-link" :class="{ 'is-active': category.slug === current.slug }"
            :aria-current="category.slug === current.slug ? 'page' : undefined">
            <span>{{ category.label }}</span><span class="catalog-nav-count">{{ category.count }}</span>
          </RouterLink>
        </nav>
        <div class="catalog-mobile-navigation">
          <RouterLink to="/category/">全部类别</RouterLink>
          <label for="catalog-category" class="catalog-sr-only">切换法律类别</label>
          <select id="catalog-category" :value="current.link" @change="router.push($event.target.value)">
            <option v-for="category in data.categories" :key="category.slug" :value="category.link">{{ category.label }} · {{ category.count }} 部</option>
          </select>
        </div>
        <p class="catalog-sidebar-note">在目录中找到法律，<br />在正文中继续阅读。</p>
      </aside>

      <div class="catalog-main">
        <form class="catalog-search" role="search" aria-label="筛选目录中的法律" @submit.prevent>
          <CatalogIcon name="search" />
          <label for="catalog-query" class="catalog-sr-only">{{ current ? "筛选本类法律" : "查找法律名称" }}</label>
          <input id="catalog-query" ref="searchInput" v-model="query" type="search" autocomplete="off"
            :placeholder="current ? `在${current.label}中查找法律名称…` : '输入法律名称，快速查找，如：民法典、劳动合同法'"
            aria-controls="catalog-results" @keydown.esc="clearSearch" />
          <button v-if="query" type="button" class="catalog-clear" aria-label="清空搜索" @click="clearSearch"><CatalogIcon name="close" /></button>
          <span v-else class="catalog-search-hint">{{ current ? "本类筛选" : "全目录查找" }}</span>
        </form>

        <div id="catalog-results">
          <template v-if="!showLaws">
            <RouterLink v-if="constitution" class="catalog-constitution" to="/constitution/preamble.html">
              <span class="catalog-constitution-icon"><CatalogIcon name="constitution" /></span>
              <span class="catalog-constitution-copy"><span class="catalog-eyebrow">国家根本法</span><strong>中华人民共和国宪法</strong><span>序言、正文与历次宪法修正案</span></span>
              <span class="catalog-constitution-action">阅读宪法<CatalogIcon name="arrow" /></span>
            </RouterLink>

            <div class="catalog-section-heading"><h2>按类别浏览</h2><span>{{ categories.length }} 个类别，选择一个开始阅读</span></div>
            <div class="catalog-category-grid">
              <RouterLink v-for="(category, index) in categories" :key="category.slug" :to="category.link" class="catalog-category-card">
                <div class="catalog-card-top"><CatalogIcon :name="category.icon" /><span>{{ String(index + 1).padStart(2, "0") }}</span></div>
                <h3>{{ category.label }}</h3>
                <p>{{ category.description }}</p>
                <div class="catalog-card-bottom"><span><strong>{{ category.count }}</strong> 部法律</span><CatalogIcon name="arrow" /></div>
              </RouterLink>
            </div>
          </template>

          <template v-else>
            <div class="catalog-section-heading catalog-results-heading">
              <div><h2>{{ keyword ? "查找结果" : "全部法律" }}</h2><span role="status" aria-live="polite" aria-atomic="true">{{ keyword ? `找到 ${filteredLaws.length} 部法律` : `共 ${filteredLaws.length} 部 · 按目录顺序排列` }}</span></div>
              <div class="catalog-view-switch" role="group" aria-label="目录显示方式">
                <button type="button" :aria-pressed="view === 'grid'" aria-label="卡片视图" title="卡片视图" @click="view = 'grid'"><CatalogIcon name="grid" /></button>
                <button type="button" :aria-pressed="view === 'list'" aria-label="列表视图" title="列表视图" @click="view = 'list'"><CatalogIcon name="list" /></button>
              </div>
            </div>
            <ul v-if="filteredLaws.length" class="catalog-law-grid" :class="{ 'is-list': view === 'list' }">
              <li v-for="(law, index) in filteredLaws" :key="law.link">
                <RouterLink :to="law.link" class="catalog-law-card">
                  <span class="catalog-law-number" aria-hidden="true">{{ String(index + 1).padStart(2, "0") }}</span>
                  <span class="catalog-law-copy"><strong>{{ law.title }}</strong><span>{{ current ? '查看法律正文' : law.category }}</span></span>
                  <CatalogIcon name="arrow" />
                </RouterLink>
              </li>
            </ul>
            <div v-else class="catalog-empty">
              <CatalogIcon name="search" /><h3>没有找到相关法律</h3>
              <p>试试更简短的名称，或清空关键词重新浏览。</p>
              <button type="button" @click="clearSearch">清空关键词</button>
              <RouterLink v-if="current" to="/category/">前往全部类别查找<CatalogIcon name="arrow" /></RouterLink>
            </div>
          </template>
        </div>

        <footer class="catalog-footer"><span>JUST LAWS</span><p>目录数量根据本站收录条目统计。法律版本与效力信息请查阅正文。</p></footer>
      </div>
    </div>
  </div>
</template>
