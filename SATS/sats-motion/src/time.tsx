import {createContext, useContext} from 'react';
import {useCurrentFrame} from 'remotion';
import {FPS} from './tl';

export const TimeOffset = createContext(0);

export const useTime = () => {
  const f = useCurrentFrame();
  const off = useContext(TimeOffset);
  return {f, t: f / FPS + off};
};
