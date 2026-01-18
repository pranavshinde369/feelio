import { useState, useCallback, useEffect } from 'react';

export function useTTS() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const loadVoices = () => {
            const v = window.speechSynthesis.getVoices();
            setVoices(v);
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    const speak = useCallback((text: string, onEnd?: () => void) => {
        if (!text) return;

        // Cancel currently speaking
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Select a calm voice if possible (e.g., Google US English Female or similar)
        // Priority: 'Google US English', then any female voice, then default
        const preferredVoice = voices.find(v => v.name.includes('Google US English')) ||
            voices.find(v => v.name.includes('Female')) ||
            voices[0];

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        // Adjust rate/pitch for therapist persona
        utterance.rate = 0.9; // Slightly slower
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            if (onEnd) onEnd();
        };
        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    }, [voices]);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    return { speak, stop, isSpeaking };
}
