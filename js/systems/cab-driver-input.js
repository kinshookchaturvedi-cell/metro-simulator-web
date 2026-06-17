import { clamp } from "../lib/math.js";
import { $ } from "../lib/dom.js";
import { beep } from "../audio/sfx-core.js";
import { showMsg, tcmsLog } from "../ui/messages.js";
import { train } from "./vehicle-state.js";
import { syncLeverHandlePos } from "../ui/lever-handle.js";
import { disengageAto } from "./ato-readiness.js";

export const MODE_LIST = ["RM", "CM", "AM", "FAM"];

function normalizeDrivingModeIfNeeded() {
  if (MODE_LIST.indexOf(train.mode) >= 0) return;
  train.mode = "RM";
  const mv = $("modeValue");
  if (mv) {
    mv.textContent = "RM";
    mv.className = "value RM";
  }
}

function maxAuthorizedModeIndex() {
  const c = train.maxAuthorizedDrivingMode ?? "FAM";
  let idx = MODE_LIST.indexOf(c);
  if (idx < 0) idx = MODE_LIST.indexOf("FAM");
  return idx;
}

export function setMode(m) {
  if (train.mode === m) return;
  const targetIdx = MODE_LIST.indexOf(m);
  if (targetIdx < 0) return;
  if (targetIdx > maxAuthorizedModeIndex()) {
    showMsg(
      `Cannot select ${m}: Restricted by "Maximum Authorized Driving Mode" (Current limit: ${train.maxAuthorizedDrivingMode}). Increase the authorization limit on the right panel before upgrading.`,
      "alarm",
    );
    tcmsLog(`Mode switch rejected: Target ${m} > Authorized limit ${train.maxAuthorizedDrivingMode}`, "alarm");
    return;
  }
  if (m === "AM" || m === "FAM") {
    if (train.direction !== "F") {
      showMsg("ATO/Automatic Mode: Please set the reverser handle to 'Forward F' first", "alarm");
      return;
    }
    if (!train.zeroSpeed && Math.abs(train.lever) > 0.05) {
      showMsg("Automatic Mode Upgrade: Please ensure the train is at a standstill and return the master controller handle to zero", "alarm");
      return;
    }
  }
  train.mode = m;
  const mv = $("modeValue");
  if (mv) {
    mv.textContent = m;
    mv.className = "value " + m;
  }
  showMsg(`Mode switch → ${m}`, "ok");
  tcmsLog(`MODE: ${m}`, "info");
  beep(880, 0.1);
  if (m !== "AM" && m !== "FAM") {
    disengageAto();
  }
}

export function modeUp() {
  normalizeDrivingModeIfNeeded();
  const i = MODE_LIST.indexOf(train.mode);
  if (i < MODE_LIST.length - 1) setMode(MODE_LIST[i + 1]);
}

export function modeDown() {
  normalizeDrivingModeIfNeeded();
  const i = MODE_LIST.indexOf(train.mode);
  if (i > 0) setMode(MODE_LIST[i - 1]);
}

export function setLever(v) {
  v = clamp(v, -1.2, 1);
  if (train.atoRunning && Math.abs(v) > 0.02) {
    disengageAto();
    showMsg("ATO disengaged (Handle movement)", "alarm");
    tcmsLog("ATO disengaged: Handle not in zero position", "err");
  }
  train.lever = v;
  syncLeverHandlePos(train.lever);
}
