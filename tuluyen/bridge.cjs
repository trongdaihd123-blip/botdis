const { AttachmentBuilder } = require('discord.js');

const REACTION_MAP = { GEM: '💎', HEART: '❤️', LIKE: '👍', LOVE: '😍', SAD: '😢', ANGRY: '😡' };
const MAX_LEN = 1900;

function chunkText(text) {
  const s = String(text ?? '');
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

function parseMentions(content, discordMsg) {
  const mentions = [];
  const re = /<@!?(\d+)>/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const user = discordMsg.mentions?.users?.get(m[1]);
    mentions.push({
      pos: m.index,
      uid: m[1],
      len: m[0].length,
      dName: user ? (user.globalName || user.username) : null,
    });
  }
  return mentions;
}

function toZaloMessage(discordMsg) {
  const isDM = !discordMsg.guild;
  return {
    threadId: discordMsg.channel.id,
    type: isDM ? 'UserMessage' : 'GroupMessage',
    _raw: discordMsg,
    data: {
      uidFrom: discordMsg.author.id,
      content: discordMsg.content || '',
      dName: discordMsg.member?.displayName || discordMsg.author.globalName || discordMsg.author.username,
      mentions: parseMentions(discordMsg.content || '', discordMsg),
    },
  };
}

function createZaloApi(client) {
  async function resolveChannel(threadId, quoteMsg) {
    if ((!threadId || threadId === 'undefined') && quoteMsg?._raw) return quoteMsg._raw.channel;
    try {
      return client.channels.cache.get(threadId) || (await client.channels.fetch(threadId));
    } catch {
      if (quoteMsg?._raw) return quoteMsg._raw.channel;
      throw new Error(`Không tìm thấy channel ${threadId}`);
    }
  }

  async function sendOne(channel, { msg, attachments }, replyTo) {
    const opts = {};
    if (msg) opts.content = msg;
    if (attachments?.length) opts.files = attachments.map((p) => new AttachmentBuilder(p));
    if (replyTo) opts.messageReference = { message: replyTo.id, channel: replyTo.channel.id };
    return channel.send(opts);
  }

  async function sendMessage(payload, threadId, threadType) {
    void threadType;
    const isObj = payload && typeof payload === 'object';
    const msgText = typeof payload === 'string' ? payload : String(payload?.msg ?? '');
    const attachments = Array.isArray(isObj ? payload.attachments : undefined)
      ? payload.attachments.filter(Boolean) : [];
    const quote = isObj ? payload.quote : undefined;

    const channel = await resolveChannel(threadId, quote);
    const replyTo = quote?._raw || null;

    let last;
    const chunks = msgText ? chunkText(msgText) : [];
    for (let i = 0; i < chunks.length; i++) {
      last = await sendOne(channel, { msg: chunks[i] }, i === 0 ? replyTo : null);
    }
    if (attachments.length) {
      last = await sendOne(channel, { msg: '', attachments }, last ? null : replyTo);
    }
    return last;
  }

  async function getUserInfo(uidOrUids) {
    const uids = Array.isArray(uidOrUids) ? uidOrUids : [uidOrUids];
    const changed_profiles = {};
    await Promise.all(uids.map(async (uid) => {
      try {
        const u = await client.users.fetch(String(uid));
        changed_profiles[String(uid)] = {
          zaloName: u.globalName || u.username,
          name: u.username,
          avatar: u.displayAvatarURL({ extension: 'png', size: 256 }),
        };
      } catch {}
    }));
    return { changed_profiles, unchanged_profiles: {} };
  }

  async function addReaction(reaction, message) {
    const emoji = REACTION_MAP[String(reaction).toUpperCase()] || reaction;
    const target = message?._raw;
    if (!target || !emoji) return;
    await target.react(emoji);
  }

  async function deleteMessage(message) {
    await message._raw.delete();
  }

  return { sendMessage, getUserInfo, addReaction, deleteMessage };
}

module.exports = { toZaloMessage, createZaloApi, chunkText, parseMentions };
