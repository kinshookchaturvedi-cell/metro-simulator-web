/** Simulation calibration and vehicle constants (shared across subsystems) */
export const CONST = {
  MAX_TRACTION_ACC: 1.0,
  MAX_SERVICE_BRK: 1.1,
  EB_BRAKE: 1.3,
  ATP_OVERSPEED_MARGIN: 5,
  ATP_WARN_MARGIN: 2,
  RM_LIMIT: 25,
  AM_REC_OFFSET: 5,
  ATO_CRUISE_DEADBAND_KMH: 2,
  ATO_APPROACH_DIST_M: 180,
  /**
   * The braking intensity scale factor used by the ATO ideal station approach curve (relative to MAX_SERVICE_BRK).
   * Real train profiles are conservative. In the simulation, using full service braking combined with command filtering lags can easily cause the train to lag the profile and overrun the marker. Therefore, the profile envelope is slightly tightened.
   */
  ATO_ENVELOPE_DECEL_SCALE: 0.74,
  /** Safety scale factor for the distance-to-go kinematic braking profile min(|a|) = v²/(2d) to absorb the pressure buildup delay from CMD_ACC_TAU */
  ATO_STOP_KINEMATIC_SAFETY: 1.14,
  /** Docking alignment tolerance (m), ATO door enable window threshold — on the order of ±5 cm */
  STOP_TOLERANCE: 0.05,
  /**
   * Maximum longitudinal error |train head position - stopping marker| (m) to enter dwelling state (standstill at docking alignment).
   * If too small and without terminal inching, the train will never successfully "arrive"; if too large, arrival will be falsely triggered at low speeds when still far from the marker (experimentally ~1.35 m).
   */
  ATO_ARRIVAL_WINDOW_M: 0.42,
  CMD_ACC_TAU: 0.32,
  /** Distance to marker <= this value: do not apply the limCrit cruising "premature dead drag" speed limit when in automatic mode */
  ATO_SUPPRESS_LIM_CRIT_M: 260,
  /**
   * The forward shift of the ATP station service braking curve relative to the stopping marker (m).
   * If too large, it will drop the permitted speed to 0 when still far from the marker, causing a systematic undershoot (stopping short) of a similar magnitude in both ATO and manual modes.
   * Real trains have coupler/balise redundancy; the simulation uses a small forward shift matching the scale of ATO_STOP (EBI will still prevent overruns).
   */
  ATP_STOP_MARGIN_M: 0.5,
  ATO_STOP_MARGIN_M: 0.35,
  ATO_BLEND_STATION_M: 600,

  G_DT: 1 / 30,

  /**
   * Platform Screen Doors (PSD): The readback/feedback delay (ms) for the PSD to completely close and lock after the train doors are closed.
   * During this period, DMI Zone 20 displays "Platform Doors Not Closed". Once completed, doors are considered closed and locked, and Zone 20 clears.
   */
  PSD_PLATFORM_CLOSE_MS: 2000,

  /**
   * AM/FAM (Automatic Mode/Fully Automatic Mode) and A/A (Automatic Door Open / Automatic Door Close): Simulated station dwell time (s) calculated from the start of station dwelling. Doors close automatically once reached.
   * This is independent of the DMI "Please Close Doors" and "Departure Suggested" parameters, allowing separate calibration.
   */
  STATION_AA_AUTOCLOSE_DWELL_S: 20,

  /**
   * DMI Zone 18 "Departure Suggested (Delay Warning)" upward arrow: Wall-clock seconds calculated from station arrival (`departSuggestEpochMs`).
   * This is not an ATP permission and MUST NOT share the same constant with A/A automatic door closing.
   */
  STATION_DWELL_DEPART_HINT_S: 24,

  /** DMI Departure Suggested Anchor: Clears current station's delay warning timer after the train passes this distance (m) beyond the stopping marker */
  DEPART_SUGGEST_CLEAR_PAST_STATION_M: 110,

  /** Maximum |ΔPosition| (m) to still be considered near the anchored platform, preventing the departure suggestion from falsely illuminating en route */
  DEPART_SUGGEST_ANCHOR_RADIUS_M: 140,

  /**
   * DMI Zone 18 "Please Close Doors": Wall-clock duration (ms) calculated from the current door opening event (`doorOpenedAtMs`), displaying the door-closing prompt upon expiration.
   */
  DMI_Z18_CLOSE_HINT_DELAY_MS: 20000,

  /** Alarm window duration when opening doors without door enable. DMI Zone 17 only displays "Illegally Opened" (c-z17=8) if the doors are not completely closed. */
  DMI_DOOR_ILLEGAL_INDICATE_MS: 5000,

  /** Traction / dynamic (electric) braking current model (multiple parallel traction inverters equivalent in Amperes, illustrative scale) */
  MOTOR_I_REF_A: 720,
  /** Start point of rapid regenerative braking fade below low speeds (km/h) */
  REGEN_KNEE_KMH_LOW: 4,
  /** Start point of regenerative braking fade in the high-speed zone (km/h) */
  REGEN_FADE_START_KMH: 70,
  /** Share of braking effort attributed to electric (regenerative) braking during service braking; the remaining portion is allocated to friction/pneumatic braking */
  ELEC_BRAKE_SHARE_SB: 0.88,
  /** Rapid / Emergency braking still primarily relies on pneumatic braking, with electric braking taking only a minor share */
  ELEC_BRAKE_SHARE_RAPID: 0.14,
  /** First-order filter for current command (s), slightly faster than mechanical brake cylinder pressure buildup */
  MOTOR_CURRENT_TAU_S: 0.1,
};
