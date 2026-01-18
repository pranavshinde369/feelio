import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import TopBar from './components/TopBar';
import Transcript from './components/Transcript';
import SessionMirror from './components/SessionMirror';
import BottomDock from './components/BottomDock';
import {
  MicState,
  IntentType,
  TranscriptMessage,
  EmotionPoint,
  PlaybookAction,
  Emotion,
} from './types';

const mockMessages: TranscriptMessage[] = [
  {
    id: '1',
    speaker: 'user',
    text: "I've been feeling really overwhelmed with work lately.",
    timestamp: new Date(Date.now() - 600000),
    emotion: 'overwhelmed',
  },
  {
    id: '2',
    speaker: 'therapist',
    text: "That sounds challenging. Can you tell me what specific aspects feel most overwhelming?",
    timestamp: new Date(Date.now() - 540000),
  },
  {
    id: '3',
    speaker: 'user',
    text: "It's the deadlines. I feel like I can never catch up, and it's affecting my sleep.",
    timestamp: new Date(Date.now() - 480000),
    emotion: 'anxious',
  },
  {
    id: '4',
    speaker: 'therapist',
    text: "Sleep disruption can intensify stress. Let's explore some grounding techniques that might help you decompress in the evenings.",
    timestamp: new Date(Date.now() - 420000),
  },
  {
    id: '5',
    speaker: 'user',
    text: "That would be helpful. I'm willing to try anything at this point.",
    timestamp: new Date(Date.now() - 360000),
    emotion: 'hopeful',
  },
  {
    id: '6',
    speaker: 'therapist',
    text: "Great. One effective technique is the 5-4-3-2-1 method. Would you like to try it together now?",
    timestamp: new Date(Date.now() - 300000),
  },
];

const mockEmotionHistory: EmotionPoint[] = [
  { timestamp: new Date(Date.now() - 600000), emotion: 'overwhelmed', intensity: 8 },
  { timestamp: new Date(Date.now() - 540000), emotion: 'anxious', intensity: 7 },
  { timestamp: new Date(Date.now() - 480000), emotion: 'anxious', intensity: 7.5 },
  { timestamp: new Date(Date.now() - 420000), emotion: 'anxious', intensity: 6 },
  { timestamp: new Date(Date.now() - 360000), emotion: 'hopeful', intensity: 5 },
  { timestamp: new Date(Date.now() - 300000), emotion: 'calm', intensity: 4 },
];

const mockPlaybookActions: PlaybookAction[] = [
  {
    id: '1',
    title: 'Practice 5-4-3-2-1 Grounding',
    description:
      'Guide through identifying 5 things you see, 4 things you touch, 3 things you hear, 2 things you smell, and 1 thing you taste.',
    category: 'grounding',
  },
  {
    id: '2',
    title: 'Reframe Work Pressure',
    description:
      'Help identify one task you can delegate or postpone to reduce immediate pressure.',
    category: 'reframing',
  },
  {
    id: '3',
    title: 'Create Evening Wind-Down Ritual',
    description:
      'Develop a specific 15-minute routine to transition from work to rest, including screen time boundaries.',
    category: 'planning',
  },
];

function App() {
  const [micState, setMicState] = useState<MicState>('idle');
  const [micEnabled, setMicEnabled] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [sessionDuration, setSessionDuration] = useState('12:34');
  const [messages] = useState<TranscriptMessage[]>(mockMessages);
  const [emotionHistory] = useState<EmotionPoint[]>(mockEmotionHistory);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('calm');
  const [currentAction, setCurrentAction] = useState<PlaybookAction>(mockPlaybookActions[0]);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - (Date.now() - 754000);
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setSessionDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (emotionHistory.length > 0) {
      const latest = emotionHistory[emotionHistory.length - 1];
      setCurrentEmotion(latest.emotion);
    }
  }, [emotionHistory]);

  const handleMicPress = () => {
    if (micState === 'idle') {
      setMicState('listening');
      setTimeout(() => {
        setMicState('thinking');
        setTimeout(() => {
          setMicState('idle');
        }, 2000);
      }, 3000);
    }
  };

  const handleIntentSelect = (intent: IntentType) => {
    const actionMap: Record<IntentType, PlaybookAction> = {
      ground: mockPlaybookActions[0],
      reframe: mockPlaybookActions[1],
      plan: mockPlaybookActions[2],
    };
    setCurrentAction(actionMap[intent]);
  };

  const handleToggleMic = () => {
    setMicEnabled(!micEnabled);
  };

  const handleToggleCaptions = () => {
    setCaptionsEnabled(!captionsEnabled);
  };

  const handleDownloadSummary = () => {
    console.log('Downloading summary...');
  };

  const handleOpenSafety = () => {
    setShowSafetyModal(true);
  };

  const handleCloseSafety = () => {
    setShowSafetyModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-teal-50 backdrop-grain font-manrope">
      <TopBar
        sessionDuration={sessionDuration}
        micState={micState}
        micEnabled={micEnabled}
        onToggleMic={handleToggleMic}
        onDownloadSummary={handleDownloadSummary}
      />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 backdrop-blur-sm bg-white/60 rounded-2xl p-6 sm:p-8 shadow-lg border border-teal-100/50 max-h-[calc(100vh-280px)] overflow-y-auto">
            <h2 className="font-sora text-lg font-semibold text-teal-900 mb-6">
              Session Transcript
            </h2>
            <Transcript messages={messages} />
          </div>

          <div className="lg:col-span-1 sticky top-24 max-h-[calc(100vh-280px)] overflow-y-auto">
            <SessionMirror
              currentEmotion={currentEmotion}
              emotionHistory={emotionHistory}
              nextAction={currentAction}
            />
          </div>
        </div>
      </main>

      <BottomDock
        micState={micState}
        captionsEnabled={captionsEnabled}
        onMicPress={handleMicPress}
        onIntentSelect={handleIntentSelect}
        onToggleCaptions={handleToggleCaptions}
        onOpenSafety={handleOpenSafety}
      />

      {showSafetyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-in">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-sora text-xl font-semibold text-gray-900">
                Safety Resources
              </h3>
              <button
                onClick={handleCloseSafety}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Close safety resources"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                <p className="text-sm font-manrope font-semibold text-rose-900 mb-2">
                  National Suicide Prevention Lifeline
                </p>
                <p className="text-lg font-sora font-bold text-rose-700">988</p>
                <p className="text-xs text-rose-600 mt-1">Available 24/7</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm font-manrope font-semibold text-blue-900 mb-2">
                  Crisis Text Line
                </p>
                <p className="text-lg font-sora font-bold text-blue-700">Text HOME to 741741</p>
                <p className="text-xs text-blue-600 mt-1">Free, 24/7 crisis support</p>
              </div>

              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                <p className="text-sm font-manrope font-semibold text-teal-900 mb-2">
                  SAMHSA National Helpline
                </p>
                <p className="text-lg font-sora font-bold text-teal-700">1-800-662-4357</p>
                <p className="text-xs text-teal-600 mt-1">
                  Treatment referral and information
                </p>
              </div>

              <p className="text-xs text-gray-500 font-manrope text-center pt-2">
                If you're experiencing a medical emergency, please call 911 immediately.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
