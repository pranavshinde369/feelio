import cv2
from deepface import DeepFace
import time

print("📷 Initializing Camera... (This might take a moment)")

# Open the webcam (0 is usually the default camera)
cap = cv2.VideoCapture(1)

if not cap.isOpened():
    print("❌ Error: Could not open webcam.")
    exit()

print("✅ Camera active. Press 'q' to quit.")

while True:
    # 1. Capture frame-by-frame
    ret, frame = cap.read()
    if not ret:
        print("❌ Failed to grab frame")
        break

    try:
        # 2. Analyze the frame for emotion
        # enforce_detection=False prevents crash if no face is found
        analysis = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
        
        # DeepFace returns a list of results, we take the first face found
        emotion = analysis[0]['dominant_emotion']
        confidence = analysis[0]['face_confidence']
        
        # 3. Draw text on the video
        text = f"Emotion: {emotion}"
        
        # Add a colored rectangle and text
        cv2.rectangle(frame, (0,0), (300, 50), (0,0,0), -1) # Black background box
        cv2.putText(frame, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
    except Exception as e:
        # If something goes wrong (or no face seen), just skip this frame
        pass

    # 4. Display the resulting frame
    cv2.imshow('Emotion Detector (Press q to quit)', frame)

    # Quit if 'q' is pressed
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Clean up
cap.release()
cv2.destroyAllWindows()