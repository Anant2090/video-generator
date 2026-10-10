// Node boxes and ports on the canvas screenshot, in 1x source pixels (Generated image 1.png, 1862 x 845).
export const IMG = {w: 1862, h: 845};

export type Rect = [number, number, number, number];
export type NodeId =
  | 'ata' | 'noa' | 'sup' | 'ans' | 'rna' | 'gfd2' | 'ship' | 'faq' | 'esc' | 'gs' | 'awb' | 'gfd' | 'arr'
  | 'satsfaq' | 'xfer' | 'resp' | 'ack' | 'final' | 'ci';

export const NODES: Record<NodeId, Rect> = {
  ata: [107, 348, 288, 484],
  noa: [323, 347, 503, 490],
  sup: [545, 349, 732, 527],
  ans: [301, 533, 475, 651],
  rna: [287, 680, 494, 798],
  gfd2: [543, 679, 718, 797],
  ship: [773, 187, 950, 302],
  faq: [780, 519, 957, 640],
  esc: [777, 667, 963, 802],
  gs: [990, 118, 1188, 203],
  awb: [990, 212, 1188, 302],
  gfd: [990, 317, 1188, 402],
  arr: [990, 415, 1188, 505],
  satsfaq: [992, 522, 1198, 648],
  xfer: [1000, 667, 1198, 806],
  resp: [1266, 415, 1414, 532],
  ack: [1446, 417, 1634, 537],
  final: [1670, 338, 1848, 475],
  ci: [1670, 516, 1848, 650],
};

type P = [number, number];
// [from, to, a, b, vertical?] with ports where the real wires attach
export const EDGES: Record<string, [P, P, boolean?]> = {
  'ata>noa': [[290, 410], [322, 408]],
  'noa>sup': [[505, 410], [543, 408]],
  'noa>ans': [[410, 492], [393, 532], true],
  'ans>rna': [[388, 652], [388, 680], true],
  'rna>gfd2': [[494, 735], [543, 735]],
  'gfd2>sup': [[625, 679], [625, 528], true],
  'sup>ship': [[733, 408], [772, 230]],
  'sup>faq': [[733, 408], [779, 560]],
  'sup>esc': [[733, 408], [776, 712]],
  'ship>gs': [[948, 243], [990, 150]],
  'ship>awb': [[948, 243], [990, 245]],
  'ship>gfd': [[948, 243], [990, 340]],
  'ship>arr': [[948, 243], [990, 435]],
  'faq>satsfaq': [[957, 578], [992, 578]],
  'esc>xfer': [[963, 722], [1000, 720]],
  'gs>resp': [[1188, 150], [1265, 462]],
  'awb>resp': [[1188, 243], [1265, 462]],
  'gfd>resp': [[1188, 352], [1265, 462]],
  'arr>resp': [[1188, 450], [1265, 462]],
  'satsfaq>resp': [[1198, 550], [1265, 462]],
  'resp>ack': [[1415, 480], [1446, 475]],
  'ack>final': [[1634, 470], [1668, 400]],
  'final>ci': [[1760, 476], [1760, 516], true],
};

export const center = (id: NodeId): P => {
  const [a, b, c, d] = NODES[id];
  return [(a + c) / 2, (b + d) / 2];
};

/** Cubic bezier like the canvas wires: horizontal tangents (or vertical for stacked nodes). */
export const edgePoints = (id: string) => {
  const [[sx, sy], [tx, ty], v] = EDGES[id];
  const d = v ? Math.max(Math.abs(ty - sy) * 0.4, 12) : Math.max(Math.abs(tx - sx) * 0.5, 25);
  const c1: P = v ? [sx, sy + Math.sign(ty - sy) * d] : [sx + d, sy];
  const c2: P = v ? [tx, ty - Math.sign(ty - sy) * d] : [tx - d, ty];
  return {s: [sx, sy] as P, c1, c2, e: [tx, ty] as P};
};

export const edgePath = (id: string) => {
  const {s, c1, c2, e} = edgePoints(id);
  return `M${s[0]},${s[1]} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${e[0]},${e[1]}`;
};

export const edgeAt = (id: string, p: number): P => {
  const {s, c1, c2, e} = edgePoints(id);
  const q = 1 - p;
  return [0, 1].map((i) => q * q * q * s[i] + 3 * q * q * p * c1[i] + 3 * q * p * p * c2[i] + p * p * p * e[i]) as P;
};
