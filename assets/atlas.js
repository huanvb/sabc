/* Atlas Stop. Ask. Begin. · router hash 3 tầng, chạy offline qua file:// */
(function () {
  "use strict";

  const PILLARS = {
    stop:  { name: "STOP",     step: "NĂNG LỰC 1", sub: "Nhìn rõ mình và dừng thói quen cản đường" },
    ask:   { name: "ASK",      step: "NĂNG LỰC 2", sub: "Nói thật, bớt khuyên, hỏi sâu hơn" },
    begin: { name: "BEGIN",    step: "NĂNG LỰC 3", sub: "Dám bắt đầu và ngồi xuống làm, mỗi ngày" },
    co:    { name: "CO-INTEL", step: "LỚP XUYÊN SUỐT", sub: "Cộng sinh với AI mà giữ nhân tính" },
    ref:   { name: "THAM CHIẾU", step: "ĐỐI CHIẾU", sub: "HBR và các cuộc tranh luận" }
  };
  const ORDER = ["stop", "ask", "begin", "co", "ref"];
  const P = {};
  ORDER.forEach(k => (P[k] = { topics: [], map: {} }));
  const GLOSS = [];
  let BOOKS = [];
  const BOOKMAP = {};

  /* ---------- API dữ liệu ---------- */
  function add(pack) {
    const pl = pack.pillar;
    if (!P[pl]) P[pl] = { topics: [], map: {} };
    (pack.topics || []).forEach(t => {
      t.pillar = pl;
      t.items = [];
      (t.sections || []).forEach(s => (s.items || []).forEach(it => {
        it.topic = t; it.section = s; it.pillar = pl;
        t.items.push(it);
      }));
      if (P[pl].map[t.id]) console.warn("Trùng topic", pl, t.id);
      P[pl].topics.push(t);
      P[pl].map[t.id] = t;
    });
    (pack.glossary || []).forEach(g => GLOSS.push(Object.assign({ pillar: pl }, g)));
  }
  function setBooks(arr) {
    BOOKS = arr;
    arr.forEach(b => (BOOKMAP[b.key] = b));
  }
  window.ATLAS = { add, setBooks, _P: P, _G: GLOSS };

  /* ---------- tiện ích ---------- */
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = s => esc(s).replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  const norm = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  const href = path => "#/" + path;
  const isLocal = typeof window !== "undefined" && window.location.protocol === "file:";
  const fileHref = f => encodeURI("../" + f);
  const isTranslation = f => /\/(Chuong|Bai)_[^/]+\.md$/.test("/" + f);
  const fileLabel = (f, long) => isTranslation(f) ? (long ? "Mở bản dịch tiếng Việt ↗" : "Mở bản dịch ↗") : "Mở tài liệu ↗";
  const $ = sel => document.querySelector(sel);

  function resolve(path) {
    if (!path) return null;
    const [pl, tp, it] = String(path).replace(/^#?\/?/, "").split("/");
    const p = P[pl];
    if (!p) return null;
    if (!tp) return { pillar: pl, path: pl };
    const t = p.map[tp];
    if (!t) return null;
    if (!it) return { pillar: pl, topic: t, path: pl + "/" + tp, title: t.title };
    const item = t.items.find(x => x.id === it);
    return item ? { pillar: pl, topic: t, item, path: pl + "/" + tp + "/" + it, title: item.title } : null;
  }
  const itemPath = it => it.pillar + "/" + it.topic.id + "/" + it.id;
  const topicPath = t => t.pillar + "/" + t.id;

  function crumbs(parts) {
    const out = ['<a href="#/">Dashboard</a>'];
    parts.forEach((p, i) => {
      out.push('<span class="sep">›</span>');
      out.push(i === parts.length - 1 ? '<span class="here">' + esc(p[0]) + "</span>" : '<a href="' + p[1] + '">' + esc(p[0]) + "</a>");
    });
    return '<nav class="crumbs" aria-label="Breadcrumb">' + out.join("") + "</nav>";
  }

  function sourceOf(node) {
    return node.source || (node.topic && node.topic.source) || null;
  }
  function sourceLine(src) {
    if (!src) return "";
    const b = BOOKMAP[src.book];
    return (b ? b.title : src.book || "") + (src.where ? " · " + src.where : "");
  }

  function relLink(path) {
    const r = resolve(path);
    if (!r) return '<span class="off" title="Mục này đang được biên soạn"><span class="dot" style="background:#ccc"></span><span>' + esc(path) + "<small>đang biên soạn</small></span></span>";
    const ttl = r.item ? r.item.title : r.topic ? r.topic.title : PILLARS[r.pillar].name;
    const sub = r.item ? PILLARS[r.pillar].name + " · " + r.topic.title : PILLARS[r.pillar].name;
    return '<a href="' + href(r.path) + '"><span class="dot d-' + r.pillar + '"></span><span>' + esc(ttl) + "<small>" + esc(sub) + "</small></span></a>";
  }

  /* ---------- render: tầng trụ (năng lực / lớp) ---------- */
  function viewPillar(pl) {
    const meta = PILLARS[pl];
    const topics = P[pl].topics;
    let h = crumbs([[meta.name, href(pl)]]);
    h += '<section class="hero"><div class="step">' + esc(meta.step) + "</div><h1>" + esc(meta.name) + '</h1><div class="lead">' + esc(meta.sub) + "</div></section>";
    if (!topics.length) return h + '<div class="empty">Phần này đang được biên soạn.</div>';
    h += '<div class="sec"><div class="cards">';
    topics.forEach(t => {
      h += '<a class="card" href="' + href(topicPath(t)) + '"><span class="kk">' + esc(t.count || t.items.length) + "</span><div><h3>" + esc(t.title) + "</h3>" +
        (t.en ? '<div class="en">' + esc(t.en) + "</div>" : "") + "<p>" + fmt(t.lead || "") + "</p></div></a>";
    });
    return h + "</div></div>";
  }

  /* ---------- render: tầng 1, danh sách ---------- */
  function viewTopic(t) {
    const pl = t.pillar, meta = PILLARS[pl], src = t.source;
    let h = crumbs([[meta.name, href(pl)], [t.title, href(topicPath(t))]]);
    h += '<section class="hero">' + (t.count ? '<div class="badge">' + esc(t.count) + "</div>" : "") +
      '<div class="step">' + esc(meta.step) + " · " + esc(meta.name) + "</div><h1>" + esc(t.title) + "</h1>" +
      (t.en ? '<div class="en">' + esc(t.en) + "</div>" : "") +
      (t.lead ? '<div class="lead">' + fmt(t.lead) + "</div>" : "") + '<div class="meta">';
    if (src) {
      h += '<span class="chip-w">📖 ' + esc(sourceLine(src)) + "</span>";
      if (src.file && isLocal) h += '<a class="chip-w" href="' + fileHref(src.file) + '" target="_blank" rel="noopener">' + fileLabel(src.file) + "</a>";
    }
    h += '<span class="chip-w">' + t.items.length + " mục</span></div></section>";
    if (t.intro && t.intro.length) h += '<div class="intro">' + t.intro.map(p => "<p>" + fmt(p) + "</p>").join("") + "</div>";
    (t.sections || []).forEach(s => {
      h += '<div class="sec">';
      if (s.title || t.sections.length > 1) h += '<div class="sec-h"><h2>' + esc(s.title || "Danh sách") + '</h2><span class="rule"></span><span class="cnt">' + s.items.length + "</span></div>";
      h += '<div class="cards">';
      s.items.forEach(it => {
        const inner = '<a class="card" id="c-' + esc(it.id) + '" href="' + href(itemPath(it)) + '"><span class="kk">' + esc(it.k || "•") + "</span><div><h3>" + esc(it.title) + "</h3>" +
          (it.en ? '<div class="en">' + esc(it.en) + "</div>" : "") + "<p>" + fmt(it.brief || "") + "</p>" +
          (it.note ? '<span class="flag">tổng hợp</span>' : "") + "</div></a>";
        if (it.web || (it.links && it.links.length)) {
          let acts = '<div class="card-actions">';
          if (it.web) acts += '<a class="btn-web" href="' + esc(it.web) + '">🚀 Mở trang tương tác ↗</a>';
          (it.links || []).forEach(lk => {
            if (lk.href !== it.web) acts += '<a class="btn-web alt" href="' + esc(lk.href) + '">' + esc(lk.label) + "</a>";
          });
          acts += '<a class="btn-web alt" href="' + href(itemPath(it)) + '">Điểm nối SABC ›</a></div>';
          h += '<div class="card-wrap">' + inner + acts + "</div>";
        } else {
          h += inner;
        }
      });
      h += "</div></div>";
    });
    const sib = P[pl].topics;
    if (sib.length > 1) {
      h += '<div class="others"><h4>Chủ đề khác trong ' + esc(meta.name) + '</h4><div class="pills">' +
        sib.map(x => '<a class="pill' + (x === t ? " on" : "") + '" href="' + href(topicPath(x)) + '">' + esc(x.title) + "</a>").join("") + "</div></div>";
    }
    return h;
  }

  /* ---------- render: tầng 2, chi tiết ---------- */
  function viewItem(it) {
    const t = it.topic, pl = it.pillar, meta = PILLARS[pl];
    const src = sourceOf(it);
    const idx = t.items.indexOf(it), prev = t.items[idx - 1], next = t.items[idx + 1];
    let h = crumbs([[meta.name, href(pl)], [t.title, href(topicPath(t))], [it.title, ""]]);
    h += '<section class="hero">' + (it.k ? '<div class="badge">' + esc(it.k) + "</div>" : "") +
      '<div class="step">' + esc(meta.name) + " · " + esc(t.title) + (it.section && it.section.title ? " · " + esc(it.section.title) : "") + "</div>" +
      "<h1>" + esc(it.title) + "</h1>" + (it.en ? '<div class="en">' + esc(it.en) + "</div>" : "") +
      (it.web ? '<div class="meta"><a class="chip-w" href="' + esc(it.web) + '">🚀 Mở trang HTML tương tác toàn màn hình ↗</a></div>' : "") +
      "</section>";
    h += '<div class="detail"><article class="art">';
    if (it.brief) h += '<p class="lead">' + fmt(it.brief) + "</p>";
    if (it.body && it.body.length) h += '<div class="body">' + it.body.map(p => "<p>" + fmt(p) + "</p>").join("") + "</div>";
    if (it.quote && (it.quote.en || it.quote.vi)) {
      h += '<figure class="quote">' + (it.quote.en ? '<div class="qen">' + esc(it.quote.en) + "</div>" : "") +
        (it.quote.vi ? '<div class="qvi">' + fmt(it.quote.vi) + "</div>" : "") +
        (it.quote.where ? '<div class="qw">' + esc(it.quote.where) + "</div>" : "") + "</figure>";
    }
    if (it.signs && it.signs.length) h += '<div class="box"><h4>Dấu hiệu nhận biết</h4><ul>' + it.signs.map(x => "<li><span>" + fmt(x) + "</span></li>").join("") + "</ul></div>";
    if (it.practice && it.practice.length) h += '<div class="box practice"><h4>Thực hành</h4><ul>' + it.practice.map(x => "<li><span>" + fmt(x) + "</span></li>").join("") + "</ul></div>";
    if (it.note) h += '<div class="note">Ghi chú biên soạn: ' + fmt(it.note) + "</div>";
    h += '<div class="pn">' +
      (prev ? '<a href="' + href(itemPath(prev)) + '"><small>← Trước</small><b>' + esc(prev.title) + "</b></a>" : "<span></span>") +
      (next ? '<a class="nx" href="' + href(itemPath(next)) + '"><small>Tiếp →</small><b>' + esc(next.title) + "</b></a>" : "<span></span>") + "</div>";
    h += '<div class="kbd"><kbd>←</kbd> <kbd>→</kbd> chuyển mục · <kbd>Esc</kbd> về danh sách</div>';
    h += "</article><aside class=\"side\">";
    if (it.web || (it.links && it.links.length)) {
      h += '<div class="pane src"><h4>Bản tương tác &amp; Tài liệu</h4>';
      if (it.web) h += '<a class="btn-web" style="width:100%;justify-content:center;margin-bottom:6px" href="' + esc(it.web) + '">🚀 Mở bài tương tác ↗</a>';
      (it.links || []).forEach(lk => {
        if (lk.href !== it.web) h += '<a class="open" style="display:block;margin-top:6px" href="' + esc(lk.href) + '">' + esc(lk.label) + "</a>";
      });
      h += "</div>";
    }
    if (src) {
      const b = BOOKMAP[src.book];
      h += '<div class="pane src"><h4>Nguồn</h4><b>' + esc(b ? b.title : src.book) + "</b><span>" + esc(b ? b.author : "") + (src.where ? " · " + esc(src.where) : "") + "</span>" +
        (src.file && isLocal ? '<a class="open" href="' + fileHref(src.file) + '" target="_blank" rel="noopener">' + fileLabel(src.file, true) + "</a>" : "") +
        (b ? '<br><a class="open" href="#/index/books#b-' + esc(b.key) + '">Hồ sơ sách ›</a>' : "") + "</div>";
    }
    if (it.related && it.related.length) h += '<div class="pane"><h4>Liên quan</h4><div class="rel">' + it.related.map(relLink).join("") + "</div></div>";
    h += '<div class="pane"><h4>' + esc(t.title) + '</h4><ul class="sibs">' +
      t.items.map(x => '<li><a class="' + (x === it ? "on" : "") + '" href="' + href(itemPath(x)) + '"><span class="kk">' + esc(x.k || "•") + "</span><span>" + esc(x.title) + "</span></a></li>").join("") + "</ul></div>";
    h += "</aside></div>";
    return h;
  }

  /* ---------- tra cứu ---------- */
  function allTopics() { return ORDER.flatMap(pl => P[pl].topics); }
  function allItems() { return allTopics().flatMap(t => t.items); }

  function tabs(on) {
    const T = [["map", "Mục lục"], ["terms", "Thuật ngữ A-Z"], ["books", "Sách"], ["hbr", "HBR đối chiếu"], ["debates", "Tranh luận"], ["topics", "Chuyên đề"]];
    return '<div class="tabs">' + T.map(([k, n]) => {
      const to = k === "hbr" ? "#/ref/hbr" : k === "debates" ? "#/ref/debates" : k === "topics" ? "topics/khong-thoi-gian/index.html" : "#/index/" + k;
      return '<a class="' + (on === k ? "on" : "") + '" href="' + to + '">' + n + "</a>";
    }).join("") + "</div>";
  }

  function viewIndexMap() {
    const items = allItems();
    let h = crumbs([["Tra cứu", "#/index"]]);
    h += '<section class="hero"><div class="step">TRA CỨU</div><h1>Mục lục toàn bộ atlas</h1><div class="lead">Mọi chủ đề và mọi mục chi tiết, xếp theo ba năng lực, lớp xuyên suốt và phần tham chiếu.</div></section>';
    h += '<div class="statline">' +
      '<div class="stat"><b>' + allTopics().length + "</b><span>chủ đề</span></div>" +
      '<div class="stat"><b>' + items.length + "</b><span>mục chi tiết</span></div>" +
      '<div class="stat"><b>' + GLOSS.length + "</b><span>thuật ngữ</span></div>" +
      '<div class="stat"><b>' + BOOKS.filter(b => b.status !== "ref").length + "</b><span>cuốn sách</span></div></div>";
    h += tabs("map");
    ORDER.forEach(pl => {
      const ts = P[pl].topics;
      if (!ts.length) return;
      h += '<div class="sec v-' + pl + '"><div class="sec-h"><h2>' + esc(PILLARS[pl].name) + '</h2><span class="rule"></span><span class="cnt">' + ts.length + ' chủ đề</span></div><div class="tree">';
      ts.forEach(t => {
        h += '<div class="t"><a href="' + href(topicPath(t)) + '">' + esc(t.title) + "</a><small>" + esc(t.en || "") + "</small>";
        (t.sections || []).forEach(s => {
          if (s.title && t.sections.length > 1) h += '<div class="sh">' + esc(s.title) + "</div>";
          h += "<ul>" + s.items.map(it => '<li><a href="' + href(itemPath(it)) + '">' + esc((it.k ? it.k + ". " : "") + it.title) + "</a></li>").join("") + "</ul>";
        });
        h += "</div>";
      });
      h += "</div></div>";
    });
    return h;
  }

  function viewTerms(q) {
    let h = crumbs([["Tra cứu", "#/index"], ["Thuật ngữ", "#/index/terms"]]);
    h += '<section class="hero"><div class="step">TRA CỨU</div><h1>Thuật ngữ A-Z</h1><div class="lead">Thuật ngữ tiếng Anh, cách dịch đã chốt và chính sách giữ nguyên hay dịch. Bấm để tới mục giải thích.</div></section>';
    h += tabs("terms");
    h += '<input class="filter" id="termfilter" placeholder="Lọc thuật ngữ (gõ không dấu cũng được)..." value="' + esc(q || "") + '">';
    const seen = new Set();
    const rows = GLOSS.filter(g => { const k = norm(g.en) + "|" + (g.ref || ""); if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => norm(a.en).localeCompare(norm(b.en)));
    h += '<table class="terms"><thead><tr><th>Thuật ngữ gốc</th><th>Tiếng Việt</th><th>Chính sách</th><th>Sách</th></tr></thead><tbody id="termbody">';
    let last = "";
    rows.forEach(g => {
      const L = (norm(g.en)[0] || "#").toUpperCase();
      if (L !== last) { h += '<tr class="lt" data-l="' + L + '"><td class="letter" colspan="4">' + L + "</td></tr>"; last = L; }
      const r = resolve(g.ref), b = BOOKMAP[g.book];
      const name = r ? '<a href="' + href(r.path) + '">' + esc(g.en) + "</a>" : "<b>" + esc(g.en) + "</b>";
      h += '<tr data-s="' + esc(norm(g.en + " " + g.vi)) + '" data-l="' + L + '"><td><span class="dot d-' + g.pillar + '"></span> ' + name + "</td><td>" + esc(g.vi) + '</td><td><span class="pol">' + esc(g.policy || "") + "</span></td><td>" + esc(b ? b.title.split(":")[0] : g.book || "") + "</td></tr>";
    });
    return h + "</tbody></table>";
  }
  function bindTermFilter() {
    const inp = $("#termfilter");
    if (!inp) return;
    const apply = () => {
      const q = norm(inp.value.trim());
      const shown = new Set();
      document.querySelectorAll("#termbody tr[data-s]").forEach(tr => {
        const ok = !q || tr.dataset.s.includes(q);
        tr.hidden = !ok;
        if (ok) shown.add(tr.dataset.l);
      });
      document.querySelectorAll("#termbody tr.lt").forEach(tr => (tr.hidden = !shown.has(tr.dataset.l)));
    };
    inp.addEventListener("input", apply);
    apply();
  }

  function viewBooks() {
    let h = crumbs([["Tra cứu", "#/index"], ["Sách", "#/index/books"]]);
    h += '<section class="hero"><div class="step">TRA CỨU</div><h1>Tám cuốn sách và nguồn đối chiếu</h1><div class="lead">Hồ sơ từng cuốn, tình trạng dịch, mục lục các chương đã dịch và chủ đề tương ứng trong atlas.</div></section>';
    h += tabs("books") + '<div class="bookgrid">';
    const ST = { done: "Đã dịch xong", wip: "Đang dịch", todo: "Chưa dịch", planned: "Sắp có", ref: "Tham chiếu" };
    BOOKS.forEach(b => {
      const tops = allTopics().filter(t => (t.source && t.source.book === b.key) || t.items.some(i => i.source && i.source.book === b.key));
      h += '<div class="book v-' + b.pillar + '" id="b-' + esc(b.key) + '"><div class="no">' + esc(b.no) + " · " + esc((PILLARS[b.pillar] || {}).name || "") +
        '<span class="st st-' + b.status + '">' + esc(ST[b.status] || "") + "</span></div><h3>" + esc(b.title) + '</h3><div class="vi">' + esc(b.vi) + "</div>" +
        '<div class="by">' + esc(b.author) + (b.year ? " · " + b.year : "") + (b.words ? " · " + esc(b.words) : "") + '</div><div class="role">' + esc(b.role) + "</div>";
      if (tops.length) h += '<div class="tops">' + tops.map(t => '<a class="pill" href="' + href(topicPath(t)) + '"><span class="dot d-' + t.pillar + '"></span>' + esc(t.title) + "</a>").join("") + "</div>";
      if (b.chapters && b.chapters.length) {
        h += "<details><summary>" + b.chapters.length + " chương" + (isLocal ? " (file bản dịch)" : "") + "</summary><ol>" +
          b.chapters.map(c => "<li>" + (isLocal ? '<a href="' + fileHref(b.folder + "/" + c[1]) + '" target="_blank" rel="noopener">' + esc(c[0]) + "</a>" : esc(c[0])) + "</li>").join("") + "</ol></details>";
      }
      h += "</div>";
    });
    return h + "</div>";
  }

  function viewSearch(q) {
    const nq = norm(q).trim();
    let h = crumbs([["Tìm kiếm", "#/search/" + encodeURIComponent(q)]]);
    h += '<section class="hero"><div class="step">TÌM KIẾM</div><h1>' + (q ? "“" + esc(q) + "”" : "Gõ từ khóa ở ô tìm kiếm") + "</h1></section>";
    if (!nq) return h;
    const words = nq.split(/\s+/).filter(Boolean);
    const scored = [];
    const test = (txt) => words.every(w => txt.includes(w));
    allTopics().forEach(t => {
      const ti = norm(t.title + " " + (t.en || "")), all = ti + " " + norm((t.lead || "") + " " + (t.intro || []).join(" "));
      if (test(all)) scored.push({ s: test(ti) ? 3 : 1, path: topicPath(t), pl: t.pillar, title: t.title, crumb: PILLARS[t.pillar].name + " · chủ đề", text: t.lead || "" });
    });
    allItems().forEach(it => {
      const ti = norm(it.title + " " + (it.en || ""));
      const body = norm([it.brief, (it.body || []).join(" "), it.quote && it.quote.en, it.quote && it.quote.vi, (it.signs || []).join(" "), (it.practice || []).join(" ")].join(" "));
      if (test(ti + " " + body)) scored.push({ s: test(ti) ? 4 : test(norm(it.brief || "")) ? 2 : 1, path: itemPath(it), pl: it.pillar, title: it.title, crumb: PILLARS[it.pillar].name + " · " + it.topic.title, text: it.brief || "" });
    });
    GLOSS.forEach(g => {
      if (test(norm(g.en + " " + g.vi)) && g.ref && resolve(g.ref)) scored.push({ s: 2.5, path: g.ref, pl: g.pillar, title: g.en + " → " + g.vi, crumb: "Thuật ngữ", text: "" });
    });
    const uniq = new Map();
    scored.sort((a, b) => b.s - a.s).forEach(r => { const k = r.path + "|" + r.title; if (!uniq.has(k)) uniq.set(k, r); });
    const res = [...uniq.values()].slice(0, 80);
    const hi = s => {
      let out = esc(s);
      words.forEach(w => {
        if (w.length < 2) return;
        const src = norm(s); let i = src.indexOf(w);
        if (i < 0) return;
        const raw = s.substr(i, w.length);
        out = out.replace(esc(raw), "<mark>" + esc(raw) + "</mark>");
      });
      return out;
    };
    h += '<div class="statline"><div class="stat"><b>' + res.length + "</b><span>kết quả</span></div></div><div class=\"results\">";
    if (!res.length) h += '<div class="empty">Không tìm thấy. Thử từ khác, hoặc xem <a href="#/index/terms">Thuật ngữ A-Z</a>.</div>';
    res.forEach(r => {
      h += '<a class="res v-' + r.pl + '" href="' + href(r.path) + '"><div class="path">' + esc(r.crumb) + "</div><b>" + hi(r.title) + "</b>" + (r.text ? "<p>" + hi(r.text) + "</p>" : "") + "</a>";
    });
    return h + "</div>";
  }

  /* ---------- router ---------- */
  const scrollMem = {};
  let current = null;

  function setNav(key) {
    document.querySelectorAll(".bar nav a").forEach(a => a.classList.toggle("on", a.dataset.k === key));
  }

  function render() {
    const raw = decodeURIComponent((location.hash || "#/").replace(/^#\/?/, ""));
    const [path, anchor] = raw.split("#");
    const parts = path.split("/").filter(Boolean);
    const dash = $("#dash"), view = $("#view");
    let html = "", cls = "v-neutral", title = "Stop. Ask. Begin. · Atlas", nav = "";

    if (!parts.length) {
      dash.hidden = false; view.hidden = true; setNav("dash");
      document.title = "Stop. Ask. Begin. · Dashboard";
      return;
    }
    dash.hidden = true; view.hidden = false;

    if (parts[0] === "index") {
      nav = "index";
      const sub = parts[1] || "map";
      html = sub === "terms" ? viewTerms() : sub === "books" ? viewBooks() : viewIndexMap();
      title = "Tra cứu · " + title;
    } else if (parts[0] === "search") {
      nav = "search";
      const q = parts.slice(1).join("/");
      html = viewSearch(q);
      const box = $("#q"); if (box && document.activeElement !== box) box.value = q;
      title = "Tìm: " + q;
    } else if (P[parts[0]]) {
      const r = resolve(parts.slice(0, 3).join("/"));
      cls = "v-" + parts[0];
      nav = parts[0] === "ref" ? (parts[1] === "topics" ? "topics" : "ref") : "";
      if (!r) {
        html = crumbs([[PILLARS[parts[0]].name, href(parts[0])], ["Đang biên soạn", ""]]) +
          '<div class="empty">Mục <b>' + esc(parts.join("/")) + '</b> đang được biên soạn. Quay lại <a href="' + href(parts[0]) + '">' + esc(PILLARS[parts[0]].name) + "</a> hoặc xem <a href=\"#/index\">Mục lục</a>.</div>";
      } else if (r.item) { html = viewItem(r.item); title = r.item.title + " · " + PILLARS[r.pillar].name; }
      else if (r.topic) { html = viewTopic(r.topic); title = r.topic.title + " · " + PILLARS[r.pillar].name; }
      else { html = viewPillar(r.pillar); title = PILLARS[r.pillar].name + " · Atlas"; }
    } else {
      html = '<div class="empty">Không có trang này. <a href="#/">Về Dashboard</a></div>';
    }
    view.className = "page " + cls;
    view.innerHTML = html;
    document.title = title;
    setNav(nav);
    bindTermFilter();
    if (anchor) {
      const el = document.getElementById(anchor);
      if (el) setTimeout(() => el.scrollIntoView({ block: "start" }), 0);
    }
    trackRoute((location.hash || "#/").replace(/^#?\/?/, "#/"), title);
  }

  /* ---------- analytics & đo thời gian ở lại từng trang ---------- */
  let lastPath = null;
  let lastTitle = null;
  let lastEnterTime = Date.now();

  function flushEngagement() {
    if (!lastPath || typeof window.gtag !== "function") return;
    const now = Date.now();
    const elapsedMs = now - lastEnterTime;
    const elapsedSec = Math.round(elapsedMs / 1000);
    if (elapsedSec >= 1 && elapsedSec <= 7200) {
      window.gtag("event", "user_engagement", {
        engagement_time_msec: elapsedMs,
        page_path: lastPath,
        page_title: lastTitle
      });
      window.gtag("event", "page_dwell", {
        page_path: lastPath,
        page_title: lastTitle,
        duration_seconds: elapsedSec
      });
    }
    lastEnterTime = now;
  }

  function trackRoute(newPath, newTitle) {
    flushEngagement();
    lastPath = newPath;
    lastTitle = newTitle;
    lastEnterTime = Date.now();
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_title: newTitle,
        page_location: window.location.href,
        page_path: newPath
      });
    }
  }

  window.addEventListener("beforeunload", flushEngagement);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushEngagement();
    else lastEnterTime = Date.now();
  });

  function go() {
    if (current !== null) scrollMem[current] = window.scrollY;
    current = location.hash || "#/";
    render();
    const y = scrollMem[current];
    if (!current.includes("#", 2)) window.scrollTo(0, y || 0);
  }

  function parentOf(hash) {
    const parts = decodeURIComponent(hash.replace(/^#\/?/, "")).split("#")[0].split("/").filter(Boolean);
    if (parts.length <= 1 || parts[0] === "index" || parts[0] === "search") return "#/";
    return "#/" + parts.slice(0, parts.length - 1).join("/");
  }

  document.addEventListener("keydown", e => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || e.metaKey || e.ctrlKey || e.altKey) {
      if (e.key === "Escape" && tag === "input") e.target.blur();
      return;
    }
    if (e.key === "/") { e.preventDefault(); const q = $("#q"); if (q) q.focus(); return; }
    if (e.key === "Escape" && location.hash && location.hash !== "#/") { location.hash = parentOf(location.hash); return; }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const a = document.querySelector(e.key === "ArrowLeft" ? ".pn a:not(.nx)" : ".pn a.nx");
      if (a) location.hash = a.getAttribute("href");
    }
  });

  function start() {
    const q = $("#q");
    let timer = null;
    if (q) {
      q.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const v = q.value.trim();
          if (v) {
            const target = "#/search/" + encodeURIComponent(v);
            if (location.hash.startsWith("#/search/")) history.replaceState(null, "", target), go();
            else location.hash = target;
          }
        }, 220);
      });
      q.addEventListener("keydown", e => { if (e.key === "Enter" && q.value.trim()) location.hash = "#/search/" + encodeURIComponent(q.value.trim()); });
    }
    window.addEventListener("hashchange", go);
    go();
  }
  window.ATLAS.start = start;
  window.ATLAS.resolve = resolve;
})();
