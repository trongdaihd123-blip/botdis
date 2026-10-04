// local-ai/brain.js
// AI chatbot nội bộ: 100% offline, không dùng API/token bên thứ ba.
// Cơ chế:
//  1. Chuẩn hoá câu hỏi (lowercase, bỏ dấu tuỳ chọn, tách token, lọc stopword).
//  2. Xử lý intent cứng nhẹ: chào hỏi đã có trong knowledge, giờ/ngày, tính toán.
//  3. So khớp mờ với knowledge.json bằng Jaccard token + điểm substring.
//  4. Trả về { text, confidence, source, needWeb } — caller quyết định có tìm web không.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KNOWLEDGE_PATH = path.join(__dirname, "knowledge.json");

let _kb = null;
export function loadKnowledge() {
  if (_kb) return _kb;
  try {
    _kb = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, "utf-8"));
  } catch {
    _kb = { qa: [] };
  }
  return _kb;
}

// ---------- Chuẩn hoá ----------
export function stripDiacritics(s = "") {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

export function normalizeText(s = "") {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

const VI_STOPWORDS = new Set([
  "là", "gì", "của", "cho", "với", "và", "có", "không", "cho", "hỏi", "ạ", "ơi",
  "cho", "mình", "tôi", "bạn", "cho", "về", "ở", "tại", "nào", "như", "thế",
  "một", "các", "những", "được", "này", "kia", "đó", "thì", "mà", "hay",
  "ai", "the", "a", "an", "is", "what", "where", "who", "how", "do", "does",
  "xin", "vui", "lòng", "giúp", "giup", "bot",
]);

export function tokenize(s = "") {
  const norm = stripDiacritics(normalizeText(s));
  return norm
    .replace(/[^a-z0-9\s+\-*/%^().,]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t && !VI_STOPWORDS.has(t));
}

function jaccard(aTokens, bTokens) {
  if (!aTokens.length || !bTokens.length) return 0;
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

// ---------- Intent: giờ / ngày (offline, dùng máy chủ) ----------
// Pattern cũ quá cứng ("hom nay ngay" liền nhau) nên "nay ngày gì" hay
// "hôm nay LÀ ngày gì" đều lọt -> rớt xuống web/LLM bịa (vd phán 2/9).
function handleDateTime(question) {
  const q = stripDiacritics(normalizeText(question));
  const qs = ` ${q} `;
  // Ngữ cảnh "hiện tại": hôm nay / nay / hiện tại / bây giờ / lúc này
  const nowCtx =
    /(hom nay|hien tai|bay gio|luc nay)/.test(q) || /(^|\s)nay(\s|$)/.test(qs);
  const wantsTime =
    /(may gio|gio hien tai|thoi gian hien tai|gio roi|phut roi)/.test(q) ||
    (nowCtx && /(gio|phut|giay)/.test(q));
  const wantsDate =
    /(thu may|ngay thang nam|ngay bao nhieu|ngay may roi|la ngay may|ngay gi)/.test(q) ||
    (nowCtx && /(ngay|thu)/.test(q)) ||
    /(hom nay|hien tai|bay gio).*(thang|nam)/.test(q);
  if (!wantsTime && !wantsDate) return null;
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }),
  );
  const pad = (n) => String(n).padStart(2, "0");
  const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dateStr = `${weekdays[now.getDay()]}, ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  if (wantsTime && wantsDate) return `Bây giờ là ${timeStr} — ${dateStr} (giờ Việt Nam).`;
  if (wantsTime) return `Bây giờ là ${timeStr} (giờ Việt Nam).`;
  return `Hôm nay là ${dateStr} (giờ Việt Nam).`;
}

// ---------- Intent: tính toán an toàn (không eval bừa) ----------
function normalizeMathWords(q) {
  let s = q.toLowerCase();
  s = s
    .replace(/cộng|cọng|cong/g, "+")
    .replace(/trừ|tru\b/g, "-")
    .replace(/nhân|nhan|×|x\b/g, "*")
    .replace(/chia|:/g, "/")
    .replace(/mũ|\^/g, "^")
    .replace(/bằng mấy|bằng bao nhiêu|= *\?*$/g, "")
    .replace(/[?.!]+$/g, "");
  return s;
}

function tryCalculate(question) {
  const s = normalizeMathWords(question);
  // Chỉ lấy phần biểu thức toán: số, +-*/%^(). khoảng trắng và dấu phẩy/chấm
  const m = s.match(/([\d\s.,+\-*/%^()]+)/);
  if (!m) return null;
  let expr = m[1].trim().replace(/,/g, "");
  // Phải có ít nhất 1 toán tử và 2 số mới tính (tránh nhầm ngày tháng "2/9")
  // Cho phép ngoặc đơn sau toán tử, vd: 12 * (3 + 4)
  const hasOperator = /[-+*/%^]/.test(expr);
  const digitCount = (expr.match(/\d/g) || []).length;
  if (!hasOperator || digitCount < 2) return null;
  if (!/^[\d\s.+\-*/%^()]+$/.test(expr)) return null;
  // Chặn trường hợp ngày tháng dạng 2/9, 20/11, 30/4 đứng một mình
  if (/^\s*\d{1,2}\s*\/\s*\d{1,2}\s*$/.test(expr)) return null;
  try {
    // Thay ^ thành ** cho luỹ thừa, kiểm tra cú pháp an toàn rồi mới tính
    const jsExpr = expr.replace(/\^/g, "**");
    if (jsExpr.length > 60) return null;
    // eslint-disable-next-line no-new-func
    const fn = new Function(`"use strict"; return (${jsExpr});`);
    const val = fn();
    if (typeof val !== "number" || !Number.isFinite(val)) return null;
    const rounded = Math.round(val * 1e10) / 1e10;
    return `Kết quả: ${expr} = ${rounded}`;
  } catch {
    return null;
  }
}

// ---------- Đổi đơn vị tiếng Việt (tính code, khỏi tra wiki) ----------
// VD: "8 tiếng là bao nhiêu giây", "2kg bằng mấy gam", "30 độ C sang F"
const UNIT_GROUPS = {
  time: [["giây", 1, ["giay", "s"]], ["phút", 60, ["phut", "ph"]], ["giờ", 3600, ["gio", "tieng", "h"]], ["ngày", 86400, ["ngay"]], ["tuần", 604800, ["tuan"]], ["tháng", 2592000, ["thang"]], ["năm", 31536000, ["nam"]]],
  length: [["mm", 0.001, ["mm"]], ["cm", 0.01, ["cm"]], ["dm", 0.1, ["dm"]], ["m", 1, ["m", "met"]], ["km", 1000, ["km", "cay so", "cay"]], ["inch", 0.0254, ["inch"]], ["dặm", 1609.34, ["dam", "mile"]], ["hải lý", 1852, ["hai ly"]]],
  weight: [["gam", 1, ["g", "gam", "gr"]], ["lạng", 100, ["lang"]], ["yến", 10000, ["yen"]], ["kg", 1000, ["kg", "ki", "ky", "can"]], ["tạ", 100000, ["ta"]], ["tấn", 1000000, ["tan"]], ["pound", 453.592, ["pound", "ao"]]],
  volume: [["ml", 0.001, ["ml"]], ["lít", 1, ["l", "lit", "dm3"]]],
  digital: [["KB", 1024, ["kb"]], ["MB", 1024 ** 2, ["mb"]], ["GB", 1024 ** 3, ["gb"]], ["TB", 1024 ** 4, ["tb"]]],
  area: [["m²", 1, ["m2", "met vuong"]], ["ha", 10000, ["ha", "hecta"]], ["km²", 1000000, ["km2"]]],
  speed: [["km/h", 1, ["km/h", "kmh"]], ["m/s", 3.6, ["m/s", "ms"]]],
  temp: [["°C", 1, ["c", "do c", "celsius"]], ["°F", 1, ["f", "do f", "fahrenheit"]]],
};
const UNIT_LOOKUP = new Map();
for (const [group, units] of Object.entries(UNIT_GROUPS)) {
  for (const [display, factor, aliases] of units) {
    for (const a of [display.toLowerCase(), ...aliases]) UNIT_LOOKUP.set(a, { display, factor, group });
  }
}

function parseViNum(s = "") {
  s = String(s).trim();
  if (!s) return NaN;
  if (/,/.test(s)) return parseFloat(s.replace(/\./g, "").replace(",", "."));
  if (/\.\d{3}\b/.test(s)) return parseFloat(s.replace(/\./g, ""));
  return parseFloat(s);
}

function findUnit(raw = "") {
  let s = raw.trim().replace(/\s+/g, " ");
  if (UNIT_LOOKUP.has(s)) return UNIT_LOOKUP.get(s);
  const toks = s.split(" ");
  for (let len = Math.min(2, toks.length); len >= 1; len--) {
    const key = toks.slice(0, len).join(" ");
    if (UNIT_LOOKUP.has(key)) return UNIT_LOOKUP.get(key);
  }
  return null;
}

function fmtVi(n) {
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n * 1e6) / 1e6;
  try {
    return r.toLocaleString("vi-VN", { maximumFractionDigits: 6 });
  } catch {
    return String(r);
  }
}

function tryConvertUnits(question) {
  let q = stripDiacritics(normalizeText(question)).replace(/²/g, "2").replace(/³/g, "3");
  const m = q.match(/([\d.,]+)\s*([a-z0-9/%().\/ ]+?)\s*(bang|la|sang|doi|thanh|=)\s*(?:bao nhieu|may|nhieu|la)?\s*([a-z0-9/%().\/ ]+?)(?:\?|$)/);
  if (!m) return null;
  const val = parseViNum(m[1]);
  if (!Number.isFinite(val)) return null;
  const u1 = findUnit(m[2]);
  const u2 = findUnit(m[4]);
  if (!u1 || !u2 || u1.group !== u2.group) return null;
  let out;
  if (u1.group === "temp") {
    if (u1.display === u2.display) out = val;
    else if (u1.display === "°C") out = (val * 9) / 5 + 32;
    else out = ((val - 32) * 5) / 9;
  } else {
    out = (val * u1.factor) / u2.factor;
  }
  const outStr = fmtVi(out);
  if (outStr === null) return null;
  let note = "";
  if (u1.group === "time" && (u1.display === "tháng" || u2.display === "tháng")) note = " (tính 1 tháng = 30 ngày)";
  if (u1.group === "time" && (u1.display === "năm" || u2.display === "năm")) note = " (tính 1 năm = 365 ngày)";
  return `Kết quả: ${fmtVi(val)} ${u1.display} = ${outStr} ${u2.display}${note}`;
}

// ---------- Đếm ngược ngày lễ (tính code theo giờ VN) ----------
const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
function todayHCM() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
const pad2 = (n) => String(n).padStart(2, "0");

const SOLAR_HOLIDAYS = [
  { names: ["tet duong", "tet tay", "nam moi", "tet duong lich"], d: 1, m: 1, label: "Tết Dương lịch" },
  { names: ["valentine", "le tinh nhan"], d: 14, m: 2, label: "Valentine" },
  { names: ["8/3", "8-3", "quoc te phu nu"], d: 8, m: 3, label: "Quốc tế Phụ nữ 8/3" },
  { names: ["ca thang tu", "1/4", "1-4"], d: 1, m: 4, label: "Cá tháng Tư" },
  { names: ["30/4", "30-4", "giai phong", "thong nhat"], d: 30, m: 4, label: "Giải phóng miền Nam 30/4" },
  { names: ["1/5", "1-5", "quoc te lao dong"], d: 1, m: 5, label: "Quốc tế Lao động 1/5" },
  { names: ["1/6", "1-6", "quoc te thieu nhi", "thieu nhi"], d: 1, m: 6, label: "Quốc tế Thiếu nhi 1/6" },
  { names: ["2/9", "2-9", "quoc khanh"], d: 2, m: 9, label: "Quốc khánh 2/9" },
  { names: ["20/10", "20-10", "phu nu viet nam"], d: 20, m: 10, label: "Phụ nữ Việt Nam 20/10" },
  { names: ["halloween"], d: 31, m: 10, label: "Halloween" },
  { names: ["20/11", "20-11", "nha giao"], d: 20, m: 11, label: "Nhà giáo Việt Nam 20/11" },
  { names: ["noel", "giang sinh", "25/12", "25-12"], d: 25, m: 12, label: "Giáng sinh" },
];
// Lễ âm: bảng tra cứu 2025-2028 (vượt phạm vi thì nhường cho web/LLM)
const LUNAR_HOLIDAYS = [
  { names: ["tet am", "tet nguyen dan", "tet ta", "tet co truyen", "an tet", "tet"], label: "Tết Nguyên Đán", dates: [[2025, 1, 29], [2026, 2, 17], [2027, 2, 6], [2028, 1, 26]] },
  { names: ["trung thu", "tet trung thu"], label: "Tết Trung thu", dates: [[2025, 10, 6], [2026, 9, 25], [2027, 9, 15]] },
  { names: ["gio to", "gio to hung vuong", "10/3", "10-3"], label: "Giỗ Tổ Hùng Vương", dates: [[2025, 4, 7], [2026, 4, 26], [2027, 4, 15]] },
];

function countdownText(label, target) {
  const today = todayHCM();
  const diff = Math.round((target - today) / 86400000);
  const dateStr = `${WEEKDAYS[target.getDay()]}, ${pad2(target.getDate())}/${pad2(target.getMonth() + 1)}/${target.getFullYear()}`;
  if (diff === 0) return `Chính là hôm nay! Hôm nay là ${label} (${dateStr}).`;
  let extra = "";
  if (diff >= 30) {
    const months = Math.floor(diff / 30);
    const days = diff % 30;
    extra = ` (khoảng ${months} tháng${days ? ` ${days} ngày` : ""})`;
  } else if (diff >= 14) {
    extra = ` (khoảng ${Math.floor(diff / 7)} tuần)`;
  }
  return `Còn ${diff} ngày nữa đến ${label}${extra} — rơi vào ${dateStr}.`;
}

function handleCountdown(question) {
  const q = stripDiacritics(normalizeText(question));
  const trigger =
    /(con|bao lau|bao nhieu|may).*(nua).*(den|toi)|den.*(con|bao|may)|(dem nguoc)/.test(q) ||
    (/(bao lau|con bao|bao nhieu|may ngay|bao gio)/.test(q) && /(den|tet|noel|le\b|ngay le)/.test(q));
  if (!trigger) return null;
  const today = todayHCM();

  // Dương lịch trước (để "tết dương" không bị nuốt bởi "tết" âm)
  for (const h of SOLAR_HOLIDAYS) {
    if (h.names.some((n) => q.includes(n))) {
      let t = new Date(today.getFullYear(), h.m - 1, h.d);
      if (t < today) t = new Date(today.getFullYear() + 1, h.m - 1, h.d);
      return { text: countdownText(h.label, t), target: t };
    }
  }
  for (const h of LUNAR_HOLIDAYS) {
    if (h.names.some((n) => q.includes(n))) {
      for (const [y, m, d] of h.dates) {
        const t = new Date(y, m - 1, d);
        if (t >= today) return { text: countdownText(`${h.label} (âm lịch)`, t), target: t };
      }
      return null; // hết bảng tra -> nhường web/LLM
    }
  }
  // Ngày tường minh: "đến 25/12", "ngày 15 tháng 8"
  let m = q.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/) || q.match(/ngay (\d{1,2}) thang (\d{1,2})/);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = m[3] ? Number(m[3]) : today.getFullYear();
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      let t = new Date(y, mo - 1, d);
      if (!m[3] && t < today) t = new Date(y + 1, mo - 1, d);
      return { text: countdownText(`ngày ${pad2(d)}/${pad2(mo)}`, t), target: t };
    }
  }
  return null;
}

// ---------- Khớp knowledge ----------
function scorePattern(qTokens, qNormNoAccent, qRaw, pattern) {
  const pNorm = normalizeText(pattern);
  const pNoAccent = stripDiacritics(pNorm);
  const pTokens = tokenize(pattern);
  let score = jaccard(qTokens, pTokens);
  // Bonus nếu pattern xuất hiện nguyên cụm trong câu hỏi (bỏ dấu)
  if (qNormNoAccent.includes(pNoAccent) && pNoAccent.length >= 4) score += 0.35;
  else if (pNoAccent.includes(qNormNoAccent) && qNormNoAccent.length >= 4) score += 0.25;
  // Bonus token quan trọng (thủ đô, tên nước...) trùng nhau
  return Math.min(score, 1);
}

export function answerLocal(rawQuestion = "") {
  const question = String(rawQuestion || "").trim();
  if (!question) {
    return { text: "", confidence: 0, source: "none", needWeb: false, intent: "empty" };
  }

  // 1) giờ/ngày
  const dt = handleDateTime(question);
  if (dt) return { text: dt, confidence: 0.95, source: "local:datetime", needWeb: false, intent: "datetime" };

  // 2) đếm ngược ngày lễ ("bao lâu nữa đến Tết/Noel...")
  const cd = handleCountdown(question);
  if (cd) return { text: cd.text, confidence: 0.95, source: "local:countdown", needWeb: false, intent: "countdown" };

  // 3) đổi đơn vị ("8 tiếng là bao nhiêu giây")
  const conv = tryConvertUnits(question);
  if (conv) return { text: conv, confidence: 0.95, source: "local:convert", needWeb: false, intent: "convert" };

  // 4) tính toán
  const calc = tryCalculate(question);
  if (calc) return { text: calc, confidence: 0.95, source: "local:math", needWeb: false, intent: "math" };

  // 5) knowledge base
  const kb = loadKnowledge();
  const qTokens = tokenize(question);
  const qNorm = normalizeText(question);
  const qNoAccent = stripDiacritics(qNorm);
  let best = null;
  let bestScore = 0;
  for (const item of kb.qa || []) {
    for (const pat of item.patterns || []) {
      const s = scorePattern(qTokens, qNoAccent, qNorm, pat);
      if (s > bestScore) {
        bestScore = s;
        best = item;
      }
    }
  }

  if (best && bestScore >= 0.3) {
    const high = bestScore >= 0.55;
    return {
      text: best.answer,
      confidence: Math.round(bestScore * 100) / 100,
      source: `local:kb:${best.id}`,
      needWeb: !high, // khớp vừa phải -> vẫn nên tìm web bổ sung nếu câu hỏi cần info mới
      intent: "kb",
      matchedId: best.id,
      volatile: !!best.volatile, // kiến thức thay đổi theo thời gian (dân số, giá...)
    };
  }

  return { text: "", confidence: Math.round(bestScore * 100) / 100, source: "local:none", needWeb: true, intent: "unknown" };
}

// Câu hỏi có dấu hiệu cần thông tin tươi / kiến thức mở rộng không?
const FRESH_HINTS = [
  /hom nay/i, /moi nhat/i, /mới nhất/i, /hien tai/i, /hiện tại/i, /bay gio/i, /bây giờ/i,
  /gia\b/i, /giá/i, /thoi tiet/i, /thời tiết/i, /tin tuc/i, /tin tức/i,
  /ty gia/i, /tỷ giá/i, /chung khoan/i, /chứng khoán/i, /ket qua/i, /kết quả/i,
  /lich thi/i, /lịch/i, /la ai\b/i, /là ai/i, /tieu su/i, /tiểu sử/i,
  /o dau\b/i, /ở đâu/i, /nam \d{4}/i, /bao nhieu\b/i, /bao nhiêu/i,
  /cach\b/i, /cách/i, /huong dan/i, /hướng dẫn/i, /dinh nghia/i, /định nghĩa/i,
  /la gi\b/i, /là gì/i, /nhu the nao/i, /như thế nào/i, /khi nao/i, /khi nào/i,
  /tai sao/i, /tại sao/i, /vi sao/i, /vì sao/i, /so sanh/i, /so sánh/i,
];

export function looksLikeFreshInfo(question = "") {
  return FRESH_HINTS.some((re) => re.test(question));
}

export function shouldSearchWeb(localResult, question = "") {
  if (process.env.LOCAL_AI_DISABLE_WEB === "1") return false;
  if (!localResult) return true;
  if (["datetime", "math", "countdown", "convert"].includes(localResult.intent)) return false;
  // Kiến thức biến động (dân số, giá...) + câu hỏi cần tin mới -> luôn tìm web bổ sung
  if (localResult.volatile && looksLikeFreshInfo(question)) return true;
  if (localResult.confidence >= 0.85) return false;
  if (localResult.needWeb) return true;
  if (looksLikeFreshInfo(question)) return true;
  return localResult.confidence < 0.55;
}
