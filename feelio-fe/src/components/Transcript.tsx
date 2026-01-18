import { TranscriptMessage } from '../types';

interface TranscriptProps {
  messages: TranscriptMessage[];
}

const emotionColors: Record<string, { bg: string; text: string; border: string }> = {
  calm: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  anxious: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  hopeful: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  sad: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  frustrated: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  confused: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  relieved: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  overwhelmed: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function Transcript({ messages }: TranscriptProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className="animate-fade-in"
          style={{
            animationDelay: `${index * 50}ms`,
            animationFillMode: 'both',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-manrope font-semibold ${
                message.speaker === 'user'
                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white'
                  : 'bg-gradient-to-br from-teal-500 to-teal-600 text-white'
              }`}
            >
              {message.speaker === 'user' ? 'U' : 'T'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-teal-600/60 font-manrope">
                  {formatTime(message.timestamp)}
                </span>
                {message.emotion && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-manrope font-medium border ${
                      emotionColors[message.emotion].bg
                    } ${emotionColors[message.emotion].text} ${
                      emotionColors[message.emotion].border
                    }`}
                  >
                    {message.emotion}
                  </span>
                )}
              </div>

              <p className="text-sm leading-relaxed text-gray-700 font-manrope">
                {message.text}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
