import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import TopBar from './components/TopBar';
import Transcript from './components/Transcript';
import SessionMirror from './components/SessionMirror';
import BottomDock from './components/BottomDock';
import { apiService } from './services/api';
import { useVision } from './hooks/useVision';
import { useTTS } from './hooks/useTTS';
import {
  MicState,
  IntentType,
  TranscriptMessage,
  EmotionPoint,
  PlaybookAction,
  Emotion,
} from './types';

const emotionIntensityMap: Record<string, number> = {
  angry: 8,
  anxious: 7,
  calm: 3,
  disgusted: 8,
  fearful: 7,
  happy: 2,
  neutral: 4,
  overwhelmed: 8,
  sad: 6,
  surprised: 5,
  hopeful: 2,
};

const emotionMap: Record<string, Emotion> = {
  angry: 'anxious',
  anxious: 'anxious',
  calm: 'calm',
  disgusted: 'anxious',
  fearful: 'anxious',
  happy: 'calm',
  neutral: 'calm',
  overwhelmed: 'overwhelmed',
  sad: 'anxious',
  surprised: 'calm',
  hopeful: 'hopeful',
};

function App() {
  const [micState, setMicState] = useState<MicState>('idle');
  const [micEnabled, setMicEnabled] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [sessionDuration, setSessionDuration] = useState('00:00');
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [emotionHistory, setEmotionHistory] = useState<EmotionPoint[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('calm');
  const [currentAction, setCurrentAction] = useState<PlaybookAction>({
    id: '1',
    title: 'Start a conversation',
    description: 'Click the microphone to begin your therapy session.',
    category: 'planning',
  });
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  const sessionStartTimeRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { emotion: detectedEmotion } = useVision(videoRef, sessionStarted);
  const { speak, isSpeaking } = useTTS();

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionStartTimeRef.current) {
        const elapsed = Date.now() - sessionStartTimeRef.current;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setSessionDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update backend emotion history when local vision detects new emotion
  useEffect(() => {
    if (detectedEmotion && sessionStarted) {
      // Map DetectedEmotion to App Emotion
      const map: Record<string, Emotion> = {
        'happy': 'hopeful',
        'sad': 'sad',
        'surprise': 'confused',
        'neutral': 'calm'
      };
      const mappedEmotion = map[detectedEmotion] || 'calm';
      setCurrentEmotion(mappedEmotion);
    }
  }, [detectedEmotion, sessionStarted]);

  // Update emotion from history (if backend returns different emotion)
  useEffect(() => {
    if (emotionHistory.length > 0) {
      const latest = emotionHistory[emotionHistory.length - 1];
      setCurrentEmotion(latest.emotion);
    }
  }, [emotionHistory]);

  // Start Camera when session starts
  useEffect(() => {
    const startCamera = async () => {
      if (sessionStarted && videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          videoRef.current.srcObject = stream;
        } catch (e) {
          console.error("Camera access failed", e);
        }
      }
    };
    startCamera();
  }, [sessionStarted]);


  // Initialize session
  const initializeSession = async () => {
    try {
      setLoading(true);
      const sessionId = await apiService.startSession();
      setSessionStarted(true);
      sessionStartTimeRef.current = Date.now();
      setMessages([]);
      setEmotionHistory([]);
      console.log('Session started:', sessionId);
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start session. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // End session
  const endSession = async () => {
    if (!sessionStarted) return;
    try {
      await apiService.endSession();
      setSessionStarted(false);
      setMessages([]);
      setEmotionHistory([]);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      window.speechSynthesis.cancel();
    } catch (e) {
      console.error("Error ending session", e);
    }
  };

  // Handle microphone press
  const handleMicPress = async () => {
    if (!sessionStarted) {
      await initializeSession();
      // Don't return, try to start listening immediately if possible or let user click again
      // return; 
    }

    if (micState === 'idle') {
      try {
        setMicState('listening');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        recorder.onstop = async () => {
          setMicState('thinking');
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const text = await transcribeAudio(audioBlob);

          if (text) {
            // Map vision detected emotion to types
            const map: Record<string, Emotion> = {
              'happy': 'hopeful',
              'sad': 'sad',
              'surprise': 'confused',
              'neutral': 'calm'
            };
            const currentMapped = detectedEmotion ? (map[detectedEmotion] || 'calm') : 'calm';

            // Add user message
            const userMessage: TranscriptMessage = {
              id: Date.now().toString(),
              speaker: 'user',
              text,
              timestamp: new Date(),
              emotion: currentMapped,
            };
            setMessages((prev) => [...prev, userMessage]);

            // Get AI response
            try {
              // Send text + detected emotion to backend (backend accepts string so raw detectedEmotion is likely fine, or mapped)
              // Let's send mapped to be consistent with frontend types if backend also uses them?
              // The backend `app.py` seems to accept any string but keys off specific ones.
              // Let's send the raw detected string ('happy' etc) if backend supports it, logic in backend `vision_module` produced 'happy','sad','surprise','neutral'.
              // So backend expects 'happy', 'sad' etc.
              // We should send `detectedEmotion` raw to backend, but use mapped for Frontend UI.

              const response = await apiService.sendMessage(text, detectedEmotion || 'neutral');
              const therapistMessage: TranscriptMessage = {
                id: (Date.now() + 1).toString(),
                speaker: 'therapist',
                text: response.response,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, therapistMessage]);

              // Update emotion history from backend response
              // Backend response.emotion might be 'happy', 'sad' etc.
              // Need to map it back to UI types
              const backendEmotion = response.emotion;
              // Add a generic map or reuse existing emotionMap
              const uiEmotion = (emotionMap[backendEmotion] || map[backendEmotion] || 'calm') as Emotion;

              const intensity = emotionIntensityMap[backendEmotion] || 5;
              const newEmotionPoint: EmotionPoint = {
                timestamp: new Date(),
                emotion: uiEmotion,
                intensity,
              };
              setEmotionHistory((prev) => [...prev, newEmotionPoint]);

              // Speak response
              speak(response.response);

              // Check for crisis
              if (response.crisis_detected) {
                setShowSafetyModal(true);
              }
            } catch (error) {
              console.error('Error getting response:', error);
              speak("I'm having trouble connecting right now.");
            }
          }

          // Stop stream
          stream.getTracks().forEach((track) => track.stop());
          setMicState('idle');
        };

        recorder.start();

        // Stop recording after 10 seconds or when user stops
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, 10000);
      } catch (error) {
        console.error('Microphone error:', error);
        alert('Microphone not available. Please check permissions.');
        setMicState('idle');
      }
    } else if (micState === 'listening') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  // Transcribe audio (using Web Speech API)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const transcribeAudio = async (_blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      // Use Web Speech API if available (faster/cheaper than calling backend STT if backend even has it exposed)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          resolve(transcript);
        };
        recognition.onerror = (e: any) => {
          console.error("Speech recognition error", e);
          resolve('');
        };
        recognition.start();

      } else {
        alert("Speech Recognition not supported in this browser.");
        resolve('');
      }
    });
  };

  const handleIntentSelect = (intent: IntentType) => {
    // In a real app we might fetch actions from backend
    const actions: Record<IntentType, PlaybookAction> = {
      ground: { id: 'g1', title: '5-4-3-2-1 Grounding', description: 'Name 5 things you see, 4 you feel...', category: 'grounding' },
      reframe: { id: 'r1', title: 'Reframe Negative Thought', description: 'Is this thought a fact or an opinion?', category: 'reframing' },
      plan: { id: 'p1', title: 'Make a Micro-Plan', description: 'What is one small step you can take?', category: 'planning' },
    };
    setCurrentAction(actions[intent]);
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

  // Handle initial state
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const isHealthy = await apiService.healthCheck();
        if (!isHealthy) {
          // Don't alert immediately, maybe it takes time to wake up (Render/Heroku)
          console.warn("Backend not healthy yet");
        }
      } catch (error) {
        console.error('Backend check failed:', error);
      }
    };
    checkBackend();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-teal-50 to-orange-50 animate-gradient-slow backdrop-grain font-manrope">
      <TopBar
        sessionDuration={sessionDuration}
        micState={micState}
        micEnabled={micEnabled}
        onToggleMic={handleToggleMic}
        onDownloadSummary={handleDownloadSummary}
        onEndSession={endSession}
        sessionStarted={sessionStarted}
      />

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="fixed top-24 right-4 z-50 px-4 py-2 bg-teal-600/90 text-white rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm animate-pulse flex items-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full animate-ping" />
          Speaking...
        </div>
      )}

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
        <div className="grid grid-cols-1 lg:col-span-3 gap-8">
          <div className="lg:col-span-2 backdrop-blur-sm bg-white/60 rounded-2xl p-6 sm:p-8 shadow-lg border border-teal-100/50 max-h-[calc(100vh-280px)] overflow-y-auto">
            <h2 className="font-sora text-lg font-semibold text-teal-900 mb-6">
              Session Transcript
            </h2>
            {!sessionStarted ? (
              <div className="text-center py-12">
                <p className="text-gray-600 font-manrope mb-4">No session started yet</p>
                <button
                  onClick={initializeSession}
                  disabled={loading}
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 transition-all font-sora shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  {loading ? 'Starting...' : 'Start Session'}
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="font-manrope">Click the microphone to start talking</p>
              </div>
            ) : (
              <Transcript messages={messages} />
            )}
          </div>

          <div className="lg:col-span-1 sticky top-24 max-h-[calc(100vh-280px)] overflow-y-auto">
            <SessionMirror
              currentEmotion={currentEmotion}
              emotionHistory={emotionHistory}
              nextAction={currentAction}
              videoRef={videoRef}
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
