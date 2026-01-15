import React, { useEffect, useMemo, useRef, useState } from "react";
import Transport from "./components/Transport";
import TrackPanel from "./components/TrackPanel";
import Timeline from "./components/Timeline";
import MasterPanel from "./components/MasterPanel";
import type { Track } from "./types";
import { mixdownTracks } from "./audio/mixdown";
import { audioBufferToWavBlob } from "./audio/wav";

const BACKEND = "http://localhost:8000";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const audioCtx = useMemo(() => new AudioContext(), []);

  // Transport clock
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    startRef.current = performance.now() - time * 1000;

    const tick = () => {
      const now = performance.now();
      const t = (now - startRef.current) / 1000;
      setTime(t);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [playing]); // intentionally not including time (we set startRef)

  const pushLog = (s: string) => setLog((l) => [...l, `[${new Date().toLocaleTimeString()}] ${s}`]);

  async function decodeFileToTrack(file: File): Promise<Track> {
    const arrayBuf = await file.arrayBuffer();
    const buffer = await audioCtx.decodeAudioData(arrayBuf.slice(0));
    const url = URL.createObjectURL(file);

    return {
      id: uid(),
      name: file.name.replace(/\.[^/.]+$/, ""),
      fileName: file.name,
      url,
      buffer,
      startSec: 0,
      gain: 1,
      pan: 0,
      muted: false,
      solo: false
    };
  }

  async function addFiles(files: FileList) {
    setBusy(true);
    try {
      const arr = Array.from(files);
      pushLog(`Importing ${arr.length} file(s)...`);
      const newTracks = [];
      for (const f of arr) {
        newTracks.push(await decodeFileToTrack(f));
      }
      setTracks((t) => [...t, ...newTracks]);
      pushLog("Import complete.");
    } catch (e: any) {
      pushLog(`Import failed: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  }

  function updateTrack(id: string, patch: Partial<Track>) {
    setTracks((t) => t.map(tr => (tr.id === id ? { ...tr, ...patch } : tr)));
  }

  function removeTrack(id: string) {
    setTracks((t) => {
      const tr = t.find(x => x.id === id);
      if (tr?.url) URL.revokeObjectURL(tr.url);
      return t.filter(x => x.id !== id);
    });
  }

  function onPlayPause() {
    setPlaying((p) => !p);
  }

  function onStop() {
    setPlaying(false);
    setTime(0);
    pushLog("Stopped.");
  }

  // Recording (adds a new track)
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  async function onRecord() {
    try {
      if (isRecording) {
        mediaRecRef.current?.stop();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        setIsRecording(false);
        stream.getTracks().forEach(t => t.stop());

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const arrayBuf = await blob.arrayBuffer();

        // decode webm/opus (works in most modern browsers)
        const buffer = await audioCtx.decodeAudioData(arrayBuf.slice(0));
        const url = URL.createObjectURL(blob);

        const track: Track = {
          id: uid(),
          name: "Recording",
          fileName: "recording.webm",
          url,
          buffer,
          startSec: 0,
          gain: 1,
          pan: 0,
          muted: false,
          solo: false
        };

        setTracks((t) => [...t, track]);
        pushLog("Recording added as new track.");
      };

      mr.start();
      setIsRecording(true);
      pushLog("Recording started...");
    } catch (e: any) {
      pushLog(`Record failed: ${e?.message ?? e}`);
    }
  }

  async function mixAndMaster(format: "wav" | "mp3") {
    setBusy(true);
    try {
      pushLog("Mixdown started...");
      const mixed = await mixdownTracks(tracks, audioCtx);
      pushLog(`Mixdown complete. Duration: ${mixed.duration.toFixed(2)}s`);

      const wavBlob = audioBufferToWavBlob(mixed);
      pushLog("Sending to mastering backend...");

      const form = new FormData();
      form.append("audio_file", wavBlob, "mixdown.wav");

      const url = `${BACKEND}/master?format=${encodeURIComponent(format)}&target_lufs=-14`;
      const res = await fetch(url, { method: "POST", body: form });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.error ?? `Mastering failed (${res.status})`);
      }

      const outBlob = await res.blob();
      const dlUrl = URL.createObjectURL(outBlob);

      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = format === "mp3" ? "mastered.mp3" : "mastered.wav";
      document.body.appendChild(a);
      a.click();
      a.remove();

      pushLog(`Master complete. Downloaded ${a.download}`);
      setTimeout(() => URL.revokeObjectURL(dlUrl), 5000);
    } catch (e: any) {
      pushLog(`Mix/Master error: ${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <Transport
        playing={playing}
        time={time}
        onPlayPause={onPlayPause}
        onStop={onStop}
        onMixMaster={mixAndMaster}
        busy={busy}
      />

      <div className="main">
        <TrackPanel
          tracks={tracks}
          onAddFiles={addFiles}
          onRecord={onRecord}
          isRecording={isRecording}
          onUpdate={updateTrack}
          onRemove={removeTrack}
        />

        <Timeline tracks={tracks} playing={playing} time={time} />

        <MasterPanel log={log} />
      </div>
    </div>
  );
}
