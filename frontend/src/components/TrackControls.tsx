import React from 'react'
import { Volume2, VolumeX, Headphones } from 'lucide-react'

interface Track {
  id: string
  name: string
  volume: number
  muted: boolean
  solo: boolean
  audioUrl?: string
}

interface TrackControlsProps {
  track: Track
  onUpdate: (trackId: string, updates: Partial<Track>) => void
}

const TrackControls: React.FC<TrackControlsProps> = ({ track, onUpdate }) => {
  return (
    <div className="track-controls">
      <div className="track-info">
        <span className="track-name">{track.name}</span>
      </div>
      
      <div className="track-buttons">
        <button
          className={`btn btn-small ${track.muted ? 'active' : ''}`}
          onClick={() => onUpdate(track.id, { muted: !track.muted })}
        >
          <VolumeX size={16} />
        </button>
        <button
          className={`btn btn-small ${track.solo ? 'active' : ''}`}
          onClick={() => onUpdate(track.id, { solo: !track.solo })}
        >
          <Headphones size={16} />
        </button>
      </div>

      <div className="track-volume">
        <Volume2 size={16} />
        <input
          type="range"
          min="0"
          max="100"
          value={track.volume}
          onChange={(e) => onUpdate(track.id, { volume: parseInt(e.target.value) })}
          className="volume-slider"
        />
        <span className="volume-value">{track.volume}%</span>
      </div>

      {track.audioUrl && (
        <audio src={track.audioUrl} controls className="track-audio" />
      )}
    </div>
  )
}

export default TrackControls
