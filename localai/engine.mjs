// local-ai/engine.js
// Điều phối AI: brain nội bộ (offline) + web-search (không key) — KHÔNG import
// bất cứ module Zalo nào nên có thể test offline: node --input-type=module -e
// "import('./engine.js').then(async m => console.log(await m.processAIQuestion('...')))".
import { answerLocal, shouldSearchWeb } from "./brain.mjs";
import { searchWeb, formatWebAnswer } from "./web-search.mjs";
import { isLlmAvailable, generateLocalAnswer } from "./local-llm.mjs";

// Tách câu hỏi khỏi nội dung tin nhắn (thuần string, dễ test):
// content-cre đã bỏ mention, prefix-cre là prefix hiện tại (vd "."), alias-cre là
// tên lệnh đã gõ (vd "ai"), quoteText-cre là nội dung tin nhắn được reply (nếu có).
export function extractQuestionText(content = "", prefix = ".", aliasCommand = "ai", quoteText = "") {
  let q = String(content || "").trim();
  const cmdLow = `${String(prefix)}${String(aliasCommand || "ai").toLowerCase()}`.toLowerCase();
  if (q.toLowerCase().startsWith(cmdLow)) q = q.slice(cmdLow.length).trim();
  if (!q && quoteText) q = String(quoteText).trim();
  return q;
}

// Hàm thuần để test offline không cần Zalo API.
// Trả về { text, via: "local" | "local+web" | "web" | "local-llm" | "local-llm+web" | "local-llm+kb" | "none", confidence, sources }
// Mặc định TẮT tìm web/Wiki: không trả lời được thì nhận không biết.
// Muốn mở lại luồng cũ (web + LLM tổng hợp) thì set LOCAL_AI_ALLOW_WEB=1.
const ALLOW_WEB = process.env.LOCAL_AI_ALLOW_WEB === "1";

const DONT_KNOW_TEXT =
  "Mình xin lỗi, câu này mình không biết. Bạn hỏi câu khác nhé — mình chắc tay về thủ đô, kiến thức khoa học cơ bản, đổi đơn vị, tính toán, giờ giấc và đếm ngược ngày lễ.";
export async function processAIQuestion(rawQuestion = "") {
  const question = String(rawQuestion || "").trim();
  if (!question) {
    return { text: "", via: "none", confidence: 0, sources: [] };
  }
  const local = answerLocal(question);
  if (!shouldSearchWeb(local, question)) {
    return { text: local.text, via: "local", confidence: local.confidence, sources: [local.source] };
  }
  // Kiến thức nền trúng chắc (kho 300 mục) và không biến động -> trả ngay
  // offline, khỏi tốn thời gian tìm web hay chờ LLM.
  if (local.intent === "kb" && local.confidence >= 0.55 && !local.volatile) {
    return { text: local.text, via: "local", confidence: local.confidence, sources: [local.source] };
  }
  // Kiến thức biến động nhưng hỏi trúng phóc -> trả đáp án có sẵn (không tìm web nữa)
  if (local.intent === "kb" && local.confidence >= 0.85) {
    return { text: local.text, via: "local", confidence: local.confidence, sources: [local.source] };
  }
  if (!ALLOW_WEB) {
    return { text: DONT_KNOW_TEXT, via: "none", confidence: local.confidence || 0, sources: [] };
  }
  const web = await searchWeb(question);

  // Ưu tiên LLM local tự đọc dữ liệu + tự sinh câu trả lời (thay vì trả nguyên
  // đống kết quả web thô). Hỏng/timeout -> rớt xuống luồng cũ bên dưới.
  try {
    if (await isLlmAvailable()) {
      const ctxParts = [];
      // Chỉ đưa kiến thức nền vào context khi khớp khá chắc, tránh nhiễu
      // (câu mơ hồ khớp nhầm entry nào đó sẽ làm LLM bịa theo).
      if (local.text && local.intent === "kb" && local.confidence >= 0.4) ctxParts.push(local.text);
      for (const r of web.results.slice(0, 3)) {
        ctxParts.push(`${r.title}: ${r.snippet}`);
      }
      const contextText = ctxParts.join("\n").slice(0, 1500);
      const answer = await generateLocalAnswer(question, contextText);
      if (answer) {
        const allSources = [
          ...(local.text && local.intent === "kb" ? [local.source] : []),
          ...web.sourcesUsed,
        ];
        const footer = allSources.length
          ? `\n\n(Nguồn: ${[...new Set(allSources)].join(", ")})`
          : "";
        return {
          text: `${answer}${footer}`.slice(0, 900),
          via: web.found ? "local-llm+web" : local.text ? "local-llm+kb" : "local-llm",
          confidence: local.confidence || 0.5,
          sources: allSources,
        };
      }
    }
  } catch (err) {
    console.warn("[AI local] LLM lỗi, fallback luồng cũ:", err?.message || err);
  }

  if (!web.found) {
    if (local.text) {
      // Có đáp án local nhưng độ tin cậy chưa cao + web thất bại -> trả local kèm lưu ý trung thực
      return {
        text: `${local.text}\n\n(Lưu ý: mình không tìm thêm được thông tin trên Internet lúc này nên chỉ trả lời theo kiến thức có sẵn.)`,
        via: "local",
        confidence: local.confidence,
        sources: [local.source],
        webError: web.error,
      };
    }
    return {
      text: `Mình chưa tìm được thông tin cho "${question}" trên Internet lúc này (Wikipedia/Wikidata/Bing không trả kết quả phù hợp). Bạn thử diễn đạt khác hoặc hỏi lại sau nhé.`,
      via: "none",
      confidence: local.confidence || 0,
      sources: [],
      webError: web.error,
    };
  }
  // Web có kết quả thật -> dùng làm đầu vào tạo câu trả lời
  if (local.text && local.confidence >= 0.55 && local.intent === "kb") {
    return {
      text: formatWebAnswer(question, local.text, web),
      via: "local+web",
      confidence: local.confidence,
      sources: [local.source, ...web.sourcesUsed],
    };
  }
  return {
    text: formatWebAnswer(question, "", web),
    via: "web",
    confidence: local.confidence || 0,
    sources: [...web.sourcesUsed],
  };
}
