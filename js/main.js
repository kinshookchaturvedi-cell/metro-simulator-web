/**
 * Assembly Entry Point: Simulation main loop, DOM events, and final orchestration before subsystem instantiation.
 * Business logic can be found in js/systems/*, js/audio/*, js/ui/*
 */
import { CONST } from "./config/constants.js";
import { $ } from "./lib/dom.js";
import { clamp } from "./lib/math.js";
import { STATIONS } from "./systems/route-model.js";
import { train } from "./systems/vehicle-state.js";
import { physicsTick } from "./systems/physics-engine.js";
import {
  setLever,
  setMode,
  modeUp,
  modeDown,
} from "./systems/cab-driver-input.js";
import { openDoor, closeDoor, closeDoorSide } from "./systems/doors.js";
import { triggerEB, releaseEB } from "./systems/emergency-brake.js";
import { beep, stopAlarm } from "./audio/sfx-core.js";
import { updateCabPresentation } from "./audio/cab-ambience.js";
import { showMsg, tcmsLog } from "./ui/messages.js";
import { renderDashboard } from "./ui/render-dashboard.js";
import { buildTrack } from "./ui/track-view.js";
import { syncLeverHandlePos } from "./ui/lever-handle.js";
import { postVobcDmi, resetVobcDmiThrottle } from "./ui/dmi-bridge.js";
import { atoStartPreconditionsMet, disengageAto } from "./systems/ato-readiness.js";

function loop() {
  physicsTick(CONST.G_DT);
  updateCabPresentation();
  renderDashboard();
}

setInterval(loop, 1000 * CONST.G_DT);

setInterval(() => {
  const el = $("systemTime");
  if (el) el.textContent = new Date().toTimeString().slice(0, 8);
}, 1000);

function bindToggle(id, key) {
  $(id)?.addEventListener("click", () => {
    train[key] = !train[key];
    $(id)?.classList.toggle("on", train[key]);
    tcmsLog(`${id}: ${train[key] ? "ON" : "OFF"}`);
    beep(700, 0.05);
  });
}

bindToggle("btnHeadlight", "headlight");
bindToggle("btnCabinLight", "cabinLight");
bindToggle("btnSalonLight", "salonLight");
bindToggle("btnAC", "ac");
bindToggle("btnHorn", "horn");

$("btnWiperL")?.addEventListener("click", () => {
  train.wiper = train.wiper === 1 ? 0 : 1;
  $("btnWiperL")?.classList.toggle("on", train.wiper === 1);
  $("btnWiperH")?.classList.remove("on");
});
$("btnWiperH")?.addEventListener("click", () => {
  train.wiper = train.wiper === 2 ? 0 : 2;
  $("btnWiperH")?.classList.toggle("on", train.wiper === 2);
  $("btnWiperL")?.classList.remove("on");
});

$("btnDoorLeft")?.addEventListener("click", () => openDoor("left"));
$("btnDoorRight")?.addEventListener("click", () => openDoor("right"));
$("btnDoorCloseLeft")?.addEventListener("click", () => closeDoorSide("left"));
$("btnDoorCloseRight")?.addEventListener("click", () => closeDoorSide("right"));

$("btnHorn")?.addEventListener("mousedown", () => {
  beep(220, 0.6, 0.2, "sawtooth");
});

$("btnATO")?.addEventListener("click", () => {
  if (!atoStartPreconditionsMet()) {
    showMsg(
      "ATO prerequisites not met: Key ON, AM/FAM mode, Forward (F), Master controller handle at zero, Doors closed and locked, No EB, Train not held, Not dwelling, Standstill confirmed, and Sufficient Movement Authority (MA) available ahead.",
      "alarm",
    );
    return;
  }
  train.atoReady = true;
  train.atoRunning = true;
  showMsg("ATO Engaged - Automatic Driving", "ok");
  tcmsLog("ATO Engaged (Manual Confirmation)", "ok");
  beep(880, 0.1);
  setTimeout(() => beep(1100, 0.15), 120);
});

$("btnModeUp")?.addEventListener("click", modeUp);
$("btnModeDown")?.addEventListener("click", modeDown);
$("btnConfirm")?.addEventListener("click", () => {
  showMsg("Confirmed", "ok");
  beep(880, 0.05);
});
$("btnDoorEnable")?.addEventListener("click", () => {
  train.doorManualBoth = !train.doorManualBoth;
  $("btnDoorEnable")?.classList.toggle("on", train.doorManualBoth);
  showMsg(`Manual Door Enable (Both Sides) ${train.doorManualBoth ? "ON" : "OFF"}`, "ok");
  tcmsLog(`Manual Door Enable: ${train.doorManualBoth ? "Both Sides" : "OFF"}`, "info");
});
$("btnSkip")?.addEventListener("click", () => {
  train.skipStation = !train.skipStation;
  $("btnSkip")?.classList.toggle("on", train.skipStation);
});
$("btnHold")?.addEventListener("click", () => {
  train.holdAtStation = !train.holdAtStation;
  $("btnHold")?.classList.toggle("on", train.holdAtStation);
});

$("doorModeSelect")?.addEventListener("change", (e) => {
  const v = e.target.value;
  if (v === "MM" || v === "AM" || v === "AA") {
    train.doorMode = v;
    const lab = v === "MM" ? "M/M" : v === "AM" ? "A/M" : "A/A";
    tcmsLog(`Door Mode → ${lab}`, "info");
    beep(660, 0.06);
  }
});

$("maxAuthModeSelect")?.addEventListener("change", (e) => {
  const v = e.target.value;
  if (v === "RM" || v === "CM" || v === "AM" || v === "FAM") {
    train.maxAuthorizedDrivingMode = v;
    tcmsLog(`Maximum Authorized Driving Mode (DMI Zone 5 Authorization) → ${v}`, "info");
    beep(620, 0.06);
  }
});

$("emergencyBtn")?.addEventListener("click", () => {
  if (train.ebActive) releaseEB();
  else triggerEB("Driver Emergency Button");
});

document.querySelectorAll(".ks-btn").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".ks-btn").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    train.keyOn = b.dataset.key === "on";
    document.body.classList.toggle("cab-off", !train.keyOn);
    showMsg(train.keyOn ? "Cab Activated" : "Cab Deactivated", "ok");
    tcmsLog(`KEY ${train.keyOn ? "ON" : "OFF"}`);
  });
});

document.querySelectorAll(".dir-pos").forEach((b) => {
  b.addEventListener("click", () => {
    if (Math.abs(train.vel) > 0.2) {
      showMsg("Direction: Train must be at a standstill", "alarm");
      return;
    }
    document.querySelectorAll(".dir-pos").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    train.direction = b.dataset.dir;
    if (train.direction !== "F") disengageAto();
    tcmsLog(`Direction ${train.direction}`);
    beep(660, 0.05);
  });
});

const leverTrack = $("leverTrack");
let dragging = false;
function leverFromY(clientY) {
  const r = leverTrack.getBoundingClientRect();
  const t = clamp((clientY - r.top) / r.height, 0, 1);
  const range = 2.2;
  return 1 - t * range;
}

leverTrack?.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 && e.pointerType === "mouse") return;
  dragging = true;
  try {
    leverTrack.setPointerCapture(e.pointerId);
  } catch (err) {}
  setLever(leverFromY(e.clientY));
});
leverTrack?.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  setLever(leverFromY(e.clientY));
});
function endLeverDrag(e) {
  if (!dragging) return;
  dragging = false;
  try {
    if (e?.pointerId != null) leverTrack.releasePointerCapture(e.pointerId);
  } catch (err) {}
}
leverTrack?.addEventListener("pointerup", endLeverDrag);
leverTrack?.addEventListener("pointercancel", endLeverDrag);

window.addEventListener("keydown", (e) => {
  const hm = $("helpModal");
  if (hm && !hm.hidden) return;
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  switch (e.key.toLowerCase()) {
    case "w":
      if (!e.repeat) setLever(clamp(train.lever + 0.1, -1.2, 1));
      break;
    case "s":
      if (!e.repeat) setLever(clamp(train.lever - 0.1, -1.2, 1));
      break;
    case "q":
      modeUp();
      break;
    case "e":
      modeDown();
      break;
    case "enter":
      $("btnATO")?.click();
      break;
    case "escape":
      $("emergencyBtn")?.click();
      break;
    case "h":
      $("btnHorn")?.dispatchEvent(new MouseEvent("mousedown"));
      break;
  }
});

$("btnReset")?.addEventListener("click", () => {
  if (!confirm("Reset the entire simulation?")) return;
  Object.assign(train, {
    pos: 0,
    vel: 0,
    acc: 0,
    lever: 0,
    direction: "N",
    keyOn: true,
    mode: "RM",
    atpActive: true,
    atoReady: false,
    atoRunning: false,
    ebActive: false,
    ebReason: "",
    doorAtpLeft: false,
    doorAtpRight: false,
    doorManualBoth: false,
    doorLeftOpen: false,
    doorRightOpen: false,
    doorOpenSide: "none",
    doorClosed: true,
    psdAllClosedLockedNotBefore: 0,
    doorOpenedAtMs: 0,
    doorIllegalOpenIndicateUntil: 0,
    zeroSpeed: true,
    nextStationIdx: 0,
    dwelling: false,
    dwellTimer: 0,
    dwellHadDoorOpenDuringStop: false,
    departSuggestEpochMs: 0,
    departSuggestAnchorIdx: -1,
    autoDoorReleased: false,
    doorMode: "AA",
    maxAuthorizedDrivingMode: "FAM",
    headlight: false,
    cabinLight: true,
    salonLight: true,
    ac: false,
    wiper: 0,
    mrPress: 900,
    bcPress: 0,
    trPct: 0,
    bkPct: 0,
    _cmdAccLag: 0,
    motorCurrentA: 0,
    skipStation: false,
    holdAtStation: false,
  });
  document.querySelectorAll(".op-btn").forEach((b) => b.classList.remove("on"));
  document.querySelectorAll(".dir-pos").forEach((b) => b.classList.remove("active"));
  document.querySelector('[data-dir="N"]')?.classList.add("active");
  document.body.classList.remove("cab-off");
  $("btnCabinLight")?.classList.add("on");
  $("btnSalonLight")?.classList.add("on");
  stopAlarm();
  const dmSel = $("doorModeSelect");
  if (dmSel) dmSel.value = train.doorMode;
  const maxSel = $("maxAuthModeSelect");
  if (maxSel) maxSel.value = train.maxAuthorizedDrivingMode;
  showMsg("System reset complete", "ok");
  tcmsLog("=== System Reset ===", "info");
  syncLeverHandlePos(train.lever);
});

$("btnHelp")?.addEventListener("click", () => {
  const m = $("helpModal");
  if (m) m.hidden = false;
});
$("closeHelp")?.addEventListener("click", () => {
  const m = $("helpModal");
  if (m) m.hidden = true;
});

function init() {
  document.body.classList.toggle("cab-off", !train.keyOn);
  const dmSel = $("doorModeSelect");
  if (dmSel) dmSel.value = train.doorMode;
  const maxSel = $("maxAuthModeSelect");
  if (maxSel) maxSel.value = train.maxAuthorizedDrivingMode;
  buildTrack();
  syncLeverHandlePos(train.lever);
  $("btnCabinLight")?.classList.add("on");
  $("btnSalonLight")?.classList.add("on");
  showMsg("System Ready · RM Restricted Mode · Establish reverser direction (Forward F) before applying traction when ZK=ON", "ok");
  tcmsLog("=== METRO-SIM Startup Complete ===", "ok");
  tcmsLog("CBTC Signaling System Initialized", "info");
  tcmsLog("MB-TN TCMS Self-Test Complete", "info");
  tcmsLog(`Next Station: ${STATIONS[0].name}`, "info");
  $("mmi-vobc")?.addEventListener("load", () => {
    resetVobcDmiThrottle();
    postVobcDmi();
  });
}

init();
