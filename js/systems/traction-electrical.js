/**
 * Traction / Regenerative dynamic braking current illustrative model (equivalent parallel inverters).
 * Service braking is primarily dominated by a large share of electric braking (negative current);
 * Rapid / Emergency braking primarily relies on pneumatic braking, with negative current taking only a small share;
 * Regenerative capability fades at low speeds, closely mirroring urban rail transit inverter characteristics.
 */
import { CONST } from "../config/constants.js";
import { clamp, ms2kmh } from "../lib/math.js";
import { train } from "./vehicle-state.js";

/** Vehicle speed-dependent regenerative braking availability factor (0 to 1) */
function regenAvailBySpeed(vKmh) {
  if (vKmh < CONST.REGEN_KNEE_KMH_LOW) {
    const t = vKmh / Math.max(CONST.REGEN_KNEE_KMH_LOW, 0.1);
    return t * t * 0.35;
  }
  const mid = 1;
  if (vKmh <= CONST.REGEN_FADE_START_KMH) return mid;
  const fade = Math.max(0, 1 - (vKmh - CONST.REGEN_FADE_START_KMH) / 28);
  return mid * fade;
}

function elecBrakeShareForDemand(cmdAcc) {
  const rapid =
    train.ebActive ||
    cmdAcc <= -CONST.EB_BRAKE * 0.88 ||
    train.lever <= -1.03;
  return rapid ? CONST.ELEC_BRAKE_SHARE_RAPID : CONST.ELEC_BRAKE_SHARE_SB;
}

/**
 * @param {number} dt Time step (s)
 * @param {number} cmdAcc Filtered longitudinal demand acceleration for the current execution cycle (m/s²)
 */
export function updateMotorCurrentModel(dt, cmdAcc) {
  const iRef = CONST.MOTOR_I_REF_A;
  let target = 0;

  if (!train.keyOn) {
    target = 0;
  } else if (
    !train.ebActive &&
    train.lever > 0 &&
    train.direction === "R" &&
    train.doorClosed
  ) {
    target = iRef * clamp(train.lever, 0, 1);
  } else if (cmdAcc > 0.018) {
    target = iRef * clamp(cmdAcc / CONST.MAX_TRACTION_ACC, 0, 1);
  } else if (cmdAcc < -0.018) {
    const bmag = -cmdAcc;
    const vKmh = ms2kmh(Math.abs(train.vel));
    const reg = regenAvailBySpeed(vKmh);
    const share = elecBrakeShareForDemand(cmdAcc);
    const elecDecel = bmag * share * reg;
    target = -iRef * clamp(elecDecel / CONST.MAX_TRACTION_ACC, 0, 1.05);
    target = clamp(target, -iRef * 1.05, iRef * 1.05);
  } else target = 0;

  const tau = CONST.MOTOR_CURRENT_TAU_S;
  const alpha = 1 - Math.exp(-dt / tau);
  train.motorCurrentA += (target - train.motorCurrentA) * alpha;

  if (Math.abs(train.motorCurrentA) < 4) train.motorCurrentA = 0;
}
