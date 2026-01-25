from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
import io

app = FastAPI(title="AI DAW Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

def _to_float32_audio(data: np.ndarray) -> np.ndarray:
    if data.dtype.kind in ("i", "u"):
        max_val = np.iinfo(data.dtype).max
        data = data.astype(np.float32) / max_val
    else:
        data = data.astype(np.float32)
    return data

def _highpass(audio: np.ndarray, sr: int, cutoff_hz: float = 80.0) -> np.ndarray:
    dt = 1.0 / sr
    rc = 1.0 / (2.0 * np.pi * cutoff_hz)
    a = rc / (rc + dt)

    if audio.ndim == 1:
        y = np.zeros_like(audio)
        x_prev = 0.0
        y_prev = 0.0
        for i in range(audio.shape[0]):
            x = float(audio[i])
            y_i = a * (y_prev + x - x_prev)
            y[i] = y_i
            x_prev = x
            y_prev = y_i
        return y

    out = np.zeros_like(audio)
    for ch in range(audio.shape[1]):
        out[:, ch] = _highpass(audio[:, ch], sr, cutoff_hz)
    return out

def _soft_limiter(audio: np.ndarray, threshold: float = 0.95) -> np.ndarray:
    x = audio / threshold
    y = np.tanh(x) * threshold
    return y.astype(np.float32)

def _true_peak_guard(audio: np.ndarray, target_peak_db: float = -1.0) -> np.ndarray:
    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    if peak <= 0:
        return audio
    target = 10.0 ** (target_peak_db / 20.0)
    if peak > target:
        audio = audio * (target / peak)
    return audio.astype(np.float32)

def master_chain(audio: np.ndarray, sr: int, target_lufs: float = -14.0) -> np.ndarray:
    audio = _to_float32_audio(audio)
    audio = _highpass(audio, sr, 80.0)

    meter = pyln.Meter(sr)
    lufs_audio = audio[:, :2] if (audio.ndim == 2 and audio.shape[1] > 2) else audio
    loudness = meter.integrated_loudness(lufs_audio)

    gain_db = target_lufs - loudness
    gain = 10.0 ** (gain_db / 20.0)
    audio = (audio * gain).astype(np.float32)

    audio = _soft_limiter(audio, threshold=0.95)
    audio = _true_peak_guard(audio, target_peak_db=-1.0)
    return audio

@app.post("/master")
async def master(
    audio_file: UploadFile = File(...),
    format: str = Query("wav"),
    target_lufs: float = Query(-14.0)
):
    raw = await audio_file.read()

    try:
        data, sr = sf.read(io.BytesIO(raw), always_2d=False)
    except Exception as e:
        return JSONResponse({"error": f"Upload WAV only. Details: {e}"}, status_code=400)

    mastered = master_chain(data, sr, target_lufs=target_lufs)

    wav_buf = io.BytesIO()
    sf.write(wav_buf, mastered, sr, format="WAV", subtype="PCM_16")
    wav_bytes = wav_buf.getvalue()

    return Response(
        content=wav_bytes,
        media_type="audio/wav",
        headers={"Content-Disposition": "attachment; filename=mastered.wav"}
    )
