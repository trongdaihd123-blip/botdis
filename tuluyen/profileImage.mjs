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

const CHINH_LORE = {
  pham:      { linhCan: "Vô Linh Căn",           theCHat: "Phàm Nhân Thể",     huyetMach: "Phàm Huyết Mạch",   linhCanColor: "#aab4c8", theCHatColor: "#aab4c8", huyetMachColor: "#aab4c8" },
  binh:      { linhCan: "Đơn Linh Căn",          theCHat: "Cường Hóa Thể",     huyetMach: "Nhân Huyết Mạch",  linhCanColor: "#4ade80", theCHatColor: "#4ade80", huyetMachColor: "#4ade80" },
  uu:        { linhCan: "Song Linh Căn",         theCHat: "Tinh Anh Thể",      huyetMach: "Linh Thú Huyết Mạch", linhCanColor: "#60a5fa", theCHatColor: "#a78bfa", huyetMachColor: "#38bdf8" },
  thien_tai: { linhCan: "Tứ Linh Căn",           theCHat: "Thiên Địa Thể",     huyetMach: "Thần Huyết Mạch",  linhCanColor: "#facc15", theCHatColor: "#fb923c", huyetMachColor: "#fbbf24" },
  thien_tu:  { linhCan: "Ngũ Hành Tập Linh Căn", theCHat: "Thượng Thiên Bá Thể", huyetMach: "Kỳ Lân Huyết Mạch", linhCanColor: "#22d3ee", theCHatColor: "#c084fc", huyetMachColor: "#fb7185" },
  thien_co:  { linhCan: "Hỗn Nguyên Linh Căn",   theCHat: "Bất Diệt Thần Thể", huyetMach: "Hoàng Long Huyết Mạch", linhCanColor: "#f87171", theCHatColor: "#fbbf24", huyetMachColor: "#fb923c" },
};

const QUY_LORE = {
  pham:      { linhCan: "Vô Quỷ Căn",            theCHat: "U Minh Thể",       huyetMach: "Âm Huyết Mạch",   linhCanColor: "#9ca3af", theCHatColor: "#9ca3af", huyetMachColor: "#9ca3af" },
  binh:      { linhCan: "Âm Quỷ Căn",            theCHat: "Quỷ Nhân Thể",     huyetMach: "Tam Phẩm U Mạch", linhCanColor: "#a78bfa", theCHatColor: "#a78bfa", huyetMachColor: "#a78bfa" },
  uu:        { linhCan: "Song Âm Quỷ Căn",       theCHat: "Âm Linh Thể",      huyetMach: "Quỷ Ảnh Huyết Mạch", linhCanColor: "#c084fc", theCHatColor: "#22d3ee", huyetMachColor: "#c084fc" },
  thien_tai: { linhCan: "Tứ U Linh Căn",         theCHat: "Vong Linh Thể",    huyetMach: "U Minh Huyết Mạch", linhCanColor: "#818cf8", theCHatColor: "#67e8f9", huyetMachColor: "#a78bfa" },
  thien_tu:  { linhCan: "Ngũ U Linh Căn",        theCHat: "Thái Âm Bá Thể",   huyetMach: "Cửu U Huyết Mạch", linhCanColor: "#67e8f9", theCHatColor: "#c4b5fd", huyetMachColor: "#38bdf8" },
  thien_co:  { linhCan: "Hỗn Độn Quỷ Căn",       theCHat: "Vạn Quỷ Chi Thể",  huyetMach: "U Minh Thần Mạch", linhCanColor: "#e879f9", theCHatColor: "#a5f3fc", huyetMachColor: "#c084fc" },
};

const MA_LORE = {
  pham:      { linhCan: "Vô Ma Căn",             theCHat: "Phàm Nhân Ma Thể",  huyetMach: "Âm Huyết Mạch",    linhCanColor: "#9ca3af", theCHatColor: "#9ca3af", huyetMachColor: "#9ca3af" },
  binh:      { linhCan: "Âm Ma Căn",             theCHat: "Cường Ma Thể",      huyetMach: "Tam Phẩm Huyết Mạch", linhCanColor: "#f87171", theCHatColor: "#f87171", huyetMachColor: "#f87171" },
  uu:        { linhCan: "Song Âm Linh Căn",      theCHat: "Quái Dị Ma Thể",    huyetMach: "Quỷ Huyết Mạch",   linhCanColor: "#e879f9", theCHatColor: "#c026d3", huyetMachColor: "#e879f9" },
  thien_tai: { linhCan: "Tứ Quái Linh Căn",      theCHat: "Ma Vương Thể",      huyetMach: "Huyết Vương Mạch", linhCanColor: "#f43f5e", theCHatColor: "#be123c", huyetMachColor: "#f97316" },
  thien_tu:  { linhCan: "Ma Tiểu Tứ Linh Căn",   theCHat: "Huyết Sát Bá Thể",  huyetMach: "Thiên Ma Huyết Mạch", linhCanColor: "#fb7185", theCHatColor: "#e11d48", huyetMachColor: "#f43f5e" },
  thien_co:  { linhCan: "Nguyên Ma Linh Căn",    theCHat: "Bất Diệt Ma Thể",   huyetMach: "Hưng Ma Huyết Mạch", linhCanColor: "#ef4444", theCHatColor: "#dc2626", huyetMachColor: "#f97316" },
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

// ===== Icons vẽ bằng canvas primitives (không phụ thuộc font emoji) =====
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
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.85);
  ctx.lineTo(x, y + s * 0.85);
  ctx.moveTo(x - s * 0.65, y - s * 0.15);
  ctx.lineTo(x + s * 0.65, y - s * 0.15);
  ctx.stroke();
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
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.3);
  ctx.lineTo(x, y + s * 0.4);
  ctx.stroke();
}

function drawDrop(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.75);
  ctx.bezierCurveTo(x + s * 0.55, y - s * 0.15, x + s * 0.55, y + s * 0.35, x, y + s * 0.7);
  ctx.bezierCurveTo(x - s * 0.55, y + s * 0.35, x - s * 0.55, y - s * 0.15, x, y - s * 0.75);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.45);
  ctx.lineTo(x, y + s * 0.35);
  ctx.stroke();
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

// ===== Nền sáng theo chính/ma đạo =====
function drawBackground(ctx, W, H, isMa) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  if (isMa) {
    grad.addColorStop(0, "#a63a1e");
    grad.addColorStop(0.5, "#8f2136");
    grad.addColorStop(1, "#5c1240");
  } else {
    grad.addColorStop(0, "#2563a8");
    grad.addColorStop(0.5, "#4a3f8f");
    grad.addColorStop(1, "#15607a");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const aura = ctx.createRadialGradient(W / 2, H * 0.28, 0, W / 2, H * 0.28, H * 0.62);
  aura.addColorStop(0, isMa ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.20)");
  aura.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  for (let i = 0; i < 26; i++) {
    const sx = (i * 173) % W;
    const sy = (i * 97 + 40) % H;
    const r = 1 + (i % 3);
    const alpha = 0.08 + ((i * 7) % 4) * 0.03;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFrame(ctx, W, H, isMa) {
  const pad = 14;
  const gold = isMa ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.65)";
  const inner = isMa ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.28)";
  ctx.save();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = isMa ? "rgba(255,200,160,0.8)" : "rgba(255,240,160,0.8)";
  ctx.shadowBlur = 10;
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 22);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = inner;
  ctx.lineWidth = 1;
  roundRect(ctx, pad + 5, pad + 5, W - (pad + 5) * 2, H - (pad + 5) * 2, 18);
  ctx.stroke();
  ctx.restore();

  const corners = [[pad, pad], [W - pad, pad], [pad, H - pad], [W - pad, H - pad]];
  for (const [cx, cy] of corners) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = isMa ? "#ffe3c4" : "#fff3c4";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 8;
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }
}

function drawCard(ctx, x, y, w, h, isMa) {
  roundRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.save();
  roundRect(ctx, x, y, w, h, 14);
  ctx.clip();
  const hi = ctx.createLinearGradient(0, y, 0, y + h);
  hi.addColorStop(0, "rgba(255,255,255,0.22)");
  hi.addColorStop(0.35, "rgba(255,255,255,0)");
  ctx.fillStyle = hi;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function drawChip(ctx, text, x, y, w, h, color, glow) {
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = color;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px GameFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
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

function tierGlow(tier) {
  switch (tier) {
    case "supreme": return "#ec4899";
    case "god": return "#ef4444";
    case "galaxy": return "#a855f7";
    case "legend":
    case "mythic": return "#f59e0b";
    case "epic": return "#3b82f6";
    case "rare": return "#22c55e";
    default: return "#94a3b8";
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
  const isMa = daotam === "ma";
  const isNho = daotam === "nho";
  const isYeu = daotam === "yeu";
  const isLo = daotam === "lo";
  const isQuy = daotam === "quy";
  const loreMap = isMa ? MA_LORE : isQuy ? QUY_LORE : CHINH_LORE;
  const lore = loreMap[talentKey] || loreMap.pham;
  const theChat = THECHAT.find(t => t.id === player.theChat) || THECHAT[0];
  const huyetMach = HUYETMACH.find(h => h.id === player.huyetMach) || HUYETMACH[0];
  const linhCan = LINH_CAN.find(l => l.id === player.linhCan) || LINH_CAN[0];
  const stats = calcStats(player);
  const maxExp = getMaxExp(player.majorRealm, player.minorRealm, player.daotam);
  const expPct = maxExp > 0 ? Math.min(player.exp / maxExp, 1) : 0;
  const realm = getRealmDisplayFull(player);
  const pathLabel = isMa ? "Ma Đạo" : isNho ? "Nho Đạo" : isYeu ? "Yêu Đạo" : isLo ? "Lọ Đạo" : isQuy ? "Quỷ Đạo" : daotam === "phat" ? "Phật Đạo" : "Chính Đạo";
  const pathColor = isMa ? "#ffd9c0" : isNho ? "#cdb4ff" : isYeu ? "#b7e4a0" : isLo ? "#a5f3fc" : isQuy ? "#c4b5fd" : "#ffe9a8";
  const gold = "#fff3c4";
  const goldGlow = isMa ? "#ffb27a" : isNho ? "#b08aff" : isYeu ? "#7ed957" : isLo ? "#22d3ee" : "#ffd66b";

  drawBackground(ctx, W, H, isMa);
  drawFrame(ctx, W, H, isMa);

  // ===== Title =====
  ctx.textAlign = "center";
  ctx.font = "bold 40px GameFont, sans-serif";
  glowText(ctx, "HỒ SƠ TU TIÊN", W / 2, 64, "#ffffff", goldGlow, 22);

  ctx.save();
  ctx.translate(W / 2 - 250, 46);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = gold;
  ctx.shadowColor = goldGlow;
  ctx.shadowBlur = 8;
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();
  ctx.save();
  ctx.translate(W / 2 + 250, 46);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = gold;
  ctx.shadowColor = goldGlow;
  ctx.shadowBlur = 8;
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.shadowColor = goldGlow;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 170, 78);
  ctx.lineTo(W / 2 + 170, 78);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ===== Avatar =====
  const avatarX = W / 2, avatarY = 176, avatarR = 80;
  const aura = ctx.createRadialGradient(avatarX, avatarY, avatarR * 0.4, avatarX, avatarY, avatarR * 2.1);
  aura.addColorStop(0, isMa ? "rgba(255,220,180,0.85)" : "rgba(255,240,180,0.85)");
  aura.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR * 2.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR + 9, 0, Math.PI * 2);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 5;
  ctx.shadowColor = goldGlow;
  ctx.shadowBlur = 22;
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR + 3, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
  ctx.clip();
  if (avatarUrl) {
    try {
      const img = await loadImage(avatarUrl);
      ctx.drawImage(img, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
    } catch {
      ctx.fillStyle = isMa ? "#6d1b34" : "#224f8f";
      ctx.fillRect(avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
    }
  } else {
    ctx.fillStyle = isMa ? "#6d1b34" : "#224f8f";
    ctx.fillRect(avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
  }
  ctx.restore();

  // ===== Name + realm =====
  ctx.textAlign = "center";
  ctx.font = "bold 34px GameFont, sans-serif";
  glowText(ctx, username || "Người Chơi", W / 2, 296, "#ffffff", "rgba(255,255,255,0.6)", 12);

  ctx.font = "italic 18px GameFont, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillText(`Cảnh Giới: ${realm}`, W / 2, 330);

  ctx.font = "16px GameFont, sans-serif";
  ctx.fillStyle = pathColor;
  ctx.fillText(`Đạo Tâm: ${pathLabel}   ·   Linh Thạch: ${formatNumber(player.spiritStones)} LT`, W / 2, 356);
  
  // Hiển thị xương, soul, fire
  ctx.font = "14px GameFont, sans-serif";
  ctx.fillStyle = "#e0e0e0";
  const bones = player.bones || 0;
  const soul = player.soul || 0;
  const fire = player.fire || 0;
  if (bones > 0 || soul > 0 || fire > 0) {
    ctx.fillText(`🦴 Xương: ${bones}   👻 Soul: ${soul}   🔥 Fire: ${fire}`, W / 2, 372);
  }

  const primeLv = getPrimeLevel(player.donated || 0);
  const primeObj = PRIME.find(pr => pr.level === primeLv);
  if (primeLv > 0 && primeObj) {
    ctx.font = "bold 14px GameFont, sans-serif";
    ctx.fillStyle = "#ffd66b";
    glowText(ctx, `👑 PRIME ${primeLv} · 🏅 "${primeObj.title}"`, W / 2, 374, "#ffe9a8", "#ffb703", 12);
  }

  // ===== Stat cards =====
  const gridY = 396;
  const pad = 30;
  const colW = (W - pad * 2 - 14) / 2;
  const rowH = 92;
  const rowGap = 12;

  const cards = [
    { label: "LỰC CHIẾN",  value: formatNumber(stats.battlePower), color: "#ffd66b", glow: "#ff9d2e", icon: "sword" },
    { label: "LINH CĂN",   value: linhCan.name,                    color: tierColor(linhCan.tier), glow: tierGlow(linhCan.tier), icon: "gem" },
    { label: "THỂ CHẤT",   value: theChat.name,                    color: tierColor(theChat.tier), glow: tierGlow(theChat.tier), icon: "shield" },
    { label: "HUYẾT MẠCH", value: huyetMach.name,                  color: tierColor(huyetMach.tier), glow: tierGlow(huyetMach.tier), icon: "drop" },
    { label: "NGỘ TÍNH",   value: String(player.ngoTinh),          color: "#d8b4fe", glow: "#a855f7", icon: "spark" },
    { label: "PHÚC DUYÊN", value: String(player.phucDuyen),        color: "#86efac", glow: "#22c55e", icon: "clover" },
  ];

  for (let i = 0; i < cards.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = pad + col * (colW + 14);
    const cy = gridY + row * (rowH + rowGap);

    drawCard(ctx, cx, cy, colW, rowH, isMa);

    const bx = cx + 38, by = cy + rowH / 2;
    const badge = ctx.createRadialGradient(bx, by, 4, bx, by, 26);
    badge.addColorStop(0, "#ffffff");
    badge.addColorStop(0.35, cards[i].color);
    badge.addColorStop(1, cards[i].glow);
    ctx.save();
    ctx.shadowColor = cards[i].glow;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(bx, by, 26, 0, Math.PI * 2);
    ctx.fillStyle = badge;
    ctx.fill();
    ctx.restore();
    drawStatIcon(ctx, cards[i].icon, bx, by, "#ffffff");

    ctx.textAlign = "left";
    ctx.font = "bold 14px GameFont, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(cards[i].label, cx + 76, cy + 30);

    ctx.font = "bold 25px GameFont, sans-serif";
    const maxValW = colW - 76 - 16;
    if (ctx.measureText(cards[i].value).width > maxValW) {
      ctx.font = "bold 16px GameFont, sans-serif";
    }
    outlinedText(ctx, cards[i].value, cx + 76, cy + rowH - 26, cards[i].color, "rgba(0,0,0,0.7)", 4);
  }

  // ===== EXP =====
  const expY = gridY + 3 * (rowH + rowGap) + 14;
  drawCard(ctx, pad, expY, W - pad * 2, 92, isMa);

  ctx.textAlign = "center";
  ctx.font = "bold 15px GameFont, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillText("TIẾN ĐỘ ĐỘT PHÁ", W / 2, expY + 24);

  const barX = 54, barY = expY + 34, barW = W - 108, barH = 26;
  roundRect(ctx, barX, barY, barW, barH, 13);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const fillW = Math.max(26, expPct * barW);
  const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  if (isMa) {
    barGrad.addColorStop(0, "#ffb84d");
    barGrad.addColorStop(0.5, "#ff7a4d");
    barGrad.addColorStop(1, "#ff4d6d");
  } else {
    barGrad.addColorStop(0, "#ffe08a");
    barGrad.addColorStop(0.5, "#ffcc33");
    barGrad.addColorStop(1, "#ffb703");
  }
  ctx.save();
  ctx.shadowColor = isMa ? "#ff6a3d" : "#ffd66b";
  ctx.shadowBlur = 12;
  roundRect(ctx, barX, barY, fillW, barH, 13);
  ctx.fillStyle = barGrad;
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, barX, barY, fillW, barH, 13);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(barX, barY + 3, fillW, 6);
  ctx.restore();

  ctx.font = "bold 14px GameFont, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = expPct > 0.5 ? "#4a2a00" : "#ffffff";
  ctx.shadowColor = expPct > 0.5 ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 4;
  ctx.fillText(`${formatNumber(player.exp)} / ${formatNumber(maxExp)}`, barX + barW / 2, barY + 18);
  ctx.shadowBlur = 0;

  ctx.font = "bold 13px GameFont, sans-serif";
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillText(`${Math.min(Math.floor(expPct * 100), 100)}%`, W - 44, expY + 84);

  // ===== Status =====
  const statusY = expY + 104;
  drawCard(ctx, pad, statusY, W - pad * 2, 116, isMa);

  ctx.textAlign = "center";
  ctx.font = "bold 13px GameFont, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText("TRẠNG THÁI HIỆN TẠI", W / 2, statusY + 22);

  if (player.beguan && player.beguan.startedAt) {
    const elapsedMs = Date.now() - player.beguan.startedAt;
    const elapsedMin = Math.floor(elapsedMs / 60000);
    const limit = 60;
    const cappedMin = Math.min(elapsedMin, limit);
    const display = elapsedMin >= limit ? `${limit}/${limit}p (TỐI ĐA)` : `${cappedMin}/${limit}p`;

    ctx.font = "bold 22px GameFont, sans-serif";
    glowText(ctx, "ĐANG BẾ QUAN TU LUYỆN", W / 2, statusY + 54, "#ffffff", goldGlow, 16);
    ctx.font = "bold 27px GameFont, sans-serif";
    glowText(ctx, `⏰ ${display}`, W / 2, statusY + 88, "#ffe08a", "#ffb703", 14);
    ctx.font = "14px GameFont, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("Dùng .tl stop để thu hoạch thưởng", W / 2, statusY + 110);
  } else if (player.inSecretRealm) {
    const elapsedMs = Date.now() - (player.secretRealmEnteredAt || Date.now());
    const elapsedMin = Math.floor(elapsedMs / 60000);
    const dungeon = SECRET_REALMS.find(sr => sr.id === player.currentSecretRealmId);
    const realmIndex = dungeon ? dungeon.requiredRealm : (player.majorRealm || 0);
    const limit = 20 * (realmIndex + 1);
    const cappedMin = Math.min(elapsedMin, limit);
    const display = elapsedMin >= limit ? `${limit}/${limit}p (TỐI ĐA)` : `${cappedMin}/${limit}p`;

    ctx.font = "bold 22px GameFont, sans-serif";
    glowText(ctx, "ĐANG TU LUYỆN BÍ CẢNH", W / 2, statusY + 54, "#ffffff", goldGlow, 16);
    ctx.font = "bold 27px GameFont, sans-serif";
    glowText(ctx, `⏰ ${display}`, W / 2, statusY + 88, "#ffe08a", "#ffb703", 14);
    ctx.font = "14px GameFont, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("Dùng .tl bc về để nhận thưởng", W / 2, statusY + 110);
  } else {
    ctx.font = "bold 28px GameFont, sans-serif";
    glowText(ctx, "ĐANG RẢNH RỖI", W / 2, statusY + 62, "#ffffff", goldGlow, 14);
    ctx.font = "16px GameFont, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillText(`Thể Lực: ${player.stamina ?? 0}/${player.maxStamina ?? 50}`, W / 2, statusY + 96);
  }

  const filePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), `../assets/temp/tl_profile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, canvas.toBuffer("image/png"));
  return filePath;
}

const DAO_LABELS = { chinh: "CHÍNH", ma: "MA", nho: "NHO", yeu: "YÊU", lo: "LỌ", quy: "QUỶ", phat: "PHẬT" };
const DAO_COLORS = { chinh: "#ffe9a8", ma: "#f87171", nho: "#cdb4ff", yeu: "#86efac", lo: "#a5f3fc", quy: "#c4b5fd", phat: "#fcd34d" };

function daoLabel(daotam) {
  return DAO_LABELS[daotam] || "CHÍNH";
}

function daoColor(daotam) {
  return DAO_COLORS[daotam] || DAO_COLORS.chinh;
}

export async function generateTopRanking({ entries }) {
  const W = 720;
  const rowH = 62;
  const headH = 118;
  const footH = 34;
  const H = headH + entries.length * rowH + footH;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "alphabetic";

  drawBackground(ctx, W, H, false);
  drawFrame(ctx, W, H, false);

  ctx.textAlign = "center";
  ctx.font = "bold 38px GameFont, sans-serif";
  glowText(ctx, "🏆 BẢNG XẾP HẠNG TU TIÊN", W / 2, 58, "#ffffff", "#ffd66b", 22);
  ctx.font = "bold 16px GameFont, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(`TOP ${entries.length} TU SĨ CAO CẤP NHẤT TOÀN CÁC ĐẠO`, W / 2, 92);

  const rankColors = ["#ffd700", "#d9d9d9", "#cd7f32"];
  const rankGlows = ["#f59e0b", "#9ca3af", "#b45309"];

  entries.forEach((e, i) => {
    const y = headH + i * rowH;
    const x0 = 28, x1 = W - 28;
    drawCard(ctx, x0, y, x1 - x0, rowH - 6, false);

    const rank = i + 1;
    ctx.save();
    ctx.shadowBlur = rank <= 3 ? 10 : 0;
    ctx.shadowColor = rank <= 3 ? rankGlows[rank - 1] : "#000";
    ctx.font = "bold 24px GameFont, sans-serif";
    ctx.fillStyle = rank <= 3 ? rankColors[rank - 1] : "rgba(255,255,255,0.65)";
    ctx.textAlign = "center";
    ctx.fillText(String(rank), x0 + 30, y + 32);
    ctx.restore();

    let name = e.username || "Người Chơi";
    ctx.font = "bold 17px GameFont, sans-serif";
    if (ctx.measureText(name).width > 200) {
      while (ctx.measureText(name + "…").width > 200) name = name.slice(0, -1);
      name += "…";
    }
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(name, x0 + 62, y + 25);

    const realm = getRealmDisplayFull(e.player);
    ctx.font = "13px GameFont, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(realm, x0 + 62, y + 46);

    const bp = formatNumber(calcStats(e.player).battlePower);
    ctx.font = "bold 14px GameFont, sans-serif";
    ctx.fillStyle = "#ffd66b";
    ctx.textAlign = "right";
    ctx.fillText(`⚔ ${bp}`, x1 - 118, y + 24);

    const maxExp = getMaxExp(e.player.majorRealm, e.player.minorRealm, e.player.daotam);
    const pct = maxExp > 0 ? Math.min(e.player.exp / maxExp, 1) : 0;
    ctx.font = "11px GameFont, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(`${formatNumber(e.player.exp)} EXP (${Math.floor(pct * 100)}%) · 🏅 ${e.player.pkPoints || 0} PK`, x1 - 118, y + 46);

    const dl = daoLabel(e.player.daotam);
    const dc = daoColor(e.player.daotam);
    const cw = 66, ch = 22;
    const cxp = x1 - 92, cyp = y + (rowH - 6) / 2 - ch / 2 + 2;
    roundRect(ctx, cxp, cyp, cw, ch, ch / 2);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = dc;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = dc;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = dc;
    ctx.font = "bold 12px GameFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(dl, cxp + cw / 2, cyp + ch / 2 + 4);
  });

  ctx.textAlign = "center";
  ctx.font = "13px GameFont, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("🏆 Chúc đạo hữu tu luyện thăng tiến!", W / 2, H - 10);

  const filePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), `../assets/temp/tl_top_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, canvas.toBuffer("image/png"));
  return filePath;
}