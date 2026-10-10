import React from 'react';
import {IMG, NODES, type NodeId} from '../canvas';
import {ease} from '../tl';
import {camAt, clampCam, type Cam, type Key, Pulse, project, Ring, Screen, Veil, type Win} from './Screen';

export type Spot = {from: number; to: number; nodes: NodeId[]};
export type Lit = {id: NodeId; at: number; until: number};
export type Flow = {edge: string; at: number; dur?: number};

const env = (t: number, a: number, b: number, f = 0.4) => ease(t, a, a + f) * (1 - ease(t, b - f, b));

/** The workflow canvas in a window, with camera, spotlight, node rings and wire pulses. */
export const CanvasStage: React.FC<{
  t: number;
  win: Win;
  keys: Key[];
  spots?: Spot[];
  lit?: Lit[];
  flows?: Flow[];
  veilAll?: number;
  overlay?: (p: (x: number, y: number) => [number, number], cam: Cam) => React.ReactNode;
  id: string;
}> = ({t, win, keys, spots = [], lit = [], flows = [], veilAll = 0, overlay, id}) => {
  const cam = clampCam(win, IMG, camAt(t, keys));
  const amount = Math.max(veilAll, ...spots.map((s) => env(t, s.from, s.to, 0.5)), 0);
  const holeK: Partial<Record<NodeId, number>> = {};
  for (const s of spots) {
    const k = env(t, s.from, s.to, 0.5);
    for (const n of s.nodes) holeK[n] = Math.max(holeK[n] ?? 0, k);
  }
  const holes = Object.entries(holeK).map(([n, k]) => ({r: NODES[n as NodeId], k: (k as number) * (1 - veilAll)}));
  const p = (x: number, y: number) => project(win, IMG.w, cam, x, y);
  return (
    <>
      <Screen src="screens/canvas.png" img={IMG} win={win} cam={cam}>
        {(s) => (
          <>
            <Veil img={IMG} amount={amount} holes={holes} id={`veil-${id}`} />
            {flows.map((f, i) => (
              <Pulse key={i} edge={f.edge} t={t} at={f.at} dur={f.dur} s={s} />
            ))}
            {lit.map((l, i) => (
              <Ring key={i} id={l.id} k={env(t, l.at, l.until, 0.3)} s={s} />
            ))}
          </>
        )}
      </Screen>
      {overlay?.(p, cam)}
    </>
  );
};

export const top = (id: NodeId): [number, number] => [(NODES[id][0] + NODES[id][2]) / 2, NODES[id][1]];
export const bottom = (id: NodeId): [number, number] => [(NODES[id][0] + NODES[id][2]) / 2, NODES[id][3]];
export const right = (id: NodeId): [number, number] => [NODES[id][2], (NODES[id][1] + NODES[id][3]) / 2];
