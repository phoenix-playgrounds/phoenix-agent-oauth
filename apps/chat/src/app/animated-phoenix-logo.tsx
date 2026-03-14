import { useState } from 'react';

const PHOENIX_LOGO_SRC = '/phoenix.png';
const LOGO_ALT = 'Phoenix Logo';
const EXPLODE_PARTICLE_COUNT = 12;
const PULSE_GLOW_GRADIENT =
  'radial-gradient(circle, rgb(139 92 246 / 0.5) 0%, rgb(236 72 153 / 0.3) 40%, transparent 70%)';

const IMG_BASE_CLASS =
  'w-full h-full object-contain transition-all duration-500 ease-out';
const IMG_IDLE_CLASS = 'scale-100 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]';
const IMG_HOVER_CLASS =
  'scale-125 rotate-12 drop-shadow-[0_0_25px_rgba(236,72,153,1)]';

export function AnimatedPhoenixLogo({ className = '' }: { className?: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative ${className}`.trim()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`absolute inset-0 -m-2 rounded-full pointer-events-none ${isHovered ? 'animate-spin-slow' : ''}`}>
        <div className={`w-full h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-40 blur-md ${isHovered ? 'animate-pulse' : ''}`} />
      </div>
      <div className="absolute inset-0 -m-1 pointer-events-none">
        <div className={`w-full h-full rounded-full border-2 border-violet-400/30 ${isHovered ? 'animate-ping-slow' : ''}`} />
      </div>
      <div className="absolute inset-0 -m-1 pointer-events-none">
        <div className={`w-full h-full rounded-full border-2 border-pink-400/30 ${isHovered ? 'animate-ping-slower' : ''}`} />
      </div>
      <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
        <div className={`absolute w-1 h-12 bg-gradient-to-b from-cyan-400 to-transparent blur-sm ${isHovered ? 'animate-energy-flow-1' : ''}`} />
        <div className={`absolute w-1 h-12 bg-gradient-to-b from-pink-400 to-transparent blur-sm ${isHovered ? 'animate-energy-flow-2' : ''}`} />
        <div className={`absolute w-1 h-12 bg-gradient-to-b from-yellow-400 to-transparent blur-sm ${isHovered ? 'animate-energy-flow-3' : ''}`} />
      </div>
      <div className={`absolute inset-0 pointer-events-none ${isHovered ? 'animate-spin-slow' : ''}`}>
        <div className={`absolute top-0 left-1/2 w-1.5 h-1.5 -ml-0.75 bg-cyan-400 rounded-full shadow-[0_0_10px_2px_rgba(34,211,238,0.8)] ${isHovered ? 'animate-pulse' : ''}`} />
      </div>
      <div className={`absolute inset-0 pointer-events-none ${isHovered ? 'animate-spin-reverse' : ''}`}>
        <div className={`absolute bottom-0 left-1/2 w-1.5 h-1.5 -ml-0.75 bg-pink-400 rounded-full shadow-[0_0_10px_2px_rgba(236,72,153,0.8)] ${isHovered ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative z-10">
        <img
          src={PHOENIX_LOGO_SRC}
          alt={LOGO_ALT}
          className={`${IMG_BASE_CLASS} ${isHovered ? IMG_HOVER_CLASS : IMG_IDLE_CLASS}`}
          style={{ filter: 'brightness(1.1) saturate(1.2)' }}
        />
        <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none">
          <div
            className={`w-3/4 h-3/4 rounded-full blur-xl ${isHovered ? 'animate-pulse-glow' : ''}`}
            style={{ background: PULSE_GLOW_GRADIENT }}
          />
        </div>
      </div>

      {isHovered &&
        Array.from({ length: EXPLODE_PARTICLE_COUNT }, (_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full animate-explode shadow-[0_0_15px_5px_rgba(255,255,255,0.8)]"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-${20 + (i % 5) * 5}px)`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
    </div>
  );
}
