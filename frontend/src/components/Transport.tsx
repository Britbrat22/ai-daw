import React from "react";

export default function Transport(props: {
  playing: boolean;
  time: number;
  onPlayPause: () => void;
  onStop: () => void;
  onMixMaster: (format: "wav" | "mp3") => void;
  busy: boolean;
}) {
  const { playing, time, onPlayPause, onStop, onMixMaster, busy } = props;

  return (
    <div className="header">
      <button onClick={onPlayPause} disabled={busy}>
        {playing ? "Pause" : "Play"}
      </button>
      <button className="secondary" onClick={onStop} disabled={busy}>
        Stop
      </button>

      <div style={{ flex: 1 }} />

      <div className="mono">{time.toFixed(2)}s</div>

      <button onClick={() => onMixMaster("wav")} disabled={busy}>
        Mix + Master (WAV)
      </button>
      <button className="secondary" onClick={() => onMixMaster("mp3")} disabled={busy}>
        Mix + Master (MP3)
      </button>
    </div>
  );
}
