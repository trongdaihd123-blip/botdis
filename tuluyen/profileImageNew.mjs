import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { TALENTS, THECHAT, HUYETMACH, LINH_CAN, getRealmDisplay, getRealmDisplayFull, getMaxExp, calcStats, formatNumber, SECRET_REALMS, PRIME, getPrimeLevel } from "./constants.mjs";

const NOTO_SANS = "/usr/share/fonts/truetype/NotoSans.ttf";
const DEJAVU_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
const DEJAVU_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
if (fs.existsSync(NOTO_SANS)) registerFont(NOTO_SANS, { family: "GameFont" });
else if (fs.existsSync(DEJAVU_BOLD)) registerFont(DEJAVU_BOLD, { family: "GameFont" });
if (fs.existsSync(DEJAVU_REG) && !fs.existsSync(NOTO_SANS)) registerFont(DEJAVU_REG, { family: "GameFont" });

const DAO_THEME = {
  chinh: { accent: "#ffd66b", glow: "#ffb703", bg1: "#0a0e1a", bg2: "#1a1033", title: "#ffe9a8", aura: "rgba(255,214,107,0.16)" },
  ma:    { accent: "#ff6a5d", glow: "#ff3d3d", bg1: "#140a0e", bg2: "#2b0f1e", title: "#ffc9c0", aura: "rgba(255,106,93,0.16)" },
  nho:   { accent: "#c084fc", glow: "#a855f7", bg1: "#0f0a1a", bg2: "#1e1038", title: "#e9d5ff", aura: "rgba(192,132,252,0.16)" },
  yeu:   { accent: "#86efac", glow: "#22c55e", bg1: "#08140d", bg2: "#0e2b1c", title: "#d1fae5", aura: "rgba(134,239,172,0.16)" },
  lo:    { accent: "#22d3ee", glow: "#06b6d4", bg1: "#08121a", bg2: "#0f2b3a", title: "#cffafe", aura: "rgba(34,211,238,0.16)" },
  quy:   { accent: "#c084fc", glow: "#8b5cf6", bg1: "#0c0716", bg2: "#231040", title: "#e9d5ff", aura: "rgba(139,92,246,0.18)" },
  phat:  { accent: "#fcd34d", glow: "#f59e0b", bg1: "#150e05", bg2: "#3a2408", title: "#fef3c7", aura: "rgba(252,211,77,0.16)" },
};

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

function glowText(ctx, text, x, y, color, glowColor, blur = 16) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = blur;
  ctx.fillText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}

function outlinedText(ctx, text, x, y, color, outline = "rgba(0,0,0,0.75)", lineWidth = 4) {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.strokeStyle = outline;
  ctx.lineWidth = lineWidth;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawSword(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.22, y + s * 0.12);
  ctx.lineTo(x - s * 0.22, y + s * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - s * 0.5, y + s * 0.08, s, s * 0.16);
  ctx.fillRect(x - s * 0.1, y + s * 0.24, s * 0.2, s * 0.32);
}

function drawGem(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.85);
  ctx.lineTo(x + s * 0.65, y - s * 0.15);
  ctx.lineTo(x + s * 0.35, y + s * 0.85);
  ctx.lineTo(x - s * 0.35, y + s * 0.85);
  ctx.lineTo(x - s * 0.65, y - s * 0.15);
  ctx.closePath();
  ctx.fill();
}

function drawShield(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.6);
  ctx.lineTo(x + s * 0.55, y - s * 0.6);
  ctx.lineTo(x + s * 0.5, y + s * 0.1);
  ctx.quadraticCurveTo(x + s * 0.3, y + s * 0.45, x, y + s * 0.6);
  ctx.quadraticCurveTo(x - s * 0.3, y + s * 0.45, x - s * 0.5, y + s * 0.1);
  ctx.lineTo(x - s * 0.55, y - s * 0.6);
  ctx.closePath();
  ctx.fill();
}

function drawDrop(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.75);
  ctx.bezierCurveTo(x + s * 0.55, y - s * 0.15, x + s * 0.55, y + s * 0.35, x, y + s * 0.7);
  ctx.bezierCurveTo(x - s * 0.55, y + s * 0.35, x - s * 0.55, y - s * 0.15, x, y - s * 0.75);
  ctx.closePath();
  ctx.fill();
}

function drawSpark(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.13, y - s * 0.13);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x + s * 0.13, y + s * 0.13);
  ctx.lineTo(x, y + s);
  ctx.lineTo(x - s * 0.13, y + s * 0.13);
  ctx.lineTo(x - s, y);
  ctx.lineTo(x - s * 0.13, y - s * 0.13);
  ctx.closePath();
  ctx.fill();
}

function drawClover(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  const r = s * 0.42;
  for (const a of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
  ctx.fill();
}

function drawStatIcon(ctx, icon, x, y, color) {
  const s = 16;
  switch (icon) {
    case "sword": drawSword(ctx, x, y, s, color); break;
    case "gem": drawGem(ctx, x, y, s, color); break;
    case "shield": drawShield(ctx, x, y, s, color); break;
    case "drop": drawDrop(ctx, x, y, s, color); break;
    case "spark": drawSpark(ctx, x, y, s, color); break;
    case "clover": drawClover(ctx, x, y, s, color); break;
    default: drawSpark(ctx, x, y, s, color);
  }
}

function tierColor(tier) {
  switch (tier) {
    case "supreme": return "#f472b6";
    case "god": return "#f87171";
    case "galaxy": return "#c084fc";
    case "legend":
    case "mythic": return "#facc15";
    case "epic": return "#60a5fa";
    case "rare": return "#4ade80";
    default: return "#aab4c8";
  }
}

function hexPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 3;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawBackground(ctx, W, H, theme) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, theme.bg1);
  grad.addColorStop(0.55, theme.bg2);
  grad.addColorStop(1, theme.bg1);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const nebula = ctx.createRadialGradient(W / 2, H * 0.26, 0, W / 2, H * 0.26, H * 0.62);
  nebula.addColorStop(0, theme.aura);
  nebula.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  for (let i = 0; i < 90; i++) {
    const sx = (i * 211 + 47) % W;
    const sy = (i * 137 + 23) % H;
    const r = i % 4 === 0 ? 1.8 : i % 3 === 0 ? 1.1 : 0.7;
    const alpha = 0.05 + ((i * 13) % 5) * 0.04;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFrame(ctx, W, H, theme) {
  const pad = 16;
  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 2;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 12;
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 20);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  roundRect(ctx, pad + 6, pad + 6, W - (pad + 6) * 2, H - (pad + 6) * 2, 16);
  ctx.stroke();
  ctx.restore();

  const corners = [[pad, pad], [W - pad, pad], [pad, H - pad], [W - pad, H - pad]];
  for (const [cx, cy] of corners) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = theme.accent;
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 10;
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  }
}

function drawSegmentBar(ctx, x, y, segCount, segW, gap, h, pct, colors) {
  const full = Math.floor(pct * segCount);
  for (let i = 0; i < segCount; i++) {
    const sx = x + i * (segW + gap);
    roundRect(ctx, sx, y, segW, h, h / 2);
    if (i < full) {
      ctx.save();
      ctx.shadowColor = colors[i % colors.length];
      ctx.shadowBlur = 8;
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.fill();
    }
  }
}

export async function generateProfileCard({ player, username, avatarUrl }) {
  const W = 700, H = 950;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "alphabetic";

  const talentKey = (player.talent in TALENTS) ? player.talent : "pham";
  const talent = TALENTS[talentKey] || TALENTS.pham;
  const daotam = player.daotam || "chinh";
  const theme = DAO_THEME[daotam] || DAO_THEME.chinh;
  const theChat = THECHAT.find(t => t.id === player.theChat) || THECHAT[0];
  const huyetMach = HUYETMACH.find(h => h.id === player.huyetMach) || HUYETMACH[0];
  const linhCan = LINH_CAN.find(l => l.id === player.linhCan) || LINH_CAN[0];
  const stats = calcStats(player);
  const maxExp = getMaxExp(player.majorRealm, player.minorRealm, player.daotam);
  const expPct = maxExp > 0 ? Math.min(player.exp / maxExp, 1) : 0;
  const realm = getRealmDisplayFull(player);
  const pathLabel = daotam === "ma" ? "Ma Đạo" : daotam === "nho" ? "Nho Đạo" : daotam === "yeu" ? "Yêu Đạo" : daotam === "lo" ? "Lọ Đạo" : daotam === "quy" ? "Quỷ Đạo" : daotam === "phat" ? "Phật Đạo" : "Chính Đạo";

  drawBackground(ctx, W, H, theme);
  drawFrame(ctx, W, H, theme);

  // ===== Title =====
  ctx.textAlign = "center";
  ctx.font = "bold 38px GameFont, sans-serif";
  glowText(ctx, "HỒ SƠ ĐẠO HỮU", W / 2, 58, "#ffffff", theme.glow, 20);

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 190, 72);
  ctx.lineTo(W / 2 + 190, 72);
  ctx.stroke();

  ctx.save();
  ctx.translate(W / 2 - 190, 72);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = theme.accent;
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();
  ctx.save();
  ctx.translate(W / 2 + 190, 72);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = theme.accent;
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();

  // ===== Hexagon Avatar =====
  const avX = W / 2, avY = 176, avR = 84;
  const aura = ctx.createRadialGradient(avX, avY, avR * 0.3, avX, avY, avR * 2.4);
  aura.addColorStop(0, theme.aura);
  aura.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(avX, avY, avR * 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  hexPath(ctx, avX, avY, avR + 10);
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 5;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 24;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  hexPath(ctx, avX, avY, avR + 4);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  hexPath(ctx, avX, avY, avR);
  ctx.clip();
  if (avatarUrl) {
    try {
      const img = await loadImage(avatarUrl);
      ctx.drawImage(img, avX - avR, avY - avR, avR * 2, avR * 2);
    } catch {
      ctx.fillStyle = theme.bg2;
      ctx.fillRect(avX - avR, avY - avR, avR * 2, avR * 2);
    }
  } else {
    ctx.fillStyle = theme.bg2;
    ctx.fillRect(avX - avR, avY - avR, avR * 2, avR * 2);
  }
  ctx.restore();

  // vertex diamonds
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 3;
    const vx = avX + (avR + 10) * Math.cos(a);
    const vy = avY + (avR + 10) * Math.sin(a);
    ctx.save();
    ctx.translate(vx, vy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = theme.accent;
    ctx.fillRect(-3.5, -3.5, 7, 7);
    ctx.restore();
  }

  // ===== Name + Realm =====
  ctx.textAlign = "center";
  ctx.font = "bold 33px GameFont, sans-serif";
  glowText(ctx, username || "Người Chơi", W / 2, 296, "#ffffff", "rgba(255,255,255,0.55)", 10);

  ctx.font = "bold 16px GameFont, sans-serif";
  const realmText = `✦ ${realm} ✦`;
  const rw = ctx.measureText(realmText).width + 44;
  const rx = W / 2 - rw / 2, ry = 312;
  roundRect(ctx, rx, ry, rw, 30, 15);
  ctx.fillStyle = "rgba(0,0,0,0.30)";
  ctx.fill();
  ctx.strokeStyle = theme.accent;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = theme.title;
  ctx.fillText(realmText, W / 2, ry + 21);

  ctx.font = "15px GameFont, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(`Đạo Tâm: ${pathLabel}    •    Linh Thạch: ${formatNumber(player.spiritStones)} LT`, W / 2, 366);
  
  // Hiển thị xương, soul, fire
  ctx.font = "13px GameFont, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  const bones = player.bones || 0;
  const soul = player.soul || 0;
  const fire = player.fire || 0;
  if (bones > 0 || soul > 0 || fire > 0) {
    ctx.fillText(`🦴 ${bones}   👻 ${soul}   🔥 ${fire}`, W / 2, 380);
  }

  const primeLv = getPrimeLevel(player.donated || 0);
  const primeObj = PRIME.find(pr => pr.level === primeLv);
  if (primeLv > 0 && primeObj) {
    ctx.font = "bold 14px GameFont, sans-serif";
    ctx.fillStyle = "#ffd66b";
    glowText(ctx, `👑 PRIME ${primeLv} · 🏅 "${primeObj.title}"`, W / 2, 384, "#ffe9a8", "#ffb703", 12);
  }

  // ===== Stat cards =====
  const gridY = 396;
  const pad = 30;
  const colW = (W - pad * 2 - 14) / 2;
  const rowH = 88;
  const rowGap = 14;

  const cards = [
    { label: "LỰC CHIẾN",  value: formatNumber(stats.battlePower), color: theme.accent, icon: "sword" },
    { label: "LINH CĂN",   value: linhCan.name,                    color: tierColor(linhCan.tier), icon: "gem" },
    { label: "THỂ CHẤT",   value: theChat.name,                    color: tierColor(theChat.tier), icon: "shield" },
    { label: "HUYẾT MẠCH", value: huyetMach.name,                  color: tierColor(huyetMach.tier), icon: "drop" },
    { label: "NGỘ TÍNH",   value: String(player.ngoTinh),          color: "#c084fc", icon: "spark" },
    { label: "PHÚC DUYÊN", value: String(player.phucDuyen),        color: "#86efac", icon: "clover" },
  ];

  for (let i = 0; i < cards.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = pad + col * (colW + 14);
    const cy = gridY + row * (rowH + rowGap);

    roundRect(ctx, cx, cy, colW, rowH, 14);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    roundRect(ctx, cx, cy, 7, rowH, 3.5);
    ctx.fillStyle = cards[i].color;
    ctx.fill();

    const bx = cx + 34, by = cy + rowH / 2;
    ctx.save();
    ctx.shadowColor = cards[i].color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(bx, by, 22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fill();
    ctx.restore();
    drawStatIcon(ctx, cards[i].icon, bx, by, cards[i].color);

    ctx.textAlign = "left";
    ctx.font = "bold 12px GameFont, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(cards[i].label, cx + 66, cy + 26);

    ctx.font = "bold 22px GameFont, sans-serif";
    const maxValW = colW - 66 - 14;
    if (ctx.measureText(cards[i].value).width > maxValW) {
      ctx.font = "bold 15px GameFont, sans-serif";
    }
    outlinedText(ctx, cards[i].value, cx + 66, cy + rowH - 18, cards[i].color, "rgba(0,0,0,0.7)", 4);
  }

  // ===== EXP segmented =====
  const expY = gridY + 3 * (rowH + rowGap) + 16;
  roundRect(ctx, pad, expY, W - pad * 2, 112, 16);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.font = "bold 14px GameFont, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText("TIẾN ĐỘ ĐỘT PHÁ", W / 2, expY + 26);

  const segCount = 10, segW = 50, segGap = 6, segH = 24;
  const totalW = segCount * segW + (segCount - 1) * segGap;
  const segX = W / 2 - totalW / 2, segY = expY + 42;
  const segColors = [theme.accent, theme.glow, theme.accent];
  drawSegmentBar(ctx, segX, segY, segCount, segW, segGap, segH, expPct, segColors);

  ctx.font = "bold 15px GameFont, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 4;
  ctx.fillText(`${formatNumber(player.exp)} / ${formatNumber(maxExp)}`, W / 2, expY + 92);
  ctx.shadowBlur = 0;

  ctx.font = "bold 13px GameFont, sans-serif";
  ctx.fillStyle = theme.title;
  ctx.fillText(`${Math.min(Math.floor(expPct * 100), 100)}%`, W - 44, expY + 92);

  // ===== Status =====
  const statusY = expY + 128;
  roundRect(ctx, pad, statusY, W - pad * 2, 100, 16);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.textAlign = "center";
  if (player.beguan && player.beguan.startedAt) {
    const elapsedMs = Date.now() - player.beguan.startedAt;
    const elapsedMin = Math.floor(elapsedMs / 60000);
    const limit = 60;
    const cappedMin = Math.min(elapsedMin, limit);
    const display = elapsedMin >= limit ? `${limit}/${limit}p (TỐI ĐA)` : `${cappedMin}/${limit}p`;

    ctx.font = "bold 21px GameFont, sans-serif";
    glowText(ctx, "ĐANG BẾ QUAN TU LUYỆN", W / 2, statusY + 36, "#ffffff", theme.glow, 14);
    ctx.font = "bold 24px GameFont, sans-serif";
    glowText(ctx, `⏰ ${display}`, W / 2, statusY + 72, theme.title, theme.glow, 10);
    ctx.font = "13px GameFont, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(".tl stop để thu hoạch thưởng", W / 2, statusY + 92);
  } else if (player.inSecretRealm) {
    const elapsedMs = Date.now() - (player.secretRealmEnteredAt || Date.now());
    const elapsedMin = Math.floor(elapsedMs / 60000);
    const dungeon = SECRET_REALMS.find(sr => sr.id === player.currentSecretRealmId);
    const realmIndex = dungeon ? dungeon.requiredRealm : (player.majorRealm || 0);
    const limit = 20 * (realmIndex + 1);
    const cappedMin = Math.min(elapsedMin, limit);
    const display = elapsedMin >= limit ? `${limit}/${limit}p (TỐI ĐA)` : `${cappedMin}/${limit}p`;

    ctx.font = "bold 21px GameFont, sans-serif";
    glowText(ctx, "ĐANG TU LUYỆN BÍ CẢNH", W / 2, statusY + 36, "#ffffff", theme.glow, 14);
    ctx.font = "bold 24px GameFont, sans-serif";
    glowText(ctx, `⏰ ${display}`, W / 2, statusY + 72, theme.title, theme.glow, 10);
    ctx.font = "13px GameFont, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(".tl bc về để nhận thưởng", W / 2, statusY + 92);
  } else {
    ctx.font = "bold 24px GameFont, sans-serif";
    glowText(ctx, "ĐANG RẢNH RỖI", W / 2, statusY + 38, "#ffffff", theme.glow, 12);
    ctx.font = "bold 17px GameFont, sans-serif";
    ctx.fillStyle = theme.title;
    ctx.fillText(`Thể Lực: ${player.stamina ?? 0}/${player.maxStamina ?? 50}`, W / 2, statusY + 72);
    ctx.font = "13px GameFont, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(".tl bc di — tiến vào bí cảnh tu luyện", W / 2, statusY + 92);
  }

  const filePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), `../assets/temp/tl_profile_new_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, canvas.toBuffer("image/png"));
  return filePath;
}
