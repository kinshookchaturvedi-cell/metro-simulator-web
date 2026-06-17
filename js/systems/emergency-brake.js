import { startAlarm, stopAlarm } from "../audio/sfx-core.js";
import { showMsg, tcmsLog } from "../ui/messages.js";
import { train } from "./vehicle-state.js";
import { disengageAto } from "./ato-readiness.js";

export function triggerEB(reason) {
  if (train.ebActive) return;
  train.ebActive = true;
  disengageAto();
  train.ebReason = reason;
  showMsg(`Emergency Brake applied! ${reason}`, "alarm");
  tcmsLog(`EB Triggered: ${reason}`, "err");
  startAlarm();
}

export function releaseEB() {
  if (!train.zeroSpeed) {
    showMsg("Standstill required for EB release", "alarm");
    return;
  }
  if (Math.abs(train.lever) > 0.05) {
    showMsg("EB Release: Please return the master controller handle to zero first", "alarm");
    return;
  }
  train.ebActive = false;
  train.ebReason = "";
  showMsg("EB released", "ok");
  tcmsLog("EB released", "ok");
  stopAlarm();
}
