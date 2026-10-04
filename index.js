const { Client, GatewayIntentBits, EmbedBuilder, Routes, Partials } = require('discord.js');

const sc = require('./soundcloud-api');
const nct = require('./nhaccuatui-api');
const troll = require('./troll');
const aichat = require('./aichat');
const aliasMod = require('./alias');
const axios = require('axios');
const tuluyen = require('./tuluyen/index.cjs');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config();

const DATA_FILE = './data.json';

let data;
if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    console.error('[DATA] File data.json bị lỗi, khởi tạo lại dữ liệu mặc định');
    data = { prefix: ',', setupDone: false, qtv: [], users: {} };
    saveData();
  }
  if (!data.users) data.users = {};
  if (!data.qtv) data.qtv = [];
} else {
  data = { prefix: ',', setupDone: false, qtv: [], users: {} };
  saveData();
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const searches = new Map();

function isQtv(userId) {
  return data.qtv.includes(userId);
}

// Danh sach lenh goc (de validate ,alias add) — dong bo voi cac module + core
const KNOWN_COMMANDS = [
  'setup', 'set', 'add', 'remove', 'listadmin', 'list-qtv', 'admin',
  'prefix', 'music', 'soundcloud', 'sc', 'nhaccuatui', 'nct',
  'cmd', 'help', 'commands', 'del', 'restart', 'alias',
  'tu', 'tu-luyen', 'tl', 'dp', 'tt', 'thong-tin', 'bxh', 'bang-xep-hang',
  'shop', 'pk', 'mua', 'dung', 'su-kien', 'tham-hiem', 'explore',
  'be-quan', 'bq', 'seclude',
  ...troll.COMMANDS,
  ...aichat.COMMANDS,
];

function parseCommand(content, prefix) {
  if (!content.startsWith(prefix)) return null;
  const withoutPrefix = content.slice(prefix.length).trim();
  const parts = withoutPrefix.split(/ +/);
  const cmd = parts.shift().toLowerCase();
  return { cmd, args: parts };
}

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const prefix = data.prefix;

  if (message.mentions.has(client.user) && (message.content.trim() === `<@${client.user.id}>` || message.content.trim() === `<@!${client.user.id}>`)) {
    return message.reply(`👋 Prefix hiện tại: \`${prefix}\` — Gõ \`${prefix}help\` để xem danh sách lệnh.`);
  }

  if (message.content.trim().toLowerCase() === 'prefix') {
    return message.reply(`Prefix hiện tại: \`${prefix}\``);
  }

  const repliedSearch = searches.get(message.author.id);
  if (message.reference && message.reference.messageId && repliedSearch) {
    if (message.reference.messageId === repliedSearch.messageId) {
      const num = parseInt(message.content);
      if (num >= 1 && num <= repliedSearch.tracks.length) {
        const track = repliedSearch.tracks[num - 1];
        const platform = repliedSearch.platform || 'soundcloud';
        searches.delete(message.author.id);

        const statusMsg = await message.reply('Đang tải nhạc...');
        const tmpDir = '/tmp/opencode';
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const safeId = String(track.id ?? track.key ?? Date.now()).replace(/[^a-zA-Z0-9_-]/g, '_');
        const tmpMp3 = path.join(tmpDir, `track_${platform}_${safeId}.mp3`);
        const tmpOgg = path.join(tmpDir, `track_${platform}_${safeId}.ogg`);

        try {
          if (platform === 'nhaccuatui') {
            if (!track.streamUrl) throw new Error('Bài này không có stream (có thể VIP), chọn bài khác!');
            const dl = await axios.get(track.streamUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.nhaccuatui.com/' },
              responseType: 'stream',
              timeout: 120000,
              maxRedirects: 5,
            });
            await new Promise((resolve, reject) => {
              const w = fs.createWriteStream(tmpMp3);
              dl.data.pipe(w);
              w.on('finish', resolve);
              w.on('error', reject);
            });
          } else {
            await sc.downloadTrack(track.permalink_url, tmpMp3);
          }
          await statusMsg.edit('Đang chuyển đổi...');

          await new Promise((resolve, reject) => {
            const ff = spawn(require('ffmpeg-static'), [
              '-i', tmpMp3,
              '-c:a', 'libopus',
              '-b:a', '64k',
              '-ar', '48000',
              '-ac', '1',
              '-f', 'ogg',
              tmpOgg,
            ]);
            ff.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exit code ${code}`)));
            ff.on('error', reject);
          });

          await statusMsg.edit('Đang tải lên...');
          const oggBuf = fs.readFileSync(tmpOgg);

          const isNct = platform === 'nhaccuatui';
          await message.channel.client.rest.post(Routes.channelMessages(message.channel.id), {
            body: {
              attachments: [{ id: 0, filename: isNct ? 'nhaccuatui.ogg' : 'soundcloud.ogg', is_voice_message: true }],
            },
            files: [{ data: oggBuf, name: isNct ? 'nhaccuatui.ogg' : 'soundcloud.ogg', contentType: 'audio/ogg' }],
          });

          if (isNct) {
            const embed = new EmbedBuilder()
              .setColor(0x1DB954)
              .setTitle('Đã gửi voice message')
              .setDescription(`[${track.title}](${track.songLink}) — ${track.artistsNames}`)
              .setFooter({ text: `NhacCuaTui${track.isHD ? ' • HD' : ''}${track.isOfficial ? ' • Official' : ''}` });
            if (track.thumbnail) embed.setThumbnail(track.thumbnail);
            await statusMsg.edit({ content: '', embeds: [embed] });
          } else {
            const info = sc.extractTrackInfo(track);
            const embed = new EmbedBuilder()
              .setColor(0xFF5500)
              .setTitle('Đã gửi voice message')
              .setDescription(`[${info.title}](${info.permalinkUrl}) — ${info.username}`)
              .setFooter({ text: `SoundCloud • ${info.duration}` });
            if (info.artworkUrl) embed.setThumbnail(info.artworkUrl);
            await statusMsg.edit({ content: '', embeds: [embed] });
          }
        } catch (err) {
          await statusMsg.edit(`Lỗi: ${err.message}`);
        } finally {
          try { fs.unlinkSync(tmpMp3); } catch {}
          try { fs.unlinkSync(tmpOgg); } catch {}
        }
        return;
      }
    }
  }

  if ((message.content || '').trim() === prefix) {
    try { await tuluyen.handlePrefixSpam(message); } catch {}
  }

  const parsed = parseCommand(message.content, prefix);
  if (!parsed) return;

  let { cmd } = parsed;
  const args = parsed.args;

  // Alias tuy bien (,alias add/del/list) — giai truoc khi dispatch
  if (aliasMod.isAliasCommand(cmd)) {
    try {
      const handled = await aliasMod.handleAliasCommand(message, args, prefix, {
        isQtv: (id) => isQtv(id),
        knownCommands: KNOWN_COMMANDS,
      });
      if (handled) return;
    } catch (e) {
      console.error('[ALIAS]', e.message);
    }
    return;
  }
  const aliased = aliasMod.resolveAlias(cmd);
  if (aliased) cmd = aliased;

  if (!cmd) {
    return message.reply(`nếu mày thắc mắc tao có những lệnh gì thì hãy ${prefix}help`);
  }

  if ((cmd === 'set' && args[0] && args[0].toLowerCase() === 'up') || cmd === 'setup') {
    if (data.setupDone) {
      return message.reply('Setup đã được thực hiện rồi! Chỉ có qtv mới có thể dùng lệnh quản trị.');
    }
    data.setupDone = true;
    data.qtv.push(message.author.id);
    data.sangThe = message.author.id;
    saveData();
    return message.reply('Bạn đã trở thành **đấng sáng thế**! Toàn quyền bot.');
  }

  if (cmd === 'add' && args[0] && args[0].toLowerCase() === 'qtv') {
    if (!isQtv(message.author.id)) {
      return message.reply('Bạn hong có quyền!');
    }
    const target = message.mentions.users.first();
    if (!target) return message.reply('Tag người cần add!');
    if (data.qtv.includes(target.id)) return message.reply('Người này đã là qtv rồi!');
    data.qtv.push(target.id);
    saveData();
    return message.reply(`Đã thêm **${target.tag}** làm qtv.`);
  }

  if (cmd === 'remove' && args[0] && args[0].toLowerCase() === 'qtv') {
    if (!isQtv(message.author.id)) {
      return message.reply('Bạn hong có quyền!');
    }
    const target = message.mentions.users.first();
    if (!target) return message.reply('Tag người cần xóa!');
    if (!data.qtv.includes(target.id)) return message.reply('Người này không phải qtv!');
    if (target.id === message.author.id) return message.reply('Không thể tự xóa chính mình!');
    data.qtv = data.qtv.filter((id) => id !== target.id);
    saveData();
    return message.reply(`Đã xóa **${target.tag}** khỏi qtv.`);
  }

  if (['listadmin', 'list-qtv', 'admin'].includes(cmd)) {
    if (!isQtv(message.author.id)) {
      return message.reply('Bạn hong có quyền!');
    }
    if (data.qtv.length === 0) return message.reply('Chưa có admin nào!');
    const lines = await Promise.all(data.qtv.map(async (id) => {
      try {
        const user = await client.users.fetch(id);
        return `• **${user.tag}** ${id === data.qtv[0] ? '👑 Đấng Sáng Thế' : '🛡️ QTV'}`;
      } catch {
        return `• \`${id}\` (không tìm thấy)`;
      }
    }));
    const embed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setTitle('📋 Danh Sách Quản Trị')
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Tổng: ${data.qtv.length} người` });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === 'prefix') {
    if (!args[0]) return message.reply(`Prefix hiện tại: \`${prefix}\``);
    if (!isQtv(message.author.id)) return message.reply('Bạn hong có quyền!');
    let newPrefix = args[0] === 'change' ? args[1] : args[0];
    if (!newPrefix) return message.reply('Nhập prefix mới! VD: `,prefix +`');
    if (newPrefix.startsWith('+')) newPrefix = newPrefix.slice(1);
    if (!newPrefix) return message.reply('Prefix không hợp lệ!');
    data.prefix = newPrefix;
    saveData();
    return message.reply(`Đã đổi prefix thành \`${newPrefix}\``);
  }

  if (['music', 'soundcloud', 'sc'].includes(cmd)) {
    const query = args.join(' ');
    if (!query) return message.reply(`Nhập tên bài hát! VD: \`${prefix}soundcloud Sơn Tùng\``);

    const statusMsg = await message.reply('Đang tìm trên SoundCloud...');

    try {
      const results = await sc.searchTracks(query, 10);

      if (!results || results.length === 0) {
        return statusMsg.edit('Không tìm thấy kết quả!');
      }

      const desc = results
        .map((t, i) => {
          const dur = t.duration ? sc.formatDuration(t.duration) : '?:??';
          return `**${i + 1}.** ${t.title} - ${t.user?.username || 'Unknown'} [${dur}]`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0xFF5500)
        .setTitle('Kết quả SoundCloud')
        .setDescription(desc)
        .setFooter({ text: 'Reply số 1-10 để chọn bài' });

      const sent = await statusMsg.edit({ content: '', embeds: [embed] });

      searches.set(message.author.id, {
        platform: 'soundcloud',
        tracks: results,
        messageId: sent.id,
      });
    } catch (err) {
      statusMsg.edit(`Lỗi: ${err.message}`);
    }
    return;
  }

  if (['nhaccuatui', 'nct'].includes(cmd)) {
    const query = args.join(' ');
    if (!query) return message.reply(`Nhập tên bài hát! VD: \`${prefix}nhaccuatui Waiting For You\``);

    const statusMsg = await message.reply('Đang tìm trên NhacCuaTui...');

    try {
      const results = await nct.searchSongs(query, 10);

      if (!results || results.length === 0) {
        return statusMsg.edit('Không tìm thấy kết quả!');
      }

      const desc = results
        .map((t, i) => {
          const dur = nct.formatDuration(t.duration);
          const tag = [t.isOfficial ? 'Official' : null, t.isHD ? 'HD' : null].filter(Boolean).join(' • ');
          return `**${i + 1}.** ${t.title} - ${t.artistsNames} [${dur}]${tag ? ` (${tag})` : ''}`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0x1DB954)
        .setTitle('Kết quả NhacCuaTui')
        .setDescription(desc)
        .setFooter({ text: 'Reply số 1-10 để chọn bài' });

      const sent = await statusMsg.edit({ content: '', embeds: [embed] });

      searches.set(message.author.id, {
        platform: 'nhaccuatui',
        tracks: results,
        messageId: sent.id,
      });
    } catch (err) {
      statusMsg.edit(`Lỗi: ${err.message}`);
    }
    return;
  }

  if (['cmd', 'help', 'commands'].includes(cmd)) {
    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle(`📋 Danh Sách Lệnh — Prefix: \`${prefix}\``)
      .addFields(
        { name: '📌 Tu tiên — Cơ bản', value:
          `\`${prefix}tl\` — Xem hồ sơ (ảnh)\n` +
          `\`${prefix}tl status\` — Chỉ số chi tiết\n` +
          `\`${prefix}tl top\` / \`${prefix}tl toplt\` — BXH tu vi / Linh Thạch\n` +
          `\`${prefix}tl bag\` — Túi đồ\n` +
          `\`${prefix}tl daily\` — Điểm danh hằng ngày\n` +
          `\`${prefix}dp\` — Đột phá cảnh giới` },
        { name: '🧘 Bế quan & Bí cảnh', value:
          `\`${prefix}tl start\` — Bắt đầu bế quan (tối đa 60p)\n` +
          `\`${prefix}tl stop\` — Thu hoạch EXP\n` +
          `\`${prefix}tl beguan\` — Trạng thái bế quan\n` +
          `\`${prefix}tl go\` — Vào bí cảnh • \`${prefix}tl v\` — Rời ra\n` +
          `\`${prefix}tl bc <số>\` — Chọn bí cảnh` },
        { name: '⚔️ Chiến đấu', value:
          `\`${prefix}tl pk @user\` — Thách đấu • \`${prefix}tl pk ok\` — Chấp nhận\n` +
          `\`${prefix}tl train\` — Đánh boss cùng cảnh giới\n` +
          `\`${prefix}tl thap challenge/auto\` — Thiên Tầng Tháp\n` +
          `\`${prefix}tl phaptac\` — Pháp tắc (từ cảnh 30)\n` +
          `\`${prefix}tl tubao\` — Tú bảo • \`${prefix}tl phithang\` — Phi thăng` },
        { name: '🛒 Trang bị & Luyện đan', value:
          `\`${prefix}tl shop vukhi/giap/ky-nang\` — Cửa hàng\n` +
          `\`${prefix}tl buy <mã> [sl]\` — Mua • \`${prefix}tl equip <mã>\` — Trang bị\n` +
          `\`${prefix}tl use <ID> [sl]\` — Dùng đan\n` +
          `\`${prefix}tl luyendan\` — Luyện đan\n` +
          `\`${prefix}tl wiki <thechat|huyetmach|linhcan|thienphu|giap>\` — Tra cứu` },
        { name: '💰 Kinh tế', value:
          `\`${prefix}tl bank <nap/rut/chuyen> @user <số>\` — Ngân hàng LT\n` +
          `\`${prefix}tl donate\` — Cơ duyên nạp tiền\n` +
          `\`${prefix}tl tracuu <mã>\` — Tra cứu vật phẩm\n` +
          `\`${prefix}tl nhapdao/nhapma/nhapnho...\` — Nhập môn` },
        { name: '🔐 Hộ chiếu (nhắn RIÊNG cho bot)', value:
          `\`${prefix}tl dangky <tk> <mk>\` — Đăng ký (1 người/1 lần)\n` +
          `\`${prefix}tl login <tk> <mk>\` — Đăng nhập thiết bị khác` },
        { name: '🎵 Nhạc (port từ bot2)', value:
          `\`${prefix}soundcloud <tên>\` (alias: \`${prefix}music\`, \`${prefix}sc\`) — Tìm nhạc SoundCloud\n` +
          `\`${prefix}nhaccuatui <tên>\` (alias: \`${prefix}nct\`) — Tìm nhạc NhacCuaTui\n` +
          `Reply số 1-10 vào kết quả để tải voice message` },
        { name: '🤖 AI/Chat (như bot2)', value:
          `\`${prefix}gemini <hỏi>\` — Linh Lan (nhớ hội thoại, lạnh với người lạ)\n` +
          `\`${prefix}hoidap <hỏi>\` (alias \`${prefix}hd\`) — Trợ lý Hỏi Đáp\n` +
          `\`${prefix}ac <yêu cầu>\` — Gemini line dự phòng (tự xoay key+model)\n` +
          `\`${prefix}ai <hỏi>\` — AI local offline (thủ đô, khoa học, đổi đơn vị...)\n` +
          `\`${prefix}gpt <hỏi>\` • \`${prefix}ds <hỏi>\` • \`${prefix}chat <tám>\` — GPT/DeepSeek/Simsimi` },
        { name: '😂 Troll (mỗi ngày reset)', value:
          `\`${prefix}gay [@user]\` • \`${prefix}deptrai [@user]\` • \`${prefix}uytin [@user]\`\n` +
          `\`${prefix}tay [@user]\` • \`${prefix}haihuoc [@user]\` • \`${prefix}danhphan [@user]\`\n` +
          `\`${prefix}rip [@user]\` • \`${prefix}dam @user\` • \`${prefix}les @user\`\n` +
          `Tag/reply ai thì check người đó, không thì tự check • QTV: \`<lệnh> set <số> @user\`` },
        { name: '🛡️ Quản trị', value:
          `\`${prefix}setup\` — Set đấng sáng thế (1 lần duy nhất)\n` +
          `\`${prefix}add qtv @user\` / \`${prefix}remove qtv @user\` — QTV cấp cao\n` +
          `\`${prefix}alias add <tên> <lệnh>\` / \`${prefix}alias del <tên>\` / \`${prefix}alias list\` — Alias riêng\n` +
          `\`${prefix}listadmin\` — DS admin • \`${prefix}restart\` • \`${prefix}prefix <new>\`\n` +
          `**QTV:** \`${prefix}tl set +stt @user <số>\` • \`${prefix}tl update <nội dung>\` • \`${prefix}tl check buff|bank @user\`\n` +
          `**Đấng sáng thế:** thêm \`${prefix}tl banacc/unban @user\` • \`${prefix}tl thap reset\`` },
      )
      .setFooter({ text: `${prefix}tl help — hướng dẫn đầy đủ kèm mẹo tu luyện` });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === 'del') {
    if (!isQtv(message.author.id)) return message.reply('Bạn hong có quyền!');
    if (!message.reference || !message.reference.messageId) return message.reply('Reply vào tin nhắn cần xóa!');
    try {
      const target = await message.channel.messages.fetch(message.reference.messageId);
      await target.delete();
    } catch {
      return message.reply('Không thể xóa tin nhắn này!');
    }
  }

  if (cmd === 'restart') {
    if (!isQtv(message.author.id)) return message.reply('Bạn hong có quyền!');
    await message.reply(`🔄 **${message.author.username}** đã yêu cầu khởi động lại bot!\n⏳ Bot sẽ restart trong **30 giây**...`);
    console.log(`[RESTART] Yêu cầu bởi ${message.author.tag} (${message.author.id})`);
    setTimeout(() => {
      const child = spawn(process.argv[0], process.argv.slice(1), {
        cwd: process.cwd(),
        stdio: 'inherit',
        detached: true,
      });
      child.unref();
      process.exit(0);
    }, 30000);
    return;
  }

  // === TROLL (port tu bot2) ===
  if (troll.isTrollCommand(cmd)) {
    try {
      const handled = await troll.handleTrollCommand(message, cmd, args, prefix, { isQtv: (id) => isQtv(id) });
      if (handled) return;
    } catch (e) {
      console.error('[TROLL]', e.message);
    }
  }

  // === AI/CHAT (port tu bot2) ===
  if (aichat.isAiCommand(cmd)) {
    try {
      const handled = await aichat.handleAiCommand(message, cmd, args, prefix, { isOwner: (id) => isQtv(id) });
      if (handled) return;
    } catch (e) {
      console.error('[AICHAT]', e.message);
    }
  }

  // === TU TIEN (ported tu-luyen tu bot2) ===

  if (tuluyen.isGameCommand(cmd)) {
    const handled = await tuluyen.handleCommand(message, cmd, args, prefix);
    if (handled) return;
  }

});

client.on('error', (err) => {
  console.error('[CLIENT ERROR]', err);
});

client.once('ready', () => {
  console.log(`Bot ${client.user.tag} đã online!`);
  console.log(`Prefix hiện tại: ${data.prefix}`);
  console.log(`Setup: ${data.setupDone ? 'Đã setup' : 'Chưa setup'}`);
  console.log(`Số qtv: ${data.qtv.length}`);
  tuluyen.init(client, {
    getPrefix: () => data.prefix,
    getAdmins: () => data.qtv.map(String),
    getSangThe: () => (data.sangThe ? [String(data.sangThe)] : data.qtv.length ? [String(data.qtv[0])] : []),
  });
});

client.login(process.env.TOKEN);

// === Render Web Service keep-alive: bind $PORT de qua port scan ===
const http = require('http');
const RENDER_PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running');
}).listen(RENDER_PORT, () => {
  console.log(`[WEB] Listening on port ${RENDER_PORT} (Render port scan)`);
});
