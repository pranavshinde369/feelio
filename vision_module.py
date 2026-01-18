import cv2
import mediapipe as mp
import threading
import time

class VisionSystem:
    def __init__(self):
        self.current_emotion = "neutral"
        self.is_running = False
        self.thread = None
        
        # Initialize MediaPipe (The "Math" Brain)
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def start(self):
        """Starts the vision loop in a background thread."""
        if self.is_running: return
        
        self.is_running = True
        self.thread = threading.Thread(target=self._update_loop, daemon=True)
        self.thread.start()
        print("✅ Vision Module Started (MediaPipe)")

    def stop(self):
        """Stops the vision loop safely."""
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=2.0)
        print("🛑 Vision Module Stopped")

    def get_emotion(self):
        """Returns the latest detected emotion."""
        return self.current_emotion

    def _update_loop(self):
        """Internal loop that reads camera and calculates emotion."""
        cap = cv2.VideoCapture(1)
        if not cap.isOpened(): cap = cv2.VideoCapture(0)

        while self.is_running and cap.isOpened():
            ret, frame = cap.read()
            if not ret: continue

            # Convert to RGB for MediaPipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb_frame)
            
            detected_emotion = "neutral"
            color = (255, 255, 0)

            if results.multi_face_landmarks:
                for face_landmarks in results.multi_face_landmarks:
                    # --- GEOMETRY LOGIC (The "Math") ---
                    landmarks = face_landmarks.landmark
                    
                    # Points: 13=UpperLip, 14=LowerLip, 61=LeftCorner, 291=RightCorner
                    upper_lip = landmarks[13].y
                    lower_lip = landmarks[14].y
                    left_corner = landmarks[61].y
                    right_corner = landmarks[291].y
                    
                    # Ratios
                    mouth_open_dist = lower_lip - upper_lip
                    lip_center_y = (upper_lip + lower_lip) / 2
                    corner_avg_y = (left_corner + right_corner) / 2
                    smile_ratio = lip_center_y - corner_avg_y
                    
                    # Classification (Tuned for stability)
                    if smile_ratio > 0.02: 
                        detected_emotion = "happy"
                        color = (0, 255, 0)
                    elif mouth_open_dist > 0.05:
                        detected_emotion = "surprise"
                        color = (255, 165, 0)
                    elif smile_ratio < -0.015:
                        detected_emotion = "sad"
                        color = (0, 0, 255)
                    else:
                        detected_emotion = "neutral"
                        color = (255, 255, 0)

                    # Update shared variable
                    self.current_emotion = detected_emotion

                    # Visual Feedback
                    cv2.putText(frame, f"Mood: {self.current_emotion.upper()}", (20, 50), 
                               cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
                    
                    # Debug Score
                    cv2.putText(frame, f"Score: {smile_ratio:.4f}", (20, 80), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200,200,200), 1)

            cv2.imshow('Therapist Eyes (MediaPipe)', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                self.is_running = False
                break

        cap.release()
        cv2.destroyAllWindows()