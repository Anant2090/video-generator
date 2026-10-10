import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, GRADIENT, gradientText} from '../brand';
import type {Rect} from '../canvas';
import {Cursor, SceneFade, Words} from '../components/Bits';
import {clampCam, project, Ring, Screen, type Win} from '../components/Screen';
import {useTime} from '../time';
import {ease, easeIO, lerp, mark, scene} from '../tl';

const WIN: Win = {x: 160, y: 200, w: 1600, h: 730};
const HOME = {w: 1896, h: 865};
const LIST = {w: 1906, h: 847};
const OTHER_CARDS: Rect[] = [
  [553, 452, 977, 792],
  [983, 443, 1402, 806],
  [1413, 452, 1832, 792],
];
const SATS_CARD: Rect = [135, 455, 540, 790];

export const Title: React.FC = () => {
  const {t} = useTime();
  const s = scene('title');
  if (t < s.start - 0.1 || t > s.end + 0.1) return null;
  const homeIn = mark('home_in');
  const clickCanvas = mark('click_canvas');
  const listIn = mark('list_in');
  const clickSats = mark('click_sats');

  const burst = ease(t, s.start, s.start + 0.9);
  const up = easeIO(t, homeIn - 0.4, homeIn + 0.6);
  const winK = ease(t, homeIn, homeIn + 0.8);
  const listK = easeIO(t, listIn, listIn + 0.5);

  const camHome = {cx: HOME.w / 2, cy: HOME.h / 2, z: 1};
  const zoomOut = easeIO(t, clickSats + 0.15, s.end);
  const camList = {cx: lerp(LIST.w / 2, 338, zoomOut), cy: lerp(LIST.h / 2, 620, zoomOut), z: lerp(1, 2.2, zoomOut)};

  // cursor path (stage px)
  const [hx, hy] = project(WIN, HOME.w, camHome, 176, 646);
  const [lx, ly] = project(WIN, LIST.w, {cx: LIST.w / 2, cy: LIST.h / 2, z: 1}, 236, 545);
  const c1 = easeIO(t, homeIn + 1.0, clickCanvas - 0.1);
  const c2 = easeIO(t, listIn + 0.9, clickSats - 0.1);
  const cx = t < listIn ? lerp(1500, hx, c1) : lerp(hx, lx, c2);
  const cy = t < listIn ? lerp(860, hy, c1) : lerp(hy, ly, c2);
  const cursorK = ease(t, homeIn + 0.8, homeIn + 1.1) * (1 - ease(t, clickSats + 0.25, clickSats + 0.5));

  const frost = ease(t, listIn + 0.3, listIn + 0.9);
  const ring = ease(t, listIn + 0.6, listIn + 1.1);

  return (
    <SceneFade t={t} start={s.start} end={s.end} fadeIn={0} fadeOut={0.35}>
      {/* dot burst */}
      <div style={{position: 'absolute', left: 960, top: 540, width: 28, height: 28, marginLeft: -14, marginTop: -14, borderRadius: '50%', background: GRADIENT, transform: `scale(${1 + burst * 60})`, opacity: (1 - burst) * 0.5}} />

      {/* title block */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: lerp(330, 62, up),
          textAlign: 'center',
          transform: `scale(${lerp(1, 0.46, up)})`,
          transformOrigin: 'center top',
        }}
      >
        <div style={{fontSize: 30, fontWeight: 700, letterSpacing: '0.2em', color: C.tealInk, opacity: ease(t, s.start + 0.3, s.start + 0.9) * (1 - up)}}>AGENTIC AI · VOICE</div>
        <div style={{fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.05, color: C.ink, marginTop: 18}}>
          <Words text="SATS Import *TeleAdvice*" local={t - s.start - 0.35} size={124} stagger={0.12} />
        </div>
        <div style={{fontSize: 40, fontWeight: 500, color: C.sub, marginTop: 26, opacity: ease(t, s.start + 1.2, s.start + 1.8) * (1 - up), letterSpacing: '-0.01em'}}>
          Agentic AI voice notifications for import cargo
        </div>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, marginTop: 44, opacity: ease(t, s.start + 2.4, s.start + 3.0) * (1 - up)}}>
          <span style={{fontSize: 28, fontWeight: 600, color: C.sub}}>Built on</span>
          <Img src={staticFile('logo-light.png')} style={{height: 150}} />
        </div>
      </div>

      {/* platform window: home, then workflow list */}
      {winK > 0 ? (
        <div style={{opacity: winK, transform: `translateY(${(1 - winK) * 80}px) scale(${0.96 + 0.04 * winK})`, transformOrigin: 'center bottom', position: 'absolute', inset: 0}}>
          <div style={{opacity: 1 - listK, position: 'absolute', inset: 0}}>
            <Screen src="screens/home.png" img={HOME} win={WIN} cam={camHome} />
          </div>
          {listK > 0 ? (
            <div style={{opacity: listK, position: 'absolute', inset: 0}}>
              <Screen src="screens/workflows.png" img={LIST} win={WIN} cam={clampCam(WIN, LIST, camList)}>
                {(sc) => (
                  <>
                    {OTHER_CARDS.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          left: r[0],
                          top: r[1],
                          width: r[2] - r[0],
                          height: r[3] - r[1],
                          borderRadius: 18,
                          backdropFilter: `blur(${9 * frost}px)`,
                          background: `rgba(246,248,250,${0.62 * frost})`,
                        }}
                      />
                    ))}
                    <Ring id="sats-card" r={SATS_CARD} k={ring} s={sc} />
                  </>
                )}
              </Screen>
            </div>
          ) : null}
        </div>
      ) : null}

      {cursorK > 0 ? <Cursor x={cx} y={cy} t={t} clickAt={t < listIn ? clickCanvas : clickSats} opacity={cursorK} /> : null}

      {/* small caption under the window */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: WIN.y + WIN.h + 34,
          textAlign: 'center',
          fontSize: 26,
          fontWeight: 600,
          color: C.sub,
          opacity: ease(t, listIn + 0.8, listIn + 1.3) * (1 - zoomOut),
        }}
      >
        <span style={gradientText}>Published</span> · SATS Import TeleAdvice workflow
      </div>
    </SceneFade>
  );
};
