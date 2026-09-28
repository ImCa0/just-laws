const {
  currentOffensesByArticle,
  loadCurrentCriminalOffenses,
} = require("../../../scripts/manage-criminal-offenses");
const { getInlineText } = require("./lawArticleAnchors");

const STRUCTURED_OFFENSE_PAGES = new Set([
  "criminal-law/criminal-law/02-specific-provisions.md",
]);
const PAGE_INSTRUMENTS = new Map([
  ["criminal-law/criminal-law/02-specific-provisions.md", "criminal-law"],
  [
    "criminal-law/criminal-law/05-foreign-exchange-crimes-decision.md",
    "foreign-exchange-decision",
  ],
]);

// Hide only these repeated badges; keep the underlying source mappings intact.
const OMIT_REPEATED_BADGES = new Map([
  ["229:0:2", "提供虚假证明文件罪"],
  ["237:0:2", "强制猥亵、侮辱罪"],
  ["284:1:2", "组织考试作弊罪"],
]);

function toPosix(value) {
  return String(value || "").replace(/\\/g, "/");
}

function environmentMatches(env, suffixes) {
  const candidates = [env.filePathRelative, env.filePath];
  return candidates.some((candidate) => {
    const normalized = toPosix(candidate);
    return [...suffixes].some((suffix) => normalized.endsWith(suffix));
  });
}

function instrumentForEnvironment(env = {}) {
  for (const [suffix, instrument] of PAGE_INSTRUMENTS) {
    if (environmentMatches(env, [suffix])) return instrument;
  }
  return null;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function annotationHtml(offenses) {
  const items = offenses
    .map((offense) =>
      [
        '<span class="criminal-offense-note__item">',
        `<span>${escapeHtml(offense.name)}</span>`,
        "</span>",
      ].join("")
    )
    .join("");
  return [
    '<span class="criminal-offense-note">',
    `<span class="criminal-offense-note__items">${items}</span>`,
    "</span>",
  ].join("");
}

function articleIdentity(instrument, anchor) {
  const match = anchor.match(/^article-(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  return {
    instrument,
    article: Number(match[1]),
    subArticle: match[2] ? Number(match[2]) : undefined,
  };
}

function provisionMatchesArticle(provision, article) {
  return (
    provision.instrument === article.instrument &&
    provision.article === article.article &&
    provision.subArticle === article.subArticle
  );
}

function offensesAtScope(offenses, article, paragraph) {
  return offenses.filter((offense) =>
    offense.provisions.some(
      (provision) =>
        provisionMatchesArticle(provision, article) &&
        provision.paragraph === paragraph
    )
  );
}

function htmlBlock(state, content) {
  const annotation = new state.Token("html_block", "", 0);
  annotation.content = content;
  return annotation;
}

function annotateStructuredCriminalLaw(state, instrument, offensesByArticle) {
  let currentArticle = null;
  let currentOffenses = [];
  let paragraph = 0;

  for (let index = 0; index < state.tokens.length - 2; index += 1) {
    const token = state.tokens[index];
    if (token.type === "heading_open") {
      currentArticle = null;
      continue;
    }
    if (token.type !== "paragraph_open") continue;
    const inline = state.tokens[index + 1];
    if (inline?.type !== "inline" || state.tokens[index + 2]?.type !== "paragraph_close") continue;

    const article = articleIdentity(instrument, token.attrGet("id") || "");
    let prefix = "";
    if (article) {
      currentArticle = article;
      paragraph = 1;
      const key = [instrument, article.article, article.subArticle]
        .filter((part) => part !== undefined).join(":");
      currentOffenses = offensesByArticle.get(key) || [];
      // Keep the badge outside the article label's bold formatting.
      prefix = /^(?:\*\*)?第[一二三四五六七八九十百千万零〇两]+条(?:之[一二三四五六七八九十百千万零〇两]+)?(?:\*\*)?[\s　]*/.exec(inline.content)?.[0];
      if (!prefix) continue;
    } else {
      if (!currentArticle || /^（[一二三四五六七八九十百]+）/.test(getInlineText(inline).trimStart())) continue;
      paragraph += 1;
    }

    // Display whole-article mappings once without inventing a paragraph scope.
    const offenses = [...new Set([
      ...(article ? offensesAtScope(currentOffenses, currentArticle, undefined) : []),
      ...offensesAtScope(currentOffenses, currentArticle, paragraph),
    ])].filter((offense) => offense.name !== OMIT_REPEATED_BADGES.get(
      `${currentArticle.article}:${currentArticle.subArticle || 0}:${paragraph}`
    ));
    if (!offenses.length) continue;
    const annotation = new state.Token("html_inline", "", 0);
    annotation.content = annotationHtml(offenses);
    if (prefix) {
      const before = [];
      const after = [];
      state.md.inline.parse(prefix, state.md, state.env, before);
      state.md.inline.parse(inline.content.slice(prefix.length), state.md, state.env, after);
      inline.children = [...before, annotation, ...after];
    } else {
      inline.children.unshift(annotation);
    }
  }
}

function annotateFlatInstrument(state, instrument, offensesByArticle) {
  for (let index = 0; index < state.tokens.length - 2; index += 1) {
    const paragraphOpen = state.tokens[index];
    const inline = state.tokens[index + 1];
    const paragraphClose = state.tokens[index + 2];
    if (
      paragraphOpen.type !== "paragraph_open" ||
      inline.type !== "inline" ||
      paragraphClose.type !== "paragraph_close"
    ) {
      continue;
    }

    const article = articleIdentity(instrument, paragraphOpen.attrGet("id") || "");
    if (!article) continue;
    const key = [instrument, article.article, article.subArticle]
      .filter((part) => part !== undefined)
      .join(":");
    const offenses = offensesByArticle.get(key);
    if (!offenses?.length) continue;

    state.tokens.splice(
      index + 3,
      0,
      htmlBlock(state, `<div>${annotationHtml(offenses)}</div>\n`)
    );
    index += 1;
  }
}

function criminalOffenseAnnotationsPlugin(
  md,
  { offenseResult = loadCurrentCriminalOffenses() } = {}
) {
  const offensesByArticle = currentOffensesByArticle(offenseResult);

  md.core.ruler.after(
    "law_article_anchors",
    "criminal_offense_annotations",
    (state) => {
      const instrument = instrumentForEnvironment(state.env);
      if (!instrument) return;
      if (environmentMatches(state.env, STRUCTURED_OFFENSE_PAGES)) {
        annotateStructuredCriminalLaw(state, instrument, offensesByArticle);
      } else {
        annotateFlatInstrument(state, instrument, offensesByArticle);
      }
    }
  );
}

module.exports = {
  annotationHtml,
  criminalOffenseAnnotationsPlugin,
  instrumentForEnvironment,
  offensesAtScope,
};
