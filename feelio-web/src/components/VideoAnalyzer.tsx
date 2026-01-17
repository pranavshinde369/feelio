"use client";
import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useStore } from "../store/useStore";

export default function VideoAnalyzer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setFaceData } = useStore();
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  useEffect(() => {
    let faceLandmarker: FaceLandmarker;
    let animationFrameId: number;

    const setupModel = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU",
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
      });

      setIsModelLoaded(true);
      startWebcam();
    };

    const startWebcam = () => {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
        }
      });
    };

    const predictWebcam = () => {
      if (videoRef.current && faceLandmarker) {
        let startTimeMs = performance.now();
        const result = faceLandmarker.detectForVideo(videoRef.current, startTimeMs);

        if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
          const shapes = result.faceBlendshapes[0].categories;
          const browDown = shapes.find(s => s.categoryName === 'browDownLeft')?.score || 0;
          const mouthFrown = shapes.find(s => s.categoryName === 'mouthFrownLeft')?.score || 0;
          const smile = shapes.find(s => s.categoryName === 'mouthSmileLeft')?.score || 0;

          setFaceData(mouthFrown, browDown, smile);
        }
      }
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    setupModel();
    return () => { cancelAnimationFrame(animationFrameId); if(faceLandmarker) faceLandmarker.close(); };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <video ref={videoRef} autoPlay playsInline muted 
        className={`w-32 h-24 rounded-lg object-cover border-2 border-white/20 shadow-lg transition-opacity ${isModelLoaded ? 'opacity-50 hover:opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}