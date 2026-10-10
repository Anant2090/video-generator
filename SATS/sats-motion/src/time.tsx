import {useCurrentFrame} from 'remotion';
import {FPS} from './tl';

export const useTime = () => {
  const f = useCurrentFrame();
  return {f, t: f / FPS};
};
