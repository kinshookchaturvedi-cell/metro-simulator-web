/**
 * ATO departure authorization and A/A automatic departure: doors closed and locked (including 
 * platform screen door feedback), train not held, station dwelling completed, sufficient 
 * movement authority ahead, etc.
 */
import { showMsg, tcmsLog } from "../ui/messages.js";
import { train } from "./vehicle-state.js";
import { STATIONS } from "./route-model.js";
import { calcTargetInfo } from "./signaling-atp.js";
import { platformScreenDoorsOpenForDmi } from "./doors.js";

/** Train at standstill (with a small margin relative to zero-speed detection to prevent signal jitter) */
function approxStopped() {
  return train.zeroSpeed && Math.abs(train.vel) < 0.09;
}

export function disengageAto() {
  train.atoRunning = false;
  train.atoReady = false;
}

/** Common prerequisites for manual ATO engagement, "Departure Authorized" indicator, and A/A automatic departure */
export function atoStartPreconditionsMet() {
  if (!train.keyOn) return false;
  if (!train.atpActive) return false;
  if (train.mode !== "AM" && train.mode !== "FAM") return false;
  if (train.direction !== "F") return false;
  if (Math.abs(train.lever) > 0.05) return false;
  if (!train.doorClosed) return false;
  if (platformScreenDoorsOpenForDmi()) return false;
  if (train.ebActive) return false;
  if (train.holdAtStation) return false;
  if (train.dwelling) return false;
  if (!approxStopped()) return false;
  const ns = STATIONS[train.nextStationIdx];
  if (!ns) return false;
  const { dist } = calcTargetInfo();
  /* Illustration: A minimum distance must be maintained to the next restrictive target (station/speed restriction point), indicating that the block ahead is clear */
  if (dist <= 8) return false;
  return true;
}

/** A/A Mode Only: Automatically engages ATO when all prerequisites are met (callable per frame, internally idempotent) */
export function tryAutoStartAtoAa() {
  if (train.doorMode !== "AA") return;
  if (train.atoRunning) return;
  if (!atoStartPreconditionsMet()) return;
  train.atoReady = true;
  train.atoRunning = true;
  showMsg("ATO automatically engaged", "ok");
  tcmsLog("ATO Automatic Start (A/A)", "ok");
}
