import cv2
import mediapipe as mp
import numpy as np

def test_vision_mediapipe():
    print("--- 👁️ VISION TEST (Google MediaPipe) ---")
    print("Loading Face Mesh...")

    # Initialize MediaPipe Face Mesh
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    cap = cv2.VideoCapture(1)
    if not cap.isOpened(): cap = cv2.VideoCapture(1)
    
    print("📷 Camera Active. Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret: break
        
        # MediaPipe needs RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)
        
        frame_h, frame_w, _ = frame.shape
        current_emotion = "neutral"
        color = (255, 255, 0) # Default Blue

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                # --- GEOMETRY LOGIC ---
                # We access specific points on the face map
                
                # Get coordinates
                landmarks = face_landmarks.landmark
                
                # 1. Mouth Analysis (Points: 13=UpperLip, 14=LowerLip, 61=LeftCorner, 291=RightCorner)
                upper_lip = landmarks[13].y
                lower_lip = landmarks[14].y
                left_corner = landmarks[61].y
                right_corner = landmarks[291].y
                
                # Mouth Aspect Ratio (Open vs Closed)
                mouth_open_dist = lower_lip - upper_lip
                
                # Smile Curve (Corners vs Center)
                # If corners are significantly higher than the center of the lip
                # (Note: In image coordinates, smaller y means higher up)
                lip_center_y = (upper_lip + lower_lip) / 2
                corner_avg_y = (left_corner + right_corner) / 2
                smile_ratio = lip_center_y - corner_avg_y
                
                # 2. Eyebrow Analysis (Points: 107=LeftBrow, 336=RightBrow)
                # We measure how high they are relative to the eye
                
                # --- EMOTION CLASSIFICATION ---
                # You can tune these threshold numbers!
                
                if smile_ratio > 0.02: 
                    current_emotion = "happy"
                    color = (0, 255, 0)
                
                elif mouth_open_dist > 0.05:
                    current_emotion = "surprise"
                    color = (255, 165, 0) # Orange
                    
                elif smile_ratio < -0.015:
                    current_emotion = "sad"
                    color = (0, 0, 255) # Red
                    
                else:
                    current_emotion = "neutral"
                    color = (255, 255, 0)

                # Draw the Mesh (Optional - looks cool)
                mp.solutions.drawing_utils.draw_landmarks(
                    image=frame,
                    landmark_list=face_landmarks,
                    connections=mp_face_mesh.FACEMESH_TESSELATION,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=mp.solutions.drawing_styles.get_default_face_mesh_tesselation_style()
                )

                # Display Text
                cv2.putText(frame, f"Mood: {current_emotion.upper()}", (20, 50), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1.5, color, 3)
                           
                # Debug Numbers (Helps you tune sensitivity)
                cv2.putText(frame, f"Smile Score: {smile_ratio:.4f}", (20, 90), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

        cv2.imshow('MediaPipe Geometry Test', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    test_vision_mediapipe()