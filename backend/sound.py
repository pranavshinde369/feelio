import sounddevice as sd
from scipy.io.wavfile import write

fs = 16000
print("Speak now...")
audio = sd.rec(int(5 * fs), samplerate=fs, channels=1)
sd.wait()
write("sample.wav", fs, audio)
