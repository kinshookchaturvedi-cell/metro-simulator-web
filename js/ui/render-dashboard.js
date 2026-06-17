import { $ } from "../lib/dom.js";
import { STATIONS } from "../systems/route-model.js";
import { train } from "../systems/vehicle-state.js";
import { postVobcDmi, formatDoorModeForDmi } from "./dmi-bridge.js";
import { updateTrainMarker } from "./track-view.js";
import { atoStartPreconditionsMet } from "../systems/ato-readiness.js";

export function renderDashboard() {
  const ns = STATIONS[train.nextStationIdx];
  postVobcDmi();
  updateTrainMarker();

  const setText = (id, val) => {
    const el = $(id);
    if (el) el.textContent = val;
  };

  setText("totalDist", train.pos.toFixed(0));
  setText("absPos", train.pos.toFixed(1));
  setText("atpLevel", train.atpActive ? "CBTC L2" : "Degraded");
  setText("moveAuth", ns ? Math.max(0, ns.pos - train.pos).toFixed(0) + "m" : "—");

  const trBar = $("trBar");
  const bkBar = $("bkBar");
  if (trBar) trBar.style.width = train.trPct + "%";
  if (bkBar) bkBar.style.width = train.bkPct + "%";
  setText("trPct", String(train.trPct));
  setText("bkPct", String(train.bkPct));
  setText("mrPress", train.mrPress.toFixed(0));
  setText("bcPress", train.bcPress.toFixed(0));
  setText("thirdRailState", train.keyOn ? "Power Connected" : "ZK OFF");
  setText("lineV", train.keyOn ? "750" : "0");

  const ia = train.motorCurrentA;
  const iWrap = $("motorCurrentWrap");
  if (iWrap) {
    iWrap.className =
      "num motor-i-wrap " + (ia < -8 ? "regen" : ia > 8 ? "traction" : "neutral");
  }
  const iAbs = Math.abs(ia) < 0.5 ? "0" : (ia > 0 ? "+" : "") + ia.toFixed(0);
  setText("motorCurrentA", iAbs);

  const dms = formatDoorModeForDmi(train.doorMode);
  const doorTxt =
    train.doorOpenSide === "both"
      ? "Both Open"
      : train.doorOpenSide === "left"
        ? "Left Open"
        : train.doorOpenSide === "right"
          ? "Right Open"
          : "All Closed";
  const allowHint =
    train.doorManualBoth ? "Man Both" : train.doorAtpLeft ? "ATP Left" : train.doorAtpRight ? "ATP Right" : "—";
  setText("doorState", `${doorTxt} · ${dms || "—"} · ${allowHint}`);
  setText("acState", train.ac ? "ON" : "OFF");

  setText("leverPos", (train.lever * 100).toFixed(0));
  let st = "Coasting";
  if (train.lever <= -1.05) st = "EB / Rapid Brake";
  else if (train.lever < -0.05) st = "Service Brake";
  else if (train.lever > 0.05) st = "Traction";
  setText("leverState", st);

  const btnAto = $("btnATO");
  if (btnAto) {
    btnAto.classList.toggle("on", train.atoRunning);
    const aut = train.keyOn && (train.mode === "AM" || train.mode === "FAM");
    const showReady = aut && !train.atoRunning && atoStartPreconditionsMet();
    btnAto.classList.toggle("ready", showReady);
  }
}
