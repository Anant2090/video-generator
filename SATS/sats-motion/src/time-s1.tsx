import {useCurrentFrame} from 'remotion';
import {FPS} from './tl-s1';

export const useS1Time = () => {
  const f = useCurrentFrame();
  return {f, t: f / FPS};
};
