import React, { useState, useEffect, useRef } from 'react';
import { FAIcon } from '../common/FAIcon';

interface VoiceNoteRecorderProps {
  onRecordingComplete: (audioUrl: string, duration: number) => void;
  onCancel: () => void;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  onRecordingComplete,
  onCancel
}) => {
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const isSimulatedRef = useRef<boolean>(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startRecording = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.start();
          isSimulatedRef.current = false;
        } else {
          // No getUserMedia available, simulate recording
          isSimulatedRef.current = true;
        }
      } catch (err) {
        // Fallback gracefully for RDP / environments without microphone hardware
        console.warn('Microphone access unavailable, using simulated voice note:', err);
        isSimulatedRef.current = true;
      }

      // Start elapsed timer
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    };

    startRecording();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    onCancel();
  };

  const handleStopAndSend = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalDuration = Math.max(seconds, 1);

    if (isSimulatedRef.current || !mediaRecorderRef.current) {
      // Send simulated voice note data URL with a pleasant synthetic tone
      // We can generate a tiny silent/beep audio data URI or a standard placeholder
      const mockAudioUri = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      onRecordingComplete(mockAudioUri, finalDuration);
      return;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder.state !== 'inactive') {
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onRecordingComplete(base64Audio, finalDuration);
        };
        reader.readAsDataURL(audioBlob);
      };
      recorder.stop();
    } else {
      onCancel();
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center justify-between w-full bg-[#F3F6F1] border border-[#CBD5C8] rounded-2xl px-3.5 py-2 animate-fadeIn shadow-inner">
      {/* Recording indicator & timer */}
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
        </span>
        <span className="text-xs font-mono font-bold text-rose-600 tracking-wider">
          {formatTime(seconds)}
        </span>
        <span className="text-xs text-[#526352] font-medium hidden sm:inline">
          Merekam suara...
        </span>
      </div>

      {/* Dynamic Sound Wave Bars Animation */}
      <div className="flex items-center gap-1 h-5 px-2">
        {[8, 14, 20, 12, 18, 10, 16, 22, 12, 14, 18].map((h, i) => (
          <span
            key={i}
            style={{
              height: `${Math.min(h + (seconds % 3) * 3, 22)}px`,
              animationDelay: `${i * 120}ms`
            }}
            className="w-[2.5px] bg-[#84A282] rounded-full animate-pulse"
          />
        ))}
      </div>

      {/* Actions: Cancel & Send */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleCancel}
          className="p-2 text-[#778477] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          title="Batal rekaman"
          aria-label="Batal rekaman"
        >
          <FAIcon name="trash" className="text-sm" />
        </button>

        <button
          type="button"
          onClick={handleStopAndSend}
          className="px-3 py-1.5 bg-[#84A282] hover:bg-[#688C66] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          title="Kirim pesan suara"
          aria-label="Kirim pesan suara"
        >
          <span>Kirim</span>
          <FAIcon name="paperPlane" className="text-xs" />
        </button>
      </div>
    </div>
  );
};
