class EmotionFusionEngine:
    """
    Combines Multimodal signals (Face, Voice, Text) into a single state.
    """
    
    @staticmethod
    def derive_state(data) -> str:
        # Initial score vector
        scores = {
            "calm": 0.5,
            "stressed": 0.0,
            "anxious": 0.0,
            "joyful": 0.0,
            "melancholic": 0.0
        }

        # 1. Vision Weights (High Confidence)
        if data.face_stress > 0.5:
            scores["stressed"] += (data.face_stress * 0.8)
        
        if data.face_sadness > 0.5:
            scores["melancholic"] += (data.face_sadness * 0.9)

        if data.face_joy > 0.6:
            scores["joyful"] += 1.0

        # 2. Audio Weights (Voice Jitter = Anxiety)
        if data.voice_jitter > 0.7:
            scores["anxious"] += 0.7
            scores["calm"] -= 0.5

        # 3. Text Context (Simple Heuristic bump)
        # Note: Deep text analysis happens in the LLM, this is just for state tagging
        if data.user_text:
            text = data.user_text.lower()
            if any(w in text for w in ["help", "cant", "hard", "tired"]):
                scores["stressed"] += 0.5

        # Return the key with maximum value
        dominant_emotion = max(scores, key=scores.get)
        return dominant_emotion