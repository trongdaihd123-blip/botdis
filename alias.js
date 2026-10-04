// Quan ly alias tuy bien cho dis (bot2 luu alias cung trong command.json;
// dis dispatch cung trong code nen can registry rieng).
// ,alias add <ten> <lenh_goc> | ,alias del <ten> | ,alias list  (QTV moi duoc add/del)

const fs = require('fs');
const path = require('path');

const FILE = './aliases.json';

function load() {
  try {
    if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {}
  return {};
}
function save(d) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(d, null, 2));
  } catch (e) {
    console.error('[ALIAS] loi luu file:', e.message);
  }
}

// Giai alias (theo toi da 3 nhay, chong loop). Tra ve ten lenh dich hoac null.
function resolve(cmd) {
  const map = load();
  let cur = String(cmd || '').toLowerCase();
  const seen = new Set();
  for (let i = 0; i < 3; i++) {
    if (!map[cur] || seen.has(cur)) break;
    seen.add(cur);
    cur = map[cur];
  }
  return map[String(cmd || '').toLowerCase()] ? cur : null;
}

const isAliasCommand = (cmd) => String(cmd || '').toLowerCase() === 'alias';

async function handleAliasCommand(message, args, prefix, ctx) {
  const isQtv = ctx?.isQtv || (() => false);
  const known = ctx?.knownCommands || [];
  const sub = (args[0] || '').toLowerCase();

  if (sub === 'add') {
    if (!isQtv(message.author.id)) return message.reply('Bạn hong có quyền! (chỉ QTV)') && true;
    const name = (args[1] || '').toLowerCase();
    const target = (args[2] || '').toLowerCase();
    if (!name || !target) return message.reply(`Cú pháp: \`${prefix}alias add <tên_alias> <lệnh_gốc}\`\nVD: \`${prefix}alias add sc2 soundcloud\``) && true;
    if (!/^[a-z0-9_-]{1,20}$/.test(name)) return message.reply('Tên alias chỉ gồm chữ/số/gạch (tối đa 20 ký tự)!') && true;
    if (known.includes(name) || name === 'alias') return message.reply(`\`${name}\` đã là lệnh có sẵn, không ghi đè được!`) && true;
    if (!known.includes(target) && target !== 'alias') return message.reply(`Không có lệnh gốc \`${target}\`! Gõ \`${prefix}help\` xem danh sách.`) && true;
    const map = load();
    map[name] = target;
    save(map);
    return message.reply(`✅ Đã thêm alias: \`${prefix}${name}\` → \`${prefix}${target}\``) && true;
  }

  if (sub === 'del' || sub === 'delete' || sub === 'remove' || sub === 'rm') {
    if (!isQtv(message.author.id)) return message.reply('Bạn hong có quyền! (chỉ QTV)') && true;
    const name = (args[1] || '').toLowerCase();
    if (!name) return message.reply(`Cú pháp: \`${prefix}alias del <tên_alias>\``) && true;
    const map = load();
    if (!map[name]) return message.reply(`Không có alias \`${name}\`!`) && true;
    delete map[name];
    save(map);
    return message.reply(`✅ Đã xóa alias \`${prefix}${name}\``) && true;
  }

  if (sub === 'list' || !sub) {
    const map = load();
    const keys = Object.keys(map);
    if (!keys.length) return message.reply(`Chưa có alias nào. Thêm bằng \`${prefix}alias add <tên> <lệnh_gốc}\``) && true;
    const lines = keys.map((k) => `\`${prefix}${k}\` → \`${prefix}${map[k]}\``).join('\n');
    return message.reply(`📋 **Alias hiện có:**\n${lines}`) && true;
  }

  return message.reply(`Cú pháp: \`${prefix}alias add/del/list\``) && true;
}

module.exports = { isAliasCommand, handleAliasCommand, resolveAlias: resolve, loadAliases: load };
