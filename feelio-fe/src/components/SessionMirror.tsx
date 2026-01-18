import { useEffect, useRef } from 'react';
import { TrendingUp, Lightbulb } from 'lucide-react';
import { Emotion, EmotionPoint, PlaybookAction } from '../types';

interface SessionMirrorProps {
  currentEmotion: Emotion;
  emotionHistory: EmotionPoint[];
  nextAction: PlaybookAction | null;
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
}: SessionMirrorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

        <div className="mb-6">
          <div className="text-xs text-teal-600/60 font-manrope mb-2">Current emotion</div>
          <div
            className={`inline-flex items-center px-4 py-2 rounded-full text-base font-manrope font-semibold ${
              emotionColors[currentEmotion].bg
            } ${emotionColors[currentEmotion].text} animate-pulse-soft shadow-lg ${
              emotionColors[currentEmotion].glow
            }`}
          >
            {currentEmotion}
          </div>
        </div>

        <div>
          <div className="text-xs text-teal-600/60 font-manrope mb-2">Emotion trajectory</div>
          <div className="bg-gradient-to-br from-teal-50/50 to-cyan-50/50 rounded-xl p-4 border border-teal-100/30">
            <canvas
              ref={canvasRef}
              className="w-full h-24"
              style={{ width: '100%', height: '96px' }}
            />
          </div>
        </div>
      </div>

      {nextAction && (
        <div
          className="backdrop-blur-sm bg-white/60 rounded-2xl p-6 shadow-lg border border-amber-100/50 animate-slide-in"
          key={nextAction.id}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-sora text-sm font-semibold text-amber-900 mb-1">
                Next Action
              </h3>
              <p className="text-sm text-amber-800 font-manrope font-medium mb-2">
                {nextAction.title}
              </p>
              <p className="text-xs text-amber-700/70 font-manrope leading-relaxed">
                {nextAction.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
