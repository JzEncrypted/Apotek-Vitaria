import React, { useState, useEffect, useRef } from 'react';
import { FAIcon } from '../common/FAIcon';

interface VoiceNotePlayerProps {
  audioUrl?: string;
  duration?: number; // in seconds
  isOwnMessage?: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  audioUrl,
  duration = 5,
  isOwnMessage = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  // Fallback timer simulation if audioUrl is a dummy or blob
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isPlaying, duration]);

  const togglePlay = () => {
    if (!isPlaying) {
      if (currentTime >= duration) setCurrentTime(0);
      setIsPlaying(true);
      if (audioRef.current && audioUrl && audioUrl.startsWith('data:audio')) {
        audioRef.current.play().catch(() => {});
      }
    } else {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 16 stylized waveform bars
  const waveBars = [6, 12, 18, 14, 22, 16, 10, 20, 24, 18, 12, 16, 20, 14, 10, 8];

  return (
    <div className="flex items-center gap-3 py-1 select-none min-w-[210px] max-w-[260px]">
      {audioUrl && audioUrl.startsWith('data:audio') && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}

      {/* Play / Pause Circular Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm ${
          isOwnMessage
            ? 'bg-white text-[#587A58] hover:bg-white/90'
            : 'bg-[#84A282] text-white hover:bg-[#688C66]'
        }`}
        aria-label={isPlaying ? 'Jeda Voice Note' : 'Putar Voice Note'}
      >
        <FAIcon name={isPlaying ? 'pause' : 'play'} className="text-xs ml-0.5" />
      </button>

      {/* Waveform Visualization & Time */}
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        <div className="flex items-center gap-[3px] h-6 cursor-pointer" onClick={togglePlay}>
          {waveBars.map((h, i) => {
            const progressRatio = currentTime / (duration || 1);
            const barRatio = i / waveBars.length;
            const isPlayed = barRatio <= progressRatio;

            return (
              <span
                key={i}
                style={{ height: `${h}px` }}
                className={`w-[3px] rounded-full transition-all duration-200 ${
                  isOwnMessage
                    ? isPlayed
                      ? 'bg-white'
                      : 'bg-white/40'
                    : isPlayed
                    ? 'bg-[#587A58]'
                    : 'bg-[#CBD5C8]'
                } ${isPlaying && isPlayed ? 'animate-pulse' : ''}`}
              />
            );
          })}
        </div>

        {/* Duration Timer Display */}
        <div className="flex items-center justify-between text-[10px] font-mono leading-none">
          <span className={isOwnMessage ? 'text-white/80' : 'text-[#778477]'}>
            {isPlaying ? formatSec(currentTime) : formatSec(duration)}
          </span>
          <span className={isOwnMessage ? 'text-white/60' : 'text-[#778477]/70'}>
            Voice Note
          </span>
        </div>
      </div>
    </div>
  );
};

export default VoiceNotePlayer;
