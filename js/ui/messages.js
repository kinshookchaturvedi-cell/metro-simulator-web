import { $ } from "../lib/dom.js";

export let lastMmiMsg = "System Ready";
/** Synchronized with the left-screen MMI alarm banner style (updated every frame by render-mmi via class manipulation) */
export let lastMmiMsgLevel = "info";

let logCount = 0;

export function tcmsLog(msg, type = "") {
  const el = $("tcmsLog");
  if (!el) return;
  const d = el.ownerDocument.createElement("div");
  if (type) d.className = type;
  const t = new Date().toTimeString().slice(0, 8);
  d.textContent = `[${t}] ${msg}`;
  el.insertBefore(d, el.firstChild);
  if (++logCount > 50) el.removeChild(el.lastChild);
}

export function showMsg(msg, level = "info") {
  lastMmiMsg = msg;
  lastMmiMsgLevel = level;
  const el = $("mmiMsg");
  if (el) {
    el.textContent = msg;
    el.className = "mmi-msg " + (level === "alarm" ? "alarm" : level === "ok" ? "ok" : "");
  }
}
