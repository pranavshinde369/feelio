"""
Utility modules for Feelio therapist system.
Contains core therapeutic logic, NLP utilities, and session management.
"""

import logging
import time
from collections import deque
from typing import Tuple, Optional, List, Dict, Any
from enum import Enum

logger = logging.getLogger(__name__)


class TherapyMode(Enum):
    """Therapy interaction modes."""
    VALIDATE_AND_SOLVE = "validate_and_solve"
    REFLECT = "reflect"
    GROUNDING = "grounding"
    REFRAME = "reframe"


# ========== EMOTION MANAGEMENT ==========

DISTRESS_EMOTIONS = {"sad", "fear", "angry", "disgust", "surprise"}
SAFETY_KEYWORDS = [
    "suicide",
    "kill myself",
    "end my life",
    "hurt myself",
    "self harm",
    "self-harm",
    "cut myself",
    "want to die",
    "no reason to live",
    "give up",
]

PLAYBOOKS = {
    "sad": "Run a 5-minute activation: stand, stretch, and text one friend a kind line.",
    "fear": "Try 5-4-3-2-1 grounding with one slow exhale per step.",
    "angry": "Cool-down reset: cold water on wrists + step outside for 2 minutes before replying to anyone.",
    "disgust": "Name-then-reframe: label the trigger, then list one boundary you can set today.",
    "surprise": "Stabilize with box breathing: 4 in, 4 hold, 4 out, 4 hold for two cycles.",
    "neutral": "Micro check-in: what mattered most today? Pick one tiny action that honors it in 5 minutes.",
    "default": "Pick one concrete action in 5 minutes (move, text, or jot a thought). Keep it small and doable.",
}


def update_emotion_history(
    emotion: str, emotion_history: deque
) -> None:
    """
    Store a timestamped emotion in the rolling history buffer.

    Args:
        emotion: The current emotion label.
        emotion_history: A deque to store (timestamp, emotion) tuples.
    """
    emotion_history.append((time.time(), emotion))
    logger.debug(f"Emotion logged: {emotion}")


def summarize_trajectory(emotion_history: deque) -> str:
    """
    Describe how emotion has shifted recently.

    Args:
        emotion_history: Deque of (timestamp, emotion) tuples.

    Returns:
        str: A human-readable description of the emotional trajectory.
    """
    if len(emotion_history) < 4:
        return "steady so far"

    recent = [e for _, e in list(emotion_history)[-20:]]
    start, end = recent[0], recent[-1]

    if start != end:
        return f"from {start} toward {end}"

    dominant = max(set(recent), key=recent.count)
    return f"mostly {dominant}"


def detect_contradiction(user_text: str, current_emotion: str) -> str:
    """
    Flag when words say 'fine' but facial emotion shows distress.

    Args:
        user_text: The user's spoken input.
        current_emotion: The detected facial emotion.

    Returns:
        str: A flag message if contradiction detected, else "none noted".
    """
    text = user_text.lower()
    says_fine = any(token in text for token in ["fine", "okay", "good"])
    looks_distressed = current_emotion in DISTRESS_EMOTIONS

    if says_fine and looks_distressed:
        return f"User says fine but looks {current_emotion}. Invite gentle check-in."

    return "none noted"


def detect_high_risk(user_text: str) -> bool:
    """
    Simple keyword-based safety net for self-harm detection.

    Args:
        user_text: The user's spoken input.

    Returns:
        bool: True if high-risk keywords detected, False otherwise.
    """
    lowered = user_text.lower()
    detected = any(phrase in lowered for phrase in SAFETY_KEYWORDS)

    if detected:
        logger.warning(f"⚠️ High-risk content detected in user input")

    return detected


def select_playbook(emotion: str, user_text: str) -> str:
    """
    Choose a targeted therapeutic playbook based on emotion and intent.

    Args:
        emotion: The current emotion label.
        user_text: The user's input text.

    Returns:
        str: A coping strategy or mini-protocol.
    """
    text = user_text.lower()

    # Intent-based routing
    if "panic" in text or "anxious" in text:
        return "Panic kit: 3 paced breaths (inhale 4, exhale 6) plus name 3 things you see."
    if "sleep" in text or "insomnia" in text:
        return "Sleep wind-down: lights dim, slow exhale 6s for 1 minute, then write one worry and shelve it till morning."
    if "overwhelm" in text or "burnout" in text:
        return "Overwhelm triage: list top 3 tasks, pick one 10-minute starter and ignore the rest for 30 minutes."

    # Emotion-based routing
    if emotion in PLAYBOOKS:
        return PLAYBOOKS[emotion]

    return PLAYBOOKS["default"]


# ========== SESSION LOGGING ==========

class SessionEntry:
    """Represents a single turn in a therapy session."""

    def __init__(
        self,
        user_text: str,
        ai_text: str,
        emotion: str,
        timestamp: Optional[float] = None,
    ):
        self.user_text = user_text
        self.ai_text = ai_text
        self.emotion = emotion
        self.timestamp = timestamp or time.time()

    def to_dict(self) -> Dict[str, Any]:
        """Convert entry to dictionary."""
        return {
            "timestamp": self.timestamp,
            "user": self.user_text,
            "ai": self.ai_text,
            "emotion": self.emotion,
        }


class SessionLog:
    """Manages session logging and summary generation."""

    def __init__(self, max_entries: int = 100):
        """
        Initialize session logger.

        Args:
            max_entries: Maximum number of entries to keep in memory.
        """
        self.entries: List[SessionEntry] = []
        self.max_entries = max_entries

    def add_turn(self, user_text: str, ai_text: str, emotion: str) -> None:
        """
        Log a conversation turn.

        Args:
            user_text: User's input.
            ai_text: AI's response.
            emotion: Detected emotion at time of turn.
        """
        entry = SessionEntry(user_text, ai_text, emotion)
        self.entries.append(entry)

        if len(self.entries) > self.max_entries:
            self.entries.pop(0)

        logger.debug(f"Session turn logged (total: {len(self.entries)})")

    def get_emotion_timeline(self, recent_count: int = 20) -> List[str]:
        """
        Get recent emotions for summary.

        Args:
            recent_count: Number of recent turns to include.

        Returns:
            List of emotion labels.
        """
        recent = self.entries[-recent_count:]
        return [e.emotion for e in recent]

    def get_recent_turns(self, count: int = 6) -> List[Dict[str, Any]]:
        """
        Get recent conversation turns.

        Args:
            count: Number of recent turns to retrieve.

        Returns:
            List of turn dictionaries.
        """
        recent = self.entries[-count:]
        return [t.to_dict() for t in recent]

    def __len__(self) -> int:
        """Return number of logged turns."""
        return len(self.entries)

    def __bool__(self) -> bool:
        """Return True if session has entries."""
        return len(self.entries) > 0


# ========== PROMPT BUILDERS ==========

def build_fusion_prompt(
    user_text: str,
    emotion: str,
    trajectory: str,
    contradiction: str,
    playbook: str,
    pace_hint: str,
) -> str:
    """
    Build the final fusion prompt for Gemini.

    Args:
        user_text: User's spoken input.
        emotion: Current detected emotion.
        trajectory: Emotion trajectory summary.
        contradiction: Contradiction flag.
        playbook: Selected therapeutic playbook.
        pace_hint: Pacing hint (normal/slower).

    Returns:
        str: The complete fusion prompt.
    """
    prompt = (
        "CONTEXT: Short, solution-focused spoken therapy. "
        f"USER SAID: '{user_text}'. "
        f"EMOTIONAL STATE: '{emotion}'. "
        f"EMOTION TRAJECTORY: {trajectory}. "
        f"CONTRADICTION FLAG: {contradiction}. "
        f"SUGGESTED PLAYBOOK: {playbook}. "
        f"PACE HINT: {pace_hint}. "
        "INSTRUCTION: "
        "1) Validate based on words + emotion, "
        "2) offer ONE specific tool right now, "
        "3) keep under 3 sentences, "
        "4) if contradiction, invite gentle clarification, "
        "5) match the pace hint (slightly slower if requested)."
    )
    return prompt


def build_summary_prompt(
    emotion_timeline: List[str],
    recent_turns: List[Dict[str, Any]],
) -> str:
    """
    Build prompt for session summary generation.

    Args:
        emotion_timeline: List of recent emotions.
        recent_turns: List of recent conversation turns.

    Returns:
        str: The summary prompt for Gemini.
    """
    prompt = (
        "You are an AI therapist preparing a concise session handoff. "
        "Summarize the session in 3 bullet points: "
        "(1) observed emotions trend, (2) key concerns, (3) agreed small actions. "
        "Keep it under 80 words. "
        f"Recent emotions: {emotion_timeline}. "
        f"Transcript snippets: {recent_turns}"
    )
    return prompt


def build_crisis_response() -> str:
    """
    Build the crisis safety net response.

    Returns:
        str: Crisis-forward message.
    """
    return (
        "I hear you mentioning harm. Your safety matters. "
        "If you are in danger, contact a local emergency number or a trusted person right now. "
        "I can listen and help you plan one safe step."
    )


# ========== TEXT PROCESSING ==========

def extract_word_count(text: str) -> int:
    """
    Extract word count from text (for pacing detection).

    Args:
        text: Input text.

    Returns:
        int: Number of words.
    """
    import re
    return len(re.findall(r"\w+", text))


def determine_pace_hint(word_count: int, threshold: int = 18) -> str:
    """
    Determine pacing hint based on word count.

    Args:
        word_count: Number of words in user input.
        threshold: Threshold above which to slow down.

    Returns:
        str: "slower" or "normal".
    """
    return "slower" if word_count > threshold else "normal"


def get_pre_pause_duration(pace_hint: str) -> float:
    """
    Get pre-speech pause duration based on pace.

    Args:
        pace_hint: Pacing hint ("slower" or "normal").

    Returns:
        float: Pause duration in seconds.
    """
    return 0.8 if pace_hint == "slower" else 0.2
