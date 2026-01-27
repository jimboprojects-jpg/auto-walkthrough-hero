import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let isLoaded = false;

export const loadFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpeg && isLoaded) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();

  // Load FFmpeg with CORS-enabled URLs
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  isLoaded = true;
  return ffmpeg;
};

export interface ConversionProgress {
  progress: number;
  time?: number;
}

export const convertWebMToMP4 = async (
  webmBlob: Blob,
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> => {
  const ffmpegInstance = await loadFFmpeg();

  // Set up progress handler
  if (onProgress) {
    ffmpegInstance.on("progress", ({ progress, time }) => {
      onProgress({ progress: Math.round(progress * 100), time });
    });
  }

  // Write the input file
  const inputFileName = "input.webm";
  const outputFileName = "output.mp4";

  await ffmpegInstance.writeFile(inputFileName, await fetchFile(webmBlob));

  // Convert to MP4 with H.264 codec
  await ffmpegInstance.exec([
    "-i",
    inputFileName,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    outputFileName,
  ]);

  // Read the output file
  const data = await ffmpegInstance.readFile(outputFileName);

  // Clean up
  await ffmpegInstance.deleteFile(inputFileName);
  await ffmpegInstance.deleteFile(outputFileName);

  // Create blob from the output - handle both Uint8Array and string
  const blobData = data instanceof Uint8Array ? new Uint8Array(data) : data;
  return new Blob([blobData], { type: "video/mp4" });
};

export const isFFmpegSupported = (): boolean => {
  // Check if SharedArrayBuffer is available (required for FFmpeg.wasm)
  return typeof SharedArrayBuffer !== "undefined";
};

// Get the best available video format for download
export const getBestVideoFormat = (): { extension: string; mimeType: string; canConvertToMP4: boolean } => {
  const canConvertToMP4 = isFFmpegSupported();
  
  if (canConvertToMP4) {
    return { extension: "mp4", mimeType: "video/mp4", canConvertToMP4: true };
  }
  
  // Fallback to WebM which is widely supported
  return { extension: "webm", mimeType: "video/webm", canConvertToMP4: false };
};
