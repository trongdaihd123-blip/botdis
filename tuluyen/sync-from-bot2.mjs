import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC_DIR = "/root/bot/bot2/src/Tdai-service/game-service/tu-luyen";
const DEST_DIR = __dirname;

const SHIMS_EXPORTS_ORDER = [
  "MessageType",
  "getGlobalPrefix",
  "clearImagePath",
  "removeMention",
  "isAdmin",
  "isSangThe",
  "isSupremeUid",
  "managerData",
];

const ZALO_SPECIFIERS = new Set([
  "zlbotdqt",
  "../../service.js",
  "../../../utils/canvas/index.js",
  "../../../utils/format-util.js",
  "../../../index.js",
  "../../../commands/bot-manager/active-bot.js",
  "../../../commands/bot-manager/supreme.js",
]);

function mustReplace(out, from, to, label) {
  if (!out.includes(from)) {
    throw new Error(`[sync] KHÔNG tìm thấy mẫu cần thay (${label}). Source bot2 đã đổi cấu trúc — cần cập nhật sync-from-bot2.mjs`);
  }
  return out.replace(from, to);
}

function collectZaloImports(src) {
  const names = new Set();
  const importRe = /^import\s+(?:([\w$]+)\s*,\s*)?(?:\{([^}]*)\}\s*)?from\s*["'](.+?)["'];?\s*$/gm;
  let m;
  while ((m = importRe.exec(src)) !== null) {
    if (!ZALO_SPECIFIERS.has(m[3])) continue;
    if (m[1]) names.add(m[1]);
    if (m[2]) {
      for (const part of m[2].split(",")) {
        const n = part.split(" as ")[0].trim();
        if (n) names.add(n);
      }
    }
  }
  return names;
}

function stripZaloImports(src) {
  return src
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t.startsWith("import ")) return true;
      const mm = t.match(/from\s*["'](.+?)["']/);
      return !(mm && ZALO_SPECIFIERS.has(mm[1]));
    })
    .join("\n");
}

function transformMain(raw) {
  const shimNames = collectZaloImports(raw);

  if (raw.includes("return String(senderId) === BAN_ACC_ADMIN_ID;")) {
    raw = mustReplace(
      raw,
      "return String(senderId) === BAN_ACC_ADMIN_ID;",
      "return String(senderId) === BAN_ACC_ADMIN_ID || isSangThe(senderId);",
      "check BAN_ACC/isSangThe (legacy)"
    );
    shimNames.add("isSangThe");
  } else {
    const before = raw;
    raw = mustReplace(
      raw,
      "  return isDangSangThe(senderId);",
      "  return isDangSangThe(senderId) || isSangThe(senderId);",
      "check BAN_ACC/isSangThe"
    );
    if (raw !== before) shimNames.add("isSangThe");
  }
  // Discord: qtv/sangThe (data.json) duoc coi la Dang Sang The.
  // Quy tac nay dat truoc stripZaloImports de mustReplace thay duoc text goc.
  {
    const before = raw;
    raw = mustReplace(
      raw,
      "function isDangSangThe(userId) {\n  return DANG_SANG_THE_IDS.includes(String(userId));\n}",
      "function isDangSangThe(userId) {\n  return DANG_SANG_THE_IDS.includes(String(userId)) || isSangThe(userId); // +Discord dang-sang-the\n}",
      "isDangSangThe chap nhan isSangThe (Discord)"
    );
    if (raw !== before) shimNames.add("isSangThe");
  }
  let out = raw;

  out = stripZaloImports(out);
  out = mustReplace(
    out,
    'import path from "path";',
    'import path from "path";\nimport { fileURLToPath } from "url";',
    "thêm import fileURLToPath"
  );

  const ordered = SHIMS_EXPORTS_ORDER.filter((n) => shimNames.has(n));
  const unknown = [...shimNames].filter((n) => !SHIMS_EXPORTS_ORDER.includes(n));
  if (unknown.length > 0) {
    throw new Error(`[sync] Import từ module Zalo không có trong shims.mjs: ${unknown.join(", ")}`);
  }

  for (const f of ["profileImage", "profileImageNew", "profileImageVortex", "donateImage", "minigameImage", "characterCardProfile"]) {
    out = out.replaceAll(`"./${f}.js"`, `"./${f}.mjs"`);
  }
  out = out.replaceAll('"./constants.js"', '"./constants.mjs"');

  const shimsLine = `import { ${ordered.join(", ")} } from "./shims.mjs";`;
  out = mustReplace(
    out,
    'import { generateProfileCard } from "./profileImage.mjs";',
    `${shimsLine}\nimport { generateProfileCard } from "./profileImage.mjs";`,
    "chèn dòng import shims.mjs"
  );

  const dataDirBlock =
    'const TL_DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets/json-data");';
  let first = true;
  out = out.replace(/const (\w+) = path\.resolve\("assets\/json-data\/([^"]+)"\);/g, (all, varName, file) => {
    if (first) {
      first = false;
      return `${dataDirBlock}\nconst ${varName} = path.join(TL_DATA_DIR, "${file}");`;
    }
    return `const ${varName} = path.join(TL_DATA_DIR, "${file}");`;
  });
  if (first) throw new Error("[sync] Không tìm thấy đường dẫn assets/json-data nào trong source chính");

  return out;
}

function transformImageModule(raw) {
  let out = raw.replaceAll('"./constants.js"', '"./constants.mjs"');
  out = out.replace(
    /path\.resolve\(`\.\/assets\/temp\//g,
    "path.resolve(path.dirname(fileURLToPath(import.meta.url)), `../assets/temp/"
  );
  if (out.includes("fileURLToPath(import.meta.url)") && !out.includes('import { fileURLToPath }')) {
    out = mustReplace(out, 'import path from "path";', 'import path from "path";\nimport { fileURLToPath } from "url";', "thêm import fileURLToPath");
  }
  return out;
}

const JOBS = [
  { src: "tu-luyen.js", dest: "game.mjs", transform: transformMain },
  { src: "constants.js", dest: "constants.mjs", transform: (s) => s },
  {
    src: "characterCardProfile.js",
    dest: "characterCardProfile.mjs",
    transform: (s) =>
      transformImageModule(s)
        .replaceAll('"@napi-rs/canvas"', '"canvas"')
        .replaceAll("'@napi-rs/canvas'", "'canvas'"),
  },
  { src: "profileImage.js", dest: "profileImage.mjs", transform: transformImageModule },
  { src: "profileImageNew.js", dest: "profileImageNew.mjs", transform: transformImageModule },
  { src: "profileImageVortex.js", dest: "profileImageVortex.mjs", transform: transformImageModule },
  { src: "donateImage.js", dest: "donateImage.mjs", transform: transformImageModule },
  { src: "minigameImage.js", dest: "minigameImage.mjs", transform: transformImageModule },
];

function syntaxCheck(filePath) {
  execFileSync(process.execPath, ["--check", filePath], { stdio: "pipe" });
}

export function runSyncOnce() {
  const updated = [];
  for (const job of JOBS) {
    const srcPath = path.join(SRC_DIR, job.src);
    const destPath = path.join(DEST_DIR, job.dest);
    let raw;
    try {
      raw = fs.readFileSync(srcPath, "utf8");
    } catch {
      console.error(`[sync] Không đọc được nguồn ${srcPath} — bỏ qua`);
      continue;
    }

    let converted;
    try {
      converted = job.transform(raw);
    } catch (e) {
      console.error(`${e.message}`);
      continue;
    }

    let current = null;
    try { current = fs.readFileSync(destPath, "utf8"); } catch {}

    if (current === converted) continue;

    const tmp = `${destPath}.sync-tmp.mjs`;
    fs.writeFileSync(tmp, converted);
    try {
      syntaxCheck(tmp);
      fs.renameSync(tmp, destPath);
      updated.push(job.dest);
      console.log(`[sync] Đã cập nhật ${job.dest} từ bot2`);
    } catch (e) {
      try { fs.unlinkSync(tmp); } catch {}
      console.error(`[sync] Kết quả chuyển đổi cho ${job.dest} lỗi cú pháp hoặc ghi thất bại — giữ nguyên bản cũ:`, e.message);
    }
  }
  return updated;
}

const isWatch = process.argv.includes("--watch");

if (isWatch) {
  const POLL_MS = 15000;
  const hashOf = () =>
    JOBS.map((j) => {
      try { return fs.statSync(path.join(SRC_DIR, j.src)).mtimeMs; } catch { return "missing"; }
    }).join("|");
  let lastHash = hashOf();
  console.log(`[sync] Watcher đang chạy — quét mỗi ${POLL_MS / 1000}s nguồn từ bot2...`);
  setInterval(() => {
    try {
      const h = hashOf();
      if (h === lastHash) return;
      lastHash = h;
      const updated = runSyncOnce();
      if (updated.length === 0) console.log("[sync] Có thay đổi nhưng không tạo chênh lệch nào");
    } catch (e) {
      console.error("[sync] Lỗi watcher:", e);
    }
  }, POLL_MS).unref();
  setInterval(() => {}, 1 << 30);
} else {
  const updated = runSyncOnce();
  if (updated.length === 0) console.log("[sync] Botdis đã đồng bộ với bot2 — không có thay đổi");
}
