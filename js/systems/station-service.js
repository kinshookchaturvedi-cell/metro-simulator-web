import { CONST } from "../config/constants.js";
import { STATIONS } from "./route-model.js";
import { train } from "./vehicle-state.js";
import { showMsg, tcmsLog } from "../ui/messages.js";
import { openDoor, closeDoor, clearDoorAtpAllows } from "./doors.js";

export function handleStation() {
  if (!train.dwelling) return;
  train.dwellTimer += CONST.G_DT;

  if (!train.doorClosed) train.dwellHadDoorOpenDuringStop = true;

  if (train.dwellTimer > CONST.STATION_AA_AUTOCLOSE_DWELL_S && (train.mode === "AM" || train.mode === "FAM")) {
    if (train.doorMode === "AA" && train.doorOpenSide !== "none") closeDoor();
  }

  if (
    train.dwelling &&
    train.doorClosed &&
    train.dwellHadDoorOpenDuringStop &&
    (train.mode === "AM" || train.mode === "FAM")
  ) {
    train.dwelling = false;
    train.nextStationIdx++;
    clearDoorAtpAllows();
    if (train.nextStationIdx < STATIONS.length)
      tcmsLog(`Next station: ${STATIONS[train.nextStationIdx].name}`, "info");
    else tcmsLog("Arrived at the terminal station", "ok");
    return;
  }

  if (train.dwelling && train.doorClosed && (train.mode === "CM" || train.mode === "RM")) {
    train.dwelling = false;
    clearDoorAtpAllows();
  }
}

export function tryReleaseDoorAllowAligned(nextStn) {
  if (!nextStn || !train.dwelling || train.autoDoorReleased) return;
  if (
    train.mode !== "AM" &&
    train.mode !== "FAM" &&
    train.mode !== "CM" &&
    train.mode !== "RM"
  )
    return;
  if (!train.zeroSpeed) return;
  if (Math.abs(nextStn.pos - train.pos) > CONST.STOP_TOLERANCE) return;
  train.autoDoorReleased = true;
  train.doorAtpLeft = nextStn.platform === "left";
  train.doorAtpRight = nextStn.platform === "right";
  const platEn = nextStn.platform === "left" ? "Left" : "Right";
  const e = train.pos - nextStn.pos;
  const errStrMag = Math.abs(e) < 1.2 ? `${(e * 100).toFixed(1)} cm` : `${e.toFixed(3)} m`;
  if (train.doorMode === "MM") {
    showMsg(`Docked precisely (Error ${errStrMag}), ATP ${platEn} side platform door enabled · M/M please open doors on this side`, "ok");
    tcmsLog(`Precise Stop: ATP ${platEn} side door enabled · ${errStrMag} · M/M manual door opening`, "ok");
    return;
  }
  showMsg(`Docked precisely (Error ${errStrMag}), ATP ${platEn} side platform door enabled`, "ok");
  tcmsLog(`Precise Stop: ATP ${platEn} side door enabled · Error ${errStrMag}`, "ok");
  if (train.mode === "AM" || train.mode === "FAM") {
    setTimeout(() => {
      if (train.doorMode !== "MM") openDoor(nextStn.platform);
    }, 500);
  }
}
