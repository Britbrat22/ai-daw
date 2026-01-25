import React from "react";
import type { Track } from "../types";
import WaveTrack from "./WaveTrack";

export default function Timeline(props: { tracks: Track[]; playing: boolean; time: number }) {
  const { tracks, playing, time } = props;

  return (
    <div className="timeline">
      <div className="h2">Timeline</div>
      {tracks.length === 0 ? (
        <div className="small">Your waveforms will show here after importing audio.</div>
      ) : (
        <div className="col" style={{ gap: 10 }}>
          {tracks.map(t => (
            <div key={t.id}>
              <div className="small">{t.name}</div>
              <WaveTrack track={t} playing={playing} globalTime={time} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
