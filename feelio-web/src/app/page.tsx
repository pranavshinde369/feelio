"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import VideoAnalyzer from "../components/VideoAnalyzer";
import { useStore } from "../store/useStore";
import "./page.css";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const { faceSadness, faceStress, faceJoy, uiColor, setAppState } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (uiColor) {
      document.documentElement.style.setProperty('--app-bg', uiColor);
    }
  }, [uiColor]);
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user' as const, text: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Connect to your Python Backend
      const res = await fetch("http://localhost:8000/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_text: input,
          face_sadness: faceSadness,
          face_stress: faceStress,
          face_joy: faceJoy,
          voice_jitter: 0.0
        }),
      });
      
      const data = await res.json();
      setMessages([...newMessages, { role: 'ai', text: data.reply_text }]);
      setAppState(data.detected_emotion, data.ui_adaptation.theme_color);
      
    } catch (e) { 
      console.error(e);
      setMessages([...newMessages, { role: 'ai', text: "I can't reach the server. Is the backend running?" }]);
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <main className="app-main min-h-screen flex flex-col items-center justify-center p-4">
      <VideoAnalyzer />
      
      <div className="w-full max-w-md bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden h-[80vh] flex flex-col border border-white/50">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-700 flex gap-2"><Sparkles className="text-teal-600"/> feelio</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl max-w-[85%] text-sm ${m.role === 'user' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>{m.text}</div>
              </motion.div>
            ))}
             {isLoading && <div className="text-xs text-slate-400 animate-pulse ml-4">Thinking...</div>}
          </AnimatePresence>
        </div>

        <div className="p-4 bg-white/40">
          <div className="flex gap-2 bg-white p-2 rounded-full shadow-sm">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="How do you feel?" className="flex-1 bg-transparent outline-none px-4 text-slate-700" />
            <button type="button" onClick={sendMessage} aria-label="Send message" title="Send message" className="p-3 bg-slate-800 text-white rounded-full">
              <Send className="w-4 h-4"/>
              <span className="sr-only">Send message</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}