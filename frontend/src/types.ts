export type Track = {
  id: string;
  name: string;
  fileName?: string;
  url?: string;
  buffer?: AudioBuffer;
  startSec: number;
  gain: number;
  pan: number;
  muted: boolean;
  solo: boolean;
};
