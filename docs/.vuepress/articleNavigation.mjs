// History API navigation does not reliably update the browser's :target state.
// Keep scrolling and highlighting in the same router scrollBehavior lifecycle.
const highlightObservers = new WeakMap();

export function articleHighlightBlocks(target) {
  const blocks = [target];
  for (let block = target.nextElementSibling; block; block = block.nextElementSibling) {
    if (block.id?.startsWith("article-") ||
        !["P", "UL", "OL", "TABLE", "BLOCKQUOTE"].includes(block.tagName)) break;
    blocks.push(block);
  }
  return blocks;
}

export function updateHighlightGaps(blocks) {
  blocks.forEach((block, index) => {
    const next = blocks[index + 1];
    const gap = next ? Math.max(0,
      next.getBoundingClientRect().top - block.getBoundingClientRect().bottom) : 0;
    block.style.setProperty("--article-highlight-gap", `${gap}px`);
  });
}

export function articleNavigationPosition(hash, doc, viewport) {
  highlightObservers.get(doc)?.disconnect();
  highlightObservers.delete(doc);
  for (const node of doc.querySelectorAll(".law-article-target")) {
    node.classList.remove("law-article-target");
    node.style.removeProperty("--article-highlight-gap");
  }
  if (!/^#article-\d+(?:-\d+)*$/.test(hash || "")) return null;
  const target = doc.getElementById(hash.slice(1));
  if (!target) return null;
  const blocks = articleHighlightBlocks(target);
  for (const block of blocks) block.classList.add("law-article-target");
  updateHighlightGaps(blocks);
  // Fill collapsed paragraph margins without wrapping/moving Vue-owned nodes.
  // Recalculate when responsive wrapping, fonts or embedded content change size.
  if (viewport.ResizeObserver) {
    const observer = new viewport.ResizeObserver(() => updateHighlightGaps(blocks));
    blocks.forEach((block) => observer.observe(block));
    if (target.parentElement) observer.observe(target.parentElement);
    highlightObservers.set(doc, observer);
  }
  const navbarHeight = doc.querySelector(".navbar")?.getBoundingClientRect().height || 0;
  return {
    left: 0,
    top: Math.max(0, target.getBoundingClientRect().top + viewport.scrollY - navbarHeight - 16),
    behavior: "auto",
  };
}
