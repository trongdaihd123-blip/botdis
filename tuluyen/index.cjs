const { toZaloMessage, createZaloApi, parseMentions } = require('./bridge.cjs');

let game = null;
let api = null;
let shimsMod = null;
let ready = false;
let readyPromise = null;

async function init(client, { getPrefix, getAdmins, getSangThe }) {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    shimsMod = await import('./shims.mjs');
    shimsMod.setPrefixProvider(getPrefix);
    shimsMod.setAdminProvider(getAdmins);
    shimsMod.setSangTheProvider(getSangThe || (() => []));
    api = createZaloApi(client);
    game = await import('./game.mjs');
    game.startBeguanCheck(api);
    ready = true;
    console.log('[TULUYEN] Đã nạp hệ thống tu-luyên đầy đủ từ bot2');
  })().catch((e) => {
    console.error('[TULUYEN] Lỗi nạp hệ thống:', e);
  });
  return readyPromise;
}

const LEGACY_MAP = {
  tu: 'tl',
  'tu-luyen': 'tl',
  tl: 'tl',
  dp: 'dp',
  tt: 'tl i',
  'thong-tin': 'tl i',
  bxh: 'tl top',
  'bang-xep-hang': 'tl top',
  shop: 'tl shop',
  pk: 'tl pk',
};

async function buildContent(cmd, args, prefix) {
  if (cmd === 'mua') return `${prefix}tl buy ${args.join(' ')}`.trim();
  if (cmd === 'dung') return `${prefix}tl use ${args.join(' ')}`.trim();
  if (['su-kien', 'tham-hiem', 'explore'].includes(cmd)) return `${prefix}tl go`;
  if (['be-quan', 'bq', 'seclude'].includes(cmd)) {
    const a0 = (args[0] || '').toLowerCase();
    if (['end', 'finish', 'ket-thuc', 'stop'].includes(a0)) return `${prefix}tl stop`;
    if (a0 === 'start') return `${prefix}tl start`;
    return `${prefix}tl bq`;
  }
  const mapped = LEGACY_MAP[cmd];
  if (!mapped) return null;
  return `${prefix}${mapped} ${args.join(' ')}`.trim();
}

async function handleCommand(discordMsg, cmd, args, prefix) {
  if (!ready) {
    await discordMsg.reply('⏳ Hệ thống tu luyện đang khởi động, thử lại sau ít giây!');
    return true;
  }
  const blocked = shimsMod?.managerData?.data?.blockBot;
  if (Array.isArray(blocked) && !shimsMod.isAdmin(discordMsg.author.id)
      && blocked.some((u) => u.idUserZalo === String(discordMsg.author.id))) {
    await discordMsg.reply('🚫 Bạn đã bị KHÓA TƯƠNG TÁC BOT!\n📞 Liên hệ quản trị viên để được mở khóa.');
    return true;
  }
  const content = await buildContent(cmd, args, prefix);
  if (!content) return false;
  const zmsg = toZaloMessage(discordMsg);
  zmsg.data.content = content;
  zmsg.data.mentions = parseMentions(content, discordMsg);
  try {
    await game.handleTuLuyenCommand(api, zmsg, null);
  } catch (e) {
    console.error('[TULUYEN] handleTuLuyenCommand error:', e);
  }
  return true;
}

async function handlePrefixSpam(discordMsg) {
  if (!ready) return;
  const zmsg = toZaloMessage(discordMsg);
  try {
    await game.handlePrefixOnlySpam(api, zmsg);
  } catch {}
}

function isGameCommand(cmd) {
  return !!LEGACY_MAP[cmd] || ['mua', 'dung', 'su-kien', 'tham-hiem', 'explore', 'be-quan', 'bq', 'seclude'].includes(cmd);
}

module.exports = { init, handleCommand, handlePrefixSpam, isGameCommand };
