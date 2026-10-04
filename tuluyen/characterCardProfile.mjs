// characterCardProfile.js
// Profile Character Card cho lệnh .tl khi guiold off (layout 1000x1334 meteor/space + glass UI)
// guiold on  -> profileImageNew.js (vũ trụ tối, giữ nguyên)
// guiold off -> file này

import { createCanvas, loadImage } from "canvas";
import path from "path";
import fs from "fs";
import {
  TALENTS,
  THECHAT,
  HUYETMACH,
  LINH_CAN,
  WEAPONS,
  ARMORS,
  PHAP_BAO,
  SPECIAL_ITEMS,
  TITLES,
  getRealmDisplayFull,
  getMaxExp,
  calcStats,
  formatNumber,
  formatBig,
} from "./constants.mjs";

const WIDTH = 1000;
const HEIGHT = 1334;

function rr(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

// Rút gọn text nếu quá dài so với khung
function fitText(ctx, text, maxWidth, font) {
  ctx.font = font;
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 4 && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
  return t + "…";
}

// Hậu tố kiểu game cho LỰC CHIẾN — luôn ra dạng Qa/Qi/Sx... kể cả số khổng lồ
const POWER_SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No",
  "Dc", "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Od", "Nd", "Vg",
  "UVg", "DVg", "TVg", "QaVg", "QiVg", "SxVg", "SpVg", "OcVg", "NoVg",
  "Tg", "UTg", "DTg", "TTg", "QaTg", "QiTg", "SxTg", "SpTg", "OcTg", "NoTg",
  "Qag", "UQag", "DQag", "TQag", "QaQag", "QiQag", "SxQag", "SpQag", "OcQag", "NoQag"];

function formatPower(n) {
  const num = Math.floor(Number(n) || 0);
  if (Math.abs(num) < 1000) return String(num);
  let val = num;
  let idx = 0;
  while (Math.abs(val) >= 999.5 && idx < POWER_SUFFIXES.length - 1) {
    val /= 1000;
    idx++;
  }
  if (Math.abs(val) >= 999.5) {
    const exp = Math.floor(Math.log10(Math.abs(num)));
    return `${(Math.abs(num) / Math.pow(10, exp)).toFixed(2)}e${exp}`;
  }
  return `${val.toFixed(idx === 1 ? 1 : 2)}${POWER_SUFFIXES[idx]}`;
}

// --- HÀM VẼ KHUNG THUỘC TÍNH (GLASS UI) ---
function drawStatBox(ctx, x, y, w, h, title, value, borderGlowColor) {
  ctx.save();

  // Nền mờ Glassmorphism
  ctx.fillStyle = "rgba(15, 12, 29, 0.75)";
  rr(ctx, x, y, w, h, 10);
  ctx.fill();

  // Viền phát sáng
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = borderGlowColor || "#4a5568";
  ctx.stroke();

  // Góc trang trí
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 8); ctx.lineTo(x, y); ctx.lineTo(x + 8, y);
  ctx.moveTo(x + w - 8, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - 8);
  ctx.stroke();

  // Title (Tên thuộc tính)
  ctx.textAlign = "center";
  ctx.font = "bold 13px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(String(title).toUpperCase(), x + w / 2, y + 20);

  // Value (Chỉ số)
  ctx.font = "bold 18px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(fitText(ctx, String(value), w - 16, "bold 18px sans-serif"), x + w / 2, y + 46);

  ctx.restore();
}

// --- HÀM VẼ THANH TIẾN TRÌNH (PROGRESS BAR) ---
function drawProgressBar(ctx, x, y, w, h, label, current, max, colorStart, colorEnd) {
  ctx.save();
  // Nền thanh
  ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
  rr(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Phần phần trăm đã đạt
  const percent = Math.min(Math.max(current / max, 0), 1);
  const fillW = w * percent;
  if (fillW > 0) {
    const barGrad = ctx.createLinearGradient(x, y, x + fillW, y);
    barGrad.addColorStop(0, colorStart);
    barGrad.addColorStop(1, colorEnd);
    ctx.fillStyle = barGrad;
    rr(ctx, x, y, fillW, h, 6);
    ctx.fill();
  }

  // Text chỉ số
  ctx.textAlign = "center";
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 4;
  const text = `${label}: ${formatBig(current)} / ${formatBig(max)} (${(percent * 100).toFixed(1)}%)`;
  ctx.fillText(text, x + w / 2, y + h / 2 + 5);

  ctx.restore();
}

// Map dữ liệu thật của người chơi
function buildCardData(player, username) {
  const stats = calcStats(player);
  const maxExp = getMaxExp(player.majorRealm, player.minorRealm, player.daotam);
  const theChat = THECHAT.find((t) => t.id === player.theChat) || THECHAT[0];
  const huyetMach = HUYETMACH.find((h) => h.id === player.huyetMach) || HUYETMACH[0];
  const linhCan = LINH_CAN.find((l) => l.id === player.linhCan) || LINH_CAN[0];
  const talent = TALENTS[player.talent] || TALENTS.pham;
  const weapon = player.equippedWeapon ? WEAPONS.find((w) => w.id === player.equippedWeapon) : null;
  const armor = player.equippedArmor ? ARMORS.find((a) => a.id === player.equippedArmor) : null;
  const phapBao = player.equippedPhapBao ? PHAP_BAO.find((pb) => pb.id === player.equippedPhapBao) : null;
  const phapTac = player.equippedPhapTac ? SPECIAL_ITEMS.find((s) => s.id === player.equippedPhapTac) : null;
  const title = player.equippedTitle ? TITLES.find((t) => t.id === player.equippedTitle) : null;

  const hpMax = stats.hp;
  const hpCur = Math.min(hpMax, Math.max(0, player.currentHp != null ? player.currentHp : hpMax));
  const stamina = player.stamina ?? 0;
  const maxStamina = player.maxStamina ?? 50;

  return {
    name: String(username || "Vô Danh").toUpperCase(),
    linhThach: formatNumber(player.spiritStones || 0),
    theLuc: `${formatNumber(stamina)} / ${formatNumber(maxStamina)}`,
    tongMon: "Tán Tu",
    chienLuc: formatPower(stats.battlePower),
    realmLabel: `[${player.majorRealm || 0}] ${getRealmDisplayFull(player)}`,
    theChat: theChat.name,
    huyetMach: huyetMach.name,
    thanToc: formatNumber(stats.spd),
    ngoTinh: player.ngoTinh ?? 0,
    baoKich: `${stats.crit}%`,
    linhCan: linhCan.name,
    congKich: formatNumber(stats.atk),
    phapPhong: formatNumber(stats.def),
    phucDuyen: player.phucDuyen ?? 0,
    hutMau: `${stats.lifesteal}%`,
    thanBinh: weapon ? weapon.name : "Tay Không",
    thanhY: armor ? armor.name : "Vải Thô",
    hoPhap: phapBao ? phapBao.name : (phapTac ? phapTac.name : (title ? title.name : "Chưa có")),
    hpCur, hpMax,
    expCur: player.exp || 0,
    expMax: maxExp > 0 ? maxExp : 1,
    stamCur: stamina,
    stamMax: maxStamina > 0 ? maxStamina : 1,
  };
}

export async function generateProfileCardCharacter({ player, username, avatarUrl }) {
  const data = buildCardData(player, username);
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // --- 1. BACKGROUND METEOR / SPACE ---
  const bgGrad = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 100, WIDTH / 2, HEIGHT / 2, WIDTH);
  bgGrad.addColorStop(0, "#1e0826");
  bgGrad.addColorStop(0.5, "#0d0414");
  bgGrad.addColorStop(1, "#05010a");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // --- 2. HEADER TOP BAR ---
  ctx.fillStyle = "rgba(2, 6, 23, 0.85)";
  ctx.fillRect(20, 20, WIDTH - 40, 50);
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(20, 20, WIDTH - 40, 50);

  ctx.textAlign = "left";
  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = "#38bdf8";
  ctx.fillText(fitText(ctx, `❖ ${data.linhThach} L.Thạch`, 170, "bold 16px sans-serif"), 40, 52);
  ctx.fillStyle = "#22c55e";
  ctx.fillText(fitText(ctx, `⚡ ${data.theLuc} T.Lực`, 220, "bold 16px sans-serif"), 220, 52);

  ctx.textAlign = "right";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Tông Môn:", WIDTH - 180, 52);
  ctx.fillStyle = "#ef4444";
  ctx.fillText(fitText(ctx, data.tongMon, 150, "bold 16px sans-serif"), WIDTH - 40, 52);

  // --- 3. CHIẾN LỰC BADGE ---
  const clX = WIDTH / 2 - 150;
  ctx.fillStyle = "#7f1d1d";
  rr(ctx, clX, 85, 300, 45, 8);
  ctx.fill();
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.font = "bold 22px sans-serif";
  ctx.fillStyle = "#fef08a";
  ctx.fillText(fitText(ctx, `⚔ CHIẾN LỰC: ${data.chienLuc}`, 290, "bold 22px sans-serif"), WIDTH / 2, 115);

  // --- 4. TÊN VÀ CẢNH GIỚI ---
  ctx.font = "bold 36px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#a855f7";
  ctx.shadowBlur = 12;
  ctx.fillText(fitText(ctx, data.name, WIDTH - 80, "bold 36px sans-serif"), WIDTH / 2, 180);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#991b1b";
  rr(ctx, WIDTH / 2 - 180, 200, 360, 35, 6);
  ctx.fill();
  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = "#fca5a5";
  ctx.fillText(fitText(ctx, data.realmLabel, 340, "bold 16px sans-serif"), WIDTH / 2, 223);

  // --- Avatar giữa (nếu có) ---
  if (avatarUrl) {
    try {
      const avatarImg = await loadImage(avatarUrl);
      const size = 190;
      const ax = WIDTH / 2 - size / 2;
      const ay = 300;
      ctx.save();
      ctx.beginPath();
      ctx.arc(ax + size / 2, ay + size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, ax, ay, size, size);
      ctx.restore();
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ax + size / 2, ay + size / 2, size / 2, 0, Math.PI * 2);
      ctx.stroke();
    } catch {}
  }

  // --- 5. CÁC CỘT THUỘC TÍNH (TRÁI & PHẢI) ---
  // Cột trái
  drawStatBox(ctx, 40, 270, 180, 60, "Thể Chất", data.theChat, "#f43f5e");
  drawStatBox(ctx, 40, 360, 180, 60, "Huyết Mạch", data.huyetMach, "#eab308");
  drawStatBox(ctx, 40, 450, 180, 60, "Thần Tốc", data.thanToc, "#06b6d4");
  drawStatBox(ctx, 40, 540, 180, 60, "Ngộ Tính", data.ngoTinh, "#8b5cf6");
  drawStatBox(ctx, 40, 630, 180, 60, "Bạo Kích", data.baoKich, "#f97316");

  // Cột phải
  drawStatBox(ctx, 780, 270, 180, 60, "Linh Căn", data.linhCan, "#10b981");
  drawStatBox(ctx, 780, 360, 180, 60, "Công Kích", data.congKich, "#f43f5e");
  drawStatBox(ctx, 780, 450, 180, 60, "Pháp Phòng", data.phapPhong, "#3b82f6");
  drawStatBox(ctx, 780, 540, 180, 60, "Phúc Duyên", data.phucDuyen, "#ec4899");
  drawStatBox(ctx, 780, 630, 180, 60, "Hút Máu", data.hutMau, "#a855f7");

  // Khung trang bị bên dưới (phần code bạn gửi bị cắt ở đây — dựng tiếp cùng style)
  drawStatBox(ctx, 80, 730, 220, 65, "Thần Binh", data.thanBinh, "#ef4444");
  drawStatBox(ctx, 390, 730, 220, 65, "Thánh Y", data.thanhY, "#eab308");
  drawStatBox(ctx, 700, 730, 220, 65, "Hộ Pháp", data.hoPhap, "#22c55e");

  // --- 6. THANH TIẾN TRÌNH ---
  const barX = 40;
  const barW = WIDTH - 80;
  const barH = 40;
  drawProgressBar(ctx, barX, 830, barW, barH, "Sinh Lực (HP)", data.hpCur, data.hpMax, "#dc2626", "#f87171");
  drawProgressBar(ctx, barX, 890, barW, barH, "Linh Khí Tu Vi", data.expCur, data.expMax, "#1d4ed8", "#38bdf8");
  drawProgressBar(ctx, barX, 950, barW, barH, "Thể Lực Thám Hiểm", data.stamCur, data.stamMax, "#c2410c", "#fbbf24");

  const filePath = path.resolve(
    `./assets/temp/tl_profile_charcard_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`,
  );
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, canvas.toBuffer("image/png"));
  return filePath;
}
