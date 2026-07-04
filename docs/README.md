---
home: true
title: Home
heroText: false
tagline: false
features: []
---

<main class="jl-home">
  <section class="jl-hero" aria-labelledby="jl-hero-title">
    <div class="jl-hero__inner">
      <div class="jl-hero__content">
        <h1 id="jl-hero-title">Just Laws</h1>
        <p class="jl-hero__lead">把 311 部现行有效法律整理成清晰、可检索、适合长期阅读的数字文本。</p>
        <div class="jl-hero__actions" aria-label="首页快捷入口">
          <a class="jl-button jl-button--primary" href="/constitution/preamble.html">开始阅读</a>
          <a class="jl-button jl-button--ghost" href="/category/">浏览类别</a>
        </div>
        <SearchBox class="jl-home-search" />
      </div>
      <div class="jl-overview" role="group" aria-label="收录概览">
        <div class="jl-stat">
          <strong>311</strong>
          <span>部法律已收录</span>
        </div>
        <div class="jl-stat">
          <strong>100%</strong>
          <span>覆盖现行有效法律</span>
        </div>
        <div class="jl-stat">
          <strong>8</strong>
          <span>个法律部门</span>
        </div>
        <div class="jl-stat">
          <strong>2026.04</strong>
          <span>数据更新时间</span>
        </div>
      </div>
    </div>
  </section>
  <section class="jl-section jl-featured" aria-labelledby="jl-featured-title">
    <div class="jl-section__header">
      <h2 id="jl-featured-title">从最常用的法律开始</h2>
    </div>
    <div class="jl-featured__grid">
      <a class="jl-feature" href="/constitution/">
        <span>宪</span>
        <strong>中华人民共和国宪法</strong>
        <small>序言、总纲、公民基本权利和义务、国家机构、国旗、国歌、国徽、首都</small>
      </a>
      <a class="jl-feature" href="/civil-and-commercial/civil-code/">
        <span>民</span>
        <strong>中华人民共和国民法典</strong>
        <small>总则、物权、合同、人格权、婚姻家庭、继承、侵权责任</small>
      </a>
      <a class="jl-feature" href="/criminal-law/criminal-law/">
        <span>刑</span>
        <strong>中华人民共和国刑法</strong>
        <small>总则、分则、附则与历次修正案整理</small>
      </a>
      <a class="jl-feature" href="/procedural/civil-procedure/">
        <span>诉</span>
        <strong>中华人民共和国民事诉讼法</strong>
        <small>总则、审判程序、执行程序与涉外民事诉讼程序</small>
      </a>
    </div>
  </section>

  <section class="jl-section" aria-labelledby="jl-categories-title">
    <div class="jl-section__header">
      <h2 id="jl-categories-title">按法律部门检索</h2>
    </div>
    <div class="jl-category-grid">
      <a class="jl-category" href="/category/constitutional-relevance.html">
        <strong>宪法相关法</strong>
        <span>56 部</span>
      </a>
      <a class="jl-category" href="/category/civil-and-commercial.html">
        <strong>民商法</strong>
        <span>24 部</span>
      </a>
      <a class="jl-category" href="/category/administrative.html">
        <strong>行政法</strong>
        <span>75 部</span>
      </a>
      <a class="jl-category" href="/category/economic.html">
        <strong>经济法</strong>
        <span>71 部</span>
      </a>
      <a class="jl-category" href="/category/social.html">
        <strong>社会法</strong>
        <span>31 部</span>
      </a>
      <a class="jl-category" href="/category/ecological-environment.html">
        <strong>生态环境法</strong>
        <span>36 部</span>
      </a>
      <a class="jl-category" href="/category/criminal-law.html">
        <strong>刑法</strong>
        <span>7 部</span>
      </a>
      <a class="jl-category" href="/category/procedural.html">
        <strong>程序法</strong>
        <span>10 部</span>
      </a>
    </div>
  </section>

  <section class="jl-section jl-principles" aria-labelledby="jl-principles-title">
    <div>
      <h2 id="jl-principles-title">让法律条文回归文本本身</h2>
    </div>
    <div class="jl-principles__list">
      <div>
        <strong>清晰结构</strong>
        <span>按编、章、节和条文组织，长法典保留分卷导航。</span>
      </div>
      <div>
        <strong>跨端访问</strong>
        <span>PC 与移动端都保持轻量阅读，适合临时检索，也适合连续研读。</span>
      </div>
      <div>
        <strong>持续维护</strong>
        <span>跟随现行有效法律目录更新，并保留可追踪的收录进度。</span>
      </div>
    </div>
  </section>

  <footer class="jl-footer">
    MIT Licensed | <a href="https://beian.miit.gov.cn/#/Integrated/index" target="_blank" rel="noopener">浙ICP备2020040461号-2</a> | ©2022-2026 <a href="https://www.imcao.cn" target="_blank" rel="noopener">ImCaO</a>
  </footer>
</main>

<style>
.home .hero,
.home .features {
  display: none;
}

.home {
  max-width: none;
  padding: 0;
}

.home .theme-default-content {
  max-width: none;
  padding: 0;
}

.jl-home {
  --jl-red: var(--c-brand);
  --jl-red-dark: var(--c-brand-light);
  --jl-ink: #1b1e25;
  --jl-muted: #626b78;
  --jl-line: rgba(27, 30, 37, 0.12);
  --jl-panel: #ffffff;
  --jl-soft: #f5f7f8;
  --jl-overview-height: 7rem;
  color: var(--jl-ink);
  background:
    linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 34rem),
    #fff;
}

.jl-hero {
  min-height: 100vh;
  min-height: 100svh;
  position: relative;
  display: flex;
  align-items: center;
  overflow: visible;
  background: #fff;
  border-bottom: 1px solid rgba(27, 30, 37, 0.08);
}

.jl-hero::before,
.jl-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.jl-hero::before {
  z-index: 0;
  background: url("/images/homepage-archive-hero.jpg") center right / cover no-repeat;
}

.jl-hero::after {
  z-index: 1;
  background: linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.84) 38%, rgba(255,255,255,0.14) 74%);
}

.jl-hero__inner,
.jl-section {
  width: min(1120px, calc(100% - 3rem));
  margin: 0 auto;
}

.jl-hero__inner {
  position: relative;
  z-index: 2;
  display: grid;
  gap: clamp(2rem, 5vw, 4rem);
  padding: 6rem 0 4.5rem;
}

.jl-hero__content {
  position: relative;
  z-index: 3;
  max-width: 40rem;
}

.jl-kicker {
  margin: 0 0 0.85rem;
  color: var(--jl-red);
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1.4;
}

.jl-hero h1 {
  margin: 0;
  color: #111318;
  font-size: clamp(3.8rem, 7vw, 6.7rem);
  line-height: 0.96;
  letter-spacing: 0;
}

.jl-hero__lead {
  max-width: 36rem;
  margin: 1.35rem 0 0;
  color: #363d48;
  font-size: 1.28rem;
  line-height: 1.8;
}

.jl-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 2.2rem;
}

.jl-button {
  min-height: 2.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 1.2rem;
  border: 1px solid transparent;
  border-radius: 6px;
  font-weight: 700;
  text-decoration: none !important;
  transition: background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.jl-button:hover {
  transform: translateY(-1px);
}

.jl-button--primary {
  background: var(--jl-red);
  color: #fff !important;
  box-shadow: 0 14px 28px color-mix(in srgb, var(--jl-red) 22%, transparent);
}

.jl-button--ghost {
  border-color: rgba(27, 30, 37, 0.18);
  background: rgba(255, 255, 255, 0.78);
  color: var(--jl-ink) !important;
  backdrop-filter: blur(12px);
}

.jl-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  width: min(60rem, 100%);
  margin: 0;
  background: var(--jl-line);
  border: 1px solid var(--jl-line);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 24px 70px rgba(27, 30, 37, 0.16);
}

.jl-stat {
  min-height: var(--jl-overview-height);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1.35rem 1.45rem;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(14px);
}

.jl-stat strong {
  color: var(--jl-red-dark);
  font-size: 2rem;
  line-height: 1.1;
}

.jl-stat span {
  margin-top: 0.35rem;
  color: var(--jl-muted);
  font-size: 0.93rem;
}

.jl-section {
  padding: 5rem 0 0;
}

.jl-section__header {
  max-width: 42rem;
  margin-bottom: 1.5rem;
}

.jl-section h2,
.jl-principles h2 {
  margin: 0;
  padding-top: 0;
  color: var(--jl-ink);
  font-size: clamp(1.45rem, 2.4vw, 2.05rem);
  line-height: 1.18;
  letter-spacing: 0;
}

.jl-featured__grid,
.jl-category-grid {
  display: grid;
  gap: 1rem;
}

.jl-featured__grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.jl-feature {
  min-height: 15.5rem;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  border: 1px solid var(--jl-line);
  border-radius: 8px;
  background: var(--jl-panel);
  color: inherit !important;
  text-decoration: none !important;
  box-shadow: 0 12px 36px rgba(27, 30, 37, 0.06);
  transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.jl-feature:hover,
.jl-category:hover {
  border-color: color-mix(in srgb, var(--jl-red) 42%, transparent);
  transform: translateY(-2px);
  box-shadow: 0 18px 42px rgba(27, 30, 37, 0.09);
}

.jl-feature span {
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  border: 1px solid color-mix(in srgb, var(--jl-red) 22%, transparent);
  border-radius: 50%;
  color: var(--jl-red);
  background: color-mix(in srgb, var(--jl-red) 8%, #fff);
  font-size: 1.25rem;
  font-weight: 800;
}

.jl-feature strong,
.jl-category strong,
.jl-principles strong {
  color: var(--jl-ink);
  line-height: 1.35;
}

.jl-feature strong {
  font-size: 1.18rem;
}

.jl-category strong {
  font-size: 1.08rem;
}

.jl-feature small {
  margin-top: 0.75rem;
  color: var(--jl-muted);
  font-size: 0.92rem;
  line-height: 1.7;
}

.jl-category-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.jl-category {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 5.6rem;
  padding: 1.15rem 1.2rem;
  border: 1px solid var(--jl-line);
  border-radius: 8px;
  background: linear-gradient(135deg, #fff 0%, var(--jl-soft) 100%);
  color: inherit !important;
  text-decoration: none !important;
  transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.jl-category span {
  flex: 0 0 auto;
  color: var(--jl-red-dark);
  font-size: 1.08rem;
  font-weight: 700;
}

.jl-principles {
  display: grid;
  gap: 1.5rem;
  padding-bottom: 5rem;
}

.jl-principles > div:first-child {
  max-width: 42rem;
}

.jl-principles__list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  border: 1px solid var(--jl-line);
  border-radius: 8px;
  background: var(--jl-line);
}

.jl-principles__list div {
  padding: 1.2rem 1.35rem;
  background: #fff;
}

.jl-principles__list span {
  display: block;
  margin-top: 0.35rem;
  color: var(--jl-muted);
  line-height: 1.7;
}

.jl-footer {
  padding: 2.2rem 1.5rem;
  border-top: 1px solid var(--jl-line);
  color: var(--c-text-lighter);
  text-align: center;
}

.jl-footer a {
  color: var(--c-text-lighter) !important;
  font-weight: inherit;
}

html.dark .jl-home {
  --jl-ink: #eef2f6;
  --jl-muted: #aab4c0;
  --jl-line: rgba(238, 242, 246, 0.13);
  --jl-panel: #171b21;
  --jl-soft: #101319;
  background: #0f1217;
}

html.dark .jl-hero {
  background: #0f1217;
  border-bottom-color: rgba(238, 242, 246, 0.1);
}

html.dark .jl-hero::after {
  background: linear-gradient(90deg, rgba(15,18,23,0.96) 0%, rgba(15,18,23,0.74) 42%, rgba(15,18,23,0.16) 78%);
}

html.dark .jl-hero h1,
html.dark .jl-hero__lead {
  color: #f6f7f9;
}

html.dark .jl-button--ghost,
html.dark .jl-stat,
html.dark .jl-feature,
html.dark .jl-principles__list div {
  background: rgba(23, 27, 33, 0.92);
}

html.dark .jl-category {
  background: linear-gradient(135deg, #171b21 0%, #101319 100%);
}

html.dark .jl-feature span {
  background: rgba(222, 41, 16, 0.12);
}

html.dark .law-search-box.jl-home-search .law-search-box__input {
  background:
    radial-gradient(circle at 1.25rem 50%, var(--law-search-accent) 0 0.3rem, transparent 0.32rem),
    linear-gradient(135deg, color-mix(in srgb, var(--law-search-accent) 14%, #171b21) 0%, rgba(23, 27, 33, 0.96) 100%);
  box-shadow: 0 18px 42px rgb(0 0 0 / 26%);
}



@media (max-width: 980px) {
  .jl-featured__grid,
  .jl-category-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .jl-overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .jl-principles {
    gap: 1.5rem;
  }

  .jl-principles__list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 719px) {
  .jl-hero {
    min-height: 0;
    display: block;
    background: transparent;
  }

  .jl-hero::before,
  .jl-hero::after {
    display: none;
  }

  .jl-hero__inner,
  .jl-section {
    width: min(100% - 2rem, 1120px);
  }

  .jl-hero__inner {
    gap: 1.25rem;
    padding: 2.4rem 0 2.2rem;
  }

  .jl-hero h1 {
    font-size: 3.35rem;
  }

  .jl-hero__lead {
    margin-top: 1rem;
    font-size: 1.06rem;
    line-height: 1.7;
  }

  .jl-hero__actions {
    margin-top: 1.5rem;
  }

  .jl-section {
    padding-top: 2rem;
  }

  .jl-featured__grid,
  .jl-category-grid {
    grid-template-columns: 1fr;
  }

  .jl-overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
    margin: 0;
    box-shadow: 0 16px 38px rgba(27, 30, 37, 0.09);
  }

  .jl-stat {
    min-height: 6rem;
    padding: 1rem;
  }

  .jl-stat strong {
    font-size: 1.6rem;
  }

  .jl-feature {
    min-height: 12.5rem;
  }

  .jl-category {
    min-height: 4.8rem;
  }
}
</style>
