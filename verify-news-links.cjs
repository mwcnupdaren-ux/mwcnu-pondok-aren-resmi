const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const app = fs.readFileSync("js/app.js", "utf8");
const match = app.match(
  /function drawN\(c,keepExpanded\)\{[\s\S]*?\nfunction rtOf/,
);
assert.ok(match, "news card renderer is present");
const eventFns = {};
function el(tag) {
  return {
    tagName: tag,
    className: "",
    children: [],
    value: "",
    dataset: {},
    classList: { add() {}, remove() {} },
    setAttribute() {},
    appendChild(child) {
      this.children.push(child);
    },
    addEventListener(type, callback) {
      eventFns[type] = callback;
    },
    closest() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    textContent: "",
    set innerHTML(value) {
      this.html = value;
    },
    get innerHTML() {
      return this.html || "";
    },
  };
}
const elements = {};
const document = {
  getElementById(id) {
    if (!elements[id]) elements[id] = el(id === "newsGrid" ? "DIV" : "INPUT");
    return elements[id];
  },
  createElement: el,
  querySelectorAll() {
    return [];
  },
};
const first = [
  "Berita",
  "Berita homepage",
  "10 Januari 2026",
  "Ringkasan",
  null,
  "",
  { slug: "berita-homepage", p: [] },
];
const second = [
  "Berita",
  "Berita kedua",
  "9 Januari 2026",
  "Ringkasan",
  null,
  "",
  { slug: "berita-kedua", p: [] },
];
const ctx = {
  N: [first, second],
  MW: {},
  PH: [],
  curCat: "Semua",
  curN: [],
  cats: ["Semua"],
  ng: document.getElementById("newsGrid"),
  nt: document.getElementById("ntabs"),
  newsExpanded: false,
  newsPickIdx: [],
  isMobileNews: () => false,
  safeURL: (value) => value,
  esc: String,
  rtOf: () => 1,
  nImg: () => "",
  put(element, html) { element.innerHTML = html; },
  act(element, callback) { element.onclick = callback; },
  syncNewsList() {},
  refreshBeritaRecs() {},
  goArticle(article) {
    ctx.opened = article[6].slug;
  },
  drawN() {},
  renderNewsPicks() {},
  route() {},
  document,
  window: { matchMedia: () => ({ addEventListener() {} }) },
};
vm.createContext(ctx);
vm.runInContext(match[0].replace(/\nfunction rtOf$/, ""), ctx);
const card = ctx.ng.children[0];
assert.ok(card, "news card is rendered");
assert.equal(typeof card.onclick, "function", "news card has a click handler");
card.onclick();
assert.equal(ctx.opened, "berita-homepage", "click opens its matching article");
console.log(
  "Berhasil: kartu homepage diberi handler navigasi ke berita yang tepat.",
);
