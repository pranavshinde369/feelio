import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export type DetectedEmotion = 'happy' | 'sad' | 'surprise' | 'neutral';

export function useVision(videoRef: React.RefObject<HTMLVideoElement>, isEnabled: boolean) {
  const [emotion, setEmotion] = useState<DetectedEmotion>('neutral');
  const [isLoaded, setIsLoaded] = useState(false);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    const loadModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: 'GPU'
          },
          outputFaceBlendshapes: true,
          runningMode: 'VIDEO',
          numFaces: 1
        });
        
        setIsLoaded(true);
        console.log('✅ Vision Model Loaded');
      } catch (err) {
        console.error('Failed to load vision model:', err);
      }
    };

    if (isEnabled && !faceLandmarkerRef.current) {
      loadModel();
    }
  }, [isEnabled]);

  const processVideo = useCallback(() => {
    if (!videoRef.current || !faceLandmarkerRef.current || !isLoaded) return;

    const video = videoRef.current;
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      const startTimeMs = performance.now();
      const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const landmarks = results.faceLandmarks[0];
        
        // Logic ported from Python:
        // 13: UpperLip, 14: LowerLip, 61: LeftCorner, 291: RightCorner
        const upperLip = landmarks[13].y;
        const lowerLip = landmarks[14].y;
        const leftCorner = landmarks[61].y;
        const rightCorner = landmarks[291].y;

        const mouthOpenDist = lowerLip - upperLip;
        const lipCenterY = (upperLip + lowerLip) / 2;
        const cornerAvgY = (leftCorner + rightCorner) / 2;
        const smileRatio = lipCenterY - cornerAvgY;

        let detected: DetectedEmotion = 'neutral';
        
        // Thresholds from vision_module.py
        if (smileRatio > 0.02) {
            detected = 'happy';
        } else if (mouthOpenDist > 0.05) {
            detected = 'surprise';
        } else if (smileRatio < -0.015) {
            detected = 'sad';
        } else {
            detected = 'neutral';
        }

        setEmotion(detected);
      }
    }
    
    if (isEnabled) {
        requestRef.current = requestAnimationFrame(processVideo);
    }
  }, [isLoaded, isEnabled, videoRef]);

  useEffect(() => {
    if (isEnabled && isLoaded) {
      requestRef.current = requestAnimationFrame(processVideo);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isEnabled, isLoaded, processVideo]);

  return { emotion, isLoaded };
}
