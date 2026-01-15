import React, { useEffect, useMemo, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import type { Track } from "../types";

type Props = {
  track: Track;
  playing: boolean;
  globalTime: number; // seconds
  onReady?: () => void;
};

export default function WaveTrack({ track, playing, globalTime }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WaveSurfer | null>(null);

  const url = useMemo(() => track.url, [track.url]);

  useEffect(() => {
    if (!containerRef.current) return;

    // destroy previous
    wsRef.current?.destroy();
    wsRef.current = null;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#2c8d88",
      progressColor: "#4ecdc4",
      cursorColor: "#ffffff",
      height: 64,
      barWidth: 2,
      barGap: 2,
      normalize: true
    });

    wsRef.current = ws;

    if (url) ws.load(url);

    return () => ws.destroy();
  }, [url]);

  // crude “timeline follow”: seek relative to track offset
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || !track.buffer) return;

    const rel = globalTime - track.startSec;
    if (rel < 0) {
      ws.seekTo(0);
      ws.pause();
      return;
    }

    const dur = track.buffer.duration;
    const pct = dur > 0 ? rel / dur : 0;

    if (pct >= 0 && pct <= 1) ws.seekTo(pct);

    if (playing) ws.play();
    else ws.pause();
  }, [globalTime, playing, track.startSec, track.buffer]);

  return <div className="waveWrap"><div ref={containerRef} /></div>;
}
