# Atlas Stop. Ask. Begin. (bản HTML tương tác)

Mở `index.html` bằng trình duyệt (chạy offline qua `file://`, không cần server).

## Cấu trúc

```
Atlas/
├── index.html          # Dashboard (giữ nguyên thiết kế poster) + khung SPA
├── assets/atlas.css
├── assets/atlas.js     # Router hash, render 3 tầng, index, tìm kiếm
├── validate.js         # node validate.js: kiểm link, related, ký tự và cụm từ cấm
└── data/
    ├── ref.js          # Sách, HBR, 4 cuộc tranh luận (nạp đầu tiên)
    ├── stop_a.js       # STOP (What Got You Here Won't Get You There)
    ├── stop_b.js       # STOP (Triggers + The Earned Life)
    ├── ask.js          # ASK (Radical Candor + Coaching Habit + Advice Trap)
    ├── begin.js        # BEGIN (How to Begin)
    ├── begin_b.js      # BEGIN (The War of Art: Book One, Two và cụm Lãnh địa của Book Three)
    └── co.js           # CO-INTEL (Co-Intelligence)
```

Kiến trúc: **3 năng lực** (STOP, ASK, BEGIN) **+ 1 lớp xuyên suốt** (CO-INTEL). Bố cục poster 4 cột giữ nguyên; các cột không còn là bốn chặng tuyến tính.

## Ba tầng điều hướng (deeplink bằng hash)

| Tầng | Route | Ví dụ |
|---|---|---|
| 0. Dashboard | `#/` | poster 4 cột |
| 1. Chủ đề (danh sách + vắn tắt) | `#/<pillar>/<topic>` | `#/stop/habits` |
| 2. Chi tiết | `#/<pillar>/<topic>/<item>` | `#/stop/habits/winning-too-much` |
| Tra cứu | `#/index`, `#/index/terms`, `#/index/books`, `#/search/<từ khóa>` | |

## Schema dữ liệu (mỗi file `data/*.js`)

```js
ATLAS.add({
  pillar: "stop",                 // stop | ask | begin | co | ref
  topics: [{
    id: "habits",                 // kebab-case, duy nhất trong pillar
    title: "20 thói quen xấu",    // tiếng Việt
    en: "The Twenty Habits That Hold You Back",
    count: "20 + 1",              // nhãn số hiển thị (tùy chọn)
    lead: "1-2 câu giới thiệu chủ đề.",
    intro: ["Đoạn mở rộng (tùy chọn)."],
    source: { book: "wgyh", where: "Chương 4", file: "01_What_Got_You_Here_Wont_Get_You_There/Chuong_04_Hai_Muoi_Thoi_Quen_Xau.md" },
    sections: [{
      title: "Tên nhóm (có thể rỗng)",
      items: [{
        id: "winning-too-much",   // kebab-case, duy nhất trong topic
        k: "1",                   // ký hiệu ngắn hiện trong ô vuông
        title: "Muốn thắng bằng mọi giá",
        en: "Winning too much",
        brief: "Một câu vắn tắt, tối đa ~25 từ, hiện ở tầng danh sách.",
        body: ["Đoạn 1.", "Đoạn 2."],          // 120-260 từ tổng cộng
        quote: { en: "Nguyên văn tiếng Anh, chép đúng từ sách.", vi: "Bản dịch.", where: "Chương 4" },
        signs: ["Dấu hiệu nhận biết (tùy chọn)."],
        practice: ["Cách thực hành (tùy chọn)."],
        source: { book: "wgyh", where: "Chương 4", file: "..." },   // tùy chọn, mặc định lấy của topic
        related: ["stop/habits/adding-too-much-value", "ask/monsters/tell-it"],
        note: "Tổng hợp biên soạn, không phải khung của tác giả."   // chỉ khi là phần tổng hợp
      }]
    }]
  }],
  glossary: [
    { en: "Feedforward", vi: "Feedforward (góp ý hướng tới)", policy: "KEEP", ref: "stop/change-process/feedforward", book: "wgyh" }
  ]
});
```

- `file` tính từ thư mục `Stop_Ask_Begin/`. Chỉ điền khi file thật sự tồn tại (bản dịch, hoặc transcript nguồn với The War of Art).
- `related` là đường dẫn `pillar/topic/item` hoặc `pillar/topic`.
- Mã sách: `wgyh`, `triggers`, `rc`, `coaching`, `advice`, `begin`, `woa`, `earned`, `coint`, `coexist`, `hbr`.
- The War of Art: nguồn duy nhất là `09_The_War_of_Art/The_War_of_Art_Transcript.md` (audiobook 2012, lời khác bản in 2002). `where` ghi mốc `[h:mm:ss]` của đoạn transcript.

## Kỷ luật nội dung

- Tuân thủ `AGENTS.md`, `GLOSSARY_MASTER.md`, `GLOSSARY.md` của từng cuốn.
- Không dùng em-dash/en-dash. Không dùng sáo ngữ bị cấm (xem `STYLE_GUIDE_MASTER.md`).
- `quote.en` phải là nguyên văn trong sách gốc (EPUB). Không bịa trích dẫn.
- Phần nào là tổng hợp của người biên soạn (không phải khung của tác giả) phải có `note`.
