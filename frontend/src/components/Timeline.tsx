import React, { useEffect } from 'react'

interface TimelineProps {
  currentTime: number
  isPlaying: boolean
}

const Timeline: React.FC<TimelineProps> = ({ currentTime, isPlaying }) => {
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        // Timeline progression logic here
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  return (
    <div className="timeline">
      <div className="timeline-ruler">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="timeline-marker">
            {i * 5}s
          </div>
        ))}
      </div>
      <div className="timeline-playhead" style={{ left: `${currentTime}%` }} />
    </div>
  )
}

export default Timeline
