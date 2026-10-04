import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { THECHAT, HUYETMACH, LINH_CAN, getRealmDisplayFull, getMaxExp, calcStats, formatNumber, SECRET_REALMS } from "./constants.mjs";

const NOTO_SANS = "/usr/share/fonts/truetype/NotoSans.ttf";
const DEJAVU_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
if (fs.existsSync(NOTO_SANS)) registerFont(NOTO_SANS, { family: "GameFont" });
else if (fs.existsSync(DEJAVU_BOLD)) registerFont(DEJAVU_BOLD, { family: "GameFont" });

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}

export async function generateProfileCardBlue({ player, username, avatarUrl }) {
  const W = 700, H = 950;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "alphabetic";

  // Nền tối đơn giản
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#050a15"); bg.addColorStop(0.5, "#0a1830"); bg.addColorStop(1, "#050d1a");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const daotam = player.daotam || "chinh";
  const theChat = THECHAT.find(t => t.id === player.theChat) || THECHAT[0];
  const huyetMach = HUYETMACH.find(h => h.id === player.huyetMach) || HUYETMACH[0];
  const linhCan = LINH_CAN.find(l => l.id === player.linhCan) || LINH_CAN[0];
  const stats = calcStats(player);
  const maxExp = getMaxExp(player.majorRealm, player.minorRealm, player.daotam);
  const expPct = maxExp > 0 ? Math.min(player.exp / maxExp, 1) : 0;
  const realm = getRealmDisplayFull(player);
  const pathLabel = daotam === "ma" ? "Ma Đạo" : daotam === "nho" ? "Nho Đạo" : daotam === "yeu" ? "Yêu Đạo" : daotam === "lo" ? "Lọ Đạo" : daotam === "quy" ? "Quỷ Đạo" : daotam === "phat" ? "Phật Đạo" : "Chính Đạo";

  // === AVATAR ===
  const avX = 120, avY = 260, avR = 65;
  if (avatarUrl) {
    try {
      const img = await loadImage(avatarUrl);
      ctx.save(); ctx.beginPath(); ctx.arc(avX, avY, avR, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(img, avX - avR, avY - avR, avR * 2, avR * 2); ctx.restore();
      ctx.save(); ctx.strokeStyle = "#00d4ff"; ctx.lineWidth = 4; ctx.shadowColor = "#00aaff"; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(avX, avY, avR + 3, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    } catch {}
  }

  // === TÊN ===
  ctx.textAlign = "left"; ctx.font = "bold 30px GameFont, sans-serif";
  ctx.save(); ctx.fillStyle = "#ffffff"; ctx.shadowColor = "rgba(0,200,255,0.5)"; ctx.shadowBlur = 10;
  ctx.fillText(username || "Người Chơi", 210, 250); ctx.fillText(username || "Người Chơi", 210, 250); ctx.restore();

  ctx.font = "bold 15px GameFont, sans-serif"; ctx.fillStyle = "#00d4ff";
  ctx.fillText(`Cảnh Giới: ${realm}`, 210, 275);
  ctx.font = "bold 14px GameFont, sans-serif"; ctx.fillStyle = "#86efac";
  ctx.fillText(`Đạo Tâm: ${pathLabel}`, 210, 298);

  // === STATS ===
  const cards = [
    { label: "LỰC CHIẾN", value: formatNumber(stats.battlePower), color: "#ffd66b" },
    { label: "LINH CĂN", value: linhCan.name, color: "#00d4ff" },
    { label: "THỂ CHẤT", value: theChat.name, color: "#ff6b9d" },
    { label: "HUYẾT MẠCH", value: huyetMach.name, color: "#ff4444" },
    { label: "NGỘ TÍNH", value: String(player.ngoTinh), color: "#c084fc" },
    { label: "PHÚC DUYÊN", value: String(player.phucDuyen), color: "#4ade80" },
  ];

  const gridY = 340, px = 30, colW = (W - px * 2 - 12) / 2, rowH = 70, gap = 8;
  for (let i = 0; i < cards.length; i++) {
    const col = i % 2, row = Math.floor(i / 2);
    const cx = px + col * (colW + 12), cy = gridY + row * (rowH + gap);
    roundRect(ctx, cx, cy, colW, rowH, 8);
    ctx.fillStyle = "rgba(0,15,30,0.8)"; ctx.fill();
    ctx.strokeStyle = "rgba(0,212,255,0.5)"; ctx.lineWidth = 1; roundRect(ctx, cx, cy, colW, rowH, 8); ctx.stroke();
    ctx.textAlign = "left"; ctx.font = "bold 11px GameFont, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(cards[i].label, cx + 12, cy + 20);
    ctx.font = "bold 20px GameFont, sans-serif";
    if (ctx.measureText(cards[i].value).width > colW - 24) ctx.font = "bold 14px GameFont, sans-serif";
    ctx.save(); ctx.strokeStyle = "rgba(0,0,0,0.8)"; ctx.lineWidth = 3; ctx.lineJoin = "round";
    ctx.strokeText(cards[i].value, cx + 12, cy + rowH - 16); ctx.fillStyle = cards[i].color;
    ctx.fillText(cards[i].value, cx + 12, cy + rowH - 16); ctx.restore();
  }

  // === EXP BAR ===
  const expY = 600;
  ctx.textAlign = "center"; ctx.font = "bold 12px GameFont, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("TIẾN ĐỘ ĐỘT PHÁ", W / 2, expY + 10);
  const bx = 36, bw = W - 72, bh = 18, by = expY + 22;
  roundRect(ctx, bx, by, bw, bh, 9); ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fill();
  const fw = Math.max(8, expPct * bw);
  ctx.save(); roundRect(ctx, bx, by, fw, bh, 9); ctx.clip();
  const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  g.addColorStop(0, "#4ade80"); g.addColorStop(0.5, "#22c55e"); g.addColorStop(1, "#16a34a");
  ctx.fillStyle = g; ctx.fillRect(bx, by, fw, bh); ctx.restore();
  ctx.font = "bold 11px GameFont, sans-serif"; ctx.fillStyle = "#ffffff";
  ctx.fillText(`${formatNumber(player.exp)} / ${formatNumber(maxExp)}`, W / 2, by + 13);

  // === STATUS ===
  const sy = 710;
  roundRect(ctx, px, sy, W - px * 2, 80, 8);
  ctx.fillStyle = "rgba(0,15,30,0.8)"; ctx.fill();
  ctx.textAlign = "center"; ctx.font = "bold 11px GameFont, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("TRẠNG THÁI HIỆN TẠI", W / 2, sy + 14);

  if (player.beguan && player.beguan.startedAt) {
    const el = Math.floor((Date.now() - player.beguan.startedAt) / 60000);
    const c = Math.min(el, 60); const d = el >= 60 ? "60/60p" : `${c}/60p`;
    ctx.font = "bold 18px GameFont, sans-serif";
    ctx.save(); ctx.fillStyle = "#ffffff"; ctx.shadowColor = "#00aaff"; ctx.shadowBlur = 10;
    ctx.fillText("ĐANG BẾ QUAN", W / 2, sy + 40); ctx.fillText("ĐANG BẾ QUAN", W / 2, sy + 40); ctx.restore();
    ctx.font = "bold 20px GameFont, sans-serif"; ctx.fillStyle = "#e0f7ff"; ctx.fillText(`⏰ ${d}`, W / 2, sy + 65);
  } else if (player.inSecretRealm) {
    const el = Math.floor((Date.now() - (player.secretRealmEnteredAt || Date.now())) / 60000);
    const dung = SECRET_REALMS.find(s => s.id === player.currentSecretRealmId);
    const ri = dung ? dung.requiredRealm : (player.majorRealm || 0);
    const lim = 20 * (ri + 1); const c = Math.min(el, lim);
    const d = el >= lim ? `${lim}/${lim}p` : `${c}/${lim}p`;
    ctx.font = "bold 18px GameFont, sans-serif";
    ctx.save(); ctx.fillStyle = "#ff4444"; ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 10;
    ctx.fillText("⚔ ĐANG THÁM HIỂM ⚔", W / 2, sy + 40); ctx.fillText("⚔ ĐANG THÁM HIỂM ⚔", W / 2, sy + 40); ctx.restore();
    ctx.font = "14px GameFont, sans-serif"; ctx.fillStyle = "#ff6b6b"; ctx.fillText(`Thời gian: ${d}`, W / 2, sy + 58);
    ctx.fillStyle = "#4ade80"; ctx.fillText(`⚡ Thể Lực: ${player.stamina ?? 0}/${player.maxStamina ?? 50}`, W / 2, sy + 78);
  } else {
    ctx.font = "bold 18px GameFont, sans-serif";
    ctx.save(); ctx.fillStyle = "#ffffff"; ctx.shadowColor = "#00aaff"; ctx.shadowBlur = 10;
    ctx.fillText("ĐANG RẢNH RỖI", W / 2, sy + 40); ctx.fillText("ĐANG RẢNH RỖI", W / 2, sy + 40); ctx.restore();
    ctx.font = "14px GameFont, sans-serif"; ctx.fillStyle = "#4ade80";
    ctx.fillText(`⚡ Thể Lực: ${player.stamina ?? 0}/${player.maxStamina ?? 50}`, W / 2, sy + 62);
  }

  const fp = path.resolve(path.dirname(fileURLToPath(import.meta.url)), `../assets/temp/tl_profile_vortex_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.png`);
  await fs.promises.mkdir(path.dirname(fp), { recursive: true });
  await fs.promises.writeFile(fp, canvas.toBuffer("image/png"));
  return fp;
}
