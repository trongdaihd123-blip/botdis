// local-ai/local-llm.js
// Client gọi model LLM chạy local (llama-server, mặc định http://127.0.0.1:8089).
// Thử nghiệm: Qwen2.5-0.5B Q4 — tự sinh câu trả lời tiếng Việt, KHÔNG hardcode.
// Quy tắc an toàn:
//  - Hàng đợi tuần tự (server 1 slot, tránh quá tải RAM).
//  - Timeout 100s/câu; lỗi/timeout -> caller tự fallback luồng cũ.
//  - Auto-detect: server chết thì bỏ qua êm, không làm hỏng lệnh .ai.
const LLM_URL = (process.env.LOCAL_LLM_URL || "http://127.0.0.1:8089").replace(/\/$/, "");
const LLM_TIMEOUT_MS = Number(process.env.LOCAL_LLM_TIMEOUT_MS || 100000);
const LLM_MAX_TOKENS = Number(process.env.LOCAL_LLM_MAX_TOKENS || 200);

let healthCache = { ok: false, at: 0 };
const HEALTH_TTL = 60 * 1000;

export function isLlmDisabled() {
  return process.env.LOCAL_LLM_DISABLED === "1";
}

export async function isLlmAvailable() {
  if (isLlmDisabled()) return false;
  const now = Date.now();
  if (now - healthCache.at < HEALTH_TTL) return healthCache.ok;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${LLM_URL}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    const data = await res.json().catch(() => ({}));
    healthCache = { ok: data?.status === "ok", at: now };
  } catch {
    healthCache = { ok: false, at: now };
  }
  return healthCache.ok;
}

// Hàng đợi tuần tự: mỗi lượt 1 request tới server.
let queueTail = Promise.resolve();
function enqueue(fn) {
  const run = queueTail.then(fn, fn);
  queueTail = run.catch(() => {});
  return run;
}

function cleanAnswer(text = "") {
  let s = String(text || "").trim();
  // Cắt phần model lắm mồm viết tiếp "Hỏi:" mới
  const cutIdx = s.search(/\n\s*Hỏi\s*:/);
  if (cutIdx > 0) s = s.slice(0, cutIdx).trim();
  s = s.replace(/^(Đáp|Trả lời)\s*:\s*/i, "").trim();
  // Chốt an toàn Zalo: tối đa ~500 ký tự, cắt tại dấu câu
  const MAX = 500;
  if (s.length > MAX) {
    const cut = s.slice(0, MAX);
    const last = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf("\n"));
    s = last > MAX * 0.5 ? cut.slice(0, last + 1) : `${cut.replace(/\s+\S*$/, "")}...`;
  }
  return s;
}

function buildPrompt(question, contextText = "") {
  const base = "Bạn là trợ lý AI nói tiếng Việt tự nhiên, ngắn gọn (tối đa 100 từ).";
  if (contextText) {
    return `${base} Dựa vào THÔNG TIN dưới đây để trả lời, không bịa thêm. Nếu thông tin không đủ thì nói không chắc.\n\nTHÔNG TIN:\n${contextText}\n\nHỏi: ${question}\nĐáp:`;
  }
  return `${base}\n\nHỏi: ${question}\nĐáp:`;
}

export async function generateLocalAnswer(question, contextText = "") {
  const q = String(question || "").trim();
  if (!q) return "";
  return enqueue(async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), LLM_TIMEOUT_MS);
    try {
      const res = await fetch(`${LLM_URL}/completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          prompt: buildPrompt(q, contextText),
          n_predict: LLM_MAX_TOKENS,
          temperature: 0.7,
          top_p: 0.9,
          repeat_penalty: 1.15,
          seed: Math.floor(Math.random() * 100000),
          stop: ["Hỏi:", "\nHỏi:"],
        }),
      });
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
      const data = await res.json();
      return cleanAnswer(data?.content);
    } finally {
      clearTimeout(t);
    }
  });
}
