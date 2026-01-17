from text_emotion import analyze_text

tests = [
    "I am extremely stressed and anxious.",
    "I feel very happy today!",
    "I feel lonely and sad.",
    "This makes me angry."
]

for t in tests:
    print(t, "=>", analyze_text(t))
