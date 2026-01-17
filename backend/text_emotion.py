# Import tokenizer and model loader from HuggingFace Transformers
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Import PyTorch and utility for probability calculation
import torch
import torch.nn.functional as F

# Pretrained emotion classification model (PyTorch-based Transformer)
MODEL_NAME = "j-hartmann/emotion-english-distilroberta-base"

# Load tokenizer (converts text → tokens → numbers)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

# Load trained neural network for emotion classification
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

# Set model to evaluation mode (no training, faster & stable inference)
model.eval()

# Emotion labels corresponding to model output indices
labels = ["anger", "disgust", "fear", "joy", "neutral", "sadness", "surprise"]

def analyze_text(text: str):
    """
    Takes user text and returns detected emotion.
    """

    # Step 1: Convert input sentence into model-readable tensors
    # (token IDs + attention mask)
    inputs = tokenizer(text, return_tensors="pt", truncation=True)

    # Step 2: Disable gradient calculation for faster inference
    with torch.no_grad():
        # Forward pass through Transformer network
        outputs = model(**inputs)

        # Convert raw scores (logits) into probabilities
        probs = F.softmax(outputs.logits, dim=1)

    # Step 3: Select emotion with highest probability
    idx = torch.argmax(probs).item()

    # Step 4: Return human-readable emotion label
    return labels[idx]
