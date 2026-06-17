/** Train and cab operational state (single-train simulation domain) */
export const train = {
  pos: 0,
  vel: 0,
  acc: 0,
  lever: 0,
  direction: "N",
  keyOn: true,
  mode: "RM",
  preMode: "RM",

  atpActive: true,
  atoReady: false,
  atoRunning: false,
  ebActive: false,
  ebReason: "",
  /** ATP / standstill automatic enable: true only on the platform side (aligned with the platform property in route data) */
  doorAtpLeft: false,
  doorAtpRight: false,
  /** Manual "Door Enable": when true, doors can be opened on both sides (used in CM / shunting, etc.) */
  doorManualBoth: false,
  /** Door mode: MM (Manual Open / Manual Close), AM (Automatic Open / Manual Close), AA (Automatic Open / Automatic Close) - only affects AM/FAM station dwell automation */
  doorMode: "AA",
  /** DMI Zone 5 "Maximum Driving Mode" authorization upper limit: RM / CM / AM / FAM (mapped to -C / -I when combined with the ATP level) */
  maxAuthorizedDrivingMode: "FAM",
  /** Door open state for each side (both sides can be open simultaneously) */
  doorLeftOpen: false,
  doorRightOpen: false,
  /** Summary: left / right / both / none, synchronized by the doors module */
  doorOpenSide: "none",
  doorClosed: true,
  /** Earliest timestamp (ms) when all Platform Screen Doors (PSD) are completely closed and locked; advanced after train doors close, before which HMI Zone 20 displays "Not Closed" */
  psdAllClosedLockedNotBefore: 0,
  /** Timestamp of the most recent door opening event (epoch ms), used for the Zone 18 door-closing prompt delay */
  doorOpenedAtMs: 0,
  /** Door open attempt without enable: if doors are actually opened before this timestamp, DMI Zone 17 displays "Illegally Opened" (epoch ms) */
  doorIllegalOpenIndicateUntil: 0,
  zeroSpeed: true,

  headlight: false,
  cabinLight: true,
  salonLight: true,
  ac: false,
  wiper: 0,
  horn: false,

  nextStationIdx: 0,
  dwelling: false,
  dwellTimer: 0,
  /** AM/FAM: Whether doors have been opened at this station; required when ending station dwelling upon door closure, to prevent false departure detection at the moment of arrival when doors are closed */
  dwellHadDoorOpenDuringStop: false,
  /** DMI Zone 18 "Departure Suggested" clock start time (epoch ms); independent of ATP permission */
  departSuggestEpochMs: 0,
  /** Corresponding index in STATIONS; -1 indicates not anchored to the current station */
  departSuggestAnchorIdx: -1,
  holdAtStation: false,
  skipStation: false,
  autoDoorReleased: false,

  mrPress: 900,
  bcPress: 0,
  trPct: 0,
  bkPct: 0,
  _cmdAccLag: 0,
  /** Equivalent DC-link current of the traction inverter (A); positive values for traction, negative for regenerative braking */
  motorCurrentA: 0,
};
