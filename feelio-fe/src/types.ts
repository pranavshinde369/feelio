export type Emotion =
  | 'calm'
  | 'anxious'
  | 'hopeful'
  | 'sad'
  | 'frustrated'
  | 'confused'
  | 'relieved'
  | 'overwhelmed';

export interface TranscriptMessage {
  id: string;
  speaker: 'user' | 'therapist';
  text: string;
  timestamp: Date;
  emotion?: Emotion;
}

export interface EmotionPoint {
  timestamp: Date;
  emotion: Emotion;
  intensity: number;
}

export interface PlaybookAction {
  id: string;
  title: string;
  description: string;
  category: 'grounding' | 'reframing' | 'planning';
}

export type MicState = 'idle' | 'listening' | 'thinking';

export type IntentType = 'ground' | 'reframe' | 'plan';
