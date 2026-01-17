import { create } from 'zustand';

interface AppState {
  // Signals (Inputs)
  faceSadness: number;
  faceStress: number;
  faceJoy: number;
  
  // App State (Outputs)
  currentEmotion: string;
  uiColor: string;
  
  // Actions
  setFaceData: (sad: number, stress: number, joy: number) => void;
  setAppState: (emotion: string, color: string) => void;
}

export const useStore = create<AppState>((set) => ({
  faceSadness: 0,
  faceStress: 0,
  faceJoy: 0,
  currentEmotion: "calm",
  uiColor: "#E0F2F1", // Default Calm Teal

  setFaceData: (sad, stress, joy) => set({ 
    faceSadness: sad, 
    faceStress: stress, 
    faceJoy: joy 
  }),
  
  setAppState: (emotion, color) => set({ 
    currentEmotion: emotion, 
    uiColor: color 
  }),
}));