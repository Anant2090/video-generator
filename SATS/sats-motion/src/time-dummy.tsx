import {useCurrentFrame} from 'remotion';
import {FPS} from './tl-dummy';

export const useDummyTime = () => {
  const f = useCurrentFrame();
  return {f, t: f / FPS};
};
