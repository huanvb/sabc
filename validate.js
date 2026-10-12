// Kiểm tra toàn vẹn Atlas: link dashboard, related, ref thuật ngữ, ký tự cấm, cụm từ cấm.
// Chạy: node validate.js   (từ thư mục Atlas)
const fs = require("fs");
const path = require("path");
const dir = __dirname;
const P = {}; const G = []; let books = [];
global.ATLAS = {
  add(pack) {
    const p = (P[pack.pillar] ||= { map: {}, topics: [] });
    for (const t of pack.topics || []) {
      if (p.map[t.id]) console.log("DUP TOPIC", pack.pillar, t.id);
      p.map[t.id] = t; p.topics.push(t); t.items = {};
      for (const s of t.sections || []) for (const it of s.items || []) {
        if (t.items[it.id]) console.log("DUP ITEM", pack.pillar, t.id, it.id);
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(it.id)) console.log("BAD ID", pack.pillar, t.id, it.id);
        t.items[it.id] = it; it._p = pack.pillar + "/" + t.id + "/" + it.id;
      }
    }
    for (const g of pack.glossary || []) G.push(g);
  },
  setBooks(b) { books = b; }
};
const files = ["ref.js", "stop_a.js", "stop_b.js", "ask.js", "begin.js", "begin_b.js", "co.js"];
const loaded = [];
for (const f of files) {
  const fp = path.join(dir, "data", f);
  if (!fs.existsSync(fp)) { console.log("MISSING FILE", f); continue; }
  try { require(fp); loaded.push(f); } catch (e) { console.log("LOAD ERROR", f, e.message); }
}
function resolve(x) {
  const [pl, tp, it] = x.split("/");
  if (!P[pl]) return false; if (!tp) return true;
  const t = P[pl].map[tp]; if (!t) return false; if (!it) return true;
  return !!t.items[it];
}
// dashboard links
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
const links = [...html.matchAll(/href="#\/([^"]*)"/g)].map(m => m[1]).filter(x => x && !x.startsWith("index"));
let bad = 0;
for (const l of new Set(links)) if (!resolve(l)) { console.log("DASH BROKEN", l); bad++; }
// related + glossary refs
let relBad = 0, items = 0, words = 0;
const banned = ["không chỉ", "bức tranh toàn cảnh", "kim chỉ nam", "bệ phóng", "rõ nét", "đóng vai trò quan trọng", "là một minh chứng", "bước đệm vững chắc", "hãy cùng", "điều quan trọng cần lưu ý"];
for (const pl in P) for (const t of P[pl].topics) for (const id in t.items) {
  const it = t.items[id]; items++;
  words += (it.body || []).join(" ").split(/\s+/).length;
  for (const r of it.related || []) if (!resolve(r)) { console.log("REL BROKEN", it._p, "->", r); relBad++; }
  if (it.source && it.source.file && !fs.existsSync(path.join(dir, "..", it.source.file))) console.log("FILE MISSING", it._p, it.source.file);
}
for (const pl in P) for (const t of P[pl].topics) if (t.source && t.source.file && !fs.existsSync(path.join(dir, "..", t.source.file))) console.log("FILE MISSING", pl + "/" + t.id, t.source.file);
for (const g of G) if (g.ref && !resolve(g.ref)) { console.log("GLOSS BROKEN", g.en, "->", g.ref); relBad++; }
for (const f of loaded) {
  const txt = fs.readFileSync(path.join(dir, "data", f), "utf8");
  if (/[\u2013\u2014]/.test(txt)) console.log("DASH CHAR in", f);
  const low = txt.toLowerCase();
  for (const b of banned) if (low.includes(b)) console.log("BANNED", JSON.stringify(b), "in", f);
}
console.log(JSON.stringify({ loaded, topics: Object.values(P).reduce((a, p) => a + p.topics.length, 0), items, bodyWords: words, glossary: G.length, dashBroken: bad, relBroken: relBad }));
