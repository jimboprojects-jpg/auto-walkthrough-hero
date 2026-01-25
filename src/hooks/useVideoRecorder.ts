import { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";

interface UseVideoRecorderOptions {
  frameRate?: number;
  videoBitsPerSecond?: number;
}

interface UseVideoRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  startRecording: (element: HTMLElement) => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  recordingProgress: number;
}

export const useVideoRecorder = (
  options: UseVideoRecorderOptions = {}
): UseVideoRecorderReturn => {
  const { frameRate = 30, videoBitsPerSecond = 5000000 } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const startTimeRef = useRef<number>(0);

  const captureFrame = useCallback(async () => {
    if (!elementRef.current || !canvasRef.current || isPaused) return;

    try {
      const canvas = await html2canvas(elementRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(canvas, 0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      // Update progress
      const elapsed = Date.now() - startTimeRef.current;
      setRecordingProgress(elapsed);
    } catch (error) {
      console.error("Error capturing frame:", error);
    }
  }, [isPaused]);

  const recordingLoop = useCallback(() => {
    if (!isRecording || isPaused) return;

    captureFrame();
    animationFrameRef.current = requestAnimationFrame(() => {
      setTimeout(recordingLoop, 1000 / frameRate);
    });
  }, [isRecording, isPaused, captureFrame, frameRate]);

  const startRecording = useCallback(
    async (element: HTMLElement) => {
      try {
        elementRef.current = element;
        chunksRef.current = [];

        // Get element dimensions
        const rect = element.getBoundingClientRect();
        const width = Math.ceil(rect.width * 2);
        const height = Math.ceil(rect.height * 2);

        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvasRef.current = canvas;

        // Get stream from canvas
        const stream = canvas.captureStream(frameRate);

        // Create MediaRecorder
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp9",
          videoBitsPerSecond,
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(100); // Collect data every 100ms

        setIsRecording(true);
        setIsPaused(false);
        startTimeRef.current = Date.now();

        // Start capturing frames
        recordingLoop();
      } catch (error) {
        console.error("Error starting recording:", error);
        throw error;
      }
    },
    [frameRate, videoBitsPerSecond, recordingLoop]
  );

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      recordingLoop();
    }
  }, [recordingLoop]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setIsRecording(false);
        setIsPaused(false);
        setRecordingProgress(0);
        resolve(blob);
      };

      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      } else {
        setIsRecording(false);
        resolve(null);
      }
    });
  }, []);

  return {
    isRecording,
    isPaused,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    recordingProgress,
  };
};
