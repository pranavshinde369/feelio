import librosa
import numpy as np

def analyze_audio(audio_path: str):
    """
    Improved stress detection using energy + pitch variation
    """

    # Load audio
    y, sr = librosa.load(audio_path)

    # 1. MFCC Features
    mfcc = librosa.feature.mfcc(y=y, sr=sr)
    mfcc_mean = np.mean(mfcc)

    # 2. Energy (Loudness)
    energy = np.mean(librosa.feature.rms(y=y))

    # 3. Pitch (Fundamental frequency)
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    pitch = np.mean(pitches[pitches > 0])

    # 4. Stress Score (combined)
    stress_score = (mfcc_mean * 0.4) + (energy * 100 * 0.4) + (pitch * 0.2)

    # 5. Decision Boundary
    if stress_score > 50:
        return "Stressed"
    else:
        return "Calm"
