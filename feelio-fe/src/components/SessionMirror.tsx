import { useEffect, useRef } from 'react';
import { TrendingUp, Lightbulb, Activity, Sparkles } from 'lucide-react';
import { Emotion, EmotionPoint, PlaybookAction } from '../types';

interface SessionMirrorProps {
  currentEmotion: Emotion;
  emotionHistory: EmotionPoint[];
  nextAction: PlaybookAction | null;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

const emotionColors: Record<string, { bg: string; text: string; glow: string }> = {
  calm: { bg: 'bg-teal-100', text: 'text-teal-700', glow: 'shadow-teal-200' },
  anxious: { bg: 'bg-amber-100', text: 'text-amber-700', glow: 'shadow-amber-200' },
  hopeful: { bg: 'bg-emerald-100', text: 'text-emerald-700', glow: 'shadow-emerald-200' },
  sad: { bg: 'bg-blue-100', text: 'text-blue-700', glow: 'shadow-blue-200' },
  frustrated: { bg: 'bg-orange-100', text: 'text-orange-700', glow: 'shadow-orange-200' },
  confused: { bg: 'bg-purple-100', text: 'text-purple-700', glow: 'shadow-purple-200' },
  relieved: { bg: 'bg-cyan-100', text: 'text-cyan-700', glow: 'shadow-cyan-200' },
  overwhelmed: { bg: 'bg-rose-100', text: 'text-rose-700', glow: 'shadow-rose-200' },
};

export default function SessionMirror({
  currentEmotion,
  emotionHistory,
  nextAction,
  videoRef,
}: SessionMirrorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const historyToRender = emotionHistory.slice(-20);
  const currentIntensity = emotionHistory.length > 0 ? emotionHistory[emotionHistory.length - 1].intensity : 5;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || emotionHistory.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 10;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(20, 184, 166, 0.3)');
    gradient.addColorStop(1, 'rgba(20, 184, 166, 0.05)');

    ctx.beginPath();
    emotionHistory.forEach((point, index) => {
      const x = padding + (index / (emotionHistory.length - 1)) * chartWidth;
      const y = padding + chartHeight - (point.intensity / 10) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    emotionHistory.forEach((point, index) => {
      const x = padding + (index / (emotionHistory.length - 1)) * chartWidth;
      const y = padding + chartHeight - (point.intensity / 10) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [emotionHistory]);

  return (
    <div className="flex flex-col gap-6">
      <div className="backdrop-blur-sm bg-white/60 rounded-2xl p-6 shadow-lg border border-teal-100/50">
        <h2 className="font-sora text-sm font-semibold text-teal-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Session Mirror
        </h2>

        {/* Video Feed */}
        <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border-2 border-teal-100 shadow-inner group">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          />

          {/* Active Badge (Subtler) */}
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-medium text-white/90 font-manrope tracking-wide">VISION ON</span>
          </div>

          {/* Emotion Overlay (Prominent) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-xs text-gray-300 font-manrope font-medium mb-0.5">Detected Emotion</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-sora font-bold text-white tracking-tight capitalize">
                {currentEmotion}
              </span>
              <div className="px-2 py-1 rounded bg-white/20 backdrop-blur-sm text-xs text-white font-medium">
                {Math.round(currentIntensity * 10)}%
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-teal-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-teal-900 font-sora">Emotional Journey</h3>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>

          {/* Simplified Graph */}
          <div className="h-32 flex items-end gap-1 px-1">
            {historyToRender.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 italic">
                Speak to see emotion data...
              </div>
            ) : (
              historyToRender.map((point, index) => (
                <div
                  key={index}
                  className="flex-1 bg-teal-400/80 hover:bg-teal-500 transition-colors rounded-t-sm relative group"
                  style={{ height: `${point.intensity * 10}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {point.emotion}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {nextAction && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100/50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1">
                Suggested Action
              </p>
              <h4 className="font-sora font-semibold text-gray-900 text-sm mb-1">
                {nextAction.title}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed font-manrope">
                {nextAction.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
