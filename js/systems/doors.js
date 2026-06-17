import { beep } from "../audio/sfx-core.js";
import { CONST } from "../config/constants.js";
import { showMsg, tcmsLog } from "../ui/messages.js";
import { train } from "./vehicle-state.js";

export function clearDoorAtpAllows() {
  train.doorAtpLeft = false;
  train.doorAtpRight = false;
}

function syncDoorAggregateState() {
  const L = train.doorLeftOpen;
  const R = train.doorRightOpen;
  train.doorClosed = !L && !R;
  if (L && R) train.doorOpenSide = "both";
  else if (L) train.doorOpenSide = "left";
  else if (R) train.doorOpenSide = "right";
  else train.doorOpenSide = "none";
}

/** HMI Zone 20 "Platform Screen Doors Not Closed": Doors opening, or train doors are closed but PSDs are still within the closing and locking time window */
export function platformScreenDoorsOpenForDmi() {
  return !train.doorClosed || Date.now() < train.psdAllClosedLockedNotBefore;
}

/** Checks if the specified side has door enable authorized: either manual "Door Enable (Both Sides)" is active, or ATP has released the side (after precise station docking in any mode) */
export function doorSideEnabled(side) {
  if (train.doorManualBoth) return true;
  if (side === "left") return train.doorAtpLeft;
  return train.doorAtpRight;
}

export function openDoor(side) {
  if (!train.zeroSpeed) {
    showMsg("Train not at standstill, cannot open doors", "alarm");
    return;
  }
  if (!doorSideEnabled(side)) {
    train.doorIllegalOpenIndicateUntil = Date.now() + CONST.DMI_DOOR_ILLEGAL_INDICATE_MS;
    showMsg(
      "Illegal Open: No door enable authorized on this side. The train must dock precisely at the station for ATP to release the platform side, or press 'Door Enable' for manual authorization on both sides",
      "alarm",
    );
    tcmsLog(`Illegal door open attempt (no door enable) on ${side} side`, "alarm");
    return;
  }
  train.doorIllegalOpenIndicateUntil = 0;
  const wasAllClosed = !train.doorLeftOpen && !train.doorRightOpen;
  if (side === "left") train.doorLeftOpen = true;
  else train.doorRightOpen = true;
  syncDoorAggregateState();
  train.psdAllClosedLockedNotBefore = 0;
  if (wasAllClosed) train.doorOpenedAtMs = Date.now();
  showMsg(`${side === "left" ? "Left" : "Right"} side train doors opened`, "ok");
  tcmsLog(`Door open: ${side}`, "info");
  beep(440, 0.2);
}

/** Closes the specified side; after both sides are fully closed, the PSD locking timer is triggered (identical to all-closed logic) */
export function closeDoorSide(side) {
  const left = side === "left";
  if (left && !train.doorLeftOpen) {
    showMsg("Left side train doors are not open", "alarm");
    return;
  }
  if (!left && !train.doorRightOpen) {
    showMsg("Right side train doors are not open", "alarm");
    return;
  }
  if (left) train.doorLeftOpen = false;
  else train.doorRightOpen = false;
  syncDoorAggregateState();
  if (train.doorClosed) {
    train.doorOpenedAtMs = 0;
    train.psdAllClosedLockedNotBefore = Date.now() + CONST.PSD_PLATFORM_CLOSE_MS;
    showMsg("Train doors closed", "ok");
    tcmsLog("Door close (Full train)", "info");
  } else {
    showMsg(`${left ? "Left" : "Right"} side train doors closed`, "ok");
    tcmsLog(`Door close: ${side}`, "info");
  }
  beep(660, 0.1);
  setTimeout(() => beep(440, 0.1), 120);
}

/** Closes both sides simultaneously (e.g., A/A automatic door closing) */
export function closeDoor() {
  train.doorLeftOpen = false;
  train.doorRightOpen = false;
  syncDoorAggregateState();
  train.doorOpenedAtMs = 0;
  train.psdAllClosedLockedNotBefore = Date.now() + CONST.PSD_PLATFORM_CLOSE_MS;
  showMsg("Train doors closed", "ok");
  tcmsLog("Door close", "info");
  beep(660, 0.1);
  setTimeout(() => beep(440, 0.1), 120);
}
