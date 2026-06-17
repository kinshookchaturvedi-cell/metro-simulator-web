/** Static track alignment and wayside equipment data (non-simulation state) */
export const STATIONS = [
  { name: "Gucheng", pos: 200, platform: "right" },
  { name: "Bajiao Amusement Park", pos: 1900, platform: "right" },
  { name: "Babaoshan", pos: 3700, platform: "right" },
  { name: "Yuquanlu", pos: 5300, platform: "right" },
  { name: "Wukesong", pos: 7100, platform: "right" },
  { name: "Military Museum", pos: 8400, platform: "right" },
];

export const SPEED_ZONES = [
  [0, 300, 60],
  [300, 1700, 80],
  [1700, 2100, 60],
  [2100, 3500, 80],
  [3500, 3900, 60],
  [3900, 5100, 80],
  [5100, 5500, 60],
  [5500, 6900, 80],
  [6900, 7300, 60],
  [7300, 8200, 80],
  [8200, 8500, 40],
];

export const BALISES = [80, 800, 1600, 2400, 3200, 4000, 4800, 5600, 6400, 7200, 8000];

export const SIGNALS = STATIONS.map((s) => ({ pos: s.pos - 80, aspect: "G" }));

export const TRACK_W = 1020;
export const TRACK_X0 = 40;
export const ROUTE_LEN = 8500;

export function posToX(p) {
  return TRACK_X0 + (p / ROUTE_LEN) * TRACK_W;
}
