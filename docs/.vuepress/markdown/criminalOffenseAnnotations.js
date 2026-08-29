const {
  currentOffensesByArticle,
  loadCurrentCriminalOffenses,
} = require("../../../scripts/manage-criminal-offenses");
const { createArticleAnchor, getInlineText } = require("./lawArticleAnchors");

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
    '<div class="criminal-offense-note">',
    `<span class="criminal-offense-note__items">${items}</span>`,
    "</div>\n",
  ].join("");
}

function cloneToken(state, source) {
  const token = new state.Token(source.type, source.tag, source.nesting);
  Object.assign(token, source);
  token.attrs = source.attrs ? source.attrs.map((attr) => [...attr]) : null;
  token.meta = source.meta ? { ...source.meta } : null;
  return token;
}

function textInlineToken(state, source, content, { strong = false } = {}) {
  const inline = cloneToken(state, source);
  inline.content = content;
  inline.children = [];

  if (strong) {
    const strongOpen = new state.Token("strong_open", "strong", 1);
    strongOpen.markup = "**";
    inline.children.push(strongOpen);
  }

  const text = new state.Token("text", "", 0);
  text.content = content;
  inline.children.push(text);

  if (strong) {
    const strongClose = new state.Token("strong_close", "strong", -1);
    strongClose.markup = "**";
    inline.children.push(strongClose);
  }

  return inline;
}

function splitCriminalLawArticleParagraphs(state) {
  if (!environmentMatches(state.env, STRUCTURED_OFFENSE_PAGES)) return;

  for (let index = 0; index < state.tokens.length - 2; index += 1) {
    const paragraphOpen = state.tokens[index];
    const inline = state.tokens[index + 1];
    const paragraphClose = state.tokens[index + 2];
    const anchor = paragraphOpen.attrGet?.("id") || "";

    if (
      paragraphOpen.type !== "paragraph_open" ||
      inline.type !== "inline" ||
      paragraphClose.type !== "paragraph_close" ||
      !/^article-\d+(?:-\d+)?$/.test(anchor)
    ) {
      continue;
    }

    const text = getInlineText(inline).trimStart();
    if (!createArticleAnchor(text)) continue;

    const articleLabel = /^第.+?条(?:之.+?)?(?=　|\s|$)/.exec(text)?.[0];
    if (!articleLabel) continue;
    const body = text.slice(articleLabel.length).trimStart();

    paragraphOpen.attrJoin("class", "criminal-law-article-number");
    state.tokens[index + 1] = textInlineToken(state, inline, articleLabel, {
      strong: true,
    });

    if (!body) continue;

    const bodyOpen = cloneToken(state, paragraphOpen);
    bodyOpen.attrs = (bodyOpen.attrs || []).filter(([name]) => name !== "id");
    bodyOpen.attrSet("class", "criminal-law-paragraph");
    const bodyInline = textInlineToken(state, inline, body);
    const bodyClose = cloneToken(state, paragraphClose);

    state.tokens.splice(index + 3, 0, bodyOpen, bodyInline, bodyClose);
    index += 3;
  }
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
      currentOffenses = [];
      paragraph = 0;
      continue;
    }

    if (token.type !== "paragraph_open") continue;
    const inline = state.tokens[index + 1];
    const close = state.tokens[index + 2];
    if (inline?.type !== "inline" || close?.type !== "paragraph_close") continue;

    const anchor = token.attrGet("id") || "";
    if (token.attrGet("class")?.includes("criminal-law-article-number")) {
      currentArticle = articleIdentity(instrument, anchor);
      paragraph = 0;
      const key = currentArticle
        ? [instrument, currentArticle.article, currentArticle.subArticle]
            .filter((part) => part !== undefined)
            .join(":")
        : "";
      currentOffenses = offensesByArticle.get(key) || [];
      const articleOffenses = currentArticle
        ? offensesAtScope(currentOffenses, currentArticle, undefined)
        : [];
      if (articleOffenses.length) {
        state.tokens.splice(
          index + 3,
          0,
          htmlBlock(state, annotationHtml(articleOffenses))
        );
        index += 1;
      }
      continue;
    }

    if (!currentArticle) continue;
    const inlineText = getInlineText(inline).trimStart();
    if (/^（[一二三四五六七八九十百]+）/.test(inlineText)) continue;

    paragraph += 1;
    const paragraphOffenses = offensesAtScope(
      currentOffenses,
      currentArticle,
      paragraph
    );
    if (paragraphOffenses.length) {
      state.tokens.splice(
        index,
        0,
        htmlBlock(state, annotationHtml(paragraphOffenses))
      );
      index += 1;
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
      htmlBlock(state, annotationHtml(offenses))
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
    "criminal_law_article_layout",
    splitCriminalLawArticleParagraphs
  );
  md.core.ruler.after(
    "criminal_law_article_layout",
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
  splitCriminalLawArticleParagraphs,
};
