// Port tu /root/bot/bot2/src/Tdai-service/troll/* qua Discord.
// Giu nguyen tiers/comment/seed-hang-ngay, chi thay Zalo API bang discord.js.

const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

try {
  registerFont('./fonts/SF-Pro-Display-Bold.ttf', { family: 'SF Pro Display', weight: 'bold' });
} catch {}

const DATA_DIR = './assets/json-data';
function dataFile(name) { return path.join(DATA_DIR, `troll-${name}.json`); }
function loadData(name) {
  try {
    const p = dataFile(name);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {}
  return {};
}
function saveData(name, d) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(dataFile(name), JSON.stringify(d, null, 2));
  } catch {}
}
const today = () => new Date().toISOString().slice(0, 10);

// Seed on dinh danh ngay (giong ban goc)
function dailySeed(str) {
  const s = String(str);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}
const pick = (arr, seed) => arr[seed % arr.length];

// ---- Du lieu goc tu bot2 ----
const GAY_TIERS = [
  { max: 10, texts: ['Thẳng như thước kẻ, không có gì đáng ngờ.', 'Trai thẳng real, bẻ cong còn khó hơn lên trời.', 'Nhìn là biết men lì, khỏi cần check lại.'] },
  { max: 20, texts: ['Tò mò một chút thôi, không có gì nhé...', 'Hơi liếc ngang một cái rồi quay xe kịp.', 'Mới chỉ dừng ở mức xem cho biết.'] },
  { max: 35, texts: ['Đang tự khám phá bản thân, cứ từ từ thôi.', 'Thấy cầu vồng cũng ngắm lâu hơn người ta một chút.', 'Trong lòng hơi gợn sóng, ngoài mặt vẫn tỉnh bơ.'] },
  { max: 50, texts: ['Nửa nạc nửa mỡ, hôm nay chưa chắc chắn.', '50-50, hên xui như tung đồng xu.', 'Sáng thẳng chiều cong, tối thì tùy mood.'] },
  { max: 65, texts: ['Cờ pride đang vẫy nhẹ ở phía xa kìa!', 'Bắt đầu thuộc lòng nhạc cầu vồng rồi đó.', 'Đi ngang quán trà sữa là auto liếc vào.'] },
  { max: 78, texts: ['Nghiêng hẳn về phía cầu vồng rồi đó bạn ơi!', 'List crush toàn trai đẹp, chối cũng vô ích.', 'Gu ăn mặc ngày càng slay, ai nhìn cũng biết.'] },
  { max: 90, texts: ['Chị mẹ của thiên hạ, đanh đá số 2 không ai số 1.', 'Mở miệng là sassy, bước đi là catwalk.', 'Hội chị em kết nạp từ lâu mà giấu không báo.'] },
  { max: 100, texts: ['100% chính chủ, không có gì để che giấu nữa rồi!', 'Full option không che, sống thật cho đời nể!', 'Đo 10 lần vẫn 100, cái máy cũng phải nể.'] },
  { max: 500, texts: ['Vượt ngưỡng! Độ gay của anh khiến máy đo bị phá hủy! 💥', 'Máy đo bốc khói rồi, kỷ lục mới của nhóm!'] },
  { max: Infinity, texts: ['Bạn đến từ hành tinh tím đúng không? 👽💜', 'NASA vừa gọi điện xin mẫu DNA của anh.'] },
];
const GAY_GENDERS = [
  { label: 'Nam', emoji: '♂' }, { label: 'Nữ', emoji: '♀' },
  { label: 'Nam', emoji: '♂' }, { label: 'Nam', emoji: '♂' },
];

const UYTIN_TIERS = [{"max":10,"rank":"Đáy xã hội","texts":["Uy tín như giấy lộn, ai cũng phải dè chừng!","Hứa 10 lần bùng cả 10, ai dám tin nữa.","Mượn 10k từ năm ngoái tới giờ chưa thấy trả."]},{"max":30,"rank":"Tuất","texts":["Uy tín lem nhem, cần nỗ lực hơn nữa!","Lúc uy tín lúc bùng kèo, hên xui lắm.","Rủ đi chơi là bạn bè bắt cọc trước cho chắc."]},{"max":50,"rank":"Hơi uy tín","texts":["Bắt đầu có chút tiếng tăm, cố gắng lên!","Được cái nói là làm... trừ mấy lần quên.","Mức này vay tiền vẫn cần người bảo lãnh."]},{"max":75,"rank":"Liêm","texts":["Uy tín vững vàng, được mọi người tin tưởng.","Nói một là một, cả nhóm đều nể.","Giao việc quan trọng là yên tâm ngủ ngon."]},{"max":100,"rank":"Uy tín bậc thầy","texts":["Uy tín vang dội, danh tiếng không ai sánh bằng!","Lời nói nặng tựa ngàn vàng, ai cũng tin sái cổ.","Ra đường không cần ví, cái mặt uy tín là đủ."]},{"max":500,"rank":"Vượt ngưỡng uy tín","texts":["Uy tín cao đến mức máy đo phải chào thua!","Nói gì người ta cũng tin, kể cả chuyện cổ tích."]},{"max":null,"rank":"Thánh uy tín","texts":["Người ta lấy tên bạn ra để thề!","Uy tín vang tới mức vũ trụ cũng phải ghi nhận."]}];

const TAY_TIERS = [{"max":10,"rank":"Chưa tày đâu","texts":["Sạch sẽ, chưa tày đâu, cứ thế mà phát huy!","Lý lịch trong sạch, tổ dân phố đã xác nhận.","Nhìn mặt là thấy hiền, muốn tày cũng không nổi."]},{"max":50,"rank":"Hơi tày","texts":["Hơi tày nhẹ rồi đó, coi chừng lún sâu hơn!","Mới dính chút bùn, rửa vẫn còn kịp.","Bắt đầu có mùi rồi, mọi người để ý đó."]},{"max":80,"rank":"Tội Tày Trời","texts":["Tày nặng rồi, đúng là tội tày trời khó gột!","Sổ đen đã ghi tên, muốn xóa cũng khó.","Làm gì cũng bị soi, vì tày quá rõ."]},{"max":100,"rank":"Trời Đất Không Dung","texts":["Trời đất không dung, tày đến mức không ai cứu nổi!","Đến ông trời cũng lắc đầu, ca này chịu thua.","Tày thành huyền thoại, người đời còn nhắc mãi."]},{"max":500,"rank":"Tày Vượt Ngưỡng","texts":["Máy đo tày nổ tung, chưa từng thấy ca nào nặng vậy!","Vượt mọi thang đo, kỷ lục tày mới của nhóm."]},{"max":null,"rank":"Tày Vô Cực","texts":["Trời đất quỷ thần đều không dung, đi vào sử sách!","Tày xuyên không gian thời gian, vô đối thủ."]}];

const HAIHUOC_TIERS = [
  { max: 10, rank: 'Lạnh lùng', comment: 'Nghiêm nghị như bổn cẩm, chẳng ai dám đùa.' },
  { max: 20, rank: 'Nhạt', comment: 'Hài hước như nước ốc, chẳng có gì để cười.' },
  { max: 40, rank: 'Gỗ', comment: 'Đọc joke xong chỉ có cây cối mới hiểu.' },
  { max: 60, rank: 'Bình thường', comment: 'Cũng có vài câu vui, nhưng chưa đủ để cười nghiêng ngả.' },
  { max: 80, rank: 'Hài hước', comment: 'Cười rụng rốn luôn, ai cũng thích giao lưu!' },
  { max: 100, rank: 'Phiền', comment: 'Hài hước đến mức phiền, ai cũng muốn chạy trốn!' },
];

const DANHPHAN_LIST = [
  { id: 'doanh_nhan', title: 'Doanh Nhân', emoji: '💼', color: '#00b894', remark: 'Hôm nay bạn là một doanh nhân thành đạt, tiền vào như nước!' },
  { id: 'dep_trai_nhat', title: 'Người Đẹp Trai Nhất Thế Giới', emoji: '🌟', color: '#fdcb6e', remark: 'Bạn quá đẹp trai, cả thế giới phải ngước nhìn!' },
  { id: 'xui_xeo', title: 'Kẻ Xui Xẻo', emoji: '😫', color: '#e17055', remark: 'Hôm nay bạn xui xẻo hơn cả xui xẻo, đi cẩn thận kẻo vấp!' },
  { id: 'an_xin', title: 'Ăn Xin', emoji: '🥺', color: '#dfe6e9', remark: 'Hôm nay bạn là một kẻ ăn xin chính hiệu, xin ai đó cho bát cơm!' },
  { id: 'vo_gia_cu', title: 'Vô Gia Cư', emoji: '🏚️', color: '#b2bec3', remark: 'Không nhà không cửa, hôm nay bạn ngủ gầm cầu!' },
  { id: 'lop', title: 'Lốp', emoji: '🛞', color: '#636e72', remark: 'Mày làm gì có danh phận' },
];

const RIP_REASONS = ['Đang ngáp bị cứt bồ câu rơi vào mồm','Nằm trong tủ lạnh giải nhiệt mùa hè','Bị chó cắn vì nhái giọng chủ nó','Hít keo con chó quá nhiều','Đuổi theo cầu vồng nhưng không thấy vàng','Tự vấp chân mình và rơi xuống cống','Ăn mì gói quá hạn 3 năm','Bị chuột rút khi đang vuốt điện thoại','Thức 72 tiếng để cày rank game','Bị bóng đèn rơi trúng đầu khi đang chửi nhau trên mạng','Chết vì cười khi đọc comment xàm','Bị chậu cây rơi trúng vì ngước lên xem hot girl','Uống nước quên mở miệng','Bị vợ đánh vì nói yêu vợ nhưng hết tiền đưa','Say xe nhưng vẫn cố ngồi ghế cuối','Ăn sầu riêng với coca-cola','Tự chụp ảnh selfie rơi xuống hồ bơi','Bị muỗi đốt quá nhiều vì mặc đồ đen','Hẹn hò với AI và bị sốc tim','Thở quá mạnh làm vỡ phổi'];

function deptraiRemark(pct, male) {
  if (pct <= 10) return male ? 'Trời ơi đất hỡi! 🥲' : 'Cũng tàm tạm đó bạn ơi! 🫣';
  if (pct <= 30) return male ? 'Hơi hơi có nét! 😅' : 'Bắt đầu có nét rồi nè! 😊';
  if (pct <= 50) return male ? 'Cũng được nha, ổn áp! 👌' : 'Dễ thương phết! 💕';
  if (pct <= 70) return male ? 'Trai xịn đây rồi! 🔥' : 'Gái xinh đẹp quá trời! 💋';
  if (pct <= 90) return male ? 'Đẹp trai quá mức quy định! 🏆' : 'Hoa hậu tương lai đây rồi! 👑';
  return male ? 'SIÊU PHẨM — người thật việc thật! 🌟' : 'TUYỆT SẮC — nghiêng nước nghiêng thành! 🌟';
}

// ---- Ve anh chung (dua theo canvas-gay goc) ----
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = String(text).split(' ');
  let line = '', cy = y;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, cy);
      line = word + ' ';
      cy += lineH;
    } else line = test;
  }
  if (line) ctx.fillText(line.trim(), x, cy);
  return cy;
}

async function drawCheckImage({ name, avatarUrl, title, label, percent, comment, theme }) {
  const W = 660, H = 250;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0e1022');
  bg.addColorStop(1, '#1a1f40');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  roundRect(ctx, 1, 1, W - 2, H - 2, 14);
  ctx.strokeStyle = '#2e3460';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = theme.title;
  ctx.fillText(title, 24, 34);

  const ax = 100, ay = 140, ar = 72;
  const ring = ctx.createLinearGradient(ax - ar, ay - ar, ax + ar, ay + ar);
  theme.ring.forEach(([o, c]) => ring.addColorStop(o, c));
  ctx.beginPath();
  ctx.arc(ax, ay, ar + 7, 0, Math.PI * 2);
  ctx.strokeStyle = ring;
  ctx.lineWidth = 9;
  ctx.stroke();
  try {
    const img = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax, ay, ar, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, ax - ar, ay - ar, ar * 2, ar * 2);
    ctx.restore();
  } catch {
    ctx.beginPath();
    ctx.arc(ax, ay, ar, 0, Math.PI * 2);
    ctx.fillStyle = '#4a4a8a';
    ctx.fill();
  }

  const tx = 210;
  ctx.font = 'bold 30px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(name).slice(0, 22), tx, 84);
  ctx.font = 'bold 17px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label + ':', tx, 116);
  const bx = tx, by = 126, bw = 280, bh = 22;
  roundRect(ctx, bx, by, bw, bh, 11);
  ctx.fillStyle = '#2a2a55';
  ctx.fill();
  const fillW = Math.min(bw, Math.max(22, (Math.min(percent, 100) / 100) * bw));
  const bar = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  theme.bar.forEach(([o, c]) => bar.addColorStop(o, c));
  roundRect(ctx, bx, by, fillW, bh, 11);
  ctx.fillStyle = bar;
  ctx.fill();
  ctx.font = 'bold 40px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(percent + '%', bx + bw + 10, by + bh);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#ffcc44';
  ctx.fillText('Nhận xét:', tx, 182);
  ctx.fillStyle = '#ffffff';
  wrapText(ctx, comment, tx + 80, 182, W - tx - 80 - 15, 19);

  const out = path.join('/tmp/opencode', `troll_${Date.now()}.png`);
  if (!fs.existsSync('/tmp/opencode')) fs.mkdirSync('/tmp/opencode', { recursive: true });
  await fs.promises.writeFile(out, canvas.toBuffer('image/png'));
  return out;
}

async function drawRipImage({ name, avatarUrl, age, reason }) {
  const W = 660, H = 300;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('🪦 R.I.P 🪦', W / 2, 58);
  const ax = W / 2, ay = 140, ar = 56;
  try {
    const img = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax, ay, ar, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, ax - ar, ay - ar, ar * 2, ar * 2);
    ctx.restore();
  } catch {
    ctx.beginPath();
    ctx.arc(ax, ay, ar, 0, Math.PI * 2);
    ctx.fillStyle = '#333333';
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(String(name).slice(0, 24), W / 2, 220);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#bbbbbb';
  ctx.fillText(`Hưởng dương ${age} tuổi`, W / 2, 248);
  ctx.fillStyle = '#ff8888';
  wrapTextCenter(ctx, `Nguyên nhân: ${reason}`, W / 2, 274, W - 60, 20);
  const out = path.join('/tmp/opencode', `rip_${Date.now()}.png`);
  if (!fs.existsSync('/tmp/opencode')) fs.mkdirSync('/tmp/opencode', { recursive: true });
  await fs.promises.writeFile(out, canvas.toBuffer('image/png'));
  return out;
}
function wrapTextCenter(ctx, text, x, y, maxW, lineH) {
  const words = String(text).split(' ');
  let line = '', cy = y;
  const prev = ctx.textAlign;
  ctx.textAlign = 'center';
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, cy);
      line = word + ' ';
      cy += lineH;
    } else line = test;
  }
  if (line) ctx.fillText(line.trim(), x, cy);
  ctx.textAlign = prev;
}

// ---- Target: mention > reply > tu minh ----
async function resolveTarget(message) {
  const m = message.mentions.users.first();
  if (m && !m.bot) return { user: m, isSelf: m.id === message.author.id };
  if (message.reference?.messageId) {
    try {
      const ref = await message.channel.messages.fetch(message.reference.messageId);
      if (ref?.author && !ref.author.bot) return { user: ref.author, isSelf: ref.author.id === message.author.id };
    } catch {}
  }
  return { user: message.author, isSelf: true };
}
function targetName(u) { return u.globalName || u.username; }
function avatarUrl(u) { return u.displayAvatarURL({ extension: 'png', size: 256 }); }

// % theo ngay (giong ban goc: gay dung seed, con lai random luu file)
function getPercent(store, userId, seeded) {
  const t = today();
  const d = loadData(store);
  if (d[userId]?.date === t) return { pct: d[userId].percentage, forced: true };
  const pct = seeded ? dailySeed(userId + t) % 101 : Math.floor(Math.random() * 101);
  return { pct, forced: false };
}
function savePercent(store, userId, pct) {
  const d = loadData(store);
  d[userId] = { percentage: pct, date: today() };
  saveData(store, d);
}

const THEMES = {
  gay:     { title: '#ff44ff', ring: [[0, '#ff0000'], [0.5, '#00ee00'], [1, '#8800ff']], bar: [[0, '#ff2222'], [0.5, '#ff2299'], [1, '#ff00ff']] },
  deptrai: { title: '#fdcb6e', ring: [[0, '#fdcb6e'], [1, '#e17055']], bar: [[0, '#fdcb6e'], [1, '#e17055']] },
  uytin:   { title: '#00b894', ring: [[0, '#00b894'], [1, '#0984e3']], bar: [[0, '#00b894'], [1, '#0984e3']] },
  tay:     { title: '#e17055', ring: [[0, '#636e72'], [1, '#2d3436']], bar: [[0, '#e17055'], [1, '#6c5ce7']] },
  haihuoc: { title: '#f7b731', ring: [[0, '#f7b731'], [1, '#fc5c65']], bar: [[0, '#f7b731'], [1, '#fc5c65']] },
};

function tierOf(tiers, pct) {
  return tiers.find((c) => pct <= (c.max ?? Infinity)) ?? tiers[tiers.length - 1];
}

async function sendCheckImage(message, imgOpts, caption) {
  const imgPath = await drawCheckImage(imgOpts);
  try {
    const att = new AttachmentBuilder(imgPath, { name: 'check.png' });
    await message.reply({ content: caption, files: [att] });
  } finally {
    try { fs.unlinkSync(imgPath); } catch {}
  }
}

const COMMANDS = ['gay', 'deptrai', 'dep', 'uytin', 'tay', 'danhphan', 'dp2', 'haihuoc', 'hh', 'rip', 'dam', 'dâm', 'les'];
const isTrollCommand = (cmd) => COMMANDS.includes(cmd);

async function handleTrollCommand(message, cmd, args, prefix, ctx) {
  const isQtv = ctx?.isQtv || (() => false);

  if (cmd === 'gay') {
    // ,gay [@user|reply] | ,gay set <0-500+> [@user]
    let setPct = null, target = null;
    const setIdx = args.findIndex((a) => a.toLowerCase() === 'set');
    if (setIdx !== -1) {
      if (!isQtv(message.author.id)) return message.reply('Chỉ quản trị viên cấp cao mới có thể set %.');
      setPct = parseInt(args[setIdx + 1]);
      if (isNaN(setPct) || setPct < 0) return message.reply(`Sai cú pháp. Dùng: \`${prefix}gay set <số> @user\``);
      target = (await resolveTarget(message)).user;
      savePercent('gay', target.id, setPct);
      await message.reply(`✅ Đã set % thành ${setPct}% — đo luôn nè:`);
    }
    if (!target) target = (await resolveTarget(message)).user;
    const { pct } = setPct !== null ? { pct: setPct } : (() => {
      const d = loadData('gay');
      if (d[target.id]?.date === today()) return { pct: d[target.id].percentage };
      return { pct: dailySeed(target.id + today()) % 101 };
    })();
    const tier = tierOf(GAY_TIERS, pct);
    const comment = pick(tier.texts, dailySeed(target.id + 'cmt' + tier.max));
    const gender = GAY_GENDERS[dailySeed(target.id + 'gender') % GAY_GENDERS.length];
    await sendCheckImage(message, {
      name: targetName(target), avatarUrl: avatarUrl(target),
      title: 'CHECK ĐỘ GAY', label: `Mức độ Gay (${gender.label} ${gender.emoji})`,
      percent: pct, comment, theme: THEMES.gay,
    }, null);
    return true;
  }

  if (cmd === 'deptrai' || cmd === 'dep') {
    const setIdx = args.findIndex((a) => a.toLowerCase() === 'set');
    if (setIdx !== -1) {
      if (!isQtv(message.author.id)) return message.reply('Chỉ quản trị viên cấp cao mới có thể set %.');
      const setPct = parseInt(args[setIdx + 1]);
      if (isNaN(setPct) || setPct < 0 || setPct > 100) return message.reply(`Sai cú pháp. Dùng: \`${prefix}deptrai set <0-100> @user\``);
      const target = (await resolveTarget(message)).user;
      savePercent('deptrai', target.id, setPct);
      return message.reply(`✅ Đã set % thành ${setPct}%`);
    }
    const target = (await resolveTarget(message)).user;
    const { pct, forced } = getPercent('deptrai', target.id, false);
    if (!forced) savePercent('deptrai', target.id, pct);
    const male = dailySeed(target.id + 'boy') % 2 === 0;
    await sendCheckImage(message, {
      name: targetName(target), avatarUrl: avatarUrl(target),
      title: male ? 'CHECK ĐỘ ĐẸP TRAI ♂️' : 'CHECK ĐỘ ĐẸP GÁI ♀️',
      label: male ? 'Độ đẹp trai' : 'Độ đẹp gái',
      percent: pct, comment: deptraiRemark(pct, male), theme: THEMES.deptrai,
    }, null);
    return true;
  }

  if (cmd === 'uytin') {
    const setIdx = args.findIndex((a) => a.toLowerCase() === 'set');
    if (setIdx !== -1) {
      if (!isQtv(message.author.id)) return message.reply('Chỉ quản trị viên cấp cao mới có thể set %.');
      const setPct = parseInt(args[setIdx + 1]);
      if (isNaN(setPct) || setPct < 0) return message.reply(`Sai cú pháp. Dùng: \`${prefix}uytin set <số> @user\``);
      const target = (await resolveTarget(message)).user;
      savePercent('uytin', target.id, setPct);
      await message.reply(`✅ Đã set % thành ${setPct}% — đo luôn nè:`);
      return handleUytinMeasure(message, target, setPct);
    }
    const target = (await resolveTarget(message)).user;
    const { pct, forced } = getPercent('uytin', target.id, false);
    if (!forced) savePercent('uytin', target.id, pct);
    return handleUytinMeasure(message, target, pct);
  }

  if (cmd === 'tay') {
    const target = (await resolveTarget(message)).user;
    const { pct, forced } = getPercent('tay', target.id, true);
    if (!forced) savePercent('tay', target.id, pct);
    const tier = tierOf(TAY_TIERS, pct);
    await sendCheckImage(message, {
      name: targetName(target), avatarUrl: avatarUrl(target),
      title: `CHECK ĐỘ TÀY — ${tier.rank}`, label: 'Độ tày',
      percent: pct, comment: pick(tier.texts, dailySeed(target.id + 'tay') % tier.texts.length), theme: THEMES.tay,
    }, null);
    return true;
  }

  if (cmd === 'danhphan' || cmd === 'dp2') {
    const target = (await resolveTarget(message)).user;
    const item = DANHPHAN_LIST[dailySeed(target.id + today()) % DANHPHAN_LIST.length];
    const embed = new EmbedBuilder()
      .setColor(item.color)
      .setTitle(`${item.emoji} Danh phận hôm nay: ${item.title}`)
      .setDescription(`**${targetName(target)}** — ${item.remark}`)
      .setThumbnail(avatarUrl(target));
    await message.reply({ embeds: [embed] });
    return true;
  }

  if (cmd === 'haihuoc' || cmd === 'hh') {
    const target = (await resolveTarget(message)).user;
    const pct = dailySeed(target.id + today()) % 101;
    const tier = tierOf(HAIHUOC_TIERS, pct);
    await sendCheckImage(message, {
      name: targetName(target), avatarUrl: avatarUrl(target),
      title: `CHECK ĐỘ HÀI HƯỚC — ${tier.rank}`, label: 'Độ hài hước',
      percent: pct, comment: tier.comment, theme: THEMES.haihuoc,
    }, null);
    return true;
  }

  if (cmd === 'rip') {
    const target = (await resolveTarget(message)).user;
    const age = Math.floor(Math.random() * 80) + 1;
    const reason = RIP_REASONS[Math.floor(Math.random() * RIP_REASONS.length)];
    const imgPath = await drawRipImage({
      name: targetName(target), avatarUrl: avatarUrl(target), age, reason,
    });
    try {
      const att = new AttachmentBuilder(imgPath, { name: 'rip.png' });
      await message.reply({ files: [att] });
    } finally {
      try { fs.unlinkSync(imgPath); } catch {}
    }
    return true;
  }

  if (cmd === 'dam' || cmd === 'dâm') {
    const target = message.mentions.users.first();
    if (!target) return message.reply(`❌ Tag người cần check! VD: \`${prefix}dam @bạn\``);
    const pct = Math.floor(Math.random() * 101);
    return message.reply(`🔞 **${targetName(target)}** có độ dâm là **${pct}%**! 🔞`);
  }

  if (cmd === 'les') {
    const target = message.mentions.users.first();
    if (!target) return message.reply(`❌ Tag người cần check! VD: \`${prefix}les @bạn\``);
    const pct = Math.floor(Math.random() * 101);
    return message.reply(`🏳️‍🌈 **${targetName(target)}** có độ les là **${pct}%**! 🏳️‍🌈`);
  }

  return false;
}

async function handleUytinMeasure(message, target, pct) {
  const tier = tierOf(UYTIN_TIERS, pct);
  await sendCheckImage(message, {
    name: targetName(target), avatarUrl: avatarUrl(target),
    title: `CHECK UY TÍN — ${tier.rank}`, label: 'Độ uy tín',
    percent: pct, comment: pick(tier.texts, dailySeed(target.id + 'uytin') % tier.texts.length), theme: THEMES.uytin,
  }, null);
  return true;
}

module.exports = { isTrollCommand, handleTrollCommand, COMMANDS };
