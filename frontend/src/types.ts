export type Track = {
  id: string;
  name: string;
  fileName?: string;
  url?: string;              // object URL for playback display
  buffer?: AudioBuffer;      // decoded audio for offline mix
  startSec: number;          // start offset on timeline
  gain: number;              // 0..2
  pan: number;               // -1..1
  muted: boolean;
  solo: boolean;
};
