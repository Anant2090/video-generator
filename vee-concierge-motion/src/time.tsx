import React, {createContext, useContext} from 'react';
import {useCurrentFrame} from 'remotion';
import {outToSrc} from './edit';

// f = output frame (absolute), t = source seconds. Overlays read this instead of
// useCurrentFrame(), which is relative inside a <Sequence>.
type Time = {f: number; t: number};
const Ctx = createContext<Time>({f: 0, t: 0});

export const TimeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  return <Ctx.Provider value={{f, t: outToSrc(f)}}>{children}</Ctx.Provider>;
};

export const useTime = () => useContext(Ctx);
