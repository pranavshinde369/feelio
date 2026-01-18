import { Mic, Heart, RotateCcw, Target, Captions, AlertCircle } from 'lucide-react';
import { MicState, IntentType } from '../types';

interface BottomDockProps {
  micState: MicState;
  captionsEnabled: boolean;
  onMicPress: () => void;
  onIntentSelect: (intent: IntentType) => void;
  onToggleCaptions: () => void;
  onOpenSafety: () => void;
}

export default function BottomDock({
  micState,
  captionsEnabled,
  onMicPress,
  onIntentSelect,
  onToggleCaptions,
  onOpenSafety,
}: BottomDockProps) {
  const getMicButtonClasses = () => {
    const baseClasses =
      'w-16 h-16 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-4';

    switch (micState) {
      case 'listening':
        return `${baseClasses} bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-xl animate-breathing focus:ring-teal-300`;
      case 'thinking':
        return `${baseClasses} bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xl animate-pulse focus:ring-amber-300`;
      default:
        return `${baseClasses} bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300 shadow-lg focus:ring-gray-300`;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-t border-teal-100/50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 order-2 sm:order-1">
            <button
              onClick={() => onIntentSelect('ground')}
              className="px-3 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-manrope font-medium transition-all border border-teal-200 hover:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-400 flex items-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ground me</span>
            </button>
            <button
              onClick={() => onIntentSelect('reframe')}
              className="px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-manrope font-medium transition-all border border-amber-200 hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reframe this</span>
            </button>
            <button
              onClick={() => onIntentSelect('plan')}
              className="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-manrope font-medium transition-all border border-blue-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center gap-1.5"
            >
              <Target className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Plan next step</span>
            </button>
          </div>

          <div className="order-1 sm:order-2">
            <button
              onClick={onMicPress}
              className={getMicButtonClasses()}
              aria-label={`Microphone ${micState}`}
            >
              <Mic className="w-7 h-7" />
            </button>
            {micState !== 'idle' && (
              <div className="text-center mt-2 text-xs font-manrope text-teal-600">
                {micState === 'listening' ? 'Listening...' : 'Processing...'}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 order-3">
            <button
              onClick={onToggleCaptions}
              className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                captionsEnabled
                  ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              aria-label={captionsEnabled ? 'Disable captions' : 'Enable captions'}
            >
              <Captions className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenSafety}
              className="flex items-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all border border-rose-200 hover:border-rose-300 font-manrope font-medium text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              aria-label="Open safety resources"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Safety</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
