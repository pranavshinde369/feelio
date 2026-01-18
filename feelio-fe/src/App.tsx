import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, Send, Activity, Video as VideoIcon } from 'lucide-react';
import { apiService } from './services/api';
import { useVision } from './hooks/useVision';
import { useTTS } from './hooks/useTTS';
import {
  MicState,
  TranscriptMessage,
  EmotionPoint,
  Emotion,
} from './types';

// Emotion Mapping Colors for Light Theme
const emotionColors: Record<string, string> = {
  calm: 'text-teal-600 bg-teal-50 border-teal-200',
  happy: 'text-amber-600 bg-amber-50 border-amber-200',
  sad: 'text-blue-600 bg-blue-50 border-blue-200',
  anxious: 'text-orange-600 bg-orange-50 border-orange-200',
  neutral: 'text-slate-600 bg-slate-50 border-slate-200',
  hopeful: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  confused: 'text-purple-600 bg-purple-50 border-purple-200',
  surprised: 'text-pink-600 bg-pink-50 border-pink-200',
};

const emotionIntensityMap: Record<string, number> = {
  angry: 8, anxious: 7, calm: 3, disgusted: 8, fearful: 7, happy: 2,
  neutral: 4, overwhelmed: 8, sad: 6, surprised: 5, hopeful: 2,
};

const emotionMap: Record<string, Emotion> = {
  angry: 'anxious', anxious: 'anxious', calm: 'calm', disgusted: 'anxious',
  fearful: 'anxious', happy: 'calm', neutral: 'calm', overwhelmed: 'overwhelmed',
  sad: 'anxious', surprised: 'calm', hopeful: 'hopeful',
};

function App() {
  const [micState, setMicState] = useState<MicState>('idle');
  const [sessionDuration, setSessionDuration] = useState('00:00');
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [emotionHistory, setEmotionHistory] = useState<EmotionPoint[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('calm');
  const [inputText, setInputText] = useState('');

  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const sessionStartTimeRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { emotion: detectedEmotion, isLoaded: visionLoaded } = useVision(videoRef, sessionStarted);
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

  // Sync Vision -> App State
  useEffect(() => {
    if (detectedEmotion && sessionStarted) {
      const map: Record<string, Emotion> = {
        'happy': 'hopeful', 'sad': 'sad', 'surprise': 'confused', 'neutral': 'calm'
      };
      setCurrentEmotion(map[detectedEmotion] || 'calm');
    }
  }, [detectedEmotion, sessionStarted]);

  // Sync History -> App State
  useEffect(() => {
    if (emotionHistory.length > 0) {
      setCurrentEmotion(emotionHistory[emotionHistory.length - 1].emotion);
    }
  }, [emotionHistory]);

  // Camera Logic
  useEffect(() => {
    const startCamera = async () => {
      if (sessionStarted && videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          videoRef.current.srcObject = stream;
        } catch (e) {
          console.error("Camera failed", e);
        }
      }
    };
    startCamera();
  }, [sessionStarted]);

  // Backend Check
  useEffect(() => {
    const checkBackend = async () => {
      setBackendStatus('checking');
      try {
        const isHealthy = await apiService.healthCheck();
        setBackendStatus(isHealthy ? 'online' : 'offline');
      } catch (e) {
        setBackendStatus('offline');
      }
    };
    checkBackend();
  }, []);

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
      alert('Failed to connect to AI Brain. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (!sessionStarted) return;
    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      window.speechSynthesis.cancel();

      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      await apiService.endSession();

      setSessionStarted(false);
      setMessages([]);
      setEmotionHistory([]);
      setMicState('idle');
      isProcessingRef.current = false;
    } catch (e) {
      console.error("Error ending session:", e);
    }
  };

  const detectedEmotionRef = useRef<Emotion>('calm');
  const recognitionRef = useRef<any>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (detectedEmotion) {
      const map: Record<string, Emotion> = { 'happy': 'hopeful', 'sad': 'sad', 'surprise': 'confused', 'neutral': 'calm' };
      detectedEmotionRef.current = map[detectedEmotion] || 'calm';
    }
  }, [detectedEmotion]);

  const handleUserMessage = async (text: string) => {
    try {
      if (!text.trim()) {
        setMicState('idle');
        isProcessingRef.current = false;
        return;
      }

      setMicState('thinking');
      const map: Record<string, Emotion> = { 'happy': 'hopeful', 'sad': 'sad', 'surprise': 'confused', 'neutral': 'calm' };

      const currentMapped = detectedEmotionRef.current || 'calm';

      const userMsg: TranscriptMessage = {
        id: Date.now().toString(), speaker: 'user', text, timestamp: new Date(), emotion: currentMapped
      };
      setMessages(prev => [...prev, userMsg]);
      setInputText('');

      const response = await apiService.sendMessage(text, currentMapped);

      if (!response.response || response.response.trim().length === 0) {
        throw new Error('Empty response from backend');
      }

      const aiMsg: TranscriptMessage = {
        id: (Date.now() + 1).toString(), speaker: 'therapist', text: response.response, timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);

      const backendEmotion = response.emotion || 'neutral';
      const uiEmotion = (emotionMap[backendEmotion] || map[backendEmotion] || 'calm') as Emotion;
      setEmotionHistory(prev => [...prev, {
        timestamp: new Date(), emotion: uiEmotion, intensity: emotionIntensityMap[backendEmotion] || 5
      }]);

      setMicState('speaking');
      speak(response.response, () => {
        setMicState('idle');
        isProcessingRef.current = false;
      });

      if (response.crisis_detected) {
        setShowSafetyModal(true);
      }

    } catch (e) {
      console.error("❌ AI Error", e);
      setMicState('idle');
      isProcessingRef.current = false;

      const errorMsg: TranscriptMessage = {
        id: Date.now().toString(), speaker: 'therapist', text: "I'm having trouble connecting right now. Let's try again.", timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleMicPress = useCallback(() => {
    if (!sessionStarted) { initializeSession(); return; }

    // Stop current recognition if running
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    // User pressed to stop
    if (micState === 'listening' || micState === 'thinking' || micState === 'speaking') {
      setMicState('idle');
      window.speechSynthesis.cancel();
      isProcessingRef.current = false;
      return;
    }

    // Prevent duplicate messages
    if (isProcessingRef.current) {
      console.warn("Already processing a message");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Use Chrome/Edge for voice."); return; }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    setMicState('listening');

    recognition.onstart = () => {
      console.log('🎙️ Listening...');
    };

    recognition.onresult = (event: any) => {
      try {
        if (isProcessingRef.current) {
          console.warn("Already processing, ignoring duplicate result");
          return;
        }

        const text = event.results[0]?.[0]?.transcript?.trim();
        if (text && text.length > 0) {
          isProcessingRef.current = true;
          handleUserMessage(text);
        } else {
          setMicState('idle');
        }
      } catch (e) {
        console.error("Error in onresult:", e);
        setMicState('idle');
        isProcessingRef.current = false;
      }
    };

    recognition.onerror = (e: any) => {
      console.error("🎙️ Speech Error", e.error);
      setMicState('idle');
      isProcessingRef.current = false;
    };

    recognition.onend = () => {
      console.log('🎙️ Recognition ended');
      if (!isProcessingRef.current) {
        setMicState('idle');
      }
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      setMicState('idle');
      isProcessingRef.current = false;
    }
  }, [sessionStarted, micState]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleUserMessage(inputText);
  };

  return (
    <div className="h-screen w-screen aurora-bg overflow-hidden flex flex-col font-manrope text-slate-800">
      {/* HEADER */}
      <div className="h-16 flex-none bg-white/70 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-lg flex items-center justify-center font-bold text-white font-sora shadow-md shadow-teal-200">
            F
          </div>
          <h1 className="font-sora font-bold text-xl tracking-tight text-slate-800">Feelio</h1>
          {backendStatus === 'offline' && (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full border border-red-200">
              OFFLINE
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
          {sessionStarted && (
            <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {sessionDuration}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* VIDEO AREA */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-6 pb-24">
          {!sessionStarted ? (
            <div className="text-center space-y-8 max-w-md animate-fade-in glass-panel p-10 rounded-3xl">
              <div className="w-28 h-28 mx-auto bg-slate-50 rounded-full flex items-center justify-center ring-4 ring-teal-100 shadow-inner">
                <VideoIcon className="w-12 h-12 text-teal-400" />
              </div>
              <div>
                <h2 className="text-3xl font-sora font-bold text-slate-800 mb-2">Hello there.</h2>
                <p className="text-slate-500 text-lg leading-relaxed">
                  I'm your AI companion. I can see you, hear you, and help you process your feelings.
                </p>
                {backendStatus === 'offline' && <p className="text-red-500 text-sm mt-4 font-bold">⚠️ Backend not connected. Please check server.</p>}
              </div>
              <button
                onClick={initializeSession}
                disabled={loading || backendStatus === 'offline'}
                className="w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all rounded-xl font-bold text-lg text-white shadow-lg shadow-teal-200"
              >
                {loading ? 'Connecting...' : 'Start Session'}
              </button>
            </div>
          ) : (
            <div className="relative w-full max-w-5xl aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-2xl shadow-slate-300 ring-1 ring-white/50">
              {/* VIDEO FEED */}
              <video
                ref={videoRef}
                autoPlay playsInline muted
                className="w-full h-full object-cover transform -scale-x-100 opacity-90"
              />

              {/* VISION STATUS */}
              {!visionLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                  <div className="bg-white/90 px-4 py-2 rounded-lg flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-500 animate-spin" />
                    <span className="text-sm font-semibold">Loading Vision...</span>
                  </div>
                </div>
              )}

              {/* OVERLAYS */}
              <div className="absolute top-6 left-6 flex gap-3">
                <div className={`px-4 py-2 backdrop-blur-md rounded-xl border flex items-center gap-2 shadow-lg transition-colors ${emotionColors[currentEmotion] || emotionColors.calm}`}>
                  <span className="text-xs uppercase tracking-wider font-bold opacity-70">Feeling</span>
                  <span className="text-base font-bold capitalize">{currentEmotion}</span>
                </div>
              </div>

              {/* AI SPEAKING */}
              {isSpeaking && (
                <div className="absolute top-6 right-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white flex items-center gap-2 animate-pulse-soft">
                  <div className="w-2 h-2 bg-teal-500 rounded-full" />
                  <span className="text-sm font-bold text-slate-800">Speaking...</span>
                </div>
              )}

              {/* GRAPH */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent flex items-end px-6 pb-0">
                <div className="w-full h-16 flex items-end gap-1 opacity-90">
                  {emotionHistory.slice(-40).map((pt, i) => (
                    <div key={i} title={pt.emotion} className="flex-1 bg-white/40 hover:bg-teal-300 transition-colors rounded-t-sm" style={{ height: `${pt.intensity * 10}%` }} />
                  ))}
                  {emotionHistory.length === 0 && <span className="text-white/50 text-xs w-full text-center pb-2">Your emotional journey will appear here...</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TRANSCRIPT SIDEBAR */}
        {sessionStarted && (
          <div className="w-96 bg-white/60 backdrop-blur-md border-l border-white/50 hidden xl:flex flex-col shadow-xl z-20">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-sora font-semibold text-slate-700">Conversation</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && <p className="text-center text-slate-400 text-sm mt-10 italic">Say "Hello" to start...</p>}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 text-sm shadow-sm rounded-2xl ${msg.speaker === 'user'
                    ? 'bg-teal-500 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                    }`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">{msg.speaker}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM CONTROL BAR */}
      {sessionStarted && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-30">
          <div className="glass-panel p-2 rounded-2xl flex items-center justify-between gap-4 shadow-2xl shadow-slate-300/50">

            {/* END BUTTON */}
            <button
              onClick={endSession}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              title="End Session"
            >
              <X className="w-5 h-5" />
            </button>

            {/* INPUT AREA */}
            <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a thought..."
                  className="w-full h-12 pl-4 pr-12 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-400 transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || micState !== 'idle'}
                  className="absolute right-2 top-2 h-8 w-8 bg-teal-500 rounded-lg flex items-center justify-center text-white hover:bg-teal-400 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* MIC BUTTON */}
            <button
              onClick={handleMicPress}
              className={`h-12 px-6 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg ${micState === 'listening' ? 'bg-red-500 text-white animate-pulse shadow-red-500/30' :
                micState === 'thinking' ? 'bg-amber-400 text-white shadow-amber-400/30' :
                  micState === 'speaking' ? 'bg-teal-500 text-white shadow-teal-500/30' :
                    'bg-slate-800 text-white hover:bg-slate-700 shadow-slate-800/30'
                }`}
            >
              {micState === 'listening' ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              <span>{micState === 'idle' ? 'Speak' : micState === 'listening' ? 'Listening' : micState === 'thinking' ? 'Thinking' : 'Speaking'}</span>
            </button>

          </div>
        </div>
      )}

      {/* SAFETY MODAL */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full shadow-2xl animate-fade-in text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Safety Check</h3>
            <p className="text-slate-500 mb-6">We detected some distress. Please remember I am an AI. If you are in crisis, please contact local emergency services.</p>
            <button onClick={() => setShowSafetyModal(false)} className="w-full py-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-white font-bold transition-colors">I Understand</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
