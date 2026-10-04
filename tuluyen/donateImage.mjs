import { createCanvas } from "canvas";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { DONATE_PACKAGES, DONATE_OFFERS, DONATE_MILESTONES, DONATE_COMBOS, PRIME, formatNumber } from "./constants.mjs";

const W = 640;
const PAD = 22;
const CARD_H = 92;
const CARD_GAP = 10;

const GOLD = "#ffd66b";
const GOLD_GLOW = "#ffb703";

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

function drawStars(ctx, W, H, seed = 0) {
  for (let i = 0; i < 42; i++) {
    const x = ((i * 137 + seed * 31) % 587) + 14;
    const y = ((i * 211 + seed * 17) % 523) + 16;
    const r = 0.6 + ((i * 7) % 10) / 9;
    ctx.globalAlpha = 0.18 + ((i * 13) % 5) / 12;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawCard(ctx, x, y, w, h, hot) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  if (hot) {
    grad.addColorStop(0, "rgba(255,176,52,0.22)");
    grad.addColorStop(1, "rgba(120,53,15,0.28)");
  } else {
    grad.addColorStop(0, "rgba(255,255,255,0.09)");
    grad.addColorStop(1, "rgba(255,255,255,0.04)");
  }
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = hot ? "rgba(255,190,80,0.85)" : "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

export async function generateDonateImage({ donated = 0, username = "", milestones = [], prime = 0 } = {}) {
  const rows = DONATE_PACKAGES.length;
  const cardsH = rows * (CARD_H + CARD_GAP);
  const pkTitleH = 30;
  const comboStart = 208 + pkTitleH + cardsH + 12;
  const comboH = 54 + DONATE_COMBOS.length * 52;
  const milStart = comboStart + comboH + 18;
  const milH = 52 + DONATE_MILESTONES.length * 28;
  const offersStart = milStart + milH + 18;
  const offersH = 64 + DONATE_OFFERS.length * 26;
  const H = offersStart + offersH + 70;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "alphabetic";

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0b1026");
  bg.addColorStop(0.5, "#111a3f");
  bg.addColorStop(1, "#090d1f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  drawStars(ctx, W, H, 7);

  ctx.textAlign = "center";
  ctx.font = "bold 38px GameFont, sans-serif";
  glowText(ctx, "CƠ DUYÊN TU TIÊN", W / 2, 66, "#ffffff", GOLD_GLOW, 22);
  ctx.font = "15px GameFont, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText("BẢNG GIÁ NẠP LINH THẠCH & ƯU ĐÃI", W / 2, 92);

  ctx.font = "14px GameFont, sans-serif";
  ctx.fillStyle = GOLD;
  ctx.fillText("💎 10.000đ = 50.000.000 Linh Thạch", W / 2, 118);

  ctx.font = "bold 16px GameFont, sans-serif";
  ctx.fillStyle = "#a78bfa";
  glowText(ctx, `💰 Cơ duyên của ${username || "bạn"}: ${formatNumber(donated)}đ`, W / 2, 142, "#c4b5fd", "#8b5cf6", 12);
  ctx.font = "bold 13px GameFont, sans-serif";
  ctx.fillStyle = "#ffd66b";
  glowText(ctx, prime > 0 ? `👑 PRIME ${prime}` : "👑 Chưa có PRIME", W / 2, 160, GOLD, GOLD_GLOW, 10);
  const primeObj = PRIME.find(pr => pr.level === prime);
  if (prime > 0 && primeObj) {
    ctx.font = "13px GameFont, sans-serif";
    ctx.fillStyle = "#c084fc";
    ctx.fillText(`🏅 Danh hiệu "${primeObj.title}" — +${primeObj.statPct}% toàn chỉ số, +${primeObj.atkPct}% ATK`, W / 2, 178);
  }

  ctx.strokeStyle = "rgba(255,214,107,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, 190);
  ctx.lineTo(W - PAD, 190);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.font = "bold 16px GameFont, sans-serif";
  ctx.fillStyle = "#ffd66b";
  ctx.fillText("💰 GÓI NẠP LINH THẠCH (admin trao tay)", PAD + 18, 234);

  let y = 208 + pkTitleH;
  for (const p of DONATE_PACKAGES) {
    const x = PAD;
    const w = W - PAD * 2;
    drawCard(ctx, x, y, w, CARD_H, p.hot);

    if (p.hot) {
      ctx.font = "bold 12px GameFont, sans-serif";
      ctx.fillStyle = "#ff7b00";
      ctx.textAlign = "right";
      ctx.fillText("🔥 HOT", x + w - 14, y + 22);
    }

    ctx.textAlign = "left";
    ctx.font = "bold 22px GameFont, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${p.emoji} ${p.name}`, x + 20, y + 34);

    ctx.font = "14px GameFont, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(`${formatNumber(p.price)}đ`, x + 20, y + 60);

    ctx.textAlign = "right";
    ctx.font = "bold 24px GameFont, sans-serif";
    if (p.stones > 0) {
      ctx.fillStyle = GOLD;
      glowText(ctx, `+${formatNumber(p.stones)} LT`, x + w - 18, y + 38, GOLD, GOLD_GLOW, 10);
    } else if (p.phithang) {
      ctx.fillStyle = "#a78bfa";
      glowText(ctx, `🌌 +${p.phithang} Phi Thăng`, x + w - 18, y + 38, "#c4b5fd", "#8b5cf6", 10);
    }

    if (p.items) {
      ctx.font = "13px GameFont, sans-serif";
      ctx.fillStyle = "#ff8fa3";
      ctx.fillText(`🎁 ${p.items}`, x + w - 18, y + 64);
    }

    y += CARD_H + CARD_GAP;
  }

  // ── Combo ──
  drawCard(ctx, PAD, y, W - PAD * 2, comboH, true);
  ctx.textAlign = "left";
  ctx.font = "bold 17px GameFont, sans-serif";
  ctx.fillStyle = "#ffd66b";
  ctx.fillText("⚔️ GÓI COMBO ĐẶC BIỆT (admin trao tay)", PAD + 18, y + 28);

  let cy = y + 48;
  for (const c of DONATE_COMBOS) {
    drawCard(ctx, PAD + 14, cy - 22, W - (PAD + 14) * 2, 44, false);
    ctx.textAlign = "left";
    ctx.font = "bold 16px GameFont, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${c.emoji} ${c.name}`, PAD + 30, cy);
    ctx.font = "13px GameFont, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(`${formatNumber(c.price)}đ`, PAD + 30, cy + 20);
    ctx.textAlign = "right";
    ctx.font = "13px GameFont, sans-serif";
    ctx.fillStyle = "#ff8fa3";
    ctx.fillText(`🎁 ${c.items}`, W - PAD - 30, cy + 6);
    cy += 52;
  }
  y += comboH + 12;

  // ── Mốc thưởng donate ──
  drawCard(ctx, PAD, y, W - PAD * 2, milH, true);
  ctx.textAlign = "left";
  ctx.font = "bold 17px GameFont, sans-serif";
  ctx.fillStyle = "#ffd66b";
  ctx.fillText("🏅 MỐC THƯỞNG DONATE (hệ thống tự thưởng)", PAD + 18, y + 28);

  let my = y + 50;
  ctx.font = "14px GameFont, sans-serif";
  for (const m of DONATE_MILESTONES) {
    const claimed = milestones.includes(m.key);
    ctx.fillStyle = claimed ? "#4ade80" : "rgba(255,255,255,0.85)";
    ctx.fillText(`${claimed ? "✅" : "⏳"} ${m.label}: ${m.desc}${claimed ? "  (đã nhận)" : ""}`, PAD + 18, my);
    my += 28;
  }
  y += milH + 18;

  // ── Ưu đãi ──
  const ox = PAD;
  const ow = W - PAD * 2;
  drawCard(ctx, ox, y, ow, offersH, true);
  ctx.textAlign = "left";
  ctx.font = "bold 18px GameFont, sans-serif";
  ctx.fillStyle = "#ffd66b";
  ctx.fillText("🎁 ƯU ĐÃI NẠP", ox + 18, y + 30);

  let oy = y + 48;
  ctx.font = "14px GameFont, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  for (const off of DONATE_OFFERS) {
    ctx.fillText(off, ox + 18, oy);
    oy += 26;
  }

  ctx.textAlign = "center";
  ctx.font = "13px GameFont, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("📲 Liên hệ admin để nạp — Gói & combo do admin trao tay, mốc 50k/100k/200k hệ thống tự thưởng", W / 2, H - 34);

  const filePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), `../assets/temp/tl_donate_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, canvas.toBuffer("image/png"));
  return filePath;
}