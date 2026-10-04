import { createCanvas } from "canvas";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const W = 720;
const PAD = 26;
const BOX_W = 124;
const BOX_H = 124;
const GAP = 14;
const HEADER_H = 96;

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
  ctx.restore();
}

function drawStars(ctx, W, H) {
  for (let i = 0; i < 40; i++) {
    const x = ((i * 149 + 31) % (W - 20)) + 10;
    const y = ((i * 197 + 17) % (H - 20)) + 10;
    ctx.globalAlpha = 0.15 + ((i * 7) % 5) / 20;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, 0.6 + ((i * 3) % 8) / 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export async function generateMinigameBoxes({ boxes = [] } = {}) {
  const rows = Math.ceil(boxes.length / 5);
  const H = HEADER_H + rows * (BOX_H + GAP) + 56;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "alphabetic";

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#160b26");
  bg.addColorStop(0.5, "#25113f");
  bg.addColorStop(1, "#12081f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  drawStars(ctx, W, H);

  ctx.textAlign = "center";
  ctx.font = "bold 36px GameFont, sans-serif";
  glowText(ctx, "🎁 HỘP QUÀ MAY MẮN", W / 2, 52, "#ffffff", "#f472b6", 22);
  ctx.font = "15px GameFont, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("Mỗi người chỉ mở được 1 hộp — Hết quà là kết thúc!", W / 2, 80);

  let openedCount = 0;
  boxes.forEach((box, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = PAD + col * (BOX_W + GAP);
    const y = HEADER_H + row * (BOX_H + GAP);

    ctx.save();
    if (box.opened) {
      openedCount++;
      ctx.globalAlpha = 0.55;
      const grad = ctx.createLinearGradient(x, y, x, y + BOX_H);
      grad.addColorStop(0, "rgba(74,222,128,0.12)");
      grad.addColorStop(1, "rgba(20,60,40,0.30)");
      ctx.fillStyle = grad;
      roundRect(ctx, x, y, BOX_W, BOX_H, 16);
      ctx.fill();
      ctx.strokeStyle = "rgba(74,222,128,0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.font = "bold 44px sans-serif";
      ctx.fillStyle = "#4ade80";
      ctx.fillText("✓", x + BOX_W / 2, y + 62);

      ctx.font = "11px GameFont, sans-serif";
      ctx.fillStyle = "#e5e7eb";
      const name = String(box.byName || "?").slice(0, 12);
      ctx.fillText(name, x + BOX_W / 2, y + 86);

      ctx.font = "10px GameFont, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      const shortReward = String(box.rewardShort || "").slice(0, 18);
      ctx.fillText(shortReward, x + BOX_W / 2, y + 104);
    } else {
      const grad = ctx.createLinearGradient(x, y, x, y + BOX_H);
      grad.addColorStop(0, "rgba(244,114,182,0.22)");
      grad.addColorStop(1, "rgba(88,28,135,0.35)");
      ctx.fillStyle = grad;
      roundRect(ctx, x, y, BOX_W, BOX_H, 16);
      ctx.fill();
      ctx.strokeStyle = "rgba(251,207,232,0.75)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#ec4899";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.textAlign = "center";
      ctx.font = "34px GameFont, sans-serif";
      ctx.fillStyle = "#fbcfe8";
      ctx.fillText("🎁", x + BOX_W / 2, y + 62);

      ctx.font = "bold 20px GameFont, sans-serif";
      glowText(ctx, `${i + 1}`, x + BOX_W / 2, y + 98, "#ffd66b", "#ffb703", 8);
    }
    ctx.restore();
  });

  ctx.textAlign = "center";
  ctx.font = "13px GameFont, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText(`Đã mở ${openedCount}/${boxes.length} • Dùng .tl moqua <số> để mở quà`, W / 2, H - 26);

  const filePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), `../assets/temp/tl_minigame_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, canvas.toBuffer("image/png"));
  return filePath;
}
