const DIGIT_MAP = {
  "\u96f6": 0,
  "\u3007": 0,
  "\u4e00": 1,
  "\u4e8c": 2,
  "\u4e24": 2,
  "\u4e09": 3,
  "\u56db": 4,
  "\u4e94": 5,
  "\u516d": 6,
  "\u4e03": 7,
  "\u516b": 8,
  "\u4e5d": 9,
};

const UNIT_MAP = {
  "\u5341": 10,
  "\u767e": 100,
  "\u5343": 1000,
  "\u4e07": 10000,
};

const ARTICLE_RE =
  /^\u7b2c([\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u5343\u4e07\u96f6\u3007\u4e24]+)\u6761(?:\u4e4b([\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u5343\u4e07\u96f6\u3007\u4e24]+))?/;

function chineseNumberToArabic(input) {
  let total = 0;
  let section = 0;
  let number = 0;

  for (const char of input) {
    if (Object.prototype.hasOwnProperty.call(DIGIT_MAP, char)) {
      number = DIGIT_MAP[char];
      continue;
    }

    const unit = UNIT_MAP[char];

    if (!unit) {
      return null;
    }

    if (unit === 10000) {
      section = (section + number) * unit;
      total += section;
      section = 0;
    } else {
      section += (number || 1) * unit;
    }

    number = 0;
  }

  return total + section + number;
}

function createArticleAnchor(text) {
  const match = ARTICLE_RE.exec(text.trimStart());

  if (!match) {
    return null;
  }

  const articleNumber = chineseNumberToArabic(match[1]);

  if (!articleNumber) {
    return null;
  }

  const subArticleNumber = match[2]
    ? chineseNumberToArabic(match[2])
    : null;

  if (match[2] && !subArticleNumber) {
    return null;
  }

  return ["article", articleNumber, subArticleNumber]
    .filter((part) => part !== null)
    .join("-");
}

function getInlineText(inline) {
  if (!Array.isArray(inline.children) || inline.children.length === 0) {
    return inline.content;
  }

  return inline.children
    .map((child) => child.content || "")
    .join("");
}

function lawArticleAnchorsPlugin(md) {
  md.core.ruler.after("inline", "law_article_anchors", (state) => {
    const usedAnchors = new Map();

    for (let index = 0; index < state.tokens.length - 2; index += 1) {
      const paragraphOpen = state.tokens[index];
      const inline = state.tokens[index + 1];
      const paragraphClose = state.tokens[index + 2];

      if (
        paragraphOpen.type !== "paragraph_open" ||
        inline.type !== "inline" ||
        paragraphClose.type !== "paragraph_close" ||
        paragraphOpen.attrGet("id")
      ) {
        continue;
      }

      const baseAnchor = createArticleAnchor(getInlineText(inline));

      if (!baseAnchor) {
        continue;
      }

      const usedCount = usedAnchors.get(baseAnchor) || 0;
      usedAnchors.set(baseAnchor, usedCount + 1);

      paragraphOpen.attrSet(
        "id",
        usedCount === 0 ? baseAnchor : `${baseAnchor}-${usedCount + 1}`
      );
    }
  });
}

module.exports = {
  createArticleAnchor,
  chineseNumberToArabic,
  getInlineText,
  lawArticleAnchorsPlugin,
};
