import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import schedule from "node-schedule";
import { MessageType, getGlobalPrefix, clearImagePath, removeMention, isAdmin, isSangThe, managerData } from "./shims.mjs";
import { generateProfileCard } from "./profileImage.mjs";
import { generateProfileCard as generateProfileCardNew } from "./profileImageNew.mjs";
import { generateProfileCardBlue } from "./profileImageVortex.mjs";
import { generateTopRanking } from "./profileImage.mjs";
import { generateDonateImage } from "./donateImage.mjs";
import { generateMinigameBoxes } from "./minigameImage.mjs";
import {
  REALMS, MA_REALMS, NHO_REALMS, YEU_REALMS, LO_REALMS, QUY_REALMS, PHAT_REALMS, WEAPONS, OLD_WEAPONS, ARMORS, POTIONS, CONGPHA, SPECIAL_ITEMS, TOKEN_ITEMS, PHAP_BAO, TITLES, THECHAT, HUYETMACH, LINH_CAN, TALENTS, SECRET_REALMS, MATERIALS, RECIPES, DONATE_MILESTONES, DONATE_COMBOS, PRIME, getPrimeLevel,
  MAX_MAJOR_REALM, MAX_MINOR_REALM, getMaxMajorRealm,
  PK_REWARD_WINNER, PK_REWARD_POINTS, TAX_RATE,
  PHAPTAC_REQUIRED_REALM, PHAPTAC_MAX_LEVEL, PHAPTAC_PATHS, getPhapTacEffects, getPhapTacUpgradeCost, getPhapTacRealmRequired, describePhapTacEff,
  rollTalent, rollTheChat, rollHuyetMach, rollLinhCan, getRealmList, getRealmDisplay, getRealmDisplayFull, getMaxExp, getRealmExpBase,
  rollBreakthrough, formatNumber, formatBig, calcStats, checkAutoTitles, checkTop3Title, getRealmByIndex,
} from "./constants.mjs";

const TL_DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets/json-data");
const DATA_PATH = path.join(TL_DATA_DIR, "data-tu-luyen.json");
let dataCache = null;
let lastDataMtime = 0;
let lastUpdatesMtime = 0;
let lastAdminLogsMtime = 0;
let lastBankLogsMtime = 0;

function statMs(p) {
  try { return fs.statSync(p).mtimeMs; } catch { return 0; }
}

function atomicWriteJson(filePath, obj) {
  let real = filePath;
  try { real = fs.realpathSync(filePath); } catch {}
  const tmp = real + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, real);
  return statMs(real);
}

function syncExternalFiles() {
  const m1 = statMs(DATA_PATH);
  if (m1 && m1 !== lastDataMtime) {
    try {
      const fresh = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
      if (fresh && typeof fresh === "object") {
        dataCache = fresh;
        if (!dataCache.players) dataCache.players = {};
        if (!dataCache.accounts) dataCache.accounts = {};
        if (!dataCache.sessions) dataCache.sessions = {};
      }
    } catch {}
    lastDataMtime = m1;
  }
  const m2 = statMs(UPDATES_PATH);
  if (m2 && m2 !== lastUpdatesMtime) {
    try {
      const fresh = JSON.parse(fs.readFileSync(UPDATES_PATH, "utf8"));
      if (fresh && typeof fresh === "object") updatesCache = fresh;
    } catch {}
    lastUpdatesMtime = m2;
  }
  const m3 = statMs(ADMIN_LOGS_PATH);
  if (m3 && m3 !== lastAdminLogsMtime) {
    try {
      const fresh = JSON.parse(fs.readFileSync(ADMIN_LOGS_PATH, "utf8"));
      if (fresh && Array.isArray(fresh.logs)) adminLogsCache = fresh;
    } catch {}
    lastAdminLogsMtime = m3;
  }
  const m4 = statMs(BANK_LOGS_PATH);
  if (m4 && m4 !== lastBankLogsMtime) {
    try {
      const fresh = JSON.parse(fs.readFileSync(BANK_LOGS_PATH, "utf8"));
      if (fresh && Array.isArray(fresh.logs)) bankLogsCache = fresh;
    } catch {}
    lastBankLogsMtime = m4;
  }
}

const UPDATES_PATH = path.join(TL_DATA_DIR, "data-tu-luyen-updates.json");
let updatesCache = null;

// ── SHOP ĐEN ────────────────────────────────────────────────
const SHOPDEN_RESTOCK_CRON = "*/10 * * * *";
const SHOPDEN_RESTOCK_MS = 10 * 60 * 1000;
let shopDenJob = null;

// Danh sách hàng hóa Shop Đen
// - Đan dược sẵn có: { ref: "<ID trong POTIONS>", rarity }  (giá gốc tự lấy = 80% giá shop)
// - Vũ khí custom:   { key, name, emoji, basePrice, rarity, stockRate, atk, spd, hp, def, crit }
//   stockRate (%) = tỉ lệ xuất hiện mỗi lần restock (100 = luôn luôn có)
// ── VŨ KHÍ ──
const SHOPDEN_POOL = [
  { key: "kiem_sat", name: "Kiếm Sắt", emoji: "🗡️", basePrice: 100, rarity: "common", stockRate: 100, atk: 20, spd: 10 },
  { key: "mu_cung", name: "Mộc Cung", emoji: "🏹", basePrice: 150, rarity: "common", stockRate: 50, atk: 45, crit: 2 },
  { key: "luu_tinh_tien", name: "Lưu Tinh Tiễn", emoji: "💫", basePrice: 2000, rarity: "rare", stockRate: 30, atk: 350, spd: 20, crit: 4 },
  { key: "sat_ma_chuy", name: "Sát Ma Chùy", emoji: "🔨", basePrice: 4200, rarity: "rare", stockRate: 25, atk: 900, def: 30, crit: 8 },
  { key: "loi_quang_kiem", name: "Lôi Quang Kiếm", emoji: "⚡", basePrice: 5500, rarity: "rare", stockRate: 20, atk: 1400, crit: 10 },
  { key: "bang_tinh_kiem", name: "Băng Tinh Kiếm", emoji: "❄️", basePrice: 18000, rarity: "epic", stockRate: 15, atk: 4500, spd: 40, crit: 22 },
  { key: "huyet_an_dao", name: "Huyết Ẩn Đao", emoji: "🩸", basePrice: 26000, rarity: "epic", stockRate: 10, atk: 7000, crit: 12 },
  { key: "thach_vuong_bua", name: "Thạch Vương Búa", emoji: "🪨", basePrice: 60000, rarity: "epic", stockRate: 8, atk: 11000, def: 1500, crit: 15 },
  { key: "tinh_cuong_kiem", name: "Tinh Cương Thánh Kiếm", emoji: "🌟", basePrice: 85000, rarity: "legendary", stockRate: 5, atk: 28000, spd: 80, crit: 18 },
  { key: "long_ngam_thuong", name: "Long Ngâm Thương", emoji: "🐲", basePrice: 450000, rarity: "legendary", stockRate: 3, atk: 48000, crit: 28 },
  { key: "diet_tien_kiem_manh", name: "Diệt Tiên Kiếm Mảnh", emoji: "🌑", basePrice: 250000, rarity: "legendary", stockRate: 4, atk: 100000, spd: 50, crit: 30 },
  { key: "hon_don_kiem", name: "Hỗn Độn Kiếm", emoji: "🌌", basePrice: 20000000, rarity: "mythical", stockRate: 2, atk: 1000000000, crit: 45, lifesteal: 20, dmgReduction: 10 },
  { key: "manh_vo_guong", name: "Mảnh Vỡ Gương", emoji: "🪞", basePrice: 50000000, rarity: "mythical", stockRate: 1 },

  // ── ĐAN DƯỢC ──
  { ref: "26", rarity: "common" },
  { ref: "27", rarity: "common" },
  { ref: "9",  rarity: "common" },
  { ref: "21", rarity: "rare" },
  { ref: "28", rarity: "rare" },
  { ref: "29", rarity: "rare" },
  { ref: "60", rarity: "rare" },
  { ref: "61", rarity: "rare" },
  { ref: "10", rarity: "epic" },
  { ref: "37", rarity: "epic" },
  { ref: "38", rarity: "epic" },
  { ref: "8",  rarity: "epic" },
  { ref: "35", rarity: "legendary" },
  { ref: "36", rarity: "legendary" },
  { ref: "43", rarity: "mythical" },
  { ref: "6",  rarity: "mythical" },
];

const SHOPDEN_RARITY_WEIGHT = [
  { rarity: "common", weight: 50 },
  { rarity: "rare", weight: 28 },
  { rarity: "epic", weight: 14 },
  { rarity: "legendary", weight: 6 },
  { rarity: "mythical", weight: 2 },
];

const SHOPDEN_RARITY_INFO = {
  common: { label: "Thường", emoji: "⚪" },
  rare: { label: "Hiếm", emoji: "🔵" },
  epic: { label: "Sử Thi", emoji: "🟣" },
  legendary: { label: "Huyền Thoại", emoji: "🟠" },
  mythical: { label: "Thần Thoại", emoji: "🔴" },
};

function shopDenGet() {
  const data = loadData();
  if (!data.shopDen) data.shopDen = {};
  const sd = data.shopDen;
  if (!Array.isArray(sd.shop)) sd.shop = [];
  if (typeof sd.lastRestockAt !== "number") sd.lastRestockAt = 0;
  if (typeof sd.nextRestockAt !== "number") sd.nextRestockAt = 0;
  return sd;
}

function shopDenResolveItem(entry) {
  if (entry.ref) {
    const potion = POTIONS.find(po => po.id === entry.ref);
    return {
      id: entry.ref,
      ref: entry.ref,
      name: potion ? potion.name : `Vật phẩm #${entry.ref}`,
      emoji: potion ? potion.emoji : "📦",
      basePrice: potion ? Math.max(1, Math.round(potion.price * 0.8)) : 100,
      rarity: entry.rarity || "common",
      stockRate: null,
      stats: null,
    };
  }
  const stats = (entry.atk || entry.spd || entry.hp || entry.def || entry.crit || entry.lifesteal || entry.dmgReduction)
    ? { atk: entry.atk || 0, spd: entry.spd || 0, hp: entry.hp || 0, def: entry.def || 0, crit: entry.crit || 0, lifesteal: entry.lifesteal || 0, dmgReduction: entry.dmgReduction || 0 }
    : null;
  return {
    id: entry.key,
    ref: `sd_${entry.key}`,
    name: entry.name,
    emoji: entry.emoji || "📦",
    basePrice: entry.basePrice || 100,
    rarity: entry.rarity || "common",
    stockRate: typeof entry.stockRate === "number" ? entry.stockRate : null,
    stats,
  };
}

function shopDenPickItem() {
  const totalWeight = SHOPDEN_RARITY_WEIGHT.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const { rarity, weight } of SHOPDEN_RARITY_WEIGHT) {
    if (roll < weight) {
      const pool = SHOPDEN_POOL.filter(e => e.rarity === rarity).map(shopDenResolveItem);
      return pool[Math.floor(Math.random() * pool.length)] || shopDenResolveItem(SHOPDEN_POOL[0]);
    }
    roll -= weight;
  }
  return shopDenResolveItem(SHOPDEN_POOL[Math.floor(Math.random() * SHOPDEN_POOL.length)]);
}

function shopDenRandomStock(rarity) {
  switch (rarity) {
    case "common": return Math.floor(Math.random() * 5) + 4;
    case "rare": return Math.floor(Math.random() * 4) + 2;
    case "epic": return Math.floor(Math.random() * 3) + 1;
    case "legendary": return Math.floor(Math.random() * 2) + 1;
    case "mythical": return 1;
    default: return 3;
  }
}

export function shopDenRestock() {
  const sd = shopDenGet();
  const count = Math.min(Math.floor(Math.random() * 2) + 5, SHOPDEN_POOL.length);
  const picked = new Map();

  // Món có stockRate: roll riêng, trúng thì luôn xuất hiện
  for (const entry of SHOPDEN_POOL) {
    const item = shopDenResolveItem(entry);
    if (item.stockRate != null && Math.random() * 100 < item.stockRate && !picked.has(item.ref)) {
      picked.set(item.ref, item);
    }
  }

  let guard = 0;
  while (picked.size < count && guard < 200) {
    guard++;
    const item = shopDenPickItem();
    if (!picked.has(item.ref)) picked.set(item.ref, item);
  }

  sd.shop = [...picked.values()].map(item => ({
    id: item.id,
    ref: item.ref,
    name: item.name,
    emoji: item.emoji,
    rarity: item.rarity,
    stats: item.stats,
    price: Math.max(1, Math.round(item.basePrice * (0.7 + Math.random() * 0.8))),
    stock: shopDenRandomStock(item.rarity),
  }));
  sd.lastRestockAt = Date.now();
  sd.nextRestockAt = Date.now() + SHOPDEN_RESTOCK_MS;
  saveData();
  return sd.shop;
}

export function startShopDen() {
  if (shopDenJob) {
    shopDenJob.cancel();
    shopDenJob = null;
  }
  syncExternalFiles();
  const sd = shopDenGet();
  if (sd.shop.length === 0) {
    shopDenRestock();
  }
  shopDenJob = schedule.scheduleJob(SHOPDEN_RESTOCK_CRON, () => {
    try {
      syncExternalFiles();
      shopDenRestock();
    } catch (e) {
      console.error("[shopden] restock error:", e);
    }
  });
  console.log("Shop Den khoi dong va nap du lieu hoan tat");
}

function shopDenFormatRemaining(targetTime) {
  const diff = Math.max(0, targetTime - Date.now());
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  if (minutes === 0) return `${seconds} giây`;
  return `${minutes} phút ${seconds} giây`;
}

function shopDenStatLine(stats) {
  if (!stats) return "";
  const parts = [];
  if (stats.atk) parts.push(`⚔️+${formatNumber(stats.atk)} ATK`);
  if (stats.spd) parts.push(`🌬️+${formatNumber(stats.spd)} SPD`);
  if (stats.hp) parts.push(`❤️+${formatNumber(stats.hp)} HP`);
  if (stats.def) parts.push(`🛡️+${formatNumber(stats.def)} DEF`);
  if (stats.crit) parts.push(`🎯+${stats.crit}% CRIT`);
  if (stats.lifesteal) parts.push(`🩸+${stats.lifesteal}% hút máu`);
  if (stats.dmgReduction) parts.push(`💠-${stats.dmgReduction}% ST nhận`);
  return parts.length > 0 ? ` (${parts.join(" | ")})` : "";
}

async function handleShopDen(api, message, p, senderId, sub2, sub3, sub4) {
  const prefix = getGlobalPrefix();
  const sd = shopDenGet();

  if (sub2 === "restock") {
    if (!isSangTheLenh(senderId)) {
      return api.sendMessage({ msg: "❌ Cần có Sáng Thế Lệnh mới dùng được lệnh này!", quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    shopDenRestock();
    const lines = sd.shop.map((it, i) => `${shopDenFormatRarity(it.rarity)} 🏷️${it.id} — ${it.emoji} ${it.name}${shopDenStatLine(it.stats)} ×${it.stock} — 💎 ${formatNumber(it.price)} LT`);
    return api.sendMessage({
      msg: `🌑 SHOP ĐEN RESTOCK!
━━━━━━━━━━━━━━━━
${lines.join("\n")}
━━━━━━━━━━━━━━━━
💡 ${prefix}tl shopden mua <số> [sl] để mua`,
      quote: message, ttl: 60000,
    }, message.threadId, message.type);
  }

  if (sub2 === "add") {
    return handleShopDenAdd(api, message, p, senderId, sub3, sub4);
  }

  if (sub2 === "mua" || sub2 === "buy") {
    const rawKey = String(sub3 || "").trim();
    let item = null;
    let itemIdx = -1;
    if (rawKey) {
      const byId = sd.shop.findIndex(it => it.id.toLowerCase() === rawKey.toLowerCase());
      if (byId !== -1) {
        itemIdx = byId;
        item = sd.shop[byId];
      } else if (/^\d+$/.test(rawKey)) {
        const n = parseInt(rawKey, 10);
        if (n >= 1 && n <= sd.shop.length) {
          itemIdx = n - 1;
          item = sd.shop[n - 1];
        }
      }
    }
    if (!item) {
      return api.sendMessage({ msg: `❌ Cú pháp: ${prefix}tl shopden mua <ID hoặc số thứ tự> [sl]\n💡 Xem hàng: ${prefix}tl shopden`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    const qty = Math.max(1, parseInt(sub4 || "1", 10) || 1);

    if ((item.stock || 0) <= 0) {
      return api.sendMessage({ msg: "❌ Món này vừa hết hàng!", quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    const buyQty = Math.min(qty, item.stock);
    const total = item.price * buyQty;
    if ((p.spiritStones || 0) < total) {
      return api.sendMessage({ msg: `❌ Không đủ Linh Thạch! Cần ${formatNumber(total)} LT, bạn có ${formatNumber(p.spiritStones || 0)} LT.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }

    p.spiritStones -= total;
    item.stock -= buyQty;
    if (item.stock <= 0) sd.shop.splice(itemIdx, 1);
    if (POTIONS.find(po => po.id === item.ref)) {
      addItem(senderId, item.ref, null, buyQty);
    } else {
      if (!p.inventory.potions) p.inventory.potions = {};
      p.inventory.potions[item.ref] = (p.inventory.potions[item.ref] || 0) + buyQty;
    }
    saveData();

    const msg = `🌑 MUA HÀNG SHOP ĐEN THÀNH CÔNG!
━━━━━━━━━━━━━━━━
${item.emoji} ${item.name}${shopDenStatLine(item.stats)} ×${buyQty}
💰 Đơn giá: ${formatNumber(item.price)} LT | 🧾 Tổng: ${formatNumber(total)} LT
💎 Số dư còn: ${formatNumber(p.spiritStones)} LT`;
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }

  if (sd.shop.length === 0) {
    shopDenRestock();
  }

  const order = ["common", "rare", "epic", "legendary", "mythical"];
  const sorted = [...sd.shop].sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity));
  sd.shop = sorted;
  saveData();

  const lines = sorted.map((it) => `${shopDenFormatRarity(it.rarity)} 🏷️${it.id} — ${it.emoji} ${it.name}${shopDenStatLine(it.stats)} ×${it.stock} — 💎 ${formatNumber(it.price)} LT`);
  const msg = `🌑 SHOP ĐEN — HÀNG HIỆN CÓ
━━━━━━━━━━━━━━━━
${lines.join("\n")}
━━━━━━━━━━━━━━━━
⏳ Restock sau: ${shopDenFormatRemaining(sd.nextRestockAt)}
💡 Mua: ${prefix}tl shopden mua <ID> [sl] — VD: ${prefix}tl shopden mua kiem_sat 5
⚠️ Giá & số lượng thay đổi mỗi lần restock, nhanh tay kẻo lỡ!`;
  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

function shopDenFormatRarity(rarity) {
  const info = SHOPDEN_RARITY_INFO[rarity] || SHOPDEN_RARITY_INFO.common;
  return `${info.emoji}[${info.label}]`;
}

// ── BOSS KHÔNG GIAN (Mảnh Vỡ Gương) ────────────────────────
const MIRROR_SHARD_ID = "sd_manh_vo_guong";
const MIRROR_SHARD_REQUIRED = 10;
const BOSS_REWARD_LT = 350000000;
const BOSS_LIFETIME_MS = 2 * 60 * 1000;
const BOSS_ATTACK_COOLDOWN_MS = 5000;
const BOSS_HIT_CHANCE = 10;
const bossState = {};
const bossAttackCd = new Map();

// ── SOUL BOSS (Thần Chết) ──────────────────────────────────
const SOUL_BOSS_LIFETIME_MS = 5 * 60 * 1000; // 5 phút
const SOUL_BOSS_ATTACK_CD_MS = 5000; // 5s hồi chiêu
const SOUL_BOSS_HIT_CHANCE = 30; // 30% trúng
const SOUL_BOSS_REWARD_LT_MIN = 50000000;
const SOUL_BOSS_REWARD_LT_MAX = 150000000;
const soulBossState = {};
const soulBossAttackCd = new Map();

function getBossStats() {
  return calcStats({
    majorRealm: 29,
    minorRealm: MAX_MINOR_REALM,
    daotam: "chinh",
    equippedWeapon: "w_divine_1",
  });
}

function pickDauAnId() {
  const roll = Math.random();
  if (roll < 1 / 3) return "sd_dau_an_do";
  if (roll < 2 / 3) return "sd_dau_an_trang";
  return "sd_dau_an_hong";
}

async function handleShopDenAdd(api, message, p, senderId, sub3, sub4) {
  const prefix = getGlobalPrefix();
  if (!isSangTheLenh(senderId)) {
    return api.sendMessage({ msg: "❌ Cần có Sáng Thế Lệnh mới dùng được lệnh này!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  const rawId = String(sub3 || "").trim();
  if (!rawId) {
    return api.sendMessage({
      msg: `❌ Cú pháp: ${prefix}tl shopden add <ID> [sl] [@user]\n💡 VD: ${prefix}tl shopden add sd_manh_vo_guong 10\n📦 Đan: dùng ID số (VD: 4) • Hàng Shop Đen: tiền tố sd_ (kiem_sat → sd_kiem_sat)`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }
  const qty = Math.max(1, parseInt(sub4 || "1", 10) || 1);
  const targetId = message.data.mentions?.[0]?.uid?.toString() || senderId;
  const target = getPlayer(targetId);

  let itemId = rawId;
  const isPotion = POTIONS.find(po => po.id === rawId);
  if (!isPotion && !rawId.startsWith("sd_")) itemId = `sd_${rawId}`;
  if (!isPotion && !itemId.startsWith("sd_dau_an") && !SHOPDEN_POOL.find(e => (e.key || e.ref) === itemId.replace(/^sd_/, ""))) {
    return api.sendMessage({ msg: `❌ Không tìm thấy item ID "${rawId}"!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (!target.inventory.potions) target.inventory.potions = {};
  target.inventory.potions[itemId] = (target.inventory.potions[itemId] || 0) + qty;
  saveData();

  const targetName = targetId === senderId ? (message.data.dName || "bạn") : (message.data.mentions?.[0]?.dName || targetId);
  return api.sendMessage({
    msg: `✅ Đã phát ${qty}× 🏷️${itemId} cho ${targetName}!\n🎒 Kiểm tra: ${prefix}tl bag`,
    quote: message, ttl: 30000,
  }, message.threadId, message.type);
}

async function handleSpawnBoss(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  if (message.type !== MessageType.GroupMessage) {
    return api.sendMessage({ msg: "❌ Chỉ có thể triệu hồi boss trong nhóm!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  const threadKey = String(message.threadId);
  if (bossState[threadKey] && Date.now() < bossState[threadKey].expiresAt) {
    return api.sendMessage({ msg: "❌ Chiều không gian này đã có boss rồi! Đánh tiếp đi!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (!p.inventory.potions) p.inventory.potions = {};
  const shards = p.inventory.potions[MIRROR_SHARD_ID] || 0;
  if (shards < MIRROR_SHARD_REQUIRED) {
    return api.sendMessage({
      msg: `❌ Cần ${MIRROR_SHARD_REQUIRED} 🪞 Mảnh Vỡ Gương để mở chiều không gian!\n🧩 Bạn đang có: ${shards}/${MIRROR_SHARD_REQUIRED}\n💡 Mua trong ${prefix}tl shopden (tỉ lệ xuất hiện rất thấp!)`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  p.inventory.potions[MIRROR_SHARD_ID] -= MIRROR_SHARD_REQUIRED;
  if (p.inventory.potions[MIRROR_SHARD_ID] <= 0) delete p.inventory.potions[MIRROR_SHARD_ID];
  savePlayer(senderId);

  const stats = getBossStats();
  bossState[threadKey] = {
    hp: stats.hp,
    maxHp: stats.hp,
    atk: stats.atk,
    spd: stats.spd,
    def: stats.def,
    contributors: {},
    spawnedBy: String(senderId),
    spawnedByName: message.data.dName || "Đạo hữu",
    expiresAt: Date.now() + BOSS_LIFETIME_MS,
    timer: null,
  };
  bossState[threadKey].timer = setTimeout(() => {
    const boss = bossState[threadKey];
    if (!boss || Date.now() < boss.expiresAt) return;
    delete bossState[threadKey];
    api.sendMessage({
      msg: `🌫️ CHIỀU KHÔNG GIAN BIẾN MẤT!
━━━━━━━━━━━━━━━━
⏰ Boss Hỗn Độn Thần Chủ đã rút lui cùng chiều không gian...
💔 Toàn bộ công sức tan thành mây khói!
🪞 Sưu tầm đủ 10 Mảnh Vỡ Gương để triệu hồi lại nhé!`,
    }, threadKey, MessageType.GroupMessage).catch(() => {});
  }, BOSS_LIFETIME_MS);

  const remainSec = Math.floor(BOSS_LIFETIME_MS / 1000);
  const msg = `🌌 MỘT CHIỀU KHÔNG GIAN ĐÃ XUẤT HIỆN!
━━━━━━━━━━━━━━━━
👹 BOSS: Hỗn Độn Thần Chủ (Cảnh 29)
✨ Vũ khí: Vô Thượng Kiếm
━━━━━━━━━━━━━━━━
❤️ HP Boss: ${formatBig(stats.hp)}
⚔️ ATK: ${formatBig(stats.atk)} | 🛡️ DEF: ${formatBig(stats.def)}
💨 SPD: ${formatBig(stats.spd)}
🌀 Né đòn: ${100 - BOSS_HIT_CHANCE}%
⛔ MIỄN NHIỄM: Crit • Giảm thương • Phản đạn
⏰ Tồn tại: ${remainSec} giây!
━━━━━━━━━━━━━━━━
💥 Gõ ${prefix}tl danhboss để tấn công!
🏆 Thưởng hạ boss: ${formatNumber(BOSS_REWARD_LT)} LT + Dấu Ấn bí ẩn`;
  await api.sendMessage({ msg, quote: message, ttl: 120000 }, message.threadId, message.type);
}

async function handleDanhBoss(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  const threadKey = String(message.threadId);
  const boss = bossState[threadKey];
  if (!boss || Date.now() >= boss.expiresAt) {
    return api.sendMessage({ msg: `❌ Không có boss nào trong chiều không gian này!\n💡 Thu thập 10 🪞 Mảnh Vỡ Gương rồi dùng ${prefix}tl spawnboss`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (p.beguan?.startedAt) {
    return api.sendMessage({ msg: "❌ Bạn đang bế quan, tâm bất định đâu đánh được boss!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const cdKey = `${threadKey}_${senderId}`;
  const lastHit = bossAttackCd.get(cdKey) || 0;
  const cdRemain = BOSS_ATTACK_COOLDOWN_MS - (Date.now() - lastHit);
  if (cdRemain > 0) {
    return api.sendMessage({ msg: `⏳ Nghỉ đã! Chờ ${(cdRemain / 1000).toFixed(1)}s nữa mới ra đòn tiếp được.`, quote: message, ttl: 5000 }, message.threadId, message.type);
  }
  bossAttackCd.set(cdKey, Date.now());

  const myName = message.data.dName || "Đạo hữu";

  // Boss né 90%
  if (Math.random() * 100 >= BOSS_HIT_CHANCE) {
    return api.sendMessage({ msg: `💨 ${myName} ra đòn nhưng Hỗn Độn Thần Chủ dịch chuyển tức thời — TRƯỢT!`, quote: message, ttl: 8000 }, message.threadId, message.type);
  }

  // Boss miễn crit, miễn giảm thương — sát thương thuần từ ATK
  const stats = calcStats(p);
  const dmg = Math.max(1, Math.floor(stats.atk * (0.85 + Math.random() * 0.3)));
  boss.hp -= dmg;
  boss.contributors[String(senderId)] = (boss.contributors[String(senderId)] || 0) + dmg;

  if (boss.hp <= 0) {
    const oldTimer = boss.timer;
    delete bossState[threadKey];
    if (oldTimer) clearTimeout(oldTimer);

    const hitters = Object.keys(boss.contributors);
    const share = Math.floor(BOSS_REWARD_LT / Math.max(1, hitters.length));
    const dauAnNames = { sd_dau_an_do: "🔴 Dấu Ấn Đỏ", sd_dau_an_trang: "⚪ Dấu Ấn Trắng", sd_dau_an_hong: "🌸 Dấu Ấn Hồng" };
    const rewards = [];
    for (const uid of hitters) {
      const pl = getPlayer(uid);
      pl.spiritStones = (pl.spiritStones || 0) + share;
      const dauAn = pickDauAnId();
      if (!pl.inventory.potions) pl.inventory.potions = {};
      pl.inventory.potions[dauAn] = (pl.inventory.potions[dauAn] || 0) + 1;
      rewards.push({ key: uid, dauAn });
    }
    saveData();

    const nameLines = [];
    for (const r of rewards) {
      const nm = await getPlayerDisplayName(api, r.key);
      nameLines.push(`⚔️ ${nm}: +${formatNumber(share)} LT + ${dauAnNames[r.dauAn]}`);
    }

    const msg = `🎉 HẠ GỤC HỖN ĐỘN THẦN CHỦ!
━━━━━━━━━━━━━━━━
👑 Chiều không gian đóng lại. Phần thưởng chia cho ${hitters.length} đạo hữu ra đòn trúng:
${nameLines.join("\n")}
━━━━━━━━━━━━━━━━
💎 Mỗi người nhận: +${formatNumber(share)} LT + 1 Dấu Ấn ngẫu nhiên
🪞 Dấu Ấn đang là đồ bí ẩn... hãy giữ kỹ!`;
    return api.sendMessage({ msg, quote: message, ttl: 120000 }, message.threadId, message.type);
  }

  const hpPct = Math.max(0, Math.min(100, Math.floor((boss.hp / boss.maxHp) * 100)));
  const barLen = Math.max(1, Math.floor(hpPct / 10));
  const bar = "█".repeat(barLen) + "░".repeat(10 - barLen);
  const msg = `💥 ${myName} đánh trúng Hỗn Độn Thần Chủ!
━━━━━━━━━━━━━━━━
🔥 Sát thương: ${formatBig(dmg)}
❤️ HP Boss còn: [${bar}] ${hpPct}% (${formatBig(boss.hp)})
⏰ Còn ${Math.ceil((boss.expiresAt - Date.now()) / 1000)}s trước khi chiều không gian đóng`;
  await api.sendMessage({ msg, quote: message, ttl: 15000 }, message.threadId, message.type);
}

// ── NHẬT KÝ LỆNH ADMIN ─────────────────────────────────
const ADMIN_LOGS_PATH = path.join(TL_DATA_DIR, "data-tu-luyen-admin-logs.json");
let adminLogsCache = null;

function loadAdminLogs() {
  if (adminLogsCache) return adminLogsCache;
  try {
    if (fs.existsSync(ADMIN_LOGS_PATH)) {
      adminLogsCache = JSON.parse(fs.readFileSync(ADMIN_LOGS_PATH, "utf8"));
    } else {
      adminLogsCache = { logs: [] };
    }
  } catch {
    adminLogsCache = { logs: [] };
  }
  if (!Array.isArray(adminLogsCache.logs)) adminLogsCache.logs = [];
  lastAdminLogsMtime = statMs(ADMIN_LOGS_PATH);
  return adminLogsCache;
}

function saveAdminLogs() {
  try {
    const m = atomicWriteJson(ADMIN_LOGS_PATH, adminLogsCache);
    if (m) lastAdminLogsMtime = m;
  } catch (e) {
    console.error("Lỗi lưu nhật ký admin tu-luyen:", e);
  }
}

function logAdminAction(uid, cmd, detail, target = null) {
  const logs = loadAdminLogs();
  logs.logs.push({ uid: String(uid), cmd, detail, target: target != null ? String(target) : null, at: Date.now() });
  if (logs.logs.length > 300) logs.logs = logs.logs.slice(-300);
  saveAdminLogs();
}

// ── NHẬT KÝ GIAO DỊCH BANK ────────────────────────────
const BANK_LOGS_PATH = path.join(TL_DATA_DIR, "data-tu-luyen-bank-logs.json");
let bankLogsCache = null;

function loadBankLogs() {
  if (bankLogsCache) return bankLogsCache;
  try {
    if (fs.existsSync(BANK_LOGS_PATH)) {
      bankLogsCache = JSON.parse(fs.readFileSync(BANK_LOGS_PATH, "utf8"));
    } else {
      bankLogsCache = { logs: [] };
    }
  } catch {
    bankLogsCache = { logs: [] };
  }
  if (!Array.isArray(bankLogsCache.logs)) bankLogsCache.logs = [];
  lastBankLogsMtime = statMs(BANK_LOGS_PATH);
  return bankLogsCache;
}

function saveBankLogs() {
  try {
    const m = atomicWriteJson(BANK_LOGS_PATH, bankLogsCache);
    if (m) lastBankLogsMtime = m;
  } catch (e) {
    console.error("Lỗi lưu nhật ký bank tu-luyen:", e);
  }
}

function logBankTransaction(fromUid, toUid, amount, tax, received) {
  const logs = loadBankLogs();
  logs.logs.push({
    from: String(fromUid),
    to: String(toUid),
    amount,
    tax,
    received,
    at: Date.now(),
  });
  if (logs.logs.length > 2000) logs.logs = logs.logs.slice(-2000);
  saveBankLogs();
}

// ── BẾ QUAN ────────────────────────────────────────────────
const BEGUAN_LIMIT_MS = 60 * 60 * 1000;

function getBeguanLimitMs(p) {
  const extra = getBuffValue(p, "train_limit_extra") || 0;
  return BEGUAN_LIMIT_MS + extra * 60000;
}
const BEGUAN_WARN_MS = 5 * 60 * 1000;
const BEGUAN_EXP_MULTIPLIER = 0.40;
const BEGUAN_STONES_MIN = 100;
const BEGUAN_STONES_MAX = 900;

// ── THIÊN TẦNG THÁP ─────────────────────────────────────────
const TOWER_MAX_FLOOR = 200;
const TOWER_GROWTH = 1.30;
const TOWER_BOSS_STAT_MULT = 1.25;
const TOWER_BOSS_DODGE = 80;
const TOWER_FIGHT_DODGE = 75;
const TOWER_MAX_TURNS = 40;
function getTowerStaminaCost(floor) {
  const f = Math.max(1, Math.min(floor || 1, TOWER_MAX_FLOOR));
  return Math.round(100 + ((f - 1) / (TOWER_MAX_FLOOR - 1)) * 100);
}
const BEGUAN_INJURY_MS = 60 * 60 * 1000;
let beguanInterval = null;

function hasBeguanNoInjury(p) {
  if (!p || !p.equippedArmor) return false;
  const armor = ARMORS.find(a => a.id === p.equippedArmor);
  return !!armor?.beguanNoInjury;
}

const ACCOUNT_SALT = "tu-luyen-ho-chieu";

function hashPass(pass) {
  return createHash("sha256").update(`${ACCOUNT_SALT}:${pass}`).digest("hex");
}

export function startBeguanCheck(api) {
  if (beguanInterval) clearInterval(beguanInterval);
  beguanInterval = setInterval(async () => {
    try {
      syncExternalFiles();
      const data = loadData();
      const now = Date.now();
      let changed = false;
      for (const [uid, p] of Object.entries(data.players)) {
        const b = p.beguan;
        if (!b || !b.startedAt) continue;
        const elapsed = now - b.startedAt;
        if (elapsed >= getBeguanLimitMs(p)) {
          const threadId = b.threadId;
          const threadType = b.threadType;
          applyBeguanTauHoa(p);
          changed = true;
          await sendBeguanTauHoaMsg(api, uid, p, threadId, threadType);
        } else if (!b.reminded && elapsed >= getBeguanLimitMs(p) - BEGUAN_WARN_MS) {
          b.reminded = true;
          changed = true;
          const threadId = b.threadId;
          const threadType = b.threadType;
          await sendBeguanReminder(api, uid, b, threadId, threadType);
        }
      }
      if (changed) saveData();
    } catch (e) {
      console.error("[beguan] check error:", e);
    }
  }, 30000);
}

async function getZaloName(api, uid) {
  try {
    const info = await api.getUserInfo([uid]);
    const profile = info?.changed_profiles?.[uid] || info?.unchanged_profiles?.[uid];
    return profile?.zaloName || profile?.name || null;
  } catch {
    return null;
  }
}

async function sendBeguanReminder(api, uid, b, threadId, threadType) {
  const prefix = getGlobalPrefix();
  const name = (await getZaloName(api, uid)) || "Đạo hữu";
  const msg = `@${name} ⏰ NHẮC BẾ QUAN!
━━━━━━━━━━━━━━━━
⏳ Còn 5 phút nữa là hết giờ bế quan!
📝 Gõ ${prefix}tl stop ngay để thu hoạch EXP.
💥 Quá 60 phút mà chưa ${prefix}tl stop sẽ TẨU HỎA: mất toàn bộ EXP + trọng thương 1 giờ!`;
  try {
    await api.sendMessage(
      { msg, mentions: [{ pos: 0, uid, len: name.length + 1 }], ttl: 60000 },
      threadId,
      threadType || MessageType.GroupMessage,
    );
  } catch (e) {
    console.error("[beguan] send reminder error:", e);
  }
}

async function sendBeguanTauHoaMsg(api, uid, p, threadId, threadType) {
  const prefix = getGlobalPrefix();
  const name = (await getZaloName(api, uid)) || "Đạo hữu";
  if (hasBeguanNoInjury(p)) {
    const msg = `@${name} 📿 PHÙ SA CHÚ HỘ THỂ!
━━━━━━━━━━━━━━━━
⏰ Quá giờ bế quan, không nhận được EXP!
📿 Phù Sa Chú phát sáng — miễn nhiễm trọng thương!`;
    try {
      await api.sendMessage(
        { msg, mentions: [{ pos: 0, uid, len: name.length + 1 }], ttl: 60000 },
        threadId,
        threadType || MessageType.GroupMessage,
      );
    } catch (e) {
      console.error("[beguan] send tau hoa error:", e);
    }
    return;
  }
  const msg = `@${name} 💥 TẨU HỎA NHẬP MA!
━━━━━━━━━━━━━━━━
⏰ Quá 60 phút không dừng bế quan!
📉 Không nhận được EXP trong đợt này!
💔 Trọng thương 1 giờ — dùng ${prefix}tl use 1 để chữa trị.`;
  try {
    await api.sendMessage(
      { msg, mentions: [{ pos: 0, uid, len: name.length + 1 }], ttl: 60000 },
      threadId,
      threadType || MessageType.GroupMessage,
    );
  } catch (e) {
    console.error("[beguan] send tau hoa error:", e);
  }
}

function applyBeguanTauHoa(p) {
  p.beguan = null;
  if (hasBeguanNoInjury(p)) {
    p.trongThuongUntil = 0;
    return true;
  }
  p.trongThuongUntil = Date.now() + BEGUAN_INJURY_MS;
  return false;
}

function loadData() {
  if (dataCache) return dataCache;
  try {
    if (fs.existsSync(DATA_PATH)) {
      dataCache = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    } else {
      dataCache = { players: {} };
    }
  } catch {
    dataCache = { players: {} };
  }
  lastDataMtime = statMs(DATA_PATH);
  if (!dataCache.players) dataCache.players = {};
  if (!dataCache.accounts) dataCache.accounts = {};
  if (!dataCache.sessions) dataCache.sessions = {};
  return dataCache;
}

function saveData() {
  try {
    const m = atomicWriteJson(DATA_PATH, dataCache);
    if (m) lastDataMtime = m;
  } catch (e) {
    console.error("Lỗi lưu data tu-luyen:", e);
  }
}

// ── HỆ SỐ EXP THEO NHÓM ────────────────────────────────────
const EXP_MULT_ADMIN_ID = "350261016567599395";
// ── ĐẤNG SÁNG THẾ (tu-luyen.js) — toàn quyền cao nhất ──
const DANG_SANG_THE_IDS = ["350261016567599395", "1356702919234537516"];

// ── FAST SELL — GIẢM GIÁ CÓ THỜI HẠN (ADMIN ĐẶC BIỆT) ──────
function getFlashSales() {
  const data = loadData();
  if (!data.flashSales) data.flashSales = {};
  return data.flashSales;
}

function getActiveFlashSale(itemId) {
  const sales = getFlashSales();
  const s = sales[String(itemId)];
  if (!s) return null;
  if (Date.now() >= s.expiresAt) {
    delete sales[String(itemId)];
    saveData();
    return null;
  }
  return s;
}

function findShopItemAny(id) {
  return MATERIALS.find(m => m.id === id)
    || ARMORS.find(a => a.id === id)
    || WEAPONS.find(w => w.id === id)
    || POTIONS.find(po => po.id === id)
    || CONGPHA.find(c => c.id === id)
    || null;
}

function getFlashSalePrice(basePrice, itemId) {
  const s = getActiveFlashSale(itemId);
  if (!s) return { price: basePrice, sale: null };
  return { price: Math.max(1, Math.floor((basePrice * (100 - s.percent)) / 100)), sale: s };
}

function formatFlashSaleLine(sale, itemId, unitPrice) {
  const mins = Math.max(1, Math.ceil((sale.expiresAt - Date.now()) / 60000));
  const remain = mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60 ? `${mins % 60}p` : ""}` : `${mins} phút`;
  return `🔥 FLASH SALE -${sale.percent}%: ${formatNumber(unitPrice)} LT (còn ${remain})`;
}


function getThreadExpMult(threadId) {
  const data = loadData();
  const m = Number(data.expMultipliers?.[String(threadId)]);
  return Number.isFinite(m) && m > 0 ? m : 1;
}

function setThreadExpMult(threadId, mult) {
  const data = loadData();
  if (!data.expMultipliers) data.expMultipliers = {};
  data.expMultipliers[String(threadId)] = mult;
  saveData();
}

function parseExpMultInput(value) {
  if (!value) return null;
  const cleaned = String(value).trim().replace(/^[×xX\*]+\s*/, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 1 || n > 1000) return null;
  return Math.round(n * 100) / 100;
}

async function handleExpMultiplier(api, message, p, senderId, value) {
  const prefix = getGlobalPrefix();
  if (!isDangSangThe(senderId)) {
    return api.sendMessage({
      msg: "❌ Chỉ Đấng Sáng Thế mới dùng được lệnh này!",
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const current = getThreadExpMult(message.threadId);

  if (!value) {
    return api.sendMessage({
      msg: `✨ HỆ SỐ EXP NHÓM NÀY
━━━━━━━━━━━━━━━
📊 Hệ số hiện tại: ×${current} (áp dụng cho Bí Cảnh & Bế Quan)
━━━━━━━━━━━━━━━
💡 ${prefix}tl exp <số> — Đặt hệ số (VD: ${prefix}tl exp x2 hoặc ${prefix}tl exp ×3)`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  const parsed = parseExpMultInput(value);
  if (parsed === null) {
    return api.sendMessage({
      msg: `❌ Hệ số không hợp lệ! Nhập số từ ×1 trở lên.\n💡 VD: ${prefix}tl exp x2 | ${prefix}tl exp ×5`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  setThreadExpMult(message.threadId, parsed);
  logAdminAction(senderId, "exp", `×${parsed}`, null);

  const changeLine = parsed > current
    ? `📈 Tăng từ ×${current} lên ×${parsed} — EXP nhận được gấp ${(parsed / current).toFixed(2)} lần trước!`
    : parsed < current
      ? `📉 Giảm từ ×${current} xuống ×${parsed}.`
      : `ℹ️ Hệ số giữ nguyên ở ×${parsed}.`;

  return api.sendMessage({
    msg: `✅ ĐÃ ĐẶT HỆ SỐ EXP NHÓM!
━━━━━━━━━━━━━━━
🧵 Nhóm: ${message.threadId}
✨ Hệ số mới: ×${parsed}
${changeLine}
━━━━━━━━━━━━━━━
🌀 Áp dụng: EXP khi đi Bí Cảnh & Bế Quan trong nhóm này`,
    quote: message, ttl: 30000,
  }, message.threadId, message.type);
}

function getDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateKey(key) {
  const [y, m, d] = String(key).split("-");
  return `${d}/${m}/${y}`;
}

function loadUpdates() {
  if (updatesCache) return updatesCache;
  try {
    if (fs.existsSync(UPDATES_PATH)) {
      updatesCache = JSON.parse(fs.readFileSync(UPDATES_PATH, "utf8"));
    } else {
      updatesCache = { updates: {} };
    }
  } catch {
    updatesCache = { updates: {} };
  }
  lastUpdatesMtime = statMs(UPDATES_PATH);
  return updatesCache;
}

function saveUpdates() {
  try {
    const m = atomicWriteJson(UPDATES_PATH, updatesCache);
    if (m) lastUpdatesMtime = m;
  } catch (e) {
    console.error("Lỗi lưu update tu-luyen:", e);
  }
}

function getPlayer(userId) {
  const data = loadData();
  const accountName = data.sessions?.[userId];
  const key = accountName || userId;
  if (!data.players[key]) {
    const t = rollTalent();
    const talentInfo = TALENTS[t];
    data.players[key] = {
      name: "",
      majorRealm: 1,
      minorRealm: 1,
      exp: 0,
      spiritStones: 0,
      bones: 0,
      soul: 0,
      fire: 0,
      talent: t,
      theChat: rollTheChat(),
      huyetMach: rollHuyetMach(),
      linhCan: rollLinhCan(),
      ngoTinh: talentInfo.ngoBase,
      phucDuyen: talentInfo.phucBase,
      daotam: "chinh",
      guiold: true,
      learnedCongPha: [],
      equippedWeapon: null,
      equippedArmor: null,
      equippedPhapTac: null,
      equippedPhapBao: null,
      breakthroughBonus: 0,
      dpAuto: false,
      inSecretRealm: false,
      secretRealmEnteredAt: null,
      stamina: 50,
      maxStamina: 50,
      maxStaminaBonus: 0,
      phithangCount: 0,
      donated: 0,
      donateMilestones: [],
      prime: 0,
      currentHp: null,
      towerInjured: false,
      trainStage: 0,
      buffs: [],
      pkPoints: 0,
      trongThuongUntil: 0,
      dailyNgoTinhDate: "",
      dailyNgoTinhUsed: 0,
      lastDailyClaim: "",
      dailyStreak: 0,
      towerFloor: 0,
      currentSecretRealmId: null,
      beguan: null,
      phapTacPath: null,
      phapTacLevel: 0,
      banned: false,
      lastStaminaRegen: Date.now(),
      gachaRolls: 0,
      gachaResetAt: 0,
      streakPartner: null,
      streakDay: 0,
      streakStart: "",
      lastStreakCheck: "",
      streakFullLastDay: "",
      streakClaimedMilestones: [],
      inventory: { weapons: {}, armors: {}, potions: {}, materials: {} },
    };
    saveData();
  }
  const p = data.players[key];
  if (!p.inventory) p.inventory = { weapons: {}, armors: {}, potions: {} };
  if (!p.inventory.armors) p.inventory.armors = {};
  if (!p.inventory.phapTac) p.inventory.phapTac = {};
  if (!p.inventory.phapBao) p.inventory.phapBao = {};
  if (!p.inventory.materials) p.inventory.materials = {};
  if (!p.titles) p.titles = [];
  if (p.theChat == null) {
    p.theChat = rollTheChat();
    saveData();
  }
  if (p.huyetMach == null) {
    p.huyetMach = rollHuyetMach();
    saveData();
  }
  if (p.linhCan == null) {
    p.linhCan = rollLinhCan();
    saveData();
  }
  if (!Array.isArray(p.learnedCongPha)) {
    p.learnedCongPha = [];
    saveData();
  }
  if (p.majorRealm === 0) {
    p.majorRealm = 1;
    p.minorRealm = p.minorRealm || 1;
    saveData();
  }
  if (p.maxStaminaBonus == null) {
    const natural = 50 + (p.majorRealm || 1) * 20;
    p.maxStaminaBonus = Math.max(0, (p.maxStamina || natural) - natural);
    saveData();
  }
  if (!("beguan" in p) || (p.beguan && !p.beguan.startedAt)) {
    p.beguan = null;
    saveData();
  }
  if (p.phapTacPath === undefined) {
    p.phapTacPath = null;
    p.phapTacLevel = 0;
    saveData();
  }
  if (p.towerInjured === undefined) {
    p.towerInjured = false;
    saveData();
  }
  if (p.trainStage === undefined) {
    p.trainStage = 0;
    saveData();
  }
  if (p.location === undefined) {
    p.location = null;
    saveData();
  }
  return data.players[key];
}

function savePlayer(userId) {
  saveData();
}

function getTaxRate() {
  const data = loadData();
  return data.serverTaxRate != null ? data.serverTaxRate : TAX_RATE;
}

function resolvePlayerKey(uid) {
  const data = loadData();
  return data.sessions?.[uid] || uid;
}

function resolveZaloUidFromKey(data, key) {
  key = String(key);
  if (/^\d+$/.test(key)) return key;
  const acc = data.accounts?.[key];
  if (acc?.ownerUid) return String(acc.ownerUid);
  for (const [zaloUid, accName] of Object.entries(data.sessions || {})) {
    if (accName === key) return String(zaloUid);
  }
  return null;
}

function getDaoDisplay(daotam) {
  if (daotam === "ma") return "⚫ Ma Đạo";
  if (daotam === "nho") return "🎓 Nho Đạo";
  if (daotam === "yeu") return "🐾 Yêu Đạo";
  if (daotam === "lo") return "🫙 Lọ Đạo";
  if (daotam === "quy") return "👻 Quỷ Đạo";
  if (daotam === "phat") return "🪷 Phật Đạo";
  return "⚡ Chính Đạo";
}

function hasItem(userId, itemId) {
  const p = getPlayer(userId);
  if (WEAPONS.find(w => w.id === itemId)) {
    return !!p.inventory.weapons[itemId];
  }
  return (p.inventory.potions[itemId] || 0) > 0;
}

function addItem(userId, itemId, type, qty = 1) {
  const p = getPlayer(userId);
  if (type === "weapon") {
    if (!p.inventory.weapons[itemId]) {
      p.inventory.weapons[itemId] = 1;
    }
  } else if (type === "armor") {
    if (!p.inventory.armors[itemId]) {
      p.inventory.armors[itemId] = 1;
    }
  } else if (type === "phapTac") {
    if (!p.inventory.phapTac[itemId]) {
      p.inventory.phapTac[itemId] = 1;
    }
  } else {
    p.inventory.potions[itemId] = (p.inventory.potions[itemId] || 0) + qty;
  }
  savePlayer(userId);
}

function removeItem(userId, itemId, qty = 1) {
  const p = getPlayer(userId);
  if (p.inventory.potions[itemId]) {
    p.inventory.potions[itemId] -= qty;
    if (p.inventory.potions[itemId] <= 0) {
      delete p.inventory.potions[itemId];
    }
  }
  savePlayer(userId);
}

function hasLearned(p, congPhaId) {
  return Array.isArray(p.learnedCongPha) && p.learnedCongPha.includes(congPhaId);
}

// ── ẨN TU VI LỆNH / HIỆN NGUYÊN HÌNH ───────────────────────
const AN_TU_VI_LENH_ID = "an_tu_vi_lenh";
const HIEN_NGUYEN_HINH_ID = "hien_nguyen_hinh";

function getTokenItem(id) {
  return TOKEN_ITEMS.find(t => t.id === id) || null;
}

function hasToken(p, id) {
  return (p.inventory?.potions?.[id] || 0) > 0;
}

function isHiddenFromRanking(p) {
  return hasToken(p, AN_TU_VI_LENH_ID);
}

const SANG_THE_LENH_ID = "sang_the_lenh";

function isStaffLocked() {
  const data = loadData();
  return data.staffLocked === true;
}

function isDangSangThe(userId) {
  return DANG_SANG_THE_IDS.includes(String(userId));
}

function isSangTheLenh(userId) {
  if (isDangSangThe(userId)) return true;
  if (isStaffLocked()) return false;
  const p = getPlayer(userId);
  return hasToken(p, SANG_THE_LENH_ID);
}

function grantToken(userId, tokenId) {
  const p = getPlayer(userId);
  if (!p.inventory.potions) p.inventory.potions = {};
  const otherId = tokenId === AN_TU_VI_LENH_ID ? HIEN_NGUYEN_HINH_ID : AN_TU_VI_LENH_ID;
  delete p.inventory.potions[otherId];
  p.inventory.potions[tokenId] = 1;
  savePlayer(userId);
}

function regenStamina(p) {
  const now = Date.now();
  const elapsed = now - (p.lastStaminaRegen || now);
  if (elapsed < 60000) return;
  const regenAmount = Math.floor(elapsed / 60000);
  const cap = p.maxStamina || 50;
  p.stamina = Math.min(cap, (p.stamina || 0) + regenAmount);
  p.lastStaminaRegen = now;
}

function getMentionName(message, mention) {
  if (mention?.dName) return mention.dName;
  try {
    const raw = message?.data?.content?.substr(mention.pos, mention.len) || "";
    const name = raw.replace(/^@/, "").trim();
    if (name) return name;
  } catch (e) { /* ignore */ }
  return mention?.uid || "";
}

function getTargetName(message, targetId, senderId) {
  if (targetId === senderId) return message.data.dName || senderId;
  return getMentionName(message, message.data.mentions?.[0]) || targetId;
}

const pendingPk = {};

// ── UPGRADE TRANG BỊ ────────────────────────────────────────
const UPGRADE_MAX = 30;
const UPGRADE_BASE_COST = 100000;
const UPGRADE_COST_STEP = 100000;
const UPGRADE_COST_CAP = 900000;
const UPGRADE_SUCCESS_DEC = 5;

function getUpgradeLevel(p, itemId) {
  return (p.upgradeLevels && p.upgradeLevels[itemId]) || 0;
}

function setUpgradeLevel(p, itemId, lvl) {
  if (!p.upgradeLevels) p.upgradeLevels = {};
  if (lvl <= 0) delete p.upgradeLevels[itemId];
  else p.upgradeLevels[itemId] = lvl;
}

function upgradeSuccessRate(currentLvl) {
  return Math.max(1, 100 - currentLvl * UPGRADE_SUCCESS_DEC);
}

function upgradeCost(currentLvl) {
  return Math.min(UPGRADE_BASE_COST + currentLvl * UPGRADE_COST_STEP, UPGRADE_COST_CAP);
}

// ── CHỐNG SPAM LỆNH ────────────────────────────────────────
// 1) Spam nhanh: cùng lệnh >5 lần trong 6 giây
// 2) Lặp liên tiếp: cùng lệnh lặp ~20 lần liên tiếp (bất kể thời gian)
// Cảnh cáo reset theo ngày. Nếu đã bị block rồi → spam tiếp = block thẳng, không cảnh cáo.
const SPAM_WINDOW_MS = 6000;
const SPAM_THRESHOLD = 5;
const REPEAT_THRESHOLD = 20;
const spamTracker = new Map();
const repeatTracker = new Map();
const previouslyBlocked = new Set();
let lastSpamResetDay = new Date().toDateString();

function dailyResetSpamTrackers() {
  const today = new Date().toDateString();
  if (today !== lastSpamResetDay) {
    spamTracker.clear();
    repeatTracker.clear();
    lastSpamResetDay = today;
  }
}

export function clearSpamTracking(userId) {
  previouslyBlocked.delete(userId);
  spamTracker.delete(userId);
  repeatTracker.delete(userId);
}

function checkCommandSpam(senderId, key, displayName) {
  if (isAdmin(senderId)) return { level: 0 };
  if (spamTracker.size > 10000) spamTracker.clear();
  if (repeatTracker.size > 10000) repeatTracker.clear();
  dailyResetSpamTrackers();

  const now = Date.now();

  // Nếu đã từng bị block → spam tiếp = block thẳng, không cảnh cáo
  if (previouslyBlocked.has(senderId)) {
    try {
      if (!managerData.data) managerData.data = {};
      if (!Array.isArray(managerData.data.blockBot)) managerData.data.blockBot = [];
      if (!managerData.data.blockBot.some(u => u.idUserZalo === String(senderId))) {
        managerData.data.blockBot.push({
          idUserZalo: String(senderId),
          senderName: displayName || String(senderId),
          reason: `Tái phạm spam ${key}`,
        });
        managerData.hasChanges = true;
      }
    } catch (e) {
      console.error("[tu-luyen] lỗi khi block spammer:", e);
    }
    return { level: 2, key, type: "repeat" };
  }

  // ── Kiểm tra lặp liên tiếp (trước) ──
  const r = repeatTracker.get(senderId);
  if (!r || r.key !== key) {
    repeatTracker.set(senderId, { key, count: 1, warned: false });
  } else {
    r.count += 1;
    if (r.count >= REPEAT_THRESHOLD) {
      if (!r.warned) {
        r.warned = true;
        return { level: 1, key, type: "repeat" };
      }
      previouslyBlocked.add(senderId);
      try {
        if (!managerData.data) managerData.data = {};
        if (!Array.isArray(managerData.data.blockBot)) managerData.data.blockBot = [];
        if (!managerData.data.blockBot.some(u => u.idUserZalo === String(senderId))) {
          managerData.data.blockBot.push({
            idUserZalo: String(senderId),
            senderName: displayName || String(senderId),
            reason: `Lặp lệnh ${key} liên tiếp ${r.count} lần`,
          });
          managerData.hasChanges = true;
        }
      } catch (e) {
        console.error("[tu-luyện] lỗi khi block spammer:", e);
      }
      return { level: 2, key, type: "repeat" };
    }
  }

  // ── Kiểm tra spam nhanh (cùng lệnh trong thời gian ngắn) ──
  const t = spamTracker.get(senderId);
  if (!t || t.key !== key || now - t.lastCmd > SPAM_WINDOW_MS) {
    spamTracker.set(senderId, { key, lastCmd: now, rapidCount: 1, warned: false });
    return { level: 0 };
  }

  t.lastCmd = now;
  t.rapidCount += 1;

  if (t.rapidCount <= SPAM_THRESHOLD) return { level: 0 };

  if (!t.warned) {
    t.warned = true;
    return { level: 1, key, type: "rapid" };
  }

  previouslyBlocked.add(senderId);
  try {
    if (!managerData.data) managerData.data = {};
    if (!Array.isArray(managerData.data.blockBot)) managerData.data.blockBot = [];
    if (!managerData.data.blockBot.some(u => u.idUserZalo === String(senderId))) {
      managerData.data.blockBot.push({
        idUserZalo: String(senderId),
        senderName: displayName || String(senderId),
        reason: `Spam lệnh ${key} quá nhanh`,
      });
      managerData.hasChanges = true;
    }
  } catch (e) {
    console.error("[tu-luyện] lỗi khi block spammer:", e);
  }
  return { level: 2, key, type: "rapid" };
}

// ── CHỐNG SPAM PREFIX (chỉ gõ mỗi prefix, không có lệnh) ──
const PREFIX_ONLY_LIMIT = 5;
const PREFIX_ONLY_WINDOW_MS = 60 * 1000;
const prefixOnlyTracker = new Map();

export async function handlePrefixOnlySpam(api, message) {
  const senderId = message.data.uidFrom;
  if (isAdmin(senderId)) return false;
  const raw = message.data.content;
  const text = (typeof raw === "string" ? raw : "").trim();
  if (!text || text !== getGlobalPrefix()) return false;

  if (prefixOnlyTracker.size > 10000) prefixOnlyTracker.clear();
  const now = Date.now();
  const t = prefixOnlyTracker.get(senderId);
  const count = t && now - t.last <= PREFIX_ONLY_WINDOW_MS ? t.count + 1 : 1;
  prefixOnlyTracker.set(senderId, { count, last: now });
  if (count <= PREFIX_ONLY_LIMIT) return false;

  try {
    if (!managerData.data) managerData.data = {};
    if (!Array.isArray(managerData.data.blockBot)) managerData.data.blockBot = [];
    if (!managerData.data.blockBot.some(u => u.idUserZalo === String(senderId))) {
      managerData.data.blockBot.push({
        idUserZalo: String(senderId),
        senderName: message.data.dName || String(senderId),
        reason: "Nghi ngờ tấn công bí thuật (spam prefix 5 lần liên tiếp)",
      });
      managerData.hasChanges = true;
    }
  } catch (e) {
    console.error("[tu-luyen] lỗi khi block spam prefix:", e);
  }

  await api.sendMessage({
    msg: `🚫 BẠN ĐÃ BỊ KHÓA TƯƠNG TÁC BOT!
━━━━━━━━━━━━━━━━
Lý do: Nghi ngờ tấn công bí thuật — gõ "${getGlobalPrefix()}" liên tục ${PREFIX_ONLY_LIMIT} lần mà không có lệnh.
🔒 Mọi lệnh tới bot của bạn đều bị chặn.
📞 Liên hệ QUẢN TRỊ VIÊN để được mở khóa.`,
    quote: message, ttl: 60000,
  }, message.threadId, message.type);
  return true;
}

// ── SONG TU / KẾT HÔN ──────────────────────────────────────
const MARRIAGE_COST = 2000;
const DIVORCE_COST = 500;
const SONGTU_COOLDOWN_MS = 30 * 60 * 1000;
const MARRIAGE_MAX_LEVEL = 10;
const BOND_PER_LEVEL = 100;
const pendingProposals = {};
const pendingDivorces = {};
const pendingSongTu = {};
const pendingStreak = {};

function getMarriages() {
  const data = loadData();
  if (!data.marriages) data.marriages = {};
  return data.marriages;
}

function getMarriageOf(playerKey) {
  const marriages = getMarriages();
  for (const m of Object.values(marriages)) {
    if (m.a === playerKey || m.b === playerKey) return m;
  }
  return null;
}

function getMarriageLevel(m) {
  return Math.min(MARRIAGE_MAX_LEVEL, 1 + Math.floor((m.bond || 0) / BOND_PER_LEVEL));
}

function getMarriageExpBonus(p) {
  if (!p.marriageKey) return 0;
  const m = getMarriages()[p.marriageKey];
  if (!m) return 0;
  return getMarriageLevel(m) * 5;
}

async function getPlayerDisplayName(api, key, fallback) {
  try {
    const data = loadData();
    const zaloUid = resolveZaloUidFromKey(data, key);
    if (zaloUid) {
      const name = await getZaloName(api, zaloUid);
      if (name) return name;
    }
  } catch {}
  return fallback || `Đạo hữu ${String(key).slice(-4)}`;
}

async function handleKetHon(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  if (message.type !== MessageType.GroupMessage) {
    return api.sendMessage({ msg: "❌ Cầu hôn chỉ có hiệu lực trong nhóm!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const mentionObj = message.data.mentions?.[0];
  const mentioned = mentionObj?.uid;
  if (!mentioned) {
    return api.sendMessage({ msg: `❌ Cú pháp: ${prefix}tl kethon @người_chơi\n💰 Lệ phí kết hôn: ${formatNumber(MARRIAGE_COST)} LT`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const myKey = resolvePlayerKey(senderId);
  const targetKey = resolvePlayerKey(mentioned.toString());
  if (targetKey === myKey) {
    return api.sendMessage({ msg: "❌ Không thể tự cầu hôn với chính mình!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (getMarriageOf(myKey)) {
    return api.sendMessage({ msg: "❌ Bạn đã có đạo lữ rồi! Chung tình chút nhé 💔", quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (getMarriageOf(targetKey)) {
    return api.sendMessage({ msg: "❌ Đạo hữu này đã có đạo lữ rồi! Đừng làm kẻ thứ ba 🙈", quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if ((p.spiritStones || 0) < MARRIAGE_COST) {
    return api.sendMessage({ msg: `❌ Không đủ lệ phí kết hôn! Cần ${formatNumber(MARRIAGE_COST)} LT, bạn có ${formatNumber(p.spiritStones || 0)} LT.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (pendingProposals[targetKey]) {
    return api.sendMessage({ msg: "⚠️ Đạo hữu này đang có lời cầu hôn khác chờ trả lời!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const fromName = message.data.dName || senderId;
  const toName = getTargetName(message, mentioned.toString(), senderId);
  pendingProposals[targetKey] = { from: myKey, fromZalo: String(senderId), toZalo: String(mentioned), threadId: message.threadId, type: message.type };
  setTimeout(() => { delete pendingProposals[targetKey]; }, 120000);

  const msg = `💞 LỜI CẦU HÔN TU TIÊN!
━━━━━━━━━━━━━━━━
🌹 ${fromName} muốn cùng @${toName} kết làm đạo lữ!
💰 Lệ phí: ${formatNumber(MARRIAGE_COST)} LT (người cầu hôn trả)
━━━━━━━━━━━━━━━━
💡 @${toName} gõ ${prefix}tl dongy để đồng ý
🍃 hoặc ${prefix}tl tuchoi để từ chối (hết hạn sau 2 phút)
✨ Kết hôn xong: đạo lữ hưởng 50% EXP bí cảnh của nhau + bonus EXP theo cấp!`;
  await api.sendMessage({
    msg,
    mentions: [{ pos: msg.indexOf(`@${toName}`), uid: mentioned.toString(), len: toName.length + 1 }],
    quote: message, ttl: 120000,
  }, message.threadId, message.type);
}

async function handleHonDongY(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  const myKey = resolvePlayerKey(senderId);
  const proposal = pendingProposals[myKey];
  if (!proposal) {
    return api.sendMessage({ msg: `❌ Bạn không có lời cầu hôn nào! (Hết hạn sau 2 phút)\n💡 ${prefix}tl kethon @user để cầu hôn ai đó.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  delete pendingProposals[myKey];

  const proposer = getPlayer(proposal.from);
  if (getMarriageOf(myKey)) {
    return api.sendMessage({ msg: "❌ Bạn đã có đạo lữ rồi!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (getMarriageOf(proposal.from)) {
    return api.sendMessage({ msg: "❌ Ngươi cầu hôn đã có đạo lữ rồi!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if ((proposer.spiritStones || 0) < MARRIAGE_COST) {
    return api.sendMessage({ msg: `❌ Người cầu hôn không còn đủ ${formatNumber(MARRIAGE_COST)} LT lệ phí!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  proposer.spiritStones -= MARRIAGE_COST;
  proposer.marriageKey = `${proposal.from}+${myKey}`;
  p.marriageKey = proposer.marriageKey;
  const marriages = getMarriages();
  marriages[proposer.marriageKey] = {
    a: proposal.from,
    b: myKey,
    bond: 0,
    since: Date.now(),
    lastSongTu: {},
  };
  saveData();

  const fromName = await getPlayerDisplayName(api, proposal.from);
  const toName = message.data.dName || "Đạo hữu";
  const msg = `🎉 CHÚC MỪNG ĐẠO LỮ KẾT NGHIỆP!
━━━━━━━━━━━━━━━━
💞 ${fromName} ❤ ${toName} đã chính thức kết làm đạo lữ!
💰 Lệ phí: ${formatNumber(MARRIAGE_COST)} LT đã được chi trả
📊 Cấp hôn nhân: 1 (+5% EXP bế quan & bí cảnh)
━━━━━━━━━━━━━━━━
💡 Hai người gõ ${prefix}tl songtu để song tu tăng độ gắn bó!
🙏 Chúc đôi đạo lữ tu tiên trường cửu, đồng sinh cộng tử!`;
  await api.sendMessage({ msg, quote: message, ttl: 120000 }, message.threadId, message.type);
}

async function handleHonTuChoi(api, message, p, senderId) {
  const myKey = resolvePlayerKey(senderId);
  const proposal = pendingProposals[myKey];
  if (!proposal) {
    return api.sendMessage({ msg: "❌ Bạn không có lời cầu hôn nào để từ chối!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  delete pendingProposals[myKey];

  const fromName = await getPlayerDisplayName(api, proposal.from);
  const toName = message.data.dName || "Đạo hữu";
  const msg = `🍃 ${toName} đã TỪ CHỐI lời cầu hôn của ${fromName}.
💔 Duyên chưa tới, đạo tâm chưa hợp...`;
  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

async function showMarriageInfo(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  const myKey = resolvePlayerKey(senderId);
  const m = getMarriageOf(myKey);
  if (!m) {
    return api.sendMessage({
      msg: `💔 BẠN CHƯA CÓ ĐẠO LỮ!
━━━━━━━━━━━━━━━━
💡 ${prefix}tl kethon @user — Cầu hôn (${formatNumber(MARRIAGE_COST)} LT)
✨ Quyền lợi: song tu nhận EXP kép, +5% EXP/cấp khi bế quan & bí cảnh`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  const partnerKey = m.a === myKey ? m.b : m.a;
  const partnerName = await getPlayerDisplayName(api, partnerKey);
  const lvl = getMarriageLevel(m);
  const bondInLvl = (m.bond || 0) % BOND_PER_LEVEL;
  const bar = "█".repeat(Math.floor(bondInLvl / (BOND_PER_LEVEL / 10))) + "░".repeat(10 - Math.floor(bondInLvl / (BOND_PER_LEVEL / 10)));
  const remainMs = getSongTuRemainMs(myKey);
  const days = Math.floor((Date.now() - m.since) / 86400000);

  const msg = `💞 HÔN NHÂN TU TIÊN
━━━━━━━━━━━━━━━━
❤ Đạo lữ: ${partnerName}
📅 Kết hôn được: ${days} ngày
📊 Cấp hôn nhân: ${lvl}/${MARRIAGE_MAX_LEVEL} (+${lvl * 5}% EXP)
🔗 Độ gắn bó: ${m.bond || 0} [${bar}] ${bondInLvl}/${BOND_PER_LEVEL}
⏳ Song tu với đạo lữ: ${remainMs > 0 ? `chờ ${Math.ceil(remainMs / 60000)}p nữa` : "sẵn sàng (có bonus!)"}
━━━━━━━━━━━━━━━━
💡 ${prefix}tl songtu @${partnerName} — Song tu cùng đạo lữ
💔 ${prefix}tl lyhon — Xin ly hôn (${formatNumber(DIVORCE_COST)} LT)`;
  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

function songTuBlockedReason(pl) {
  if (pl.beguan?.startedAt) return "đang bế quan";
  if (pl.inSecretRealm) return "đang ở Bí Cảnh";
  if (pl.trongThuongUntil && Date.now() < pl.trongThuongUntil) return "đang trọng thương";
  return null;
}

function getSongTuRemainMs(playerKey) {
  const data = loadData();
  const pl = data.players[playerKey];
  const last = pl?.lastSongTu || 0;
  return SONGTU_COOLDOWN_MS - (Date.now() - last);
}

async function handleSongTu(api, message, p, senderId, sub2) {
  const prefix = getGlobalPrefix();
  const myKey = resolvePlayerKey(senderId);

  if (sub2 === "dongy" || sub2 === "ok") {
    return handleSongTuAccept(api, message, p, senderId, myKey);
  }

  if (sub2 === "honnhan" || sub2 === "info" || sub2 === "tt") {
    return showMarriageInfo(api, message, p, senderId);
  }

  const mentionObj = message.data.mentions?.[0];
  if (!mentionObj?.uid || sub2 === "huy") {
    return api.sendMessage({
      msg: `⚡ SONG TU
━━━━━━━━━━━━━━━━
${prefix}tl songtu @user — Mời ai đó song tu (cả 2 vào bế quan chung)
${prefix}tl songtu dongy — Chấp nhận lời mời (hết hạn 2 phút)
${prefix}tl kethon @user — Kết hôn (hệ thống riêng, passive +EXP vĩnh viễn)
━━━━━━━━━━━━━━━━
⏰ Hồi chiêu song tu: 30 phút
✨ Song tu xong mỗi người +35% EXP khi stop bế quan
💞 Đạo lữ kết hôn: đi bí cảnh về, đối phương được hưởng +50% EXP!`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  if (message.type !== MessageType.GroupMessage) {
    return api.sendMessage({ msg: "❌ Song tu chỉ có hiệu lực trong nhóm!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const targetKey = resolvePlayerKey(mentionObj.uid.toString());
  if (targetKey === myKey) {
    return api.sendMessage({ msg: "❌ Không thể tự song tu một mình!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const remainMs = getSongTuRemainMs(myKey);
  if (remainMs > 0) {
    return api.sendMessage({ msg: `⏳ Vừa song tu xong mà! Chờ ${Math.ceil(remainMs / 60000)} phút nữa.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const blocked = songTuBlockedReason(p);
  if (blocked) {
    return api.sendMessage({ msg: `❌ Bạn ${blocked}, không thể song tu lúc này!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (pendingSongTu[targetKey]) {
    return api.sendMessage({ msg: "⚠️ Đạo hữu này đã có lời mời song tu khác chờ trả lời!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const targetName = getTargetName(message, mentionObj.uid.toString(), senderId);
  pendingSongTu[targetKey] = { from: myKey, fromZalo: String(senderId), threadId: message.threadId };
  setTimeout(() => { delete pendingSongTu[targetKey]; }, 120000);

  const myName = message.data.dName || "Đạo hữu";
  const msg = `⚡ LỜI MỜI SONG TU!
━━━━━━━━━━━━━━━━
🌀 ${myName} muốn rủ @${targetName} cùng song tu!
🧘 Đồng ý thì CẢ HAI sẽ tiến vào bế quan chung (tối đa 60p)
✨ Khi stop bế quan, mỗi người nhận +35% EXP
⏰ Hết hạn sau 2 phút
━━━━━━━━━━━━━━━━
💡 @${targetName} gõ ${prefix}tl songtu dongy để đồng ý`;
  await api.sendMessage({
    msg,
    mentions: [{ pos: msg.indexOf(`@${targetName}`), uid: mentionObj.uid.toString(), len: targetName.length + 1 }],
    quote: message, ttl: 120000,
  }, message.threadId, message.type);
}

async function handleSongTuAccept(api, message, p, senderId, myKey) {
  const prefix = getGlobalPrefix();
  const req = pendingSongTu[myKey];
  if (!req) {
    return api.sendMessage({ msg: `❌ Bạn không có lời mời song tu nào! (Hết hạn sau 2 phút)\n💡 ${prefix}tl songtu @user để mời ai đó.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  delete pendingSongTu[myKey];

  const partnerKey = req.from;
  const partner = getPlayer(partnerKey);

  const remainMe = getSongTuRemainMs(myKey);
  const remainPartner = getSongTuRemainMs(partnerKey);
  if (remainMe > 0) {
    return api.sendMessage({ msg: `⏳ Bạn còn hồi chiêu ${Math.ceil(remainMe / 60000)} phút nữa!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (remainPartner > 0) {
    return api.sendMessage({ msg: `❌ Đối phương còn hồi chiêu ${Math.ceil(remainPartner / 60000)} phút!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const blockedMe = songTuBlockedReason(p);
  if (blockedMe) {
    return api.sendMessage({ msg: `❌ Bạn ${blockedMe}, không thể song tu!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  const blockedPartner = songTuBlockedReason(partner);
  if (blockedPartner) {
    return api.sendMessage({ msg: `❌ Đối phương ${blockedPartner}, không thể song tu lúc này!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  // Cả hai cùng tiến vào bế quan song tu — khi stop nhận +35% EXP
  const now = Date.now();
  p.beguan = { startedAt: now, threadId: message.threadId, threadType: message.type, reminded: false, songTu: true, songTuPartner: partnerKey };
  partner.beguan = { startedAt: now, threadId: message.threadId, threadType: message.type, reminded: false, songTu: true, songTuPartner: myKey };
  p.lastSongTu = now;
  partner.lastSongTu = now;
  saveData();

  const partnerName = await getPlayerDisplayName(api, partnerKey);
  const myName = message.data.dName || "Đạo hữu";

  const msg = `🌀 SONG TU BẮT ĐẦU!
━━━━━━━━━━━━━━━━
⚡ ${myName} × ${partnerName} đã nhập định song tu!
⏰ Thời gian: tối đa 60 phút (như bế quan thường)
✨ Khi ${prefix}tl stop sẽ nhận +35% EXP
💎 Vẫn nhận Linh Thạch như bế quan thường
━━━━━━━━━━━━━━━━
⚠️ Ai cũng phải tự ${prefix}tl stop để thu hoạch phần của mình!
💥 Quá 60 phút không stop vẫn TẨU HỎA như bình thường!`;
  await api.sendMessage({ msg, quote: message, ttl: 120000 }, message.threadId, message.type);
}

// ── STREAK GIỮ CHUỖI ĐIỂM DANH ──────────────────────────────
const STREAK_MILESTONES = [
  { day: 3, reward: 30000000 },
  { day: 10, reward: 100000000 },
  { day: 50, reward: 500000000 },
  { day: 100, reward: 10000000000 },
  { day: 200, reward: 20000000000 },
];

function clearStreak(player) {
  player.streakPartner = null;
  player.streakDay = 0;
  player.streakStart = "";
  player.lastStreakCheck = "";
  player.streakFullLastDay = "";
  player.streakClaimedMilestones = [];
}

async function handleStreak(api, message, p, senderId, sub2) {
  const prefix = getGlobalPrefix();
  const myKey = resolvePlayerKey(senderId);

  if (sub2 === "ok" || sub2 === "dongy") {
    return handleStreakAccept(api, message, p, senderId, myKey);
  }

  if (sub2 === "info" || sub2 === "tt" || sub2 === "status") {
    return showStreakInfo(api, message, p, senderId, myKey);
  }

  if (sub2 === "huy") {
    return handleStreakCancel(api, message, p, senderId, myKey);
  }

  const mentionObj = message.data.mentions?.[0];

  if (mentionObj?.uid) {
    return handleStreakInvite(api, message, p, senderId, myKey, mentionObj);
  }

  return handleStreakCheckin(api, message, p, senderId, myKey, prefix);
}

async function handleStreakCancel(api, message, p, senderId, myKey) {
  const prefix = getGlobalPrefix();
  if (p.streakPartner) {
    const partner = getPlayer(p.streakPartner);
    if (partner) {
      clearStreak(p);
      clearStreak(partner);
      saveData();
    }
    return api.sendMessage({
      msg: `💔 BẠN ĐÃ HUỶ GIỮ CHUỖI!
━━━━━━━━━━━━━━━━
👥 Bạn và đối phương đã tan cặp.
💡 ${prefix}tl streak @user — Mời ai đó giữ chuỗi mới`,
      quote: message, ttl: 20000,
    }, message.threadId, message.type);
  }
  if (pendingStreak[myKey]) {
    delete pendingStreak[myKey];
    return api.sendMessage({ msg: `✅ Đã hủy lời mời giữ chuỗi đang chờ!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (Object.values(pendingStreak).some(r => r.from === myKey)) {
    for (const [k, v] of Object.entries(pendingStreak)) {
      if (v.from === myKey) delete pendingStreak[k];
    }
    return api.sendMessage({ msg: `✅ Đã hủy lời mời giữ chuỗi bạn đã gửi đi!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  return api.sendMessage({ msg: `❌ Bạn không có chuỗi hay lời mời nào để hủy!`, quote: message, ttl: 15000 }, message.threadId, message.type);
}

async function showStreakInfo(api, message, p, senderId, myKey) {
  const prefix = getGlobalPrefix();
  const today = getDateKey();

  if (!p.streakPartner) {
    const pendingOut = Object.entries(pendingStreak).some(([k, v]) => v.from === myKey);
    const invited = Object.prototype.hasOwnProperty.call(pendingStreak, myKey);
    return api.sendMessage({
      msg: `🔥 TRẠNG THÁI GIỮ CHUỖI
━━━━━━━━━━━━━━━━
👥 Bạn hiện CHƯA giữ chuỗi với ai.
${pendingOut ? `📤 Bạn đang có lời mời chờ đối phương trả lời (${prefix}tl streak huy để hủy).` : ""}${invited ? `📥 Ai đó đang mời bạn giữ chuỗi! Gõ ${prefix}tl streak ok để đồng ý.` : ""}
━━━━━━━━━━━━━━━━
💡 ${prefix}tl streak @user — Mời ai đó cùng giữ chuỗi`,
      quote: message, ttl: 20000,
    }, message.threadId, message.type);
  }

  const partner = getPlayer(p.streakPartner);
  const partnerName = await getPlayerDisplayName(api, p.streakPartner);
  const myChecked = p.lastStreakCheck === today;
  const hydChecked = partner.lastStreakCheck === today;
  const nextMilestone = STREAK_MILESTONES.find(m => !(p.streakClaimedMilestones || []).includes(m.day));

  let msg = `🔥 TRẠNG THÁI GIỮ CHUỖI
━━━━━━━━━━━━━━━━
👥 Bạn × ${partnerName}
🔥 Chuỗi hiện tại: ${p.streakDay || 0} ngày
📅 Bắt đầu: ${p.streakStart ? formatDateKey(p.streakStart) : "—"}
✅ Bạn: ${myChecked ? "đã" : "chưa"} điểm danh hôm nay
✅ Đối phương: ${hydChecked ? "đã" : "chưa"} điểm danh hôm nay
━━━━━━━━━━━━━━━━
🏆 Mốc tiếp theo: ${nextMilestone ? `${nextMilestone.day} ngày (+${formatNumber(nextMilestone.reward)} LT)` : "đã đạt tất cả mốc!"}`;

  if (!myChecked || !hydChecked) {
    msg += `\n💥 Nhớ cả 2 đều gõ ${prefix}tl streak hôm nay, kẻo chuỗi đứt!`;
  }
  msg += `\n━━━━━━━━━━━━━━━━
💡 ${prefix}tl streak huy — Huỷ giữ chuỗi với đối phương`;

  await api.sendMessage({ msg, quote: message, ttl: 20000 }, message.threadId, message.type);
}

async function handleStreakInvite(api, message, p, senderId, myKey, mentionObj) {
  const prefix = getGlobalPrefix();

  if (message.type !== MessageType.GroupMessage) {
    return api.sendMessage({ msg: "❌ Giữ chuỗi chỉ hoạt động trong nhóm!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const targetKey = resolvePlayerKey(mentionObj.uid.toString());
  if (targetKey === myKey) {
    return api.sendMessage({ msg: "❌ Không thể tự mời giữ chuỗi với chính mình!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const target = getPlayer(targetKey);
  if (target.streakPartner) {
    return api.sendMessage({ msg: "❌ Đạo hữu này đã có người giữ chuỗi rồi!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (pendingStreak[targetKey]) {
    return api.sendMessage({ msg: "⚠️ Đạo hữu này đã có lời mời giữ chuỗi khác chờ trả lời!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const targetName = getTargetName(message, mentionObj.uid.toString(), senderId);
  const myName = message.data.dName || "Đạo hữu";
  pendingStreak[targetKey] = { from: myKey, fromZalo: String(senderId), threadId: message.threadId };
  setTimeout(() => { delete pendingStreak[targetKey]; }, 120000);

  const msg = `🔥 LỜI MỜI GIỮ CHUỖI!
━━━━━━━━━━━━━━━━
👥 ${myName} muốn cùng @${targetName} giữ chuỗi điểm danh mỗi ngày!
📅 Mỗi ngày CẢ HAI đều phải gõ ${prefix}tl streak để không đứt chuỗi
🏆 Các mốc chuỗi: 3 ngày (30M LT) | 10 ngày (100M) | 50 ngày (500M) | 100 ngày (10B) | 200 ngày (20B)
⏰ Lời mời hết hạn sau 2 phút
━━━━━━━━━━━━━━━━
💡 @${targetName} gõ ${prefix}tl streak ok để đồng ý giữ chuỗi`;

  await api.sendMessage({
    msg,
    mentions: [{ pos: msg.indexOf(`@${targetName}`), uid: mentionObj.uid.toString(), len: targetName.length + 1 }],
    quote: message, ttl: 120000,
  }, message.threadId, message.type);
}

async function handleStreakAccept(api, message, p, senderId, myKey) {
  const prefix = getGlobalPrefix();
  const req = pendingStreak[myKey];
  if (!req) {
    return api.sendMessage({ msg: `❌ Bạn không có lời mời giữ chuỗi nào đang chờ!\n💡 ${prefix}tl streak @user để mời ai đó.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  delete pendingStreak[myKey];

  const partnerKey = req.from;
  const partner = getPlayer(partnerKey);

  clearStreak(p);
  clearStreak(partner);
  p.streakPartner = partnerKey;
  partner.streakPartner = myKey;
  p.streakDay = 1;
  partner.streakDay = 1;
  p.streakStart = getDateKey();
  partner.streakStart = getDateKey();
  p.lastStreakCheck = getDateKey();
  partner.lastStreakCheck = getDateKey();
  p.streakFullLastDay = getDateKey();
  partner.streakFullLastDay = getDateKey();
  saveData();

  const partnerName = await getPlayerDisplayName(api, partnerKey);
  const myName = message.data.dName || "Đạo hữu";

  const msg = `🔥 BẮT ĐẦU GIỮ CHUỖI!
━━━━━━━━━━━━━━━━
👥 ${myName} × ${partnerName} chính thức kết duyên giữ chuỗi!
🔥 Chuỗi hiện tại: 1 ngày (bắt đầu hôm nay)
📅 Mỗi ngày cả 2 đều gõ ${prefix}tl streak để giữ chuỗi
💥 Ai bỏ lỡ 1 ngày → chuỗi đứt, tan cặp phải mời lại!
━━━━━━━━━━━━━━━━
🏆 Mốc chuỗi: 3/10/50/100/200 ngày → thưởng CẢ HAI`;
  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

async function handleStreakCheckin(api, message, p, senderId, myKey, prefix) {
  const today = getDateKey();

  if (!p.streakPartner) {
    return api.sendMessage({
      msg: `🔥 GIỮ CHUỖI ĐIỂM DANH
━━━━━━━━━━━━━━━━
👥 ${prefix}tl streak @user — Mời ai đó cùng giữ chuỗi
💡 Cả 2 mỗi ngày đều gõ ${prefix}tl streak để không đứt chuỗi
🏆 Mốc: 3 ngày (30M LT) | 10 ngày (100M) | 50 ngày (500M) | 100 ngày (10B) | 200 ngày (20B) — thưởng CẢ HAI
💥 Ai bỏ lỡ ngày → đứt chuỗi, tan cặp!`,
      quote: message, ttl: 20000,
    }, message.threadId, message.type);
  }

  const partnerKey = p.streakPartner;
  const partner = getPlayer(partnerKey);

  if (p.lastStreakCheck === today) {
    const partnerChecked = partner.lastStreakCheck === today;
    return api.sendMessage({
      msg: `⏰ BẠN ĐÃ ĐIỂM DANH GIỮ CHUỖI HÔM NAY!
━━━━━━━━━━━━━━━━
🔥 Chuỗi hiện tại: ${p.streakDay || 0} ngày
✅ Bạn: đã điểm danh
${partnerChecked ? "✅ Đối phương: đã điểm danh" : "⏳ Đối phương: chưa điểm danh hôm nay"}
💡 Quay lại sau 00:00 hoặc chờ đối phương điểm danh.`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  p.lastStreakCheck = today;
  saveData();

  if (partner.lastStreakCheck !== today) {
    return api.sendMessage({
      msg: `✅ BẠN ĐÃ ĐIỂM DANH GIỮ CHUỖI HÔM NAY!
━━━━━━━━━━━━━━━━
🔥 Chuỗi: ${p.streakDay || 0} ngày
⏳ Đối phương chưa điểm danh hôm nay.
💡 Đợi đối phương gõ ${prefix}tl streak — khi cả 2 xác nhận, chuỗi sẽ +1 ngày.`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const yesterdayKey = getDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const consecutive = p.streakDay > 0 && p.streakFullLastDay === yesterdayKey && partner.streakFullLastDay === yesterdayKey;

  if (consecutive) {
    p.streakDay = p.streakDay + 1;
    partner.streakDay = p.streakDay;
  } else {
    p.streakDay = 1;
    partner.streakDay = 1;
  }

  p.streakFullLastDay = today;
  partner.streakFullLastDay = today;
  if (!Array.isArray(p.streakClaimedMilestones)) p.streakClaimedMilestones = [];
  if (!Array.isArray(partner.streakClaimedMilestones)) partner.streakClaimedMilestones = [];

  const newMilestones = STREAK_MILESTONES
    .filter(m => !p.streakClaimedMilestones.includes(m.day) && p.streakDay >= m.day)
    .sort((a, b) => a.day - b.day);

  for (const m of newMilestones) {
    p.spiritStones = (p.spiritStones || 0) + m.reward;
    partner.spiritStones = (partner.spiritStones || 0) + m.reward;
    p.streakClaimedMilestones.push(m.day);
    partner.streakClaimedMilestones.push(m.day);
  }

  const partnerName = await getPlayerDisplayName(api, partnerKey);
  const myName = message.data.dName || "Đạo hữu";

  if (!consecutive) {
    clearStreak(p);
    clearStreak(partner);
    saveData();
    const msg = `💥 CHUỖI ĐÃ ĐỨT!
━━━━━━━━━━━━━━━━
😢 ${myName} × ${partnerName}, có người đã bỏ lỡ 1 ngày điểm danh khiến chuỗi đứt.
🔥 Cả 2 tan cặp và phải mời lại từ đầu!
━━━━━━━━━━━━━━━━
💡 ${prefix}tl streak @user — Mời ai đó giữ chuỗi mới`;
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }

  saveData();

  let msg = `🔥 GIỮ CHUỖI THÀNH CÔNG!
━━━━━━━━━━━━━━━━
👥 ${myName} × ${partnerName}
🔥 Chuỗi hiện tại: ${p.streakDay} ngày
📅 Ngày bắt đầu: ${formatDateKey(p.streakStart)}
✅ Cả 2 đều đã điểm danh hôm nay!`;

  if (newMilestones.length > 0) {
    msg += `\n━━━━━━━━━━━━━━━━\n🎉 MỐC CHUỖI ĐẠT ĐƯỢC!`;
    for (const m of newMilestones) {
      msg += `\n🏆 ${m.day} ngày: +${formatNumber(m.reward)} LT (cả 2)`;
    }
  }

  msg += `\n━━━━━━━━━━━━━━━━
💡 Quay lại mỗi ngày gõ ${prefix}tl streak để giữ chuỗi!`;

  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}


async function handleLyHon(api, message, p, senderId, sub2) {
  const prefix = getGlobalPrefix();
  const myKey = resolvePlayerKey(senderId);
  const m = getMarriageOf(myKey);
  if (!m) {
    return api.sendMessage({ msg: "❌ Bạn chưa kết hôn với ai mà!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const partnerKey = m.a === myKey ? m.b : m.a;

  if (sub2 === "ok") {
    const pairKey = `${m.a}+${m.b}`;
    const divorce = pendingDivorces[pairKey];
    if (!divorce) {
      return api.sendMessage({ msg: "❌ Không có lời xin ly hôn nào đang chờ!", quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if (divorce.initiator === myKey) {
      return api.sendMessage({ msg: "❌ Bạn không thể tự xác nhận lời ly hôn của mình!", quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    const initiator = getPlayer(divorce.initiator);
    if ((initiator.spiritStones || 0) < DIVORCE_COST) {
      return api.sendMessage({ msg: `❌ Người xin ly hôn không đủ ${formatNumber(DIVORCE_COST)} LT phí! Đành phải tiếp tục làm đạo lữ vậy 😅`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    initiator.spiritStones -= DIVORCE_COST;
    initiator.marriageKey = null;
    p.marriageKey = null;
    delete getMarriages()[divorce.pairKey];
    delete pendingDivorces[divorce.pairKey];
    saveData();

    const iniName = await getPlayerDisplayName(api, divorce.initiator);
    const msg = `📜 LY HÔN TU TIÊN!
━━━━━━━━━━━━━━━━
💔 ${iniName} và ${message.data.dName || "Đạo hữu"} đã chính thức đường ai nấy đi.
💰 Phí ly hôn: ${formatNumber(DIVORCE_COST)} LT
🌫️ Duyên tận đó, xin chúc hai người tu đạo an nhàn...`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  if (sub2 === "huy") {
    const divorce = Object.values(pendingDivorces).find(d => d.pairKey === `${m.a}+${m.b}`);
    if (!divorce) {
      return api.sendMessage({ msg: "❌ Không có lời xin ly hôn nào để hủy!", quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    delete pendingDivorces[divorce.pairKey];
    return api.sendMessage({ msg: "💞 Đã hủy lời xin ly hôn! Chúc hai người hòa thuận.", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const pairKey = `${m.a}+${m.b}`;
  if (pendingDivorces[pairKey]) {
    const byMe = pendingDivorces[pairKey].initiator === myKey;
    return api.sendMessage({
      msg: byMe
        ? `⏳ Bạn đã xin ly hôn rồi! Chờ đối phương gõ ${prefix}tl lyhon ok.\n💡 ${prefix}tl lyhon huy — Hủy nếu đổi ý`
        : `⚠️ Đạo lữ của bạn đang xin ly hôn! Gõ ${prefix}tl lyhon ok để đồng ý.`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }
  if ((p.spiritStones || 0) < DIVORCE_COST) {
    return api.sendMessage({ msg: `❌ Không đủ phí ly hôn! Cần ${formatNumber(DIVORCE_COST)} LT.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  pendingDivorces[pairKey] = { pairKey, initiator: myKey, at: Date.now() };
  setTimeout(() => { delete pendingDivorces[pairKey]; }, 120000);
  const partnerName = await getPlayerDisplayName(api, partnerKey);
  const msg = `💔 XIN LY HÔN!
━━━━━━━━━━━━━━━━
😢 ${message.data.dName || "Đạo hữu"} muốn ly hôn với ${partnerName}...
━━━━━━━━━━━━━━━━
💡 ${partnerName} gõ ${prefix}tl lyhon ok trong 2 phút để đồng ý
🍃 Hoặc người xin gõ ${prefix}tl lyhon huy để hủy
💰 Phí ly hôn ${formatNumber(DIVORCE_COST)} LT do người xin trả`;
  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

export async function handleTuLuyenCommand(api, message, groupSettings) {
  const senderId = message.data.uidFrom;
  const threadId = message.threadId;

  syncExternalFiles();
  const prefix = getGlobalPrefix();
  let raw = message.data.content;
  let content = (typeof raw === "string" ? raw : raw?.title || "").trim();
  if (!content || !content.startsWith(prefix)) return;

  const parts = removeMention(message)
    .slice(prefix.length)
    .trim()
    .split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const sub = parts[1] ? parts[1].toLowerCase() : "";
  const sub2 = parts[2] ? parts[2] : "";
  const sub3 = parts[3] || "";
  const sub4 = parts[4] || "";

  if (cmd !== "tl" && cmd !== "dp") return;

  if (message.type === MessageType.GroupMessage && groupSettings) {
    const isAdminLevelHighest = isAdmin(senderId);
    if (!isAdminLevelHighest) {
      const gs = groupSettings[threadId];
      if (!gs || gs.activeBot !== true || gs.activeGame !== true) {
        return;
      }
    }
  }

  const cmdKey = `${cmd} ${sub} ${sub2 || ""}`.trim();
  const spam = checkCommandSpam(senderId, cmdKey, message.data.dName);
  if (spam.level === 1) {
    const reason = spam.type === "repeat"
      ? `Bạn đang lặp lệnh **${spam.key}** liên tục quá nhiều lần!`
      : `Bạn đang thao tác **${spam.key}** quá nhanh!`;
    await api.sendMessage({
      msg: `⚠️ CẢNH CÁO SPAM!
━━━━━━━━━━━━━━━━
${reason}
🚨 Cảnh cáo 1/2 — Nếu tiếp tục bạn sẽ bị chặn tương tác.`,
      quote: message, ttl: 30000,
    }, threadId, message.type);
  } else if (spam.level === 2) {
    const reason = spam.type === "repeat"
      ? `Lặp lệnh **${cmdKey}** liên tiếp quá nhiều lần`
      : `Spam lệnh **${cmdKey}** quá nhanh`;
    return api.sendMessage({
      msg: `🚫 BẠN ĐÃ BỊ KHÓA TƯƠNG TÁC BOT!
━━━━━━━━━━━━━━━━
Lý do: ${reason} bất chấp cảnh cáo.
🔒 Mọi lệnh tới bot của bạn đều bị chặn.
📞 Liên hệ QUẢN TRỊ VIÊN để được mở khóa.`,
      quote: message, ttl: 60000,
    }, threadId, message.type);
  }

  const p = getPlayer(senderId);

  regenStamina(p);

  if (p.banned) {
    return api.sendMessage(
      {
        msg: `🚫 TÀI KHOẢN ĐÃ BỊ KHÓA!
━━━━━━━━━━━━━━━━
Tài khoản của bạn đã bị quản trị viên khóa do vi phạm quy định.
📞 Liên hệ quản trị viên để được mở khóa.`,
        quote: message, ttl: 15000,
      },
      message.threadId,
      message.type,
    );
  }

  if (cmd === "tl") {
    try {
      await api.addReaction("GEM", message);
    } catch {}
  }

  if (cmd === "dp") {
    if (sub === "auto") {
      const val = (sub2 || "").toLowerCase();
      if (val === "on") { p.dpAuto = true; savePlayer(senderId); return api.sendMessage({ msg: "⚡ Đột Phá Auto: **BẬT**\n🔄 Tự động đột phá khi EXP đầy, dùng đan 4 để không bao giờ thất bại.", quote: message, ttl: 15000 }, message.threadId, message.type); }
      if (val === "off") { p.dpAuto = false; savePlayer(senderId); return api.sendMessage({ msg: "⚡ Đột Phá Auto: **TẮT**", quote: message, ttl: 15000 }, message.threadId, message.type); }
      return api.sendMessage({ msg: `⚡ Đột Phá Auto hiện tại: **${p.dpAuto ? "BẬT" : "TẮT"}**\nDùng: ${prefix}dp auto on/off`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    return handleDp(api, message, p, senderId);
  }

  switch (sub) {
    case "status":
    case "stats":
    case "i":
      return handleStats(api, message, p, senderId);
    case "top":
      if (sub2 === "donate" || sub2 === "don") return handleTopDonate(api, message, senderId);
      if (sub2 === "lt" || sub2 === "linhthach") return handleTopLt(api, message, senderId);
      if (sub2 === "lc" || sub2 === "lucchien" || sub2 === "luc") return handleTopLucChien(api, message, senderId);
      return handleTop(api, message, senderId);
    case "toplt":
      return handleTopLt(api, message, senderId);
    case "prime":
      return handlePrime(api, message, p, senderId);
    case "exp":
      return handleExpMultiplier(api, message, p, senderId, sub2);
    case "lx":
      return handleLixi(api, message, p, senderId, sub2, sub3);
    case "phanxet":
      return handlePhanXet(api, message, p, senderId);
    case "bag":
    case "b":
      return handleBag(api, message, p, senderId);
    case "wiki":
      return handleWiki(api, message, p, sub2, sub3);
    case "shop":
      return handleShop(api, message, p, senderId, sub2, sub3);
    case "buy":
      return handleBuy(api, message, p, senderId, sub2, sub3);
    case "luyendan":
    case "ldan":
      return handleLuyendan(api, message, p, senderId, sub2, sub3);
    case "tracuu":
      return handleTraCuu(api, message, p, senderId, sub2);
    case "map":
    case "bando":
      return handleMap(api, message, p, senderId);
    case "truyentong":
    case "dichuyen":
      return handleTruyenTong(api, message, p, senderId, sub2);
    case "dummy":
      return handleDummy(api, message, p, senderId, sub2);
    case "hochoi":
      return handleHoChoi(api, message, p, senderId);
    case "rutkiem":
      return handleRutKiem(api, message, p, senderId);
    case "thurut":
    case "thu_rut":
      return handleThuRut(api, message, p, senderId);
    case "gacha":
    case "roll":
      return handleGacha(api, message, p, senderId);
    case "attack":
    case "soul":
      return handleAttackSoul(api, message, p, senderId);
    case "exfire":
      return handleExFire(api, message, p, senderId);
    case "ghep":
    case "fusion":
      return handleGhepOden(api, message, p, senderId);
    case "thuctinh":
    case "thuc_tinh":
    case "awaken":
      return handleThucTinhOden(api, message, p, senderId);
    case "songtu":
      return handleSongTu(api, message, p, senderId, sub2);
    case "streak":
      return handleStreak(api, message, p, senderId, sub2);
    case "kethon":
    case "cuoi":
      return handleKetHon(api, message, p, senderId);
    case "dongy":
      return handleHonDongY(api, message, p, senderId);
    case "tuchoi":
      return handleHonTuChoi(api, message, p, senderId);
    case "lyhon":
      return handleLyHon(api, message, p, senderId, sub2);
    case "shopden":
      return handleShopDen(api, message, p, senderId, sub2, sub3, sub4);
    case "spawnboss":
      return handleSpawnBoss(api, message, p, senderId);
    case "danhboss":
      return handleDanhBoss(api, message, p, senderId);
    case "minigame":
      return handleMinigame(api, message, senderId);
    case "moqua":
      return handleMoQua(api, message, p, senderId, sub2);
    case "danhhieu":
    case "dh":
      return handleDanhhieu(api, message, p, senderId, sub2, sub3);
    case "equip":
      return handleEquip(api, message, p, senderId, sub2);
    case "unequip":
      return handleUnequip(api, message, p, senderId, sub2);
    case "upgrade":
    case "up":
      return handleUpgrade(api, message, p, senderId, sub2);
    case "use":
      return handleUse(api, message, p, senderId, sub2, sub3);
    case "bc":
      if (sub2 === "di" || sub2 === "go") return handleBcDi(api, message, p, senderId);
      if (sub2 === "ve" || sub2 === "v") return handleBcVe(api, message, p, senderId);
      if (sub2 && /^\d+$/.test(sub2)) return handleBcGo(api, message, p, senderId, parseInt(sub2));
      return handleBcList(api, message, p, senderId, sub2);
    case "go":
      return handleBcDi(api, message, p, senderId);
    case "v":
      return handleBcVe(api, message, p, senderId);
    case "pk":
      if (sub2 === "ok") return handlePkAccept(api, message, p, senderId);
      return handlePkChallenge(api, message, p, senderId, sub2);
    case "train":
      return handleTrain(api, message, p, senderId);
    case "fight":
      return handleFightTushita(api, message, p, senderId);
    case "phaptac":
      return handlePhapTac(api, message, p, senderId, sub2, sub3);
    case "bank":
      return handleBank(api, message, p, senderId, sub2, sub3);
    case "tubao":
      return handleTubao(api, message, p, senderId);
    case "tuongdai":
    case "tuong":
      return handleTuongDai(api, message);
    case "vieng":
      return handleVieng(api, message, p, senderId, sub2);
    case "daily":
      return handleDaily(api, message, p, senderId);
    case "thap":
      if (sub2 === "reset") return handleTowerReset(api, message, senderId);
      if (sub2 === "auto") return handleTowerAuto(api, message, p, senderId);
      if (sub2 === "challenge" || sub2 === "danh" || sub2 === "go" || sub2 === "di" || sub2 === "fight") return handleTowerChallenge(api, message, p, senderId);
      return handleTowerStatus(api, message, p, senderId);
    case "nhapdao":
      return handleNhapDao(api, message, p, senderId);
    case "nhapma":
      return handleNhapMa(api, message, p, senderId);
    case "nhapnho":
      return handleNhapNho(api, message, p, senderId);
    case "nhapyeu":
      return handleNhapYeu(api, message, p, senderId);
    case "nhaplo":
      return handleNhapLo(api, message, p, senderId);
    case "nhapquy":
      return handleNhapQuy(api, message, p, senderId);
    case "nhapphat":
      return handleNhapPhat(api, message, p, senderId);
    case "set":
      return handleSet(api, message, p, senderId, sub2, sub3);
    case "buff":
      return handleBuff(api, message, sub2, sub3, sub4);
    case "remove":
      return handleRemove(api, message, sub2, sub3, sub4);
    case "help":
    case "huongdan":
      return handleHelp(api, message, sub2);
    case "guiold":
      return handleGuiOld(api, message, p, senderId, sub2);
    case "phithang":
      return handlePhiThang(api, message, p, senderId);
    case "donate":
      return handleDonate(api, message, p, senderId);
    case "start":
      return handleBeguanStart(api, message, p, senderId);
    case "stop":
      return handleBeguanStop(api, message, p, senderId);
    case "beguan":
    case "bq":
      return handleBeguanStatus(api, message, p, senderId);
    case "update":
      return handleUpdate(api, message, senderId);
    case "dangky":
    case "dk":
      return handleDangKy(api, message, p, senderId, sub2, sub3);
    case "login":
      return handleLogin(api, message, p, senderId, sub2, sub3);
    case "dp":
      if (sub2 === "auto") {
        const val = (sub3 || "").toLowerCase();
        if (val === "on") { p.dpAuto = true; savePlayer(senderId); return api.sendMessage({ msg: "⚡ Đột Phá Auto: **BẬT**\n🔄 Tự động đột phá khi EXP đầy, dùng đan 4 để không bao giờ thất bại.", quote: message, ttl: 15000 }, message.threadId, message.type); }
        if (val === "off") { p.dpAuto = false; savePlayer(senderId); return api.sendMessage({ msg: "⚡ Đột Phá Auto: **TẮT**", quote: message, ttl: 15000 }, message.threadId, message.type); }
        return api.sendMessage({ msg: `⚡ Đột Phá Auto hiện tại: **${p.dpAuto ? "BẬT" : "TẮT"}**\nDùng: ${prefix}dp auto on/off`, quote: message, ttl: 15000 }, message.threadId, message.type);
      }
      return handleDp(api, message, p, senderId);
    case "banacc":
      return handleBanAcc(api, message, p, senderId);
    case "unban":
      return handleUnban(api, message, p, senderId);
    case "banbank":
      return handleBanBank(api, message, p, senderId);
    case "unbanbank":
      return handleUnbanBank(api, message, p, senderId);
    case "check":
      if (sub2 === "bank") return handleCheckBank(api, message, p, senderId);
      return handleCheckBuff(api, message, p, senderId);
    case "staff":
      return handleStaff(api, message, senderId, sub2);
    case "admin":
      return handleAdmin(api, message, senderId);
    case "fastsell":
    case "fast_sell":
    case "sale":
      return handleFastSell(api, message, p, senderId, sub2, sub3, sub4);
    default:
      if (!sub) return handleProfile(api, message, p, senderId);
      return handleHelp(api, message);
  }
}

const HELP_TOPICS = [
  {
    id: "coban",
    emoji: "📌",
    title: "CƠ BẢN",
    aliases: ["cb", "basic", "co_ban"],
    text: (p) => `${p}tl — Xem hồ sơ
${p}tl status — Chỉ số chi tiết
${p}tl daily — Nhận thưởng hàng ngày (LT + chuỗi ngày)
${p}tl top — Bảng xếp hạng top 20 (dạng ảnh)
${p}tl toplt — Top 20 tu sĩ giàu Linh Thạch nhất
${p}tl top donate — Top 20 donate
${p}tl bag — Túi đồ (alias: b)
${p}tl map — Bản đồ tu tiên giới
${p}tl truyentong <ID> — Dịch chuyển tới địa điểm
${p}tl dummy attack — Đánh mộc nhân thử dame thật (tại Dummy Trial)
${p}tl hochoi — Học hỏi tiền bối, +10% EXP đột phá/lần (10 lượt duy nhất cho tân nhân, tại Thánh Địa)
${p}tl minigame — Mở mini game 10 hộp quà (admin đặc biệt) • ${p}tl moqua <1-10> — Mở hộp
${p}tl use <ID> [sl] — Dùng đan
${p}dp — Đột phá (fail đại đột phá: trọng thương 1h + mất 30% EXP)
${p}tl guiold on/off — Đổi giao diện hồ sơ
💡 Mẹo: Đan 4 (Đột Phá Đan) mỗi viên +10% tỉ lệ đột phá, cộng dồn!`,
  },
  {
    id: "bicanh",
    emoji: "🌀",
    title: "BÍ CẢNH",
    aliases: ["bc", "secret"],
    text: (p) => `${p}tl go — Vào bí cảnh (alias: ${p}tl bc di)
${p}tl v — Rời bí cảnh (alias: ${p}tl bc ve)
${p}tl bc — Danh sách bí cảnh
${p}tl bc <số> — Chọn bí cảnh
💡 Ở bí cảnh càng lâu, nguyên liệu rơi càng nhiều và càng hiếm!`,
  },
  {
    id: "beguan",
    emoji: "🧘",
    title: "BẾ QUAN",
    aliases: ["bq", "bequan"],
    text: (p) => `${p}tl start — Bắt đầu bế quan (tối đa 60p, EXP nhiều hơn bí cảnh)
${p}tl stop — Kết thúc & thu hoạch EXP + vài trăm LT
${p}tl beguan — Xem trạng thái bế quan (alias: bq)
⚠️ Quá 60 phút chưa stop sẽ TẨU HỎA: không nhận được EXP + trọng thương 1h!
⏰ Bot nhắc trước khi hết giờ 5 phút.`,
  },
  {
    id: "chandau",
    emoji: "⚔️",
    title: "CHIẾN ĐẤU",
    aliases: ["pk", "combat", "chien_dau"],
    text: (p) => `${p}tl pk @user — Thách đấu
${p}tl pk ok — Chấp nhận PK
${p}tl train — Hắc Ám Động Loạn: đánh boss cùng cảnh giới (thắng mở boss mạnh hơn)
${p}tl thap — Xem Thiên Tầng Tháp
${p}tl thap challenge — Thách đấu chi tiết 1 tầng
${p}tl thap auto — Leo tự động (tốn thể lực)
${p}tl phaptac — Pháp Tắc tu luyện (từ cảnh 30)
${p}tl phaptac tuluyen <thoigian|khonggian|thoikhong> — Ngộ pháp tắc (1 lần duy nhất)
${p}tl phaptac nangcap — Nâng cấp pháp tắc bằng Linh Thạch
${p}tl tubao — Tú bảo
${p}tl tuongdai — Thánh Địa Tượng Đài (7 Chí Tôn, tối thiểu cảnh 60)
${p}tl vieng [1-7] — Viếng tượng (1M LT, mỗi ngày 1 lần, roll 1 trong 3 buff ngày: hút máu/HP/ATK 10%)
${p}tl phithang — Phi thăng (cảnh giới tối cao → Luyện Khí, +20% chỉ số vĩnh viễn)
${p}tl nhapdao / nhapma / nhapnho / nhapyeu / nhaplo / nhapquy / nhapphat — Nhập môn
💡 Đan 43 (Đơn Tâm Đan): đòn trúng gây tối thiểu 1.5% HP Boss trong Tháp!`,
  },
  {
    id: "gacha",
    emoji: "🎰",
    title: "GACHA & THẦN CHẾT",
    aliases: ["gacha", "roll", "soul"],
    text: (p) => `${p}tl gacha — Quay thưởng bằng xương (50 xương/lượt)
${p}tl roll — Alias của gacha
${p}tl attack soul — Triệu hồi & đánh Thần Chết (world boss, cần Soul)
${p}tl attack soul — Tấn công boss đã được triệu hồi (ai cũng đánh được)
${p}tl exfire — Đổi Kiếm Lửa (cần 2.5T LT + 1 Fire + 100 xương)
🦴 Xương: Rớt từ Bí Cảnh (40% chance, 70-140 xương)
👻 Soul: Nhận từ gacha → triệu hồi Thần Chết
🔥 Fire: Nhận từ gacha → đổi Kiếm Lửa
💀 Thần Chết: Rớt Lưỡi Hái Tử Thần (2% chance)
🔥 Kiếm Lửa: Thiêu đốt 1% HP địch/hệp, giảm 35% hút máu`,
  },
  {
    id: "shop",
    emoji: "🛒",
    title: "TRANG BỊ & VẬT PHẨM",
    aliases: ["cua_hang", "trangbi"],
    text: (p) => `${p}tl shop <vukhi/giap/kynang> — Cửa hàng
${p}tl buy <mã> [sl] — Mua
${p}tl equip <mã> — Trang bị vũ khí/giáp
${p}tl unequip <giap|mã> — Tháo trang bị
${p}tl wiki <thechat|huyetmach|linhcan|thienphu|giap|phat|ma|nho|yeu|lo|quy> — Tra cứu
${p}tl tracuu <mã> — Tra cứu vật phẩm
🔮 PHÁP BẢO
${p}tl shop phapbao — Tiệm Pháp Bảo
${p}tl equip <ID pb> — Trang bị Pháp Bảo
${p}tl unequip pb — Tháo Pháp Bảo
${p}tl unequip <ID pb> — Tháo Pháp Bảo cụ thể
🏆 DANH HIỆU
${p}tl danhhieu — Xem danh hiệu đang có
${p}tl danhhieu equip +<số> — Trang bị danh hiệu
${p}tl top lc — Top 20 Lực Chiến
⚗️ LUYỆN ĐAN
${p}tl luyendan — Xem công thức luyện đan
${p}tl luyendan ct <trang> — Xem trang công thức
${p}tl luyendan <ID đan> [sl] — Luyện đan (⚠️ thất bại vẫn mất nguyên liệu!)
${p}tl shop nguyenlieu — Tiệm tạp hóa mua nguyên liệu
🌑 SHOP ĐEN (restock 10p/lần, giá & hàng random)
${p}tl shopden — Xem hàng đang có
${p}tl shopden mua <số> [sl] — Mua theo số thứ tự`,
  },
  {
    id: "bank",
    emoji: "🏦",
    title: "TÀI CHÍNH & NẠP",
    aliases: ["taichinh", "donate", "finance"],
    text: (p) => `${p}tl bank nap <số> — Nạp LT vào bank
${p}tl bank rut <số> — Rút LT từ bank
${p}tl bank chuyen @user <só> — Chuyển LT (có thuế)
${p}tl donate — Cơ duyên tu tiên (bảng giá nạp & ưu đãi)
${p}tl prime — Xem hệ thống Prime
${p}tl lx @user <số> — Lì xì
${p}tl check bank — Xem lịch sử giao dịch bank`,
  },
  {
    id: "daoluu",
    emoji: "💞",
    title: "ĐẠO LỮ & SONG TU",
    aliases: ["honnhan", "marriage", "song_tu"],
    text: (p) => `⚡ SONG TU (bế quan chung)
${p}tl songtu @user — Mời ai đó song tu
${p}tl songtu dongy — Chấp nhận → cả 2 vào bế quan 60p
✨ Khi ${p}tl stop, mỗi người nhận +35% EXP
⏰ Hồi chiêu 30p • Quá giờ vẫn tẩu hỏa như bình thường

💞 KẾT HÔN (hệ thống riêng)
${p}tl kethon @user — Cầu hôn (${formatNumber(MARRIAGE_COST)} LT)
${p}tl dongy / ${p}tl tuchoi — Trả lời lời cầu hôn
${p}tl lyhon — Xin ly hôn • ${p}tl lyhon ok — Đồng ý
${p}tl songtu honnhan — Xem tình trạng hôn nhân
💡 Đi bí cảnh về, đạo lữ được hưởng +50% EXP bí cảnh của bạn (2 chiều)
💡 Mỗi cấp hôn nhân +5% EXP bế quan & bí cảnh (tối đa Lv.10, tăng độ gắn bó bằng song tu cùng nhau)`,
  },
  {
    id: "streak",
    emoji: "🔥",
    title: "GIỮ CHUỖI ĐIỂM DANH",
    aliases: ["chuoi", "diemdanh"],
    text: (p) => `👥 2 người cùng nhau giữ chuỗi điểm danh mỗi ngày
${p}tl streak @user — Mời ai đó cùng giữ chuỗi
${p}tl streak ok — Chấp nhận lời mời
${p}tl streak — Điểm danh giữ chuỗi (cả 2 đều phải gõ mỗi ngày)
${p}tl streak info — Xem trạng thái chuỗi hiện tại
${p}tl streak huy — Huỷ giữ chuỗi với đối phương
⏰ Hết hạn mời sau 2 phút
🏆 Mốc chuỗi (thưởng CẢ HAI):
• 3 ngày: +30M LT
• 10 ngày: +100M LT
• 50 ngày: +500M LT
• 100 ngày: +10B LT
• 200 ngày: +20B LT
💥 Nếu 1 trong 2 (hoặc cả 2) bỏ lỡ 1 ngày điểm danh → chuỗi ĐỨT, tan cặp phải mời lại từ đầu!`,
  },
  {
    id: "hotro",
    emoji: "🔐",
    title: "HỖ TRỢ & KHÁC",
    aliases: ["account", "taikhoan", "ho_tro"],
    text: (p) => `🔐 HỘ CHIẾU TU TIÊN (nhắn RIÊNG cho bot)
${p}tl dangky <tài khoản> <mật khẩu> — Đăng ký tài khoản (1 người/1 lần), sao lưu nhân vật
${p}tl login <tài khoản> <mật khẩu> — Đăng nhập trên Zalo khác
⚠️ Làm trong nhóm sẽ bị xóa tin nhắn!

📣 UPDATE
${p}tl update — Xem update mới
${p}tl update <nội dung> — Ghi update (admin)

🛡️ ADMIN
${p}tl set phucduyen/ngotinh <số> @user — Đặt chỉ số
${p}tl buff / remove / banacc / unban / banbank / unbanbank — Quản trị`,
  },
];

function findHelpTopic(key) {
  if (!key) return null;
  const k = String(key).toLowerCase().replace(/\s+/g, "");
  return HELP_TOPICS.find(t => t.id === k || t.aliases.includes(k)) || null;
}

async function handleHelp(api, message, topicKey) {
  const prefix = getGlobalPrefix();
  const topic = findHelpTopic(topicKey);

  if (!topic) {
    const unknownLine = topicKey ? `❌ Không có mục hướng dẫn "${topicKey}"!
━━━━━━━━━━━━━━━━
` : "";
    const lines = HELP_TOPICS.map(t => `${t.emoji} ${prefix}tl help ${t.id} — ${t.title}`);
    const msg = `⚔️ HƯỚNG DẪN GAME TU LUYỆN
━━━━━━━━━━━━━━━━
${unknownLine}📖 Các mục hướng dẫn:
${lines.join("\n")}
━━━━━━━━━━━━━━━━
💡 Dùng ${prefix}tl help <mục> để xem chi tiết. VD: ${prefix}tl help coban`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  const msg = `${topic.emoji} HƯỚNG DẪN — ${topic.title}
━━━━━━━━━━━━━━━━
${topic.text(prefix)}
━━━━━━━━━━━━━━━━
📑 Khác: ${HELP_TOPICS.filter(t => t.id !== topic.id).map(t => `${prefix}tl help ${t.id}`).join(" | ")}
✨ Chúc đạo hữu tu luyện thuận lợi!`;
  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleGuiOld(api, message, p, senderId, sub2) {
  const on = sub2 === "on" || sub2 === "bat" || sub2 === "1" || sub2 === "cu";
  const off = sub2 === "off" || sub2 === "tat" || sub2 === "0" || sub2 === "moi";

  if (!on && !off) {
    const prefix = getGlobalPrefix();
    return api.sendMessage({
      msg: `🖼️ GIAO DIỆN HỒ SƠ
━━━━━━━━━━━━━━━━
🎨 Hiện tại: ${p.guiold !== false ? "Profile CŨ (cổ điển)" : "Profile MỚI (vũ trụ xanh)"}
━━━━━━━━━━━━━━━━
${prefix}tl guiold on — Dùng profile cũ
${prefix}tl guiold off — Dùng profile mới`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  p.guiold = on;
  savePlayer(senderId);

  const msg = on
    ? `✅ ĐÃ BẬT PROFILE CŨ!
━━━━━━━━━━━━━━━━
🖼️ Hồ sơ của bạn sẽ dùng giao diện cổ điển.
💡 ${getGlobalPrefix()}tl để xem lại.`
    : `🆕 ĐÃ CHUYỂN SANG PROFILE MỚI!
━━━━━━━━━━━━━━━━
🌊 Giao diện vortex xanh dương, núi non hùng vĩ.
💡 ${getGlobalPrefix()}tl để xem lại.`;

  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

async function handleProfile(api, message, p, senderId) {
  let imagePath = null;
  try {
    let username = "Nguoi Choi";
    let avatarUrl = null;
    try {
      const userInfo = await api.getUserInfo(senderId);
      const profile = userInfo?.changed_profiles?.[senderId] || userInfo?.unchanged_profiles?.[senderId];
      if (profile) {
        username = profile.zaloName || profile.name || username;
        avatarUrl = profile.avatar || null;
      }
    } catch {}

    imagePath = await (p.guiold !== false ? generateProfileCardNew : generateProfileCardBlue)({ player: p, username, avatarUrl });
    await api.sendMessage(
      { msg: "", attachments: [imagePath], ttl: 60000, quote: message },
      message.threadId,
      message.type,
    );
  } catch (e) {
    console.error("Lỗi tạo ảnh profile tu-luyen:", e);
    await api.sendMessage(
      { msg: "❌ Lỗi khi tạo ảnh hồ sơ. Vui lòng thử lại sau.", quote: message, ttl: 15000 },
      message.threadId,
      message.type,
    );
  } finally {
    if (imagePath) {
      try { await clearImagePath(imagePath); } catch {}
    }
  }
}

async function handleStats(api, message, p, senderId) {
  const stats = calcStats(p);
  const realmDisplay = getRealmDisplayFull(p);
  const talent = TALENTS[p.talent] || TALENTS.pham;
  const theChat = THECHAT.find(t => t.id === p.theChat) || THECHAT[0];
  const huyetMach = HUYETMACH.find(h => h.id === p.huyetMach) || HUYETMACH[0];
  const linhCan = LINH_CAN.find(l => l.id === p.linhCan) || LINH_CAN[0];
  const weapon = p.equippedWeapon ? WEAPONS.find(w => w.id === p.equippedWeapon) : null;
  const armor = p.equippedArmor ? ARMORS.find(a => a.id === p.equippedArmor) : null;
  const wUpg = weapon ? getUpgradeLevel(p, weapon.id) : 0;
  const aUpg = armor ? getUpgradeLevel(p, armor.id) : 0;
  const weaponLine = weapon ? `${weapon.emoji} ${weapon.name}${wUpg > 0 ? ` [+${wUpg}]` : ""}` : "Chưa trang bị";
  const armorLine = armor ? `${armor.emoji} ${armor.name}${aUpg > 0 ? ` [+${aUpg}]` : ""}` : "Chưa trang bị";
  const daoLabel = getDaoDisplay(p.daotam);
  const primeLv = getPrimeLevel(p.donated || 0);
  const primeObj = PRIME.find(pr => pr.level === primeLv);
  const primeLine = primeLv > 0 && primeObj
    ? `👑 Prime ${primeLv} — 🏅 Danh hiệu "${primeObj.title}" (+${primeObj.statPct}% toàn chỉ số, +${primeObj.atkPct}% ATK)\n💰 Đã donate: ${formatNumber(p.donated || 0)}đ`
    : `👑 Chưa có Prime — 💰 Đã donate: ${formatNumber(p.donated || 0)}đ`;
  const trongThuongLine = p.trongThuongUntil && Date.now() < p.trongThuongUntil
    ? `\n💔 Trọng thương: còn ${Math.ceil((p.trongThuongUntil - Date.now()) / 60000)}p (đan 1 chữa trị)`
    : "";

  const bonusParts = [];
  const combine = (fn) => (fn(theChat) || 0) + (fn(huyetMach) || 0);
  const atkTotal = combine(t => t.atk), hpTotal = combine(t => t.hp), defTotal = combine(t => t.def), spdTotal = combine(t => t.spd);
  const critTotal = combine(t => t.crit), critResistTotal = combine(t => t.critResist), dodgeTotal = combine(t => t.dodge);
  const trueDmgTotal = combine(t => t.trueDmg), dmgRedTotal = combine(t => t.dmgReduction), armorPenTotal = combine(t => t.armorPen);
  const lsTotal = combine(t => t.lifesteal), expTotal = combine(t => t.expBonus), towerTotal = combine(t => t.towerPower);
  const critDmgTotal = combine(t => t.critDmg);
  if (atkTotal) bonusParts.push(`ATK +${atkTotal}%`);
  if (hpTotal) bonusParts.push(`HP +${hpTotal}%`);
  if (defTotal) bonusParts.push(`DEF +${defTotal}%`);
  if (spdTotal) bonusParts.push(`SPD +${spdTotal}%`);
  if (critTotal) bonusParts.push(`Crit +${critTotal}%`);
  if (critResistTotal) bonusParts.push(`Kháng Crit +${critResistTotal}%`);
  if (dodgeTotal) bonusParts.push(`Né tránh +${dodgeTotal}%`);
  if (trueDmgTotal) bonusParts.push(`ST Chuẩn +${trueDmgTotal}%`);
  if (dmgRedTotal) bonusParts.push(`Giảm ST +${dmgRedTotal}%`);
  if (armorPenTotal) bonusParts.push(`Xuyên Giáp +${armorPenTotal}%`);
  if (lsTotal) bonusParts.push(`Hút máu +${lsTotal}%`);
  if (expTotal) bonusParts.push(`EXP +${expTotal}%`);
  if (towerTotal) bonusParts.push(`Lực Tháp +${towerTotal}%`);
  if (critDmgTotal) bonusParts.push(`ST Bạo +${critDmgTotal}%`);
  const reflectTotal = (theChat.reflect || 0) + (huyetMach.reflect || 0) + (armor?.reflect || 0);
  if (reflectTotal) bonusParts.push(`Phản +${reflectTotal}%`);

  const ptCfg = p.phapTacPath ? PHAPTAC_PATHS[p.phapTacPath] : null;
  const ptLine = ptCfg
    ? `${ptCfg.emoji} Pháp Tắc: ${ptCfg.name} Lv.${p.phapTacLevel || 1} — ${describePhapTacEff(getPhapTacEffects(p.phapTacPath, p.phapTacLevel)) || "chưa khai mở"}\n`
    : "";

  const msg = `📊 CHỈ SỐ CHI TIẾT
━━━━━━━━━━━━━━━━
🎭 Đạo tâm: ${daoLabel}
📍 Cảnh giới: ${realmDisplay}
${ptLine}${primeLine}
${talent.emoji} Thiên phú: ${talent.name} (x${talent.multiplier})
${theChat.emoji} Thể chất: ${theChat.name}
${huyetMach.emoji} Huyết mạch: ${huyetMach.name}
${linhCan.emoji} Linh căn: ${linhCan.name} (×${linhCan.expMult} EXP)
⚔️ Vũ khí: ${weaponLine}
🛡️ Giáp: ${armorLine}
🔮 Pháp Bảo: ${p.equippedPhapBao ? (() => { const pb = PHAP_BAO.find(pb => pb.id === p.equippedPhapBao); return pb ? `${pb.emoji} ${pb.name}` : "Không rõ"; })() : "Chưa trang bị"}
🏆 Danh hiệu: ${p.equippedTitle ? (() => { const t = TITLES.find(t => t.id === p.equippedTitle); return t ? `${t.emoji} ${t.name}` : "Không rõ"; })() : "Không có"}
━━━━━━━━━━━━━━━━
💎 Linh Thạch: ${formatNumber(p.spiritStones)}
🦴 Xương: ${p.bones || 0}
👻 Soul: ${p.soul || 0}
🔥 Fire: ${p.fire || 0}
━━━━━━━━━━━━━━━━
🎯 CHỈ SỐ BẢN THÂN (Tổng hợp)
⚔️ ATK: ${formatBig(stats.atk)}
❤️ HP: ${formatBig(Math.min(stats.hp, p.currentHp != null ? p.currentHp : stats.hp))}/${formatBig(stats.hp)}
⚡ SPD: ${formatBig(stats.spd)}
💥 CRIT: ${stats.crit}%
🛡️ DEF: ${formatBig(stats.def)}
🩸 Lifesteal: ${stats.lifesteal}%
🔁 Phản: ${stats.reflect}%
⛏️ Xuyên Giáp: ${stats.armorPen}%
⚡ ST Chuẩn: ${stats.trueDmg}%
💨 Né Tránh: ${stats.dodge}%
🍀 Luck: ${formatBig(stats.luck)}
✨ EXP Bonus: +${stats.expBonus}%
${stats.maxDmgPct > 0 ? `🔒 Chặn ST tối đa: ${stats.maxDmgPct}% HP (mỗi đòn)\n` : ""}💥 Lực Chiến: ${formatNumber(stats.battlePower)}
🏅 Điểm PK: ${p.pkPoints || 0}
${p.phithangCount > 0 ? `🌌 Phi Thăng: ×${p.phithangCount} (+${p.phithangCount * 20}% chỉ số cơ bản, +${Math.min(p.phithangCount * 10, 90)}% giảm thương)\n` : ""}
━━━━━━━━━━━━━━━━
${theChat.emoji}+${huyetMach.emoji} Bonus: ${bonusParts.join(" | ")}
${trongThuongLine}
💡 Bản thân = Cảnh giới + Trang bị + (Thể chất+Huyết mạch) + Đan dược`;

  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handlePrime(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  const current = getPrimeLevel(p.donated || 0);
  const donated = p.donated || 0;
  const lines = PRIME.map(pr => {
    const unlocked = donated >= pr.threshold && pr.threshold >= 0 && donated > 0;
    const status = donated >= pr.threshold ? "✅" : "🔒";
    const requireTxt = pr.level === 1 ? "Nạp lần đầu" : `Nạp ${formatNumber(pr.threshold)}đ`;
    return `${status} ${pr.name} — "${pr.title}" 💰 ${requireTxt} (+${pr.statPct}% toàn chỉ số, +${pr.atkPct}% ATK)${donated >= pr.threshold ? " (đã đạt)" : ""}`;
  });

  let next = PRIME.find(pr => pr.level === current + 1) || null;
  const msg = `👑 HỆ THỐNG PRIME
━━━━━━━━━━━━━━━━
💰 Bạn đã donate: ${formatNumber(donated)}đ
👑 Prime hiện tại: ${current > 0 ? `PRIME ${current} — ${PRIME.find(pr => pr.level === current).title}` : "Chưa có"}
━━━━━━━━━━━━━━━━
${lines.join("\n")}
━━━━━━━━━━━━━━━━
${next ? `🔜 Mốc tiếp theo: ${next.name} — Nạp ${formatNumber(next.threshold)}đ` : "🎉 Bạn đã đạt PRIME 8 cao nhất!"}
💡 ${prefix}tl donate để xem bảng giá`;
  return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleTopDonate(api, message, senderId) {
  const prefix = getGlobalPrefix();
  const data = loadData();
  const players = Object.entries(data.players)
    .map(([key, player]) => ({ key, uid: resolveZaloUidFromKey(data, key), donated: player.donated || 0, player }))
    .filter(e => e.donated > 0 && !isHiddenFromRanking(e.player))
    .sort((a, b) => b.donated - a.donated)
    .slice(0, 20);

  if (players.length === 0) {
    return api.sendMessage(
      { msg: "❌ Chưa có ai donate! Hãy là người đầu tiên.", quote: message, ttl: 15000 },
      message.threadId,
      message.type,
    );
  }

  const usernameMap = {};
  try {
    const uids = [...new Set(players.map(e => e.uid).filter(Boolean))];
    if (uids.length > 0) {
      const userInfo = await api.getUserInfo(uids);
      for (const uid of uids) {
        const profile = userInfo?.changed_profiles?.[uid] || userInfo?.unchanged_profiles?.[uid];
        if (profile) usernameMap[uid] = profile.zaloName || profile.name || null;
      }
    }
  } catch {}

  const medals = ["🥇", "🥈", "🥉"];
  const lines = players.map((e, i) => {
    const name = (e.uid && usernameMap[e.uid]) || `Tu Sĩ ${e.key.slice(-4)}`;
    const tag = medals[i] || `${i + 1}.`;
    return `${tag} ${name} — 💰 ${formatNumber(e.donated)}đ`;
  });

  const msg = `💰 TOP 20 DONATE
━━━━━━━━━━━━━━━━
${lines.join("\n")}
━━━━━━━━━━━━━━━━
💡 ${prefix}tl donate để xem bảng giá`;
  return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleDanhhieu(api, message, p, senderId, sub2, sub3) {
  const prefix = getGlobalPrefix();
  if (!p.titles || p.titles.length === 0) {
    return api.sendMessage({ msg: `❌ Bạn chưa có danh hiệu nào!\n💡 Donate ≥ 1.000đ để nhận danh hiệu "Mạnh Thường Quân".`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (sub2 === "equip") {
    const numStr = sub3 || "";
    if (!numStr.startsWith("+")) {
      return api.sendMessage({ msg: `❌ Dùng: ${prefix}tl danhhieu equip +<số>`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    const idx = parseInt(numStr.slice(1), 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= p.titles.length) {
      return api.sendMessage({ msg: `❌ Số thứ tự không hợp lệ!`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    const titleId = p.titles[idx];
    const title = TITLES.find(t => t.id === titleId);
    if (!title) return api.sendMessage({ msg: `❌ Lỗi tìm danh hiệu!`, quote: message, ttl: 15000 }, message.threadId, message.type);
    p.equippedTitle = titleId;
    savePlayer(senderId);
    return api.sendMessage({ msg: `🏆 ĐÃ TRANG BỊ: ${title.emoji} ${title.name}\n📖 ${title.desc}`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  const lines = p.titles.map((titleId, i) => {
    const t = TITLES.find(x => x.id === titleId);
    if (!t) return "";
    const eq = p.equippedTitle === titleId ? " ✅ ĐANG DÙNG" : "";
    return `[+${i + 1}] ${t.emoji} ${t.name}${eq}\n📊 +${t.hpPct}% HP, +${t.atkPct}% ATK${t.ltBonusPct ? `, +${t.ltBonusPct}% LT bank` : ""}\n📖 ${t.desc}`;
  }).filter(Boolean).join("\n\n");
  const equipped = p.equippedTitle ? (() => { const t = TITLES.find(x => x.id === p.equippedTitle); return t ? `${t.emoji} ${t.name}` : "Không rõ"; })() : "Không có";
  const msg = `🏆 DANH HIỆU CỦA BẠN
━━━━━━━━━━━━━━━
Đang dùng: ${equipped}
━━━━━━━━━━━━━━━
${lines}
━━━━━━━━━━━━━━━
💡 ${prefix}tl danhhieu equip +<số> — Trang bị danh hiệu`;
  return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleTopLucChien(api, message, senderId) {
  const data = loadData();
  const entries = Object.entries(data.players)
    .map(([key, player]) => {
      const stats = calcStats(player);
      return { key, uid: resolveZaloUidFromKey(data, key), battlePower: stats.battlePower, player };
    })
    .filter(e => !isHiddenFromRanking(e.player) && e.battlePower > 0)
    .sort((a, b) => b.battlePower - a.battlePower)
    .slice(0, 20);
  if (entries.length === 0) {
    return api.sendMessage({ msg: "❌ Chưa có dữ liệu!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const usernameMap = {};
  try {
    const uids = [...new Set(entries.map(e => e.uid).filter(Boolean))];
    if (uids.length > 0) {
      const userInfo = await api.getUserInfo(uids);
      for (const uid of uids) {
        const profile = userInfo?.changed_profiles?.[uid] || userInfo?.unchanged_profiles?.[uid];
        if (profile) usernameMap[uid] = profile.zaloName || profile.name || null;
      }
    }
  } catch {}

  const medals = ["🥇", "🥈", "🥉"];
  const lines = entries.map((e, i) => {
    const name = (e.uid && usernameMap[e.uid]) || `Tu Sĩ ${e.key.slice(-4)}`;
    const tag = medals[i] || `${i + 1}.`;
    return `${tag} ${name} — ⚔️ ${formatBig(e.battlePower)}`;
  });

  const msg = `🏆 TOP 20 LỰC CHIẾN
━━━━━━━━━━━━━━━
${lines.join("\n")}`;
  return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

async function handleTopLt(api, message, senderId) {
  const prefix = getGlobalPrefix();
  const data = loadData();
  const players = Object.entries(data.players)
    .map(([key, player]) => ({ key, uid: resolveZaloUidFromKey(data, key), lt: player.spiritStones || 0, player }))
    .filter(e => e.lt > 0 && !isHiddenFromRanking(e.player))
    .sort((a, b) => b.lt - a.lt)
    .slice(0, 20);
  if (players.length === 0) {
    return api.sendMessage({ msg: "❌ Chưa có ai sở hữu Linh Thạch!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const usernameMap = {};
  try {
    const uids = [...new Set(players.map(e => e.uid).filter(Boolean))];
    if (uids.length > 0) {
      const userInfo = await api.getUserInfo(uids);
      for (const uid of uids) {
        const profile = userInfo?.changed_profiles?.[uid] || userInfo?.unchanged_profiles?.[uid];
        if (profile) usernameMap[uid] = profile.zaloName || profile.name || null;
      }
    }
  } catch {}

  const medals = ["🥇", "🥈", "🥉"];
  const lines = players.map((e, i) => {
    const name = (e.uid && usernameMap[e.uid]) || `Tu Sĩ ${e.key.slice(-4)}`;
    const tag = medals[i] || `${i + 1}.`;
    return `${tag} ${name} — 💎 ${formatNumber(e.lt)} LT`;
  });

  const msg = `💎 TOP 20 LINH THẠCH
━━━━━━━━━━━━━━━━
${lines.join("\n")}
━━━━━━━━━━━━━━━━
💡 ${prefix}tl shop để mua sắm`;
  return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleTop(api, message, senderId) {
  const data = loadData();
  const players = Object.entries(data.players).map(([key, player]) => ({ key, uid: resolveZaloUidFromKey(data, key), player })).filter(e => !isHiddenFromRanking(e.player));
  players.sort((a, b) => {
    const ra = a.player.majorRealm * 10 + (a.player.minorRealm || 1);
    const rb = b.player.majorRealm * 10 + (b.player.minorRealm || 1);
    if (rb !== ra) return rb - ra;
    if ((b.player.exp || 0) !== (a.player.exp || 0)) return (b.player.exp || 0) - (a.player.exp || 0);
    return calcStats(b.player).battlePower - calcStats(a.player).battlePower;
  });
  const top = players.slice(0, 20);

  const usernameMap = {};
  try {
    const uids = [...new Set(top.map(e => e.uid).filter(Boolean))];
    if (uids.length > 0) {
      const userInfo = await api.getUserInfo(uids);
      for (const uid of uids) {
        const profile = userInfo?.changed_profiles?.[uid] || userInfo?.unchanged_profiles?.[uid];
        if (profile) usernameMap[uid] = profile.zaloName || profile.name || null;
      }
    }
  } catch {}

  const entries = top.map(e => ({ player: e.player, username: (e.uid && usernameMap[e.uid]) || `Tu Sĩ ${e.key.slice(-4)}` }));

  let imagePath = null;
  try {
    imagePath = await generateTopRanking({ entries });
    await api.sendMessage(
      { msg: "", attachments: [imagePath], ttl: 60000, quote: message },
      message.threadId,
      message.type,
    );
  } catch (e) {
    console.error("Lỗi tạo ảnh top tu-luyen:", e);
    await api.sendMessage(
      { msg: "❌ Lỗi khi tạo ảnh bảng xếp hạng. Vui lòng thử lại sau.", quote: message, ttl: 15000 },
      message.threadId,
      message.type,
    );
  } finally {
    if (imagePath) {
      try { await clearImagePath(imagePath); } catch {}
    }
  }
}

async function handleDonate(api, message, p, senderId) {
  let imagePath = null;
  try {
    imagePath = await generateDonateImage({ donated: p.donated || 0, username: message.data.dName || senderId, milestones: p.donateMilestones || [], prime: p.prime || 0 });
    await api.sendMessage(
      { msg: "", attachments: [imagePath], ttl: 60000, quote: message },
      message.threadId,
      message.type,
    );
  } catch (e) {
    console.error("Lỗi tạo ảnh donate tu-luyen:", e);
    await api.sendMessage(
      { msg: "❌ Lỗi khi tạo ảnh bảng nạp. Vui lòng thử lại sau.", quote: message, ttl: 15000 },
      message.threadId,
      message.type,
    );
  } finally {
    if (imagePath) {
      try { await clearImagePath(imagePath); } catch {}
    }
  }
}

async function handleBeguanStart(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  if (p.beguan && p.beguan.startedAt) {
    const left = Math.max(0, Math.ceil((getBeguanLimitMs(p) - (Date.now() - p.beguan.startedAt)) / 60000));
    return api.sendMessage({
      msg: `❌ Bạn đang bế quan rồi! Còn ${left} phút nữa.\n💡 ${prefix}tl stop để thu hoạch ngay.`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }
  if (p.inSecretRealm) {
    return api.sendMessage({
      msg: `❌ Bạn đang ở Bí Cảnh! Rời bí cảnh (${prefix}tl bc ve) trước khi bế quan.`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }
  if (p.trongThuongUntil && Date.now() < p.trongThuongUntil) {
    return api.sendMessage({
      msg: `❌ Đang trọng thương, không thể bế quan!\n🩹 Dùng ${prefix}tl use 1 để chữa trị.`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  p.beguan = { startedAt: Date.now(), threadId: message.threadId, threadType: message.type, reminded: false };
  savePlayer(senderId);

  const limitMin = Math.floor(getBeguanLimitMs(p) / 60000);
  const msg = `🧘 BẾ QUAN BẮT ĐẦU!
━━━━━━━━━━━━━━━━
⏰ Thời gian tối đa: ${limitMin} phút${limitMin > 60 ? " (Bổ Thiên Đan)" : ""}
📈 EXP thu được NHIỀU hơn Bí Cảnh
💎 Nhận vài trăm Linh Thạch
━━━━━━━━━━━━━━━━
💡 ${prefix}tl stop — Kết thúc & thu hoạch
⚠️ Quá ${limitMin} phút không stop sẽ TẨU HỎA: không nhận được EXP + trọng thương 1 giờ!`;
  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

async function handleBeguanStop(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  if (!p.beguan || !p.beguan.startedAt) {
    return api.sendMessage({
      msg: `❌ Bạn chưa bế quan! Dùng ${prefix}tl start để bắt đầu.`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const elapsedMs = Date.now() - p.beguan.startedAt;

  if (elapsedMs >= getBeguanLimitMs(p)) {
    const threadId = message.threadId;
    const threadType = message.type;
    applyBeguanTauHoa(p);
    savePlayer(senderId);
    return sendBeguanTauHoaMsg(api, senderId, p, threadId, threadType);
  }

  const elapsedMin = Math.floor(elapsedMs / 60000);
  const fraction = Math.min(1, elapsedMs / getBeguanLimitMs(p));
  const baseExp = getRealmExpBase(p.majorRealm, MAX_MINOR_REALM, p.daotam);
  const stats = calcStats(p);
  const linhCan = LINH_CAN.find(l => l.id === p.linhCan) || LINH_CAN[0];
  const threadExpMult = getThreadExpMult(message.threadId);
  const thanhDiaMult = getLocation(p)?.id === "thanhdia" ? 1.5 : 1;
  const marBonus = getMarriageExpBonus(p);
  const isSongTu = !!(p.beguan?.songTu);
  const expGained = Math.floor(baseExp * BEGUAN_EXP_MULTIPLIER * fraction * (1 + (stats.expBonus || 0) / 100) * linhCan.expMult * threadExpMult * thanhDiaMult * (1 + marBonus / 100) * (isSongTu ? 1.35 : 1));
  const stonesGained = Math.floor((BEGUAN_STONES_MIN + Math.random() * (BEGUAN_STONES_MAX - BEGUAN_STONES_MIN)) * fraction);

  let songTuLine = "";
  let bondLine = "";
  if (isSongTu) {
    songTuLine = " (+35% song tu)";
    const myKeyBq = resolvePlayerKey(senderId);
    const mk = p.marriageKey ? getMarriages()[p.marriageKey] : null;
    if (mk && (mk.a === p.beguan.songTuPartner || mk.b === p.beguan.songTuPartner)) {
      const bg = 20 + Math.floor(Math.random() * 21);
      mk.bond = (mk.bond || 0) + bg;
      const newLvl = getMarriageLevel(mk);
      bondLine = `\n🔥 Độ gắn bó +${bg} (tổng ${mk.bond}) — Lv.${newLvl} (+${newLvl * 5}% EXP)`;
    }
  }

  p.exp = (p.exp || 0) + expGained;
  p.spiritStones = (p.spiritStones || 0) + stonesGained;
  p.beguan = null;
  savePlayer(senderId);

  const newMaxExp = getMaxExp(p.majorRealm, p.minorRealm, p.daotam);
  const expPercent = newMaxExp > 0 ? Math.min(Math.floor((p.exp / newMaxExp) * 100), 100) : 0;
  const bar = "█".repeat(Math.floor(expPercent / 10)) + "░".repeat(10 - Math.floor(expPercent / 10));

  const msg = `🧘 KẾT THÚC BẾ QUAN!
━━━━━━━━━━━━━━━━
⏰ Thời gian: ${elapsedMin} phút (×${(fraction * 100).toFixed(0)}%)
✨ EXP nhận: +${formatNumber(expGained)}${thanhDiaMult !== 1 ? ` (×1.5 Thánh Địa)` : ""}${threadExpMult !== 1 ? ` (×${threadExpMult} nhóm)` : ""}${stats.expBonus ? ` (+${stats.expBonus}% thể chất)` : ""}${marBonus ? ` (+${marBonus}% đạo lữ)` : ""}${songTuLine}${linhCan.expMult !== 1 ? ` (×${linhCan.expMult} linh căn)` : ""}
💎 LT nhận: +${formatNumber(stonesGained)}${bondLine}
━━━━━━━━━━━━━━━━
📊 EXP [${bar}] ${expPercent}%
${formatNumber(p.exp)} / ${formatNumber(newMaxExp)}
${p.exp >= newMaxExp ? `━━━━━━━━━━━━━━━━\n⚡ EXP đã đầy! ${prefix}dp để đột phá!` : ""}`;
  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

async function handleBeguanStatus(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  if (!p.beguan || !p.beguan.startedAt) {
    const msg = `🧘 BẠN CHƯA BẾ QUAN!
━━━━━━━━━━━━━━━━
💡 ${prefix}tl start — Bắt đầu bế quan
⏰ Tối đa ${Math.floor(getBeguanLimitMs(p) / 60000)} phút, EXP nhiều hơn Bí Cảnh
💎 Nhận vài trăm Linh Thạch`;
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }
  const elapsed = Date.now() - p.beguan.startedAt;
  const usedMin = Math.floor(elapsed / 60000);
  const limitMs = getBeguanLimitMs(p);
  const leftMin = Math.max(0, Math.ceil((limitMs - elapsed) / 60000));
  const pct = Math.min(100, Math.floor((elapsed / limitMs) * 100));
  const bar = "█".repeat(Math.floor(pct / 10)) + "░".repeat(10 - Math.floor(pct / 10));
  const msg = `🧘 ĐANG BẾ QUAN...
━━━━━━━━━━━━━━━━
⏳ Đã trôi qua: ${usedMin} phút
⏰ Còn lại: ${leftMin} phút
📊 [${bar}] ${pct}%
━━━━━━━━━━━━━━━━
💡 ${prefix}tl stop — Kết thúc & thu hoạch
⚠️ Quá ${Math.floor(limitMs / 60000)} phút sẽ TẨU HỎA: không nhận được EXP + trọng thương 1h!`;
  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

async function handleUpdate(api, message, senderId) {
  const prefix = getGlobalPrefix();
  const raw = message.data.content;
  const content = (typeof raw === "string" ? raw : raw?.title || "").trim();
  const note = content.slice(prefix.length).replace(/^\s*tl\s+update\s*/i, "").trim();

  if (note) {
    if (!isSangTheLenh(senderId)) {
      return api.sendMessage({ msg: "❌ Cần có Sáng Thế Lệnh mới được ghi update.", quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    const data = loadUpdates();
    if (!data.updates) data.updates = {};
    const today = getDateKey();
    if (!Array.isArray(data.updates[today])) data.updates[today] = [];
    data.updates[today].push(note);
    saveUpdates();
    logAdminAction(senderId, "update", note);

    const msg = `📣 ĐÃ LƯU UPDATE HÔM NAY!
━━━━━━━━━━━━━━━━
🗓️ ${formatDateKey(today)}
📝 ${note}`;
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }

  const data = loadUpdates();
  const updates = data.updates || {};
  const today = getDateKey();
  const list = updates[today];
  let body = "";

  if (Array.isArray(list) && list.length > 0) {
    body = `🗓️ Hôm nay (${formatDateKey(today)}):\n${list.map((u, i) => `• ${u}`).join("\n")}`;
  } else {
    const keys = Object.keys(updates).sort().reverse();
    const latest = keys.find(k => Array.isArray(updates[k]) && updates[k].length > 0);
    if (!latest) {
      const msg = `📣 UPDATE TU LUYỆN
━━━━━━━━━━━━━━━━
⚠️ Chưa có update nào được ghi lại.
💡 ${prefix}tl update — xem update
🛠️ Admin gõ: ${prefix}tl update <nội dung>`;
      return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
    }
    body = `⚠️ Chưa có update hôm nay.\n📅 Update gần nhất (${formatDateKey(latest)}):\n${updates[latest].map(u => `• ${u}`).join("\n")}`;
  }

  const msg = `📣 UPDATE TU LUYỆN
━━━━━━━━━━━━━━━━
${body}`;
  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

async function handleStaff(api, message, senderId, sub2) {
  const prefix = getGlobalPrefix();
  if (!isDangSangThe(senderId)) {
    return api.sendMessage(
      { msg: "❌ Chỉ Đấng Sáng Thế mới dùng được lệnh này.", quote: message, ttl: 15000 },
      message.threadId,
      message.type,
    );
  }

  const data = loadData();

  if (sub2 === "on") {
    data.staffLocked = false;
    saveData();
    return api.sendMessage({
      msg: `✅ KÍCH HOẠT LẠI SÁNG THẾ LỆNH!
━━━━━━━━━━━━━━━━
🔱 Tất cả Sáng Thế Lệnh đã được kích hoạt lại!
⚡ Các đạo hữu mang Sáng Thế Lệnh có thể sử dụng lệnh admin.`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  if (sub2 === "off") {
    data.staffLocked = true;
    saveData();
    return api.sendMessage({
      msg: `🔒 KHÓA SÁNG THẾ LỆNH!
━━━━━━━━━━━━━━━━
🔱 Toàn bộ quyền hạn Sáng Thế Lệnh đã bị tạm khóa!
⚠️ Các lệnh admin yêu cầu Sáng Thế Lệnh sẽ không thể sử dụng.
💡 Dùng ${prefix}tl staff on để kích hoạt lại.`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  const status = data.staffLocked ? "🔴 ĐANG KHÓA" : "🟢 ĐANG HOẠT ĐỘNG";
  return api.sendMessage({
    msg: `🔱 TRẠNG THÁI SÁNG THẾ LỆNH
━━━━━━━━━━━━━━━━
📊 Trạng thái hiện tại: ${status}
━━━━━━━━━━━━━━━━
💡 ${prefix}tl staff on — Kích hoạt lại
💡 ${prefix}tl staff off — Tạm khóa toàn bộ`,
    quote: message, ttl: 30000,
  }, message.threadId, message.type);
}

async function handleAdmin(api, message, senderId) {
  const prefix = getGlobalPrefix();
  if (!isSangTheLenh(senderId)) {
    return api.sendMessage(
      { msg: "❌ Cần có Sáng Thế Lệnh mới dùng được lệnh này.", quote: message, ttl: 15000 },
      message.threadId,
      message.type,
    );
  }

  const isDang = isDangSangThe(senderId);

  const staffLines = [
    "👥 NHÓM STAFF — Sáng Thế Lệnh dùng được",
    "━━━━━━━━━━━━━━━",
    "📌 SET — Đặt giá trị",
    `${prefix}tl set <cảnh giới> @user — Đặt cảnh giới (1-78, Phật Đạo max 78, còn lại max 77)`,
    `${prefix}tl set thienphu <stt> @user — Đặt thiên phú`,
    `${prefix}tl set thechat <stt> @user — Đặt thể chất`,
    `${prefix}tl set huyetmach <stt> @user — Đặt huyết mạch`,
    `${prefix}tl set linhcan <stt> @user — Đặt linh căn`,
    `${prefix}tl set phucduyen <số> @user — Đặt phúc duyên`,
    `${prefix}tl set ngotinh <số> @user — Đặt ngộ tính`,
    `${prefix}tl set pt <số> @user — Đặt số lần phi thăng`,
    `${prefix}tl set exp <số> @user — Đặt EXP (vd: 1m, 1e6)`,
    `${prefix}tl set lt <số> @user — Đặt Linh Thạch`,
    `${prefix}tl set phaptac <cấp 1-${PHAPTAC_MAX_LEVEL}> @user — Đặt cấp pháp tắc`,
    `${prefix}tl set donate <số_tiền> @user — Đặt TỔNG donate (vd: 5m)`,
    `${prefix}tl set tax <0-100> — Đặt thuế bank toàn server`,
    "━━━━━━━━━━━━━━━",
    "🎁 BUFF — Cộng thêm (trừ buff item)",
    `${prefix}tl buff <số_lt> @user — Ban Linh Thạch`,
    `${prefix}tl buff donate <số_tiền> @user — Ghi nhận donate (vd: 50, 100k)`,
    `${prefix}tl buff bones <số> @user — Ban Xương`,
    `${prefix}tl buff soul <số> @user — Ban Soul (Linh hồn)`,
    `${prefix}tl buff fire <số> @user — Ban Fire (Lửa thiêng)`,
    `${prefix}tl buff combo <id> @user — Trao combo (bỏ id để xem danh sách)`,
    `${prefix}tl buff tieucanhgioi <số> @user — Tăng tiểu cảnh giới`,
    `${prefix}tl buff daicanhgioi <số> @user — Tăng đại cảnh giới`,
    "━━━━━━━━━━━━━━━",
    "📋 KHÁC",
    `${prefix}tl shopden restock — Restock Shop Đen`,
    `${prefix}tl shopden add <ID> [sl] @user — Phát vật phẩm Shop Đen`,
    `${prefix}tl lx <số LT> <số người> — Phát lì xì nhóm`,
    `${prefix}tl thap reset — Reset tháp toàn server`,
    `${prefix}tl update <nội dung> — Ghi update hôm nay`,
    `${prefix}tl check buff @user — Lịch sử lệnh admin của user`,
    `${prefix}tl check bank @user — Lịch sử giao dịch bank của user`,
    `${prefix}tl phanxet @user — Xem cảnh giới cụ thể của user`,
  ];

  if (!isDang) {
    const lines = ["🛠️ LỆNH ADMIN TU LUYỆN", ...staffLines, "━━━━━━━━━━━━━━━", "✨ Bạn đang xem lệnh nhóm Staff!"];
    await api.sendMessage({ msg: lines.join("\n"), quote: message, ttl: 60000 }, message.threadId, message.type);
    return;
  }

  const dangLines = [
    "━━━━━━━━━━━━━━━",
    "🔱 NHÓM ĐẤNG SÁNG THẾ — Staff không dùng được",
    `${prefix}tl buff item <ID> [sl] @user — Ban vật phẩm`,
    `${prefix}tl buff item sang_the_lenh 1 @user — Ban Sáng Thế Lệnh`,
    `${prefix}tl buff item sang_the_lenh 0 — Thu hồi toàn bộ Sáng Thế Lệnh`,
    `${prefix}tl staff on/off — Kích hoạt/Tạm khóa toàn bộ quyền Sáng Thế Lệnh`,
    `${prefix}tl banacc @user — Khóa tài khoản game`,
    `${prefix}tl unban @user — Mở khóa tài khoản game`,
    `${prefix}tl banbank @user — Phong tỏa bank (cấm chuyển/nhận LT)`,
    `${prefix}tl unbanbank @user — Mở phong tỏa bank`,
    `${prefix}tl exp <số> — Đặt hệ số EXP nhóm`,
    `${prefix}tl fastsell <%giảm> <ID> <tg> — Tạo flash sale`,
    `${prefix}tl minigame — Tạo mini game nhóm`,
  ];

  const lines = ["🛠️ LỆNH ADMIN TU LUYỆN (FULL)", ...staffLines, ...dangLines, "━━━━━━━━━━━━━━━", "✨ Đấng xem full 2 nhóm: Staff + Đấng!"];
  await api.sendMessage({ msg: lines.join("\n"), quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleDangKy(api, message, p, senderId, username, password) {
  const prefix = getGlobalPrefix();

  if (message.type === MessageType.GroupMessage) {
    try { await api.deleteMessage(message, false); } catch {}
    return api.sendMessage({
      msg: `🔒 Vì lý do bảo mật, vui lòng nhắn riêng cho tôi để đăng ký hộ chiếu tu tiên!`,
      ttl: 30000,
    }, message.threadId, message.type);
  }

  if (!username || !password) {
    return api.sendMessage({
      msg: `❌ Cú pháp: ${prefix}tl dangky <tên tài khoản> <mật khẩu>\nVD: ${prefix}tl dangky thanhoang 123456`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return api.sendMessage({
      msg: `❌ Tên tài khoản chỉ gồm chữ/số/gạch dưới, từ 3-20 ký tự!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }
  if (password.length < 4) {
    return api.sendMessage({
      msg: `❌ Mật khẩu phải từ 4 ký tự trở lên!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const data = loadData();
  if (data.accounts[username]) {
    return api.sendMessage({
      msg: `❌ Tên tài khoản "${username}" đã tồn tại!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const already = data.sessions[senderId] || Object.values(data.accounts).find(a => a.ownerUid === senderId);
  if (already) {
    return api.sendMessage({
      msg: `⚠️ Bạn đã đăng ký tài khoản rồi! Mỗi người chỉ được đăng ký 1 lần.\n💡 ${prefix}tl login <tài khoản> <mật khẩu> để đăng nhập.`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  data.players[username] = data.players[senderId];
  delete data.players[senderId];
  data.accounts[username] = { pass: hashPass(password), ownerUid: senderId, createdAt: Date.now() };
  data.sessions[senderId] = username;
  saveData();

  return api.sendMessage({
    msg: `✅ ĐĂNG KÝ HỘ CHIẾU TU TIÊN THÀNH CÔNG!
━━━━━━━━━━━━━━━━
👤 Tài khoản: ${username}
🗝️ Mật khẩu: đã mã hóa an toàn
━━━━━━━━━━━━━━━━
📦 Nhân vật tu tiên của bạn đã được sao lưu vào tài khoản này.
📱 Muốn đăng nhập trên Zalo khác: ${prefix}tl login ${username} <mật khẩu>`,
    quote: message, ttl: 30000,
  }, message.threadId, message.type);
}

async function handleLogin(api, message, p, senderId, username, password) {
  const prefix = getGlobalPrefix();

  if (message.type === MessageType.GroupMessage) {
    try { await api.deleteMessage(message, false); } catch {}
    return api.sendMessage({
      msg: `🔒 Vì lý do bảo mật, vui lòng nhắn riêng cho tôi để đăng nhập hộ chiếu tu tiên!`,
      ttl: 30000,
    }, message.threadId, message.type);
  }

  if (!username || !password) {
    return api.sendMessage({
      msg: `❌ Cú pháp: ${prefix}tl login <tài khoản> <mật khẩu>\nVD: ${prefix}tl login thanhoang 123456`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const data = loadData();
  const acc = data.accounts[username];
  if (!acc || acc.pass !== hashPass(password)) {
    return api.sendMessage({
      msg: `❌ Tài khoản hoặc mật khẩu không đúng!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  if (data.sessions[senderId] === username) {
    return api.sendMessage({
      msg: `ℹ️ Bạn đang đăng nhập tài khoản "${username}" trên Zalo này rồi!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  data.sessions[senderId] = username;
  saveData();

  return api.sendMessage({
    msg: `🔓 ĐĂNG NHẬP HỘ CHIẾU TU TIÊN THÀNH CÔNG!
━━━━━━━━━━━━━━━━
👤 Tài khoản: ${username}
━━━━━━━━━━━━━━━━
📦 Nhân vật tu tiên đã được đồng bộ vào Zalo này!
💡 ${prefix}tl để xem hồ sơ của bạn.`,
    quote: message, ttl: 30000,
  }, message.threadId, message.type);
}

const BAN_ACC_ADMIN_ID = "350261016567599395";

function isBanAccAdmin(senderId) {
  return isDangSangThe(senderId) || isSangThe(senderId);
}

async function handleBanAcc(api, message, p, senderId) {
  if (!isBanAccAdmin(senderId)) {
    return api.sendMessage({
      msg: "❌ Chỉ Đấng Sáng Thế mới dùng được lệnh này!",
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const mention = message.data.mentions?.[0];
  if (!mention || !mention.uid) {
    return api.sendMessage({
      msg: "❌ Cú pháp: tl banacc @người_dùng",
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const targetId = String(mention.uid);
  if (targetId === String(senderId)) {
    return api.sendMessage({
      msg: "❌ Không thể khóa chính mình!",
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const targetName = getTargetName(message, targetId, senderId);
  const data = loadData();
  const key = resolvePlayerKey(targetId);
  const target = data.players[key];

  if (!target) {
    return api.sendMessage({
      msg: `❌ Người dùng này chưa có tài khoản game!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  if (target.banned) {
    return api.sendMessage({
      msg: `⚠️ ${targetName} đã bị khóa tài khoản rồi!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  target.banned = true;
  saveData();

  return api.sendMessage({
    msg: `🚫 KHÓA TÀI KHOẢN THÀNH CÔNG!
━━━━━━━━━━━━━━━━
👤 ${targetName}
🔒 Đã bị khóa khỏi game Tu Luyện.
📝 Dùng tl unban @người_dùng để mở khóa.`,
    quote: message, ttl: 30000,
  }, message.threadId, message.type);
}

async function handleUnban(api, message, p, senderId) {
  if (!isBanAccAdmin(senderId)) {
    return api.sendMessage({
      msg: "❌ Chỉ quản trị viên đặc biệt mới dùng được lệnh này!",
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const mention = message.data.mentions?.[0];
  if (!mention || !mention.uid) {
    return api.sendMessage({
      msg: "❌ Cú pháp: tl unban @người_dùng",
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const targetId = String(mention.uid);
  const targetName = getTargetName(message, targetId, senderId);
  const data = loadData();
  const key = resolvePlayerKey(targetId);
  const target = data.players[key];

  if (!target) {
    return api.sendMessage({
      msg: `❌ Người dùng này chưa có tài khoản game!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  if (!target.banned) {
    return api.sendMessage({
      msg: `ℹ️ ${targetName} không đang bị khóa!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  target.banned = false;
  saveData();

  return api.sendMessage({
    msg: `🔓 MỞ KHÓA THÀNH CÔNG!
━━━━━━━━━━━━━━━━
👤 ${targetName}
✅ Đã có thể chơi game Tu Luyện trở lại.`,
    quote: message, ttl: 30000,
  }, message.threadId, message.type);
}

async function handleBanBank(api, message, p, senderId) {
  if (!isBanAccAdmin(senderId)) {
    return api.sendMessage({
      msg: "❌ Chỉ quản trị viên đặc biệt mới dùng được lệnh này!",
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const mention = message.data.mentions?.[0];
  if (!mention || !mention.uid) {
    return api.sendMessage({
      msg: "❌ Cú pháp: tl banbank @người_dùng",
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const targetId = String(mention.uid);
  if (targetId === String(senderId)) {
    return api.sendMessage({
      msg: "❌ Không thể phong tỏa chính mình!",
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const targetName = getTargetName(message, targetId, senderId);
  const key = resolvePlayerKey(targetId);
  const data = loadData();
  const target = data.players[key];

  if (!target) {
    return api.sendMessage({
      msg: `❌ Người dùng này chưa có tài khoản game!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  if (target.bankBanned) {
    return api.sendMessage({
      msg: `⚠️ Bank của ${targetName} đã bị phong tỏa rồi!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  target.bankBanned = true;
  saveData();
  logAdminAction(senderId, "banbank", "Phong tỏa bank", targetId);

  return api.sendMessage({
    msg: `🔒 PHÔNG TỎA BANK THÀNH CÔNG!
━━━━━━━━━━━━━━━
👤 ${targetName}
🚫 Không thể gửi hoặc nhận chuyển khoản Linh Thạch qua bank.
📝 Dùng tl unbanbank @người_dùng để mở khóa.`,
    quote: message, ttl: 30000,
  }, message.threadId, message.type);
}

async function handleUnbanBank(api, message, p, senderId) {
  if (!isBanAccAdmin(senderId)) {
    return api.sendMessage({
      msg: "❌ Chỉ quản trị viên đặc biệt mới dùng được lệnh này!",
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const mention = message.data.mentions?.[0];
  if (!mention || !mention.uid) {
    return api.sendMessage({
      msg: "❌ Cú pháp: tl unbanbank @người_dùng",
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const targetId = String(mention.uid);
  const targetName = getTargetName(message, targetId, senderId);
  const key = resolvePlayerKey(targetId);
  const data = loadData();
  const target = data.players[key];

  if (!target) {
    return api.sendMessage({
      msg: `❌ Người dùng này chưa có tài khoản game!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  if (!target.bankBanned) {
    return api.sendMessage({
      msg: `ℹ️ Bank của ${targetName} không bị phong tỏa!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  target.bankBanned = false;
  saveData();
  logAdminAction(senderId, "unbanbank", "Mở khóa bank", targetId);

  return api.sendMessage({
    msg: `🔓 MỞ PHÔNG TỎA BANK THÀNH CÔNG!
━━━━━━━━━━━━━━━
👤 ${targetName}
✅ Đã có thể gửi/nhận Linh Thạch qua bank trở lại.`,
    quote: message, ttl: 30000,
  }, message.threadId, message.type);
}

async function handlePhanXet(api, message, p, senderId) {
  const prefix = getGlobalPrefix();

  if (!isSangTheLenh(senderId)) {
    return api.sendMessage({
      msg: "❌ Cần có Sáng Thế Lệnh mới dùng được lệnh này.",
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const mention = message.data.mentions?.[0];
  if (!mention || !mention.uid) {
    return api.sendMessage({
      msg: `❌ Cú pháp: ${prefix}tl phanxet @người_dùng`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const targetId = String(mention.uid);
  const targetName = getTargetName(message, targetId, senderId);

  const data = loadData();
  const key = resolvePlayerKey(targetId);
  const target = data.players[key];

  if (!target) {
    return api.sendMessage({
      msg: `❌ ${targetName} chưa có tài khoản game Tu Luyện!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const realmDisplay = getRealmDisplayFull(target);
  const maxExp = getMaxExp(target.majorRealm, target.minorRealm, target.daotam);
  const expPercent = maxExp > 0 ? Math.min(Math.floor(((target.exp || 0) / maxExp) * 100), 100) : 0;
  const bar = "█".repeat(Math.floor(expPercent / 10)) + "░".repeat(10 - Math.floor(expPercent / 10));
  const stats = calcStats(target);
  const hiddenLine = isHiddenFromRanking(target) ? "\n🌫️ Đang có Ẩn Tu Vi Lệnh — bị ẨN khỏi bảng xếp hạng!" : "";

  const msg = `🔍 PHẢN XẾ TU VI
━━━━━━━━━━━━━━━
👤 Đạo hữu: ${targetName}
🆔 UID: ${targetId}
🔑 Key nhân vật: ${key}
🎭 Đạo tâm: ${getDaoDisplay(target.daotam)}
📍 Cảnh giới cụ thể: **${realmDisplay}**
📊 Đại cảnh giới: ${target.majorRealm} | Tiểu cảnh giới: ${target.minorRealm}
━━━━━━━━━━━━━━━
✨ EXP: ${formatNumber(target.exp || 0)} / ${formatNumber(maxExp)} (${expPercent}%)
[${bar}]
⚔️ Lực chiến: ${formatNumber(stats.battlePower)}
💎 Linh Thạch: ${formatNumber(target.spiritStones || 0)}${hiddenLine}`;

  return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleCheckBuff(api, message, p, senderId) {
  if (!isSangTheLenh(senderId)) {
    return api.sendMessage({ msg: "❌ Cần có Sáng Thế Lệnh mới dùng được lệnh này.", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const mention = message.data.mentions?.[0];
  if (!mention || !mention.uid) {
    return api.sendMessage({ msg: "❌ Cú pháp: tl check buff @người_dùng", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const targetId = String(mention.uid);
  const targetName = getTargetName(message, targetId, senderId);
  const logs = loadAdminLogs();
  const filtered = logs.logs
    .filter(l => l.uid === targetId)
    .slice(-20)
    .reverse();

  if (filtered.length === 0) {
    return api.sendMessage({
      msg: `📋 ${targetName} chưa có lịch sử dùng lệnh admin nào!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const targetUids = [...new Set(filtered.map(l => l.target).filter(Boolean))];
  const nameMap = {};
  try {
    if (targetUids.length > 0) {
      const info = await api.getUserInfo(targetUids);
      for (const u of targetUids) {
        const profile = info?.changed_profiles?.[u] || info?.unchanged_profiles?.[u];
        if (profile) nameMap[u] = profile.zaloName || profile.name || u;
      }
    }
  } catch {}

  const lines = filtered.map((l, i) => {
    const t = new Date(l.at);
    const time = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")} ${String(t.getDate()).padStart(2, "0")}/${String(t.getMonth() + 1).padStart(2, "0")}`;
    const who = l.target ? nameMap[l.target] || l.target : "";
    const arrow = who ? ` → ${who}` : "";
    return `${i + 1}. [${time}] ${l.cmd} ${l.detail}${arrow}`;
  });

  const msg = `📋 LỊCH SỬ LỆNH ADMIN — ${targetName}
━━━━━━━━━━━━━━━━
${lines.join("\n")}
━━━━━━━━━━━━━━━━
📄 Hiển thị ${filtered.length}/20 lệnh gần nhất`;
  return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleCheckBank(api, message, p, senderId) {
  if (!isSangTheLenh(senderId)) {
    return api.sendMessage({ msg: "❌ Cần có Sáng Thế Lệnh mới dùng được lệnh này.", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const mention = message.data.mentions?.[0];
  if (!mention || !mention.uid) {
    return api.sendMessage({ msg: "❌ Cú pháp: tl check bank @người_dùng", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const targetId = String(mention.uid);
  const targetName = getTargetName(message, targetId, senderId);
  const logs = loadBankLogs();
  const filtered = logs.logs
    .filter(l => l.from === targetId || l.to === targetId)
    .slice(-10)
    .reverse();

  if (filtered.length === 0) {
    return api.sendMessage({
      msg: `📋 ${targetName} chưa có lịch sử giao dịch bank nào!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const otherUids = [...new Set(filtered.map(l => (l.from === targetId ? l.to : l.from)).filter(Boolean))];
  const nameMap = {};
  try {
    if (otherUids.length > 0) {
      const info = await api.getUserInfo(otherUids);
      for (const u of otherUids) {
        const profile = info?.changed_profiles?.[u] || info?.unchanged_profiles?.[u];
        if (profile) nameMap[u] = profile.zaloName || profile.name || u;
      }
    }
  } catch {}

  let totalSent = 0, totalReceived = 0;
  const lines = filtered.map((l, i) => {
    const t = new Date(l.at);
    const time = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")} ${String(t.getDate()).padStart(2, "0")}/${String(t.getMonth() + 1).padStart(2, "0")}`;
    const isIncoming = l.to === targetId;
    const otherKey = isIncoming ? l.from : l.to;
    const who = nameMap[otherKey] || otherKey;
    if (isIncoming) totalReceived += l.received || 0;
    else totalSent += l.amount || 0;
    return `${i + 1}. [${time}] ${isIncoming
      ? `📥 Nhận từ ${who}: +${formatNumber(l.received)} LT`
      : `📤 Gửi đến ${who}: -${formatNumber(l.amount)} LT (thuế ${formatNumber(l.tax)})`}`;
  });

  const msg = `📋 LỊCH SỬ GIAO DỊCH BANK — ${targetName}
━━━━━━━━━━━━━━━━
${lines.join("\n")}
━━━━━━━━━━━━━━━━
📤 Tổng gửi: ${formatNumber(totalSent)} LT | 📥 Tổng nhận: +${formatNumber(totalReceived)} LT
📄 Hiển thị ${filtered.length}/10 giao dịch gần nhất`;
  return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleBag(api, message, p, senderId) {
  const ul = (id) => { const l = getUpgradeLevel(p, id); return l > 0 ? ` [+${l}]` : ""; };
  const equippedWeapon = p.equippedWeapon ? WEAPONS.find(w => w.id === p.equippedWeapon) : null;
  let equippedLine = "Chưa trang bị";
  if (equippedWeapon) {
    equippedLine = `${equippedWeapon.emoji} ${equippedWeapon.name}${ul(equippedWeapon.id)} (⚔️+${formatNumber(equippedWeapon.atk)}${equippedWeapon.crit ? ` 💥+${equippedWeapon.crit}%` : ""})`;
  }
  if (p.equippedArmor) {
    const armor = ARMORS.find(a => a.id === p.equippedArmor);
    if (armor) {
      equippedLine += `\n🛡️ ${armor.emoji} ${armor.name}${ul(armor.id)} (${["atk", "def", "hp", "spd", "crit"].filter(k => armor[k]).map(k => k === "atk" ? `⚔️+${formatNumber(armor[k])}` : k === "def" ? `🛡️+${formatNumber(armor[k])}` : k === "hp" ? `❤️+${formatNumber(armor[k])}` : k === "spd" ? `⚡+${formatNumber(armor[k])}` : `💥+${armor[k]}%`).join(" ")})`;
    }
  }
  if (p.equippedPhapTac) {
    const phapTac = SPECIAL_ITEMS.find(s => s.id === p.equippedPhapTac);
    if (phapTac) {
      equippedLine += `\n🌪️ ${phapTac.emoji} ${phapTac.name} (Skill)`;
    }
  }
  if (p.equippedPhapBao) {
    const phapBao = PHAP_BAO.find(pb => pb.id === p.equippedPhapBao);
    if (phapBao) {
      equippedLine += `\n🔮 ${phapBao.emoji} ${phapBao.name}${ul(phapBao.id)} (Pháp Bảo)`;
    }
  }
  if (p.equippedTitle) {
    const title = TITLES.find(t => t.id === p.equippedTitle);
    if (title) {
      equippedLine += `\n🏆 ${title.emoji} ${title.name} (Danh Hiệu)`;
    }
  }

  const weaponIds = Object.keys(p.inventory.weapons || {});
  let weaponLines = "Không có";
  if (weaponIds.length > 0) {
    weaponLines = weaponIds.map(id => {
      const w = WEAPONS.find(w => w.id === id);
      if (!w) return "";
      const eq = p.equippedWeapon === id ? " ✅" : "";
      return `${w.emoji} ${w.name}${ul(id)}${eq} \`ID: ${w.id}\``;
    }).filter(Boolean).join("\n");
  }

  const armorIds = Object.keys(p.inventory.armors || {});
  let armorLines = "Không có";
  if (armorIds.length > 0) {
    armorLines = armorIds.map(id => {
      const a = ARMORS.find(a => a.id === id);
      if (!a) return "";
      const eq = p.equippedArmor === id ? " ✅" : "";
      return `${a.emoji} ${a.name}${ul(id)}${eq} \`ID: ${a.id}\``;
    }).filter(Boolean).join("\n");
  }

  const potionIds = Object.keys(p.inventory.potions || {});
  let potionLines = "Không có";
  if (potionIds.length > 0) {
    potionLines = potionIds.map(id => {
      const po = POTIONS.find(po => po.id === id) || getTokenItem(id);
      const name = po ? `${po.emoji} ${po.name}` : id;
      return `${name} x${p.inventory.potions[id]} \`ID: ${id}\``;
    }).join("\n");
  }

  const phapTacIds = Object.keys(p.inventory.phapTac || {});
  let phapTacLines = "Không có";
  if (phapTacIds.length > 0) {
    phapTacLines = phapTacIds.map(id => {
      const sp = SPECIAL_ITEMS.find(s => s.id === id);
      if (!sp) return "";
      const eq = p.equippedPhapTac === id ? " ✅" : "";
      return `${sp.emoji} ${sp.name}${eq} \`ID: ${sp.id}\``;
    }).filter(Boolean).join("\n");
  }

  const phapBaoIds = Object.keys(p.inventory.phapBao || {});
  let phapBaoLines = "Không có";
  if (phapBaoIds.length > 0) {
    phapBaoLines = phapBaoIds.map(id => {
      const pb = PHAP_BAO.find(pb => pb.id === id);
      if (!pb) return "";
      const eq = p.equippedPhapBao === id ? " ✅" : "";
      return `${pb.emoji} ${pb.name}${ul(id)}${eq} \`ID: ${pb.id}\``;
    }).filter(Boolean).join("\n");
  }

  const matIds = Object.keys(p.inventory.materials || {}).filter(k => (p.inventory.materials[k] || 0) > 0);
  let matLines = "Không có";
  if (matIds.length > 0) {
    matLines = matIds.map(id => `${getMatLabel(id)} ×${p.inventory.materials[id]}`).join("\n");
  }

  const msg = `🎒 TÚI ĐỒ
━━━━━━━━━━━━━━━
💎 Linh Thạch: ${formatNumber(p.spiritStones)}
🦴 Xương: ${p.bones || 0}
👻 Soul: ${p.soul || 0}
🔥 Fire: ${p.fire || 0}
━━━━━━━━━━━━━━━
🌾 Nguyên Liệu:
${matLines}
━━━━━━━━━━━━━━━
⚔️ Đang dùng: ${equippedLine}
━━━━━━━━━━━━━━━
🗡️ Vũ Khí (${weaponIds.length}):
${weaponLines}
━━━━━━━━━━━━━━━
🛡️ Giáp (${armorIds.length}):
${armorLines}
━━━━━━━━━━━━━━━
🌪️ Skill (${phapTacIds.length}):
${phapTacLines}
━━━━━━━━━━━━━━━
🔮 Pháp Bảo (${phapBaoIds.length}):
${phapBaoLines}
━━━━━━━━━━━━━━━
💊 Đan Dược:
${potionLines}
━━━━━━━━━━━━━━━
💡 ${getGlobalPrefix()}tl equip <ID> | tl use <ID>`;

  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleWiki(api, message, p, sub2, sub3) {
  const prefix = getGlobalPrefix();

  if (sub2 === "thechat") {
    const page = Math.max(1, parseInt(sub3 || "1", 10));
    const pageSize = 6;
    const total = Math.ceil(THECHAT.length / pageSize);
    const pn = Math.min(page, total);
    const start = (pn - 1) * pageSize;
    const slice = THECHAT.slice(start, start + pageSize);

    const lines = slice.map(tc => {
      const idx = start + tc.id;
      const parts = [];
      if (tc.atk) parts.push(`⚔️ ATK +${tc.atk}%`);
      if (tc.hp) parts.push(`❤️ HP +${tc.hp}%`);
      if (tc.def) parts.push(`🛡️ DEF +${tc.def}%`);
      if (tc.spd) parts.push(`⚡ SPD +${tc.spd}%`);
      if (tc.crit) parts.push(`💥 Crit +${tc.crit}%`);
      if (tc.critResist) parts.push(`🛡️ Kháng Crit +${tc.critResist}%`);
      if (tc.dodge) parts.push(`💨 Né tránh +${tc.dodge}%`);
      if (tc.trueDmg) parts.push(`⚡ ST Chuẩn +${tc.trueDmg}%`);
      if (tc.dmgReduction) parts.push(`🛡️ Giảm ST +${tc.dmgReduction}%`);
      if (tc.armorPen) parts.push(`🗡️ Xuyên Giáp +${tc.armorPen}%`);
      if (tc.lifesteal) parts.push(`🩸 Hút máu +${tc.lifesteal}%`);
      if (tc.expBonus) parts.push(`✨ EXP +${tc.expBonus}%`);
      if (tc.towerPower) parts.push(`🗼 Lực Tháp +${tc.towerPower}%`);
      return `${tc.emoji} ${idx}. ${tc.name}\n📊 ${parts.join(" | ")}`;
    });

    const msg = `💪 CẨM NANG THỂ CHẤT (Trang ${pn}/${total})
━━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━━
💡 ${prefix}tl wiki thechat <trang>`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  if (sub2 === "huyetmach") {
    const page = Math.max(1, parseInt(sub3 || "1", 10));
    const pageSize = 6;
    const total = Math.ceil(HUYETMACH.length / pageSize);
    const pn = Math.min(page, total);
    const start = (pn - 1) * pageSize;
    const slice = HUYETMACH.slice(start, start + pageSize);

    const lines = slice.map(hm => {
      const idx = start + hm.id;
      const parts = [];
      if (hm.atk) parts.push(`⚔️ ATK +${hm.atk}%`);
      if (hm.hp) parts.push(`❤️ HP +${hm.hp}%`);
      if (hm.def) parts.push(`🛡️ DEF +${hm.def}%`);
      if (hm.spd) parts.push(`⚡ SPD +${hm.spd}%`);
      if (hm.crit) parts.push(`💥 Crit +${hm.crit}%`);
      if (hm.critResist) parts.push(`🛡️ Kháng Crit +${hm.critResist}%`);
      if (hm.dodge) parts.push(`💨 Né tránh +${hm.dodge}%`);
      if (hm.trueDmg) parts.push(`⚡ ST Chuẩn +${hm.trueDmg}%`);
      if (hm.dmgReduction) parts.push(`🛡️ Giảm ST +${hm.dmgReduction}%`);
      if (hm.armorPen) parts.push(`🗡️ Xuyên Giáp +${hm.armorPen}%`);
      if (hm.lifesteal) parts.push(`🩸 Hút máu +${hm.lifesteal}%`);
      if (hm.expBonus) parts.push(`✨ EXP +${hm.expBonus}%`);
      if (hm.towerPower) parts.push(`🗼 Lực Tháp +${hm.towerPower}%`);
      if (hm.critDmg) parts.push(`💥 ST Bạo +${hm.critDmg}%`);
      return `${hm.emoji} ${idx}. ${hm.name}\n📊 ${parts.join(" | ")}`;
    });

    const msg = `🩸 CẨM NANG HUYẾT MẠCH (Trang ${pn}/${total})
━━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━━
💡 ${prefix}tl wiki huyetmach <trang>`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  if (sub2 === "linhcan") {
    const page = Math.max(1, parseInt(sub3 || "1", 10));
    const pageSize = 8;
    const total = Math.ceil(LINH_CAN.length / pageSize);
    const pn = Math.min(page, total);
    const start = (pn - 1) * pageSize;
    const slice = LINH_CAN.slice(start, start + pageSize);

    const lines = slice.map(lc => {
      const idx = start + lc.id;
      return `${lc.emoji} ${idx}. ${lc.name} (Hệ số: x${lc.expMult} EXP)\n🏷️ ${lc.pham} • ${lc.desc}`;
    });

    const msg = `🌱 CẨM NANG LINH CĂN (Trang ${pn}/${total})
━━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━━
💡 ${prefix}tl wiki linhcan <trang>`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  if (sub2 === "thienphu" || sub2 === "thienphu") {
    const lines = Object.entries(TALENTS).map(([key, ti]) =>
      `${ti.emoji} ${ti.name} \`${key}\`\n💪 EXP ×${ti.multiplier}\n🧠 Ngộ Tính: ${ti.ngoBase} | 🍀 Phúc Duyên: ${ti.phucBase}`
    );

    const msg = `🌟 CẨM NANG THIÊN PHÚ
━━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━━
💡 Dùng đan Thiên Phú để đổi vận, cấp bậc càng cao xp càng nhiều`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  if (sub2 === "giap" || sub2 === "giáp") {
    const daoMap = { chinh: "⚡ Chính Đạo", ma: "⚫ Ma Đạo", nho: "🎓 Nho Đạo", yeu: "🐾 Yêu Đạo", lo: "🫙 Lọ Đạo", quy: "👻 Quỷ Đạo", phat: "🪷 Phật Đạo" };
    const page = Math.max(1, parseInt(sub3 || "1", 10));
    const pageSize = 6;
    const total = Math.ceil(ARMORS.length / pageSize);
    const pn = Math.min(page, total);
    const start = (pn - 1) * pageSize;
    const slice = ARMORS.slice(start, start + pageSize);

    const lines = slice.map((a, i) => {
      const idx = start + i + 1;
      const parts = [];
      if (a.atk !== undefined && a.atk !== 0) parts.push(`⚔️+${formatNumber(a.atk)}`);
      if (a.def !== undefined && a.def !== 0) parts.push(`🛡️+${formatNumber(a.def)}`);
      if (a.hp !== undefined && a.hp !== 0) parts.push(`❤️+${formatNumber(a.hp)}`);
      if (a.spd !== undefined && a.spd !== 0) parts.push(`⚡+${formatNumber(a.spd)}`);
      if (a.crit !== undefined && a.crit !== 0) parts.push(`💥+${a.crit}%`);
      if (a.dmgReduction) parts.push(`🛡️ Giảm ST +${a.dmgReduction}%`);
      if (a.reflect) parts.push(`🔁 Phản +${a.reflect}%`);
      if (a.maxDmgPct) parts.push(`🔒 Chặn ST ${a.maxDmgPct}% HP`);
      if (a.lifesteal) parts.push(`🩸 Hút máu +${a.lifesteal}%`);
      if (a.armorPen) parts.push(`⛏️ Xuyên Giáp +${a.armorPen}%`);
      if (a.luck) parts.push(`🍀 Luck +${formatNumber(a.luck)}`);
      if (a.expBonus) parts.push(`✨ EXP +${a.expBonus}%`);
      if (a.dodge) parts.push(`💨 Né +${a.dodge}%`);
      if (a.trueDmg) parts.push(`⚡ ST Chuẩn +${a.trueDmg}%`);
      if (a.beguanNoInjury) parts.push(`📿 Miễn tẩu hỏa`);
      return `${a.emoji} ${a.name} \`ID: ${a.id}\`\n${daoMap[a.dao] || "⚪ Chung"} • 💰 ${formatNumber(a.price)} LT\n📊 ${parts.join(", ")}`;
    });

    const msg = `🛡️ CẨM NANG GIÁP (Trang ${pn}/${total})
━━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━━
💡 ${prefix}tl shop giap <trang> | tl equip <ID>`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  let realmList, isMa = false, isNho = false, isYeu = false, isLo = false, isQuy = false, isPhat = false;
  if (sub2 === "madao" || sub2 === "ma") { realmList = MA_REALMS; isMa = true; }
  else if (sub2 === "nhodao" || sub2 === "nho") { realmList = NHO_REALMS; isNho = true; }
  else if (sub2 === "yeudao" || sub2 === "yeu") { realmList = YEU_REALMS; isYeu = true; }
  else if (sub2 === "lodao" || sub2 === "lo") { realmList = LO_REALMS; isLo = true; }
  else if (sub2 === "quydao" || sub2 === "quy") { realmList = QUY_REALMS; isQuy = true; }
  else if (sub2 === "phatdao" || sub2 === "phat") { realmList = PHAT_REALMS; isPhat = true; }
  else if (sub2 === "canhgioi" || sub2 === "canh" || sub2 === "chinh") { realmList = REALMS; }
  else realmList = REALMS;
  const pageRaw = (isMa || isNho || isYeu || isLo || isQuy || isPhat) ? sub3 : sub3 || sub2;
  const parsedPage = parseInt(pageRaw, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const pageSize = 8;
  const totalPages = Math.ceil(realmList.length / pageSize);
  const pn = Math.min(page, totalPages);
  const start = (pn - 1) * pageSize;
  const slice = realmList.slice(start, start + pageSize);

  const lines = slice.map(r => {
    const bar = r.breakthroughRate >= 50 ? "🟢" : r.breakthroughRate >= 20 ? "🟡" : r.breakthroughRate >= 5 ? "🟠" : "🔴";
    return `${r.index}. ${r.name}\n📊 EXP: ${formatNumber(r.baseExp)} ${bar} Tỉ lệ: ${r.breakthroughRate}%`;
  });

  const title = isMa ? "⚫ MA ĐẠO" : isNho ? "🎓 NHO ĐẠO" : isYeu ? "🐾 YÊU ĐẠO" : isLo ? "🫙 LỌ ĐẠO" : isQuy ? "👻 QUỶ ĐẠO" : isPhat ? "🪷 PHẬT ĐẠO" : "⚡ CHÍNH ĐẠO";
  const pathStr = isMa ? " ma" : isNho ? " nho" : isYeu ? " yeu" : isLo ? " lo" : isQuy ? " quy" : isPhat ? " phat" : "";
  const msg = `${title} CẢNH GIỚI
━━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━━
📄 Trang ${pn}/${totalPages} • ${prefix}tl wiki${pathStr} <trang>`;

  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

// ── BẢN ĐỒ & TRUYỀN TỐNG ──────────────────────────────────
// Shop/luyendan/bank là thiết yếu — luôn đi theo người chơi, không cần truyền tống
const LOCATIONS = [
  {
    id: "dummy",
    name: "Dummy Trial (Thí Luyện Mộc Nhân)",
    emoji: "🎯",
    desc: "Mộc nhân copy toàn bộ chỉ số của bạn — đánh thử dame THẬT giống như đánh lên người chơi, cả phản đòn.",
    features: "dummy attack",
  },
  {
    id: "thanhdia",
    name: "Thánh Địa Tông Môn",
    emoji: "🏯",
    desc: "Nơi tu tập của các bậc tiền bối. Học hỏi được đạo pháp và bế quan tại đây nhận ×1.5 EXP.",
    features: "hochoi • bế quan ×1.5 EXP",
  },
];

function getLocation(p) {
  return LOCATIONS.find(l => l.id === p.location) || null;
}

async function handleMap(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  const cur = getLocation(p);
  const lines = LOCATIONS.map(l =>
    `${cur?.id === l.id ? "📍" : "▫️"} ${l.emoji} ${l.name} \`ID: ${l.id}\`\n   ${l.desc}\n   🎮 ${l.features}`
  );
  const msg = `🗺️ BẢN ĐỒ TU TIÊN GIỚI
━━━━━━━━━━━━━━━━
🏠 Khu tự do: 🏘️ Làng Tu Tiên — shop, luyendan, bank luôn theo bạn, không cần di chuyển!
━━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━━
📍 Vị trí hiện tại: ${cur ? `${cur.emoji} ${cur.name}` : "🏘️ Làng Tu Tiên (khu tự do)"}
🚀 Di chuyển: ${prefix}tl truyentong <ID điểm đến> (VD: ${prefix}tl truyentong dummy)
🔙 Rời về khu tự do: ${prefix}tl truyentong ve`;
  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleTruyenTong(api, message, p, senderId, sub2) {
  const prefix = getGlobalPrefix();
  const cur = getLocation(p);

  if (!sub2) {
    return api.sendMessage({
      msg: `🌀 TRUYỀN TỐNG
━━━━━━━━━━━━━━━━
📍 Bạn đang ở: ${cur ? `${cur.emoji} ${cur.name}` : "🏘️ Làng Tu Tiên (khu tự do)"}
💡 ${prefix}tl map — Xem bản đồ
💡 ${prefix}tl truyentong <ID> — Dịch chuyển tức thời (miễn phí)
💡 ${prefix}tl truyentong ve — Rời về khu tự do`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  const key = sub2.toLowerCase();
  if (key === "ve" || key === "roi" || key === "out") {
    if (!cur) {
      return api.sendMessage({ msg: `ℹ️ Bạn đang ở khu tự do rồi!`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    p.location = null;
    savePlayer(senderId);
    await api.sendMessage({
      msg: `🌀 ĐÃ RỜI ${cur.emoji} ${cur.name} → 🏘️ Làng Tu Tiên (khu tự do)`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
    return;
  }

  const target = LOCATIONS.find(l => l.id === key);
  if (!target) {
    return api.sendMessage({
      msg: `❌ Không tìm thấy địa điểm "${sub2}"!\n🗺️ ${prefix}tl map để xem các điểm đến.`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  if (target.id === cur?.id) {
    return api.sendMessage({ msg: `ℹ️ Bạn đang ở ${target.emoji} ${target.name} rồi!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  p.location = target.id;
  savePlayer(senderId);

  await api.sendMessage({
    msg: `🌀 TRUYỀN TỐNG THÀNH CÔNG!
━━━━━━━━━━━━━━━━
🏘️ Làng Tu Tiên
⬇️
${target.emoji} ${target.name}
━━━━━━━━━━━━━━━━
${target.desc}
🎮 Khả dụng tại đây: ${target.features}`,
    quote: message, ttl: 30000,
  }, message.threadId, message.type);
}

async function handleDummy(api, message, p, senderId, sub2) {
  const prefix = getGlobalPrefix();
  const loc = getLocation(p);

  if (loc.id !== "dummy") {
    return api.sendMessage({
      msg: `❌ Dummy Trial chỉ có ở 🎯 Thí Luyện Mộc Nhân!
💡 ${prefix}tl truyentong dummy để dịch chuyển tới.`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  if (sub2 !== "attack" && sub2 !== "danh") {
    return api.sendMessage({
      msg: `🎯 THÍ LUYỆN MỘC NHÂN
━━━━━━━━━━━━━━━━
Mộc nhân copy TOÀN BỘ chỉ số của bạn (ATK/DEF/HP/Né/Phản...) — dame ra đây chính là dame thật khi đánh lên người chơi.
⚔️ ${prefix}tl dummy attack — Ra đòn thử lực
🔁 Mộc nhân có phản đòn như bạn → xem luôn mình sẽ ăn phản bao nhiêu`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  if (p.trongThuongUntil && Date.now() < p.trongThuongUntil) {
    return api.sendMessage({ msg: `❌ Đang trọng thương, không thể chiến đấu!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const myStats = calcStats(p);
  const dummy = { ...myStats }; // mộc nhân nhân bản

  // Công thức trúng giống hệt PK/tháp
  let hit = true;
  if (Math.random() * 100 < Math.max(0, dummy.dodge)) hit = false;

  if (!hit) {
    return api.sendMessage({
      msg: `🎯 DUMMY TRIAL
━━━━━━━━━━━━━━━━
💨 Mộc nhân NÉ được đòn của bạn! (Né ${dummy.dodge}%)
━━━━━━━━━━━━━━━━
💡 Gõ ${prefix}tl dummy attack để ra đòn tiếp.`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  const effDef = Math.max(0, dummy.def * (1 - myStats.armorPen / 100));
  const dmgRaw = Math.max(1, myStats.atk * (0.85 + Math.random() * 0.30));
  const wasCrit = Math.random() * 100 < Math.max(0, myStats.crit);
  const truePct = Math.max(0, myStats.trueDmg) / 100;
  const truePart = Math.floor(dmgRaw * truePct);
  const normalPart = Math.max(0, Math.floor(dmgRaw * (1 - truePct) - effDef * 0.25));
  let finalDmg = Math.max(1, truePart + normalPart);
  if (wasCrit) finalDmg = Math.floor(finalDmg * (2 + myStats.critDmg / 100));

  const reflectPct = dummy.reflect || 0;
  const reflectDmg = reflectPct > 0 ? Math.floor(finalDmg * reflectPct / 100) : 0;
  const leech = Math.floor(finalDmg * myStats.lifesteal / 100);
  const hpAfterReflect = Math.max(0, myStats.hp - reflectDmg);

  const lines = [
    `🎯 DUMMY TRIAL — KẾT QUẢ ĐÒN ĐÁNH`,
    `━━━━━━━━━━━━━━━━`,
    `${wasCrit ? "⚡ CHÍ MẠNG!" : "⚔️ Trúng đòn"}`,
    `🗡️ Dame gây ra: ${formatBig(finalDmg)}${wasCrit ? " ⚡" : ""}`,
    `🛡️ DEF mộc nhân đã chặn: ${formatBig(effDef)} (xuyên giáp ${myStats.armorPen}%)`,
  ];
  if (myStats.trueDmg > 0) lines.push(`⚡ ST Chuẩn: ${formatBig(truePart)} / ST thường: ${formatBig(normalPart)}`);
  if (leech > 0) lines.push(`🩸 Hút máu: +${formatBig(leech)} HP`);
  lines.push(`━━━━━━━━━━━━━━━━`);
  if (reflectPct > 0) {
    lines.push(`🔁 Phản đòn (${reflectPct}%): bạn ăn ${formatBig(reflectDmg)} dmg`);
    lines.push(`❤️ HP bạn còn: ${formatBig(hpAfterReflect)}/${formatBig(myStats.hp)}`);
  } else {
    lines.push(`🔁 Bạn không có phản đòn — không ăn dmg ngược`);
  }
  lines.push(`━━━━━━━━━━━━━━━━`);
  lines.push(`📊 ATK ${formatBig(myStats.atk)} | Crit ${myStats.crit}% | Né ${myStats.dodge}%`);

  await api.sendMessage({ msg: lines.join("\n"), quote: message, ttl: 30000 }, message.threadId, message.type);
}

// ── THÁNH ĐỊA TÔNG MÔN: HỌC HỎI ────────────────────────────
const HOCHOI_DAILY_LIMIT = 10;
const HOCHOI_EXP_PCT = 10; // % EXP tối đa cần để đột phá mỗi lần học

async function handleHoChoi(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  const loc = getLocation(p);

  if (loc?.id !== "thanhdia") {
    return api.sendMessage({
      msg: `❌ Học hỏi tiền bối chỉ có ở 🏯 Thánh Địa Tông Môn!
💡 ${prefix}tl truyentong thanhdia để dịch chuyển tới.`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const used = p.hocHoiUsed || 0;
  if (used >= HOCHOI_DAILY_LIMIT) {
    return api.sendMessage({
      msg: `❌ Bạn đã học hết ${HOCHOI_DAILY_LIMIT} lượt từ các tiền bối!
🙏 10 lượt học là cơ duyên đặc biệt dành cho tân nhân — không bao giờ reset. Hãy tự tu luyện tiếp nhé!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const maxExp = getMaxExp(p.majorRealm, p.minorRealm, p.daotam);
  const expGained = Math.floor(maxExp * HOCHOI_EXP_PCT / 100);

  p.exp = (p.exp || 0) + expGained;
  p.hocHoiUsed = used + 1;
  savePlayer(senderId);

  const expPercent = maxExp > 0 ? Math.min(Math.floor((p.exp / maxExp) * 100), 100) : 0;
  const bar = "█".repeat(Math.floor(expPercent / 10)) + "░".repeat(10 - Math.floor(expPercent / 10));

  await api.sendMessage({
    msg: `🏯 HỌC HỎI TIỀN BỐI
━━━━━━━━━━━━━━━━
🧙 Một vị tiền bối truyền cho bạn vài câu đạo pháp...
✨ EXP nhận: +${formatNumber(expGained)} (${HOCHOI_EXP_PCT}% EXP đột phá)
🎫 Lượt học còn lại: ${HOCHOI_DAILY_LIMIT - used - 1}/${HOCHOI_DAILY_LIMIT} (không reset)
━━━━━━━━━━━━━━━━
📊 EXP [${bar}] ${expPercent}%
${formatNumber(p.exp)} / ${formatNumber(maxExp)}
${p.exp >= maxExp ? `━━━━━━━━━━━━━━━━\n⚡ EXP đã đầy! ${prefix}dp để đột phá!` : ""}`,
    quote: message, ttl: 30000,
  }, message.threadId, message.type);
}

// ── THẠCH PHONG THẦN KIẾM: RÚT KIẾM ────────────────────────
const RUTKIEM_WEAPON_ID = "w_legendary_1";
const RUTKIEM_RATE = 0.5;          // % thành công
const RUTKIEM_COOLDOWN_MS = 10 * 60 * 1000; // 10 phút/lượt

async function handleRutKiem(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  const weapon = WEAPONS.find(w => w.id === RUTKIEM_WEAPON_ID);

  if (hasItem(senderId, RUTKIEM_WEAPON_ID)) {
    return api.sendMessage({
      msg: `🗿 ${weapon.emoji} ${weapon.name} đã là của bạn rồi! Đạo hữu còn tham gì nữa.\n💡 ${prefix}tl equip ${RUTKIEM_WEAPON_ID} để trang bị.`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  const last = p.rutkiemLastAt || 0;
  const elapsed = Date.now() - last;
  if (elapsed < RUTKIEM_COOLDOWN_MS) {
    const left = Math.ceil((RUTKIEM_COOLDOWN_MS - elapsed) / 60000);
    return api.sendMessage({
      msg: `😮‍💨 Hai tay bạn còn run bần bật... Nghỉ ngơi ${left} phút nữa hãy thử lại!\n💡 Rút kiếm miễn phí nhưng tốn sức — mỗi lượt cách nhau 10 phút.`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }
  p.rutkiemLastAt = Date.now();

  if (Math.random() * 100 < RUTKIEM_RATE) {
    addItem(senderId, RUTKIEM_WEAPON_ID, "weapon");
    savePlayer(senderId);
    logAdminAction(senderId, "rutkiem", "RÚT ĐƯỢC Thạch Phong Thần Kiếm", null);

    const msg = `🌟🌟🌟 THIÊN ĐỊA CHUYỂN ĐỘNG! 🌟🌟🌟
━━━━━━━━━━━━━━━━
🗿 Tảng đá ngàn năm nứt toác, ánh kiếm xé toạc mây trời...
👑 ${(message.data.dName || "Đạo hữu")} ĐÃ RÚT ĐƯỢC ${weapon.emoji} ${weapon.name}!
━━━━━━━━━━━━━━━━
⚔️ ATK: +${formatNumber(weapon.atk)}
🩸 Hút máu: ${weapon.lifesteal}%
🔥 ST Bạo: +${weapon.critDmg}%
🛡️ Giảm thương: +${weapon.dmgReduction}%
━━━━━━━━━━━━━━━━
💡 ${prefix}tl equip ${RUTKIEM_WEAPON_ID} để nhận sức mạnh!`;
    return api.sendMessage({ msg, quote: message, ttl: 120000 }, message.threadId, message.type);
  }

  savePlayer(senderId);
  const fails = [
    "😮‍💨 Bạn siết chặt chuôi kiếm... Tảng đá chỉ nhả ra vài cục bụi!",
    "🪨 Rùng mình kéo mãi — kiếm không hề nhúc nhích. Có lẽ chưa đến duyên!",
    "😅 Nghe tiếng 'rắc' — hóa ra là... dây thắt lưng bạn đứt!",
    "🗿 Tảng đá rung nhẹ rồi im lặng. Kiếm thần vẫn ngủ say!",
    "🫠 Bạn rút tới mồ hôi đổ như mưa — dân làng tưởng đang biểu diễn xiếc!",
  ];
  return api.sendMessage({
    msg: `${fails[Math.floor(Math.random() * fails.length)]}\n🎯 Tỉ lệ rút được: ${RUTKIEM_RATE}%\n⏳ Thử lại sau 10 phút.`,
    quote: message, ttl: 30000,
  }, message.threadId, message.type);
}

// ── SONG KIẾM NGUYỀN RỦA: YAMA / TUSHITA / ODEN ────────────
const YAMA_ID = "w_yama_1";
const TUSHITA_ID = "w_tushita_1";
const ODEN_ID = "w_oden_2";
const ODEN_3_ID = "w_oden_3";
const THUCTINH_MATERIAL_ID = "w_legendary_1";   // Thạch Phong Thần Kiếm
const THUCTINH_COST_LT = 10000000000;            // 10 tỷ LT
const THURUT_RATE = 2;                 // % thành công mỗi lượt rút
const THURUT_MAX_ATTEMPTS = 3;         // thất bại 3 lượt → chết
const THURUT_COOLDOWN_MS = 10 * 60 * 1000;
const TUSHITA_BOSS_REALM = 27;         // Boss Hỗn Độn (cảnh 27)
const TRONG_THUONG_DEATH_MS = 30 * 60 * 1000;

// Ghép Oden khi sở hữu cả Yama + Tushita. Trả về text thông báo hoặc null.
function checkSongKiemFusion(senderId, displayName = "Đạo hữu") {
  if (!hasItem(senderId, YAMA_ID) || !hasItem(senderId, TUSHITA_ID)) return null;
  const p = getPlayer(senderId);
  if (p.inventory.weapons[ODEN_ID]) return null;

  delete p.inventory.weapons[YAMA_ID];
  delete p.inventory.weapons[TUSHITA_ID];
  p.inventory.weapons[ODEN_ID] = 1;
  if (p.equippedWeapon === YAMA_ID || p.equippedWeapon === TUSHITA_ID) {
    p.equippedWeapon = ODEN_ID;
  }
  savePlayer(senderId);
  logAdminAction(senderId, "oden_fusion", "GHÉP THÀNH CÔNG Song Kiếm Oden", null);

  const oden = WEAPONS.find(w => w.id === ODEN_ID);
  return `⚡⚡⚡ YAMA ĐÃ PHẢN ỨNG VỚI TUSHITA CỦA BẠN! ⚡⚡⚡
━━━━━━━━━━━━━━━━
☠️ Hai linh hồn kiếm rú lên, trời đất rung chuyển...
🌸 Ánh sáng hóa nhạc bao trùm — hai thanh kiếm nguyền rủa hòa làm một!
⚔️ ${(displayName || "Đạo hữu")} NHẬN ĐƯỢC ${oden.emoji} ${oden.name}!
━━━━━━━━━━━━━━━━
📊 Chỉ số cộng dồn:
⚔️ ATK: +${formatNumber(oden.atk)}
💨 SPD: +${formatNumber(oden.spd)}
💥 CRIT: +${oden.crit}%
⚡ ST Chuẩn: +${oden.trueDmg}%
━━━━━━━━━━━━━━━━
💡 Đã tự động trang bị! Đây là song kiếm DUY NHẤT không có trong shop.`;
}

async function handleThuRut(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  const yama = WEAPONS.find(w => w.id === YAMA_ID);

  if (hasItem(senderId, ODEN_ID)) {
    return api.sendMessage({
      msg: `⚔️ Bạn đã sở hữu Song Kiếm Oden — Yama đã hòa vào đó rồi!\n💡 Không còn gì để rút nữa.`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }
  if (hasItem(senderId, YAMA_ID)) {
    return api.sendMessage({
      msg: `☠️ ${yama.emoji} ${yama.name} đã là của bạn!\n💡 Chuỗi nhiệm vụ tiếp theo: cầm Yama (${prefix}tl equip ${YAMA_ID}) rồi dùng ${prefix}tl fight để thách đấu Boss Hỗn Độn (cảnh 27) và đoạt Tushita từ tay nó!`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }
  if (p.trongThuongUntil && Date.now() < p.trongThuongUntil) {
    return api.sendMessage({ msg: `❌ Bạn đang trọng thương! Hồi phục rồi hãy liều mạng với Yama.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  // Hồi chiêu 10 phút chỉ áp dụng SAU KHI kết thúc chuỗi lượt thứ 3
  const last = p.thurutLastAt || 0;
  const elapsed = Date.now() - last;
  if (elapsed < THURUT_COOLDOWN_MS) {
    const left = Math.ceil((THURUT_COOLDOWN_MS - elapsed) / 60000);
    return api.sendMessage({
      msg: `😮‍💨 Tay bạn vẫn run rẩy sau lượt thứ 3 đầy định mệnh... Hồi chiêu ${left} phút nữa!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const attempt = (p.yamaDrawCount || 0) + 1;
  p.yamaDrawCount = attempt;
  // Lượt 1 và 2 rút liên tục không hồi chiêu — chỉ bấm hồi chiêu khi rút đến lượt 3
  if (attempt >= THURUT_MAX_ATTEMPTS) p.thurutLastAt = Date.now();

  if (Math.random() * 100 < THURUT_RATE) {
    addItem(senderId, YAMA_ID, "weapon");
    p.yamaDrawCount = 0;
    savePlayer(senderId);
    logAdminAction(senderId, "thurut", "RÚT ĐƯỢC Yama - Vong Giả Chi Đao", null);

    const msg = `☠️☠️☠️ CÁI CHẾT QUAY LƯNG... VÌ BẠN LÀ CHÚNG! ☠️☠️☠️
━━━━━━━━━━━━━━━━
🌫️ Sương mù đặc quánh, tiếng rên siết của vong linh vang vọng...
👑 ${(message.data.dName || "Đạo hữu")} ĐƯỢC YAMA CÔNG NHẬN!
☠️ NHẬN ĐƯỢC ${yama.emoji} ${yama.name}!
━━━━━━━━━━━━━━━━
⚔️ ATK: +${formatNumber(yama.atk)}
💨 SPD: +${formatNumber(yama.spd)}
💥 CRIT: +${yama.crit}%
⚡ ST Chuẩn: +${yama.trueDmg}%
━━━━━━━━━━━━━━━━
🎯 Bạn đã đánh bại tử thần!
💡 Tiếp theo: ${prefix}tl equip ${YAMA_ID} rồi dùng ${prefix}tl fight để thách đấu Boss Hỗn Độn (cảnh 27) cầm Tushita!
🌸 Nghe đồn: nếu gom đủ cả Yama lẫn Tushita, sẽ có chuyện kỳ lạ xảy ra...`;
    const fusionMsg = checkSongKiemFusion(senderId, message.data.dName || "Đạo hữu");
    return api.sendMessage({ msg: fusionMsg ? `${msg}\n\n${fusionMsg}` : msg, quote: message, ttl: 120000 }, message.threadId, message.type);
  }

  // Thất bại
  if (attempt >= THURUT_MAX_ATTEMPTS) {
    // Chết: HP về 0 + trọng thương, sau đó reset chuỗi để thử lại sau
    p.currentHp = 0;
    p.trongThuongUntil = Date.now() + TRONG_THUONG_DEATH_MS;
    p.towerInjured = true;
    p.yamaDrawCount = 0;
    savePlayer(senderId);

    const deathMsgs = [
      "☠️ Yama tự rút ra khỏi vỏ — nhưng nhắm vào chính chủ nhân tương lai của nó!",
      "💀 Vong linh trong kiếm trỗi dậy, hút cạn sinh khí của bạn trong một tiếng thét!",
      "🌑 Bóng đen của Yama phủ xuống... Bạn ngã gục trước khi chạm được chuôi kiếm!",
    ];
    return api.sendMessage({
      msg: `${deathMsgs[Math.floor(Math.random() * deathMsgs.length)]}
━━━━━━━━━━━━━━━━
💀💀💀 LƯỢT THỨ 3 THẤT BẠI — BẠN ĐÃ CHẾT 💀💀💀
❤️ HP: 0 — trọng thương ${TRONG_THUONG_DEATH_MS / 60000} phút!
🚫 Không thể chiến đấu/leo tháp cho đến khi hồi phục.
🔄 Chuỗi rút kiếm reset về lượt 1 — sống dậy rồi cứ thử lại nếu còn gan!
⏳ Hồi chiêu 10 phút trước khi bắt đầu chuỗi mới.
━━━━━━━━━━━━━━━━
☠️ Quy tắc của Yama: lượt 1, 2 an toàn — chỉ lượt thứ 3 là đánh cược mạng sống.`,
      quote: message, ttl: 60000,
    }, message.threadId, message.type);
  }

  savePlayer(senderId);
  const safeNote = attempt === 1
    ? "✅ Lượt này AN TOÀN. Rút tiếp không mất chiêu — nhưng nhớ: lượt thứ 3 thất bại là CHẾT!"
    : "⚠️ Đây là lượt an toàn cuối cùng (2/3). Lượt kế tiếp — lượt thứ 3 — thất bại là CHẾT (HP = 0, trọng thương)!";
  const failMsgs = [
    "🌫️ Bạn chạm vào chuôi kiếm — một giọng nói lạnh sống lưng thì thầm: 'Chưa đâu...'",
    "☠️ Vòng sương mù xoáy mạnh rồi tan. Yama chỉ muốn chơi đùa với mạng bạn thêm chút nữa!",
    "💀 Bạn thấy được hình ảnh cái chết của chính mình trong lưỡi kiếm... nhưng vẫn còn sống!",
  ];
  return api.sendMessage({
    msg: `${failMsgs[Math.floor(Math.random() * failMsgs.length)]}
━━━━━━━━━━━━━━━━
⚠️ Lượt thử: ${attempt}/${THURUT_MAX_ATTEMPTS}
${safeNote}`,
    quote: message, ttl: 60000,
  }, message.threadId, message.type);
}

// ── .TL GACHA/ROLL: QUAY THƯỞNG BẰNG XƯƠNG ─────────────────
const GACHA_COST = 50;
const GACHA_MAX_ROLLS = 10;
const GACHA_RESET_MS = 2 * 60 * 60 * 1000; // 2 tiếng

const GACHA_POOL = [
  { type: "material", weight: 35 },
  { type: "lt_500k", weight: 38 },
  { type: "lt_10m", weight: 17 },
  { type: "soul", weight: 5 },
  { type: "fire", weight: 2 },
];

function getGachaWeightedRandom() {
  const totalWeight = GACHA_POOL.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of GACHA_POOL) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return GACHA_POOL[0];
}

async function handleGacha(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  const threadId = message.threadId;
  
  // Kiểm tra hồi chiêu
  const now = Date.now();
  if (p.gachaResetAt && now - p.gachaResetAt >= GACHA_RESET_MS) {
    p.gachaRolls = 0;
    p.gachaResetAt = now;
  }
  
  // Kiểm tra số lượt còn lại
  if (p.gachaRolls >= GACHA_MAX_ROLLS) {
    const resetTime = p.gachaResetAt + GACHA_RESET_MS;
    const remainMin = Math.ceil((resetTime - now) / 60000);
    return api.sendMessage({
      msg: `❌ Bạn đã hết lượt quay! Hết hạn sau ${remainMin} phút nữa.`,
      quote: message, ttl: 15000
    }, threadId, message.type);
  }
  
  // Kiểm tra xương
  if ((p.bones || 0) < GACHA_COST) {
    return api.sendMessage({
      msg: `❌ Không đủ xương! Cần ${GACHA_COST} xương, bạn có ${p.bones || 0} xương.`,
      quote: message, ttl: 15000
    }, threadId, message.type);
  }
  
  // Trừ xương và tăng số lượt
  p.bones -= GACHA_COST;
  p.gachaRolls = (p.gachaRolls || 0) + 1;
  if (!p.gachaResetAt) p.gachaResetAt = now;
  
  // Quay thưởng
  const result = getGachaWeightedRandom();
  let rewardMsg = "";
  
  switch (result.type) {
    case "material": {
      const matPool = ["101", "102", "103", "104", "105", "106", "107", "108"];
      const matId = matPool[Math.floor(Math.random() * matPool.length)];
      const mat = MATERIALS.find(m => m.id === matId);
      if (mat) {
        if (!p.inventory.materials) p.inventory.materials = {};
        p.inventory.materials[mat.id] = (p.inventory.materials[mat.id] || 0) + 1;
        rewardMsg = `🌾 ${mat.emoji} ${mat.name} ×1`;
      } else {
        // Fallback: random từ MATERIALS
        const randomMat = MATERIALS[Math.floor(Math.random() * MATERIALS.length)];
        if (!p.inventory.materials) p.inventory.materials = {};
        p.inventory.materials[randomMat.id] = (p.inventory.materials[randomMat.id] || 0) + 1;
        rewardMsg = `🌾 ${randomMat.emoji} ${randomMat.name} ×1`;
      }
      break;
    }
    case "lt_500k":
      p.spiritStones = (p.spiritStones || 0) + 500000;
      rewardMsg = `💎 500,000 Linh Thạch`;
      break;
    case "lt_10m":
      p.spiritStones = (p.spiritStones || 0) + 10000000;
      rewardMsg = `💎 10,000,000 Linh Thạch`;
      break;
    case "soul":
      p.soul = (p.soul || 0) + 1;
      rewardMsg = `👻 Soul (Linh hồn) ×1`;
      break;
    case "fire":
      p.fire = (p.fire || 0) + 1;
      rewardMsg = `🔥 Fire (Lửa thiêng) ×1`;
      break;
  }
  
  savePlayer(senderId);
  
  const msg = `🎰 GACHA ROLL #${p.gachaRolls}/${GACHA_MAX_ROLLS}
━━━━━━━━━━━━━━━━
🦴 Tiêu tốn: ${GACHA_COST} xương
🎁 Phần thưởng: ${rewardMsg}
━━━━━━━━━━━━━━━━
🦴 Xương còn lại: ${p.bones || 0}
💡 Dùng ${prefix}tl attack soul để triệu hồi & đánh Thần Chết (cần Soul)
💡 Dùng ${prefix}tl exfire để đổi Kiếm Lửa (cần Fire)`;
  
  return api.sendMessage({ msg, quote: message, ttl: 30000 }, threadId, message.type);
}

// ── .TL ATTACK SOUL: TRIỆU HỒI & ĐÁNH THẦN CHẾT ─────────────
const DEATH_BOSS_REALM = 30;
const DEATH_BOSS_NAME = "Thần Chết";
const DEATH_BOSS_HP_MULT = 1.5;
const DEATH_BOSS_ATK_MULT = 1.3;
const REAPER_SCYTHE_DROP_RATE = 2; // 2%
const REAPER_SCYTHE_ID = "w_reaper_1";

async function handleAttackSoul(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  const threadKey = String(message.threadId);
  const myName = message.data.dName || "Đạo hữu";
  
  // Kiểm tra đang ở Bí Cảnh
  if (p.inSecretRealm) {
    return api.sendMessage({ msg: `❌ Bạn đang ở Bí Cảnh! Rời đi trước khi triệu hồi Thần Chết.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  
  // Kiểm tra trọng thương
  if (p.trongThuongUntil && Date.now() < p.trongThuongUntil) {
    return api.sendMessage({ msg: `❌ Bạn đang trọng thương! Hồi phục trước khi thách đấu Thần Chết.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  
  const boss = soulBossState[threadKey];
  
  // ── Nếu chưa có boss → TRIỆU HỒI BOSS MỚI ──
  if (!boss || Date.now() >= boss.expiresAt) {
    // Kiểm tra Soul
    if ((p.soul || 0) < 1) {
      return api.sendMessage({
        msg: `❌ Bạn cần ít nhất 1 Soul để triệu hồi Thần Chết!\n💡 Soul có thể nhận từ gacha: ${prefix}tl gacha`,
        quote: message, ttl: 15000
      }, message.threadId, message.type);
    }
    
    // Trừ Soul
    p.soul -= 1;
    
    // Tạo boss
    const bossStats = calcStats(p);
    const bossHp = Math.floor(bossStats.hp * DEATH_BOSS_HP_MULT);
    const bossAtk = Math.floor(bossStats.atk * DEATH_BOSS_ATK_MULT);
    
    soulBossState[threadKey] = {
      hp: bossHp,
      maxHp: bossHp,
      atk: bossAtk,
      contributors: {},
      expiresAt: Date.now() + SOUL_BOSS_LIFETIME_MS,
      timer: null,
      spawnedBy: String(senderId),
    };
    
    // Set timer boss biến mất
    soulBossState[threadKey].timer = setTimeout(() => {
      const b = soulBossState[threadKey];
      if (!b) return;
      const hitters = Object.keys(b.contributors);
      if (hitters.length > 0) {
        api.sendMessage({
          msg: `💀 Thần Chết đã biến mất! ${hitters.length} đạo hữu đã chiến đấu dũng cảm nhưng chưa hạ được nó...`,
          quote: message, ttl: 30000
        }, message.threadId, message.type);
      } else {
        api.sendMessage({
          msg: `💀 Thần Chết đã biến mất mà không ai dám ra đòn!`,
          quote: message, ttl: 30000
        }, message.threadId, message.type);
      }
      delete soulBossState[threadKey];
    }, SOUL_BOSS_LIFETIME_MS);
    
    savePlayer(senderId);
    
    const msg = `💀💀💀 THẦN CHẾT ĐÃ XUẤT HIỆN! 💀💀💀
━━━━━━━━━━━━━━━━
⚡ ${myName} đã triệu hồi Thần Chết bằng 1 Soul!
❤️ HP: ${formatNumber(bossHp)}
⚔️ ATK: ${formatNumber(bossAtk)}
💨 Tỉ lệ né: ${100 - SOUL_BOSS_HIT_CHANCE}%
⏰ Còn ${SOUL_BOSS_LIFETIME_MS / 1000 / 60} phút trước khi biến mất!
━━━━━━━━━━━━━━━━
💥 Gõ ${prefix}tl attack soul để tấn công!
💡 Ai cũng có thể đánh, phần thưởng chia đều!`;
    
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }
  
  // ── Boss đangactive → TIẾN HÀNH TẤN CÔNG ──
  const cdKey = `${threadKey}_${senderId}`;
  const lastHit = soulBossAttackCd.get(cdKey) || 0;
  const cdRemain = SOUL_BOSS_ATTACK_CD_MS - (Date.now() - lastHit);
  if (cdRemain > 0) {
    return api.sendMessage({ msg: `⏳ Nghỉ đã! Chờ ${(cdRemain / 1000).toFixed(1)}s nữa mới ra đòn tiếp được.`, quote: message, ttl: 5000 }, message.threadId, message.type);
  }
  soulBossAttackCd.set(cdKey, Date.now());
  
  // Kiểm tra né đòn
  if (Math.random() * 100 >= SOUL_BOSS_HIT_CHANCE) {
    return api.sendMessage({ msg: `💨 ${myName} ra đòn nhưng ${DEATH_BOSS_NAME} lắc người né tránh — TRƯỢT!`, quote: message, ttl: 8000 }, message.threadId, message.type);
  }
  
  // Tính sát thương
  const stats = calcStats(p);
  const hasReaperScythe = p.equippedWeapon === REAPER_SCYTHE_ID;
  const hasFireSword = p.equippedWeapon === "w_fire_1";
  
  let dmg = Math.max(1, Math.floor(stats.atk * (0.85 + Math.random() * 0.3)));
  if (hasReaperScythe) dmg = Math.floor(dmg * 1.5); // Lưỡi Hái +50% dame
  
  boss.hp -= dmg;
  boss.contributors[String(senderId)] = (boss.contributors[String(senderId)] || 0) + dmg;
  
  // Thiêu đốt từ Kiếm Lửa
  let burnMsg = "";
  if (hasFireSword && boss.hp > 0) {
    const burnDmg = Math.floor(boss.maxHp * 0.01);
    boss.hp -= burnDmg;
    burnMsg = `\n🔥 Thiêu đốt: -${formatNumber(burnDmg)} HP`;
  }
  
  // Boss bị hạ gục
  if (boss.hp <= 0) {
    const oldTimer = boss.timer;
    delete soulBossState[threadKey];
    if (oldTimer) clearTimeout(oldTimer);
    
    const hitters = Object.keys(boss.contributors);
    const share = Math.floor((SOUL_BOSS_REWARD_LT_MIN + Math.random() * (SOUL_BOSS_REWARD_LT_MAX - SOUL_BOSS_REWARD_LT_MIN)) / Math.max(1, hitters.length));
    
    // Kiểm tra ai rớt Lưỡi Hái
    const reaperDrops = [];
    for (const uid of hitters) {
      const pl = getPlayer(uid);
      pl.spiritStones = (pl.spiritStones || 0) + share;
      if (Math.random() * 100 < REAPER_SCYTHE_DROP_RATE) {
        addItem(uid, REAPER_SCYTHE_ID, "weapon");
        reaperDrops.push(uid);
      }
    }
    saveData();
    
    const nameLines = [];
    for (const uid of hitters) {
      const nm = await getPlayerDisplayName(api, uid);
      const dropLine = reaperDrops.includes(uid) ? ` + 💀 Lưỡi Hái Tử Thần!` : "";
      nameLines.push(`⚔️ ${nm}: +${formatNumber(share)} LT${dropLine}`);
    }
    
    const msg = `🎉 HẠ GỤC THẦN CHẾT!
━━━━━━━━━━━━━━━━
👑 ${DEATH_BOSS_NAME} đã bị tiêu diệt! Phần thưởng chia cho ${hitters.length} đạo hữu:
${nameLines.join("\n")}
━━━━━━━━━━━━━━━━
💎 Mỗi người nhận: +${formatNumber(share)} LT
💀 Lưỡi Hái Tử Thần: ${reaperDrops.length > 0 ? "ĐÃ RƠI!" : "Không(2% chance)"}`;
    
    return api.sendMessage({ msg, quote: message, ttl: 120000 }, message.threadId, message.type);
  }
  
  // HP còn lại
  const hpPct = Math.max(0, Math.min(100, Math.floor((boss.hp / boss.maxHp) * 100)));
  const barLen = Math.max(1, Math.floor(hpPct / 10));
  const bar = "█".repeat(barLen) + "░".repeat(10 - barLen);
  const msg = `💥 ${myName} đánh trúng ${DEATH_BOSS_NAME}!
━━━━━━━━━━━━━━━━
🔥 Sát thương: ${formatBig(dmg)}${burnMsg}
❤️ HP Boss còn: [${bar}] ${hpPct}% (${formatBig(boss.hp)})
⏰ Còn ${Math.ceil((boss.expiresAt - Date.now()) / 1000)}s trước khi biến mất`;
  
  await api.sendMessage({ msg, quote: message, ttl: 15000 }, message.threadId, message.type);
}

// ── .TL EXFIRE: ĐỔI KIẾM LỬA ────────────────────────────────
const FIRE_SWORD_COST_LT = 2500000000; // 2.5 tỷ LT
const FIRE_SWORD_COST_BONES = 100;
const FIRE_SWORD_ID = "w_fire_1";

async function handleExFire(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  const threadId = message.threadId;
  
  // Kiểm tra đã có Kiếm Lửa chưa
  if (hasItem(senderId, FIRE_SWORD_ID)) {
    return api.sendMessage({
      msg: `❌ Bạn đã sở hữu Kiếm Lửa rồi!`,
      quote: message, ttl: 15000
    }, threadId, message.type);
  }
  
  // Kiểm tra Fire
  if ((p.fire || 0) < 1) {
    return api.sendMessage({
      msg: `❌ Bạn cần 1 Fire (Lửa thiêng) để đổi Kiếm Lửa! Fire có thể nhận từ gacha.`,
      quote: message, ttl: 15000
    }, threadId, message.type);
  }
  
  // Kiểm tra LT
  if ((p.spiritStones || 0) < FIRE_SWORD_COST_LT) {
    return api.sendMessage({
      msg: `❌ Không đủ Linh Thạch! Cần ${formatNumber(FIRE_SWORD_COST_LT)} LT, bạn có ${formatNumber(p.spiritStones || 0)} LT.`,
      quote: message, ttl: 15000
    }, threadId, message.type);
  }
  
  // Kiểm tra xương
  if ((p.bones || 0) < FIRE_SWORD_COST_BONES) {
    return api.sendMessage({
      msg: `❌ Không đủ xương! Cần ${FIRE_SWORD_COST_BONES} xương, bạn có ${p.bones || 0} xương.`,
      quote: message, ttl: 15000
    }, threadId, message.type);
  }
  
  // Trừ nguyên liệu
  p.fire -= 1;
  p.spiritStones -= FIRE_SWORD_COST_LT;
  p.bones -= FIRE_SWORD_COST_BONES;
  
  // Nhận Kiếm Lửa
  addItem(senderId, FIRE_SWORD_ID, "weapon");
  savePlayer(senderId);
  
  const msg = `🔥🔥🔥 KIẾM LỬA ĐÃ ĐƯỢC RÈN! 🔥🔥🔥
━━━━━━━━━━━━━━━━
🎁 Bạn đã nhận được Kiếm Lửa!
⚔️ ATK: 100Qa
🎯 CRIT: +10%
💀 Bỏ qua giảm thương
🔥 Hiệu ứng: Thiêu đốt 1% máu tối đa địch mỗi hiệp
💔 Giảm 35% hút máu/hồi máu kẻ địch
━━━━━━━━━━━━━━━━
💡 Dùng ${prefix}tl equip ${FIRE_SWORD_ID} để trang bị!`;
  
  return api.sendMessage({ msg, quote: message, ttl: 30000 }, threadId, message.type);
}

// ── .TL GHEP: GHÉP THỦ CÔNG YAMA + TUSHITA → ODEN ──────────
async function handleGhepOden(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  if (hasItem(senderId, ODEN_ID)) {
    return api.sendMessage({
      msg: `⚔️ Bạn đã sở hữu Song Kiếm Oden rồi — không còn gì để ghép!`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  const yama = WEAPONS.find(w => w.id === YAMA_ID);
  const tushita = WEAPONS.find(w => w.id === TUSHITA_ID);
  const missing = [];
  if (!hasItem(senderId, YAMA_ID)) missing.push(`${yama?.emoji || ""} ${yama?.name || YAMA_ID}`);
  if (!hasItem(senderId, TUSHITA_ID)) missing.push(`${tushita?.emoji || ""} ${tushita?.name || TUSHITA_ID}`);

  if (missing.length > 0) {
    return api.sendMessage({
      msg: `❌ Không thể ghép — còn thiếu:\n${missing.map(m => `• ${m}`).join("\n")}
━━━━━━━━━━━━━━━
☠️ Yama: ${prefix}tl thurut
🌸 Tushita: cầm Yama (${prefix}tl equip ${YAMA_ID}) rồi ${prefix}tl fight`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  const fusionMsg = checkSongKiemFusion(senderId, message.data.dName || "Đạo hữu");
  if (!fusionMsg) {
    return api.sendMessage({ msg: "❌ Ghép thất bại do lỗi dữ liệu, hãy thử lại sau!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  return api.sendMessage({ msg: fusionMsg, quote: message, ttl: 120000 }, message.threadId, message.type);
}

// ── .TL THUCTINH: NÂNG CẤP ODEN → ODEN THỨC TỈNH ───────────
async function handleThucTinhOden(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  if (hasItem(senderId, ODEN_3_ID)) {
    return api.sendMessage({
      msg: `🔱 Song Kiếm Oden của bạn đã THỨC TỈNH — không thể thức tỉnh lần nữa!`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }
  if (!hasItem(senderId, ODEN_ID)) {
    return api.sendMessage({
      msg: `❌ Bạn chưa có ⚔️ Oden - Song Kiếm Trảm Long để thức tỉnh!
━━━━━━━━━━━━━━
☠️ Yama: ${prefix}tl thurut
🌸 Tushita: ${prefix}tl fight
⚔️ Oden: ${prefix}tl ghep`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  const material = WEAPONS.find(w => w.id === THUCTINH_MATERIAL_ID);
  const missing = [];
  if (!hasItem(senderId, THUCTINH_MATERIAL_ID)) missing.push(`${material?.emoji || ""} ${material?.name || "Thạch Phong Thần Kiếm"} (.tl rutkiem)`);
  if ((p.spiritStones || 0) < THUCTINH_COST_LT) missing.push(`💎 ${formatNumber(THUCTINH_COST_LT)} LT (đang có ${formatNumber(p.spiritStones || 0)} LT)`);
  if (missing.length > 0) {
    return api.sendMessage({
      msg: `❌ Chưa đủ điều kiện thức tỉnh:\n${missing.map(m => `• ${m}`).join("\n")}`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  // Tiêu hao nguyên liệu
  delete p.inventory.weapons[THUCTINH_MATERIAL_ID];
  p.spiritStones -= THUCTINH_COST_LT;
  // Nâng cấp Oden
  delete p.inventory.weapons[ODEN_ID];
  p.inventory.weapons[ODEN_3_ID] = 1;
  if (p.equippedWeapon === ODEN_ID) p.equippedWeapon = ODEN_3_ID;
  savePlayer(senderId);
  logAdminAction(senderId, "oden_awaken", "THỨC TỈNH Oden - Song Kiếm Thức Tỉnh", null);

  const oden3 = WEAPONS.find(w => w.id === ODEN_3_ID);
  const materialName = material ? `${material.emoji} ${material.name}` : "Thạch Phong Thần Kiếm";
  const msg = `⚡⚡⚡ SONG KIẾM ODEN THỨC TỈNH! ⚡⚡⚡
━━━━━━━━━━━━━━━
🗿 ${materialName} tan thành linh khí hòa vào lưỡi kiếm...
⚔️ Hai linh hồn Yama - Tushita rú lên đầy phấn khích!
🔱 ${(message.data.dName || "Đạo hữu")} NHẬN ĐƯỢC ${oden3.emoji} ${oden3.name}!
━━━━━━━━━━━━━━━
📊 Chỉ số sau thức tỉnh:
⚔️ ATK: +${formatNumber(oden3.atk)} (×2)
💨 SPD: +${formatNumber(oden3.spd)}
💥 CRIT: +${oden3.crit}%
⚡ ST Chuẩn: +${oden3.trueDmg}%
━━━━━━━━━━━━━━━
💰 Tiêu hao: ${formatNumber(THUCTINH_COST_LT)} LT + ${materialName}
💡 Đã tự động trang bị!`;

  return api.sendMessage({ msg, quote: message, ttl: 120000 }, message.threadId, message.type);
}

// ── .TL FIGHT: BOSS HỖN ĐỘN CẦM TUSHITA ────────────────────
const FIGHT_BOSS_NAME = "Hỗn Độn Kiếm Linh";
const FIGHT_COOLDOWN_MS = 10 * 60 * 1000;

async function handleFightTushita(api, message, p, senderId) {
  const prefix = getGlobalPrefix();

  if (hasItem(senderId, TUSHITA_ID) || hasItem(senderId, ODEN_ID) || hasItem(senderId, ODEN_3_ID)) {
    return api.sendMessage({
      msg: `🌸 Bạn đã sở hữu Tushita (hoặc Oden) rồi! Hỗn Độn Kiếm Linh không còn gì để mất.\n💡 Dùng ${prefix}tl equip để trang bị.`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }
  if (!hasItem(senderId, YAMA_ID)) {
    return api.sendMessage({
      msg: `☠️ Nghe đồn Boss Hỗn Độn cầm một thanh kiếm huyền bí... nhưng thân phận phàm nhân như bạn không thể chạm vào nó.\n💡 Trước tiên phải có Yama: ${prefix}tl thurut`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }
  if (p.trongThuongUntil && Date.now() < p.trongThuongUntil) {
    return api.sendMessage({ msg: `❌ Đang trọng thương, không thể chiến đấu!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const last = p.fightLastAt || 0;
  const elapsed = Date.now() - last;
  if (elapsed < FIGHT_COOLDOWN_MS) {
    const left = Math.ceil((FIGHT_COOLDOWN_MS - elapsed) / 60000);
    return api.sendMessage({
      msg: `😮‍💨 Linh lực chưa hồi phục sau lần giao chiến trước. Chờ ${left} phút nữa!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }
  p.fightLastAt = Date.now();

  // Boss Hỗn Độn cảnh 27, cầm kiếm Tushita
  const bossPlayer = {
    talent: "pham",
    theChat: 1,
    huyetMach: 1,
    linhCan: 1,
    majorRealm: TUSHITA_BOSS_REALM,
    minorRealm: MAX_MINOR_REALM,
    phithangCount: 0,
    donated: 0,
    equippedWeapon: TUSHITA_ID,
    equippedArmor: null,
    equippedPhapTac: null,
    buffs: [],
  };
  const name = FIGHT_BOSS_NAME;
  const bStats = calcStats(bossPlayer);
  bStats.dodge = TOWER_BOSS_DODGE;
  const myStats = calcStats(p);
  const hasYamaPower = p.equippedWeapon === YAMA_ID || p.equippedWeapon === ODEN_ID || p.equippedWeapon === ODEN_3_ID;

  // ── Mô phỏng trận đấu ──
  let hpMe = myStats.hp, hpBoss = bStats.hp;
  const roundLines = [];
  const playerFirst = myStats.spd >= bStats.spd;
  const MAX_R = 30;

  const strike = (atkS, defS, defDodge, defReduction, defMaxPct, defHpMax, canCrit = true) => {
    if (Math.random() * 100 < Math.max(0, defDodge)) return { dodge: true, dmg: 0, crit: false };
    const effDef = Math.max(0, defS.def * (1 - (atkS.armorPen || 0) / 100));
    const dmgRaw = Math.max(1, atkS.atk * (0.85 + Math.random() * 0.30));
    const isCrit = canCrit && Math.random() * 100 < Math.max(0, atkS.crit - (defS.critResist || 0));
    const truePct = Math.max(0, atkS.trueDmg || 0) / 100;
    const truePart = Math.floor(dmgRaw * truePct);
    const normalPart = Math.max(0, Math.floor(dmgRaw * (1 - truePct) - effDef * 0.25));
    let dmg = Math.max(1, truePart + normalPart);
    if (isCrit) dmg = Math.floor(dmg * (2 + (atkS.critDmg || 0) / 100));
    dmg = Math.max(0, Math.floor(dmg * (1 - (defReduction || 0) / 100)));
    if (defMaxPct > 0) dmg = Math.min(dmg, Math.floor(defHpMax * defMaxPct / 100));
    return { dodge: false, dmg, crit: isCrit };
  };

  for (let r = 1; r <= MAX_R && hpMe > 0 && hpBoss > 0; r++) {
    const seq = playerFirst ? [["me", hpBoss], ["boss", hpMe]] : [["boss", hpMe], ["me", hpBoss]];
    for (const [who] of seq) {
      if (who === "me" && hpMe > 0 && hpBoss > 0) {
        if (!hasYamaPower) {
          roundLines.push(`🚫 Hiệp ${r}: Đòn của bạn xuyên qua người ${name} như vô hình — cần CẦM Yama mới làm nó đau!`);
          continue;
        }
        const res = strike(myStats, bStats, bStats.dodge, bStats.dmgReduction, 0, bStats.hp, false);
        if (res.dodge) { roundLines.push(`💨 Hiệp ${r}: ${name} né đòn của bạn!`); continue; }
        const leech = Math.floor(res.dmg * myStats.lifesteal / 100);
        hpMe = Math.min(myStats.hp, hpMe + leech);
        hpBoss = Math.max(0, hpBoss - res.dmg);
        roundLines.push(`${res.crit ? "⚡" : "⚔️"} Hiệp ${r}: Bạn -> ${name}: ${formatBig(res.dmg)}${res.crit ? " CHÍ MẠNG" : ""}`);
      } else if (who === "boss" && hpBoss > 0 && hpMe > 0) {
        const res = strike(bStats, { ...myStats, def: 0 }, myStats.dodge, 0, myStats.maxDmgPct, myStats.hp);
        if (res.dodge) { roundLines.push(`💨 Hiệp ${r}: Bạn né đòn của ${name}!`); continue; }
        const leech = Math.floor(res.dmg * bStats.lifesteal / 100);
        hpBoss = Math.min(bStats.hp, hpBoss + leech);
        hpMe = Math.max(0, hpMe - res.dmg);
        roundLines.push(`${res.crit ? "⚡" : "⚔️"} Hiệp ${r}: ${name} -> Bạn: ${formatBig(res.dmg)}${res.crit ? " CHÍ MẠNG" : ""}`);
      }
    }
  }

  const won = hpBoss <= 0 && hpMe > 0;
  const timeoutDraw = hpMe > 0 && hpBoss > 0;

  let resultBlock;
  if (won) {
    addItem(senderId, TUSHITA_ID, "weapon");
    const tushita = WEAPONS.find(w => w.id === TUSHITA_ID);
    logAdminAction(senderId, "fight", "HẠ Hỗn Độn Kiếm Linh — NHẬN ĐƯỢC Tushita", null);
    resultBlock = `🌸🌸🌸 TUSHITA THỦ PHỤ! 🌸🌸🌸
━━━━━━━━━━━━━━━━
☠️ ${name} gục ngã. Thanh kiếm trên tay nó phát ra tiếng khóc nhạc điệu...
👑 ${(message.data.dName || "Đạo hữu")} ĐOẠT ĐƯỢC ${tushita.emoji} ${tushita.name}!
⚔️ ATK: +${formatNumber(tushita.atk)} | 💨 SPD: +${formatNumber(tushita.spd)}
💥 CRIT: +${tushita.crit}% | ⚡ ST Chuẩn: +${tushita.trueDmg}%
💡 ${prefix}tl equip ${TUSHITA_ID} để trang bị!
🌸 Nghe đồn: sở hữu cả Yama lẫn Tushita... hai linh hồn sẽ cộng hưởng!`;
    const fusionMsg = checkSongKiemFusion(senderId, message.data.dName || "Đạo hữu");
    if (fusionMsg) resultBlock += `\n\n${fusionMsg}`;
  } else {
    resultBlock = timeoutDraw
      ? `⏳ Hòa sau ${MAX_R} hiệp — Hỗn Độn Kiếm Linh vẫn nguyên vẹn!\n💡 Trang bị mạnh hơn rồi thử lại (không mất gì).`
      : `💀 THẤT BẠI! Bạn bị ${name} đánh gục bằng chính Tushita!\n💡 Luyện thêm, nâng cấp trang bị rồi quay lại báo thù.`;
  }

  savePlayer(senderId);

  const shown = roundLines.slice(0, 14);
  const moreLine = roundLines.length > shown.length ? `\n... và ${roundLines.length - shown.length} diễn biến nữa` : "";
  const msg = `🌀 THÍCH ĐỊA: HỖN ĐỘN KHÔNG PHÂN BIỆT
━━━━━━━━━━━━━━━━
👹 ${name} — ${getRealmDisplay(bossPlayer.majorRealm, bossPlayer.minorRealm, p.daotam)} (cảnh ${bossPlayer.majorRealm})
📊 Boss: ${formatBig(bStats.atk)} ATK | ${formatBig(bStats.hp)} HP | SPD ${formatBig(bStats.spd)} | Né ${bStats.dodge}%
🌸 ⚠️ BOSS ĐANG CẦM 🌸 TUSHITA! ${hasYamaPower ? "☠️ Yama trong tay bạn rung lên dữ dội..." : "❌ Bạn KHÔNG cầm Yama — đòn đánh sẽ vô hiệu!"}
━━━━━━━━━━━━━━━━
${shown.join("\n")}${moreLine}
━━━━━━━━━━━━━━━━
📜 Kết thúc: Bạn còn ${formatBig(hpMe)} HP | Boss còn ${formatBig(hpBoss)} HP
${resultBlock}`;
  await api.sendMessage({ msg, quote: message, ttl: 120000 }, message.threadId, message.type);
}

// ── MINI GAME HỘP QUÀ ──────────────────────────────────────
const MINIGAME_ADMIN_ID = EXP_MULT_ADMIN_ID;
const MINIGAME_BOX_COUNT = 10;
const MINIGAME_STONES = [50000, 100000, 200000, 500000, 1000000, 2000000];
const MINIGAME_POTIONS = [
  { id: "1", qty: 2 }, { id: "2", qty: 1 }, { id: "4", qty: 1 }, { id: "5", qty: 2 },
  { id: "7", qty: 2 }, { id: "8", qty: 1 }, { id: "11", qty: 2 }, { id: "27", qty: 2 },
  { id: "28", qty: 2 }, { id: "29", qty: 2 }, { id: "33", qty: 1 },
];
const minigameSessions = {};

function shuffleArr(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function rollMinigameBoxes() {
  const rewards = [];
  for (let i = 0; i < 4; i++) {
    rewards.push({ type: "lt", amount: MINIGAME_STONES[Math.floor(Math.random() * MINIGAME_STONES.length)] });
  }
  const potPool = [...MINIGAME_POTIONS];
  shuffleArr(potPool);
  for (let i = 0; i < 3; i++) {
    const p = potPool[i % potPool.length];
    rewards.push({ type: "dan", id: p.id, qty: p.qty });
  }
  for (let i = 0; i < 3; i++) {
    const m = MATERIALS[Math.floor(Math.random() * MATERIALS.length)];
    rewards.push({ type: "nl", id: m.id, qty: 2 + Math.floor(Math.random() * 4) });
  }
  shuffleArr(rewards);
  return rewards.map(r => ({ reward: r, opened: false, byId: null, byName: null }));
}

function describeMinigameReward(r) {
  if (r.type === "lt") return `${formatNumber(r.amount)} Linh Thạch`;
  if (r.type === "dan") {
    const po = POTIONS.find(x => x.id === r.id);
    return `${r.qty}x ${po ? po.name : "Đan dược"}`;
  }
  const m = MATERIALS.find(x => x.id === r.id);
  return `${r.qty}x ${m ? m.name : "Nguyên liệu"}`;
}

function shortRewardText(r) {
  if (r.type === "lt") return `${Math.round(r.amount / 1000)}k LT`;
  if (r.type === "dan") {
    const po = POTIONS.find(x => x.id === r.id);
    return `${r.qty}x ${po?.emoji || ""} ${po?.name || "Đan"}`;
  }
  const m = MATERIALS.find(x => x.id === r.id);
  return `${r.qty}x ${m?.emoji || ""} ${m?.name || "NL"}`;
}

async function sendMinigameImage(api, session, threadId, type) {
  let imagePath = null;
  try {
    imagePath = await generateMinigameBoxes({ boxes: session.boxes });
    await api.sendMessage({ msg: "", attachments: [imagePath], ttl: 120000 }, threadId, type);
  } catch (e) {
    console.error("Lỗi tạo ảnh minigame:", e);
  } finally {
    if (imagePath) {
      try { await clearImagePath(imagePath); } catch {}
    }
  }
}

async function handleMinigame(api, message, senderId) {
  const threadId = message.threadId;
  if (!isDangSangThe(senderId)) {
    return api.sendMessage({
      msg: "❌ Chỉ Đấng Sáng Thế mới dùng được lệnh này!",
      quote: message, ttl: 15000,
    }, threadId, message.type);
  }

  const old = minigameSessions[threadId];
  if (old && old.boxes.some(b => !b.opened)) {
    return api.sendMessage({
      msg: `❌ Nhóm này đang có mini game chưa kết thúc! (${old.boxes.filter(b => b.opened).length}/${MINIGAME_BOX_COUNT} hộp đã mở)\n💡 Chờ mọi người mở hết quà rồi hãy tạo mới.`,
      quote: message, ttl: 30000,
    }, threadId, message.type);
  }

  minigameSessions[threadId] = {
    boxes: rollMinigameBoxes(),
    createdAt: Date.now(),
  };

  await api.sendMessage({
    msg: `🎁 MINI GAME HỘP QUÀ MỞ!
━━━━━━━━━━━━━━━━
📦 10 hộp quà đã được đặt trong nhóm này!
🏆 Thưởng gồm: Đan dược • Nguyên liệu • Linh Thạch
📝 Dùng .tl moqua <số> (1-10) để mở hộp
⚠️ Mỗi người chỉ mở được MỘT hộp duy nhất — chọn khôn ngoan nhé!
⏳ Hết quà trò chơi tự kết thúc!`,
    quote: message, ttl: 120000,
  }, threadId, message.type);

  await sendMinigameImage(api, minigameSessions[threadId], threadId, message.type);
}

async function handleMoQua(api, message, p, senderId, sub2) {
  const threadId = message.threadId;
  const session = minigameSessions[threadId];

  if (!session || !session.boxes.some(b => !b.opened)) {
    return api.sendMessage({
      msg: `❌ Không có mini game nào đang chạy ở nhóm này!\n💡 Chờ quản trị viên dùng .tl minigame để mở.`,
      quote: message, ttl: 15000,
    }, threadId, message.type);
  }

  if (!/^\d+$/.test(sub2 || "")) {
    return api.sendMessage({
      msg: `❌ Sai cú pháp! Dùng: .tl moqua <số> (1-${MINIGAME_BOX_COUNT})`,
      quote: message, ttl: 15000,
    }, threadId, message.type);
  }

  const boxNum = parseInt(sub2, 10);
  if (boxNum < 1 || boxNum > MINIGAME_BOX_COUNT) {
    return api.sendMessage({
      msg: `❌ Chỉ có hộp số 1 đến ${MINIGAME_BOX_COUNT}!`,
      quote: message, ttl: 15000,
    }, threadId, message.type);
  }

  const alreadyOpenedBy = session.boxes.find(b => b.byId === String(senderId));
  if (alreadyOpenedBy) {
    return api.sendMessage({
      msg: `❌ Bạn đã mở hộp số ${session.boxes.indexOf(alreadyOpenedBy) + 1} rồi! Mỗi người chỉ được mở 1 hộp.`,
      quote: message, ttl: 15000,
    }, threadId, message.type);
  }

  const box = session.boxes[boxNum - 1];
  if (box.opened) {
    return api.sendMessage({
      msg: `❌ Hộp số ${boxNum} đã bị ${box.byName} mở mất rồi! Chọn hộp khác đi.`,
      quote: message, ttl: 15000,
    }, threadId, message.type);
  }

  // Trao thưởng
  const r = box.reward;
  let rewardLine = "";
  if (r.type === "lt") {
    p.spiritStones = (p.spiritStones || 0) + r.amount;
    rewardLine = `💎 ${formatNumber(r.amount)} Linh Thạch`;
  } else if (r.type === "dan") {
    addItem(senderId, r.id, "potion", r.qty);
    rewardLine = `⚗️ ${describeMinigameReward(r)}`;
  } else {
    if (!p.inventory.materials) p.inventory.materials = {};
    p.inventory.materials[r.id] = (p.inventory.materials[r.id] || 0) + r.qty;
    savePlayer(senderId);
    rewardLine = `🌿 ${describeMinigameReward(r)}`;
  }

  box.opened = true;
  box.byId = String(senderId);
  box.byName = message.data.dName || "Đạo hữu";
  box.rewardShort = shortRewardText(r);

  const openedCount = session.boxes.filter(b => b.opened).length;
  const remain = MINIGAME_BOX_COUNT - openedCount;

  await api.sendMessage({
    msg: `🎉 ${box.byName} đã mở HỘP SỐ ${boxNum}!
━━━━━━━━━━━━━━━━
🎁 Nhận được: ${rewardLine}
📦 Còn lại ${remain} hộp chưa mở!`,
    quote: message, ttl: 60000,
  }, threadId, message.type);

  if (remain <= 0) {
    const medals = [];
    session.boxes.forEach((b, i) => {
      medals.push(`${i + 1}. ${b.byName} → ${describeMinigameReward(b.reward)}`);
    });
    delete minigameSessions[threadId];
    await api.sendMessage({
      msg: `🏁 HẾT QUÀ — MINI GAME KẾT THÚC!
━━━━━━━━━━━━━━━━
${medals.join("\n")}
━━━━━━━━━━━━━━━━
✨ Cảm ơn mọi người đã tham gia!`,
      ttl: 120000,
    }, threadId, message.type);
  } else {
    await sendMinigameImage(api, session, threadId, message.type);
  }
}

async function handleShop(api, message, p, senderId, sub2, sub3) {
  const prefix = getGlobalPrefix();
  const primeLevel = getPrimeLevel(p.donated || 0);
  const primeShopUnlocked = primeLevel >= 2;

  if (!sub2) {
    const sales = getFlashSales();
    const now = Date.now();
    const activeSales = Object.entries(sales).filter(([, s]) => now < s.expiresAt)
      .sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    const saleBanner = activeSales.length > 0
      ? `━━━━━━━━━━━━━━━━\n🔥 FLASH SALE ĐANG CHẠY:\n${activeSales.map(([id, s]) => {
          const item = findShopItemAny(id);
          const mins = Math.max(1, Math.ceil((s.expiresAt - now) / 60000));
          const remain = mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60 ? `${mins % 60}p` : ""}` : `${mins}p`;
          return `${item?.emoji || "❓"} [${id}] ${item?.name || id} — giảm ${s.percent}% ⏳ ${remain}`;
        }).join("\n")}\n`
      : "";
    const msg = `🏪 TIỆM TU TIÊN
${saleBanner}━━━━━━━━━━━━━━━━
${prefix}tl shop vukhi — ⚔️ Vũ khí
${prefix}tl shop giap — 🛡️ Giáp
${prefix}tl shop danduoc — 💊 Đan dược
${prefix}tl shop nguyenlieu — 🌿 Nguyên liệu luyện đan
${prefix}tl shop congphap — 📜 Công pháp
${prefix}tl shop phapbao — 🔮 Pháp Bảo
${prefix}tl shop prime ${primeShopUnlocked ? "— 👑 Shop Prime" : "— 🔒 Shop Prime (cần Prime 2)"}
${prefix}tl shop old — 🧰 Chợ Đồ Cũ (vũ khí hỏng, giá rẻ)`;
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }

  if (sub2 === "old" || sub2 === "cu") {
    const pageSize = 5;
    const page = Math.max(1, parseInt(sub3 || "1", 10));
    const total = Math.ceil(OLD_WEAPONS.length / pageSize);
    const pn = Math.min(page, total);
    const slice = OLD_WEAPONS.slice((pn - 1) * pageSize, pn * pageSize);

    const lines = slice.map(w => {
      const parts = [];
      if (w.atk) parts.push(`⚔️+${formatNumber(w.atk)}`);
      if (w.crit) parts.push(`💥+${w.crit}%`);
      if (w.spd) parts.push(`⚡+${formatNumber(w.spd)}`);
      if (w.lifesteal) parts.push(`🩸+${w.lifesteal}%`);
      if (w.bossScale) parts.push(`🗼 Kháng Boss ${w.bossScale}%`);
      const orig = WEAPONS.find(x => w.id === `old_${x.id}`);
      return `[${w.id}] ${w.emoji} ${w.name}\n💰 ${formatNumber(w.price)} LT (gốc: ${orig ? formatNumber(orig.price) : "?"} LT)\n📊 Chỉ số còn ½: ${parts.join(", ")}`;
    });

    const msg = `🧰 CHỢ ĐỒ CŨ (Trang ${pn}/${total})
━━━━━━━━━━━━━━━━
Vũ khí hư hỏng — chỉ số chỉ còn ½ bản gốc, giá rẻ hơn nhiều!
━━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━━
📄 Trang ${pn}/${total} • ${prefix}tl buy <ID> để mua
💡 Ví dụ: ${prefix}tl buy old_w_god_2 — mua Tàng Thiên Kiếm bị hỏng`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  if (sub2 === "prime") {
    if (!primeShopUnlocked) {
      return api.sendMessage({ msg: `🔒 SHOP PRIME BỊ KHÓA!
━━━━━━━━━━━━━━━━
👑 Yêu cầu đạt Prime 2 (nạp 100.000đ) mới mở khóa!
📍 Prime hiện tại: ${primeLevel > 0 ? `PRIME ${primeLevel}` : "Chưa có"}
💡 ${prefix}tl prime để xem thông tin`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }

    const lines = SPECIAL_ITEMS.filter(s => primeLevel >= (s.vipRequired || s.primeRequired || 2)).map(s => {
      const owned = (p.inventory.phapTac?.[s.id] || 0) > 0;
      const eq = p.equippedPhapTac === s.id ? " ✅ (đang trang bị)" : "";
      const req = s.vipRequired ? ` 👑 (đặc quyền VIP ${s.vipRequired})` : (s.primeRequired ? ` (cần Prime ${s.primeRequired})` : "");
      return `[${s.id}] ${s.emoji} ${s.name}${req} \`ID: ${s.id}\`${owned ? ` ✅ (đã sở hữu)${eq}` : ""}\n💰 ${formatNumber(s.price)} LT\n📖 ${s.desc}`;
    });

    const msg = `👑 TIỆM SHOP PRIME
━━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━━
📄 ${prefix}tl buy <ID> để mua`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  if (sub2 === "nguyenlieu" || sub2 === "taphoa" || sub2 === "nl") {
    const page = Math.max(1, parseInt(sub3 || "1", 10) || 1);
    const pageSize = 7;
    const total = Math.ceil(MATERIALS.length / pageSize);
    const pn = Math.min(page, total);
    const slice = MATERIALS.slice((pn - 1) * pageSize, pn * pageSize);

    const lines = slice.map(m =>
      `[${m.id}] ${m.emoji} ${m.name} \`ID: ${m.id}\`\n💰 ${formatNumber(m.price)} LT\n📖 ${m.desc}`
    );

    const msg = `🌿 TIỆM TẠP HÓA — NGUYÊN LIỆU (Trang ${pn}/${total})
━━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━━
📄 Trang ${pn}/${total} • ${prefix}tl buy <ID> [sl] để mua
⚗️ ${prefix}tl luyendan <ID đan> để luyện đan
💡 Nguyên liệu cũng rơi trong Bí Cảnh — ở càng lâu thưởng càng tốt!`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  if (sub2 === "vukhi") {
    const shopWeapons = WEAPONS.filter(w => !w.id.startsWith("old_") && !w.noShop);
    const page = Math.max(1, parseInt(sub3 || "1", 10));
    const pageSize = 5;
    const total = Math.ceil(shopWeapons.length / pageSize);
    const pn = Math.min(page, total);
    const slice = shopWeapons.slice((pn - 1) * pageSize, pn * pageSize);

    const lines = slice.map((w, i) => {
      const idx = (pn - 1) * pageSize + i + 1;
      const parts = [];
      if (w.atk) parts.push(`⚔️+${formatNumber(w.atk)}`);
      if (w.crit) parts.push(`💥+${w.crit}%`);
      if (w.spd) parts.push(`⚡+${formatNumber(w.spd)}`);
      if (w.def) parts.push(`🛡️+${formatNumber(w.def)}`);
      if (w.lifesteal) parts.push(`🩸+${w.lifesteal}%`);
      if (w.critDmg) parts.push(`🔥 ST Bạo +${w.critDmg}%`);
      if (w.bossScale) parts.push(`🗼 Kháng Boss ${w.bossScale}%`);
      return `[${idx}] ${w.emoji} ${w.name} \`ID: ${w.id}\`\n💰 ${formatNumber(w.price)} LT\n📊 ${parts.join(", ")}`;
    });

    const tierLegend = "⚪Thường 🟢Hiếm 🔵Sử thi 🟡Huyền thoại 🟠VIP 🔴God";
    const msg = `⚔️ TIỆM RÈN VŨ KHÍ
━━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━━
${tierLegend}
📄 Trang ${pn}/${total} • ${prefix}tl buy <ID>`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  if (sub2 === "giap" || sub2 === "giáp") {
    const page = Math.max(1, parseInt(sub3 || "1", 10));
    const pageSize = 6;
    const total = Math.ceil(ARMORS.length / pageSize);
    const pn = Math.min(page, total);
    const slice = ARMORS.slice((pn - 1) * pageSize, pn * pageSize);

    const daoMap = { chinh: "⚡", ma: "⚫", nho: "🎓", yeu: "🐾", lo: "🫙", quy: "👻", phat: "🪷" };
    const lines = slice.map((a, i) => {
      const idx = (pn - 1) * pageSize + i + 1;
      const parts = [];
      if (a.atk !== undefined && a.atk !== 0) parts.push(`⚔️+${formatNumber(a.atk)}`);
      if (a.def !== undefined && a.def !== 0) parts.push(`🛡️+${formatNumber(a.def)}`);
      if (a.hp !== undefined && a.hp !== 0) parts.push(`❤️+${formatNumber(a.hp)}`);
      if (a.spd !== undefined && a.spd !== 0) parts.push(`⚡+${formatNumber(a.spd)}`);
      if (a.crit !== undefined && a.crit !== 0) parts.push(`💥+${a.crit}%`);
      if (a.dmgReduction) parts.push(`🛡️ Giảm ST ${a.dmgReduction}%`);
      if (a.reflect) parts.push(`🔁 Phản ${a.reflect}%`);
      if (a.maxDmgPct) parts.push(`🔒 Chặn ST ${a.maxDmgPct}% HP`);
      if (a.lifesteal) parts.push(`🩸 Hút máu +${a.lifesteal}%`);
      if (a.armorPen) parts.push(`⛏️ Xuyên Giáp +${a.armorPen}%`);
      if (a.luck) parts.push(`🍀 Luck +${formatNumber(a.luck)}`);
      if (a.expBonus) parts.push(`✨ EXP +${a.expBonus}%`);
      if (a.dodge) parts.push(`💨 Né +${a.dodge}%`);
      if (a.trueDmg) parts.push(`⚡ ST Chuẩn +${a.trueDmg}%`);
      if (a.beguanNoInjury) parts.push(`📿 Miễn tẩu hỏa`);
      return `[${idx}] ${a.emoji} ${a.name} \`ID: ${a.id}\`\n${a.dao ? `${daoMap[a.dao] || ""} ${a.dao} • ` : "⚪ Chung • "}💰 ${formatNumber(a.price)} LT\n📊 ${parts.join(", ")}`;
    });

    const msg = `🛡️ TIỆM RÈN GIÁP
━━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━━
⚪Chung ⚡Chính ⚫Ma 🎓Nho 🐾Yêu 🫙Lọ 👻Quỷ 🪷Phật
📄 Trang ${pn}/${total} • ${prefix}tl buy <ID>`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  if (sub2 === "danduoc") {
    const page = Math.max(1, parseInt(sub3 || "1", 10));
    const pageSize = 10;
    const total = Math.ceil(POTIONS.length / pageSize);
    const pn = Math.min(page, total);
    const slice = POTIONS.slice((pn - 1) * pageSize, pn * pageSize);

    const lines = slice.map((po, i) => {
      const idx = (pn - 1) * pageSize + i + 1;
      return `[${idx}] ${po.emoji} ${po.name} \`ID: ${po.id}\`\n💰 ${formatNumber(po.price)} LT\n📖 ${po.desc}`;
    });

    const msg = `🏪 CỬA HÀNG LINH ĐAN
━━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━━
📄 Trang ${pn}/${total} • ${prefix}tl buy <ID> [sl]`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  if (sub2 === "congphap") {
    const page = Math.max(1, parseInt(sub3 || "1", 10));
    const pageSize = 10;
    const total = Math.ceil(CONGPHA.length / pageSize);
    const pn = Math.min(page, total);
    const slice = CONGPHA.slice((pn - 1) * pageSize, pn * pageSize);

    const lines = slice.map((cp, i) => {
      const idx = (pn - 1) * pageSize + i + 1;
      return `[${idx}] ${cp.emoji} ${cp.name} \`ID: ${cp.id}\`\n💰 ${formatNumber(cp.price)} LT\n📖 ${cp.desc}`;
    });

    const msg = `📜 TIỆM CÔNG PHÁP
━━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━━
📄 Trang ${pn}/${total} • ${prefix}tl buy <ID>`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  if (sub2 === "phapbao" || sub2 === "pb") {
    const lines = PHAP_BAO.map((pb, i) => {
      const idx = i + 1;
      const parts = [];
      if (pb.atk) parts.push(`⚔️ ATK+${formatNumber(pb.atk)}`);
      if (pb.def) parts.push(`🛡️ DEF+${formatNumber(pb.def)}`);
      if (pb.hp) parts.push(`❤️ HP+${formatNumber(pb.hp)}`);
      if (pb.expBonus) parts.push(`✨ EXP+${pb.expBonus}%`);
      if (pb.bossScale) parts.push(`🗼 Kháng Boss ${pb.bossScale}%`);
      if (pb.reflect) parts.push(`🔁 Phản+${pb.reflect}%`);
      return `[${idx}] ${pb.emoji} ${pb.name} \`ID: ${pb.id}\`\n💰 ${formatNumber(pb.price)} LT\n📊 ${parts.join(", ")}\n📖 ${pb.desc}`;
    });

    const msg = `🔮 TIỆM PHÁP BẢO
━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━
💡 ${prefix}tl buy <ID> để mua
🛡️ ${prefix}tl equip <ID> để trang bị
🔓 ${prefix}tl unequip pb để tháo`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  await api.sendMessage({ msg: `❌ Không tìm thấy shop ${sub2}!`, quote: message, ttl: 15000 }, message.threadId, message.type);
}

async function handleTraCuu(api, message, p, senderId, id) {
  const prefix = getGlobalPrefix();
  if (!id) {
    return api.sendMessage({ msg: `❌ Cú pháp: ${prefix}tl tracuu <ID>\nVD: ${prefix}tl tracuu w1 | ${prefix}tl tracuu 2`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const daoName = { chinh: "⚡ Chính Đạo", ma: "⚫ Ma Đạo", nho: "🎓 Nho Đạo", yeu: "🐾 Yêu Đạo", lo: "🫙 Lọ Đạo" };

  const material = MATERIALS.find(m => m.id === id);
  if (material) {
    const usedIn = Object.entries(RECIPES)
      .filter(([, r]) => r.mats[material.id])
      .map(([pid, r]) => {
        const po = POTIONS.find(x => x.id === pid);
        return po ? `${po.emoji} ${po.name} ×${r.mats[material.id]}` : null;
      })
      .filter(Boolean);
    const msg = `🔍 TRA CỨU NGUYÊN LIỆU
━━━━━━━━━━━━━━━━
${material.emoji} ${material.name} \`ID: ${material.id}\`
💰 Giá: ${formatNumber(material.price)} LT
📖 ${material.desc}
━━━━━━━━━━━━━━━━
⚗️ Dùng trong ${usedIn.length} công thức luyện đan:
${usedIn.join("\n") || "—"}
━━━━━━━━━━━━━━━━
💡 Mua: tl shop nguyenlieu | Rơi trong Bí Cảnh`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  const weapon = WEAPONS.find(w => w.id === id);
  if (weapon) {
    const stats = [];
    if (weapon.atk) stats.push(`⚔️ ATK +${formatNumber(weapon.atk)}`);
    if (weapon.hp) stats.push(`❤️ HP +${formatNumber(weapon.hp)}`);
    if (weapon.spd) stats.push(`⚡ SPD +${formatNumber(weapon.spd)}`);
    if (weapon.crit) stats.push(`💥 CRIT +${weapon.crit}%`);
    if (weapon.def) stats.push(`🛡️ DEF +${formatNumber(weapon.def)}`);
    if (weapon.lifesteal) stats.push(`🩸 Hút máu +${weapon.lifesteal}%`);
    if (weapon.critDmg) stats.push(`🔥 ST Bạo +${weapon.critDmg}%`);
    if (weapon.bossScale) stats.push(`🗼 Kháng Boss Scaling ${weapon.bossScale}%`);
    const msg = `🔍 TRA CỨU VŨ KHÍ
━━━━━━━━━━━━━━━━
${weapon.emoji} ${weapon.name} \`ID: ${weapon.id}\`
━━━━━━━━━━━━━━━━
📊 Chỉ số:
${stats.join("\n")}
━━━━━━━━━━━━━━━━
📖 ${weapon.desc}`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  const armor = ARMORS.find(a => a.id === id);
  if (armor) {
    const stats = [];
    if (armor.atk) stats.push(`⚔️ ATK +${formatNumber(armor.atk)}`);
    if (armor.def) stats.push(`🛡️ DEF +${formatNumber(armor.def)}`);
    if (armor.hp) stats.push(`❤️ HP +${formatNumber(armor.hp)}`);
    if (armor.spd) stats.push(`⚡ SPD +${formatNumber(armor.spd)}`);
    if (armor.crit) stats.push(`💥 CRIT +${armor.crit}%`);
    if (armor.dmgReduction) stats.push(`🛡️ Giảm ST +${armor.dmgReduction}%`);
    if (armor.reflect) stats.push(`🔁 Phản +${armor.reflect}%`);
    if (armor.maxDmgPct) stats.push(`🔒 Chặn ST tối đa ${armor.maxDmgPct}% HP`);
    if (armor.lifesteal) stats.push(`🩸 Hút máu +${armor.lifesteal}%`);
    if (armor.armorPen) stats.push(`⛏️ Xuyên Giáp +${armor.armorPen}%`);
    if (armor.luck) stats.push(`🍀 Luck +${formatNumber(armor.luck)}`);
    if (armor.expBonus) stats.push(`✨ EXP +${armor.expBonus}%`);
    if (armor.dodge) stats.push(`💨 Né +${armor.dodge}%`);
    if (armor.trueDmg) stats.push(`⚡ ST Chuẩn +${armor.trueDmg}%`);
    if (armor.beguanNoInjury) stats.push(`📿 Miễn tẩu hỏa bế quan (quá giờ mất EXP nhưng không trọng thương, cần đang mặc)`);
    const msg = `🔍 TRA CỨU GIÁP
━━━━━━━━━━━━━━━━
${armor.emoji} ${armor.name} \`ID: ${armor.id}\`
━━━━━━━━━━━━━━━━
🎭 Yêu cầu: ${armor.dao ? daoName[armor.dao] || armor.dao : "⚪ Chung"}
━━━━━━━━━━━━━━━━
📊 Chỉ số:
${stats.join("\n")}
━━━━━━━━━━━━━━━━
📖 ${armor.desc}`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  const potion = POTIONS.find(po => po.id === id);
  if (potion) {
    const msg = `🔍 TRA CỨU ĐAN DƯỢC
━━━━━━━━━━━━━━━━
${potion.emoji} ${potion.name} \`ID: ${potion.id}\`
━━━━━━━━━━━━━━━━
📖 Tác dụng: ${potion.desc}`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  const congpha = CONGPHA.find(c => c.id === id);
  if (congpha) {
    const stats = [];
    if (congpha.maxStamina) stats.push(`🟢 Thể lực tối đa +${congpha.maxStamina}`);
    const msg = `🔍 TRA CỨU CÔNG PHÁP
━━━━━━━━━━━━━━━━
${congpha.emoji} ${congpha.name} \`ID: ${congpha.id}\`
━━━━━━━━━━━━━━━━
${stats.length ? `📊 ${stats.join("\n")}\n━━━━━━━━━━━━━━━━\n` : ""}📖 Tác dụng: ${congpha.desc}`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  const special = SPECIAL_ITEMS.find(s => s.id === id);
  if (special) {
    const req = special.primeRequired ? `Shop Prime (Prime ${special.primeRequired})` : "admin ban";
    const msg = `🔍 TRA CỨU KỸ NĂNG
━━━━━━━━━━━━━━━━
${special.emoji} ${special.name} \`ID: ${special.id}\`
━━━━━━━━━━━━━━━━
📖 ${special.desc}
━━━━━━━━━━━━━━━━
💰 Giá: ${formatNumber(special.price)} LT (bán tại ${req})`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  // ── Tra cứu vật phẩm đặc biệt (token) ──
  const token = TOKEN_ITEMS.find(t => t.id === id);
  if (token) {
    const msg = `🔍 TRA CỨU VẬT PHẨM ĐẶC BIỆT
━━━━━━━━━━━━━━━
${token.emoji} ${token.name} \`ID: ${token.id}\`
━━━━━━━━━━━━━━━
📖 ${token.desc}
━━━━━━━━━━━━━━━
💡 Chỉ nhận qua lệnh admin .tl buff item`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  // ── Tra cứu Pháp Bảo ──
  const phapBao = PHAP_BAO.find(pb => pb.id === id);
  if (phapBao) {
    const stats = [];
    if (phapBao.atk) stats.push(`⚔️ ATK +${formatNumber(phapBao.atk)}`);
    if (phapBao.def) stats.push(`🛡️ DEF +${formatNumber(phapBao.def)}`);
    if (phapBao.hp) stats.push(`❤️ HP +${formatNumber(phapBao.hp)}`);
    if (phapBao.expBonus) stats.push(`✨ EXP +${phapBao.expBonus}%`);
    if (phapBao.bossScale) stats.push(`🗼 Kháng Boss ${phapBao.bossScale}%`);
    if (phapBao.reflect) stats.push(`🔁 Phản +${phapBao.reflect}%`);
    const msg = `🔍 TRA CỨU PHÁP BẢO
━━━━━━━━━━━━━━━
${phapBao.emoji} ${phapBao.name} \`ID: ${phapBao.id}\`
━━━━━━━━━━━━━━━
📊 Chỉ số:
${stats.join("\n") || "—"}
━━━━━━━━━━━━━━━
📖 ${phapBao.desc}
━━━━━━━━━━━━━━━
💰 Giá: ${formatNumber(phapBao.price)} LT
💡 ${prefix}tl shop phapbao | ${prefix}tl buy ${phapBao.id}`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  // ── Tra cứu thể chất / huyết mạch / linh căn (ID dạng số) ──
  const numId = parseInt(id, 10);
  if (!isNaN(numId)) {
    const TIER_LABELS = {
      basic: "⚪ Phàm Cấp", common: "⚪ Thường", rare: "🟢 Hiếm",
      epic: "🔵 Sử Thi", legend: "🟡 Huyền Thoại", mythic: "🟣 Thần Thoại",
      galaxy: "🌌 Tinh Hà", god: "🔴 Thần Cấp", supreme: "💖 Chí Tôn",
    };

    const thechat = THECHAT.find(t => t.id === numId);
    if (thechat) {
      const stats = [];
      if (thechat.atk) stats.push(`⚔️ ATK +${formatNumber(thechat.atk)}`);
      if (thechat.def) stats.push(`🛡️ DEF +${formatNumber(thechat.def)}`);
      if (thechat.hp) stats.push(`❤️ HP +${formatNumber(thechat.hp)}`);
      if (thechat.spd) stats.push(`⚡ SPD +${formatNumber(thechat.spd)}`);
      if (thechat.crit) stats.push(`💥 CRIT +${thechat.crit}%`);
      if (thechat.critResist) stats.push(`🛡️ Kháng Bạo +${thechat.critResist}%`);
      if (thechat.lifesteal) stats.push(`🩸 Hút máu +${thechat.lifesteal}%`);
      if (thechat.dodge) stats.push(`💨 Né +${thechat.dodge}%`);
      if (thechat.trueDmg) stats.push(`⚡ ST Chuẩn +${thechat.trueDmg}%`);
      if (thechat.dmgReduction) stats.push(`🛡️ Giảm ST +${thechat.dmgReduction}%`);
      if (thechat.armorPen) stats.push(`⛏️ Xuyên Giáp +${thechat.armorPen}%`);
      if (thechat.expBonus) stats.push(`✨ EXP +${thechat.expBonus}%`);
      if (thechat.towerPower) stats.push(`🗼 Lực tháp +${thechat.towerPower}%`);
      const msg = `🔍 TRA CỨU THỂ CHẤT
━━━━━━━━━━━━━━━━
${thechat.emoji} ${thechat.name} \`ID: ${thechat.id}\`
🏷️ Đẳng cấp: ${TIER_LABELS[thechat.tier] || thechat.tier}
━━━━━━━━━━━━━━━━
📊 Chỉ số:
${stats.join("\n") || "—"}
━━━━━━━━━━━━━━━━
📖 ${thechat.desc}
━━━━━━━━━━━━━━━━
💡 Random khi nhập đạo hoặc .tl buff thechat`;
      return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
    }

    const huyetmach = HUYETMACH.find(h => h.id === numId);
    if (huyetmach) {
      const stats = [];
      if (huyetmach.atk) stats.push(`⚔️ ATK +${formatNumber(huyetmach.atk)}`);
      if (huyetmach.def) stats.push(`🛡️ DEF +${formatNumber(huyetmach.def)}`);
      if (huyetmach.hp) stats.push(`❤️ HP +${formatNumber(huyetmach.hp)}`);
      if (huyetmach.spd) stats.push(`⚡ SPD ${huyetmach.spd > 0 ? "+" : ""}${formatNumber(huyetmach.spd)}`);
      if (huyetmach.crit) stats.push(`💥 CRIT +${huyetmach.crit}%`);
      if (huyetmach.critResist) stats.push(`🛡️ Kháng Bạo +${huyetmach.critResist}%`);
      if (huyetmach.lifesteal) stats.push(`🩸 Hút máu +${huyetmach.lifesteal}%`);
      if (huyetmach.dodge) stats.push(`💨 Né +${huyetmach.dodge}%`);
      const msg = `🔍 TRA CỨU HUYẾT MẠCH
━━━━━━━━━━━━━━━━
${huyetmach.emoji} ${huyetmach.name} \`ID: ${huyetmach.id}\`
🏷️ Đẳng cấp: ${TIER_LABELS[huyetmach.tier] || huyetmach.tier}
━━━━━━━━━━━━━━━━
📊 Chỉ số:
${stats.join("\n") || "—"}
━━━━━━━━━━━━━━━━
📖 ${huyetmach.desc}
━━━━━━━━━━━━━━━━
💡 Random khi nhập đạo hoặc .tl buff huyetmach`;
      return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
    }

    const linhcan = LINH_CAN.find(l => l.id === numId);
    if (linhcan) {
      const msg = `🔍 TRA CỨU LINH CĂN
━━━━━━━━━━━━━━━━
${linhcan.emoji} ${linhcan.name} \`ID: ${linhcan.id}\`
🏷️ Đẳng cấp: ${TIER_LABELS[linhcan.tier] || linhcan.tier} — ${linhcan.pham}
━━━━━━━━━━━━━━━━
✨ Hệ số EXP: ×${linhcan.expMult}
━━━━━━━━━━━━━━━━
📖 ${linhcan.desc}
━━━━━━━━━━━━━━━━
💡 Random khi nhập đạo hoặc .tl buff linhcan`;
      return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
    }
  }

  return api.sendMessage({ msg: `❌ Không tìm thấy vật phẩm ID ${id}!`, quote: message, ttl: 15000 }, message.threadId, message.type);
}

// ── .TL FASTSELL: GIẢM GIÁ NHANH (ADMIN ĐẶC BIỆT) ──────────
function parseFastSellDuration(str) {
  if (!str) return null;
  const m = String(str).trim().toLowerCase().match(/^(\d+)(p|phut|m|h|gio|g|d|ngay|n)$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  switch (m[2]) {
    case "p": case "phut": case "m": return n * 60000;
    case "h": case "gio": case "g": return n * 3600000;
    case "d": case "ngay": case "n": return n * 86400000;
  }
  return null;
}

async function handleFastSell(api, message, p, senderId, sub2, sub3, sub4) {
  const prefix = getGlobalPrefix();
  if (!isDangSangThe(senderId)) {
    return api.sendMessage({ msg: "❌ Chỉ Đấng Sáng Thế mới dùng được lệnh này!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const sales = getFlashSales();
  const now = Date.now();

  if (!sub2 || sub2 === "list") {
    const active = Object.entries(sales).filter(([, s]) => now < s.expiresAt)
      .sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    if (active.length === 0) {
      return api.sendMessage({
        msg: `🏷️ Không có flash sale nào đang chạy!
━━━━━━━━━━━━━━━━
📌 Cú pháp: ${prefix}tl fastsell <%giảm> <ID đồ> <thời gian>
💡 VD: ${prefix}tl fastsell 50 w10 30p
⏱️ Thời gian: 30p (phút), 2h (giờ), 1d (ngày)
🛑 Hủy: ${prefix}tl fastsell off <ID>`,
        quote: message, ttl: 30000,
      }, message.threadId, message.type);
    }
    const lines = active.map(([id, s]) => {
      const item = findShopItemAny(id);
      const mins = Math.max(1, Math.ceil((s.expiresAt - now) / 60000));
      const remain = mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60 ? `${mins % 60}p` : ""}` : `${mins}p`;
      const base = item ? item.price : 0;
      return `[${id}] ${item?.emoji || "❓"} ${item?.name || id}
   💰 ${formatNumber(base)} → ${formatNumber(getFlashSalePrice(base, id).price)} LT (-${s.percent}%) ⏳ còn ${remain}`;
    });
    return api.sendMessage({
      msg: `🔥 FLASH SALE ĐANG CHẠY (${active.length})
━━━━━━━━━━━━━━━━
${lines.join("\n")}
━━━━━━━━━━━━━━━━
🛑 Hủy: ${prefix}tl fastsell off <ID>`,
      quote: message, ttl: 60000,
    }, message.threadId, message.type);
  }

  if (sub2 === "off" || sub2 === "huy" || sub2 === "end") {
    if (!sub3 || !sales[sub3] || now >= sales[sub3].expiresAt) {
      return api.sendMessage({ msg: `❌ Không có flash sale đang chạy cho ID "${sub3 || "(trống)"}"!`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    const ended = findShopItemAny(sub3);
    delete sales[sub3];
    saveData();
    logAdminAction(senderId, "fastsell", `HỦY sale ${ended?.name || sub3}`, null);
    return api.sendMessage({ msg: `🛑 Đã hủy flash sale: ${ended?.emoji || ""} ${ended?.name || sub3}`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  // fastsell <%giảm> <ID đồ> <thời gian>
  const percent = parseInt(sub2, 10);
  if (!Number.isFinite(percent) || percent < 1 || percent > 99) {
    return api.sendMessage({ msg: `❌ % giảm giá không hợp lệ (1–99)!\n📌 Cú pháp: ${prefix}tl fastsell <%giảm> <ID đồ> <thời gian>\n💡 VD: ${prefix}tl fastsell 50 w10 30p`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  const item = sub3 ? findShopItemAny(sub3) : null;
  if (!item) {
    return api.sendMessage({ msg: `❌ Không tìm thấy đồ có ID "${sub3 || "(trống)"}"!\n💡 Xem ID: ${prefix}tl shop vukhi | giap | danduoc | nguyenlieu | congphap`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  const durMs = parseFastSellDuration(sub4);
  if (!durMs || durMs > 7 * 86400000) {
    return api.sendMessage({ msg: `❌ Thời gian không hợp lệ (tối đa 7d)!\n⏱️ Định dạng: 30p | 2h | 1d\n💡 VD: ${prefix}tl fastsell ${percent} ${item.id} 30p`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const expiresAt = now + durMs;
  sales[item.id] = { percent, expiresAt, setBy: String(senderId), setAt: now };
  saveData();
  logAdminAction(senderId, "fastsell", `${item.name} -${percent}% (${sub4})`, null);

  const salePrice = getFlashSalePrice(item.price, item.id).price;
  const mins = Math.ceil(durMs / 60000);
  const remainStr = mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60 ? `${mins % 60}p` : ""}` : `${mins} phút`;
  return api.sendMessage({
    msg: `🔥🔥🔥 FLASH SALE BẮT ĐẦU! 🔥🔥🔥
━━━━━━━━━━━━━━━
${item.emoji} ${item.name} \`[${item.id}]\`
💰 ${formatNumber(item.price)} → ${formatNumber(salePrice)} LT (-${percent}%)
⏳ Kết thúc sau: ${remainStr}
━━━━━━━━━━━━━━━━
🛒 Mua ngay: ${prefix}tl buy ${item.id}`,
    quote: message, ttl: 120000,
  }, message.threadId, message.type);
}

async function handleBuy(api, message, p, senderId, sub2, sub3) {
  const prefix = getGlobalPrefix();

  if (!sub2) {
    return api.sendMessage({ msg: `❌ Cú pháp: ${prefix}tl buy <ID> [số lượng]\nVD: ${prefix}tl buy w1`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const material = MATERIALS.find(m => m.id === sub2);
  if (material) {
    const qty = Math.max(1, Math.min(parseInt(sub3 || "1", 10) || 1, 1e15));
    const { price: unitPrice, sale } = getFlashSalePrice(material.price, material.id);
    const totalCost = unitPrice * qty;

    if (p.spiritStones < totalCost) {
      return api.sendMessage({ msg: `❌ Không đủ LT! Cần ${formatNumber(totalCost)} LT (${qty}×${formatNumber(unitPrice)}), bạn có ${formatNumber(p.spiritStones)} LT.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }

    p.spiritStones -= totalCost;
    if (!p.inventory.materials) p.inventory.materials = {};
    p.inventory.materials[material.id] = (p.inventory.materials[material.id] || 0) + qty;
    savePlayer(senderId);

    const msg = `🛒 MUA NGUYÊN LIỆU THÀNH CÔNG!
━━━━━━━━━━━━━━━━
${material.emoji} ${qty > 1 ? `${qty}x ` : ""}${material.name}
${sale ? formatFlashSaleLine(sale, material.id, unitPrice) + "\n" : ""}💰 Đã trả: ${formatNumber(totalCost)} LT
📦 Đang có: ${p.inventory.materials[material.id]}
💎 Còn lại: ${formatNumber(p.spiritStones)} LT
━━━━━━━━━━━━━━━━
💡 ${prefix}tl luyendan <ID đan> để luyện đan`;

    return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }

  const armor = ARMORS.find(a => a.id === sub2);
  if (armor) {
    if (armor.dao && armor.dao !== p.daotam) {
      const daoName = getDaoDisplay(armor.dao);
      return api.sendMessage({ msg: `❌ ${armor.name} chỉ dành cho ${daoName}! Bạn đang theo ${getDaoDisplay(p.daotam)}.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if (p.spiritStones < getFlashSalePrice(armor.price, armor.id).price) {
      return api.sendMessage({ msg: `❌ Không đủ LT! Cần ${formatNumber(getFlashSalePrice(armor.price, armor.id).price)} LT, bạn có ${formatNumber(p.spiritStones)} LT.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if (p.inventory.armors[armor.id]) {
      return api.sendMessage({ msg: `⚠️ Bạn đã có ${armor.name} rồi!`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }

    const { price: armorCost, sale: armorSale } = getFlashSalePrice(armor.price, armor.id);
    p.spiritStones -= armorCost;
    addItem(senderId, armor.id, "armor");

    const msg = `🛒 MUA THÀNH CÔNG!
━━━━━━━━━━━━━━━━
${armor.emoji} ${armor.name}
${armorSale ? formatFlashSaleLine(armorSale, armor.id, armorCost) + "\n" : ""}💰 Đã trả: ${formatNumber(armorCost)} LT
💎 Còn lại: ${formatNumber(p.spiritStones)} LT
━━━━━━━━━━━━━━━━
💡 ${prefix}tl equip ${armor.id} để trang bị`;

    return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }

  const weapon = WEAPONS.find(w => w.id === sub2);
  if (weapon) {
    if (weapon.noShop) {
      return api.sendMessage({ msg: `🔒 ${weapon.emoji} ${weapon.name} KHÔNG THỂ MUA bằng Linh Thạch!\n🗿 Nó vẫn cắm sâu trong tảng đá ngàn năm... chỉ kẻ có duyên mới rút ra được.\n💡 Thử vận may: ${prefix}tl rutkiem`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if (p.spiritStones < getFlashSalePrice(weapon.price, weapon.id).price) {
      return api.sendMessage({ msg: `❌ Không đủ LT! Cần ${formatNumber(getFlashSalePrice(weapon.price, weapon.id).price)} LT, bạn có ${formatNumber(p.spiritStones)} LT.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if (p.inventory.weapons[weapon.id]) {
      return api.sendMessage({ msg: `⚠️ Bạn đã có ${weapon.name} rồi!`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }

    const { price: weaponCost, sale: weaponSale } = getFlashSalePrice(weapon.price, weapon.id);
    p.spiritStones -= weaponCost;
    addItem(senderId, weapon.id, "weapon");

    const msg = `🛒 MUA THÀNH CÔNG!
━━━━━━━━━━━━━━━━
${weapon.emoji} ${weapon.name}
${weaponSale ? formatFlashSaleLine(weaponSale, weapon.id, weaponCost) + "\n" : ""}💰 Đã trả: ${formatNumber(weaponCost)} LT
💎 Còn lại: ${formatNumber(p.spiritStones)} LT
━━━━━━━━━━━━━━━━
💡 ${prefix}tl equip ${weapon.id} để trang bị`;

    return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }

  const potion = POTIONS.find(po => po.id === sub2);
  if (potion) {
    const qty = Math.max(1, Math.min(parseInt(sub3 || "1", 10) || 1, 1e15));
    const { price: potionUnitPrice, sale: potionSale } = getFlashSalePrice(potion.price, potion.id);
    const totalCost = potionUnitPrice * qty;

    if (p.spiritStones < totalCost) {
      return api.sendMessage({ msg: `❌ Không đủ LT! Cần ${formatNumber(totalCost)} LT (${qty}x${formatNumber(potionUnitPrice)}), bạn có ${formatNumber(p.spiritStones)} LT.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }

    p.spiritStones -= totalCost;
    addItem(senderId, potion.id, "potion", qty);

    const msg = `🛒 MUA THÀNH CÔNG!
━━━━━━━━━━━━━━━━
${potion.emoji} ${qty > 1 ? `${qty}x ` : ""}${potion.name}
${potionSale ? formatFlashSaleLine(potionSale, potion.id, potionUnitPrice) + "\n" : ""}💰 Đã trả: ${formatNumber(totalCost)} LT
💎 Còn lại: ${formatNumber(p.spiritStones)} LT
━━━━━━━━━━━━━━━━
💡 ${prefix}tl use ${potion.id} để dùng`;

    return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }

  const congpha = CONGPHA.find(c => c.id === sub2);
  if (congpha) {
    if (congpha.id === "213" && !hasLearned(p, "34") && (p.maxStamina || 0) < 600) {
      return api.sendMessage({ msg: "❌ Bách Mạch Thông Thể yêu cầu học Bí Kiếp Cửu Chuyền Thể (id 34) trước!", quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if (hasLearned(p, congpha.id)) {
      return api.sendMessage({ msg: `❌ Bạn đã học ${congpha.name} rồi! Mỗi công pháp chỉ học được 1 lần.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if (p.spiritStones < getFlashSalePrice(congpha.price, congpha.id).price) {
      return api.sendMessage({ msg: `❌ Không đủ LT! Cần ${formatNumber(getFlashSalePrice(congpha.price, congpha.id).price)} LT, bạn có ${formatNumber(p.spiritStones)} LT.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if (p.maxStamina >= congpha.maxStamina) {
      return api.sendMessage({ msg: `⚠️ Giới hạn Thể Lực đã đạt ${congpha.maxStamina}! Không cần mua ${congpha.name}.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }

    const { price: congphaCost, sale: congphaSale } = getFlashSalePrice(congpha.price, congpha.id);
    p.spiritStones -= congphaCost;
    addItem(senderId, congpha.id, "potion", 1);

    const msg = `🛒 MUA THÀNH CÔNG!
━━━━━━━━━━━━━━━━
${congpha.emoji} ${congpha.name}
${congphaSale ? formatFlashSaleLine(congphaSale, congpha.id, congphaCost) + "\n" : ""}💰 Đã trả: ${formatNumber(congphaCost)} LT
💎 Còn lại: ${formatNumber(p.spiritStones)} LT
━━━━━━━━━━━━━━━━
💡 ${prefix}tl use ${congpha.id} để tu luyện`;

    return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }

  const special = SPECIAL_ITEMS.find(s => s.id === sub2);
  if (special) {
    const primeLevel = getPrimeLevel(p.donated || 0);
    const req = special.primeRequired || 2;
    if (primeLevel < req) {
      return api.sendMessage({ msg: `🔒 ${special.name} chỉ bán tại Shop Prime — yêu cầu Prime ${req} (nạp ${formatNumber(100000)}đ)!
📍 Prime hiện tại: ${primeLevel > 0 ? `PRIME ${primeLevel}` : "Chưa có"}
💡 ${prefix}tl shop prime để xem`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if (special.vipRequired && primeLevel < special.vipRequired) {
      return api.sendMessage({ msg: `👑 ${special.name} là đặc quyền VIP ${special.vipRequired}!
📍 Prime/VIP hiện tại: ${primeLevel > 0 ? `PRIME ${primeLevel}` : "Chưa có"}
💡 Nạp ${formatNumber(PRIME.find(pr => pr.level === special.vipRequired)?.threshold || 500000)}đ để mở khóa VIP ${special.vipRequired}.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if (p.spiritStones < getFlashSalePrice(special.price, special.id).price) {
      return api.sendMessage({ msg: `❌ Không đủ LT! Cần ${formatNumber(getFlashSalePrice(special.price, special.id).price)} LT, bạn có ${formatNumber(p.spiritStones)} LT.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if ((p.inventory.phapTac?.[special.id] || 0) > 0) {
      return api.sendMessage({ msg: `⚠️ Bạn đã sở hữu ${special.name} rồi!`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }

    const { price: specialCost, sale: specialSale } = getFlashSalePrice(special.price, special.id);
    p.spiritStones -= specialCost;
    addItem(senderId, special.id, "phapTac", 1);

    const msg = `🛒 MUA THÀNH CÔNG!
━━━━━━━━━━━━━━━━
${special.emoji} ${special.name}
${specialSale ? formatFlashSaleLine(specialSale, special.id, specialCost) + "\n" : ""}💰 Đã trả: ${formatNumber(specialCost)} LT
💎 Còn lại: ${formatNumber(p.spiritStones)} LT
━━━━━━━━━━━━━━━━
🌪️ Đã nhập túi Skill! Dùng ${prefix}tl equip ${special.id} để trang bị.`;
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }

  const phapBao = PHAP_BAO.find(pb => pb.id === sub2);
  if (phapBao) {
    if (p.spiritStones < getFlashSalePrice(phapBao.price, phapBao.id).price) {
      return api.sendMessage({ msg: `❌ Không đủ LT! Cần ${formatNumber(getFlashSalePrice(phapBao.price, phapBao.id).price)} LT, bạn có ${formatNumber(p.spiritStones)} LT.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if (!p.inventory.phapBao) p.inventory.phapBao = {};
    if (p.inventory.phapBao[phapBao.id]) {
      return api.sendMessage({ msg: `⚠️ Bạn đã có ${phapBao.name} rồi!`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }

    const { price: pbCost, sale: pbSale } = getFlashSalePrice(phapBao.price, phapBao.id);
    p.spiritStones -= pbCost;
    p.inventory.phapBao[phapBao.id] = 1;
    savePlayer(senderId);

    const pbParts = [];
    if (phapBao.atk) pbParts.push(`⚔️ ATK+${formatNumber(phapBao.atk)}`);
    if (phapBao.def) pbParts.push(`🛡️ DEF+${formatNumber(phapBao.def)}`);
    if (phapBao.hp) pbParts.push(`❤️ HP+${formatNumber(phapBao.hp)}`);
    if (phapBao.expBonus) pbParts.push(`✨ EXP+${phapBao.expBonus}%`);
    if (phapBao.bossScale) pbParts.push(`🗼 Kháng Boss ${phapBao.bossScale}%`);
    if (phapBao.reflect) pbParts.push(`🔁 Phản+${phapBao.reflect}%`);
    const pbMsg = `🛒 MUA PHÁP BẢO THÀNH CÔNG!
━━━━━━━━━━━━━━━
${phapBao.emoji} ${phapBao.name}
${pbSale ? formatFlashSaleLine(pbSale, phapBao.id, pbCost) + "\n" : ""}💰 Đã trả: ${formatNumber(pbCost)} LT
💎 Còn lại: ${formatNumber(p.spiritStones)} LT
━━━━━━━━━━━━━━━
📊 ${pbParts.join(" | ")}
🔮 Dùng ${prefix}tl equip ${phapBao.id} để trang bị`;
    return api.sendMessage({ msg: pbMsg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }

  await api.sendMessage({ msg: `❌ Không tìm thấy vật phẩm ID ${sub2}!`, quote: message, ttl: 15000 }, message.threadId, message.type);
}

// ── LUYỆN ĐAN ──────────────────────────────────────────────
function getMatLabel(matId) {
  const m = MATERIALS.find(x => x.id === matId);
  return m ? `${m.emoji} ${m.name}` : `❔ NL ${matId}`;
}

function getRecipeCost(recipe) {
  return Object.entries(recipe.mats).reduce((sum, [mid, q]) => {
    const m = MATERIALS.find(x => x.id === mid);
    return sum + (m ? m.price * q : 0);
  }, 0);
}

async function handleLuyendan(api, message, p, senderId, sub2, sub3) {
  const prefix = getGlobalPrefix();

  if (!sub2 || sub2 === "ct" || sub2 === "congthuc") {
    const entries = Object.entries(RECIPES)
      .map(([pid, r]) => ({ potion: POTIONS.find(po => po.id === pid), r }))
      .filter(e => e.potion)
      .sort((a, b) => getRecipeCost(a.r) - getRecipeCost(b.r));
    const pageSize = 6;
    const totalPages = Math.ceil(entries.length / pageSize);
    const pageArg = sub2 === "ct" || sub2 === "congthuc" ? sub3 : "1";
    const pn = Math.min(Math.max(1, parseInt(pageArg, 10) || 1), totalPages);
    const slice = entries.slice((pn - 1) * pageSize, pn * pageSize);

    const lines = slice.map(e => {
      const mats = Object.entries(e.r.mats).map(([mid, q]) => `${getMatLabel(mid)} ×${q}`).join(" | ");
      return `${e.potion.emoji} ${e.potion.name} \`ID: ${e.potion.id}\` — 🎯 Tỉ lệ ${e.r.rate}%\n📜 ${mats}\n💰 NL trị giá ~${formatNumber(getRecipeCost(e.r))} LT (mua sẵn: ${formatNumber(e.potion.price)} LT)`;
    });

    const msg = `⚗️ CÔNG THỨC LUYỆN ĐAN (Trang ${pn}/${totalPages})
━━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━━
📄 Xem trang: ${prefix}tl luyendan ct <số trang>
🔥 Luyện: ${prefix}tl luyendan <ID đan> [sl]
⚠️ Thất bại KHÔNG hoàn nguyên liệu!
💡 Mua NL: ${prefix}tl shop nguyenlieu | Farm NL: bí cảnh (ở càng lâu càng hời)`;
    return api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
  }

  const potion = POTIONS.find(po => po.id === sub2);
  if (!potion) {
    return api.sendMessage({ msg: `❌ Không tìm thấy đan dược ID ${sub2}! Xem công thức: ${prefix}tl luyendan`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  const recipe = RECIPES[potion.id];
  if (!recipe) {
    return api.sendMessage({ msg: `❌ ${potion.name} chưa có công thức luyện!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const qty = Math.max(1, Math.min(parseInt(sub3 || "1", 10) || 1, 99));
  if (!p.inventory.materials) p.inventory.materials = {};
  const inv = p.inventory.materials;

  const missing = [];
  for (const [mid, need] of Object.entries(recipe.mats)) {
    const have = inv[mid] || 0;
    if (have < need * qty) {
      missing.push(`${getMatLabel(mid)}: cần ×${need * qty}, có ×${have}`);
    }
  }
  if (missing.length > 0) {
    return api.sendMessage({
      msg: `❌ THIẾU NGUYÊN LIỆU!
━━━━━━━━━━━━━━━━
${missing.join("\n")}
━━━━━━━━━━━━━━━━
💡 Mua: ${prefix}tl shop nguyenlieu | Farm: ${prefix}tl bc di`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  for (const [mid, need] of Object.entries(recipe.mats)) {
    inv[mid] = (inv[mid] || 0) - need * qty;
    if (inv[mid] <= 0) delete inv[mid];
  }

  let success = 0;
  for (let i = 0; i < qty; i++) {
    if (Math.random() * 100 < recipe.rate) success++;
  }
  const fail = qty - success;
  if (success > 0) {
    p.inventory.potions[potion.id] = (p.inventory.potions[potion.id] || 0) + success;
  }
  savePlayer(senderId);

  const matUsed = Object.entries(recipe.mats).map(([mid, need]) => `${getMatLabel(mid)} ×${need * qty}`).join("\n");
  const resultLines = qty === 1
    ? (success > 0
      ? `✅ LUYỆN THÀNH CÔNG! Thu được ${potion.emoji} ${potion.name} ×1`
      : `💥 LUYỆN THẤT BẠI! Đan lô nổ tanh bạch, nguyên liệu hóa tro bụi...`)
    : `✅ Thành công: ${success}/${qty} viên\n❌ Thất bại: ${fail}/${qty} viên`;

  const msg = `🔥 LUYỆN ĐAN
━━━━━━━━━━━━━━━━
🎯 Đan: ${potion.emoji} ${potion.name} ×${qty} (🎯 tỉ lệ ${recipe.rate}%)
📜 Nguyên liệu tiêu hao:
${matUsed}
━━━━━━━━━━━━━━━━
${resultLines}
📦 Túi còn: ${p.inventory.potions[potion.id] || 0} ${potion.name}
${success > 0 ? `💡 ${prefix}tl use ${potion.id} để dùng` : `💡 Thử lại xem sao — ${prefix}tl luyendan ${potion.id}`}`;

  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleEquip(api, message, p, senderId, sub2) {
  const prefix = getGlobalPrefix();
  if (!sub2) {
    return api.sendMessage({ msg: `❌ Cú pháp: ${prefix}tl equip <ID>`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const armor = ARMORS.find(a => a.id === sub2);
  if (armor) {
    if (armor.dao && armor.dao !== p.daotam) {
      const daoName = getDaoDisplay(armor.dao);
      return api.sendMessage({ msg: `❌ ${armor.name} chỉ dành cho ${daoName}! Bạn đang theo ${getDaoDisplay(p.daotam)}.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if (!p.inventory.armors || !p.inventory.armors[armor.id]) {
      return api.sendMessage({ msg: `❌ Bạn chưa có ${armor.name}! Dùng ${prefix}tl buy ${armor.id} để mua.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if (p.equippedArmor === armor.id) {
      return api.sendMessage({ msg: `⚠️ Bạn đang trang bị ${armor.name} rồi!`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }

    const oldArmor = p.equippedArmor ? ARMORS.find(a => a.id === p.equippedArmor) : null;
    p.equippedArmor = armor.id;
    savePlayer(senderId);

    const stats = calcStats(p);
    const msg = `🛡️ TRANG BỊ GIÁP THÀNH CÔNG!
━━━━━━━━━━━━━━━━
${armor.emoji} ${armor.name}
${oldArmor ? `🎒 ${oldArmor.name} đã tự chuyển về túi đồ.\n` : ""}
📊 ATK+${formatNumber(armor.atk || 0)}${armor.def !== undefined && armor.def !== 0 ? ` | DEF+${formatNumber(armor.def)}` : ""}${armor.hp !== undefined && armor.hp !== 0 ? ` | HP+${formatNumber(armor.hp)}` : ""}${armor.spd ? ` | SPD+${formatNumber(armor.spd)}` : ""}${armor.crit ? ` | Crit+${armor.crit}%` : ""}${armor.dmgReduction ? ` | Giảm ST ${armor.dmgReduction}%` : ""}${armor.reflect ? ` | Phản ${armor.reflect}%` : ""}${armor.maxDmgPct ? ` | Chặn ST ${armor.maxDmgPct}% HP` : ""}${armor.lifesteal ? ` | Hút máu ${armor.lifesteal}%` : ""}${armor.armorPen ? ` | Xuyên Giáp ${armor.armorPen}%` : ""}${armor.luck ? ` | Luck +${formatNumber(armor.luck)}` : ""}${armor.expBonus ? ` | EXP +${armor.expBonus}%` : ""}${armor.dodge ? ` | Né ${armor.dodge}%` : ""}${armor.trueDmg ? ` | ST Chuẩn +${armor.trueDmg}%` : ""}
━━━━━━━━━━━━━━━━
💥 Lực Chiến Mới: ${formatNumber(stats.battlePower)}`;

    return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }

  const special = SPECIAL_ITEMS.find(s => s.id === sub2);
  if (special) {
    if (!p.inventory.phapTac || !p.inventory.phapTac[special.id]) {
      return api.sendMessage({ msg: `❌ Bạn chưa có ${special.name}! Dùng ${prefix}tl buy ${special.id} để mua.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if (p.equippedPhapTac === special.id) {
      return api.sendMessage({ msg: `⚠️ Bạn đang trang bị ${special.name} rồi!`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }

    const oldPhapTac = p.equippedPhapTac ? SPECIAL_ITEMS.find(s => s.id === p.equippedPhapTac) : null;
    p.equippedPhapTac = special.id;
    savePlayer(senderId);

    const msg = `🌪️ TRANG BỊ SKILL THÀNH CÔNG!
━━━━━━━━━━━━━━━━
${special.emoji} ${special.name}
${oldPhapTac ? `🎒 ${oldPhapTac.name} đã tự chuyển về túi đồ.\n` : ""}
━━━━━━━━━━━━━━━━
⚔️ Kỹ năng bị động: tự kích hoạt trong PK (lượt đầu).
💡 ${prefix}tl unequip ${special.id} để tháo Skill.`;
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }

  const phapBao = PHAP_BAO.find(pb => pb.id === sub2);
  if (phapBao) {
    if (!p.inventory.phapBao || !p.inventory.phapBao[phapBao.id]) {
      return api.sendMessage({ msg: `❌ Bạn chưa có ${phapBao.name}! Dùng ${prefix}tl buy ${phapBao.id} để mua.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if (p.equippedPhapBao === phapBao.id) {
      return api.sendMessage({ msg: `⚠️ Bạn đang trang bị ${phapBao.name} rồi!`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }

    const oldPb = p.equippedPhapBao ? PHAP_BAO.find(pb => pb.id === p.equippedPhapBao) : null;
    p.equippedPhapBao = phapBao.id;
    savePlayer(senderId);

    const stats = calcStats(p);
    const pbParts = [];
    if (phapBao.atk) pbParts.push(`⚔️ ATK+${formatNumber(phapBao.atk)}`);
    if (phapBao.def) pbParts.push(`🛡️ DEF+${formatNumber(phapBao.def)}`);
    if (phapBao.hp) pbParts.push(`❤️ HP+${formatNumber(phapBao.hp)}`);
    if (phapBao.expBonus) pbParts.push(`✨ EXP+${phapBao.expBonus}%`);
    if (phapBao.bossScale) pbParts.push(`🗼 Kháng Boss ${phapBao.bossScale}%`);
    if (phapBao.reflect) pbParts.push(`🔁 Phản+${phapBao.reflect}%`);
    const pbMsg = `🔮 TRANG BỊ PHÁP BẢO THÀNH CÔNG!
━━━━━━━━━━━━━━━
${phapBao.emoji} ${phapBao.name}
${oldPb ? `🎒 ${oldPb.name} đã tự chuyển về túi đồ.\n` : ""}
📊 ${pbParts.join(" | ")}
━━━━━━━━━━━━━━━
💥 Lực Chiến Mới: ${formatNumber(stats.battlePower)}`;

    return api.sendMessage({ msg: pbMsg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }

  const weapon = WEAPONS.find(w => w.id === sub2);
  if (!weapon) {
    return api.sendMessage({ msg: `❌ Không tìm thấy vũ khí/giáp ID ${sub2}!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (!p.inventory.weapons[weapon.id]) {
    return api.sendMessage({ msg: `❌ Bạn chưa có ${weapon.name}! Dùng ${prefix}tl buy ${weapon.id} để mua.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (p.equippedWeapon === weapon.id) {
    return api.sendMessage({ msg: `⚠️ Bạn đang trang bị ${weapon.name} rồi!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const oldWeapon = p.equippedWeapon ? WEAPONS.find(w => w.id === p.equippedWeapon) : null;
  p.equippedWeapon = weapon.id;
  savePlayer(senderId);

  const stats = calcStats(p);

  const msg = `⚔️ TRANG BỊ THÀNH CÔNG!
━━━━━━━━━━━━━━━━
${weapon.emoji} ${weapon.name}
${oldWeapon ? `🎒 ${oldWeapon.name} đã tự chuyển về túi đồ.\n` : ""}
📊 ATK+${formatNumber(weapon.atk)}${weapon.crit ? ` | CRIT+${weapon.crit}%` : ""}${weapon.spd ? ` | SPD+${formatNumber(weapon.spd)}` : ""}
━━━━━━━━━━━━━━━━
💥 Lực Chiến Mới: ${formatNumber(stats.battlePower)}`;

  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

async function handleUnequip(api, message, p, senderId, sub2) {
  if (sub2 === "skill" || SPECIAL_ITEMS.find(s => s.id === sub2)) {
    if (!p.equippedPhapTac) {
      return api.sendMessage({ msg: "❌ Bạn không đang trang bị Skill nào!", quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    const special = SPECIAL_ITEMS.find(s => s.id === p.equippedPhapTac);
    p.equippedPhapTac = null;
    savePlayer(senderId);
    return api.sendMessage({ msg: `🔓 Đã tháo Skill ${special ? `${special.emoji} ${special.name}` : ""} và cất vào túi.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (sub2 === "giap" || sub2 === "giáp") {
    if (!p.equippedArmor) {
      return api.sendMessage({ msg: "❌ Bạn không đang trang bị giáp nào!", quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    const armor = ARMORS.find(a => a.id === p.equippedArmor);
    p.equippedArmor = null;
    savePlayer(senderId);
    return api.sendMessage({ msg: `🔓 Đã tháo ${armor ? armor.name : "giáp"} và cất vào túi.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (sub2 === "phapbao" || sub2 === "pb" || PHAP_BAO.find(pb => pb.id === sub2)) {
    if (!p.equippedPhapBao) {
      return api.sendMessage({ msg: "❌ Bạn không đang trang bị Pháp Bảo nào!", quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    const pb = PHAP_BAO.find(pb => pb.id === p.equippedPhapBao);
    p.equippedPhapBao = null;
    savePlayer(senderId);
    return api.sendMessage({ msg: `🔓 Đã tháo ${pb ? `${pb.emoji} ${pb.name}` : "Pháp Bảo"} và cất vào túi.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (sub2 === "danhhieu" || sub2 === "dh" || TITLES.find(t => t.id === sub2)) {
    if (!p.equippedTitle) {
      return api.sendMessage({ msg: "❌ Bạn không đang mặc danh hiệu nào!", quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    const title = TITLES.find(t => t.id === p.equippedTitle);
    p.equippedTitle = null;
    savePlayer(senderId);
    return api.sendMessage({ msg: `🔓 Đã tháo danh hiệu ${title ? `${title.emoji} ${title.name}` : "Danh Hiệu"}.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (!p.equippedWeapon) {
    return api.sendMessage({ msg: "❌ Bạn không đang trang bị vũ khí nào!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const weapon = WEAPONS.find(w => w.id === p.equippedWeapon);
  p.equippedWeapon = null;
  savePlayer(senderId);

  await api.sendMessage({ msg: `🔓 Đã tháo ${weapon ? weapon.name : "vũ khí"} và cất vào túi.`, quote: message, ttl: 15000 }, message.threadId, message.type);
}

async function handleUpgrade(api, message, p, senderId, sub2) {
  const prefix = getGlobalPrefix();
  const typeMap = { vukhi: "weapon", vu_khi: "weapon", giap: "armor", giáp: "armor", phapbao: "phapBao", phap_bao: "phapBao", pb: "phapBao" };
  const type = typeMap[(sub2 || "").toLowerCase()];
  if (!type) {
    return api.sendMessage({
      msg: `❌ Sai cú pháp. Dùng: ${prefix}tl upgrade <vukhi/giap/phapbao>\nVí dụ: ${prefix}tl upgrade vukhi`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  let item = null;
  let currentLevel = 0;

  if (type === "weapon") {
    if (!p.equippedWeapon) return api.sendMessage({ msg: `❌ Bạn chưa trang bị vũ khí nào! Dùng ${prefix}tl equip <ID> trước.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    item = WEAPONS.find(w => w.id === p.equippedWeapon);
    if (!item) return api.sendMessage({ msg: `❌ Không tìm thấy vũ khí!`, quote: message, ttl: 15000 }, message.threadId, message.type);
    currentLevel = getUpgradeLevel(p, item.id);
  } else if (type === "armor") {
    if (!p.equippedArmor) return api.sendMessage({ msg: `❌ Bạn chưa trang bị giáp nào! Dùng ${prefix}tl equip <ID> trước.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    item = ARMORS.find(a => a.id === p.equippedArmor);
    if (!item) return api.sendMessage({ msg: `❌ Không tìm thấy giáp!`, quote: message, ttl: 15000 }, message.threadId, message.type);
    currentLevel = getUpgradeLevel(p, item.id);
  } else if (type === "phapBao") {
    if (!p.equippedPhapBao) return api.sendMessage({ msg: `❌ Bạn chưa trang bị pháp bảo nào! Dùng ${prefix}tl equip <ID> trước.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    item = PHAP_BAO.find(pb => pb.id === p.equippedPhapBao);
    if (!item) return api.sendMessage({ msg: `❌ Không tìm thấy pháp bảo!`, quote: message, ttl: 15000 }, message.threadId, message.type);
    currentLevel = getUpgradeLevel(p, item.id);
  }

  if (currentLevel >= UPGRADE_MAX) {
    return api.sendMessage({ msg: `⬆️ ${item.name} đã đạt cấp tối đa **+${UPGRADE_MAX}**!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const cost = upgradeCost(currentLevel);
  const rate = upgradeSuccessRate(currentLevel);

  if ((p.spiritStones || 0) < cost) {
    return api.sendMessage({ msg: `❌ Bạn cần **${formatNumber(cost)} Linh Thạch** để upgrade ${item.name} [+${currentLevel}] → [+${currentLevel + 1}]\n💰 Bạn đang có: ${formatNumber(p.spiritStones || 0)} LT`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  p.spiritStones -= cost;
  const roll = Math.random() * 100;

  if (roll < rate) {
    setUpgradeLevel(p, item.id, currentLevel + 1);
    savePlayer(senderId);
    const newLvl = currentLevel + 1;
    const stats = calcStats(p);
    return api.sendMessage({
      msg: `⬆️ UPGRADE THÀNH CÔNG!
━━━━━━━━━━━━━━━━
${item.emoji} ${item.name} [+${currentLevel}] → **[+${newLvl}]**
📊 Tỉ lệ thành công: ${rate}% | Chi phí: ${formatNumber(cost)} LT
💫 ATK×${(1 + newLvl * 0.10).toFixed(1)} | HP×${(1 + newLvl * 0.10).toFixed(1)} | SPD×${(1 + newLvl * 0.10).toFixed(1)} | DEF×${(1 + newLvl * 0.10).toFixed(1)}
━━━━━━━━━━━━━━━━
💥 Lực Chiến: ${formatNumber(stats.battlePower)}`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  } else {
    const failLevel = Math.max(0, currentLevel - 1);
    setUpgradeLevel(p, item.id, failLevel);
    savePlayer(senderId);
    const stats = calcStats(p);
    return api.sendMessage({
      msg: `💔 UPGRADE THẤT BẠI!
━━━━━━━━━━━━━━━━
${item.emoji} ${item.name} [+${currentLevel}] → **[+${failLevel}]**
📊 Tỉ lệ thành công: ${rate}% | Chi phí: ${formatNumber(cost)} LT (đã mất)
⬇️ Hạ từ +${currentLevel} xuống +${failLevel}
━━━━━━━━━━━━━━━━
💥 Lực Chiến: ${formatNumber(stats.battlePower)}`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }
}

function applyBuff(p, type, value, durationMs, desc, src = null) {
  if (!p.buffs) p.buffs = [];
  p.buffs.push({
    type,
    value,
    expiresAt: Date.now() + durationMs,
    desc,
    src,
  });
}

function applyBuffNoStack(p, type, value, durationMs, desc, src) {
  if (!p.buffs) p.buffs = [];
  p.buffs = p.buffs.filter(b => !(b.type === type && b.src === src));
  p.buffs.push({
    type,
    value,
    expiresAt: Date.now() + durationMs,
    desc,
    src,
  });
}

function getBuffValue(p, type) {
  if (!p.buffs) return 0;
  const now = Date.now();
  let total = 0;
  for (const b of p.buffs) {
    if (b.expiresAt && b.expiresAt <= now) continue;
    if (b.type === type) total += b.value;
  }
  return total;
}

function consumeBuff(p, type) {
  if (!p.buffs) return;
  p.buffs = p.buffs.filter(b => b.type !== type);
}

async function handleUse(api, message, p, senderId, sub2, sub3) {
  const prefix = getGlobalPrefix();

  if (!sub2) {
    return api.sendMessage({ msg: `❌ Cú pháp: ${prefix}tl use <ID> [số lượng]`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const NON_STACK_PILLS = new Set(["1", "2", "6", "8", "11", "22", "24", "27", "28", "29", "30", "31", "32", "37", "38", "50", "51", "52"]);

  const rawId = sub2.replace(/^\+/, "").trim();
  const requestedQty = Math.max(1, parseInt(sub3 || "1", 10) || 1);
  const potion = POTIONS.find(po => po.id === rawId);
  const congpha = CONGPHA.find(c => c.id === rawId);

  if (!potion && !congpha) {
    const special = SPECIAL_ITEMS.find(s => s.id === rawId);
    if (special) {
      return api.sendMessage({ msg: `${special.emoji} ${special.name} là Skill! Dùng ${getGlobalPrefix()}tl equip ${special.id} để trang bị — tự kích hoạt trong PK (lượt đầu).`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    const token = getTokenItem(rawId);
    if (token) {
      return api.sendMessage({
        msg: `${token.emoji} ${token.name} là bùa bị động — không cần dùng!\n💡 Chỉ cần có trong túi là tự phát tác dụng.\n📝 ${token.desc}`,
        quote: message, ttl: 15000,
      }, message.threadId, message.type);
    }
    return api.sendMessage({ msg: `❌ Không tìm thấy vật phẩm ID ${rawId}!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const item = potion || congpha;

  const noStack = NON_STACK_PILLS.has(item.id);
  let noStackNoted = false;
  const qty = noStack && requestedQty > 1 ? 1 : requestedQty;
  if (noStack && requestedQty > 1) {
    noStackNoted = true;
  }

  const have = p.inventory.potions[item.id] || 0;
  if (have < qty) {
    return api.sendMessage({ msg: `❌ Không đủ! Có ${have}, cần ${qty} ${item.name}.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const isMa = p.daotam === "ma";

  if (item.id === "22" && !isMa) {
    return api.sendMessage({ msg: "❌ Nghịch Thiên Đan chỉ dành cho Ma Đạo!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (item.id === "24" && isMa) {
    return api.sendMessage({ msg: "❌ Sinh Mệnh Đan không dùng được cho Ma Đạo!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (item.id === "213" && !hasLearned(p, "34") && (p.maxStamina || 0) < 600) {
    return api.sendMessage({ msg: "❌ Bách Mạch Thông Thể yêu cầu học Bí Kiếp Cửu Chuyền Thể (id 34) trước!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (congpha && hasLearned(p, congpha.id)) {
    return api.sendMessage({ msg: `❌ Bạn đã học ${congpha.name} rồi! Mỗi công pháp chỉ học được 1 lần.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  let effectLines = [];
  let update = {};
  let buffApplied = null;

  for (let i = 0; i < qty; i++) {
    switch (item.id) {
      // ── 1: Huyết Khí Đan ─────────────────────────────────────────────
      case "1":
        update.currentHp = null;
        update.towerInjured = false;
        if (p.trongThuongUntil && Date.now() < p.trongThuongUntil) {
          p.trongThuongUntil = 0;
          if (i === 0) effectLines.push("💚 Trọng thương đã được chữa trị!");
        }
        if (i === 0) effectLines.push("❤️ HP đã hồi phục hoàn toàn!");
        break;

      // ── 2: Tụ Linh Đan ───────────────────────────────────────────────
      case "2":
        applyBuffNoStack(p, "exp_boost_pct", 20, 24 * 60 * 60 * 1000, "Tụ Linh Đan: +20% EXP", "2");
        buffApplied = "+20% EXP cho lần tu luyện/bí cảnh tới (24h)";
        break;

      // ── 3: Hộ Tâm Đan ────────────────────────────────────────────────
      case "3":
        applyBuff(p, "injury_time_reduction", 50, 24 * 60 * 60 * 1000, "Hộ Tâm Đan: -50% thời gian bị thương");
        buffApplied = "Giảm 50% thời gian bị thương nếu tẩu hỏa (24h)";
        break;

      // ── 4: Đột Phá Đan ────────────────────────────────────────────────
      case "4":
        p.breakthroughBonus = (p.breakthroughBonus || 0) + 10;
        break;

      // ── 5: Hồi Thể Đan ───────────────────────────────────────────────
      case "5":
        update.stamina = Math.min(p.maxStamina || 100, (update.stamina !== undefined ? update.stamina : (p.stamina || 0)) + 100);
        if (i === 0) effectLines.push(`🟢 Thể lực +${qty * 100} → ${update.stamina}`);
        break;

      // ── 6: Tẩy Tủy Đan ────────────────────────────────────────────────
      case "6":
        if (i === 0) {
          const newT = rollTalent();
          const ti = TALENTS[newT];
          update.talent = newT;
          update.ngoTinh = ti.ngoBase;
          update.phucDuyen = ti.phucBase;
          const newTheChat = rollTheChat();
          const tcInfo = THECHAT.find(t => t.id === newTheChat);
          update.theChat = newTheChat;
          const newLinhCan = rollLinhCan();
          const lcInfo = LINH_CAN.find(l => l.id === newLinhCan);
          update.linhCan = newLinhCan;
          const newHuyetMach = rollHuyetMach();
          const hmInfo = HUYETMACH.find(h => h.id === newHuyetMach);
          update.huyetMach = newHuyetMach;
          effectLines.push(`🌟 Thiên Phú mới: ${ti.emoji} ${ti.name} (x${ti.multiplier})`);
          effectLines.push(`🧠 Ngộ Tính: ${ti.ngoBase} | 🍀 Phúc Duyên: ${ti.phucBase}`);
          effectLines.push(`💪 Thể chất: ${tcInfo.emoji} ${tcInfo.name}`);
          effectLines.push(`🌱 Linh căn: ${lcInfo.emoji} ${lcInfo.name} (×${lcInfo.expMult} EXP)`);
          effectLines.push(`🩸 Huyết mạch: ${hmInfo.emoji} ${hmInfo.name}`);
        }
        break;

      // ── 7: Thông Tuệ Đan ─────────────────────────────────────────────
      case "7":
        if (i === 0) {
          const today = new Date().toISOString().slice(0, 10);
          if (p.dailyNgoTinhDate !== today) {
            p.dailyNgoTinhDate = today;
            p.dailyNgoTinhUsed = 0;
          }
          const dailyCap = 5;
          if (p.dailyNgoTinhUsed >= dailyCap) {
            effectLines.push("⚠️ Đã đạt giới hạn Thông Tuệ Đan hôm nay!");
            break;
          }
          const ngoGain = 5 + Math.floor(Math.random() * 6);
          update.ngoTinh = Math.min(100, (p.ngoTinh || 0) + ngoGain);
          p.dailyNgoTinhUsed = (p.dailyNgoTinhUsed || 0) + 1;
          effectLines.push(`🧠 Ngộ Tính +${ngoGain} → ${update.ngoTinh} (hôm nay: ${p.dailyNgoTinhUsed}/${dailyCap})`);
        }
        break;

      // ── 8: Hồng Phúc Đan ─────────────────────────────────────────────
      case "8":
        applyBuffNoStack(p, "phuc_duyen_flat", 200, 60 * 60 * 1000, "Hồng Phúc Đan: +200 Phúc Duyên", "8");
        buffApplied = "🍀 +200 Phúc Duyên trong 60 phút";
        break;

      // ── 9: Bổ Thiên Đan ─────────────────────────────────────────────
      case "9":
        applyBuff(p, "train_limit_extra", 60, 24 * 60 * 60 * 1000, "Bổ Thiên Đan: +60 phút giới hạn tu luyện");
        buffApplied = "⏰ Giới hạn tu luyện +60 phút (trong ngày)";
        break;

      // ── 10: Quỷ Hồn Đan ──────────────────────────────────────────────
      case "10":
        update.exp = (update.exp ?? p.exp ?? 0) + 10000;
        if (i === 0) effectLines.push(`👻 +${formatNumber(10000)} EXP!`);
        break;

      // ── 11: Yêu Huyết Đan ──────────────────────────────────────────────
      case "11":
        update.currentHp = null;
        applyBuffNoStack(p, "hp_max_boost_pct", 10, 24 * 60 * 60 * 1000, "Yêu Huyết Đan: +10% HP Max", "11");
        buffApplied = "🩸 +10% HP Max (24h)";
        break;

      // ── 20: Huyết Sát Đan ──────────────────────────────────────────────
      case "20":
        if (isMa) {
          applyBuff(p, "spd_pct", 30, 30 * 60 * 1000, "Huyết Sát Đan (Ma): +30% SPD");
          buffApplied = "⚡ +30% Tốc độ (30 phút)";
        } else {
          applyBuff(p, "spd_pct", 30, 30 * 60 * 1000, "Huyết Sát Đan (Chính): +30% SPD");
          update.currentHp = Math.floor(((p.currentHp ?? 1) || 1) * 0.5);
          buffApplied = "⚡ +30% Tốc độ, Trừ 50% HP hiện tại (30 phút)";
        }
        break;

      // ── 21: Âm Hồn Đan ────────────────────────────────────────────────
      case "21":
        if (isMa) {
          update.exp = (update.exp ?? p.exp ?? 0) + 5000;
          if (i === 0) effectLines.push("🌑 +5.000 EXP!");
        } else {
          update.exp = (update.exp ?? p.exp ?? 0) + 2000;
          applyBuff(p, "risk_pct", 50, 24 * 60 * 60 * 1000, "Âm Hồn Đan (Chính): +50% Rủi ro");
          if (i === 0) effectLines.push("🌑 +2.000 EXP!");
          buffApplied = "⚠️ +50% Rủi ro (24h)";
        }
        break;

      // ── 22: Nghịch Thiên Đan ──────────────────────────────────────────
      case "22":
        update.currentHp = null;
        update.towerInjured = false;
        if (isMa) {
          update.stamina = p.maxStamina || 100;
          buffApplied = "🌊 Full HP & Thể Lực";
        } else {
          p.phucDuyen = Math.max(0, (p.phucDuyen || 0) - 5);
          buffApplied = "🌊 Full HP, Trừ 5 Phúc Duyên";
        }
        break;

      // ── 23: Thanh Tâm Đan ────────────────────────────────────────────
      case "23":
        if (isMa) {
          applyBuff(p, "exp_reduction_pct", 30, 24 * 60 * 60 * 1000, "Thanh Tâm Đan (Ma): -30% EXP");
          buffApplied = "🍃 Giảm 30% EXP tu luyện (24h)";
        } else {
          applyBuff(p, "risk_reduction_pct", 50, 24 * 60 * 60 * 1000, "Thanh Tâm Đan (Chính): -50% Rủi ro");
          buffApplied = "🍃 Giảm 50% Rủi ro (24h)";
        }
        break;

      // ── 24: Sinh Mệnh Đan ────────────────────────────────────────────
      case "24":
        if (isMa) {
          const curStats = calcStats(p);
          const curHp = p.currentHp != null ? p.currentHp : curStats.hp;
          update.currentHp = Math.floor(curHp * 0.1);
          buffApplied = "❤️‍🔥 Mất 90% HP hiện tại!";
        } else {
          update.currentHp = null;
          update.towerInjured = false;
          update.stamina = p.maxStamina || 100;
          buffApplied = "❤️‍🔥 Full HP & Thể Lực!";
        }
        break;

      // ── 25: Ma Khí Tán ──────────────────────────────────────────────
      case "25":
        if (isMa) {
          update.exp = (update.exp ?? p.exp ?? 0) + 500;
          applyBuff(p, "risk_pct", 5, 24 * 60 * 60 * 1000, "Ma Khí Tán (Ma): +5% Risk");
          if (i === 0) effectLines.push("🖤 +500 EXP!");
          buffApplied = "⚠️ +5% Risk (24h)";
        } else {
          update.exp = (update.exp ?? p.exp ?? 0) + 100;
          applyBuff(p, "risk_pct", 10, 24 * 60 * 60 * 1000, "Ma Khí Tán (Chính): +10% Risk");
          if (i === 0) effectLines.push("🖤 +100 EXP!");
          buffApplied = "⚠️ +10% Risk (24h)";
        }
        break;

      // ── 26: Tĩnh Tâm Trà ────────────────────────────────────────────
      case "26":
        if (isMa) {
          update.exp = Math.max(0, (p.exp || 0) - 500);
          applyBuff(p, "risk_reduction_pct", 5, 24 * 60 * 60 * 1000, "Tĩnh Tâm Trà (Ma): -5% Risk");
          if (i === 0) effectLines.push("🍵 -500 EXP!");
          buffApplied = "⚠️ Giảm 5% Risk (24h)";
        } else {
          applyBuff(p, "risk_reduction_pct", 10, 24 * 60 * 60 * 1000, "Tĩnh Tâm Trà (Chính): -10% Risk");
          buffApplied = "🍵 Giảm 10% Rủi ro (24h)";
        }
        break;

      // ── 27: Hộ Mệnh Đan ──────────────────────────────────────────────
      case "27":
        applyBuffNoStack(p, "secret_dmg_reduction_pct", 30, 24 * 60 * 60 * 1000, "Hộ Mệnh Đan: -30% sát thương bí cảnh", "27");
        buffApplied = "🛡️ Giảm 30% sát thương trong bí cảnh lần tới (24h)";
        break;

      // ── 28: Thám Hiểm Đan ────────────────────────────────────────────
      case "28":
        applyBuffNoStack(p, "secret_exp_boost_pct", 25, 24 * 60 * 60 * 1000, "Thám Hiểm Đan: +25% EXP bí cảnh", "28");
        buffApplied = "🗺️ +25% EXP từ bí cảnh lần tới (24h)";
        break;

      // ── 29: Tầm Bảo Đan ──────────────────────────────────────────────
      case "29":
        applyBuffNoStack(p, "secret_loot_boost_pct", 20, 24 * 60 * 60 * 1000, "Tầm Bảo Đan: +20% vật phẩm quý", "29");
        buffApplied = "💎 +20% tỷ lệ rơi vật phẩm quý (24h)";
        break;

      // ── 30: Bùa Tốc Hành ─────────────────────────────────────────────
      case "30":
        applyBuffNoStack(p, "spd_pct", 20, 30 * 60 * 1000, "Bùa Tốc Hành: +20% SPD", "30");
        buffApplied = "💨 +20% SPD (30 phút)";
        break;

      // ── 31: Bùa Hộ Mạng ──────────────────────────────────────────────
      case "31":
        applyBuffNoStack(p, "hp_max_boost_pct", 30, 60 * 60 * 1000, "Bùa Hộ Mạng: +30% HP", "31");
        buffApplied = "🔮 +30% HP (60 phút)";
        break;

      // ── 32: Bùa Thần Lực ─────────────────────────────────────────────
      case "32":
        applyBuffNoStack(p, "atk_pct", 25, 60 * 60 * 1000, "Bùa Thần Lực: +25% ATK", "32");
        buffApplied = "💪 +25% ATK (60 phút)";
        break;

      // ── 33: Thẻ Tốc Độ ───────────────────────────────────────────────
      case "33":
        applyBuff(p, "exp_multiplier", 2, 24 * 60 * 60 * 1000, "Thẻ Tốc Độ: x2 EXP");
        buffApplied = "🃏 x2 EXP tu luyện (24 giờ)";
        break;

      // ── 35: Thất Sát Phù ─────────────────────────────────────────────
      case "35":
        applyBuff(p, "boss_scale_reduction_pct", 50, 60 * 60 * 1000, "Thất Sát Phù: -50% Boss Scaling");
        buffApplied = "📜 Giảm 50% sức mạnh Boss (60 phút)";
        break;

      // ── 36: Thiên Thiên Bảo Hộ ──────────────────────────────────────
      case "36":
        applyBuff(p, "tower_dmg_cap_pct", 15, 60 * 60 * 1000, "Thiên Thiên Bảo Hộ: Giới hạn sát thương 15%");
        buffApplied = "🏯 Giới hạn sát thương tối đa 15% HP mỗi đòn trong Tháp (60 phút)";
        break;

      // ── 37: Thần Hành Đan ─────────────────────────────────────────────
      case "37":
        applyBuffNoStack(p, "secret_speed_multiplier", 2, 24 * 60 * 60 * 1000, "Thần Hành Đan: x2 tốc độ bí cảnh", "37");
        buffApplied = "🏃 x2 tốc độ thám hiểm Bí Cảnh lần tới (24h)";
        break;

      // ── 38: Dẫn Hồn Hương ────────────────────────────────────────────
      case "38":
        applyBuffNoStack(p, "secret_boss_attract", 2, 24 * 60 * 60 * 1000, "Dẫn Hồn Hương: x2 sự kiện đặc biệt", "38");
        buffApplied = "🕯️ x2 tỷ lệ sự kiện đặc biệt/gặp Boss trong Bí Cảnh (24h)";
        break;

      // ── 39: Hàu Sữa Đại Bổ ──────────────────────────────────────────
      case "39":
        update.stamina = Math.min(p.maxStamina || 100, (update.stamina !== undefined ? update.stamina : (p.stamina || 0)) + 500);
        if (i === 0) effectLines.push(`🦪 Thể lực +${qty * 500} → ${update.stamina}`);
        break;

      // ── 43: Đơn Tâm Đan ──────────────────────────────────────────────
      case "43":
        applyBuff(p, "tower_min_dmg_pct", 1.5, 30 * 60 * 1000, "Đơn Tâm Đan: ST đòn trúng tối thiểu 1.5% HP Boss");
        buffApplied = "🌀 Phá giới hạn, mỗi đòn TRÚNG vào Boss gây tối thiểu 1.5% HP Boss trong Tháp Ma Tôn (30 phút). Boss né thì không có dame!";
        break;

      // ── 50: Cuồng Bạo Đan ────────────────────────────────────────────
      case "50":
        applyBuffNoStack(p, "atk_pct", 20, 30 * 60 * 1000, "Cuồng Bạo Đan: +20% ATK, -10% DEF", "50");
        applyBuffNoStack(p, "def_pct", -10, 30 * 60 * 1000, "Cuồng Bạo Đan: -10% DEF", "50");
        buffApplied = "🔥 +20% ATK, -10% DEF (30 phút)";
        break;

      // ── 51: Kim Chung Đan ─────────────────────────────────────────────
      case "51":
        applyBuffNoStack(p, "def_pct", 20, 30 * 60 * 1000, "Kim Chung Đan: +20% DEF", "51");
        applyBuffNoStack(p, "spd_pct", -10, 30 * 60 * 1000, "Kim Chung Đan: -10% SPD", "51");
        buffApplied = "🔔 +20% DEF, -10% SPD (30 phút)";
        break;

      // ── 52: Tật Phong Đan ─────────────────────────────────────────────
      case "52":
        applyBuffNoStack(p, "spd_pct", 20, 30 * 60 * 1000, "Tật Phong Đan: +20% SPD", "52");
        buffApplied = "🌬️ +20% SPD (30 phút)";
        break;

      // ── 60: Thần Tài Đan ──────────────────────────────────────────────
      case "60":
        applyBuff(p, "casino_win_boost_pct", 10, 0, "Thần Tài Đan: +10% tiền thắng (5 ván)");
        applyBuff(p, "casino_remaining_bets", 5, 0, "Thần Tài Đan: còn 5 ván");
        buffApplied = "🪙 +10% tiền thắng cược trong 5 ván tới";
        break;

      // ── 61: Tán Tài Đan ──────────────────────────────────────────────
      case "61":
        applyBuff(p, "casino_loss_refund_pct", 10, 0, "Tán Tài Đan: Hoàn trả 10% thua (5 ván)");
        applyBuff(p, "casino_remaining_bets", 5, 0, "Tán Tài Đan: còn 5 ván");
        buffApplied = "💸 Hoàn trả 10% tiền thua cược trong 5 ván tới";
        break;

      // ── 70: Tẩy Tâm Đan ──────────────────────────────────────────────
      case "70":
        update.pkPoints = Math.max(0, (p.pkPoints || 0) - 1);
        if (i === 0) effectLines.push(`🕊️ Đã xóa 1 điểm PK (còn ${update.pkPoints})`);
        break;

      // ── 34: Bí Kiếp Cửu Chuyền Thể (Công Pháp) ──────────────────────
      case "34": {
        const baseMax = 50 + p.majorRealm * 20;
        const desiredBonus = Math.max(p.maxStaminaBonus || 0, congpha.maxStamina - baseMax);
        update.maxStaminaBonus = desiredBonus;
        update.maxStamina = baseMax + desiredBonus;
        update.stamina = Math.min(p.stamina || 0, update.maxStamina);
        if (i === 0) effectLines.push(`⚡ Giới hạn Thể Lực tăng lên ${update.maxStamina}!`);
        break;
      }

      // ── 213: Bách Mạch Thông Thể (Công Pháp) ────────────────────────
      case "213": {
        const baseMax = 50 + p.majorRealm * 20;
        const curBonus = (p.maxStaminaBonus || 0) + 1000;
        update.maxStaminaBonus = curBonus;
        update.maxStamina = baseMax + curBonus;
        update.stamina = Math.min(p.stamina || 0, update.maxStamina);
        if (i === 0) effectLines.push(`🌊 Giới hạn Thể Lực +1000 → ${update.maxStamina}!`);
        break;
      }

      default:
        effectLines.push(`✅ Đã dùng ${item.name}!`);
    }
  }

  if (item.id === "4" && qty > 0) {
    effectLines.push(`⚗️ Đột Phá Đan +${qty * 10}% tỉ lệ đột phá (tổng: +${p.breakthroughBonus || 0}%)`);
  }

  const oldExp = p.exp || 0;
  Object.assign(p, update);
  if (buffApplied && effectLines.length === 0) {
    effectLines.push(`✨ ${buffApplied}`);
  }
  if (qty > 1 && update.exp !== undefined && update.exp !== oldExp) {
    const gained = update.exp - oldExp;
    if (gained > 0) effectLines.push(`📈 Tổng cộng +${formatNumber(gained)} EXP (${qty} viên)`);
  }
  removeItem(senderId, item.id, qty);
  savePlayer(senderId);

  const remaining = (p.inventory.potions[item.id] || 0);
  const isCongPha = !!congpha;
  if (isCongPha && !hasLearned(p, item.id)) {
    p.learnedCongPha.push(item.id);
    savePlayer(senderId);
  }

  const msg = `${item.emoji} ${isCongPha ? "TU LUYỆN CÔNG PHÁP THÀNH CÔNG!" : "LĨNH NGỘ ĐAN DƯỢC!"}
━━━━━━━━━━━━━━━━
${qty > 1 ? `${qty}x ` : ""}${item.name}
${effectLines.join("\n")}
${noStackNoted ? "━━━━━━━━━━━━━━━━\n⚠️ Đan này KHÔNG cộng dồn! Chỉ 1 viên phát huy tác dụng, số còn lại được giữ lại.\n" : ""}━━━━━━━━━━━━━━━━
📦 Còn lại: ${remaining} ${isCongPha ? "quyển" : "viên"}`;

  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

async function handleDp(api, message, p, senderId) {
  const now = Date.now();
  if (p.trongThuongUntil && p.trongThuongUntil > now) {
    const mins = Math.ceil((p.trongThuongUntil - now) / 60000);
    return api.sendMessage({ msg: `💔 ĐANG TRỌNG THƯƠNG!
━━━━━━━━━━━━━━━━
⏳ Còn ${mins} phút nữa mới có thể đột phá tiếp.
🩹 Dùng đan 1 (Huyết Khí Đan) để chữa trị ngay!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (p.trongThuongUntil && p.trongThuongUntil <= now) p.trongThuongUntil = 0;

  if (p.majorRealm >= getMaxMajorRealm(p.daotam) && p.minorRealm >= MAX_MINOR_REALM) {
    return api.sendMessage({ msg: `🌟 Bạn đã đạt cảnh giới tối cao!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (!p.dpAuto) {
    return handleDpSingle(api, message, p, senderId);
  }

  // ── AUTO MODE ──
  const startRealm = getRealmDisplayFull(p);
  let dan4Count = p.inventory.potions?.["4"] || 0;
  let iterations = 0;
  const MAX_ITER = 200;

  while (iterations < MAX_ITER) {
    if (p.majorRealm >= getMaxMajorRealm(p.daotam) && p.minorRealm >= MAX_MINOR_REALM) break;

    const maxExp = getMaxExp(p.majorRealm, p.minorRealm, p.daotam);
    if ((p.exp || 0) < maxExp) break;

    let newMajor = p.majorRealm;
    let newMinor = p.minorRealm;
    if (newMinor < MAX_MINOR_REALM) { newMinor++; }
    else { newMajor++; newMinor = 1; }

    const oldRealm = getRealmDisplay(p.majorRealm, p.minorRealm, p.daotam);
    const isMajor = newMajor > p.majorRealm;
    const realm = getRealmByIndex(p.majorRealm, p.daotam);
    const minorRate = Math.min(realm.breakthroughRate + 20, 100);
    const baseRate = isMajor ? realm.breakthroughRate : minorRate;

    let success = false;
    if (dan4Count > 0) {
      dan4Count--;
      if (!p.inventory.potions) p.inventory.potions = {};
      p.inventory.potions["4"] = dan4Count;
      success = true;
    } else {
      success = Math.random() * 100 < baseRate;
    }

    if (!success) {
      let injuryMs = 3600000;
      const reduc = getBuffValue(p, "injury_time_reduction");
      if (reduc > 0) injuryMs = Math.floor(injuryMs * (1 - reduc / 100));
      p.trongThuongUntil = now + injuryMs;
      p.exp = Math.floor((p.exp || 0) * 0.7);
      p.breakthroughBonus = 0;
      break;
    }

    const newRealm = getRealmDisplay(newMajor, newMinor, p.daotam);
    p.majorRealm = newMajor;
    p.minorRealm = newMinor;
    p.breakthroughBonus = 0;
    p.exp = Math.max(0, (p.exp || 0) - maxExp);
    if (isMajor) {
      const newMax = 50 + newMajor * 20;
      p.maxStamina = newMax + (p.maxStaminaBonus || 0);
      p.stamina = Math.min(p.stamina || 0, p.maxStamina);
    }
    iterations++;
  }

  savePlayer(senderId);
  const top3Granted = checkTop3Title(loadData());
  if (top3Granted.length > 0) saveData();

  const finalRealm = getRealmDisplayFull(p);
  const finalMaxExp = getMaxExp(p.majorRealm, p.minorRealm, p.daotam);
  const msg = `⚡ ĐỘT PHÁ AUTO — HOÀN TẤT!
━━━━━━━━━━━━━━━━
🔄 Đã đột phá: ${iterations} lần
📦 Đan 4 còn lại: ${dan4Count}
━━━━━━━━━━━━━━━━
📍 ${startRealm} → ${finalRealm}
━━━━━━━━━━━━━━━━
✨ EXP: ${formatNumber(p.exp)} / ${formatNumber(finalMaxExp)}
💡 Dùng ${getGlobalPrefix()}dp auto off để tắt auto.`;

  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

async function handleDpSingle(api, message, p, senderId) {
  const now = Date.now();
  const maxExp = getMaxExp(p.majorRealm, p.minorRealm, p.daotam);

  if ((p.exp || 0) < maxExp) {
    const remaining = maxExp - p.exp;
    const percent = maxExp > 0 ? Math.floor((p.exp / maxExp) * 100) : 0;
    const bar = "█".repeat(Math.floor(percent / 10)) + "░".repeat(10 - Math.floor(percent / 10));
    return api.sendMessage({ msg: `❌ EXP chưa đủ để đột phá!
📊 [${bar}] ${percent}% — Còn thiếu ${formatNumber(remaining)} EXP
💡 Vào bí cảnh: ${getGlobalPrefix()}tl bc di`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  let newMajor = p.majorRealm;
  let newMinor = p.minorRealm;

  if (newMinor < MAX_MINOR_REALM) { newMinor++; }
  else { newMajor++; newMinor = 1; }

  const oldRealm = getRealmDisplay(p.majorRealm, p.minorRealm, p.daotam);
  const isMajor = newMajor > p.majorRealm;
  const bonusUsed = p.breakthroughBonus || 0;

  const realm = getRealmByIndex(p.majorRealm, p.daotam);
  const minorRate = Math.min(realm.breakthroughRate + 20, 100);
  const rate = isMajor ? realm.breakthroughRate : minorRate;
  const success = Math.random() * 100 < (rate + bonusUsed);

  if (!success) {
    let injuryMs = 3600000;
    const reduc = getBuffValue(p, "injury_time_reduction");
    if (reduc > 0) injuryMs = Math.floor(injuryMs * (1 - reduc / 100));
    p.trongThuongUntil = now + injuryMs;
    p.exp = Math.floor((p.exp || 0) * 0.7);
    p.breakthroughBonus = 0;
    savePlayer(senderId);

    const failType = isMajor ? "Đại Cảnh" : "Tiểu Cảnh";
    return api.sendMessage({ msg: `💀 ĐỘT PHÁ THẤT BẠI!
━━━━━━━━━━━━━━━━
${oldRealm} → Thất bại (${failType})!

⚡ Lôi kiếp quá mạnh! Đạo hữu bị trọng thương.
💔 Trọng thương ${Math.ceil(injuryMs / 60000)} phút${reduc > 0 ? ` (Hộ Tâm Đan -${reduc}%)` : ""} — 🩹 đan 1 (Huyết Khí Đan) chữa trị.
📉 Mất 30% EXP đang có (-${formatNumber(Math.floor((p.exp || 0) / 0.7 * 0.3))}).
📊 Tỉ lệ: ${rate}%${bonusUsed > 0 ? ` (+${bonusUsed}% đan 4)` : ""}
💡 Cắn thêm Đột Phá Đan (mỗi viên +10%) và thử lại!`, quote: message, ttl: 30000 }, message.threadId, message.type);
  }

  const newRealm = getRealmDisplay(newMajor, newMinor, p.daotam);

  p.majorRealm = newMajor;
  p.minorRealm = newMinor;
  p.breakthroughBonus = 0;
  p.exp = Math.max(0, (p.exp || 0) - maxExp);
  if (isMajor) {
    const newMax = 50 + newMajor * 20;
    p.maxStamina = newMax + (p.maxStaminaBonus || 0);
    p.stamina = Math.min(p.stamina || 0, p.maxStamina);
  }
  savePlayer(senderId);

  const top3Granted = checkTop3Title(loadData());
  if (top3Granted.length > 0) saveData();

  const newMaxExp = getMaxExp(p.majorRealm, p.minorRealm, p.daotam);
  const msg = `${isMajor ? "🌌 ĐẠI ĐỘT PHÁ — THÀNH CÔNG!" : "⚡ ĐỘT PHÁ THÀNH CÔNG!"}
━━━━━━━━━━━━━━━━
📍 ${oldRealm}
➡️ ${newRealm}
━━━━━━━━━━━━━━━━
${bonusUsed > 0 ? `⚗️ Đan 4: +${bonusUsed}% tỉ lệ\n` : ""}✨ Tiêu hao ${formatNumber(maxExp)} EXP — Còn lại: ${formatNumber(p.exp)} / ${formatNumber(newMaxExp)}
${p.exp >= newMaxExp ? `⚡ EXP vẫn đủ! Gõ ${getGlobalPrefix()}dp để đột phá tiếp ngay!\n` : ""}💡 Dùng ${getGlobalPrefix()}tl để xem hồ sơ.`;

  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

function getAvailableRealms(player) {
  return SECRET_REALMS.filter(sr => sr.requiredRealm <= player.majorRealm);
}

async function enterSecretRealm(api, message, p, senderId, dungeon) {
  if (p.inSecretRealm) {
    return api.sendMessage({ msg: "❌ Bạn đang ở trong Bí Cảnh rồi! Dùng `tl bc ve` để về.", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (p.beguan && p.beguan.startedAt) {
    return api.sendMessage({ msg: `❌ Bạn đang bế quan! Dùng ${getGlobalPrefix()}tl stop để thu hoạch trước khi vào bí cảnh.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const stamina = p.stamina ?? 0;
  if (stamina < dungeon.staminaCost) {
    return api.sendMessage({ msg: `❌ Không đủ Thể Lực! Cần ${dungeon.staminaCost} TL, có ${stamina} TL.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const today = new Date().toISOString().slice(0, 10);
  let visitsToday = p.secretRealmVisitsToday || 0;
  if (p.secretRealmLastReset !== today) visitsToday = 0;

  const realmName = getRealmList(p.daotam)[dungeon.requiredRealm]?.name || "???";
  const timeLimit = 20 * (dungeon.requiredRealm + 1);

  p.inSecretRealm = true;
  p.secretRealmEnteredAt = Date.now();
  p.secretRealmVisitsToday = visitsToday + 1;
  p.secretRealmLastReset = today;
  p.currentSecretRealmId = dungeon.id;
  p.stamina = stamina - dungeon.staminaCost;
  savePlayer(senderId);

  const msg = `🌀 TIẾN VÀO BÍ CẢNH!
━━━━━━━━━━━━━━━━
📍 ${dungeon.name}
🛡️ Yêu cầu: ${realmName} | 🔋 -${dungeon.staminaCost} TL (còn: ${p.stamina})
📖 ${dungeon.desc}
━━━━━━━━━━━━━━━━
⏰ Giới hạn: ${timeLimit} phút
━━━━━━━━━━━━━━━━
💡 ${getGlobalPrefix()}tl bc ve — Rời bí cảnh (càng lâu càng nhiều EXP, tối đa ${timeLimit}p)`;

  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

async function handleBcList(api, message, p, senderId, pageStr) {
  const allAvailable = getAvailableRealms(p);
  if (allAvailable.length === 0) {
    return api.sendMessage({ msg: "❌ Chưa có bí cảnh nào phù hợp với cảnh giới của bạn!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const pageSize = 5;
  const page = Math.max(1, parseInt(pageStr || "1") || 1);
  const totalPages = Math.ceil(allAvailable.length / pageSize);
  const pn = Math.min(page, totalPages);
  const start = (pn - 1) * pageSize;
  const slice = allAvailable.slice(start, start + pageSize);
  const prefix = getGlobalPrefix();
  const best = allAvailable.reduce((a, b) => a.requiredRealm > b.requiredRealm ? a : b);

  const lines = slice.map((sr, i) => {
    const idx = start + i + 1;
    const realmName = getRealmList(p.daotam)[sr.requiredRealm]?.name || "???";
    const isRecommended = sr.id === best.id ? " 🌟 (Đề Xuất)" : "";
    return `[${idx}]${isRecommended} 📍 ${sr.name} (ID: ${sr.id})\n🛡️ Cần: ${realmName} | 🔋 ${sr.staminaCost} TL\n👾 ${sr.desc}`;
  });

  const msg = `🗺️ DANH SÁCH BÍ CẢNH KHẢ DỤNG (${allAvailable.length}/${SECRET_REALMS.length})
━━━━━━━━━━━━━━━━
${lines.join("\n━━━━━━━━━━━━━━━━\n")}
━━━━━━━━━━━━━━━━
📄 Trang ${pn}/${totalPages} • ${prefix}tl bc <số> để đi
💡 ${prefix}tl bc di — Tự động chọn bí cảnh phù hợp`;

  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleBcDi(api, message, p, senderId) {
  const available = getAvailableRealms(p);
  if (available.length === 0) {
    return api.sendMessage({ msg: "❌ Chưa có bí cảnh phù hợp với cảnh giới của bạn!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  const best = available.reduce((a, b) => a.requiredRealm > b.requiredRealm ? a : b);
  return enterSecretRealm(api, message, p, senderId, best);
}

async function handleBcGo(api, message, p, senderId, index) {
  const available = getAvailableRealms(p);
  if (index < 1 || index > available.length) {
    return api.sendMessage({ msg: `❌ Số thứ tự không hợp lệ! (1-${available.length})`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  return enterSecretRealm(api, message, p, senderId, available[index - 1]);
}

async function handleBcVe(api, message, p, senderId) {
  if (!p.inSecretRealm) {
    return api.sendMessage({ msg: "❌ Bạn chưa vào Bí Cảnh! Dùng `tl bc di` để tiến vào.", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const enteredAt = p.secretRealmEnteredAt;
  if (!enteredAt) {
    p.inSecretRealm = false;
    savePlayer(senderId);
    return api.sendMessage({ msg: "⚠️ Lỗi dữ liệu, đã reset.", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const MIN_STAY_MS = 3 * 60 * 1000;
  const elapsedMs = Date.now() - enteredAt;
  if (elapsedMs < MIN_STAY_MS) {
    const remainSec = Math.ceil((MIN_STAY_MS - elapsedMs) / 1000);
    return api.sendMessage({ msg: `⏳ Bạn mới vào Bí Cảnh được chưa đầy 3 phút! Chờ thêm ${remainSec}s rồi dùng ${getGlobalPrefix()}tl bc ve để nhận thưởng.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const dungeon = SECRET_REALMS.find(sr => sr.id === p.currentSecretRealmId);
  const realmIndex = dungeon ? dungeon.requiredRealm : p.majorRealm;
  const mult = dungeon ? dungeon.expMultiplier : 0.10;
  const limit = 20 * (realmIndex + 1);

  const baseExp = getRealmExpBase(realmIndex, MAX_MINOR_REALM, p.daotam);
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const speedMult = getBuffValue(p, "secret_speed_multiplier") || 1;
  const cappedMin = Math.min(elapsedMin * speedMult, limit);
  const rewardFraction = limit > 0 ? cappedMin / limit : 1;
  const expGained = Math.floor(baseExp * mult * rewardFraction);
  const theChatStats = calcStats(p);
  const linhCan = LINH_CAN.find(l => l.id === p.linhCan) || LINH_CAN[0];
  const threadExpMult = getThreadExpMult(message.threadId);
  const marBonus = getMarriageExpBonus(p);
  const expGainedFinal = Math.floor(expGained * (1 + (theChatStats.expBonus || 0) / 100) * linhCan.expMult * threadExpMult * (1 + marBonus / 100));
  const stonesGained = Math.floor(2000 + Math.random() * (1000000 - 2000));

  const eventLog = [];

  const bossAttract = getBuffValue(p, "secret_boss_attract") || 1;
  const specialChance = 0.10 * bossAttract;
  let specialExp = 0;
  if (Math.random() < specialChance) {
    specialExp = Math.floor(expGainedFinal * (0.3 + Math.random() * 0.4));
    eventLog.push(`🔥 BẮT GẶP QUÁI VẬT CỰC MẠNH! Chiến thắng nhận thêm +${formatNumber(specialExp)} EXP${bossAttract > 1 ? " (Dẫn Hồn Hương x2)" : ""}`);
  }

  const lootBoost = getBuffValue(p, "secret_loot_boost_pct") || 0;
  const lootChance = 0.06 + lootBoost / 100;
  let lootItem = null;
  if (Math.random() < lootChance) {
    const pool = ["1", "5", "7", "10", "4"];
    lootItem = pool[Math.floor(Math.random() * pool.length)];
    const pi = POTIONS.find(po => po.id === lootItem);
    eventLog.push(`🎁 Nhặt được vật phẩm quý: ${pi.emoji} ${pi.name}!${lootBoost > 0 ? ` (Tầm Bảo Đan +${lootBoost}%)` : ""}`);
  }

  // ── Săn nguyên liệu luyện đan: càng ở lâu, tỉ lệ & số lượng càng cao ──
  if (!p.inventory.materials) p.inventory.materials = {};
  const matDropLines = [];
  const totalMatWeight = MATERIALS.reduce((s, m) => s + m.dropWeight, 0);
  const attempts = rewardFraction >= 1 ? 4 : rewardFraction >= 0.5 ? 3 : 2;
  for (let i = 0; i < attempts; i++) {
    if (Math.random() > 0.30 + 0.60 * rewardFraction) continue;
    let roll = Math.random() * totalMatWeight;
    let picked = MATERIALS[MATERIALS.length - 1];
    for (const m of MATERIALS) {
      roll -= m.dropWeight;
      if (roll <= 0) { picked = m; break; }
    }
    let dropQty = 1;
    if (picked.price <= 50) {
      if (Math.random() < rewardFraction) dropQty++;
      if (Math.random() < rewardFraction * 0.5) dropQty++;
    }
    p.inventory.materials[picked.id] = (p.inventory.materials[picked.id] || 0) + dropQty;
    matDropLines.push(`${picked.emoji} ${picked.name} ×${dropQty}`);
  }
  if (matDropLines.length > 0) {
    eventLog.push(`🌾 Săn được nguyên liệu: ${matDropLines.join(", ")}`);
  }

  // ── Xương rớt từ Bí Cảnh: chỉ khi ở đủ 30 phút, 40% chance, 70-140 xương ──
  const BONE_MIN_STAY_MS = 30 * 60 * 1000; // 30 phút
  if (elapsedMs >= BONE_MIN_STAY_MS && Math.random() < 0.40) {
    const bonesDrop = Math.floor(70 + Math.random() * 71);
    p.bones = (p.bones || 0) + bonesDrop;
    eventLog.push(`🦴 Nhặt được ${bonesDrop} Xương!`);
  }

  const curStats = calcStats(p);
  const maxHp = curStats.hp;
  let curHp = p.currentHp != null ? p.currentHp : maxHp;
  const dmgReduction = getBuffValue(p, "secret_dmg_reduction_pct") || 0;
  let dmgTaken = 0;
  if (Math.random() < 0.22) {
    dmgTaken = Math.floor(maxHp * (0.06 + Math.random() * 0.10) * (1 - dmgReduction / 100));
    curHp = Math.max(0, curHp - dmgTaken);
    if (dmgTaken > 0) eventLog.push(`💢 Bị yêu thú tấn công, mất ${formatNumber(dmgTaken)} HP${dmgReduction > 0 ? ` (Hộ Mệnh Đan -${dmgReduction}%)` : ""}`);
  }
  if (curHp <= 0) {
    let injuryMs = 3600000;
    const reduc = getBuffValue(p, "injury_time_reduction");
    if (reduc > 0) injuryMs = Math.floor(injuryMs * (1 - reduc / 100));
    p.trongThuongUntil = Date.now() + injuryMs;
    curHp = 1;
    eventLog.push(`💀 Trọng thương vì thương thế quá nặng! Đột phá bị khóa ${Math.ceil(injuryMs / 60000)}p (đan 1 chữa trị)`);
  }
  p.currentHp = curHp;

  consumeBuff(p, "secret_speed_multiplier");
  consumeBuff(p, "secret_boss_attract");
  consumeBuff(p, "secret_loot_boost_pct");
  consumeBuff(p, "secret_dmg_reduction_pct");

  p.exp = (p.exp || 0) + expGainedFinal + specialExp;
  p.spiritStones = (p.spiritStones || 0) + stonesGained;

  // ── Đạo lữ hưởng 50% EXP bí cảnh (chỉ khi cùng đại cảnh giới) ──
  let partnerShare = 0;
  let partnerShareName = null;
  let partnerShareBlocked = false;
  const myKeyBc = resolvePlayerKey(senderId);
  const mar = p.marriageKey ? getMarriages()[p.marriageKey] : null;
  if (mar && expGainedFinal > 0) {
    const daoLuKey = mar.a === myKeyBc ? mar.b : mar.a;
    const daoLu = getPlayer(daoLuKey);
    // Validate: đạo lữ phải cùng majorRealm mới được hưởng chia sẻ EXP
    if ((daoLu.majorRealm || 1) !== (p.majorRealm || 1)) {
      partnerShareBlocked = true;
    } else {
      partnerShare = Math.floor(expGainedFinal * 0.5);
      daoLu.exp = (daoLu.exp || 0) + partnerShare;
      partnerShareName = await getPlayerDisplayName(api, daoLuKey);
    }
  }

  if (lootItem) {
    p.inventory.potions[lootItem] = (p.inventory.potions[lootItem] || 0) + 1;
  }
  p.inSecretRealm = false;
  p.secretRealmEnteredAt = null;
  p.currentSecretRealmId = null;
  savePlayer(senderId);

  const newMaxExp = getMaxExp(p.majorRealm, p.minorRealm, p.daotam);
  const expPercent = newMaxExp > 0 ? Math.min(Math.floor((p.exp / newMaxExp) * 100), 100) : 0;
  const bar = "█".repeat(Math.floor(expPercent / 10)) + "░".repeat(10 - Math.floor(expPercent / 10));
  const dungeonName = dungeon ? dungeon.name : "Bí Cảnh";
  const timeDisplay = elapsedMin >= limit ? "TỐI ĐA" : `${elapsedMin}/${limit}p`;

  const partnerShareLine = partnerShare > 0
    ? `\n💞 Đạo lữ ${partnerShareName} nhận +${formatNumber(partnerShare)} EXP (50% chia sẻ)`
    : partnerShareBlocked
      ? `\n⚠️ Đạo lữ không cùng cảnh giới — không nhận EXP chia sẻ (cần cùng đại cảnh)`
      : "";
  const msg = `🎉 RỜI ${dungeonName.toUpperCase()} THÀNH CÔNG!
━━━━━━━━━━━━━━━━
📍 ${dungeonName}
⏰ Thời gian: ${timeDisplay}${speedMult > 1 ? ` (x${speedMult} Thần Hành Đan)` : ""} (×${(rewardFraction * 100).toFixed(0)}%)
✨ EXP nhận: +${formatNumber(expGainedFinal)}${threadExpMult !== 1 ? ` (×${threadExpMult} nhóm)` : ""}${specialExp > 0 ? ` +${formatNumber(specialExp)} sự kiện` : ""}${theChatStats.expBonus ? ` (+${theChatStats.expBonus}% thể chất)` : ""}${marBonus ? ` (+${marBonus}% đạo lữ)` : ""}${linhCan.expMult !== 1 ? ` (×${linhCan.expMult} linh căn)` : ""} (${Math.floor(mult * 100)}%)${partnerShareLine}
💎 LT nhận: +${formatNumber(stonesGained)}
${eventLog.length > 0 ? `━━━━━━━━━━━━━━━━\n${eventLog.join("\n")}\n` : ""}━━━━━━━━━━━━━━━━
📊 EXP [${bar}] ${expPercent}%
${formatNumber(p.exp)} / ${formatNumber(newMaxExp)}
${p.exp >= newMaxExp ? `━━━━━━━━━━━━━━━━\n⚡ EXP đã đầy! ${getGlobalPrefix()}dp để đột phá!` : ""}`;

  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

async function handlePkChallenge(api, message, p, senderId, sub2) {
  const mentionObj = message.data.mentions?.[0];
  const mentioned = mentionObj?.uid || sub2;
  if (!mentioned) {
    return api.sendMessage({ msg: "❌ Cú pháp: `tl pk @người_chơi`", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const targetId = mentioned.toString();
  const challengerName = message.data.dName || senderId;
  const targetName = getTargetName(message, targetId, senderId);
  if (targetId === senderId) {
    return api.sendMessage({ msg: "❌ Không thể tự thách đấu!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (p.beguan && p.beguan.startedAt) {
    return api.sendMessage({ msg: `❌ Bạn đang bế quan! Dùng ${getGlobalPrefix()}tl stop để thu hoạch trước khi PK.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const targetPlayer = getPlayer(targetId);
  if (targetPlayer.beguan && targetPlayer.beguan.startedAt) {
    return api.sendMessage({ msg: `❌ ${targetName} đang bế quan, không thể PK lúc này!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const key = `${senderId}_${targetId}`;
  if (pendingPk[senderId]) {
    return api.sendMessage({ msg: "⚠️ Bạn đang có thách đấu chưa được hồi đáp!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const cStats = calcStats(p);
  const tStats = calcStats(targetPlayer);

  pendingPk[senderId] = { targetId, challengerId: senderId, challengerName, targetName, time: Date.now() };
  setTimeout(() => { delete pendingPk[senderId]; }, 120000);

  const msg = `⚔️ LỜI THÁCH ĐẤU!
━━━━━━━━━━━━━━━━
⚔️ Người thách: ${challengerName}
🛡️ Đối thủ: ${targetName}
━━━━━━━━━━━━━━━━
📊 Lực Chiến: ${formatNumber(cStats.battlePower)} VS ${formatNumber(tStats.battlePower)}
━━━━━━━━━━━━━━━━
💡 Người bị tag gõ ${getGlobalPrefix()}tl pk ok trong 2 phút!
🏆 Thưởng: ${PK_REWARD_WINNER} LT + ${PK_REWARD_POINTS} điểm xếp hạng`;

  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handlePkAccept(api, message, p, senderId) {
  let challenge = null;
  let challengerId = null;
  for (const [cid, c] of Object.entries(pendingPk)) {
    if (c.targetId === senderId) {
      challenge = c;
      challengerId = cid;
      break;
    }
  }

  if (!challenge) {
    return api.sendMessage({ msg: "❌ Không có lời thách đấu nào! (Hết hạn sau 2 phút)", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (p.beguan && p.beguan.startedAt) {
    return api.sendMessage({ msg: `❌ Bạn đang bế quan! Dùng ${getGlobalPrefix()}tl stop để thu hoạch trước khi PK.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const challengerPlayer = getPlayer(challengerId);
  if (challengerPlayer.beguan && challengerPlayer.beguan.startedAt) {
    return api.sendMessage({ msg: `❌ ${challenge.challengerName || challengerId} đang bế quan, không thể PK lúc này!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  delete pendingPk[challengerId];

  const cStats = calcStats(challengerPlayer);
  const tStats = calcStats(p);

  const challengerName = challenge.challengerName || challengerId;
  const targetName = challenge.targetName || senderId;

  // ── Pháp Tắc tu luyện: áp hiệu ứng vào chỉ số trước trận ──
  const cPtEff = getPhapTacEffects(challengerPlayer.phapTacPath, challengerPlayer.phapTacLevel);
  const tPtEff = getPhapTacEffects(p.phapTacPath, p.phapTacLevel);
  applyPhapTacPkStats(cStats, tStats, cPtEff);
  applyPhapTacPkStats(tStats, cStats, tPtEff);
  let ptIntro = "";
  if (cPtEff) {
    const cfg = PHAPTAC_PATHS[challengerPlayer.phapTacPath];
    ptIntro += `${cfg.emoji} ${challengerName} triển khai [${cfg.name} Lv.${challengerPlayer.phapTacLevel}]: ${describePhapTacEff(cPtEff)}\n`;
  }
  if (tPtEff) {
    const cfg = PHAPTAC_PATHS[p.phapTacPath];
    ptIntro += `${cfg.emoji} ${targetName} triển khai [${cfg.name} Lv.${p.phapTacLevel}]: ${describePhapTacEff(tPtEff)}\n`;
  }
  if (ptIntro) ptIntro += "\n";

  const attacker = cStats.spd >= tStats.spd ? challengerId : senderId;
  const defender = attacker === challengerId ? senderId : challengerId;
  const attackerName = attacker === challengerId ? challengerName : targetName;
  const defenderName = attacker === challengerId ? targetName : challengerName;
  const aStats = attacker === challengerId ? cStats : tStats;
  const dStats = defender === challengerId ? cStats : tStats;

  // ── Pháp Tắc Thời Không: hồi sinh 1 lần duy nhất mỗi trận ──
  const cRevive = cPtEff?.reviveChance ? { chance: cPtEff.reviveChance, hpPct: cPtEff.reviveHpPct || 10 } : null;
  const tRevive = tPtEff?.reviveChance ? { chance: tPtEff.reviveChance, hpPct: tPtEff.reviveHpPct || 10 } : null;
  const aRevive = attacker === challengerId ? cRevive : tRevive;
  const dRevive = defender === challengerId ? cRevive : tRevive;
  let aReviveUsed = false, dReviveUsed = false;
  const attemptRevive = (sideIsA, name, turnLines) => {
    const cfg = sideIsA ? aRevive : dRevive;
    if (!cfg) return null;
    if (sideIsA) {
      if (aReviveUsed) return null;
      aReviveUsed = true;
    } else {
      if (dReviveUsed) return null;
      dReviveUsed = true;
    }
    const maxHp = sideIsA ? aStats.hp : dStats.hp;
    if (Math.random() * 100 < cfg.chance) {
      const revivedHp = Math.max(1, Math.floor(maxHp * cfg.hpPct / 100));
      turnLines.push(`🌀 [THỜI KHÔNG ĐẢO LƯU] ${name} đã gục ngã... nhưng thời gian đảo ngược — HỒI SINH với ${formatBig(revivedHp)} HP! (cơ hội duy nhất đã dùng)`);
      return revivedHp;
    }
    turnLines.push(`🌀 [Thời Không] ${name} khơi dòng thời khắc để hồi sinh... nhưng THẤT BẠI! (cơ hội duy nhất đã dùng)`);
    return null;
  };

  // ── Pháp Tắc: câu thoại khi ra đòn kết liễu ──
  const PT_KILL_QUOTES = {
    thoigian: (name) => `⏳ [THỜI GIAN] ${name}: "Sinh mệnh vĩnh hằng — thọ nguyên đặt tới điểm kết thúc!"`,
    khonggian: (name) => `🌌 [KHÔNG GIAN] ${name}: "Kiếp diệt chúng sinh — hư không quy khư, thời không thảy đều vỡ vụn!"`,
    thoikhong: (name) => `🌀 [THỜI KHÔNG] ${name}: "Thiên mệnh thời không — nằm lại vĩnh viễn ở dòng sông thời gian đi!"`,
  };
  const getKillLine = (eff, name) => {
    if (!eff) return null;
    if (eff.enemySpdRed) return PT_KILL_QUOTES.thoigian(name);
    if (eff.crit) return PT_KILL_QUOTES.khonggian(name);
    if (eff.reviveChance) return PT_KILL_QUOTES.thoikhong(name);
    return null;
  };
  const aKillLine = getKillLine(attacker === challengerId ? cPtEff : tPtEff, attackerName);
  const dKillLine = getKillLine(defender === challengerId ? cPtEff : tPtEff, defenderName);

  let hpA = aStats.hp, hpD = dStats.hp;
  let totalDmgA = 0, totalDmgD = 0;
  let roundLines = [];
  let turn = 0;
  const MAX_TURNS = 25;
  const MSG_BUDGET = 3400;
  const EST_ROUND = 235;
  const FOOTER_EST = 330;
  const headerText = `⚔️ QUYẾT CHIẾN: ${attackerName} vs ${defenderName} ⚔️

`;
  let used = headerText.length;

  const dodgeA = aStats.dodge || 0;
  const dodgeD = dStats.dodge || 0;
  const critResA = aStats.critResist || 0;
  const critResD = dStats.critResist || 0;
  const dmgRedA = aStats.dmgReduction || 0;
  const dmgRedD = dStats.dmgReduction || 0;
  const trueDmgA = aStats.trueDmg || 0;
  const trueDmgD = dStats.trueDmg || 0;
  const armorPenA = aStats.armorPen || 0;
  const armorPenD = dStats.armorPen || 0;
  const critDmgA = aStats.critDmg || 0;
  const critDmgD = dStats.critDmg || 0;

  const aPlayer = attacker === challengerId ? challengerPlayer : p;
  const dPlayer = defender === challengerId ? challengerPlayer : p;
  const aTech = aPlayer.equippedPhapTac;
  const dTech = dPlayer.equippedPhapTac;
  let aSkillUsed = false, dSkillUsed = false;
  let dodgeRedD = 0, dodgeRedA = 0;
  let dodgeBoostA = 0, dodgeBoostD = 0;
  let healRedD = 0, healRedA = 0;
  let lifeRedD = 0, lifeRedA = 0;
  let burnOnD = false, burnOnA = false;
  const aDmgMult = aTech === "hoa_thuat" ? 1.05 : 1;
  const dDmgMult = dTech === "hoa_thuat" ? 1.05 : 1;

  while (hpA > 0 && hpD > 0 && turn < MAX_TURNS) {
    if (used + EST_ROUND + FOOTER_EST > MSG_BUDGET) break;
    turn++;
    const turnLines = [];

    // ── Burn Hỏa Diệt Thế (thiêu đốt mỗi hiệp) ──
    if (burnOnD) {
      const burnTick = Math.max(1, Math.floor(dStats.hp * 0.01));
      hpD = Math.max(0, hpD - burnTick);
      totalDmgA += burnTick;
      turnLines.push(`🔥 [Hỏa Diệt Thế] ${defenderName} bị thiêu đốt mất ${formatBig(burnTick)} HP (1% máu tối đa)!`);
      if (hpD <= 0) {
        const rv = attemptRevive(false, defenderName, turnLines);
        if (rv != null) hpD = rv;
      }
      if (hpD <= 0) {
        const roundBlock = `--- Hiệp ${turn} ---\n${turnLines.join("\n")}\n\n`;
        roundLines.push(roundBlock);
        used += roundBlock.length;
        break;
      }
    }
    if (burnOnA) {
      const burnTick = Math.max(1, Math.floor(aStats.hp * 0.01));
      hpA = Math.max(0, hpA - burnTick);
      totalDmgD += burnTick;
      turnLines.push(`🔥 [Hỏa Diệt Thế] ${attackerName} bị thiêu đốt mất ${formatBig(burnTick)} HP (1% máu tối đa)!`);
      if (hpA <= 0) {
        const rv = attemptRevive(true, attackerName, turnLines);
        if (rv != null) hpA = rv;
      }
      if (hpA <= 0) {
        const roundBlock = `--- Hiệp ${turn} ---\n${turnLines.join("\n")}\n\n`;
        roundLines.push(roundBlock);
        used += roundBlock.length;
        break;
      }
    }

    // ── Tấn công A → D ──
    if (!aSkillUsed && aTech) {
      aSkillUsed = true;
      if (aTech === "phong_thuat") {
        const furyDmg = Math.floor(aStats.base.atk * 0.5);
        hpD = Math.max(0, hpD - furyDmg);
        totalDmgA += furyDmg;
        dodgeRedD = Math.min(100, dodgeRedD + 30);
        dodgeBoostA = 50;
        turnLines.push(`🌪️ [PHONG CUỒNG NỘ] ${attackerName} bùng nổ phong khí công kích ${defenderName}: ${formatBig(furyDmg)} ST (không thể crit)! Giảm 30% hiệu quả né của ${defenderName}, bản thân +50% né trong lượt tấn công tới của địch.`);
      } else if (aTech === "hoa_thuat") {
        healRedD = Math.min(100, healRedD + 10);
        burnOnD = true;
        turnLines.push(`🔥 [HỎA DIỆT THẾ] ${attackerName} phóng hỏa diệt thế! Giảm 10% hiệu quả hồi máu của ${defenderName}, thiêu đốt ${defenderName} 1% máu tối đa mỗi hiệp, bản thân +5% sát thương trong trận.`);
      } else if (aTech === "thien_loi") {
        const thunderDmg = Math.floor(dStats.hp * 0.30);
        hpD = Math.max(0, hpD - thunderDmg);
        totalDmgA += thunderDmg;
        lifeRedD = Math.min(100, lifeRedD + 20);
        turnLines.push(`⚡ [THIÊN LÔI GIÁNG] ${attackerName} giáng thiên lôi đánh trúng ${defenderName}: ${formatBig(thunderDmg)} ST (30% máu tối đa)! Giảm 20% hiệu quả hút máu của ${defenderName} trong trận.`);
      }
    }
    if (hpD > 0) {
      let hitA = true;
      const dodgeCheckD = dodgeD * (1 + dodgeBoostD / 100) * (1 - dodgeRedD / 100);
      if (Math.random() * 100 < dodgeCheckD) {
        hitA = false;
        turnLines.push(`💨 ${defenderName} né đòn của ${attackerName}!`);
      }
      if (hitA) {
        const effDefD = Math.max(0, dStats.def * (1 - armorPenA / 100));
        const dmgRaw = Math.max(1, aStats.atk * (0.85 + Math.random() * 0.30)) * aDmgMult;
        const isCrit = Math.random() * 100 < Math.max(0, aStats.crit - critResD);
        const truePct = Math.max(0, trueDmgA) / 100;
        const truePart = Math.floor(dmgRaw * truePct);
        const normalPart = Math.max(0, Math.floor(dmgRaw * (1 - truePct) - effDefD * 0.25));
        let finalDmg = Math.max(1, truePart + normalPart);
        if (isCrit) finalDmg = Math.floor(finalDmg * (2 + critDmgA / 100));
        finalDmg = Math.max(0, Math.floor(finalDmg * (1 - dmgRedD / 100)));
        if (dStats.maxDmgPct > 0) {
          finalDmg = Math.min(finalDmg, Math.floor(dStats.hp * dStats.maxDmgPct / 100));
        }
        hpD = Math.max(0, hpD - finalDmg);
        totalDmgA += finalDmg;
        const reflectPct = dStats.reflect || 0;
        if (reflectPct > 0) {
          const reflectDmg = Math.floor(finalDmg * reflectPct / 100);
          hpA = Math.max(0, hpA - reflectDmg);
          totalDmgD += reflectDmg;
          turnLines.push(`🛡️ [Phản Đòn] ${defenderName} phản lại ${formatBig(reflectDmg)} HP`);
        }
        const leech = Math.floor(finalDmg * aStats.lifesteal * (1 - healRedA / 100) * (1 - lifeRedA / 100) / 100);
        hpA = Math.min(aStats.hp, hpA + leech);
        const leechNote = leech > 0 ? ` (Hút máu: +${formatBig(leech)} HP)` : "";
        turnLines.push(isCrit
          ? `⚡ [CHÍ MẠNG] ${attackerName} -> ${defenderName}: ${formatBig(finalDmg)} ⚡${leechNote}`
          : `⚔️ ${attackerName} -> ${defenderName}: ${formatBig(finalDmg)}${leechNote}`);
      }
    }
    dodgeBoostD = 0;
    if (hpD <= 0 && aKillLine) turnLines.push(aKillLine);
    if (hpD <= 0) {
      const atkTitle = (attacker === challengerId ? challengerPlayer : p).equippedTitle;
      if (atkTitle === "hoan_vu_chi_cao") {
        turnLines.push(`🌌 [HOÀN VŨ CHÍ CAO] ${attackerName}: "Pháp tắc dòng thời không nhấn chìm ngươi mãi mãi chìm vào vô cực!"`);
      }
      const rv = attemptRevive(false, defenderName, turnLines);
      if (rv != null) hpD = rv;
    }
    if (hpA <= 0 && dKillLine) turnLines.push(dKillLine);
    if (hpA <= 0) {
      const defTitle = (defender === challengerId ? challengerPlayer : p).equippedTitle;
      if (defTitle === "hoan_vu_chi_cao") {
        turnLines.push(`🌌 [HOÀN VŨ CHÍ CAO] ${defenderName}: "Pháp tắc dòng thời không nhấn chìm ngươi mãi mãi chìm vào vô cực!"`);
      }
    }
    if (hpA <= 0) {
      const rv = attemptRevive(true, attackerName, turnLines);
      if (rv != null) hpA = rv;
    }
    if (hpD <= 0 || hpA <= 0) {
      const roundBlock = `--- Hiệp ${turn} ---\n${turnLines.join("\n")}\n\n`;
      roundLines.push(roundBlock);
      used += roundBlock.length;
      break;
    }

    // ── Tấn công D → A ──
    if (!dSkillUsed && dTech) {
      dSkillUsed = true;
      if (dTech === "phong_thuat") {
        const furyDmg = Math.floor(dStats.base.atk * 0.5);
        hpA = Math.max(0, hpA - furyDmg);
        totalDmgD += furyDmg;
        dodgeRedA = Math.min(100, dodgeRedA + 30);
        dodgeBoostD = 50;
        turnLines.push(`🌪️ [PHONG CUỒNG NỘ] ${defenderName} bùng nổ phong khí công kích ${attackerName}: ${formatBig(furyDmg)} ST (không thể crit)! Giảm 30% hiệu quả né của ${attackerName}, bản thân +50% né trong lượt tấn công tới của địch.`);
      } else if (dTech === "hoa_thuat") {
        healRedA = Math.min(100, healRedA + 10);
        burnOnA = true;
        turnLines.push(`🔥 [HỎA DIỆT THẾ] ${defenderName} phóng hỏa diệt thế! Giảm 10% hiệu quả hồi máu của ${attackerName}, thiêu đốt ${attackerName} 1% máu tối đa mỗi hiệp, bản thân +5% sát thương trong trận.`);
      } else if (dTech === "thien_loi") {
        const thunderDmg = Math.floor(aStats.hp * 0.30);
        hpA = Math.max(0, hpA - thunderDmg);
        totalDmgD += thunderDmg;
        lifeRedA = Math.min(100, lifeRedA + 20);
        turnLines.push(`⚡ [THIÊN LÔI GIÁNG] ${defenderName} giáng thiên lôi đánh trúng ${attackerName}: ${formatBig(thunderDmg)} ST (30% máu tối đa)! Giảm 20% hiệu quả hút máu của ${attackerName} trong trận.`);
      }
    }
    if (hpA > 0) {
      let hitD = true;
      const dodgeCheckA = dodgeA * (1 + dodgeBoostA / 100) * (1 - dodgeRedA / 100);
      if (Math.random() * 100 < dodgeCheckA) {
        hitD = false;
        turnLines.push(`💨 ${attackerName} né đòn của ${defenderName}!`);
      }
      if (hitD) {
        const effDefA = Math.max(0, aStats.def * (1 - armorPenD / 100));
        const dmgRaw2 = Math.max(1, dStats.atk * (0.85 + Math.random() * 0.30)) * dDmgMult;
        const isCrit2 = Math.random() * 100 < Math.max(0, dStats.crit - critResA);
        const truePct2 = Math.max(0, trueDmgD) / 100;
        const truePart2 = Math.floor(dmgRaw2 * truePct2);
        const normalPart2 = Math.max(0, Math.floor(dmgRaw2 * (1 - truePct2) - effDefA * 0.25));
        let finalDmg2 = Math.max(1, truePart2 + normalPart2);
        if (isCrit2) finalDmg2 = Math.floor(finalDmg2 * (2 + critDmgD / 100));
        finalDmg2 = Math.max(0, Math.floor(finalDmg2 * (1 - dmgRedA / 100)));
        if (aStats.maxDmgPct > 0) {
          finalDmg2 = Math.min(finalDmg2, Math.floor(aStats.hp * aStats.maxDmgPct / 100));
        }
        hpA = Math.max(0, hpA - finalDmg2);
        totalDmgD += finalDmg2;
        const reflectPct2 = aStats.reflect || 0;
        if (reflectPct2 > 0) {
          const reflectDmg2 = Math.floor(finalDmg2 * reflectPct2 / 100);
          hpD = Math.max(0, hpD - reflectDmg2);
          totalDmgA += reflectDmg2;
          turnLines.push(`🛡️ [Phản Đòn] ${attackerName} phản lại ${formatBig(reflectDmg2)} HP`);
        }
        const leech2 = Math.floor(finalDmg2 * dStats.lifesteal * (1 - healRedD / 100) * (1 - lifeRedD / 100) / 100);
        hpD = Math.min(dStats.hp, hpD + leech2);
        const leechNote2 = leech2 > 0 ? ` (Hút máu: +${formatBig(leech2)} HP)` : "";
        turnLines.push(isCrit2
          ? `⚡ [CHÍ MẠNG] ${defenderName} -> ${attackerName}: ${formatBig(finalDmg2)} ⚡${leechNote2}`
          : `⚔️ ${defenderName} -> ${attackerName}: ${formatBig(finalDmg2)}${leechNote2}`);
      }
    }
    dodgeBoostA = 0;
    if (hpA <= 0 && dKillLine) turnLines.push(dKillLine);
    if (hpA <= 0) {
      const rv = attemptRevive(true, attackerName, turnLines);
      if (rv != null) hpA = rv;
    }
    if (hpD <= 0) {
      const rv = attemptRevive(false, defenderName, turnLines);
      if (rv != null) hpD = rv;
    }
    if (hpA <= 0 || hpD <= 0) {
      const roundBlock = `--- Hiệp ${turn} ---\n${turnLines.join("\n")}\n\n`;
      roundLines.push(roundBlock);
      used += roundBlock.length;
      break;
    }
    const roundBlock = `--- Hiệp ${turn} ---\n${turnLines.join("\n")}\n\n`;
    roundLines.push(roundBlock);
    used += roundBlock.length;
  }

  let winnerId, loserId;
  const winByTimeout = hpA > 0 && hpD > 0;
  if (winByTimeout) {
    winnerId = totalDmgA >= totalDmgD ? attacker : defender;
    loserId = winnerId === attacker ? defender : attacker;
  } else {
    winnerId = hpA > 0 ? attacker : defender;
    loserId = hpA > 0 ? defender : attacker;
  }

  const winnerPlayer = winnerId === challengerId ? challengerPlayer : p;
  winnerPlayer.spiritStones = (winnerPlayer.spiritStones || 0) + PK_REWARD_WINNER;
  winnerPlayer.pkPoints = (winnerPlayer.pkPoints || 0) + PK_REWARD_POINTS;
  savePlayer(winnerId);

  const loserPlayer = loserId === challengerId ? challengerPlayer : p;
  const loserMaxHp = loserId === challengerId ? cStats.hp : tStats.hp;
  const loserRemainingHp = loserId === attacker ? hpA : hpD;
  loserPlayer.currentHp = Math.min(loserMaxHp, Math.max(0, Math.floor(loserRemainingHp)));

  const loserTalent = TALENTS[loserPlayer.talent] || TALENTS.pham;
  const loserLinhCan = LINH_CAN.find(l => l.id === loserPlayer.linhCan) || LINH_CAN[0];
  const loserStats = calcStats(loserPlayer);
  const expGain = Math.floor(50 * (1 + (loserPlayer.ngoTinh || 0) / 100) * loserTalent.multiplier * loserLinhCan.expMult * (1 + (loserStats.expBonus || 0) / 100));
  loserPlayer.exp = (loserPlayer.exp || 0) + expGain;
  savePlayer(loserId);

  const titleUpdates = checkTop3Title(loadData());
  if (titleUpdates.length > 0) saveData();

  const winnerName = winnerId === challengerId ? challengerName : targetName;
  const loserName = loserId === challengerId ? challengerName : targetName;
  const reason = winByTimeout
    ? `Hết giờ, so sánh sát thương tổng (${formatBig(totalDmgA)} vs ${formatBig(totalDmgD)})!`
    : `Đánh bại đối thủ hoàn toàn (đối thủ cạn kiệt sinh lực)!`;

  const msg = `${headerText}${ptIntro}${roundLines.join("")}
📜 [KẾT QUẢ SAU ${turn} HIỆP]
👊 ${attackerName}: Còn ${formatBig(hpA)} HP | Tổng sát thương: ${formatBig(totalDmgA)}
🛡️ ${defenderName}: Còn ${formatBig(hpD)} HP | Tổng sát thương: ${formatBig(totalDmgD)}

🏆 ${winnerName} CHIẾN THẮNG!
ℹ️ Lý do: ${reason}
✨ CẢM NGỘ: ${loserName} nhận ${formatNumber(expGain)} EXP!
🏅 ${winnerName} nhận +${PK_REWARD_POINTS} điểm xếp hạng!`;

  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

// ── PHÁP TẮC TU LUYỆN ──────────────────────────────────
function applyPhapTacPkStats(myStats, foeStats, eff) {
  if (!eff) return;
  if (eff.enemySpdRed) foeStats.spd = Math.max(0, Math.floor(foeStats.spd * (1 - eff.enemySpdRed / 100)));
  if (eff.enemyDodgeRed) foeStats.dodge = Math.max(0, Math.round(foeStats.dodge * (1 - eff.enemyDodgeRed / 100) * 10) / 10);
  if (eff.selfDodge) myStats.dodge = myStats.dodge + eff.selfDodge;
  if (eff.dmgBoost) myStats.atk = Math.floor(myStats.atk * (1 + eff.dmgBoost / 100));
  if (eff.crit) myStats.crit = myStats.crit + eff.crit;
  if (eff.critDmg) myStats.critDmg = (myStats.critDmg || 0) + eff.critDmg;
}

async function handlePhapTac(api, message, p, senderId, sub2, sub3) {
  const prefix = getGlobalPrefix();

  if (sub2 === "nangcap" || sub2 === "up" || sub2 === "nang") {
    if (!p.phapTacPath || !PHAPTAC_PATHS[p.phapTacPath]) {
      return api.sendMessage({ msg: `❌ Bạn chưa chọn đường pháp tắc! Dùng ${prefix}tl phaptac để xem chi tiết.`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    const cfg = PHAPTAC_PATHS[p.phapTacPath];
    const lv = p.phapTacLevel || 1;
    if (lv >= PHAPTAC_MAX_LEVEL) {
      return api.sendMessage({
        msg: `🌟 ${cfg.emoji} ${cfg.name} đã đạt cấp tối đa Lv.${PHAPTAC_MAX_LEVEL}!`,
        quote: message, ttl: 15000,
      }, message.threadId, message.type);
    }
    const reqRealm = getPhapTacRealmRequired(lv);
    if (p.majorRealm < reqRealm) {
      const reqName = getRealmDisplay(reqRealm, 1, p.daotam);
      return api.sendMessage({
        msg: `🔒 CẢNH GIỚI CHƯA ĐỦ!
━━━━━━━━━━━━━━━━
${cfg.emoji} ${cfg.name} Lv.${lv} → Lv.${lv + 1}
🔑 Yêu cầu: đạt ${reqName} (cảnh ${reqRealm})
📍 Cảnh giới của bạn: ${getRealmDisplayFull(p)}`,
        quote: message, ttl: 15000,
      }, message.threadId, message.type);
    }
    const cost = getPhapTacUpgradeCost(lv);
    if ((p.spiritStones || 0) < cost) {
      return api.sendMessage({
        msg: `❌ Không đủ Linh Thạch! Nâng ${cfg.emoji} ${cfg.name} Lv.${lv} → Lv.${lv + 1} cần **${formatNumber(cost)} LT**, bạn có ${formatNumber(p.spiritStones || 0)} LT.`,
        quote: message, ttl: 15000,
      }, message.threadId, message.type);
    }
    p.spiritStones -= cost;
    p.phapTacLevel = lv + 1;
    savePlayer(senderId);
    const eff = getPhapTacEffects(p.phapTacPath, p.phapTacLevel);
    const nextLine = p.phapTacLevel >= PHAPTAC_MAX_LEVEL
      ? "🌟 Đã đạt cấp TỐI ĐA!"
      : `💎 Nâng tiếp: ${formatNumber(getPhapTacUpgradeCost(p.phapTacLevel))} LT`;
    return api.sendMessage({
      msg: `🌀 NÂNG CẤP PHÁP TẮC THÀNH CÔNG!
━━━━━━━━━━━━━━━━
${cfg.emoji} ${cfg.name}: Lv.${lv} → **Lv.${p.phapTacLevel}**
💎 Chi phí: -${formatNumber(cost)} LT (còn ${formatNumber(p.spiritStones)} LT)
⚡ Hiệu ứng mới: ${describePhapTacEff(eff)}
━━━━━━━━━━━━━━━━
${nextLine}`,
      quote: message, ttl: 30000,
    }, message.threadId, message.type);
  }

  if (sub2 === "tuluyen" || sub2 === "tu" || sub2 === "hoc") {
    const key = (sub3 || "").toLowerCase().trim();
    const cfg = PHAPTAC_PATHS[key];
    if (!cfg) {
      const list = Object.values(PHAPTAC_PATHS).map(x => x.key).join(" | ");
      return api.sendMessage({ msg: `❌ Cú pháp: ${prefix}tl phaptac tuluyen <${list}>`, quote: message, ttl: 15000 }, message.threadId, message.type);
    }
    if (p.phapTacPath) {
      const cur = PHAPTAC_PATHS[p.phapTacPath];
      return api.sendMessage({
        msg: `❌ Bạn đã tu luyện ${cur.emoji} ${cur.name} rồi! Đạo tâm pháp tắc không thể đổi — mỗi người chỉ chọn 1 đường duy nhất.`,
        quote: message, ttl: 15000,
      }, message.threadId, message.type);
    }
    if (p.majorRealm < PHAPTAC_REQUIRED_REALM) {
      const reqName = getRealmDisplay(PHAPTAC_REQUIRED_REALM, 1, p.daotam);
      return api.sendMessage({
        msg: `🔒 PHÁP TẮC CHƯA MỞ!
━━━━━━━━━━━━━━━━
📍 Cảnh giới của bạn: ${getRealmDisplayFull(p)}
🔑 Yêu cầu: đạt ${reqName} (cảnh 30) mới cảm ngộ được luật tắc thiên địa.`,
        quote: message, ttl: 15000,
      }, message.threadId, message.type);
    }

    p.phapTacPath = key;
    p.phapTacLevel = 1;
    savePlayer(senderId);

    const eff = getPhapTacEffects(key, 1);
    const effLine = describePhapTacEff(eff) || "Chưa có hiệu ứng (chân ý chưa khai mở).";
    const scopeLine = cfg.scope === "pk+tower" ? "PK + Thiên Tầng Tháp" : cfg.scope === "pk" ? "Chỉ trận đấu (PK)" : "Chưa áp dụng";
    const msg = `🌀 NGỘ ĐƯỢC PHÁP TẮC!
━━━━━━━━━━━━━━━━
${cfg.emoji} ${cfg.name} — Lv.1
📖 ${cfg.desc}
🎯 Phạm vi: ${scopeLine}
⚡ Hiệu ứng: ${effLine}
━━━━━━━━━━━━━━━━
💡 Nâng cấp bằng Linh Thạch: ${prefix}tl phaptac nangcap (${formatNumber(getPhapTacUpgradeCost(1))} LT + cảnh ${getPhapTacRealmRequired(1)} trở lên → Lv.2). Mỗi cấp cần thêm 5 cảnh giới.
💡 ${prefix}tl phaptac để xem trạng thái.`;
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
  }

  const pathsText = Object.values(PHAPTAC_PATHS).map(cfg => {
    const eff1 = describePhapTacEff(getPhapTacEffects(cfg.key, 1)) || "Chưa có hiệu ứng (chưa khai mở)";
    const growth = Object.entries(cfg.growth).filter(([, v]) => v > 0).length > 0
      ? `\n   📈 Mỗi cấp: ${Object.entries(cfg.growth).map(([k, v]) => `+${v}%`).join(", ")}`
      : "";
    const scopeLine = cfg.scope === "pk+tower" ? "PK + Tháp" : cfg.scope === "pk" ? "Chỉ PK" : "Chưa mở";
    return `${cfg.emoji} ${cfg.name} [${scopeLine}]\n   ⚡ Lv.1: ${eff1}${growth}\n   📖 ${cfg.desc}`;
  }).join("\n\n");

  let statusBlock;
  if (p.phapTacPath && PHAPTAC_PATHS[p.phapTacPath]) {
    const cfg = PHAPTAC_PATHS[p.phapTacPath];
    const lv = p.phapTacLevel || 1;
    const maxed = lv >= PHAPTAC_MAX_LEVEL;
    const eff = getPhapTacEffects(p.phapTacPath, lv);
    const upgradeLine = maxed
      ? "🌟 Đã đạt cấp TỐI ĐA"
      : `💎 Nâng cấp: ${formatNumber(getPhapTacUpgradeCost(lv))} LT → Lv.${lv + 1} (🔑 cần cảnh ${getPhapTacRealmRequired(lv)} · ${getRealmDisplay(getPhapTacRealmRequired(lv), 1, p.daotam)})`;
    statusBlock = `━━━━━━━━━━━━━━━━
🌟 Đường đã chọn: ${cfg.emoji} ${cfg.name} — Lv.${lv}/${PHAPTAC_MAX_LEVEL}
${upgradeLine}
⚡ Hiệu ứng hiện tại: ${describePhapTacEff(eff) || "Chưa có hiệu ứng (chân ý chưa khai mở)"}`;
  } else {
    statusBlock = `━━━━━━━━━━━━━━━━
❔ Bạn chưa chọn đường pháp tắc.
🔑 Yêu cầu: cảnh giới 30 (${getRealmDisplay(PHAPTAC_REQUIRED_REALM, 1, p.daotam)}) trở lên.
📍 Cảnh giới của bạn: ${getRealmDisplayFull(p)}`;
  }

  const msg = `🌀 PHÁP TẮC TU LUYỆN
━━━━━━━━━━━━━━━━
${pathsText}
${statusBlock}
━━━━━━━━━━━━━━━━
💡 ${prefix}tl phaptac tuluyen <thoigian|khonggian|thoikhong> — Chọn đường (CHỈ 1 LẦN duy nhất!)
💡 ${prefix}tl phaptac nangcap — Nâng cấp bằng Linh Thạch`;
  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleBank(api, message, p, senderId, sub2, sub3) {
  const prefix = getGlobalPrefix();

  if (p.bankBanned) {
    return api.sendMessage({
      msg: `🚫 TÀI KHOẢN BANK CỦA BẠN ĐANG BỊ PHÔNG TỎA!
━━━━━━━━━━━━━━━
Bạn không thể nhận hoặc chuyển Linh Thạch qua bank.
📞 Liên hệ quản trị viên để được mở khóa.`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const mentioned = message.data.mentions?.[0]?.uid || sub3;

  if (!sub2 || !mentioned) {
    return api.sendMessage({ msg: `❌ Cú pháp: ${prefix}tl bank <số> @người_nhận\nVD: ${prefix}tl bank 500000 @user | ${prefix}tl bank 500k @user | ${prefix}tl bank 1b @user`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const targetId = mentioned.toString();
  if (targetId === senderId) {
    return api.sendMessage({ msg: "❌ Không thể chuyển cho bản thân!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (getPlayer(targetId).bankBanned) {
    return api.sendMessage({
      msg: `🚫 Tài khoản bank của ${getTargetName(message, targetId, senderId)} đang bị phong tỏa, không thể nhận chuyển khoản!`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  let amount = parseAmountStr(sub2.replace(/^\+/, ""));

  if (!amount || amount <= 0 || amount < 100) {
    return api.sendMessage({ msg: "❌ Số LT không hợp lệ! Tối thiểu 100 LT.", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if ((p.spiritStones || 0) < amount) {
    return api.sendMessage({ msg: `❌ Không đủ LT! Có ${formatNumber(p.spiritStones || 0)}, cần ${formatNumber(amount)}.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const taxRate = getTaxRate();
  const tax = Math.floor(amount * taxRate);
  let received = amount - tax;
  const targetPlayer = getPlayer(targetId);

  const targetTitle = targetPlayer.equippedTitle;
  if (targetTitle) {
    const titleObj = TITLES.find(t => t.id === targetTitle);
    if (titleObj && titleObj.ltBonusPct > 0) {
      const bonus = Math.floor(received * titleObj.ltBonusPct / 100);
      received += bonus;
    }
  }

  p.spiritStones = (p.spiritStones || 0) - amount;
  targetPlayer.spiritStones = (targetPlayer.spiritStones || 0) + received;
  savePlayer(senderId);
  savePlayer(targetId);
  logBankTransaction(senderId, targetId, amount, tax, received);

  const msg = `💸 GIAO DỊCH THÀNH CÔNG!
━━━━━━━━━━━━━━━
📤 Chuyển: ${formatNumber(amount)} LT
📥 Nhận: ${formatNumber(received)} LT (thuế ${taxRate * 100}%: ${formatNumber(tax)} LT)${targetTitle === "hoan_vu_chi_cao" ? "\n🌌 +20% LT từ danh hiệu Hoàn Vũ Chí Cao!" : ""}
💎 Số dư: ${formatNumber(p.spiritStones)} LT`;

  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

// ── LÌ XÌ TU TIÊN ──────────────────────────────────────────
const LX_EXPIRE_MS = 24 * 60 * 60 * 1000;
const LX_MAX_WINNERS = 100;
const lxPackets = {};

function generateLxParts(total, count) {
  const parts = [];
  let remaining = total;
  let left = count;
  for (let i = 0; i < count - 1; i++) {
    const avg = (remaining - (left - 1)) / left;
    let amt = 1 + Math.floor(Math.random() * Math.max(1, Math.floor(avg * 2)));
    if (amt > remaining - (left - 1)) amt = remaining - (left - 1);
    parts.push(amt);
    remaining -= amt;
    left--;
  }
  parts.push(Math.max(1, remaining));
  for (let i = parts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [parts[i], parts[j]] = [parts[j], parts[i]];
  }
  return parts;
}

async function handleLixi(api, message, p, senderId, sub2, sub3) {
  const prefix = getGlobalPrefix();

  if (message.type !== MessageType.GroupMessage) {
    return api.sendMessage({
      msg: "❌ Lì xì chỉ có hiệu lực trong nhóm!",
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const threadId = String(message.threadId);

  if (!sub2) {
    const packet = lxPackets[threadId];
    if (!packet || Date.now() > packet.expireAt) {
      delete lxPackets[threadId];
      return api.sendMessage({
        msg: "Có ai lì xì đâu mà nhận🥺",
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }

    if (packet.claimed[senderId]) {
      return api.sendMessage({
        msg: `⚠️ Bạn đã hớt lì xì này rồi! Nhận được 💎 ${formatNumber(packet.claimed[senderId])} LT.`,
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }
    if (packet.parts.length === 0) {
      delete lxPackets[threadId];
      return api.sendMessage({
        msg: "😢 Tiếc quá! Lì xì đã hết phần rồi.",
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }

    const amount = packet.parts.pop();
    packet.claimed[senderId] = amount;
    p.spiritStones = (p.spiritStones || 0) + amount;
    savePlayer(senderId);

    const remain = packet.parts.length;
    const name = message.data.dName || "Đạo hữu";
    let msg;
    if (remain === 0) {
      delete lxPackets[threadId];
      msg = `🧘 ${name} vừa mở gói lì xì!
━━━━━━━━━━━━━━━
🎉 Nhận được: 💎 ${formatNumber(amount)} LT
📦 Đây là PHẦN CUỐI — lì xì đã hết!
💰 Tổng pool: ${formatNumber(packet.total)} LT | 🎫 ${packet.count}/${packet.count} phần đã được hớt`;
    } else {
      msg = `🧘 ${name} vừa mở gói lì xì!
━━━━━━━━━━━━━━━
🎉 Nhận được: 💎 ${formatNumber(amount)} LT
📦 Còn lại: ${remain}/${packet.count} phần
💰 Gõ ${prefix}tl lx để hớt tiếp!`;
    }
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, threadId, message.type);
  }

  // ── ADMIN PHÁT LÌ XÌ ──
  if (!isSangTheLenh(senderId)) {
    return api.sendMessage({
      msg: "❌ Cần có Sáng Thế Lệnh mới được phát lì xì!",
      quote: message, ttl: 15000,
    }, threadId, message.type);
  }

  const total = parseAmountStr(sub2.replace(/^\+/, ""));
  const count = parseInt(sub3, 10);

  if (!total || total <= 0 || !count || count < 1 || count > LX_MAX_WINNERS || total < count) {
    return api.sendMessage({
      msg: `❌ Cú pháp: ${prefix}tl lx <số LT> <số người nhận>
VD: ${prefix}tl lx 500k 10 | ${prefix}tl lx 2000000 20
📌 Số người nhận: 1-${LX_MAX_WINNERS}, mỗi phần tối thiểu 1 LT`,
      quote: message, ttl: 15000,
    }, threadId, message.type);
  }

  if ((p.spiritStones || 0) < total) {
    return api.sendMessage({
      msg: `❌ Không đủ Linh Thạch để phát lì xì! Có ${formatNumber(p.spiritStones || 0)}, cần ${formatNumber(total)} LT.`,
      quote: message, ttl: 15000,
    }, threadId, message.type);
  }

  p.spiritStones = (p.spiritStones || 0) - total;
  savePlayer(senderId);

  lxPackets[threadId] = {
    total,
    count,
    parts: generateLxParts(total, count),
    claimed: {},
    createdBy: String(senderId),
    createdAt: Date.now(),
    expireAt: Date.now() + LX_EXPIRE_MS,
  };

  const adminName = message.data.dName || "Admin";
  const msg = `🧧 LÌ XÌ TU TIÊN XUẤT HIỆN! 🧧
━━━━━━━━━━━━━━━
👑 Đạo hữu ${adminName} phát lì xì cho nhóm này!
💰 Tổng pool: ${formatNumber(total)} LT
🎫 Số phần may mắn: ${count} phần
⏰ Hết hạn sau: 24 giờ
━━━━━━━━━━━━━━━
🍀 Ai nhanh tay thì may mắn lớn hơn!
👉 Gõ NGAY: ${prefix}tl lx để hớt lộc!`;

  return api.sendMessage({ msg, quote: message, ttl: 60000 }, threadId, message.type);
}

// ── THÁNH ĐỊA TƯỢNG ĐÀI — THẤT ĐẠI CHÍ TÔN ──────────────────
const STATUE_DAOS = [
  { key: "chinh", label: "Chính Đạo Chí Tôn", emoji: "⚡" },
  { key: "ma",    label: "Ma Đạo Chí Tôn",    emoji: "⚫" },
  { key: "nho",   label: "Nho Đạo Chí Tôn",   emoji: "🎓" },
  { key: "yeu",   label: "Yêu Đạo Chí Tôn",   emoji: "🐾" },
  { key: "lo",    label: "Lọ Đạo Chí Tôn",    emoji: "🫙" },
  { key: "quy",   label: "Quỷ Đạo Chí Tôn",   emoji: "👻" },
  { key: "phat",  label: "Phật Đạo Chí Tôn",  emoji: "🪷" },
];
const STATUE_MIN_REALM = 60;
const VIENG_FEE = 1000000;

function getDaoChampion(daoKey) {
  const data = loadData();
  let best = null;
  for (const [key, player] of Object.entries(data.players || {})) {
    if (!player || player.banned) continue;
    if ((player.daotam || "chinh") !== daoKey) continue;
    if ((player.majorRealm || 0) < STATUE_MIN_REALM) continue;
    if (isHiddenFromRanking(player)) continue;
    if (!best) { best = { key, player }; continue; }
    const ra = player.majorRealm * 10 + (player.minorRealm || 1);
    const rb = best.player.majorRealm * 10 + (best.player.minorRealm || 1);
    if (ra !== rb) { if (ra > rb) best = { key, player }; continue; }
    if ((player.exp || 0) !== (best.player.exp || 0)) { if ((player.exp || 0) > (best.player.exp || 0)) best = { key, player }; continue; }
    try {
      if (calcStats(player).battlePower > calcStats(best.player).battlePower) best = { key, player };
    } catch {}
  }
  return best;
}

function getMsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(60000, midnight.getTime() - now.getTime());
}

async function handleTuongDai(api, message) {
  const prefix = getGlobalPrefix();
  const data = loadData();
  const champs = STATUE_DAOS.map(d => ({ dao: d, champ: getDaoChampion(d.key) }));

  const uids = [...new Set(champs.filter(c => c.champ).map(c => resolveZaloUidFromKey(data, c.champ.key)).filter(Boolean))];
  const nameMap = {};
  try {
    if (uids.length > 0) {
      const info = await api.getUserInfo(uids);
      for (const uid of uids) {
        const profile = info?.changed_profiles?.[uid] || info?.unchanged_profiles?.[uid];
        if (profile) nameMap[uid] = profile.zaloName || profile.name || null;
      }
    }
  } catch {}

  const lines = champs.map((c, i) => {
    if (!c.champ) return `[${i + 1}] ${c.dao.emoji} ${c.dao.label}: Chưa có ai xưng bá`;
    const uid = resolveZaloUidFromKey(data, c.champ.key);
    const name = (uid && nameMap[uid]) || `Tu Sĩ ${String(c.champ.key).slice(-4)}`;
    const tuvi = getRealmDisplay(c.champ.player.majorRealm, c.champ.player.minorRealm, c.dao.key);
    return `[${i + 1}] ${c.dao.emoji} ${c.dao.label}: ${name}\n     Tu vi: ${tuvi}`;
  });

  const msg = `🗿 THÁNH ĐỊA TƯỢNG ĐÀI - THẤT ĐẠI CHÍ TÔN 🗿
${lines.join("\n")}
(Thắp nhang viếng bái: ${prefix}tl vieng [1-7]. Phí: 1 Triệu LT. Tôn sư nhận tiền cúng dường)`;
  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleVieng(api, message, p, senderId, sub2) {
  const prefix = getGlobalPrefix();
  const idx = parseInt(sub2, 10);
  if (!Number.isFinite(idx) || idx < 1 || idx > STATUE_DAOS.length) {
    return api.sendMessage({ msg: `❌ Cú pháp: ${prefix}tl vieng [1-7]\n💡 Xem tượng đài: ${prefix}tl tuongdai`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  const dao = STATUE_DAOS[idx - 1];
  const champ = getDaoChampion(dao.key);
  if (!champ) {
    return api.sendMessage({ msg: `${dao.emoji} ${dao.label}: Chưa có ai xưng bá, không thể viếng!\n💡 Cần có người đạt tối thiểu cảnh ${STATUE_MIN_REALM} của đạo này.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (p.lastViengDate === getDateKey()) {
    return api.sendMessage({ msg: `🙏 Hôm nay bạn đã viếng rồi!\n💡 Mỗi ngày chỉ được viếng 1 lần. Quay lại sau 00:00 nhé.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if ((p.spiritStones || 0) < VIENG_FEE) {
    return api.sendMessage({ msg: `❌ Không đủ Linh Thạch! Viếng tượng cần ${formatNumber(VIENG_FEE)} LT, bạn có ${formatNumber(p.spiritStones || 0)} LT.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const data = loadData();
  const champUid = resolveZaloUidFromKey(data, champ.key);
  let champName = `Tu Sĩ ${String(champ.key).slice(-4)}`;
  try {
    if (champUid) {
      const info = await api.getUserInfo([champUid]);
      const profile = info?.changed_profiles?.[champUid] || info?.unchanged_profiles?.[champUid];
      if (profile) champName = profile.zaloName || profile.name || champName;
    }
  } catch {}

  p.spiritStones -= VIENG_FEE;
  const myKey = resolvePlayerKey(senderId);
  let selfVieng = (myKey === champ.key);
  if (!selfVieng && data.players[champ.key]) {
    data.players[champ.key].spiritStones = (data.players[champ.key].spiritStones || 0) + VIENG_FEE;
  }

  const durationMs = getMsUntilMidnight();
  if (!p.buffs) p.buffs = [];
  p.buffs = p.buffs.filter(b => b.src !== "vieng");
  const roll = Math.floor(Math.random() * 3);
  let buffLine = "";
  if (roll === 0) {
    applyBuffNoStack(p, "lifesteal_pct", 10, durationMs, `Viếng ${dao.label}: +10% hút máu (trong ngày)`, "vieng");
    buffLine = "🩸 +10% hút máu (trong ngày)";
  } else if (roll === 1) {
    applyBuffNoStack(p, "hp_max_boost_pct", 10, durationMs, `Viếng ${dao.label}: +10% HP (trong ngày)`, "vieng");
    buffLine = "❤️ +10% HP (trong ngày)";
  } else {
    applyBuffNoStack(p, "atk_pct", 10, durationMs, `Viếng ${dao.label}: +10% ATK (trong ngày)`, "vieng");
    buffLine = "⚔️ +10% ATK (trong ngày)";
  }
  p.lastViengDate = getDateKey();
  saveData();

  const msg = `🙏 VIẾNG ${dao.emoji} ${dao.label.toUpperCase()}!
━━━━━━━━━━━━━━━━
🪔 Đạo hữu công đức ${formatNumber(VIENG_FEE)} LT cho ${champName}${selfVieng ? " (chính là bạn, tiền hương hỏa tán vào hư không)" : ""}!
🎲 Cảm ngộ: ${buffLine}
⏰ Hiệu lực đến 24:00 hôm nay
━━━━━━━━━━━━━━━━
💡 Mỗi lần viếng roll ngẫu nhiên 1 trong 3: hút máu / HP / ATK`;
  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleTubao(api, message, p, senderId) {
  if (p.majorRealm === 1 && p.minorRealm === 1) {
    return api.sendMessage({ msg: "⚠️ Bạn đang ở cảnh giới khởi đầu rồi!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const oldRealm = getRealmDisplay(p.majorRealm, p.minorRealm, p.daotam);
  const oldDao = p.daotam;
  const newRealm = getRealmDisplay(1, 1, oldDao);

  p.majorRealm = 1;
  p.minorRealm = 1;
  p.exp = 0;
  p.breakthroughBonus = 0;
  p.inSecretRealm = false;
  p.secretRealmEnteredAt = null;
  savePlayer(senderId);

  const msg = `💥 TỰ BẠO!
━━━━━━━━━━━━━━━━
🔻 Cũ: ${oldRealm}
📍 Mới: ${newRealm}
━━━━━━━━━━━━━━━━
🎭 Đạo tâm: ${getDaoDisplay(oldDao)}
🧬 Thiên phú: ${p.talent}
💡 Linh Thạch và vũ khí được giữ lại.`;

  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleDaily(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  const today = getDateKey();
  const now = Date.now();

  const lastClaim = p.lastDailyClaim || "";
  let streak = p.dailyStreak || 0;

  if (lastClaim === today) {
    return api.sendMessage({
      msg: `⏰ BẠN ĐÃ NHẬN THƯỞNG HÔM NAY!
━━━━━━━━━━━━━━━━
💎 Hãy quay lại sau 00:00 để nhận thưởng mới.
🔥 Chuỗi ngày hiện tại: ${streak} ngày`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const yesterday = getDateKey(new Date(now - 24 * 60 * 60 * 1000));
  streak = lastClaim === yesterday ? streak + 1 : 1;

  const baseLT = 2000 + (p.majorRealm || 1) * 500;
  const streakBonus = Math.min((streak - 1) * 500, 5000);
  const primeLv = getPrimeLevel(p.donated || 0);
  const primeBonus = Math.floor(baseLT * primeLv * 0.1);
  const totalLT = baseLT + streakBonus + primeBonus;

  p.spiritStones = (p.spiritStones || 0) + totalLT;
  p.lastDailyClaim = today;
  p.dailyStreak = streak;
  savePlayer(senderId);

  const msg = `🎁 THƯỞNG HÀNG NGÀY!
━━━━━━━━━━━━━━━━
🔥 Chuỗi: ${streak} ngày${streak > 1 ? ` (+${formatNumber(streakBonus)} LT)` : ""}
💰 Cơ bản: ${formatNumber(baseLT)} LT${primeLv > 0 ? `\n👑 Prime ${primeLv}: +${formatNumber(primeBonus)} LT` : ""}
━━━━━━━━━━━━━━━━
💎 Nhận: +${formatNumber(totalLT)} Linh Thạch
💰 Tổng LT: ${formatNumber(p.spiritStones)} LT
━━━━━━━━━━━━━━━━
💡 Nhận liên tiếp mỗi ngày để tăng thưởng chuỗi!
💡 Cách kiếm LT khác: ${prefix}tl bc di (bí cảnh) | ${prefix}tl pk @user (thắng PK)`;
  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

async function handlePhiThang(api, message, p, senderId) {
  const maxMajor = getMaxMajorRealm(p.daotam);
  const maxRealmDisplay = getRealmDisplay(maxMajor, MAX_MINOR_REALM, p.daotam);
  if (p.majorRealm !== maxMajor || p.minorRealm !== MAX_MINOR_REALM) {
    return api.sendMessage({
      msg: `❌ Phi thăng chỉ dành cho đạo hữu đạt cảnh giới tối cao (${maxRealmDisplay})!
📍 Hiện tại: ${getRealmDisplay(p.majorRealm, p.minorRealm, p.daotam)}`,
      quote: message, ttl: 15000,
    }, message.threadId, message.type);
  }

  const count = (p.phithangCount || 0) + 1;
  const oldRealm = getRealmDisplay(p.majorRealm, p.minorRealm, p.daotam);
  const dmgRed = Math.min(count * 10, 90);

  p.phithangCount = count;
  p.majorRealm = 1;
  p.minorRealm = 1;
  p.exp = 0;
  p.breakthroughBonus = 0;
  p.inSecretRealm = false;
  p.secretRealmEnteredAt = null;
  p.currentSecretRealmId = null;
  const newMax = 50 + 1 * 20;
  p.maxStamina = newMax + (p.maxStaminaBonus || 0);
  p.stamina = Math.min(p.stamina || 0, p.maxStamina);
  savePlayer(senderId);

  const msg = `🌌 PHI THĂNG THÀNH CÔNG!
━━━━━━━━━━━━━━━━
📍 ${oldRealm}
➡️ ${getRealmDisplay(1, 1, p.daotam)}
━━━━━━━━━━━━━━━━
✨ Vĩnh viễn +20% toàn chỉ số cơ bản (tổng ×${count})
🛡️ Giảm thương +10% (hiện tại: ${dmgRed}%)
━━━━━━━━━━━━━━━━
💡 Phi thăng lần thứ ${count}! Tu luyện lại từ đầu để mạnh hơn.`;

  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

function getBossScaleReduction(p) {
  let reduction = 0;
  const weapon = p.equippedWeapon ? WEAPONS.find(w => w.id === p.equippedWeapon) : null;
  if (weapon && weapon.bossScale) {
    // Vũ khí có kháng Boss Scaling: dùng riêng, không cộng với giáp
    reduction = weapon.bossScale;
  } else if (p.equippedArmor) {
    const armor = ARMORS.find(a => a.id === p.equippedArmor);
    if (armor && armor.bossScale) reduction += armor.bossScale;
  }
  if (p.equippedPhapBao) {
    const pb = PHAP_BAO.find(pb => pb.id === p.equippedPhapBao);
    if (pb && pb.bossScale) reduction += pb.bossScale;
  }
  reduction += getBuffValue(p, "boss_scale_reduction_pct") || 0;
  return Math.min(reduction, 95);
}

function getTowerRewards(floor) {
  let lt;
  if (floor > 100 && floor % 10 === 0) {
    lt = 100000000;
  } else {
    lt = 2000000 + floor * 50000;
  }
  return { lt };
}

function getTowerBoss(floor, player) {
  const stats = calcStats(player);
  const reduction = getBossScaleReduction(player);
  const growthPerFloor = 1 + (TOWER_GROWTH - 1) * (1 - reduction / 100);
  const bossMult = Math.pow(growthPerFloor, floor - 1);
  return {
    stats,
    reduction,
    bossMult,
    hp: Math.floor(stats.hp * bossMult * TOWER_BOSS_STAT_MULT),
    atk: Math.floor(stats.atk * bossMult * TOWER_BOSS_STAT_MULT),
    def: Math.floor(stats.def * bossMult * TOWER_BOSS_STAT_MULT),
    spd: stats.spd,
    dodge: TOWER_FIGHT_DODGE,
    crit: stats.crit,
    critDmg: stats.critDmg,
  };
}

async function handleTowerStatus(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  const currentFloor = Math.min(p.towerFloor || 0, TOWER_MAX_FLOOR);
  const nextFloor = currentFloor + 1;
  const reduction = getBossScaleReduction(p);
  const growthPerFloor = 1 + (TOWER_GROWTH - 1) * (1 - reduction / 100);
  const nextBoss = getTowerBoss(nextFloor, p);

  const done = currentFloor >= TOWER_MAX_FLOOR;
  const msg = `🗼 THIÊN TẦNG THÁP
━━━━━━━━━━━━━━━━
📍 Tầng hiện tại: ${done ? `ĐÃ VƯỢT HẾT (${TOWER_MAX_FLOOR}/${TOWER_MAX_FLOOR}) 🏆` : `${currentFloor}/${TOWER_MAX_FLOOR}`}
🎯 Boss kế tiếp: Tầng ${nextFloor}
🛡️ Kháng Boss Scaling: ${reduction}% (tăng trưởng boss: +${((growthPerFloor - 1) * 100).toFixed(1)}%/tầng)
📊 Sức mạnh boss: ${formatBig(nextBoss.hp)} HP | ${formatBig(nextBoss.atk)} ATK
💨 Boss né: ${TOWER_FIGHT_DODGE}%
━━━━━━━━━━━━━━━━
💎 Thưởng vượt tầng:${done ? "" : `
• ${nextFloor < 100 ? `Vài triệu LT` : nextFloor % 10 === 0 ? "TRĂM TRIỆU LT 🎉 (tầng tròn chục)" : "LT tăng dần"} (tháp không cho EXP)`}
━━━━━━━━━━━━━━━━
⚔️ Đánh chi tiết 1 tầng: ${prefix}tl thap challenge
⚡ Leo tự động: ${prefix}tl thap auto (tốn 100–200 thể lực/tầng, tăng theo tầng)
💡 Boss vô hiệu DEF & giảm thương của bạn, không hút máu/phản/ST chuẩn, nhưng né rất cao!
💡 Boss Scaling (giáp THẦN THOẠI, Thất Sát Phù) kìm hãm tốc độ tăng trưởng của boss!
💡 Đan 36 (Thiên Thiên Bảo Hộ) chặn ST ≤15% HP/đòn | Đan 43 (Đan Tâm Đan) nâng ST đòn trúng lên tối thiểu 1.5% HP Boss`;
  await api.sendMessage({ msg, quote: message, ttl: 30000 }, message.threadId, message.type);
}

function rollTowerCurse() {
  const r = Math.random() * 100;
  if (r < 40) return { id: "kho_huyet", name: "Lời Nguyền Khô Huyết", emoji: "🩸", desc: "Cấm mọi hiệu quả hồi máu & hút máu (cả 2 bên)" };
  if (r < 60) return { id: "trong_luc", name: "Lời Nguyền Trọng Lực", emoji: "🪨", desc: "Cấm né tránh (cả 2 bên)" };
  return null;
}

function simulateTowerFight(floor, p) {
  const boss = getTowerBoss(floor, p);
  const pStats = boss.stats;
  // ── Pháp Tắc tu luyện (chỉ Thời Gian có hiệu lực ở Tháp) ──
  const ptEff = getPhapTacEffects(p.phapTacPath, p.phapTacLevel);
  const towerKillLine = ptEff?.enemySpdRed
    ? `⏳ [THỜI GIAN] Bạn: "Sinh mệnh vĩnh hằng — thọ nguyên đặt tới điểm kết thúc!"`
    : null;
  if (ptEff?.enemySpdRed) boss.spd = Math.max(0, Math.floor(boss.spd * (1 - ptEff.enemySpdRed / 100)));
  if (ptEff?.enemyDodgeRed) boss.dodge = Math.max(0, Math.floor(boss.dodge * (1 - ptEff.enemyDodgeRed / 100)));
  const curse = rollTowerCurse();
  const noHeal = curse && curse.id === "kho_huyet";
  const noDodge = curse && curse.id === "trong_luc";

  const dmgCapPct = getBuffValue(p, "tower_dmg_cap_pct") || 0;
  const minDmgPct = getBuffValue(p, "tower_min_dmg_pct") || 0;
  const minDmg = Math.max(0, Math.floor(boss.hp * minDmgPct / 100));

  const tech = p.equippedPhapTac;
  const techInfo = tech ? SPECIAL_ITEMS.find(s => s.id === tech) : null;
  let techUsed = false;
  let bossDodgeRed = 0;
  let playerDodgeBoost = 0;
  let burnOnBoss = false;
  const techDmgMult = tech === "hoa_thuat" ? 1.05 : 1;

  const playerFirst = pStats.spd >= boss.spd;
  const hpPlayer = pStats.hp, hpBoss = boss.hp;
  let hpP = hpPlayer, hpB = hpBoss;
  let totalDmgP = 0, totalDmgB = 0;
  let roundLines = [];
  let turn = 0;
  const MAX_TURNS = TOWER_MAX_TURNS;
  const MSG_BUDGET = 3400;
  const EST_ROUND = 200;
  const FOOTER_EST = 380;
  const headerText = `🗼 THIÊN TẦNG THÁP — TẦNG ${floor}${curse ? ` [${curse.emoji} ${curse.name}]` : ""}
━━━━━━━━━━━━━━━━
🧙 Bạn: ${formatBig(hpP)} HP | ${formatBig(pStats.atk)} ATK | Né ${pStats.dodge}%${techInfo ? `\n${techInfo.emoji} Skill: ${techInfo.name} (kích hoạt lượt đầu)` : ""}
🐉 Boss: ${formatBig(hpB)} HP | ${formatBig(boss.atk)} ATK | Né ${boss.dodge}% (×${formatBig(boss.bossMult)})${curse ? `\n${curse.emoji} ${curse.name}: ${curse.desc}` : ""}${ptEff ? `\n⏳ ${PHAPTAC_PATHS[p.phapTacPath].name} Lv.${p.phapTacLevel}: Boss -${ptEff.enemySpdRed}% SPD / -${ptEff.enemyDodgeRed}% né` : ""}${minDmg > 0 ? `\n🌀 Đan Tâm: Đòn trúng gây tối thiểu ${formatBig(minDmg)} (${minDmgPct}% HP Boss)` : ""}${dmgCapPct > 0 ? `\n🏯 Bảo Hộ: ST nhận tối đa ${dmgCapPct}% HP/đòn` : ""}

`;
  let used = headerText.length;

  while (hpP > 0 && hpB > 0 && turn < MAX_TURNS) {
    if (used + EST_ROUND + FOOTER_EST > MSG_BUDGET) break;
    turn++;
    const turnLines = [];

    if (burnOnBoss) {
      const burnTick = Math.max(1, Math.floor(boss.hp * 0.01));
      hpB = Math.max(0, hpB - burnTick);
      totalDmgP += burnTick;
      turnLines.push(`🔥 [Hỏa Diệt Thế] Boss bị thiêu đốt mất ${formatBig(burnTick)} HP (1% máu tối đa)!`);
      if (hpB <= 0) {
        roundLines.push(`--- Hiệp ${turn} ---\n${turnLines.join("\n")}\n\n`);
        used += 200;
        break;
      }
    }

    // ── Người chơi → Boss ──
    if (playerFirst) {
      if (!techUsed && tech) {
        techUsed = true;
        if (tech === "phong_thuat") {
          const furyDmg = Math.floor(pStats.base.atk * 0.5);
          hpB = Math.max(0, hpB - furyDmg);
          totalDmgP += furyDmg;
          bossDodgeRed = Math.min(100, bossDodgeRed + 30);
          playerDodgeBoost = 50;
          turnLines.push(`🌪️ [PHONG CUỒNG NỘ] Bạn bùng nổ phong khí công kích Boss: ${formatBig(furyDmg)} ST (không thể crit)! Giảm 30% hiệu quả né của Boss, bản thân +50% né trong lượt tấn công tới của Boss.`);
        } else if (tech === "hoa_thuat") {
          burnOnBoss = true;
          turnLines.push(`🔥 [HỎA DIỆT THẾ] Bạn phóng hỏa diệt thế! Thiêu đốt Boss 1% máu tối đa mỗi hiệp, bản thân +5% sát thương trong trận.`);
        } else if (tech === "thien_loi") {
          const thunderDmg = Math.floor(boss.hp * 0.30);
          hpB = Math.max(0, hpB - thunderDmg);
          totalDmgP += thunderDmg;
          turnLines.push(`⚡ [THIÊN LÔI GIÁNG] Bạn giáng thiên lôi đánh trúng Boss: ${formatBig(thunderDmg)} ST (30% máu tối đa)!`);
        }
        if (hpB <= 0) {
          roundLines.push(`--- Hiệp ${turn} ---\n${turnLines.join("\n")}\n\n`);
          used += 200;
          break;
        }
      }
      let hit = true;
      if (!noDodge && Math.random() * 100 < boss.dodge * (1 - bossDodgeRed / 100)) hit = false;
      let finalDmg = 0;
      let wasCrit = false;
      if (hit) {
        const effDef = Math.max(0, boss.def * (1 - pStats.armorPen / 100));
        const dmgRaw = Math.max(1, pStats.atk * (0.85 + Math.random() * 0.30)) * techDmgMult;
        wasCrit = Math.random() * 100 < Math.max(0, pStats.crit);
        const truePct = Math.max(0, pStats.trueDmg) / 100;
        const truePart = Math.floor(dmgRaw * truePct);
        const normalPart = Math.max(0, Math.floor(dmgRaw * (1 - truePct) - effDef * 0.25));
        finalDmg = Math.max(1, truePart + normalPart);
        if (wasCrit) finalDmg = Math.floor(finalDmg * (2 + pStats.critDmg / 100));
        if (minDmg > 0) finalDmg = Math.max(finalDmg, minDmg);
      }
      hpB = Math.max(0, hpB - finalDmg);
      totalDmgP += finalDmg;
      const leech = noHeal ? 0 : Math.floor(finalDmg * pStats.lifesteal / 100);
      hpP = Math.min(hpPlayer, hpP + leech);
      const leechNote = leech > 0 ? ` (Hút máu: +${formatBig(leech)} HP)` : "";
      if (!hit) {
        turnLines.push(`💨 Boss né đòn của bạn!`);
      } else if (wasCrit && minDmg > 0 && finalDmg <= minDmg) {
        turnLines.push(`🌀⚡ [ĐAN TÂM CHÍ MẠNG] Bạn -> Boss: ${formatBig(finalDmg)} ⚡${leechNote}`);
      } else if (minDmg > 0 && finalDmg <= minDmg) {
        turnLines.push(`🌀 [ĐAN TÂM] Bạn -> Boss: ${formatBig(finalDmg)} (ST tối thiểu)${leechNote}`);
      } else if (wasCrit) {
        turnLines.push(`⚡ [CHÍ MẠNG] Bạn -> Boss: ${formatBig(finalDmg)} ⚡${leechNote}`);
      } else {
        turnLines.push(`⚔️ Bạn -> Boss: ${formatBig(finalDmg)}${leechNote}`);
      }
      if (hpB <= 0 && towerKillLine) turnLines.push(towerKillLine);
    } else {
      let hit = true;
      if (!noDodge && Math.random() * 100 < pStats.dodge * (1 + playerDodgeBoost / 100)) {
        hit = false;
        turnLines.push(`💨 Bạn né đòn của Boss!`);
      }
      playerDodgeBoost = 0;
      if (hit) {
        const dmgRaw2 = Math.max(1, boss.atk * (0.85 + Math.random() * 0.30));
        const isCrit2 = Math.random() * 100 < Math.max(0, boss.crit - pStats.critResist);
        let finalDmg2 = Math.max(1, Math.floor(dmgRaw2));
        if (isCrit2) finalDmg2 = Math.floor(finalDmg2 * (2 + boss.critDmg / 100));
        if (pStats.maxDmgPct > 0) {
          finalDmg2 = Math.min(finalDmg2, Math.floor(pStats.hp * pStats.maxDmgPct / 100));
        }
        if (dmgCapPct > 0) {
          finalDmg2 = Math.min(finalDmg2, Math.floor(pStats.hp * dmgCapPct / 100));
        }
        hpP = Math.max(0, hpP - finalDmg2);
        totalDmgB += finalDmg2;
        turnLines.push(isCrit2
          ? `⚡ [CHÍ MẠNG] Boss -> Bạn: ${formatBig(finalDmg2)} ⚡`
          : `⚔️ Boss -> Bạn: ${formatBig(finalDmg2)}`);
      }
    }
    if (hpP <= 0 || hpB <= 0) {
      roundLines.push(`--- Hiệp ${turn} ---\n${turnLines.join("\n")}\n\n`);
      used += 200;
      break;
    }

    // ── Boss → Người chơi (or ngược) ──
    if (playerFirst) {
      let hit = true;
      if (!noDodge && Math.random() * 100 < pStats.dodge * (1 + playerDodgeBoost / 100)) {
        hit = false;
        turnLines.push(`💨 Bạn né đòn của Boss!`);
      }
      playerDodgeBoost = 0;
      if (hit) {
        const dmgRaw2 = Math.max(1, boss.atk * (0.85 + Math.random() * 0.30));
        const isCrit2 = Math.random() * 100 < Math.max(0, boss.crit - pStats.critResist);
        let finalDmg2 = Math.max(1, Math.floor(dmgRaw2));
        if (isCrit2) finalDmg2 = Math.floor(finalDmg2 * (2 + boss.critDmg / 100));
        if (pStats.maxDmgPct > 0) {
          finalDmg2 = Math.min(finalDmg2, Math.floor(pStats.hp * pStats.maxDmgPct / 100));
        }
        if (dmgCapPct > 0) {
          finalDmg2 = Math.min(finalDmg2, Math.floor(pStats.hp * dmgCapPct / 100));
        }
        hpP = Math.max(0, hpP - finalDmg2);
        totalDmgB += finalDmg2;
        turnLines.push(isCrit2
          ? `⚡ [CHÍ MẠNG] Boss -> Bạn: ${formatBig(finalDmg2)} ⚡`
          : `⚔️ Boss -> Bạn: ${formatBig(finalDmg2)}`);
      }
    } else {
      let hit = true;
      if (!noDodge && Math.random() * 100 < boss.dodge) hit = false;
      let finalDmg = 0;
      let wasCrit = false;
      if (hit) {
        const effDef = Math.max(0, boss.def * (1 - pStats.armorPen / 100));
        const dmgRaw = Math.max(1, pStats.atk * (0.85 + Math.random() * 0.30));
        wasCrit = Math.random() * 100 < Math.max(0, pStats.crit);
        const truePct = Math.max(0, pStats.trueDmg) / 100;
        const truePart = Math.floor(dmgRaw * truePct);
        const normalPart = Math.max(0, Math.floor(dmgRaw * (1 - truePct) - effDef * 0.25));
        finalDmg = Math.max(1, truePart + normalPart);
        if (wasCrit) finalDmg = Math.floor(finalDmg * (2 + pStats.critDmg / 100));
        if (minDmg > 0) finalDmg = Math.max(finalDmg, minDmg);
      }
      hpB = Math.max(0, hpB - finalDmg);
      totalDmgP += finalDmg;
      const leech = noHeal ? 0 : Math.floor(finalDmg * pStats.lifesteal / 100);
      hpP = Math.min(hpPlayer, hpP + leech);
      const leechNote = leech > 0 ? ` (Hút máu: +${formatBig(leech)} HP)` : "";
      if (!hit) {
        turnLines.push(`💨 Boss né đòn của bạn!`);
      } else if (wasCrit && minDmg > 0 && finalDmg <= minDmg) {
        turnLines.push(`🌀⚡ [ĐAN TÂM CHÍ MẠNG] Bạn -> Boss: ${formatBig(finalDmg)} ⚡${leechNote}`);
      } else if (minDmg > 0 && finalDmg <= minDmg) {
        turnLines.push(`🌀 [ĐAN TÂM] Bạn -> Boss: ${formatBig(finalDmg)} (ST tối thiểu)${leechNote}`);
      } else if (wasCrit) {
        turnLines.push(`⚡ [CHÍ MẠNG] Bạn -> Boss: ${formatBig(finalDmg)} ⚡${leechNote}`);
      } else {
        turnLines.push(`⚔️ Bạn -> Boss: ${formatBig(finalDmg)}${leechNote}`);
      }
      if (hpB <= 0 && towerKillLine) turnLines.push(towerKillLine);
    }
    if (hpP <= 0 || hpB <= 0) {
      roundLines.push(`--- Hiệp ${turn} ---\n${turnLines.join("\n")}\n\n`);
      used += 200;
      break;
    }
    roundLines.push(`--- Hiệp ${turn} ---\n${turnLines.join("\n")}\n\n`);
    used += 200;
  }

  const winByTimeout = hpP > 0 && hpB > 0;
  const playerWon = winByTimeout ? totalDmgP >= totalDmgB : hpB <= 0;
  return { boss, pStats, playerWon, winByTimeout, hpP, hpB, totalDmgP, totalDmgB, turn, roundLines, headerText, minDmg, curse, noHeal, noDodge };
}

function applyTowerRewards(p, senderId, floor) {
  const rewards = getTowerRewards(floor);
  p.towerFloor = Math.max(p.towerFloor || 0, floor);
  p.spiritStones = (p.spiritStones || 0) + rewards.lt;
  savePlayer(senderId);
  return { lt: rewards.lt, expGain: 0, special: floor > 100 && floor % 10 === 0 };
}

async function handleTowerChallenge(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  const currentFloor = p.towerFloor || 0;
  if (currentFloor >= TOWER_MAX_FLOOR) {
    return api.sendMessage({ msg: `🏆 Bạn đã vượt hết ${TOWER_MAX_FLOOR} tầng Thiên Tầng Tháp! Chờ cập nhật thêm tầng mới.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (p.beguan && p.beguan.startedAt) {
    return api.sendMessage({ msg: `❌ Bạn đang bế quan! Dùng ${getGlobalPrefix()}tl stop để thu hoạch trước khi lên tháp.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (p.towerInjured) {
    const healHint = p.daotam === "ma" ? "22 (Nghịch Thiên Đan)" : "1 (Huyết Khí Đan) hoặc 24 (Sinh Mệnh Đan)";
    return api.sendMessage({ msg: `💀 Bạn đang trọng thương vì bị Boss tháp đánh gục!\n💊 Cắn đan ${healHint} để hồi phục rồi mới leo tháp tiếp.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  const floor = currentFloor + 1;
  const staminaCost = getTowerStaminaCost(floor);
  const stamina = p.stamina || 0;
  if (stamina < staminaCost) {
    return api.sendMessage({ msg: `❌ Không đủ thể lực! Cần ${staminaCost} thể lực (hiện có ${Math.floor(stamina)}).`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const res = simulateTowerFight(floor, p);
  p.stamina = Math.max(0, (p.stamina || 0) - staminaCost);

  let resultBlock;
  if (res.playerWon) {
    const { lt, special } = applyTowerRewards(p, senderId, floor);
    resultBlock = `🏆 CHIẾN THẮNG! Vượt tầng ${floor}!
💰 LT: +${formatNumber(lt)}${special ? " 🎉 TRĂM TRIỆU!" : ""}
🚫 Tháp không cho EXP
⚡ Thể lực: -${staminaCost}
━━━━━━━━━━━━━━━━
🎯 Tầng kế tiếp: ${floor + 1}${floor >= TOWER_MAX_FLOOR ? " — 🏆 ĐÃ VƯỢT HẾT THÁP!" : ""}`;
  } else {
    let deathLine = "";
    if (!res.winByTimeout && res.hpP <= 0) {
      p.currentHp = Math.max(1, Math.floor(res.hpP));
      p.towerInjured = true;
      const healHint = p.daotam === "ma" ? "22 (Nghịch Thiên Đan)" : "1 (Huyết Khí Đan) hoặc 24 (Sinh Mệnh Đan)";
      deathLine = `\n💀 Bạn bị Boss đánh gục — HP hiện tại chỉ còn ${formatBig(p.currentHp)}!\n💊 Bị CHẶN leo tháp cho tới khi cắn đan ${healHint}!`;
    }
    savePlayer(senderId);
    resultBlock = `💀 THẤT BẠI Ở TẦNG ${floor}!
📊 Boss còn ${formatBig(res.hpB)} HP
⚡ Thể lực: -${staminaCost}${deathLine}
💡 Tăng sức mạnh hoặc kháng Boss Scaling rồi thử lại!`;
  }

  const msg = `${res.headerText}${res.roundLines.join("")}
📜 [SAU ${res.turn} HIỆP]
👊 Bạn: Còn ${formatBig(res.hpP)} HP | ST: ${formatBig(res.totalDmgP)}
🐉 Boss: Còn ${formatBig(res.hpB)} HP | ST: ${formatBig(res.totalDmgB)}
${resultBlock}`;
  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleTowerAuto(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  if (p.beguan && p.beguan.startedAt) {
    return api.sendMessage({ msg: `❌ Bạn đang bế quan! Dùng ${getGlobalPrefix()}tl stop để thu hoạch trước khi lên tháp.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (p.towerInjured) {
    const healHint = p.daotam === "ma" ? "22 (Nghịch Thiên Đan)" : "1 (Huyết Khí Đan) hoặc 24 (Sinh Mệnh Đan)";
    return api.sendMessage({ msg: `💀 Bạn đang trọng thương vì bị Boss tháp đánh gục!\n💊 Cắn đan ${healHint} để hồi phục rồi mới leo tháp tiếp.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  let stamina = p.stamina || 0;
  if (stamina < getTowerStaminaCost((p.towerFloor || 0) + 1)) {
    return api.sendMessage({ msg: `❌ Không đủ thể lực! Cần ${getTowerStaminaCost((p.towerFloor || 0) + 1)} thể lực (hiện có ${Math.floor(stamina)}).`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  let floor = (p.towerFloor || 0) + 1;
  if (floor > TOWER_MAX_FLOOR) {
    return api.sendMessage({ msg: `🏆 Bạn đã vượt hết ${TOWER_MAX_FLOOR} tầng Thiên Tầng Tháp! Chờ cập nhật thêm tầng mới.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const logs = [];
  let totalLT = 0, climbed = 0;
  let stopReason = "";
  const startFloor = floor;

  while (floor <= TOWER_MAX_FLOOR && stamina >= getTowerStaminaCost(floor)) {
    stamina -= getTowerStaminaCost(floor);
    const res = simulateTowerFight(floor, p);
    if (res.playerWon) {
      const { lt, special } = applyTowerRewards(p, senderId, floor);
      totalLT += lt;
      climbed++;
      logs.push(`✅ Tầng ${floor}${res.curse ? ` [${res.curse.emoji}]` : ""}: +${formatNumber(lt)} LT${special ? " 🎉" : ""}`);
      floor++;
    } else {
      stopReason = `Thất bại ở tầng ${floor} (boss còn ${formatBig(res.hpB)} HP)`;
      if (!res.winByTimeout && res.hpP <= 0) {
        p.currentHp = Math.max(1, Math.floor(res.hpP));
        p.towerInjured = true;
        const healHint = p.daotam === "ma" ? "22" : "1/24";
        stopReason += `\n💀 Bạn bị Boss đánh gục — HP hiện tại chỉ còn ${formatBig(p.currentHp)}! Bị CHẶN leo tháp tới khi cắn đan ${healHint}.`;
      }
      break;
    }
  }

  if (climbed === 0) {
    return api.sendMessage({ msg: `❌ Không vượt được tầng ${floor}! ${stopReason}`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (floor > TOWER_MAX_FLOOR) stopReason = "🏆 ĐÃ VƯỢT HẾT THÁP!";
  else if (stamina < getTowerStaminaCost(floor) && !stopReason) stopReason = `Hết thể lực (còn ${Math.floor(stamina)})`;

  p.stamina = stamina;
  savePlayer(senderId);

  const logBlock = logs.length <= 12 ? logs.join("\n") : `${logs.slice(0, 12).join("\n")}\n... và ${logs.length - 12} tầng nữa`;
  const msg = `⚡ AUTO LEO THIÊN TẦNG THÁP
━━━━━━━━━━━━━━━━
${logBlock}
━━━━━━━━━━━━━━━━
📈 Leo được: ${climbed} tầng (tầng ${startFloor} → tầng ${Math.max(startFloor - 1, startFloor + climbed - 1)})
💰 Tổng LT: +${formatNumber(totalLT)}
🚫 Tháp không cho EXP
⚡ Thể lực còn: ${Math.floor(stamina)}
━━━━━━━━━━━━━━━━
${stopReason}`;
  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleTowerReset(api, message, senderId) {
  if (!isSangTheLenh(senderId)) {
    return api.sendMessage({ msg: "❌ Cần có Sáng Thế Lệnh mới dùng được lệnh này!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  const data = loadData();
  let resetCount = 0, healedCount = 0;
  for (const key of Object.keys(data.players)) {
    const pl = data.players[key];
    if (!pl || typeof pl !== "object") continue;
    if ((pl.towerFloor || 0) > 0) {
      pl.towerFloor = 0;
      resetCount++;
    }
    if (pl.towerInjured) {
      pl.towerInjured = false;
      healedCount++;
    }
  }
  saveData();
  return api.sendMessage({
    msg: `🏆 RESET THÁP TOÀN SERVER
━━━━━━━━━━━━━━━━
🔄 Tầng tháp về 0: ${resetCount} người chơi
💚 Gỡ chặn trọng thương: ${healedCount} người chơi
━━━━━━━━━━━━━━━━
✅ Toàn bộ tu sĩ có thể chinh chiến Thiên Tầng Tháp từ đầu!`,
    quote: message, ttl: 30000,
  }, message.threadId, message.type);
}

const TRAIN_BOSS_NAMES = [
  "Hắc Phong Lão Tổ", "Ám Ảnh Kiếm Quỷ", "Huyết Tế Tử", "Vong Linh Đạo Nhân",
  "Thực Hồn Thú", "Ma Ảnh Tu Sĩ", "Hắc Ám Giả Diện", "Bóng Ma Cổ Đại",
];

function buildTrainBoss(p, stage) {
  const linear = (p.majorRealm - 1) * MAX_MINOR_REALM + (p.minorRealm - 1) + stage + 1;
  const major = Math.floor(linear / MAX_MINOR_REALM) + 1;
  const minor = (linear % MAX_MINOR_REALM) + 1;
  const bossPlayer = {
    talent: "pham",
    theChat: 1,
    huyetMach: 1,
    linhCan: 1,
    majorRealm: Math.max(1, Math.min(major, getMaxMajorRealm(p.daotam))),
    minorRealm: minor,
    phithangCount: 0,
    donated: 0,
    equippedWeapon: null,
    equippedArmor: null,
    equippedPhapTac: null,
    buffs: [],
  };
  return { bossPlayer, name: TRAIN_BOSS_NAMES[Math.floor(Math.random() * TRAIN_BOSS_NAMES.length)] };
}

async function handleTrain(api, message, p, senderId) {
  const prefix = getGlobalPrefix();
  if (p.beguan && p.beguan.startedAt) {
    return api.sendMessage({ msg: `❌ Bạn đang bế quan! Dùng ${prefix}tl stop để thu hoạch trước.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (p.trongThuongUntil && Date.now() < p.trongThuongUntil) {
    return api.sendMessage({ msg: `❌ Đang trọng thương, không thể chiến đấu!`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  const stage = p.trainStage || 0;
  const { bossPlayer, name } = buildTrainBoss(p, stage);
  const bStats = calcStats(bossPlayer);
  bStats.dodge = TOWER_BOSS_DODGE;
  const myStats = calcStats(p);
  const bossRealmTxt = `${getRealmDisplay(bossPlayer.majorRealm, bossPlayer.minorRealm, p.daotam)} (cảnh ${bossPlayer.majorRealm})`;

  // ── Mô phỏng trận đấu ──
  let hpMe = myStats.hp, hpBoss = bStats.hp;
  let dmgMe = 0, dmgBoss = 0;
  const roundLines = [];
  const playerFirst = myStats.spd >= bStats.spd;
  const MAX_R = 30;

  const strike = (atkS, defS, defDodge, defReduction, defMaxPct, defHpMax, canCrit = true) => {
    if (Math.random() * 100 < Math.max(0, defDodge)) return { dodge: true, dmg: 0, crit: false };
    const effDef = Math.max(0, defS.def * (1 - (atkS.armorPen || 0) / 100));
    const dmgRaw = Math.max(1, atkS.atk * (0.85 + Math.random() * 0.30));
    const isCrit = canCrit && Math.random() * 100 < Math.max(0, atkS.crit - (defS.critResist || 0));
    const truePct = Math.max(0, atkS.trueDmg || 0) / 100;
    const truePart = Math.floor(dmgRaw * truePct);
    const normalPart = Math.max(0, Math.floor(dmgRaw * (1 - truePct) - effDef * 0.25));
    let dmg = Math.max(1, truePart + normalPart);
    if (isCrit) dmg = Math.floor(dmg * (2 + (atkS.critDmg || 0) / 100));
    dmg = Math.max(0, Math.floor(dmg * (1 - (defReduction || 0) / 100)));
    if (defMaxPct > 0) dmg = Math.min(dmg, Math.floor(defHpMax * defMaxPct / 100));
    return { dodge: false, dmg, crit: isCrit };
  };

  for (let r = 1; r <= MAX_R && hpMe > 0 && hpBoss > 0; r++) {
    const seq = playerFirst ? [["me", hpBoss], ["boss", hpMe]] : [["boss", hpMe], ["me", hpBoss]];
    for (const [who] of seq) {
      if (who === "me" && hpMe > 0 && hpBoss > 0) {
        const res = strike(myStats, bStats, bStats.dodge, bStats.dmgReduction, 0, bStats.hp, false);
        if (res.dodge) { roundLines.push(`💨 Hiệp ${r}: ${name} né đòn của bạn!`); continue; }
        const leech = Math.floor(res.dmg * myStats.lifesteal / 100);
        hpMe = Math.min(myStats.hp, hpMe + leech);
        hpBoss = Math.max(0, hpBoss - res.dmg);
        dmgMe += res.dmg;
        roundLines.push(`${res.crit ? "⚡" : "⚔️"} Hiệp ${r}: Bạn -> ${name}: ${formatBig(res.dmg)}${res.crit ? " CHÍ MẠNG" : ""}`);
      } else if (who === "boss" && hpBoss > 0 && hpMe > 0) {
        const res = strike(bStats, { ...myStats, def: 0 }, myStats.dodge, 0, myStats.maxDmgPct, myStats.hp);
        if (res.dodge) { roundLines.push(`💨 Hiệp ${r}: Bạn né đòn của ${name}!`); continue; }
        const leech = Math.floor(res.dmg * bStats.lifesteal / 100);
        hpBoss = Math.min(bStats.hp, hpBoss + leech);
        hpMe = Math.max(0, hpMe - res.dmg);
        dmgBoss += res.dmg;
        roundLines.push(`${res.crit ? "⚡" : "⚔️"} Hiệp ${r}: ${name} -> Bạn: ${formatBig(res.dmg)}${res.crit ? " CHÍ MẠNG" : ""}`);
      }
    }
  }

  const won = hpBoss <= 0 && hpMe > 0;
  const timeoutDraw = hpMe > 0 && hpBoss > 0;
  let resultBlock;
  if (won) {
    const reward = 100000 + Math.floor(Math.random() * 900001);
    p.spiritStones = (p.spiritStones || 0) + reward;
    p.trainStage = stage + 1;
    savePlayer(senderId);
    resultBlock = `🏆 THẮNG! Hắc ảnh tan biến!
💰 Phần thưởng: +${formatNumber(reward)} LT
🔓 MỞ KHÓA train boss mạnh hơn (+1 tiểu cảnh giới)
🎯 Boss tiếp theo: ${getRealmDisplay(buildTrainBoss(p, p.trainStage).bossPlayer.majorRealm, buildTrainBoss(p, p.trainStage).bossPlayer.minorRealm, p.daotam)}`;
  } else {
    savePlayer(senderId);
    resultBlock = timeoutDraw
      ? `⏳ Hòa sau ${MAX_R} hiệp — chưa ai hạ được ai!
💡 Luyện thêm rồi thử lại (không mất gì).`
      : `💀 THẤT BẠI! Bạn bị ${name} đánh gục.
💡 Luyện công pháp, trang bị mạnh hơn rồi thử lại (không mất gì).`;
  }

  const shown = roundLines.slice(0, 14);
  const moreLine = roundLines.length > shown.length ? `\n... và ${roundLines.length - shown.length} diễn biến nữa` : "";
  const msg = `🌑 HẮC ÁM ĐỘNG LOẠN
━━━━━━━━━━━━━━━━
👹 ${name} — ${bossRealmTxt}
📊 Boss: ${formatBig(bStats.atk)} ATK | ${formatBig(bStats.hp)} HP | SPD ${formatBig(bStats.spd)} | Né ${bStats.dodge}%
🚫 Boss không vũ khí/giáp, miễn bạo kích, miễn pháp tắc, vô hiệu DEF & giảm thương — né 80% như boss tháp!
📈 Stage của bạn: ${stage} → ${won ? stage + 1 : stage}
━━━━━━━━━━━━━━━━
${shown.join("\n")}${moreLine}
━━━━━━━━━━━━━━━━
📜 Kết thúc: Bạn còn ${formatBig(hpMe)} HP | Boss còn ${formatBig(hpBoss)} HP (ST: ${formatBig(dmgMe)} vs ${formatBig(dmgBoss)})
${resultBlock}`;
  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleNhapDao(api, message, p, senderId) {
  if (p.daotam === "chinh") {
    return api.sendMessage({ msg: "⚡ Bạn đã là Chính Đạo tu sĩ rồi!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }
  if (p.majorRealm > 1) {
    return api.sendMessage({ msg: `❌ Chỉ ở Luyện Khí trở xuống mới nhập Chính Đạo!\n💡 Dùng ${getGlobalPrefix()}tl tubao để tự bạo về Luyện Khí.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  p.daotam = "chinh";
  p.minorRealm = 1;
  p.exp = 0;
  savePlayer(senderId);

  const msg = `⚡ NHẬP CHÍNH ĐẠO!
━━━━━━━━━━━━━━━━
🎭 Đạo Tâm: Chính Đạo
📍 Cảnh giới: ${getRealmDisplay(1, 1, "chinh")}
━━━━━━━━━━━━━━━━
Đặc điểm:
⚡ Cảnh giới Chính Đạo riêng
🛡️ Mở khóa giáp Chính Đạo
💡 ${getGlobalPrefix()}dp để bắt đầu tu luyện!`;

  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleNhapMa(api, message, p, senderId) {
  if (p.daotam === "ma") {
    return api.sendMessage({ msg: "⚫ Bạn đã là Ma Đạo tu sĩ rồi!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (p.majorRealm > 1) {
    return api.sendMessage({ msg: `❌ Chỉ ở Luyện Khí trở xuống mới nhập Ma Đạo!\n💡 Dùng ${getGlobalPrefix()}tl tubao để tự bạo về Luyện Khí.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  p.daotam = "ma";
  p.minorRealm = 1;
  p.exp = 0;
  savePlayer(senderId);

  const msg = `⚫ NHẬP MA ĐẠO!
━━━━━━━━━━━━━━━━
🎭 Đạo Tâm: Ma Đạo
📍 Cảnh giới: ${getRealmDisplay(1, 1, "ma")}
━━━━━━━━━━━━━━━━
Đặc điểm:
🔴 Cảnh giới Ma Đạo riêng
🖤 Đan dược hiệu quả theo đạo tâm
💡 ${getGlobalPrefix()}dp để bắt đầu tu luyện!`;

  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleNhapNho(api, message, p, senderId) {
  if (p.daotam === "nho") {
    return api.sendMessage({ msg: "🎓 Bạn đã là Nho Đạo tu sĩ rồi!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (p.majorRealm > 1) {
    return api.sendMessage({ msg: `❌ Chỉ ở Luyện Khí trở xuống mới nhập Nho Đạo!\n💡 Dùng ${getGlobalPrefix()}tl tubao để tự bạo về Luyện Khí.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  p.daotam = "nho";
  p.minorRealm = 1;
  p.exp = 0;
  savePlayer(senderId);

  const msg = `🎓 NHẬP NHO ĐẠO!
━━━━━━━━━━━━━━━━
🎭 Đạo Tâm: Nho Đạo
📍 Cảnh giới: ${getRealmDisplay(1, 1, "nho")}
━━━━━━━━━━━━━━━━
Đặc điểm:
📜 Cảnh giới Nho Đạo riêng
🪶 Mở khóa giáp Nho Đạo (a_nho_*)
💡 ${getGlobalPrefix()}dp để bắt đầu tu luyện!`;

  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleNhapYeu(api, message, p, senderId) {
  if (p.daotam === "yeu") {
    return api.sendMessage({ msg: "🐾 Bạn đã là Yêu Đạo tu sĩ rồi!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (p.majorRealm > 1) {
    return api.sendMessage({ msg: `❌ Chỉ ở Luyện Khí trở xuống mới nhập Yêu Đạo!\n💡 Dùng ${getGlobalPrefix()}tl tubao để tự bạo về Luyện Khí.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  p.daotam = "yeu";
  p.minorRealm = 1;
  p.exp = 0;
  savePlayer(senderId);

  const msg = `🐾 NHẬP YÊU ĐẠO!
━━━━━━━━━━━━━━━━
🎭 Đạo Tâm: Yêu Đạo
📍 Cảnh giới: ${getRealmDisplay(1, 1, "yeu")}
━━━━━━━━━━━━━━━━
Đặc điểm:
🐉 Cảnh giới Yêu Đạo riêng
🦊 Mở khóa giáp Yêu Đạo (a_yeu_*)
💡 ${getGlobalPrefix()}dp để bắt đầu tu luyện!`;

  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleNhapLo(api, message, p, senderId) {
  if (p.daotam === "lo") {
    return api.sendMessage({ msg: "🫙 Bạn đã là Lọ Đạo tu sĩ rồi!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (p.majorRealm > 1) {
    return api.sendMessage({ msg: `❌ Chỉ ở Luyện Khí trở xuống mới nhập Lọ Đạo!\n💡 Dùng ${getGlobalPrefix()}tl tubao để tự bạo về Luyện Khí.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  p.daotam = "lo";
  p.minorRealm = 1;
  p.exp = 0;
  savePlayer(senderId);

  const msg = `🫙 NHẬP LỌ ĐẠO!
━━━━━━━━━━━━━━━━
🎭 Đạo Tâm: Lọ Đạo
📍 Cảnh giới: ${getRealmDisplay(1, 1, "lo")}
━━━━━━━━━━━━━━━━
Đặc điểm:
🫙 Cảnh giới Lọ Đạo riêng
🩳 Mở khóa giáp Lọ Đạo (a_lo_*)
🦪 Đan dược dành riêng cho Lọ Đạo
💡 ${getGlobalPrefix()}dp để bắt đầu tu luyện!`;

  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleNhapQuy(api, message, p, senderId) {
  if (p.daotam === "quy") {
    return api.sendMessage({ msg: "👻 Bạn đã là Quỷ Đạo tu sĩ rồi!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (p.majorRealm > 1) {
    return api.sendMessage({ msg: `❌ Chỉ ở Luyện Khí trở xuống mới nhập Quỷ Đạo!\n💡 Dùng ${getGlobalPrefix()}tl tubao để tự bạo về Luyện Khí.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  p.daotam = "quy";
  p.minorRealm = 1;
  p.exp = 0;
  savePlayer(senderId);

  const msg = `👻 NHẬP QUỶ ĐẠO!
━━━━━━━━━━━━━━━━
🎭 Đạo Tâm: Quỷ Đạo
📍 Cảnh giới: ${getRealmDisplay(1, 1, "quy")}
━━━━━━━━━━━━━━━━
Đặc điểm:
👻 Cảnh giới Quỷ Đạo riêng
🦴 Mở khóa giáp Quỷ Đạo (a_quy_*)
💡 ${getGlobalPrefix()}dp để bắt đầu tu luyện!`;

  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleNhapPhat(api, message, p, senderId) {
  if (p.daotam === "phat") {
    return api.sendMessage({ msg: "🪷 Bạn đã là Phật Đạo tu sĩ rồi!", quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  if (p.majorRealm > 1) {
    return api.sendMessage({ msg: `❌ Chỉ ở Luyện Khí trở xuống mới nhập Phật Đạo!\n💡 Dùng ${getGlobalPrefix()}tl tubao để tự bạo về Luyện Khí.`, quote: message, ttl: 15000 }, message.threadId, message.type);
  }

  p.daotam = "phat";
  p.minorRealm = 1;
  p.exp = 0;
  savePlayer(senderId);

  const msg = `🪷 NHẬP PHẬT ĐẠO!
━━━━━━━━━━━━━━━━
🎭 Đạo Tâm: Phật Đạo
📍 Cảnh giới: ${getRealmDisplay(1, 1, "phat")}
━━━━━━━━━━━━━━━━
Đặc điểm:
🪷 Cảnh giới Phật Đạo riêng (79 cảnh: Phật Tử → Vô Thượng Niết Bàn)
💡 ${getGlobalPrefix()}dp để bắt đầu tu luyện!`;

  await api.sendMessage({ msg, quote: message, ttl: 60000 }, message.threadId, message.type);
}

async function handleSet(api, message, p, senderId, sub2, sub3) {
  const threadId = message.threadId;
  if (!isSangTheLenh(senderId)) {
    return api.sendMessage({ msg: "❌ Cần có Sáng Thế Lệnh mới dùng được lệnh này.", quote: message, ttl: 15000 }, threadId, message.type);
  }

  const targetId = (message.data.mentions?.[0]?.uid || senderId).toString();
  logAdminAction(senderId, "set", `${sub2 || ""}${sub3 ? " " + sub3 : ""}`, targetId);

  if (sub2 === "thienphu") {
    const talentKeys = Object.keys(TALENTS);
    const idx = parseInt(sub3, 10);
    if (isNaN(idx) || idx < 1 || idx > talentKeys.length) {
      const prefix = getGlobalPrefix();
      return api.sendMessage({
        msg: `❌ Sai cú pháp. Dùng: ${prefix}tl set thienphu <số thứ tự> @user\nVD: ${prefix}tl set thienphu 6 @user (xem ${prefix}tl wiki thienphu)`,
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }
    const key = talentKeys[idx - 1];
    const ti = TALENTS[key];
    const data = loadData();
    if (!data.players[resolvePlayerKey(targetId)]) {
      return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
    }
    data.players[resolvePlayerKey(targetId)].talent = key;
    saveData();
    const targetName = getTargetName(message, targetId, senderId);
    return api.sendMessage({
      msg: `🌌 CAN THIỆP THIÊN ĐẠO!
━━━━━━━━━━━━━━━━
🎭 (admin) can thiệp thiên đạo, thiên phú của ${targetName} đã được đặt thành **${ti.emoji} ${ti.name}** (EXP ×${ti.multiplier})!`,
      quote: message, ttl: 30000,
    }, threadId, message.type);
  }

  if (sub2 === "tax") {
    const value = parseFloat(sub3);
    if (isNaN(value) || value < 0 || value > 100) {
      const prefix = getGlobalPrefix();
      return api.sendMessage({
        msg: `❌ Sai cú pháp. Dùng: ${prefix}tl set tax <0-100>\nVD: ${prefix}tl set tax 5 — đặt thuế bank toàn server 5%\n💡 0 = miễn thuế, mặc định ${TAX_RATE * 100}%`,
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }
    const data = loadData();
    data.serverTaxRate = value / 100;
    saveData();
    const msg = `🏦 CẬP NHẬT THUẾ BANK!
━━━━━━━━━━━━━━━━
🎭 (admin) đặt thuế giao dịch bank toàn server thành: **${value}%**`;
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, threadId, message.type);
  }

  if (sub2 === "exp") {
    const value = parseNumberStr(sub3);
    if (isNaN(value) || value < 0) {
      const prefix = getGlobalPrefix();
      return api.sendMessage({
        msg: `❌ Sai cú pháp. Dùng: ${prefix}tl set exp <số> [@user]\nVD: ${prefix}tl set exp 100000 @user | ${prefix}tl set exp 1m | ${prefix}tl set exp 1e6`,
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }
    const data = loadData();
    if (!data.players[resolvePlayerKey(targetId)]) {
      return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
    }
    data.players[resolvePlayerKey(targetId)].exp = value;
    saveData();
    const label = targetId === senderId ? "bản thân" : getTargetName(message, targetId, senderId);
    return api.sendMessage({
      msg: `✨ ĐẶT EXP THÀNH CÔNG!
━━━━━━━━━━━━━━━━
🎭 (admin) đặt EXP của ${label} thành: **${formatNumber(value)}** EXP`,
      quote: message, ttl: 30000,
    }, threadId, message.type);
  }

  if (sub2 === "lt" || sub2 === "lienthang" || sub2 === "stone") {
    const value = parseNumberStr(sub3);
    if (isNaN(value) || value < 0) {
      const prefix = getGlobalPrefix();
      return api.sendMessage({
        msg: `❌ Sai cú pháp. Dùng: ${prefix}tl set lt <số> [@user]\nVD: ${prefix}tl set lt 1000000 @user | ${prefix}tl set lt 1m | ${prefix}tl set lt 1e6`,
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }
    const data = loadData();
    if (!data.players[resolvePlayerKey(targetId)]) {
      return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
    }
    data.players[resolvePlayerKey(targetId)].spiritStones = value;
    saveData();
    const label = targetId === senderId ? "bản thân" : getTargetName(message, targetId, senderId);
    return api.sendMessage({
      msg: `💎 ĐẶT LINH THẠCH THÀNH CÔNG!
━━━━━━━━━━━━━━━━
🎭 (admin) đặt Linh Thạch của ${label} thành: **${formatNumber(value)}** LT`,
      quote: message, ttl: 30000,
    }, threadId, message.type);
  }

  if (sub2 === "donate" || sub2 === "don") {
    const value = parseAmountStr(sub3);
    if (isNaN(value) || value < 0) {
      const prefix = getGlobalPrefix();
      return api.sendMessage({
        msg: `❌ Sai cú pháp. Dùng: ${prefix}tl set donate <số_tiền> @user\nVD: ${prefix}tl set donate 500000 @user | ${prefix}tl set donate 5m @user\n💡 Đặt TỔNG donate chính xác (tránh buff nhầm)`,
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }
    const data = loadData();
    const target = data.players[resolvePlayerKey(targetId)];
    if (!target) {
      return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
    }
    const previousDonated = target.donated || 0;
    target.donated = value;
    const milestoneRewards = applyMilestones(target, previousDonated);
    const newPrime = getPrimeLevel(target.donated);
    const primeLine = newPrime !== (target.prime || 0)
      ? `━━━━━━━━━━━━━━━━\n👑 Prime: ${target.prime || 0} → Prime ${newPrime}\n`
      : "";
    target.prime = newPrime;
    const newTitle = checkAutoTitles(target);
    const titleLine = newTitle ? `━━━━━━━━━━━━━━━━\n🏆 MỚI NHẬN DANH HIỆU: ${TITLES.find(t => t.id === newTitle)?.emoji} ${TITLES.find(t => t.id === newTitle)?.name}!\n` : "";
    saveData();
    const targetName = getTargetName(message, targetId, senderId);
    return api.sendMessage({
      msg: `💰 ĐẶT DONATE THÀNH CÔNG!
━━━━━━━━━━━━━━━
🎭 (admin) đặt tổng donate của ${targetName}: ${formatNumber(previousDonated)}đ → **${formatNumber(value)}đ**
${primeLine}${titleLine}${milestoneRewards.length > 0 ? `━━━━━━━━━━━━━━━━\n${milestoneRewards.join("\n")}\n` : ""}💡 ${getGlobalPrefix()}tl donate để xem cơ duyên đã đạt`,
      quote: message, ttl: 30000,
    }, threadId, message.type);
  }

  if (sub2 === "phaptac") {
    const value = parseInt(sub3, 10);
    if (isNaN(value) || value < 1 || value > PHAPTAC_MAX_LEVEL) {
      const prefix = getGlobalPrefix();
      return api.sendMessage({
        msg: `❌ Sai cú pháp. Dùng: ${prefix}tl set phaptac <cấp 1-${PHAPTAC_MAX_LEVEL}> [@user]\nVD: ${prefix}tl set phaptac 5 @user`,
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }
    const data = loadData();
    const target = data.players[resolvePlayerKey(targetId)];
    if (!target) {
      return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
    }
    if (!target.phapTacPath) {
      return api.sendMessage({ msg: "❌ Người này chưa chọn đường pháp tắc (tl phaptac tuluyen <loại>)!", quote: message, ttl: 15000 }, threadId, message.type);
    }
    const oldLv = target.phapTacLevel || 1;
    target.phapTacLevel = value;
    saveData();
    const cfg = PHAPTAC_PATHS[target.phapTacPath];
    const label = targetId === senderId ? "bản thân" : getTargetName(message, targetId, senderId);
    return api.sendMessage({
      msg: `🌀 ĐẶT CẤP PHÁP TẮC THÀNH CÔNG!
━━━━━━━━━━━━━━━━
🎭 (admin) đặt cấp pháp tắc của ${label}: Lv.${oldLv} → **Lv.${value}**
${cfg.emoji} ${cfg.name}
⚡ Hiệu ứng: ${describePhapTacEff(getPhapTacEffects(target.phapTacPath, target.phapTacLevel)) || "Chưa có"}`,
      quote: message, ttl: 30000,
    }, threadId, message.type);
  }

  const statMap = {
    thechat: { list: THECHAT, field: "theChat", label: "Thể Chất" },
    linhcan: { list: LINH_CAN, field: "linhCan", label: "Linh Căn" },
    huyetmach: { list: HUYETMACH, field: "huyetMach", label: "Huyết Mạch" },
  };

  if (statMap[sub2]) {
    const cfg = statMap[sub2];
    const idx = parseInt(sub3, 10);
    if (isNaN(idx)) {
      const prefix = getGlobalPrefix();
      return api.sendMessage({
        msg: `❌ Sai cú pháp. Dùng: ${prefix}tl set ${sub2} <số thứ tự> @user\nVD: ${prefix}tl set thechat 27 @user`,
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }
    const entry = cfg.list.find(x => x.id === idx);
    if (!entry) {
      return api.sendMessage({ msg: `❌ Không tìm thấy ${cfg.label} thứ ${idx}!`, quote: message, ttl: 15000 }, threadId, message.type);
    }
    const data = loadData();
    if (!data.players[resolvePlayerKey(targetId)]) {
      return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
    }
    data.players[resolvePlayerKey(targetId)][cfg.field] = entry.id;
    saveData();
    const label = targetId === senderId ? "bản thân" : targetId;
    return api.sendMessage({
      msg: `✅ Đã đặt ${cfg.label} của ${label} thành: ${entry.emoji} ${entry.name}`,
      quote: message, ttl: 30000,
    }, threadId, message.type);
  }

  const numStatMap = {
    phucduyen: { field: "phucDuyen", label: "Phúc Duyên", icon: "🍀" },
    ngotinh: { field: "ngoTinh", label: "Ngộ Tính", icon: "🧠" },
    pt: { field: "phithangCount", label: "Phi Thăng", icon: "🌌" },
  };

  if (numStatMap[sub2]) {
    const cfg = numStatMap[sub2];
    const value = parseFlexibleInt(sub3);
    if (isNaN(value) || value < 0) {
      const prefix = getGlobalPrefix();
      return api.sendMessage({
        msg: `❌ Sai cú pháp. Dùng: ${prefix}tl set ${sub2} <số> @user\nVD: ${prefix}tl set ${sub2} 50 @user`,
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }
    const data = loadData();
    if (!data.players[resolvePlayerKey(targetId)]) {
      return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
    }
    data.players[resolvePlayerKey(targetId)][cfg.field] = value;
    saveData();
    const label = targetId === senderId ? "bản thân" : targetId;
    return api.sendMessage({
      msg: `✅ Đã đặt ${cfg.label} của ${label} thành: ${cfg.icon} ${value}`,
      quote: message, ttl: 30000,
    }, threadId, message.type);
  }

  const realmIndex = parseInt(sub2 || sub3, 10);

  if (isNaN(realmIndex) || realmIndex < 1) {
    const prefix = getGlobalPrefix();
    return api.sendMessage({
      msg: `❌ Sai cú pháp. Dùng: ${prefix}tl set <số_cảnh_giới> @user\nVí dụ: ${prefix}tl set 5 @user`,
      quote: message, ttl: 15000,
    }, threadId, message.type);
  }

  const data = loadData();
  if (!data.players[resolvePlayerKey(targetId)]) {
    return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
  }

  const target = data.players[resolvePlayerKey(targetId)];
  if (realmIndex > getMaxMajorRealm(target.daotam)) {
    const prefix = getGlobalPrefix();
    return api.sendMessage({
      msg: `❌ Cảnh giới tối đa của ${getDaoDisplay(target.daotam)} là ${getMaxMajorRealm(target.daotam)}!\nVí dụ: ${prefix}tl set 5 @user`,
      quote: message, ttl: 15000,
    }, threadId, message.type);
  }
  target.majorRealm = realmIndex;
  target.minorRealm = 1;
  target.exp = 0;
  saveData();

  const realmName = getRealmDisplay(realmIndex, 1, target.daotam);
  const targetName = targetId === senderId ? message.data.dName : (message.data.mentions?.[0]?.dName || targetId);
  await api.sendMessage({
    msg: `🌌 CAN THIỆP THIÊN ĐẠO!
━━━━━━━━━━━━━━━━
🎭 (admin) can thiệp thiên đạo, cảnh giới của ${targetName} đã được đặt thành **${realmName}**!`,
    quote: message, ttl: 30000,
  }, threadId, message.type);
}

async function handleBuff(api, message, sub2, sub3, sub4) {
  const threadId = message.threadId;
  if (!isSangTheLenh(message.data.uidFrom)) {
    return api.sendMessage({ msg: "❌ Cần có Sáng Thế Lệnh mới dùng được lệnh này.", quote: message, ttl: 15000 }, threadId, message.type);
  }

  const senderId = message.data.uidFrom;
  const targetId = (message.data.mentions?.[0]?.uid || senderId).toString();
  const prefix = getGlobalPrefix();
  logAdminAction(senderId, "buff", `${sub2 || ""} ${sub3 || ""}${sub4 ? " " + sub4 : ""}`, targetId);

  if (sub2 === "donate") {
    const amount = parseAmountStr(sub3, 1000);
    if (isNaN(amount) || amount <= 0) {
      return api.sendMessage({
        msg: `❌ Sai cú pháp. Dùng: ${prefix}tl buff donate <số_tiền> @user\nVD: ${prefix}tl buff donate 50 @user | ${prefix}tl buff donate 100k @user`,
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }

    const data = loadData();
    if (!data.players[resolvePlayerKey(targetId)]) {
      return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
    }

    const target = data.players[resolvePlayerKey(targetId)];
    const previousDonated = target.donated || 0;
    target.donated = previousDonated + amount;
    const milestoneRewards = applyMilestones(target, previousDonated);
    const newPrime = getPrimeLevel(target.donated);
    const primeUpgrade = newPrime > (target.prime || 0) ? `━━━━━━━━━━━━━━━━\n👑 NÂNG CẤP PRIME: Prime ${target.prime || 0} → Prime ${newPrime}!\n` : "";
    target.prime = newPrime;
    const newTitle = checkAutoTitles(target);
    const titleLine = newTitle ? `━━━━━━━━━━━━━━━━\n🏆 MỚI NHẬN DANH HIỆU: ${TITLES.find(t => t.id === newTitle)?.emoji} ${TITLES.find(t => t.id === newTitle)?.name}!\n` : "";
    saveData();

    const targetName = targetId === senderId ? message.data.dName : (message.data.mentions?.[0]?.dName || targetId);
    const msg = `💰 GHI NHẬN DONATE!
━━━━━━━━━━━━━━━
🌟 ${targetName} đã donate thêm ${formatNumber(amount)}đ
💎 Tổng cộng đã donate: ${formatNumber(target.donated)}đ
${primeUpgrade}${titleLine}${milestoneRewards.length > 0 ? `━━━━━━━━━━━━━━━━\n${milestoneRewards.join("\n")}\n` : ""}━━━━━━━━━━━━━━━
💡 ${prefix}tl donate để xem cơ duyên đã đạt`;
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, threadId, message.type);
  }

  if (sub2 === "combo") {
    const combo = DONATE_COMBOS.find(c => c.id === (sub3 || "").trim());
    if (!combo) {
      const list = DONATE_COMBOS.map(c => `• ${c.id}: ${c.emoji} ${c.name} (${formatNumber(c.price)}đ)`).join("\n");
      return api.sendMessage({
        msg: `❌ Sai cú pháp. Dùng: ${prefix}tl buff combo <id> @user\n\n${list}`,
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }

    const data = loadData();
    if (!data.players[resolvePlayerKey(targetId)]) {
      return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
    }

    const granted = [];
    if (combo.weapon) { addItem(targetId, combo.weapon, "weapon"); granted.push(`🗡️ ${combo.weapon}`); }
    if (combo.armor) { addItem(targetId, combo.armor, "armor"); granted.push(`🛡️ ${combo.armor}`); }
    if (combo.stones > 0) {
      data.players[resolvePlayerKey(targetId)].spiritStones = (data.players[resolvePlayerKey(targetId)].spiritStones || 0) + combo.stones;
      granted.push(`💎 ${formatNumber(combo.stones)} LT`);
    }
    if (Array.isArray(combo.potions)) {
      for (const po of combo.potions) {
        addItem(targetId, po.id, "potion", po.qty || 1);
        const pInfo = POTIONS.find(x => x.id === po.id);
        granted.push(`💊 ${pInfo ? `${pInfo.emoji} ${pInfo.name}` : po.id} x${po.qty || 1}`);
      }
    }
    if (combo.talent) {
      const ti = TALENTS[combo.talent];
      if (ti) {
        data.players[resolvePlayerKey(targetId)].talent = combo.talent;
        data.players[resolvePlayerKey(targetId)].ngoTinh = ti.ngoBase;
        data.players[resolvePlayerKey(targetId)].phucDuyen = ti.phucBase;
        granted.push(`${ti.emoji} Thiên Phú: ${ti.name} (×${ti.multiplier})`);
      }
    }
    saveData();

    const targetName = targetId === senderId ? message.data.dName : (message.data.mentions?.[0]?.dName || targetId);
    const msg = `⚔️ COMBO GIÁNG LÂM!
━━━━━━━━━━━━━━━━
🌟 (admin) trao ${combo.emoji} ${combo.name} cho ${targetName}!
${granted.map(g => `• ${g}`).join("\n")}
━━━━━━━━━━━━━━━━
💡 ${prefix}tl bag để kiểm tra túi đồ`;
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, threadId, message.type);
  }

  if (sub2 === "bones" || sub2 === "xuong") {
    const amount = parseInt(sub3, 10);
    if (isNaN(amount) || amount <= 0) {
      return api.sendMessage({
        msg: `❌ Sai cú pháp. Dùng: ${prefix}tl buff bones <số> @user\nVD: ${prefix}tl buff bones 100 @user`,
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }

    const data = loadData();
    if (!data.players[resolvePlayerKey(targetId)]) {
      return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
    }

    const target = data.players[resolvePlayerKey(targetId)];
    target.bones = (target.bones || 0) + amount;
    saveData();

    const targetName = targetId === senderId ? message.data.dName : (message.data.mentions?.[0]?.dName || targetId);
    return api.sendMessage({
      msg: `🦴 GHI NHẬN BONES!
━━━━━━━━━━━━━━━━
🌟 (admin) ban cho ${targetName} ${formatNumber(amount)} Xương!
🦴 Tổng xương: ${target.bones}`,
      quote: message, ttl: 30000,
    }, threadId, message.type);
  }

  if (sub2 === "soul" || sub2 === "linhhon") {
    const amount = parseInt(sub3, 10);
    if (isNaN(amount) || amount <= 0) {
      return api.sendMessage({
        msg: `❌ Sai cú pháp. Dùng: ${prefix}tl buff soul <số> @user\nVD: ${prefix}tl buff soul 5 @user`,
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }

    const data = loadData();
    if (!data.players[resolvePlayerKey(targetId)]) {
      return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
    }

    const target = data.players[resolvePlayerKey(targetId)];
    target.soul = (target.soul || 0) + amount;
    saveData();

    const targetName = targetId === senderId ? message.data.dName : (message.data.mentions?.[0]?.dName || targetId);
    return api.sendMessage({
      msg: `👻 GHI NHẬN SOUL!
━━━━━━━━━━━━━━━━
🌟 (admin) ban cho ${targetName} ${formatNumber(amount)} Soul!
👻 Tổng Soul: ${target.soul}`,
      quote: message, ttl: 30000,
    }, threadId, message.type);
  }

  if (sub2 === "fire" || sub2 === "lua") {
    const amount = parseInt(sub3, 10);
    if (isNaN(amount) || amount <= 0) {
      return api.sendMessage({
        msg: `❌ Sai cú pháp. Dùng: ${prefix}tl buff fire <số> @user\nVD: ${prefix}tl buff fire 3 @user`,
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }

    const data = loadData();
    if (!data.players[resolvePlayerKey(targetId)]) {
      return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
    }

    const target = data.players[resolvePlayerKey(targetId)];
    target.fire = (target.fire || 0) + amount;
    saveData();

    const targetName = targetId === senderId ? message.data.dName : (message.data.mentions?.[0]?.dName || targetId);
    return api.sendMessage({
      msg: `🔥 GHI NHẬN FIRE!
━━━━━━━━━━━━━━━━
🌟 (admin) ban cho ${targetName} ${formatNumber(amount)} Fire!
🔥 Tổng Fire: ${target.fire}`,
      quote: message, ttl: 30000,
    }, threadId, message.type);
  }

  if (sub2 === "item") {
    if (!isDangSangThe(senderId)) {
      return api.sendMessage({ msg: "❌ Chỉ Đấng Sáng Thế mới có thể dùng lệnh buff item!", quote: message, ttl: 15000 }, threadId, message.type);
    }
    const rawId = (sub3 || "").replace(/^\+/, "").trim();
    if (!rawId) {
      return api.sendMessage({
        msg: `❌ Sai cú pháp. Dùng: ${prefix}tl buff item <ID> [sl] @user\nVD: ${prefix}tl buff item w1 @user | ${prefix}tl buff item 4 5 @user`,
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }

    // ── THU HỒI SÁNG THẾ LỆNH ──
    if (rawId === SANG_THE_LENH_ID && sub4 === "0") {
      const data = loadData();
      let revokedCount = 0;
      for (const [key, p] of Object.entries(data.players)) {
        if (p.inventory?.potions?.[SANG_THE_LENH_ID]) {
          delete p.inventory.potions[SANG_THE_LENH_ID];
          revokedCount++;
        }
      }
      saveData();
      const msg = `🔱 THU HỒI SÁNG THẾ LỆNH!
━━━━━━━━━━━━━━━━
🌟 Đấng Sáng Thế đã thu hồi toàn bộ Sáng Thế Lệnh!
🗑️ Đã thu hồi: ${revokedCount} mệnh lệnh
━━━━━━━━━━━━━━━━
⚠️ Tất cả quyền hạn quản trị cấp cao đã mất hiệu lực!`;
      return api.sendMessage({ msg, quote: message, ttl: 30000 }, threadId, message.type);
    }

    const weapon = WEAPONS.find(w => w.id === rawId);
    const armor = ARMORS.find(a => a.id === rawId);
    const potion = POTIONS.find(po => po.id === rawId);
    const congpha = CONGPHA.find(c => c.id === rawId);
    const special = SPECIAL_ITEMS.find(s => s.id === rawId);
    const token = getTokenItem(rawId);
    const item = weapon || armor || potion || congpha || special || token;

    // Hàng Shop Đen custom (mảnh vỡ gương, vũ khí đen, dấu ấn...)
    let shopDenEntry = null;
    if (!item) {
      const key = rawId.replace(/^sd_/, "");
      const entry = SHOPDEN_POOL.find(e => e.key && (e.key === key || e.key === rawId));
      if (entry) shopDenEntry = { id: `sd_${entry.key}`, name: entry.name, emoji: entry.emoji || "📦" };
    }

    if (!item && !shopDenEntry) {
      return api.sendMessage({ msg: `❌ Không tìm thấy vật phẩm ID ${rawId}!`, quote: message, ttl: 15000 }, threadId, message.type);
    }

    const data = loadData();
    if (!data.players[resolvePlayerKey(targetId)]) {
      return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
    }

    const qty = Math.max(1, parseInt(sub4 || "1", 10) || 1);
    if (shopDenEntry) {
      const t = getPlayer(targetId);
      if (!t.inventory.potions) t.inventory.potions = {};
      t.inventory.potions[shopDenEntry.id] = (t.inventory.potions[shopDenEntry.id] || 0) + qty;
      saveData();
    } else if (token) {
      grantToken(targetId, token.id);
    } else if (weapon) addItem(targetId, weapon.id, "weapon");
    else if (armor) addItem(targetId, armor.id, "armor");
    else if (special) addItem(targetId, special.id, "phapTac", 1);
    else addItem(targetId, item.id, "potion", qty);

    const displayName = shopDenEntry ? shopDenEntry.name : item.name;
    const displayEmoji = shopDenEntry ? shopDenEntry.emoji : item.emoji;
    const targetName = targetId === senderId ? message.data.dName : (message.data.mentions?.[0]?.dName || targetId);
    const msg = `🎁 THƯỢNG TIÊN GIÁNG LÂM!
━━━━━━━━━━━━━━━━
🌟 (admin) điểm hóa pháp bảo, ban cho ${targetName}: ${displayEmoji} ${qty > 1 ? `${qty}x ` : ""}${displayName}
━━━━━━━━━━━━━━━━
💡 ${special ? `${prefix}tl equip ${special.id} để trang bị Skill | ` : ""}${prefix}tl bag để kiểm tra túi đồ`;
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, threadId, message.type);
  }

  if (sub2 === "tieucanhgioi" || sub2 === "daicanhgioi") {
    const amount = parseInt(sub3, 10);
    if (isNaN(amount) || amount <= 0) {
      return api.sendMessage({
        msg: `❌ Sai cú pháp. Dùng: ${prefix}tl buff ${sub2} <số> @user\nVD: ${prefix}tl buff daicanhgioi +1 @user`,
        quote: message, ttl: 15000,
      }, threadId, message.type);
    }

    const data = loadData();
    if (!data.players[resolvePlayerKey(targetId)]) {
      return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
    }

    const target = data.players[resolvePlayerKey(targetId)];
    const oldRealm = getRealmDisplay(target.majorRealm, target.minorRealm, target.daotam);

    if (sub2 === "tieucanhgioi") {
      const targetTier = target.minorRealm + amount;
      const targetMaxMajor = getMaxMajorRealm(target.daotam);
      let tier = Math.min(targetTier, MAX_MINOR_REALM * targetMaxMajor);
      while (tier > MAX_MINOR_REALM) {
        tier -= MAX_MINOR_REALM;
        if (target.majorRealm < targetMaxMajor) target.majorRealm++;
      }
      target.minorRealm = Math.min(tier, MAX_MINOR_REALM);
    } else {
      target.majorRealm = Math.min(target.majorRealm + amount, getMaxMajorRealm(target.daotam));
      target.minorRealm = 1;
    }
    target.exp = 0;
    saveData();

    const newRealm = getRealmDisplay(target.majorRealm, target.minorRealm, target.daotam);
    const targetName = targetId === senderId ? message.data.dName : (message.data.mentions?.[0]?.dName || targetId);
    const msg = `🌌 CAN THIỆP THIÊN ĐẠO!
━━━━━━━━━━━━━━━━
🎭 (admin) can thiệp thiên đạo, cảnh giới của ${targetName} đã được đặt thành **${newRealm}**!
🔻 Cảnh giới cũ: ${oldRealm}
🔺 Cảnh giới mới: ${newRealm}
━━━━━━━━━━━━━━━━
💡 ${prefix}dp để đột phá`;
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, threadId, message.type);
  }

  const amount = parseAmountStr(String(sub2 || sub3 || "").replace(/^\+/, ""));

  if (isNaN(amount) || amount <= 0) {
    return api.sendMessage({
      msg: `❌ Sai cú pháp. Dùng: ${prefix}tl buff <số_lt> @user\nVí dụ: ${prefix}tl buff 10000 @user | ${prefix}tl buff 10K @user | ${prefix}tl buff 5M @user\nBan phước toàn server: ${prefix}tl buff <số_lt> all`,
      quote: message, ttl: 15000,
    }, threadId, message.type);
  }

  const isServerWide = [sub2, sub3, sub4].some(a => String(a || "").toLowerCase() === "all");
  const data = loadData();

  if (isServerWide) {
    let count = 0;
    for (const key of Object.keys(data.players || {})) {
      const pl = data.players[key];
      if (!pl || pl.banned) continue;
      pl.spiritStones = (pl.spiritStones || 0) + amount;
      count++;
    }
    saveData();
    logAdminAction(senderId, "buff", `all ${formatNumber(amount)} LT (${count} players)`, null);
    const msg = `🌟 THƯỢNG TIÊN BAN PHƯỚC TOÀN SERVER!
━━━━━━━━━━━━━━━━
🎁 (admin) ban phước ${formatNumber(amount)} Linh Thạch cho toàn bộ ${count} đệ tử đang tu hành!
💎 Khí vận tràn ngập thiên hạ, ai cũng nhận đủ phần`;
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, threadId, message.type);
  }
  if (!data.players[resolvePlayerKey(targetId)]) {
    return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
  }

  const target = data.players[resolvePlayerKey(targetId)];
  target.spiritStones = (target.spiritStones || 0) + amount;
  saveData();

  const targetName = targetId === senderId ? message.data.dName : (message.data.mentions?.[0]?.dName || targetId);
  await api.sendMessage({
    msg: `🌟 THƯỢNG TIÊN BAN PHƯỚC!
━━━━━━━━━━━━━━━━
🎁 (admin) ban phước ${formatNumber(amount)} Linh Thạch cho ${targetName}!
💎 Khí vận của ${targetName}: ${formatNumber(target.spiritStones)} Linh Thạch`,
    quote: message, ttl: 30000,
  }, threadId, message.type);
}

async function handleRemove(api, message, sub2, sub3, sub4) {
  const threadId = message.threadId;
  if (!isAdmin(message.data.uidFrom)) {
    return api.sendMessage({ msg: "❌ Chỉ admin cấp cao mới dùng được lệnh này.", quote: message, ttl: 15000 }, threadId, message.type);
  }

  const senderId = message.data.uidFrom;
  const targetId = (message.data.mentions?.[0]?.uid || senderId).toString();
  const prefix = getGlobalPrefix();
  logAdminAction(senderId, "remove", `${sub2 || ""} ${sub3 || ""}${sub4 ? " " + sub4 : ""}`, targetId);

  const amount = parseAmountStr(String(sub2 || sub3 || "").replace(/^\+/, ""));

  if (isNaN(amount) || amount <= 0) {
    return api.sendMessage({
      msg: `❌ Sai cú pháp. Dùng: ${prefix}tl remove <số_lt> @user\nVí dụ: ${prefix}tl remove 10000 @user | ${prefix}tl remove 10K @user\nThu hồi toàn server: ${prefix}tl remove <số_lt> all`,
      quote: message, ttl: 15000,
    }, threadId, message.type);
  }

  const isServerWide = [sub2, sub3, sub4].some(a => String(a || "").toLowerCase() === "all");
  const data = loadData();

  if (isServerWide) {
    let count = 0;
    for (const key of Object.keys(data.players || {})) {
      const pl = data.players[key];
      if (!pl || pl.banned) continue;
      pl.spiritStones = Math.max(0, (pl.spiritStones || 0) - amount);
      count++;
    }
    saveData();
    logAdminAction(senderId, "remove", `all ${formatNumber(amount)} LT (${count} players)`, null);
    const msg = `⚡ THƯỢNG TIÊN THU HỒI TOÀN SERVER!
━━━━━━━━━━━━━━━━
🌩️ (admin) thu hồi ${formatNumber(amount)} Linh Thạch từ toàn bộ ${count} đệ tử đang tu hành!
💎 Khí vận suy giảm, tất cả đều bị trừ đủ phần`;
    return api.sendMessage({ msg, quote: message, ttl: 30000 }, threadId, message.type);
  }

  if (!data.players[resolvePlayerKey(targetId)]) {
    return api.sendMessage({ msg: "❌ Người dùng này chưa có tài khoản game.", quote: message, ttl: 15000 }, threadId, message.type);
  }

  const target = data.players[resolvePlayerKey(targetId)];
  target.spiritStones = Math.max(0, (target.spiritStones || 0) - amount);
  saveData();

  const targetName = targetId === senderId ? message.data.dName : (message.data.mentions?.[0]?.dName || targetId);
  await api.sendMessage({
    msg: `⚡ THƯỢNG TIÊN THU HỒI!
━━━━━━━━━━━━━━━
🌩️ (admin) thu hồi ${formatNumber(amount)} Linh Thạch từ ${targetName}!
💎 Khí vận còn lại của ${targetName}: ${formatNumber(target.spiritStones)} Linh Thạch`,
    quote: message, ttl: 30000,
  }, threadId, message.type);
}

function parseAmountStr(str, bareUnitMult = 1) {  if (typeof str !== "string") return NaN;
  const m = str.trim().match(/^(\d+(?:\.\d+)?)\s*([kKmMbBtTqQiI]|qi|Qi)?$/);
  if (!m) return NaN;
  const num = parseFloat(m[1]);
  const unit = (m[2] || "").toLowerCase();
  if (!unit) return Math.floor(num * bareUnitMult);
  const mult = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, q: 1e15, qi: 1e18 }[unit] || 1;
  return Math.floor(num * mult);
}

function addRealmTiers(player, minor = 0, major = 0) {
  const playerMaxMajor = getMaxMajorRealm(player.daotam);
  let newMajor = Math.min(player.majorRealm + major, playerMaxMajor);
  let newMinor = player.minorRealm + minor;
  while (newMinor > MAX_MINOR_REALM && newMajor < playerMaxMajor) {
    newMinor -= MAX_MINOR_REALM;
    newMajor++;
  }
  newMinor = Math.min(newMinor, MAX_MINOR_REALM);
  if (newMajor !== player.majorRealm) {
    const newMax = 50 + newMajor * 20;
    player.maxStamina = newMax + (player.maxStaminaBonus || 0);
    player.stamina = Math.min(player.stamina || 0, player.maxStamina);
  }
  player.majorRealm = newMajor;
  player.minorRealm = newMinor;
  player.exp = 0;
}

function applyMilestones(player, previousDonated = 0) {
  if (!player.donateMilestones) player.donateMilestones = [];
  const rewards = [];
  const current = player.donated || 0;
  const crossed = DONATE_MILESTONES
    .filter(m => !player.donateMilestones.includes(m.key) && previousDonated < m.threshold && current >= m.threshold)
    .sort((a, b) => a.threshold - b.threshold);
  for (const m of crossed) {
    player.donateMilestones.push(m.key);
    player.spiritStones = (player.spiritStones || 0) + m.stones;
    const parts = [];
    if (m.stones > 0) parts.push(`${formatNumber(m.stones)} LT`);
    if (m.minor > 0 || m.major > 0) {
      const before = getRealmDisplay(player.majorRealm, player.minorRealm, player.daotam);
      addRealmTiers(player, m.minor, m.major);
      const after = getRealmDisplay(player.majorRealm, player.minorRealm, player.daotam);
      if (before !== after) parts.push(`${before} → ${after}`);
    }
    rewards.push(`🏅 Mốc ${m.label}: ${parts.join(" + ")}`);
  }
  return rewards;
}

function parseFlexibleInt(str) {
  const s = String(str || "").trim().toLowerCase();
  if (!s) return NaN;
  const m = s.match(/^(\d+(?:\.\d+)?)e([+-]?\d+)$/);
  if (m) return Math.floor(parseFloat(m[1]) * Math.pow(10, parseInt(m[2], 10)));
  return parseInt(s, 10);
}

function parseNumberStr(str) {
  if (typeof str !== "string") return NaN;
  const s = str.trim();
  const unitM = s.match(/^(\d+(?:\.\d+)?)\s*([kKmMbBtTqQ]|qi|Qi)?$/);
  if (unitM) {
    const num = parseFloat(unitM[1]);
    const unit = (unitM[2] || "").toLowerCase();
    const mult = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, q: 1e15, qi: 1e18 }[unit] || 1;
    return Math.floor(num * mult);
  }
  return parseFlexibleInt(str);
}
