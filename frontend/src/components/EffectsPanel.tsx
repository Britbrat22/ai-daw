import React, { useState } from 'react'
import { Sparkles, Sliders, Filter } from 'lucide-react'

const EffectsPanel: React.FC = () => {
  const [selectedEffect, setSelectedEffect] = useState<string>('eq')

  const effects = [
    { id: 'eq', name: 'EQ', icon: Filter },
    { id: 'compressor', name: 'Compressor', icon: Sliders },
    { id: 'ai-enhance', name: 'AI Enhance', icon: Sparkles },
  ]

  return (
    <div className="effects-panel">
      <h3>Effects</h3>
      <div className="effects-list">
        {effects.map(effect => {
          const Icon = effect.icon
          return (
            <button
              key={effect.id}
              className={`effect-button ${selectedEffect === effect.id ? 'active' : ''}`}
              onClick={() => setSelectedEffect(effect.id)}
            >
              <Icon size={20} />
              <span>{effect.name}</span>
            </button>
          )
        })}
      </div>

      <div className="effect-controls">
        {selectedEffect === 'eq' && (
          <div className="eq-controls">
            <h4>Equalizer</h4>
            <div className="eq-bands">
              {['Low', 'Mid', 'High'].map(band => (
                <div key={band} className="eq-band">
                  <label>{band}</label>
                  <input type="range" min="-12" max="12" defaultValue="0" />
                  <span>0dB</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {selectedEffect === 'ai-enhance' && (
          <div className="ai-controls">
            <h4>AI Audio Enhancement</h4>
            <button className="btn btn-ai">
              <Sparkles size={16} />
              Enhance Audio
            </button>
            <div className="ai-options">
              <label>
                <input type="checkbox" /> Vocal Isolation
              </label>
              <label>
                <input type="checkbox" /> Noise Reduction
              </label>
              <label>
                <input type="checkbox" /> Mastering
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EffectsPanel
