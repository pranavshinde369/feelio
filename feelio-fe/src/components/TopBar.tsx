import { Mic, MicOff, Shield, Download, Clock } from 'lucide-react';
import { MicState } from '../types';

interface TopBarProps {
  sessionDuration: string;
  micState: MicState;
  micEnabled: boolean;
  onToggleMic: () => void;
  onDownloadSummary: () => void;
}

export default function TopBar({
  sessionDuration,
  micState,
  micEnabled,
  onToggleMic,
  onDownloadSummary,
}: TopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/70 border-b border-teal-100/50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="font-sora text-2xl font-semibold bg-gradient-to-r from-amber-600 to-teal-700 bg-clip-text text-transparent">
            Feelio
          </h1>

          <div className="hidden sm:flex items-center gap-2 text-sm text-teal-700 font-manrope">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{sessionDuration}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMic}
            className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 ${
              micEnabled
                ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
            aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-teal-50/80 rounded-full text-xs text-teal-700 font-manrope">
            <Shield className="w-3.5 h-3.5" />
            <span>On-device capture; cloud LLM replies</span>
          </div>

          <button
            onClick={onDownloadSummary}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all font-manrope font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            aria-label="Download session summary"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
