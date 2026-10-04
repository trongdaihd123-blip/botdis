// local-ai/web-search.js
// Tìm kiếm Internet KHÔNG cần API key/token, chỉ dùng endpoint công khai:
//  1) Wikipedia API (vi -> en): opensearch + page summary (chất lượng cao nhất).
//  2) Wikidata API: wbsearchentities (sự kiện có cấu trúc, không key).
//  3) Bing RSS: https://www.bing.com/search?q=...&format=rss (không key)
//     + DuckDuckGo Instant Answer (không key) — cả hai đều qua BỘ LỌC LIÊN QUAN.
// Nguyên tắc trung thực:
//  - Chỉ trả về nội dung thật lấy từ HTTP response.
//  - Kết quả web phải chia sẻ token với câu hỏi, nếu không sẽ bị loại.
//  - Không bịa snippet/link. Không tìm thấy -> { found: false } và caller phải báo rõ.
import axios from "axios";
import * as cheerio from "cheerio";

const TIMEOUT_MS = Number(process.env.LOCAL_AI_SEARCH_TIMEOUT_MS || 10000);
const MAX_RESULTS = Number(process.env.LOCAL_AI_SEARCH_MAX_RESULTS || 5);
const UA =
  process.env.LOCAL_AI_SEARCH_UA ||
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function cleanText(s = "") {
  return String(s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s = "", n = 600) {
  const t = cleanText(s);
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const last = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf("\n"));
  if (last > n * 0.5) return cut.slice(0, last + 1);
  return `${cut.replace(/\s+\S*$/, "")}...`;
}

function stripAccents(s = "") {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

const STOP = new Set([
  "la", "gi", "cua", "cho", "voi", "va", "co", "khong", "hoi", "a", "oi", "minh",
  "toi", "ban", "ve", "o", "tai", "nao", "nhu", "the", "mot", "cac", "nhung",
  "duoc", "nay", "kia", "do", "thi", "ma", "hay", "ai", "the", "is", "what",
  "where", "who", "how", "do", "does", "xin", "vui", "long", "giup", "bot",
  "bao", "nhieu", "may", "mova", "nhat", "hien", "nay",
]);

function queryTokens(q = "") {
  return stripAccents(String(q).toLowerCase())
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOP.has(t));
}

// Kết quả web phải liên quan: chia sẻ ít nhất 1 token quan trọng với câu hỏi,
// hoặc chứa nguyên cụm câu hỏi (bỏ dấu). Chống spam/SEO rác (vd Bing trả
// kết quả tiếng Trung cho truy vấn tiếng Việt).
const SPAM_PATTERNS = [/锦江|都城酒店|metropolo|jinjiang/i, /support\.microsoft\.com/i, /lorem ipsum/i];

export function isRelevant(query, title = "", snippet = "") {
  const text = `${title} ${snippet}`;
  if (SPAM_PATTERNS.some((re) => re.test(text))) return false;
  const tokens = queryTokens(query);
  if (tokens.length === 0) return true; // câu hỏi quá ngắn/khó tách -> nương tay
  const hay = stripAccents(text.toLowerCase());
  const hayTokens = new Set(hay.replace(/[^a-z0-9\s]/g, " ").split(/\s+/));
  let hits = 0;
  for (const t of tokens) if (hayTokens.has(t)) hits++;
  if (hits >= Math.max(1, Math.floor(tokens.length / 3))) return true;
  const qFlat = stripAccents(String(query).toLowerCase()).replace(/\s+/g, " ").trim();
  if (qFlat.length >= 6 && hay.includes(qFlat)) return true;
  return false;
}

// Rút gọn câu hỏi tự nhiên thành từ khoá cho các API gợi ý tiền tố (Wikidata...).
// Vd: "thủ đô của Việt Nam là gì?" -> "thủ đô Việt Nam"
export function toKeywords(q = "") {
  let s = stripAccents(String(q).toLowerCase()).replace(/[?!.,;:()"'“”]/g, " ");
  const patterns = [
    /\bla gi\b/g, /\bla ai\b/g, /\bo dau\b/g, /\bnhu the nao\b/g, /\bbao nhieu\b/g,
    /\bkhi nao\b/g, /\btai sao\b/g, /\bvi sao\b/g, /\bhay cho\b/g, /\bcho (minh|toi|ban)\b/g,
    /\bcho biet\b/g, /\bhay\b/g, /\bbiet\b/g, /\bcua\b/g, /\bve\b/g,
    /\blam on\b/g, /\bxin\b/g, /\bhoi\b/g, /\bnao\b/g, /\bnhung\b/g, /\bcac\b/g,
  ];
  for (const re of patterns) s = s.replace(re, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s.length >= 3 ? s : String(q).trim();
}

// Wikimedia giới hạn tốc độ theo IP: thử lại 1 lần sau 2.5s khi bị 429,
// các lỗi khác trả về ngay để nguồn khác (Bing/DDG) vẫn có cơ hội.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function wikiGet(url, config = {}, retried = false) {
  try {
    return await axios.get(url, { headers: { "User-Agent": UA }, timeout: TIMEOUT_MS, ...config });
  } catch (err) {
    const status = err?.response?.status;
    if (!retried && (status === 429 || status === 503)) {
      await sleep(2500);
      return wikiGet(url, config, true);
    }
    throw err;
  }
}

// ---------- 1) Wikipedia (tìm full-text rồi lấy tóm tắt) ----------
// Dùng list=search thay vì opensearch để chịu được câu hỏi tự nhiên
// ("thủ đô của Việt Nam là gì?" vẫn ra bài "Thủ đô Việt Nam").
async function wikiSearchTitles(query, lang) {
  const tried = [query];
  const kw = toKeywords(query);
  if (kw && kw !== query) tried.push(kw);
  for (const sr of tried) {
    try {
      const res = await wikiGet(`https://${lang}.wikipedia.org/w/api.php`, {
        params: { action: "query", list: "search", srsearch: sr, srlimit: 3, format: "json" },
      });
      const hits = res.data?.query?.search || [];
      if (hits.length > 0) return hits;
    } catch {
      // thử cách tiếp theo
    }
  }
  return [];
}

async function searchWikipedia(query) {
  const out = [];
  for (const lang of ["vi", "en"]) {
    const hits = await wikiSearchTitles(query, lang);
    for (const h of hits) {
      const title = h.title;
      if (!title) continue;
      try {
        const sum = await wikiGet(
          `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        );
        const extract = sum.data?.extract;
        if (extract && isRelevant(query, title, extract)) {
          out.push({
            title: `${title} (Wikipedia ${lang})`,
            snippet: truncate(extract, 700),
            url: sum.data?.content_urls?.desktop?.page || "",
            source: `Wikipedia (${lang})`,
          });
          if (out.length >= 2) return out;
        }
      } catch {
        // bỏ qua bài không lấy được summary, thử bài tiếp theo
      }
    }
    if (out.length > 0) return out;
  }
  return out;
}

// ---------- 2) Wikidata (dữ kiện có cấu trúc) ----------
async function searchWikidata(query) {
  const tried = [query];
  const kw = toKeywords(query);
  if (kw && kw !== query) tried.push(kw);
  for (const sq of tried) {
    try {
      const res = await axios.get("https://www.wikidata.org/w/api.php", {
        params: { action: "wbsearchentities", search: sq, language: "vi", uselang: "vi", format: "json", limit: 3 },
        headers: { "User-Agent": UA },
        timeout: TIMEOUT_MS,
      });
      const out = [];
      for (const e of res.data?.search || []) {
        const label = e.label || e.title || "";
        const desc = e.description || "";
        if (!label) continue;
        const line = desc ? `${label}: ${desc}.` : label;
        if (isRelevant(query, label, desc)) {
          out.push({
            title: `${label} (Wikidata)`,
            snippet: truncate(line, 300),
            url: e.url?.startsWith("//") ? `https:${e.url}` : e.url || "",
            source: "Wikidata",
          });
        }
        if (out.length >= 2) break;
      }
      if (out.length > 0) return out;
    } catch {
      // thử từ khoá tiếp theo
    }
  }
  return [];
}

// ---------- 3) Bing RSS (web search thật, không key, có lọc liên quan) ----------
async function searchBingRSS(query, limit = MAX_RESULTS) {
  try {
    const res = await axios.get("https://www.bing.com/search", {
      params: { q: query, format: "rss" },
      headers: { "User-Agent": UA, "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8" },
      timeout: TIMEOUT_MS,
      responseType: "text",
    });
    const $ = cheerio.load(res.data, { xmlMode: true });
    const items = [];
    $("item").each((_, el) => {
      if (items.length >= limit) return false;
      const title = cleanText($(el).find("title").first().text());
      const link = $(el).find("link").first().text().trim();
      const desc = cleanText($(el).find("description").first().text());
      if (!title || !link.startsWith("http")) return;
      if (/^bing\s*:/i.test(title)) return; // mục trợ giúp tìm kiếm, không phải kết quả
      if (!isRelevant(query, title, desc)) return; // loại rác không liên quan
      items.push({ title, snippet: truncate(desc, 400), url: link, source: "Bing" });
    });
    return items;
  } catch {
    return [];
  }
}

// ---------- 4) DuckDuckGo Instant Answer (không key, có lọc) ----------
async function searchDuckDuckGo(query) {
  try {
    const res = await axios.get("https://api.duckduckgo.com/", {
      params: { q: query, format: "json", no_html: 1, skip_disambig: 1 },
      headers: { "User-Agent": UA },
      timeout: TIMEOUT_MS,
    });
    const d = res.data || {};
    const out = [];
    const abstract = cleanText(d.AbstractText || "");
    if (abstract && isRelevant(query, d.Heading || "", abstract)) {
      out.push({
        title: cleanText(d.Heading || query),
        snippet: truncate(abstract, 600),
        url: d.AbstractURL || "",
        source: cleanText(d.AbstractSource || "DuckDuckGo"),
      });
    }
    const topics = Array.isArray(d.RelatedTopics) ? d.RelatedTopics : [];
    for (const t of topics) {
      if (out.length >= 3) break;
      const text = cleanText(t?.Text || "");
      const url = t?.FirstURL || "";
      if (text && url && isRelevant(query, text, "")) {
        out.push({ title: truncate(text, 80), snippet: truncate(text, 300), url, source: "DuckDuckGo" });
      }
    }
    return out;
  } catch {
    return [];
  }
}

// ---------- API chính ----------
export async function searchWeb(query, opts = {}) {
  const q = String(query || "").trim();
  const limit = opts.limit || MAX_RESULTS;
  if (!q) return { found: false, answer: null, results: [], sourcesUsed: [], error: "empty-query" };
  if (process.env.LOCAL_AI_DISABLE_WEB === "1") {
    return { found: false, answer: null, results: [], sourcesUsed: [], error: "web-disabled" };
  }

  const [wiki, wikidata, bing, ddg] = await Promise.all([
    searchWikipedia(q).catch(() => []),
    searchWikidata(q).catch(() => []),
    searchBingRSS(q, limit).catch(() => []),
    searchDuckDuckGo(q).catch(() => []),
  ]);

  // Ưu tiên nguồn chất lượng: Wikipedia -> Wikidata -> Bing -> DDG
  const results = [...wiki, ...wikidata, ...bing, ...ddg].slice(0, limit);
  if (results.length === 0) {
    return { found: false, answer: null, results: [], sourcesUsed: [], error: "no-results" };
  }

  const top = results[0];
  const sourcesUsed = [...new Set(results.map((r) => r.source).filter(Boolean))];
  return { found: true, answer: top.snippet, results, sourcesUsed, error: null };
}

// Ghép kết quả web thành câu trả lời có trích nguồn, không bịa thêm.
export function formatWebAnswer(question, localText, web) {
  const lines = [];
  if (localText) lines.push(localText);
  else lines.push(`Mình tìm được thông tin sau cho "${question}":`);
  lines.push("");
  const top = web.results.slice(0, 3);
  top.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.title}`);
    if (r.snippet) lines.push(`   ${r.snippet}`);
    if (r.url) lines.push(`   Nguồn: ${r.url}`);
  });
  if (web.sourcesUsed?.length) lines.push(`\n(Nguồn: ${web.sourcesUsed.join(", ")} — kết quả tìm kiếm thật từ Internet)`);
  return lines.join("\n").slice(0, 1800);
}
