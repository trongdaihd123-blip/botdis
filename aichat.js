// Port tu /root/bot/bot2 qua Discord:
// - gemini.js (Paimon, model gemini-2.5-flash) -> REST axios, khong can SDK
// - api-crawl/assistant-ai/deepseek.js (API nemg, dich sang Viet)
// - chat-bot/simsimi/simsimi-api.js (lenh chat)

const axios = require('axios');

const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCsJ7pOVDNkjFx74JBz4hvrtbihSU6g_fE';
const SIMSIMI_KEY = process.env.SIMSIMI_API_KEY || 'GZyOSYF-1Pr5bDnMZ-ng2bNQVbkvtH1OeJyNBjoi';

// Gioi han tin Discord (2000 ky tu) — cat nho hon de kem embed an toan
const MAX_LEN = 1800;
function fit(text) {
  const s = String(text ?? '').trim();
  if (s.length <= MAX_LEN) return [s];
  const parts = [];
  let cur = '';
  for (const line of s.split('\n')) {
    if (line.length > MAX_LEN) {
      if (cur) { parts.push(cur); cur = ''; }
      for (let i = 0; i < line.length; i += MAX_LEN) parts.push(line.slice(i, i + MAX_LEN));
      continue;
    }
    if (cur.length + line.length + 1 > MAX_LEN) { parts.push(cur); cur = line; }
    else cur = cur ? `${cur}\n${line}` : line;
  }
  if (cur) parts.push(cur);
  return parts;
}

// ---- Hang doi chung tranh spam API ----
const queue = [];
let busy = false;
function enqueue(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    pump();
  });
}
async function pump() {
  if (busy || queue.length === 0) return;
  busy = true;
  while (queue.length > 0) {
    const { task, resolve, reject } = queue.shift();
    try {
      resolve(await task());
    } catch (e) {
      reject(e);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  busy = false;
}

// ---- Gemini (Paimon) ----
const PAIMON_SYSTEM = `Bạn là Paimon, người bạn đồng hành trong thế giới Teyvat.
- Luôn tự xưng là "Paimon", không dùng "tôi/tớ/mình".
- Tham ăn, nhiệt tình, nói nhiều, hay cảm thán ("Hehe!", "Nè nè!").
- Hơi tự mãn, ngây thơ, trung thành với Nhà Lữ Hành, ghét bị gọi là "thực phẩm dự trữ".
- Trả lời tự nhiên, đi thẳng vào ý chính, tối đa ~8 câu. Đang chat trên Discord.`;
const geminiHistory = new Map(); // userId -> [{role, text}]

async function askGemini(userId, question, userName) {
  return enqueue(async () => {
    const hist = geminiHistory.get(userId) || [];
    hist.push({ role: 'user', text: `[${userName}]: ${question}` });
    while (hist.length > 20) hist.shift();
    const contents = hist.map((h) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.text }],
    }));
    const { data } = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        system_instruction: { parts: [{ text: PAIMON_SYSTEM }] },
        contents,
        generationConfig: { temperature: 0.9, topK: 40, topP: 0.8, maxOutputTokens: 600 },
      },
      { timeout: 30000 }
    );
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
    if (!text) throw new Error('Gemini không trả lời');
    hist.push({ role: 'assistant', text });
    geminiHistory.set(userId, hist);
    return text;
  });
}

// ---- DeepSeek (nemg) + dich sang Viet ----
async function translateVI(text) {
  try {
    const res = await axios.get('https://translate.googleapis.com/translate_a/single', {
      params: { client: 'gtx', sl: 'auto', tl: 'vi', dt: 't', q: text },
      timeout: 15000,
    });
    return res.data[0].map((t) => t[0]).join('');
  } catch {
    return text;
  }
}
async function askDeepSeek(question) {
  return enqueue(async () => {
    const res = await axios.get(
      `https://api.nemg.me/gpt?type=deepseekai&msg=${encodeURIComponent(question)}`,
      { timeout: 30000 }
    );
    let ans = res.data?.ketQua?.result || 'Không có kết quả trả về từ API.';
    return translateVI(ans);
  });
}

// ---- Simsimi ----
async function askSimsimi(text) {
  return enqueue(async () => {
    const res = await axios.post(
      'https://wsapi.simsimi.com/190410/talk',
      { utext: text, lang: 'vn', atext_bad_prob_max: 0.7 },
      { timeout: 10000, headers: { 'Content-Type': 'application/json', 'x-api-key': SIMSIMI_KEY } }
    );
    const reply = res.data?.atext;
    if (!reply) throw new Error('Simsimi không trả lời');
    return reply;
  });
}

const COMMANDS = ['ai', 'gemini', 'hoi', 'deepseek', 'ds', 'chat', 'simsimi'];
const isAiCommand = (cmd) => COMMANDS.includes(cmd);

async function replyLong(message, text) {
  const parts = fit(text);
  await message.reply(parts[0]);
  for (let i = 1; i < parts.length; i++) await message.channel.send(parts[i]);
}

async function handleAiCommand(message, cmd, args) {
  const question = args.join(' ').trim();
  if (cmd === 'ai' || cmd === 'gemini' || cmd === 'hoi') {
    if (!question) return message.reply('Nhập câu hỏi! VD: `,ai Paimon là ai?`');
    const wait = await message.reply('Để Paimon nghĩ xem nào... Ehem! 🤔');
    try {
      const name = message.member?.displayName || message.author.globalName || message.author.username;
      const ans = await askGemini(message.author.id, question, name);
      await wait.edit(fit(ans)[0]);
      for (const p of fit(ans).slice(1)) await message.channel.send(p);
    } catch (e) {
      console.error('[AI gemini]', e.message);
      await wait.edit('Paimon đói quá nghĩ không ra... thử lại sau nha! 😢');
    }
    return true;
  }
  if (cmd === 'deepseek' || cmd === 'ds') {
    if (!question) return message.reply('Nhập câu hỏi! VD: `,ds giải thích hố đen`');
    const wait = await message.reply('Đang hỏi DeepSeek... ⏳');
    try {
      await replyLong(message, await askDeepSeek(question));
      try { await wait.delete(); } catch {}
    } catch (e) {
      console.error('[AI deepseek]', e.message);
      await wait.edit('Có lỗi khi hỏi DeepSeek, thử lại sau nha! 😢');
    }
    return true;
  }
  if (cmd === 'chat' || cmd === 'simsimi') {
    if (!question) return message.reply('Nhập nội dung trò chuyện! VD: `,chat xin chào`');
    try {
      const ans = await askSimsimi(question);
      await message.reply(`Sim: ${ans}`);
    } catch (e) {
      console.error('[AI simsimi]', e.message);
      await message.reply('Xin lỗi, Sim không trả lời lúc này, thử lại sau nha!');
    }
    return true;
  }
  return false;
}

module.exports = { isAiCommand, handleAiCommand, COMMANDS };
