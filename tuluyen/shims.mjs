import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const MessageType = {
  UserMessage: "UserMessage",
  GroupMessage: "GroupMessage",
};

let prefixProvider = () => ",";
export function setPrefixProvider(fn) {
  prefixProvider = fn;
}
export function getGlobalPrefix() {
  try {
    return prefixProvider() || ",";
  } catch {
    return ",";
  }
}

let adminProvider = () => [];
export function setAdminProvider(fn) {
  adminProvider = fn;
}
export function isAdmin(uid) {
  try {
    return adminProvider().includes(String(uid));
  } catch {
    return false;
  }
}

let sangTheProvider = () => [];
export function setSangTheProvider(fn) {
  sangTheProvider = fn;
}
// Discord: supreme = qtv (khong co Zalo UID)
export function isSupremeUid(uid) {
  return isAdmin(uid);
}
export function isSangThe(uid) {
  try {
    return sangTheProvider().map(String).includes(String(uid));
  } catch {
    return false;
  }
}

const BLOCKED_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "blocked-users.json");

function loadBlocked() {
  try {
    if (fs.existsSync(BLOCKED_PATH)) return JSON.parse(fs.readFileSync(BLOCKED_PATH, "utf8"));
  } catch {}
  return null;
}

export const managerData = {
  data: loadBlocked(),
  hasChanges: false,
  flush() {
    if (!this.hasChanges || !this.data) return;
    try {
      fs.writeFileSync(BLOCKED_PATH, JSON.stringify(this.data, null, 2));
      this.hasChanges = false;
    } catch (e) {
      console.error("[tuluyen] lỗi lưu blocked-users:", e);
    }
  },
};
setInterval(() => managerData.flush(), 10000).unref();

export function removeMention(message) {
  let content = message.data.content;
  try {
    content = content.title ? content.title : content;
    const mentions = message.data.mentions || [];
    if (content && typeof content === "string") {
      if (!mentions) return content.trim();
      const sortedMentions = [...mentions].sort((a, b) => b.pos - a.pos);
      sortedMentions.forEach((mention) => {
        content = content.replace(content.substr(mention.pos, mention.len), "");
      });
      return content.replace(/\s+/g, " ").trim();
    } else {
      return "";
    }
  } catch {
    return typeof message.data.content === "string" ? message.data.content : "";
  }
}

export async function clearImagePath(imagePath) {
  try {
    if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  } catch {}
}
